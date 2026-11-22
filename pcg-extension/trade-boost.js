/* Poke'Catch 防掉线助手 —— 交换优化（第一百二十一批重构，隔离世界 / 只读）
 *
 * 游戏把交换数据放在自己的 IIFE 闭包里（it / je / z / ie()），隔离世界读不到。
 * 本模块用三条玩家本来就看得见的数据源，不发请求、不改存档：
 *   · <html data-pcg-offers>           page-hook 在 MAIN world 抓到的 offer 明细
 *                                      （give_id / give_shiny / want_id / have / reg）
 *   · PCG_SAVE.read()                  我的宝可梦（仓库 + 培育屋）
 *   · localStorage[pokecatch-trades-sp-*] + #ot-offers  回退用的物种汇总 / 原版卡片
 *
 * 两个筛选项用原版 chip 风格（.chip.btn.small.ghost），挂在原版 SHINY 按钮旁：
 *   「随意换」= 游戏里的「问号类型」：别人 give 一只闪光、want_id=0（求任意闪光）。
 *              我满足条件的判定与游戏 we() 一致：我有闪光、不在该 offer 的 have
 *              排除表、稀有度档位相同、同一地区组。一级卡片 = 别人给的闪光物种，
 *              我满足条件的排最前。默认只统计闪光 offer（give_shiny）。
 *   「我能换」= 指定类型：want_id != 0，别人指定要某只宝可梦（want_id / give_shiny）。
 *              一级卡片 = 「我的该宝可梦」（头像 = want_id 的闪光），
 *              点进去显示「所有能用它换到的宝可梦」= 这些 offer 的 give（闪光）。
 *              默认只统计闪光 offer。
 *
 * 游戏每次 Be() 会整块重建 #trade-root，所以每 500ms 自愈：chip 掉了补、面板掉了挂回。
 */
