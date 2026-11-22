/* Poke'Catch 防掉线助手 —— 统一悬浮看板（第二十五批）
 *
 * 全部自动化任务 / 日常监测功能共用同一套看板外观：
 * 跟游戏里的「伤害统计面板」是同一张卡——深色渐变底 + 金色数字 +
 * 顶栏折叠 / 拖动，配色走 theme.js 的 --pcg-* 变量。
 *
 * 第三十四批：最后一处例外（道具 / 树果自己画的那套）也并进来了，
 * 并把「地下通道」补上，所以现在这一张卡覆盖六个功能：
 *   图鉴捕捉 dex / 传说追踪 leg / 稀有道具刷取 item / 树果刷取 berry /
 *   联盟刷钱 farm / 黑市扫货 market / 地下通道 ug
 *
 * 约定：
 *   1. 功能启动时才出现，停止就自动收起来（调用方 stop 里 hide()）。
 *   2. 顶栏可以拖动，位置与折叠状态按 key 记在 chrome.storage.local（pcgHudUi）。
 *   3. 没拖动过的面板按开启顺序从右下角往上叠，不会互相盖住。
 *   4. 只读状态、只画 DOM；不碰游戏存档、不抢页面。
 *   5. 【第四十三批】默认侧可以选：panel(key, title, { side:'left' }) 就停左下角。
 *      左右两侧各自排队让位；换侧时旧的拖动坐标自动作废一次，
 *      免得面板还挂在以前那一侧。图鉴 / 路闪看板走的是左侧。
 *   6. 【第五十一批】顶栏右边多一个 ×：点它就关掉这块看板；传了 opts.onClose 的
 *      功能会顺手把任务停掉（八个自动化任务都传了，免得任务还在跑却看不见进度）。
 *      点过 × 的卡片在本次运行里不再自动冒出来，等任务停一次、下次重开才照常显示。
 *
 * 用法：
 *   var hud = window.PCG_HUD.panel('dex', '图鉴捕捉', { side: 'left', onClose: stop });
 *   hud.set({ star: '●', cells: [['已捕获', 3, 'gold'], ['清单', 12]],
 *             rows: [{ nm: '皮卡丘', val: '62%' }], foot: '正在捕捉 · 第 5 章' });
 *   hud.show();
 *   hud.hide();
 */