(function (root) {
  'use strict';

  if (root.__PCG_TRADE_BOOST__) return;
  root.__PCG_TRADE_BOOST__ = true;

  var ART = 'https://pokecatch-online.pages.dev/assets/pokemon/';
  var SP_PREFIX = 'pokecatch-trades-sp-';

  var T = {
    mode: '',          // '' = 用游戏原版 | 'mine' | 'any'
    sel: null,         // 二级视图选中的 { id, shiny }
    css: false,
    lastHtml: '',
    chipsAt: 0
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function artUrl(id, shiny) {
    return ART + (shiny ? 'shiny/' : '') + Number(id || 0) + '.png';
  }
  function nameOf(id) {
    try {
      var D = root.PCG_DEX_DATA;
      if (D && typeof D.name === 'function') return String(D.name(id) || ('#' + id));
    } catch (e) { /* ignore */ }
    return '#' + id;
  }
  function saveObj() {
    try { return (root.PCG_SAVE && root.PCG_SAVE.read()) || {}; }
    catch (e) { return {}; }
  }

  /* ---------------- 数据源 ---------------- */
  function myMons() {
    var s = saveObj(), out = [];
    function add(m) {
      if (!m || !m.id) return;
      var id = Number(m.id) || 0;
      if (!id) return;
      out.push({
        id: id,
        shiny: !!m.shiny,
        level: Number(m.level != null ? m.level : m.lv) || 0,
        uid: String(m.uid == null ? '' : m.uid)
      });
    }
    (Array.isArray(s.mons) ? s.mons : []).forEach(add);
    var pen = (s.pension && Array.isArray(s.pension.mons)) ? s.pension.mons : [];
    pen.forEach(function (p) { add(p && p.mon); });
    var ug = (s.underground && Array.isArray(s.underground.mons)) ? s.underground.mons : [];
    ug.forEach(function (p) { add(p && p.mon); });
    return out;
  }

  /* 主数据源：page-hook 抓到的 offer 明细（<html data-pcg-offers>）。
   * 读不到就返回空数组，视图层会回退到 species 缓存。 */
  function offerDetail() {
    try {
      var node = document.documentElement;
      var raw = node && node.getAttribute('data-pcg-offers');
      if (!raw) return [];
      var o = JSON.parse(raw);
      return (o && Array.isArray(o.offers)) ? o.offers : [];
    } catch (e) { return []; }
  }

  /* 游戏 species 缓存：[give_id, give_shiny, offers, can, friend]（一个用户一个 key） */
  function speciesRows() {
    var best = null;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(SP_PREFIX) !== 0) continue;
        var o = JSON.parse(localStorage.getItem(k) || '{}');
        if (o && Array.isArray(o.species)) {
          if (!best || (Number(o.at) || 0) > (Number(best.at) || 0)) best = o;
        }
      }
    } catch (e) { /* ignore */ }
    return ((best && best.species) || []).map(function (r) {
      return {
        id: Number(r[0]) || 0, shiny: !!r[1], offers: Number(r[2]) || 0,
        can: Number(r[3]) || 0, friend: Number(r[4]) || 0
      };
    }).filter(function (r) { return r.id > 0; });
  }

  /* 我是否拥有某 id + 闪光性的宝可梦（用于指定类 offer 的 ie() 判定） */
  function haveIdShiny(id, shiny, mons) {
    for (var i = 0; i < mons.length; i++) {
      if (mons[i].id === id && !!mons[i].shiny === !!shiny) return true;
    }
    return false;
  }
  /* 任意闪光类 offer 的近似判定：我有闪光、且不在 have 排除表里。
   * 稀有度档位 / 同地区的精确 tierIndex 在闭包里拿不到，用图鉴号粗分档 + 地区缓存兜底；
   * 结果只用于排序（我能换的排前），不用于隐藏，免得误伤。 */
  function shinyTier(id) {
    var n = Number(id) || 0;
    if (n >= 900) return 4;
    if (n >= 700) return 3;
    if (n >= 400) return 2;
    if (n >= 150) return 1;
    return 0;
  }
  function canAny(offer, mons) {
    var have = {};
    (offer.have || []).forEach(function (x) { have[Number(x)] = 1; });
    var tier = shinyTier(offer.give_id);
    for (var i = 0; i < mons.length; i++) {
      var m = mons[i];
      if (!m.shiny || have[m.id]) continue;
      if (Math.abs(shinyTier(m.id) - tier) <= 1) return true;
    }
    return false;
  }

  /* ---------------- 样式（借用游戏自己的 .ot-cell / .chip） ---------------- */
  var CSS = [
    '.pc-filters.ot-filters .pcg-trade-chip { white-space: nowrap; }',
    '.pc-filters.ot-filters .pcg-trade-chip.on { outline: 1px solid currentColor; outline-offset: 1px; }',
    '#pcg-trade-panel { margin: 10px 0 14px; }',
    '#pcg-trade-panel .pcg-tb-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 9px; }',
    '#pcg-trade-panel .pcg-tb-title { font-size: 12px; font-weight: 800; opacity: .92; }',
    '#pcg-trade-panel .pcg-tb-back { cursor: pointer; }',
    '#pcg-trade-panel .pcg-tb-sec { margin: 12px 0 6px; font-size: 11px; font-weight: 800; opacity: .82; }',
    '#pcg-trade-panel .pcg-tb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); gap: 8px; }',
    '#pcg-trade-panel .pcg-tb-cell { display: flex; flex-direction: column; align-items: center;',
    '  justify-content: flex-start; gap: 3px; text-align: center; cursor: pointer; padding: 8px 5px; }',
    '#pcg-trade-panel .pcg-tb-red { border-color: #e5534b !important;',
    '  box-shadow: inset 0 0 0 1px rgba(229,83,75,.38), 0 0 9px rgba(229,83,75,.20) !important; }',
    '#pcg-trade-panel .pcg-tb-art img { width: 44px; height: 44px; object-fit: contain; image-rendering: pixelated; }',
    '#pcg-trade-panel .pcg-tb-sub { font-size: 10px; opacity: .78; }',
    '#pcg-trade-panel .pcg-tb-mine { display: flex; flex-wrap: wrap; gap: 6px; }',
    '#pcg-trade-panel .pcg-tb-one { border: 1px solid rgba(229,83,75,.55); border-radius: 8px;',
    '  padding: 4px 9px; font-size: 10.5px; }',
    '#pcg-trade-panel .pcg-tb-empty { padding: 14px; font-size: 11px; opacity: .72; }',
    '#pcg-trade-panel .pcg-tb-hint { font-size: 10.5px; opacity: .72; margin-left: auto; }'
  ].join('');

  function ensureCss() {
    if (T.css || document.getElementById('pcg-trade-css')) { T.css = true; return; }
    T.css = true;
    try {
      var st = document.createElement('style');
      st.id = 'pcg-trade-css';
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 单元格 ---------------- */
  function cellHtml(o, red) {
    var nm = esc(nameOf(o.id)) + (o.shiny ? ' ✨' : '');
    return '<button type="button" class="pc-cell ot-cell ot-sp pcg-tb-cell' +
      (red ? ' pcg-tb-red' : '') + '"' +
      ' data-pcg-id="' + o.id + '" data-pcg-shiny="' + (o.shiny ? 1 : 0) + '"' +
      ' data-pcg-go="' + (o.go ? 1 : 0) + '" title="' + nm + '">' +
      '<span class="pcg-tb-art"><img src="' + artUrl(o.id, o.shiny) + '" alt=""></span>' +
      '<span class="ot-cell-l">' + nm + '</span>' +
      (o.sub ? '<span class="ot-cell-s pcg-tb-sub">' + esc(o.sub) + '</span>' : '') +
      (o.badge ? '<span class="ot-sp-can">' + esc(o.badge) + '</span>' : '') +
      '</button>';
  }
  function bindArt(box) {
    var imgs = box.querySelectorAll('.pcg-tb-art img');
    for (var i = 0; i < imgs.length; i++) {
      (function (img) {
        if (img.getAttribute('data-bound') === '1') return;
        img.setAttribute('data-bound', '1');
        img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
      })(imgs[i]);
    }
  }

  /* ---------------- 三种视图的数据 ---------------- */

  /* 「随意换」= 问号类型（want_id=0），按 give 物种聚合；只算闪光 give。
   * 我满足条件的 offer 数 = canN，排在最前。 */
  function anyRows() {
    var offers = offerDetail(), mons = myMons();
    var rows = [];
    if (offers.length) {
      var map = {};
      offers.forEach(function (o) {
        if (o.want_id !== 0 || !o.give_shiny || !o.give_id) return;   // 只统计问号 + 闪光
        var k = o.give_id + ':1';
        if (!map[k]) map[k] = { id: o.give_id, shiny: true, offers: 0, canN: 0 };
        map[k].offers++;
        if (canAny(o, mons)) map[k].canN++;
      });
      rows = Object.keys(map).map(function (k) { return map[k]; });
    } else {
      /* 回退：没有明细时只能用 species 缓存（含全部类型，这里如实标注） */
      rows = speciesRows().filter(function (r) { return r.shiny; }).map(function (r) {
        return { id: r.id, shiny: true, offers: r.offers, canN: r.can || 0 };
      });
    }
    rows.forEach(function (r) {
      r.sub = r.offers + ' 个交换';
      r.badge = r.canN ? ('我能换 ' + r.canN + ' 个') : '';
      r.go = 1;
    });
    rows.sort(function (a, b) {
      return (b.canN - a.canN) || (b.offers - a.offers) || (a.id - b.id);
    });
    return rows;
  }

  /* 「我能换」一级 = 我的宝可梦（作为指定交换的筹码 want_id）。
   * 只算闪光 give 的 offer；只保留我真正拥有的 want_id/shiny 组合。
   * 每组的 list = 满足这些 offer 的「我的该宝可梦」个体；
   * targets = 所有能用它换到的 give（二级展示用）。 */
  function mineGroups() {
    var offers = offerDetail(), mons = myMons();
    if (offers.length) {
      var map = {};
      offers.forEach(function (o) {
        if (o.want_id === 0 || !o.give_shiny || !o.give_id) return;   // 指定类 + 闪光
        if (!haveIdShiny(o.want_id, true, mons)) return;              // 我没有这只闪光 → 换不了
        var k = o.want_id + ':1';
        if (!map[k]) map[k] = { id: o.want_id, shiny: true, list: [], targets: {} };
        var mine = map[k];
        mons.forEach(function (m) {
          if (m.id === o.want_id && m.shiny && mine.list.indexOf(m) < 0) mine.list.push(m);
        });
        if (!mine.targets[o.give_id]) {
          mine.targets[o.give_id] = { id: o.give_id, shiny: true, n: 0 };
        }
        mine.targets[o.give_id].n++;
      });
      return Object.keys(map).map(function (k) {
        var g = map[k];
        g.targetList = Object.keys(g.targets).map(function (t) { return g.targets[t]; });
        g.sub = '我有 ' + g.list.length + ' 只';
        g.badge = '可换 ' + g.targetList.length + ' 种';
        return g;
      }).sort(function (a, b) {
        return (b.targetList.length - a.targetList.length) || (a.id - b.id);
      });
    }
    /* 回退：没有明细时用我拥有的闪光 + species 缓存，给出近似组 */
    var sp = speciesRows().filter(function (r) { return r.shiny; });
    var out = [];
    mons.forEach(function (m) {
      if (!m.shiny) return;
      var k = m.id + ':1';
      var g = out.filter(function (x) { return x.key === k; })[0];
      if (!g) {
        g = { key: k, id: m.id, shiny: true, list: [], targets: {}, targetList: [] };
        sp.forEach(function (r) { g.targets[r.id] = { id: r.id, shiny: true, n: r.offers }; });
        g.targetList = sp.map(function (r) { return { id: r.id, shiny: true, n: r.offers }; });
        out.push(g);
      }
      if (g.list.indexOf(m) < 0) g.list.push(m);
    });
    out.forEach(function (g) {
      g.sub = '我有 ' + g.list.length + ' 只';
      g.badge = '可换 ' + g.targetList.length + ' 种';
    });
    return out.sort(function (a, b) { return (b.targetList.length - a.targetList.length) || (a.id - b.id); });
  }

  function barHtml(title, back, hint) {
    return '<div class="pcg-tb-bar">' +
      (back ? '<button type="button" class="chip btn small ghost pcg-tb-back" data-pcg-back="1">← 返回</button>' : '') +
      '<span class="pcg-tb-title">' + esc(title) + '</span>' +
      (hint ? '<span class="pcg-tb-hint">' + esc(hint) + '</span>' : '') +
      '</div>';
  }
  function gridHtml(rows, red) {
    if (!rows.length) return '<div class="pcg-tb-empty">还没有读到交换清单：先进一次游戏交换页，让交换数据刷新出来再看。</div>';
    return '<div class="pc-grid ot-board pcg-tb-grid">' +
      rows.map(function (r) { return cellHtml(r, red); }).join('') + '</div>';
  }

  function viewHtml() {
    if (T.mode === 'mine') {
      if (!T.sel) {
        var g = mineGroups();
        return barHtml('我能换 · 我能用来交换的宝可梦', false,
          '红框卡片 · 点进去看「我的该宝可梦」与「能用它换到的闪光」') +
          gridHtml(g.map(function (x) { x.go = 0; return x; }), true);
      }
      var mine = mineGroups().filter(function (x) {
        return x.id === T.sel.id && !!x.shiny === !!T.sel.shiny;
      })[0];
      var ones = mine ? mine.list : [];
      var targets = (mine ? mine.targetList : []).slice().sort(function (a, b) {
        return b.n - a.n || a.id - b.id;
      }).map(function (r) {
        return { id: r.id, shiny: true, sub: r.n + ' 个交换', badge: '', go: 1 };
      });
      return barHtml('我能换 · ' + nameOf(T.sel.id) + (T.sel.shiny ? ' ✨' : ''), true,
        '共 ' + targets.length + ' 种闪光可换到') +
        '<div class="pcg-tb-sec">我的该宝可梦（' + ones.length + ' 只）</div>' +
        (ones.length
          ? '<div class="pcg-tb-mine">' + ones.map(function (m) {
            return '<span class="pcg-tb-one">Lv.' + (m.level || '?') +
              (m.shiny ? ' ✨' : '') + '</span>';
          }).join('') + '</div>'
          : '<div class="pcg-tb-empty">这一组暂时没有可交换的个体</div>') +
        '<div class="pcg-tb-sec">所有能用它换到的闪光宝可梦</div>' +
        gridHtml(targets, false);
    }
    if (T.mode === 'any') {
      var rows = anyRows();
      return barHtml('随意换 · 问号类型（求任意闪光）', false,
        '只统计闪光 · 我满足条件的排最前（共 ' + rows.length + ' 种）') +
        gridHtml(rows, false);
    }
    return '';
  }

  /* ---------------- 回到游戏原版物种详情 ---------------- */
  function openSpecies(id, shiny) {
    T.mode = '';
    T.sel = null;
    T.lastHtml = '';
    sync();
    var nm = nameOf(id);
    setTimeout(function () {
      var cells = document.querySelectorAll('#ot-offers .ot-cell.ot-sp');
      for (var i = 0; i < cells.length; i++) {
        var l = cells[i].querySelector('.ot-cell-l');
        var t = l ? String(l.textContent || '').trim() : '';
        if (t && t.indexOf(nm) >= 0) { try { cells[i].click(); } catch (e) {} return; }
      }
      var q = document.getElementById('ot-q');
      if (q) {
        q.value = nm;
        try { q.dispatchEvent(new Event('input', { bubbles: true })); } catch (e2) { /* ignore */ }
      }
    }, 80);
  }

  /* ---------------- chip 注入（原版风格，紧挨原版筛选按钮） ---------------- */
  function chipDefs() {
    return [
      { k: 'mine', text: '我能换' },
      { k: 'any', text: '随意换' }
    ];
  }
  function ensureChips(filters) {
    var defs = chipDefs();
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var el = filters.querySelector('.pcg-trade-chip[data-pcg-trade="' + d.k + '"]');
      if (el) continue;
      el = document.createElement('button');
      el.type = 'button';
      el.className = 'chip btn small ghost pcg-trade-chip';
      el.setAttribute('data-pcg-trade', d.k);
      el.textContent = d.text;
      (function (key) {
        el.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          T.mode = (T.mode === key) ? '' : key;
          T.sel = null;
          T.lastHtml = '';
          tick();
        });
      })(d.k);
      var anchor = filters.querySelector('.chip[data-f="shiny"]');
      if (anchor && anchor.parentNode === filters) {
        filters.insertBefore(el, anchor.nextSibling);
      } else {
        filters.appendChild(el);
      }
    }
  }
  function syncChips(filters) {
    var chips = filters.querySelectorAll('.pcg-trade-chip');
    for (var i = 0; i < chips.length; i++) {
      var on = chips[i].getAttribute('data-pcg-trade') === T.mode;
      if (chips[i].classList.contains('on') !== on) chips[i].classList.toggle('on', on);
    }
  }

  /* ---------------- 面板与自愈 ---------------- */
  function ensurePanel(board) {
    var el = document.getElementById('pcg-trade-panel');
    if (el && el.parentNode === board.parentNode) return el;
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = document.createElement('div');
    el.id = 'pcg-trade-panel';
    el.className = 'pcg-trade-panel';
    el.style.display = 'none';
    el.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var back = t.closest('[data-pcg-back]');
      if (back) { T.sel = null; T.lastHtml = ''; tick(); return; }
      var cell = t.closest('.pcg-tb-cell');
      if (!cell) return;
      var id = Number(cell.getAttribute('data-pcg-id')) || 0;
      var shiny = cell.getAttribute('data-pcg-shiny') === '1';
      var go = cell.getAttribute('data-pcg-go') === '1';
      if (!id) return;
      if (go) { openSpecies(id, shiny); return; }
      if (T.mode === 'mine') { T.sel = { id: id, shiny: shiny }; T.lastHtml = ''; tick(); }
    });
    board.parentNode.insertBefore(el, board);
    T.lastHtml = '';
    return el;
  }

  function sync() {
    var panel = document.getElementById('pcg-trade-panel');
    var board = document.getElementById('ot-offers');
    if (!board) return;
    if (!panel) return;
    if (T.mode) {
      board.style.display = 'none';
      panel.style.display = '';
      var html = viewHtml();
      if (html !== T.lastHtml) {
        T.lastHtml = html;
        panel.innerHTML = html;
        bindArt(panel);
      }
    } else {
      board.style.display = '';
      panel.style.display = 'none';
      T.lastHtml = '';
    }
  }

  function tick() {
    try {
      var filters = document.querySelector('.pc-filters.ot-filters');
      var board = document.getElementById('ot-offers');
      if (!filters || !board) return;
      ensureCss();
      ensureChips(filters);
      ensurePanel(board);
      syncChips(filters);
      /* offer 明细到位后，如果正在展示视图则强制重绘（lastHtml 会变） */
      sync();
    } catch (e) { /* 单个页面出错不影响其它功能 */ }
  }

  root.PCG_TRADE_BOOST = {
    tick: tick,
    state: function () { return { mode: T.mode, sel: T.sel }; },
    myMons: myMons,
    offerDetail: offerDetail,
    speciesRows: speciesRows,
    anyRows: anyRows,
    mineGroups: mineGroups,
    viewHtml: viewHtml,
    select: function (id, shiny) { T.mode = 'mine'; T.sel = { id: id, shiny: !!shiny }; T.lastHtml = ''; return viewHtml(); },
    setMode: function (m) { T.mode = m; T.sel = null; T.lastHtml = ''; return viewHtml(); }
  };

  setInterval(tick, 500);
  try {
    document.addEventListener('DOMContentLoaded', tick);
  } catch (e) { /* ignore */ }
  tick();
})(typeof window !== 'undefined' ? window : this);