(function (root) {
  'use strict';

  if (!root || root.PCG_HUD) return;

  var UI_KEY = 'pcgHudUi';
  var panels = {};
  var optsMap = {};      // { market: { onRow: fn } } —— 第三十批：行可点
  var ui = {};           // { dex: { x, y, fold }, ... }
  var uiLoaded = false;
  var uiWaiting = [];    // 存储还没读回来时先挂着的面板

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 配色与排版跟伤害统计面板（content.js dmgCss）刻意保持一致 */
  function css() {
    return [
      '.pnl{width:264px;max-width:calc(100vw - 20px);box-sizing:border-box;',
      'background:linear-gradient(180deg,var(--pcg-pnl-bg1,#191c26),var(--pcg-pnl-bg2,#12141c) 62%);',
      'border:1px solid var(--pcg-pnl-border,#303748);border-radius:12px;',
      'box-shadow:0 12px 30px var(--pcg-pnl-shadow,rgba(0,0,0,.55));',
      'color:var(--pcg-pnl-text,#e8ecf4);font:12px/1.35 "Microsoft YaHei","PingFang SC",system-ui,sans-serif;',
      'overflow:hidden;user-select:none}',
      '.hd{display:flex;align-items:center;gap:6px;padding:7px 8px 6px;',
      'background:var(--pcg-hd-bg,rgba(255,255,255,.03));border-bottom:1px solid var(--pcg-hd-line,#262c3a);',
      'cursor:move}',
      '.hd b{flex:1 1 auto;min-width:0;font-size:11.5px;letter-spacing:.5px;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hd .star{flex:0 0 auto;color:var(--pcg-gold,#ffd76a);font-weight:900;font-size:11px}',
      '.fold{flex:0 0 20px;width:20px;height:20px;border:0;border-radius:5px;cursor:pointer;',
      'background:var(--pcg-fold-bg,#222838);color:var(--pcg-fold-text,#9aa4b8);font:700 13px/1 inherit;padding:0}',
      /* 第五十一批：顶栏右侧多一个 ×，一点就把这个自动化任务停掉（没在跑就只收起卡片）。
       * 样式跟折叠键同款，hover 变红，省得跟「收起」点混。 */
      '.cls{flex:0 0 20px;width:20px;height:20px;border:0;border-radius:5px;cursor:pointer;',
      'background:var(--pcg-fold-bg,#222838);color:var(--pcg-fold-text,#9aa4b8);',
      'font:700 13px/1 inherit;padding:0;display:flex;align-items:center;justify-content:center}',
      '.cls:hover{background:var(--pcg-cls-bg,#c0392b);color:#fff}',
      '.body{padding:7px 8px 8px}',
      '.body.hide{display:none}',
      '.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}',
      /* 第三十八批：cell.wide = 通栏一格（现在没有功能在用，留着给需要两列宽的那格） */
      '.cell.wide{grid-column:1 / -1}',
      /* 第四十九批：标题折行时（比如「受天气/时段限制 无法捕捉」）数字要贴底，
       * 不然同一行左边那格的数字会吊在标题下面，两格看着不对齐。 */
      '.cell{background:var(--pcg-tabs-bg,#0d0f16);border-radius:7px;padding:5px 6px;min-width:0;',
      'display:flex;flex-direction:column;justify-content:flex-start}',
      '.cell small{display:block;color:var(--pcg-lv-text,#8b93a7);font-size:10px;line-height:1.3}',
      '.cell b{display:block;margin-top:auto;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cell b.gold{color:var(--pcg-gold,#ffd76a)}',
      '.rows{margin-top:6px}',
      '.rw{display:flex;align-items:center;gap:6px;padding:3px 2px;font-size:11px}',
      '.rw+.rw{border-top:1px solid var(--pcg-row-line,rgba(255,255,255,.05))}',
      '.rw .nm{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.rw .sub{flex:0 0 auto;color:var(--pcg-lv-text,#8b93a7);font-size:10px}',
      '.rw .val{flex:0 0 auto;color:var(--pcg-gold,#ffd76a);font-weight:700;font-variant-numeric:tabular-nums}',
      '.empty{color:var(--pcg-mvn-dim,#6b7488);font-size:11px;padding:4px 2px}',
      /* 第五十六批：chips = 弹窗里那排「经验糖果XL ×11」紧凑胶囊。
       * 道具 / 树果看板原来用 rows 只画前 4 行，后面的收获全被漏掉；
       * 改成一排会自己换行的胶囊，全部收益都看得见，深浅主题都跟看板走。 */
      '.chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}',
      '.chips .cp{display:inline-flex;align-items:center;gap:4px;max-width:100%;',
      'padding:2px 7px;border:1px solid var(--pcg-hd-line,#262c3a);border-radius:10px;',
      'background:var(--pcg-tabs-bg,#0d0f16);font-size:10.5px;',
      'color:var(--pcg-pnl-text,#e8ecf4)}',
      '.chips .cp .nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.chips .cp i{font-style:normal;font-weight:700;color:var(--pcg-gold,#ffd76a)}',
      '.chips .empty{color:var(--pcg-mvn-dim,#6b7488);font-size:11px;padding:4px 2px}',
      /* 第三十批：rows.pick = 这一栏的行可以点（黑市：点超价的宝可梦就加进意向表） */
      '.rows.pick .rw{cursor:pointer;border-radius:7px}',
      '.rows.pick .rw:hover{background:var(--pcg-hd-bg,rgba(255,255,255,.05))}',
      '.rw.add .nm{color:var(--pcg-gold,#ffd76a)}',
      '.rw.add .sub{color:var(--pcg-gold,#ffd76a);opacity:.75}',
      /* 第三十四批：rw.sh = 这一行是闪光（培育屋的蛋），名字描金 */
      '.rw.sh .nm{color:var(--pcg-gold,#ffd76a);font-weight:700}',
      /* 第二十九批：rowsHl = 正在追踪的那几只给一层更显眼的底色，
       * 跟伤害统计面板的置顶行用同一组 --pcg-row-top* 渐变，深浅主题都自动适配。 */
      '.rows.hl .rw{background:linear-gradient(90deg,var(--pcg-row-top1,rgba(255,203,5,.16)),',
      'var(--pcg-row-top2,rgba(255,203,5,.02)));border-radius:7px;padding:4px 6px;margin-top:4px}',
      '.rows.hl .rw+.rw{border-top:0}',
      '.rows.hl .rw .nm{font-weight:700}',
      /* 第三十八批：rw.plain = 这一行虽然挂在 rowsHl 的组里，但不要底色
       * （图鉴看板只给「正在前往」上高亮，排队等追踪的几只保持干净） */
      '.rows.hl .rw.plain{background:none;padding:3px 2px;margin-top:0}',
      '.rows.hl .rw.plain .nm{font-weight:400}',
      '.rows.hl .rw.plain+.rw.plain{border-top:1px solid var(--pcg-row-line,rgba(255,255,255,.05))}',
      '.ft{margin-top:6px;padding-top:5px;border-top:1px solid var(--pcg-hd-line,#262c3a);',
      'color:var(--pcg-ft-text,#8b93a7);font-size:10px;line-height:1.35}',
      '.ft.on{color:var(--pcg-gold,#ffd76a)}',
      /* 第八十九批：手机浏览器（Kiwi / Edge Canary）适配 ——
       * 触摸屏上 20px 的折叠 / 关闭键根本点不准，字号也偏小。
       * 只改 pointer:coarse 的机器，桌面一点不受影响。 */
      '@media (pointer:coarse){',
      '.pnl{width:290px;font-size:12.5px}',
      /* 顶栏要能拖动：告诉浏览器这里的手势别拿去滚页面 */
      '.hd{padding:9px 9px 8px;touch-action:none}',
      '.hd b{font-size:12px}',
      '.fold,.cls{flex:0 0 26px;width:26px;height:26px;border-radius:7px;font-size:14px}',
      '.body{padding:8px 9px 9px}',
      '.cell small{font-size:10.5px}.cell b{font-size:12.5px}',
      '.rw{font-size:11.5px;padding:5px 2px}',
      '.chips .cp{font-size:11px;padding:3px 8px}',
      '.ft{font-size:10.5px}',
      '}'
    ].join('');
  }

  function loadUi() {
    if (uiLoaded) return;
    try {
      if (!root.chrome || !chrome.storage || !chrome.storage.local) { uiLoaded = true; return; }
      chrome.storage.local.get(UI_KEY, function (o) {
        var v = (o && o[UI_KEY]) || {};
        if (v && typeof v === 'object') ui = v;
        uiLoaded = true;
        while (uiWaiting.length) {
          var fn = uiWaiting.shift();
          try { fn(); } catch (e) { /* ignore */ }
        }
      });
    } catch (e) { uiLoaded = true; }
  }

  function saveUi() {
    try {
      if (!root.chrome || !chrome.storage || !chrome.storage.local) return;
      var o = {};
      o[UI_KEY] = ui;
      chrome.storage.local.set(o, function () { void chrome.runtime.lastError; });
    } catch (e) { /* ignore */ }
  }

  function clampPos(p, host) {
    if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return null;
    var w = (host && host.offsetWidth) || 264;
    var h = (host && host.offsetHeight) || 120;
    var maxX = Math.max(0, (root.innerWidth || 1200) - w - 4);
    var maxY = Math.max(0, (root.innerHeight || 800) - h - 4);
    return { x: Math.max(0, Math.min(maxX, p.x)), y: Math.max(0, Math.min(maxY, p.y)) };
  }

  /* 第三十四批：好几个功能可能同时开着（黑市不再互斥、地下通道还会和别的并跑），
   * 没拖动过的面板就从右下角往上叠：把自己之前已经亮着、又还在默认位置的面板
   * 高度全部让开，谁也盖不住谁。拖动过（offset 有值）的不参与排队。
   * 第四十三批：左 / 右两侧各自排队——左边的面板只给左边的让位。 */
  function autoBottom(key, side) {
    var base = 118;
    var list = Object.keys(panels);
    for (var i = 0; i < list.length; i++) {
      if (list[i] === key) break;
      var p = panels[list[i]];
      if (!p || typeof p.info !== 'function') continue;
      var inf = null;
      try { inf = p.info(); } catch (e) { inf = null; }
      if (!inf || !inf.shown || inf.offset) continue;
      if (side && inf.side && inf.side !== side) continue;
      base += (inf.h || 0) + 8;
    }
    return base;
  }

  /* 第三十四批：某张看板高度变了（折叠 / 展开 / 行数变了 / 刚显示 / 刚收起），
   * 其它还在默认位置的面板要跟着重新排一次，否则会留下空洞或者压在一起。 */
  function reflow(skipKey) {
    Object.keys(panels).forEach(function (k) {
      if (k === skipKey) return;
      var p = panels[k];
      if (!p || typeof p.place !== 'function') return;
      var inf = null;
      try { inf = p.info(); } catch (e) { inf = null; }
      if (!inf || !inf.shown || inf.offset) return;
      try { p.place(); } catch (e) { /* ignore */ }
    });
  }

  function panel(key, title, opts) {
    if (opts) optsMap[key] = opts;
    if (panels[key]) {
      if (title) panels[key].title = title;
      return panels[key];
    }

    /* 第四十三批：看板默认停在哪一侧。opts.side = 'left' 就靠左（图鉴 / 路闪用，
     * 右边常被游戏自己的按钮和别的看板占着），默认还是右下角。 */
    var side = (opts && opts.side === 'left') ? 'left' : 'right';

    var st = {
      key: key,
      title: title || key,
      side: side,
      host: null, body: null, star: null, titleEl: null, grid: null, rows: null, chips: null, foot: null,
      /* 第五十一批：closed = 玩家刚点了 ×。亮着的时候点一下就不再自动冒出来，
       * 直到这个任务真的停过一次（hide() 会把 closed 清掉），下次重新开才照常显示。 */
      closed: false,
      fold: false, shown: false, sig: '', snap: null, drag: null, offset: null
    };

    function applyTheme() {
      try {
        if (root.PCG_THEME && st.host) root.PCG_THEME.applyHost(st.host);
      } catch (e) { /* ignore */ }
    }

    function place() {
      if (!st.host || !st.host.style) return;
      var pos = st.offset;
      if (!pos) {
        st.host.style.top = 'auto';
        /* 底部留出游戏自己那排按钮（自动 / 加速）的高度；
         * 同时躲开同一侧已经在默认位置上的其它看板（autoBottom） */
        st.host.style.bottom = autoBottom(key, st.side) + 'px';
        if (st.side === 'left') {
          st.host.style.right = 'auto';
          st.host.style.left = '12px';
        } else {
          st.host.style.left = 'auto';
          st.host.style.right = '12px';
        }
        return;
      }
      var p = clampPos(pos, st.host);
      st.host.style.right = 'auto';
      st.host.style.bottom = 'auto';
      st.host.style.left = (p ? p.x : 12) + 'px';
      st.host.style.top = (p ? p.y : 120) + 'px';
    }

    function build() {
      if (st.host && st.host.isConnected) return st.host;
      if (!root.document || !document.createElement || !document.body) return null;
      var hostEl = document.createElement('div');
      hostEl.id = 'pcg-' + key + '-hud';
      hostEl.style.cssText = 'position:fixed;right:12px;bottom:118px;z-index:2147481000;display:none;';
      applyTheme();
      var sr = hostEl.attachShadow ? hostEl.attachShadow({ mode: 'open' }) : hostEl;
      var sty = document.createElement('style');
      sty.textContent = css();
      sr.appendChild(sty);
      var pnl = document.createElement('div');
      pnl.className = 'pnl';
      pnl.innerHTML = '<div class="hd" title="按住拖动 · 双击复位到默认位置">' +
        '<span class="star"></span><b>' + esc(st.title) + '</b>' +
        '<button class="fold" type="button" title="收起 / 展开">–</button>' +
        '<button class="cls" type="button" title="关闭（停止这个任务并收起看板）">×</button></div>' +
        '<div class="body"><div class="grid"></div><div class="rows"></div>' +
        '<div class="chips"></div><div class="ft"></div></div>';
      sr.appendChild(pnl);
      document.body.appendChild(hostEl);
      st.host = hostEl;
      st.star = sr.querySelector ? sr.querySelector('.hd .star') : null;
      st.titleEl = sr.querySelector ? sr.querySelector('.hd b') : null;
      st.body = sr.querySelector ? sr.querySelector('.body') : null;
      st.grid = sr.querySelector ? sr.querySelector('.grid') : null;
      st.rows = sr.querySelector ? sr.querySelector('.rows') : null;
      st.chips = sr.querySelector ? sr.querySelector('.chips') : null;
      st.foot = sr.querySelector ? sr.querySelector('.ft') : null;

      /* 第三十批：行点击 → 交给调用方（opts.onRow(key, snap)）。
       * 只有带 data-k 的行才会触发，其它看板的行为完全不变。 */
      if (st.rows && st.rows.addEventListener) {
        st.rows.addEventListener('click', function (ev) {
          var t = ev && ev.target;
          var row = (t && t.closest) ? t.closest('.rw') : null;
          if (!row) return;
          var k = row.getAttribute ? row.getAttribute('data-k') : '';
          if (!k) return;
          var o = optsMap[key];
          if (o && typeof o.onRow === 'function') {
            try { o.onRow(k, st.snap || {}); } catch (e2) { /* ignore */ }
          }
        });
      }

      var btn = sr.querySelector ? sr.querySelector('.fold') : null;
      if (btn && btn.addEventListener) {
        btn.addEventListener('click', function (ev) {
          if (ev && ev.stopPropagation) ev.stopPropagation();
          st.fold = !st.fold;
          ui[key] = Object.assign({}, ui[key] || {}, { fold: st.fold });
          if (st.offset) ui[key].x = st.offset.x, ui[key].y = st.offset.y;
          saveUi();
          paint(true);
        });
      }
      bindDrag(pnl, sr);

      /* 第五十一批：× = 关掉这块看板。带 onClose 的功能（八个自动化任务都带）
       * 顺手把任务本身停掉——不然任务还在跑，玩家却看不到任何进度。
       * 顺序要紧：先让 onClose 跑（它内部会 hide()，把 closed 清掉），
       * 再把 closed 立起来，这样下一轮 tick 的 show() 不会又把卡片弹回来。 */
      var xb = sr.querySelector ? sr.querySelector('.cls') : null;
      if (xb && xb.addEventListener) {
        xb.addEventListener('click', function (ev) {
          if (ev && ev.stopPropagation) ev.stopPropagation();
          if (ev && ev.preventDefault) ev.preventDefault();
          close();
        });
      }

      if (uiLoaded) applyUi();
      else uiWaiting.push(applyUi);
      return hostEl;
    }

    function applyUi() {
      var saved = ui[key] || {};
      st.fold = !!saved.fold;
      st.offset = (typeof saved.x === 'number' && typeof saved.y === 'number')
        ? { x: saved.x, y: saved.y } : null;
      /* 第四十三批：默认侧换了（图鉴看板从右下角改到左下角）时，旧坐标是按右侧
       * 记的、照搬会挂在右上角——一次性作废，回到新的默认侧；之后再拖照旧记。 */
      if (saved.side !== st.side) {
        st.offset = null;
        ui[key] = Object.assign({}, saved, { side: st.side });
        delete ui[key].x;
        delete ui[key].y;
        saveUi();
      }
      place();
      paint(true);
    }

    /* 顶栏拖动：pointer 事件优先，老浏览器退回 mouse */
    function bindDrag(pnl, sr) {
      var hd = sr.querySelector ? sr.querySelector('.hd') : null;
      if (!hd || !hd.addEventListener) return;
      var start = function (ev) {
        if (ev.button != null && ev.button !== 0) return;
        var r = st.host.getBoundingClientRect();
        st.drag = { dx: ev.clientX - r.left, dy: ev.clientY - r.top, w: r.width, h: r.height };
        st.offset = { x: r.left, y: r.top };
        if (ev.preventDefault) ev.preventDefault();
      };
      var move = function (ev) {
        if (!st.drag) return;
        var x = ev.clientX - st.drag.dx;
        var y = ev.clientY - st.drag.dy;
        st.offset = { x: x, y: y };
        place();
      };
      var end = function () {
        if (!st.drag) return;
        st.drag = null;
        var p = clampPos(st.offset, st.host);
        if (p) st.offset = p;
        ui[key] = Object.assign({}, ui[key] || {}, { x: st.offset.x, y: st.offset.y });
        saveUi();
        place();
      };
      if (root.PointerEvent) {
        hd.addEventListener('pointerdown', start);
        root.addEventListener('pointermove', move);
        root.addEventListener('pointerup', end);
      } else {
        hd.addEventListener('mousedown', start);
        root.addEventListener('mousemove', move);
        root.addEventListener('mouseup', end);
      }
      /* 第三十四批：万一拖到屏幕边上看不见了，双击顶栏就复位回右下角默认位置 */
      hd.addEventListener('dblclick', function (ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        if (ev && ev.stopPropagation) ev.stopPropagation();
        st.offset = null;
        if (ui[key]) { delete ui[key].x; delete ui[key].y; }
        saveUi();
        place();
        reflow(key);
      });
    }

    /* 第五十一批：× 的落地动作 —— 先让调用方把任务停掉（opts.onClose），
     * 再收起卡片并立起 closed 标记，免得下一轮 tick 的 show() 又弹回来。 */
    function close() {
      var o = optsMap[key], fn = o && o.onClose;
      if (typeof fn === 'function') {
        try { fn(); } catch (e) { /* ignore：停不下来也至少把卡片收起 */ }
      }
      st.closed = true;
      st.shown = false;
      if (st.host && st.host.style) st.host.style.display = 'none';
      reflow(key);
    }

    function cellHtml(c) {
      var gold = c[2] === 'gold' ? ' class="gold"' : '';
      var wide = c[3] === 'wide' ? ' wide' : '';
      /* 第四十九批：标题里写 \n 就换成 <br>——半格宽放不下「受天气/时段限制 无法捕捉」，
       * 让它自己折行会断成「…无法捕 / 捉」这种单字孤行，手动断开更好看。 */
      return '<div class="cell' + wide + '"><small>' +
        esc(c[0]).replace(/\r?\n/g, '<br>') + '</small>' +
        '<b' + gold + '>' + esc(c[1]) + '</b></div>';
    }

    function paint(force) {
      var s = st.snap || {};
      if (st.titleEl && st.titleEl.textContent !== st.title) st.titleEl.textContent = st.title;
      if (st.star) st.star.textContent = s.star == null ? '' : String(s.star);
      if (st.body) st.body.className = 'body' + (st.fold ? ' hide' : '');
      var sig = JSON.stringify([st.fold, s.star, s.cells, s.rows, s.chips, s.chipsEmpty,
        s.foot, s.footOn, s.rowsHl, s.rowsClick]);
      if (!force && sig === st.sig) return;
      st.sig = sig;
      /* 折起来时 body 一收起高度就变了：自己重排，也叫其它默认位置的面板跟着补位 */
      if (st.fold) {
        if (st.shown && !st.drag && !st.offset) place();
        reflow(key);
        return;
      }
      if (st.grid) {
        var cells = s.cells || [];
        st.grid.innerHTML = cells.length ? cells.map(cellHtml).join('') : '';
        st.grid.style.display = cells.length ? 'grid' : 'none';
      }
      if (st.rows) {
        var rows = s.rows || [];
        var rowCls = 'rows' + (s.rowsHl ? ' hl' : '') + (s.rowsClick ? ' pick' : '');
        if (st.rows.className !== rowCls) st.rows.className = rowCls;
        st.rows.innerHTML = rows.length ? rows.map(function (r) {
          return '<div class="rw' + (r.w ? ' ' + esc(r.w) : '') +
            (r.plain ? ' plain' : '') + '"' +
            (r.k ? ' data-k="' + esc(r.k) + '"' : '') +
            (r.t ? ' title="' + esc(r.t) + '"' : '') + '>' +
            '<span class="nm">' + esc(r.nm) + '</span>' +
            (r.sub ? '<span class="sub">' + esc(r.sub) + '</span>' : '') +
            (r.val == null || r.val === '' ? '' : '<span class="val">' + esc(r.val) + '</span>') + '</div>';
        }).join('') : (s.empty ? '<div class="empty">' + esc(s.empty) + '</div>' : '');
        st.rows.style.display = (rows.length || s.empty) ? 'block' : 'none';
      }
      if (st.chips) {
        var cps = s.chips || [];
        st.chips.innerHTML = cps.length ? cps.map(function (c) {
          return '<span class="cp"><span class="nm">' + esc(c.nm) + '</span>' +
            (c.val == null || c.val === '' ? '' : '<i>' + esc(c.val) + '</i>') + '</span>';
        }).join('') : (s.chipsEmpty ? '<span class="empty">' + esc(s.chipsEmpty) + '</span>' : '');
        st.chips.style.display = (cps.length || s.chipsEmpty) ? 'flex' : 'none';
      }
      if (st.foot) {
        st.foot.textContent = s.foot == null ? '' : String(s.foot);
        st.foot.className = 'ft' + (s.footOn ? ' on' : '');
        st.foot.style.display = s.foot ? 'block' : 'none';
      }
      /* 折起来 / 展开后高度差很多，默认位置的要重新给后面的人让位 */
      if (st.shown && !st.drag && !st.offset) place();
      reflow(key);
    }

    var api = {
      key: key,
      set: function (snap) {
        st.snap = snap || {};
        if (!st.shown) return api;
        build();
        paint(false);
        return api;
      },
      show: function () {
        loadUi();
        if (!build()) return api;
        if (st.closed) return api;      // 第五十一批：玩家点过 ×，这次运行里不再自动冒出来
        st.shown = true;
        st.host.style.display = 'block';
        applyTheme();
        place();
        if (uiLoaded) paint(true);
        reflow(key);
        return api;
      },
      hide: function () {
        /* 第五十一批：hide 代表「这个任务不跑了」，顺手把 × 的关闭标记撤掉，
         * 下次重新开任务时看板照常出现。 */
        st.closed = false;
        st.shown = false;
        if (st.host) st.host.style.display = 'none';
        reflow(key);            // 它让出来的位置，下面的面板要补上
        return api;
      },
      /* 第五十一批：给调用方 / 冒烟测试用的显式关闭（跟点 × 同一条路） */
      close: function () { close(); return api; },
      /* 是不是被玩家点 × 收起了（还没被 hide 重置） */
      closed: function () { return !!st.closed; },
      visible: function () { return !!st.shown; },
      el: function () { return st.host; },
      /* 重新摆一次（reflow 用它让别的面板跟着重排） */
      place: function () { place(); return api; },
      /* 给 autoBottom 用的最小快照：有没有亮着、是不是还在默认位置、多高、哪一侧 */
      info: function () {
        return {
          shown: !!st.shown,
          fold: !!st.fold,
          side: st.side,
          offset: st.offset ? { x: st.offset.x, y: st.offset.y } : null,
          h: (st.host && st.host.offsetHeight) || 0
        };
      }
    };
    panels[key] = api;
    return api;
  }

  var API = {
    panel: panel,
    keys: function () { return Object.keys(panels); },
    drop: function (key) {
      var p = panels[key];
      if (!p) return;
      try {
        var el = p.el();
        if (el && el.parentNode) el.parentNode.removeChild(el);
      } catch (e) { /* ignore */ }
      delete panels[key];
    },
    hideAll: function () {
      Object.keys(panels).forEach(function (k) { panels[k].hide(); });
    },
    /* 第五十一批：把每张卡都按「点了 ×」处理（先停任务再收起） */
    closeAll: function () {
      Object.keys(panels).forEach(function (k) {
        try { panels[k].close(); } catch (e) { /* ignore */ }
      });
    }
  };

  root.PCG_HUD = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
