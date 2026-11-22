// ==UserScript==
// @name         Poke'Catch 闪光蛋预测面板
// @name:en     Poke'Catch Shiny Egg Forecast
// @namespace    pcg-egg-forecast
// @version      0.1.0
// @description  纯计算，零网络请求。读取游戏存档的 trainerSeed + pension.laid，用游戏同款 53 位确定性哈希预测未来每颗蛋是否闪光、roll 值、亲代抽取、多久后是闪。
// @match        *://pokecatch-online.netlify.app/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

/* ============================================================================
 * 纯计算核心 — 从原插件 nursery-monitor.js 原封不动搬来
 * 依赖：零。只用 localStorage 读游戏存档。
 * ==========================================================================*/

(function () {
'use strict';

/* ---------- 常量（与游戏 app.17255d8d2e.js 一致） ---------- */
var K = {
  DITTO: 132,
  HATCH_MS: 240 * 60000,          // 孵化时间 = 4h
  EGG_MS: 240 * 60000,            // 生蛋周期 = 4h
  SHINY_RATE: 1 / 512,
  SHINY_PARENT_RATE: 1 / 16,      // sp:2 新档，≈6.25%
  SHINY_PARENT_RATE_OLD: 0.1,     // sp:1 旧档，10%
  SHINY_BERRY_MULT: 2,            // bx 吃靛莓果 ×2
  NO_EGG: [137, 442, 479, 47901, 47902, 47903, 47904, 47905, 556]
};

/* ---------- 工具 ---------- */
function num(v, d) {
  var n = Number(v);
  return isFinite(n) ? n : (d || 0);
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fmtDur(ms) {
  if (!isFinite(ms) || ms <= 0) return '就绪';
  var m = Math.ceil(ms / 60000);
  if (m < 60) return m + ' 分';
  var h = Math.floor(m / 60), mm = m % 60;
  if (h < 24) return h + 'h' + (mm ? ' ' + mm + 'm' : '');
  return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
}

/* ---------- 哈希 — 与游戏 Us(s) 逐位一致，别动 ---------- */
function eggHash(str) {
  var S = 1779033703 ^ ((24348 << 16) | 41597);
  var C = 3144134277 ^ ((15337 << 16) | 49222);
  for (var i = 0; i < str.length; i++) {
    var t = str.charCodeAt(i);
    S = Math.imul(S ^ t, 2654435761);
    C = Math.imul(C ^ t, 1597334677);
  }
  S = Math.imul(S ^ (S >>> 16), 2246822507) ^ Math.imul(C ^ (C >>> 13), 3266489909);
  C = Math.imul(C ^ (C >>> 16), 2246822507) ^ Math.imul(S ^ (S >>> 13), 3266489909);
  return (4294967296 * (2097151 & C) + (S >>> 0)) / 9007199254740992;
}

/* ---------- 闪光阈值 — 与游戏 Ao(t) 逐字一致 ---------- */
function shinyThreshold(opts) {
  opts = opts || {};
  var base = K.SHINY_RATE;
  var o = 0;
  if (opts.sp) o = (+opts.sp === 2) ? K.SHINY_PARENT_RATE : K.SHINY_PARENT_RATE_OLD;
  var th = o ? Math.max(o, base) : base;
  if (opts.bx) th = th * K.SHINY_BERRY_MULT;
  return th;
}

/* ---------- 训练家种子 ---------- */
function trainerSeed(save) {
  var t = (save && save.trainer) || null;
  if (!t) return ':';
  return (t.since == null ? '' : t.since) + ':' + (t.id == null ? '' : t.id);
}

/* ---------- 蛋 k 的 roll ---------- */
function eggKHash(k, save) {
  return eggHash(trainerSeed(save) + '|egg|' + k + '|0');
}

/* ---------- 一颗蛋是不是闪光 ---------- */
function eggIsShiny(e, save) {
  if (!e || typeof e !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(e, 'shiny')) return !!e.shiny;  // 旧存档
  var threshold = shinyThreshold(e);
  var roll;
  if (typeof e.k === 'number' && Math.floor(e.k) === e.k) {
    roll = eggKHash(e.k, save);  // 新蛋
  } else {
    var key = String(e.uid != null ? e.uid : (e.laidAt != null ? e.laidAt : ''));
    if (!key) return false;
    roll = eggHash(key);  // 旧蛋回退
  }
  return roll < threshold;
}

/* ============================================================================
 * nextShinyInfo — 核心预测函数，原封不动从 nursery-monitor.js 搬来
 * ==========================================================================*/
function nextShinyInfo(save) {
  try {
    var pen = save && save.pension;
    if (!pen) return null;
    var laid = Number.isFinite(pen.laid)
      ? pen.laid
      : ((+save.stats && +save.stats.hatched || 0) + (Array.isArray(pen.eggs) ? pen.eggs.length : 0));
    var goal = Number(pen.eggGoal) || 0;
    var bxNext = !!pen.bx;
    var base = K.SHINY_RATE;
    var parentRate = 1 / 16;
    var mult = 2;

    var pool = [];
    var hasDitto = false;
    try {
      var roster = Array.isArray(pen.mons) ? pen.mons : [];
      for (var pi = 0; pi < roster.length; pi++) {
        var pm = roster[pi] && roster[pi].mon;
        if (!pm) continue;
        var pid = Number(pm.id) || 0;
        if (pid === K.DITTO) { hasDitto = true; continue; }
        if (pm.noEgg || K.NO_EGG.indexOf(pid) >= 0) continue;
        pool.push({ uid: pm.uid, id: pid, shiny: !!pm.shiny, slot: pool.length + 1 });
      }
    } catch (e3) { /* ignore */ }

    function eta(i) { return goal > 0 ? i * goal : 0; }

    function scanFixed(threshold, count, limit, forceBx) {
      var out = [];
      var N0 = pool.length;
      for (var i = 0; i < (limit || 50000) && out.length < count; i++) {
        var th = threshold * (i === 0 && (bxNext || forceBx) ? mult : 1);
        if (eggKHash(laid + i, save) < th) {
          var row = { step: i, k: laid + i, etaMs: eta(i) };
          if (N0) {
            var ix = Math.floor(eggHash(trainerSeed(save) + '|egg|' + (laid + i) + '|1') * N0);
            var pp = pool[ix];
            row.parent = pp ? { id: pp.id, shiny: pp.shiny, slot: pp.slot } : null;
          }
          out.push(row);
        }
      }
      return out;
    }

    function scanPool(count, limit, forceBx) {
      var out = [];
      var N = pool.length;
      for (var i = 0; i < (limit || 20000) && out.length < count; i++) {
        var k = laid + i;
        var th = base;
        if (N) {
          var r1 = eggHash(trainerSeed(save) + '|egg|' + k + '|1');
          var idx = Math.floor(r1 * N);
          var par = pool[idx];
          if (par && par.shiny) th = Math.max(parentRate, base);
        }
        if (i === 0 && (bxNext || forceBx)) th = th * mult;
        if (eggKHash(k, save) < th) {
          var row = { step: i, k: k, etaMs: eta(i), threshold: th };
          if (N) {
            var idx2 = Math.floor(eggHash(trainerSeed(save) + '|egg|' + k + '|1') * N);
            row.parent = pool[idx2] ? { id: pool[idx2].id, shiny: pool[idx2].shiny, slot: pool[idx2].slot } : null;
          }
          out.push(row);
        }
      }
      return out;
    }

    var nextInfo = (function () {
      var k = laid;
      var r0 = eggKHash(k, save);
      var th = base;
      var par = null;
      if (pool.length) {
        var idx = Math.floor(eggHash(trainerSeed(save) + '|egg|' + k + '|1') * pool.length);
        par = pool[idx] || null;
        if (par && par.shiny) th = Math.max(parentRate, base);
      }
      return {
        k: k, roll: r0, threshold: th, thresholdBx: th * mult,
        parent: par ? { id: par.id, shiny: par.shiny, slot: par.slot } : null,
        plainShiny: r0 < th, bxShiny: r0 < th * mult, bxPending: bxNext
      };
    })();

    function scanFlip(th, limit) {
      var out = [];
      var NF = pool.length;
      for (var i = 0; i < 20000 && out.length < limit; i++) {
        var k = laid + i;
        var r = eggKHash(k, save);
        if (r >= th && r < th * mult) {
          var rowF = { step: i, k: k, etaMs: eta(i), threshold: th * mult };
          if (NF) {
            var ixF = Math.floor(eggHash(trainerSeed(save) + '|egg|' + k + '|1') * NF);
            var ppF = pool[ixF];
            rowF.parent = ppF ? { id: ppF.id, shiny: ppF.shiny, slot: ppF.slot } : null;
          }
          out.push(rowF);
        }
      }
      return out;
    }

    var flipShinyList = scanFlip(Math.max(parentRate, base), 10);
    var flipPlainList = scanFlip(base, 10);
    var poolList = scanPool(10, 20000);
    var berryPoolList = scanPool(10, 20000, true);
    var shinyList = scanFixed(Math.max(parentRate, base), 10, 20000);
    var plainList = scanFixed(base, 3, 50000);

    return {
      laid: laid, bx: bxNext, poolSize: pool.length, poolShiny: pool.filter(function (p) { return p.shiny; }).length,
      pool: pool, hasDitto: hasDitto, next: nextInfo,
      shinyList: shinyList, plainList: plainList,
      poolList: poolList, flipList: flipPlainList, flipShinyList: flipShinyList,
      berryPoolList: berryPoolList,
      shiny: shinyList[0] || null, plain: plainList[0] || null, poolFirst: poolList[0] || null
    };
  } catch (e) { /* ignore */ }
  return null;
}

/* ---------- 存档读取（localStorage，零网络） ---------- */
var SAVE_KEY = 'gachamon-save-v1';
var saveCache = { at: 0, data: null };
function readSave(force) {
  if (!force && Date.now() - saveCache.at < 900) return saveCache.data;
  var data = null;
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) { data = null; }
  saveCache = { at: Date.now(), data: data };
  return data;
}

/* ---------- 面板持久化（GM_setValue 替代 chrome.storage.local） ---------- */
function storeGet(key) {
  try { return GM_getValue(key, null); } catch (e) { return null; }
}
function storeSet(key, val) {
  try { GM_setValue(key, val); } catch (e) { /* ignore */ }
}

/* ============================================================================
 * 面板 UI — 独立浮窗，零游戏 DOM 依赖（不需要在培育屋页面）
 * ==========================================================================*/

/* ---------- 样式 ---------- */
GM_addStyle([
  '#pcg-efh { position: fixed; top: 80px; right: 16px; width: 320px; max-height: 85vh;',
  '  overflow: hidden; border-radius: 10px; background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,.15);',
  '  font-size: 12.5px; font-family: -apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;',
  '  color: #1b1f24; z-index: 99999; display: flex; flex-direction: column; }',
  '#pcg-efh.pcg-dark { background: #161a20; color: #e6e9ef; box-shadow: 0 4px 18px rgba(0,0,0,.5); }',
  '#pcg-efh.dragging { opacity: .85; user-select: none; }',
  '#pcg-efh .pcg-head { display: flex; align-items: center; gap: 6px; padding: 8px 10px;',
  '  border-bottom: 1px solid #e4e6ea; cursor: move; user-select: none; background: #fafbfc; }',
  '#pcg-efh.pcg-dark .pcg-head { border-color: #2a2f38; background: #0f1216; }',
  '#pcg-efh .pcg-head .pcg-title { font-weight: 700; font-size: 13px; flex: 1; }',
  '#pcg-efh .pcg-head button { background: transparent; border: none; cursor: pointer; padding: 2px 6px;',
  '  border-radius: 4px; color: inherit; font-size: 14px; line-height: 1; }',
  '#pcg-efh .pcg-head button:hover { background: rgba(0,0,0,.08); }',
  '#pcg-efh.pcg-dark .pcg-head button:hover { background: rgba(255,255,255,.1); }',
  '#pcg-efh .pcg-body { padding: 10px; overflow-y: auto; flex: 1; }',
  '#pcg-efh .pcg-body.folded { display: none; }',
  '#pcg-efh .pcg-sec { margin-bottom: 12px; }',
  '#pcg-efh .pcg-sec-title { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;',
  '  color: #5a616b; margin-bottom: 6px; }',
  '#pcg-efh.pcg-dark .pcg-sec-title { color: #9aa3af; }',
  '#pcg-efh .pcg-row { display: flex; justify-content: space-between; align-items: baseline; padding: 3px 0;',
  '  border-bottom: 1px dashed #e4e6ea; }',
  '#pcg-efh.pcg-dark .pcg-row { border-color: #2a2f38; }',
  '#pcg-efh .pcg-row:last-child { border-bottom: none; }',
  '#pcg-efh .pcg-k { font-family: "SF Mono",Menlo,Consolas,monospace; font-size: 11px; color: #5a616b; }',
  '#pcg-efh.pcg-dark .pcg-k { color: #9aa3af; }',
  '#pcg-efh .pcg-val { font-variant-numeric: tabular-nums; }',
  '#pcg-efh .pcg-shiny-badge { display: inline-block; padding: 0 5px; border-radius: 4px; background: linear-gradient(135deg,#fef3c7,#fde68a);',
  '  color: #92400e; font-size: 11px; font-weight: 600; margin-left: 4px; }',
  '#pcg-efh.pcg-dark .pcg-shiny-badge { background: linear-gradient(135deg,#78350f,#92400e); color: #fde68a; }',
  '#pcg-efh .pcg-parent-badge { font-size: 11px; padding: 0 4px; border-radius: 3px; background: #e0f2fe; color: #075985; margin-left: 4px; }',
  '#pcg-efh.pcg-dark .pcg-parent-badge { background: #0c4a6e; color: #7dd3fc; }',
  '#pcg-efh .pcg-bar { height: 4px; background: #e4e6ea; border-radius: 2px; overflow: hidden; margin-top: 2px; }',
  '#pcg-efh.pcg-dark .pcg-bar { background: #2a2f38; }',
  '#pcg-efh .pcg-bar > div { height: 100%; background: #2563eb; border-radius: 2px; transition: width .3s; }',
  '#pcg-efh .pcg-bar.pcg-shiny > div { background: #f59e0b; }',
  '#pcg-efh .pcg-footer { padding: 6px 10px; border-top: 1px solid #e4e6ea; font-size: 11px; color: #5a616b;',
  '  display: flex; justify-content: space-between; gap: 8px; }',
  '#pcg-efh.pcg-dark .pcg-footer { border-color: #2a2f38; color: #9aa3af; }',
  '#pcg-efh .pcg-footer button { background: transparent; border: none; cursor: pointer; color: inherit; font-size: 11px; }',
  '#pcg-efh .pcg-footer button:hover { text-decoration: underline; }',
  '#pcg-efh .pcg-bx-note { font-size: 11px; color: #059669; margin-top: 6px; padding: 4px 6px;',
  '  border-radius: 4px; background: rgba(5,150,105,.1); }',
  '#pcg-efh.pcg-dark .pcg-bx-note { color: #34d399; background: rgba(52,211,153,.15); }',
  '#pcg-efh .pcg-empty { color: #9aa3af; font-size: 12px; padding: 8px 0; text-align: center; }',
  '#pcg-efh .pcg-err { color: #dc2626; font-size: 12px; padding: 8px 0; text-align: center; }',
  '#pcg-efh .pcg-roll { font-family: "SF Mono",Menlo,Consolas,monospace; font-size: 10.5px; color: #5a616b; }',
  '#pcg-efh.pcg-dark .pcg-roll { color: #9aa3af; }'
].join('\n'));

/* ---------- 创建面板 ---------- */
function createPanel() {
  var el = document.createElement('div');
  el.id = 'pcg-efh';
  el.innerHTML = [
    '<div class="pcg-head" id="pcg-efh-head">',
    '  <span class="pcg-title">🥚 闪光蛋预测</span>',
    '  <button id="pcg-efh-fold" title="折叠/展开">▾</button>',
    '  <button id="pcg-efh-theme" title="主题">◐</button>',
    '  <button id="pcg-efh-close" title="关闭">✕</button>',
    '</div>',
    '<div class="pcg-body" id="pcg-efh-body"></div>',
    '<div class="pcg-footer">',
    '  <span id="pcg-efh-stat">—</span>',
    '  <button id="pcg-efh-refresh">刷新</button>',
    '</div>'
  ].join('');
  document.documentElement.appendChild(el);

  /* 折叠状态 */
  var folded = storeGet('folded');
  if (folded) {
    el.classList.add('folded');
    el.querySelector('.pcg-body').classList.add('folded');
    el.querySelector('#pcg-efh-fold').textContent = '▴';
  }

  /* 主题 */
  var theme = storeGet('theme');
  if (!theme) theme = (matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  if (theme === 'dark') el.classList.add('pcg-dark');

  /* 位置 */
  var pos = storeGet('pos');
  if (pos && typeof pos.left === 'number') {
    el.style.left = pos.left + 'px';
    el.style.top = pos.top + 'px';
    el.style.right = 'auto';
  }

  /* 事件绑定 */
  el.querySelector('#pcg-efh-fold').addEventListener('click', function () {
    el.querySelector('.pcg-body').classList.toggle('folded');
    var f = el.querySelector('.pcg-body').classList.contains('folded');
    storeSet('folded', f);
    el.querySelector('#pcg-efh-fold').textContent = f ? '▴' : '▾';
  });
  el.querySelector('#pcg-efh-theme').addEventListener('click', function () {
    el.classList.toggle('pcg-dark');
    storeSet('theme', el.classList.contains('pcg-dark') ? 'dark' : 'light');
  });
  el.querySelector('#pcg-efh-close').addEventListener('click', function () {
    el.remove();
    storeSet('closed', Date.now());
  });
  el.querySelector('#pcg-efh-refresh').addEventListener('click', function () { saveCache.at = 0; paint(); });

  /* 拖动 */
  (function drag() {
    var head = el.querySelector('#pcg-efh-head');
    var offX = 0, offY = 0, dragging = false;
    head.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      el.classList.add('dragging');
      var rect = el.getBoundingClientRect();
      offX = e.clientX - rect.left;
      offY = e.clientY - rect.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var x = Math.max(4, Math.min(window.innerWidth - el.offsetWidth - 4, e.clientX - offX));
      var y = Math.max(4, Math.min(window.innerHeight - 4, e.clientY - offY));
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.right = 'auto';
    });
    document.addEventListener('mouseup', function () {
      if (dragging) {
        dragging = false;
        el.classList.remove('dragging');
        storeSet('pos', { left: parseInt(el.style.left), top: parseInt(el.style.top) });
      }
    });
  })();

  return el;
}

/* ---------- 渲染一行候选 ---------- */
function renderRow(row, threshold, label) {
  var rollStr = row.k != null ? 'k=' + row.k : '';
  var rollVal = row.roll != null ? (row.roll < 0.001 ? row.roll.toFixed(4) : row.roll.toFixed(3)) : '';
  var thStr = threshold != null ? ('<span class="pcg-roll">阈值 ' + (threshold < 0.001 ? threshold.toFixed(4) : threshold.toFixed(3)) + '</span>') : '';
  var parentStr = row.parent
    ? ('<span class="pcg-parent-badge" title="亲代">' + (row.parent.shiny ? '✦' : '') + '#' + row.parent.id + '·槽' + row.parent.slot + '</span>')
    : '';
  var etaStr = row.etaMs != null && row.etaMs > 0 ? (' ' + fmtDur(row.etaMs)) : (row.step === 0 ? '（下一颗）' : '');
  var pct = row.threshold ? Math.min(100, row.threshold * 500) : 50;  // 仅展示用
  var shinyBar = label && label.indexOf('闪') >= 0 ? 'pcg-shiny' : '';
  return '' +
    '<div class="pcg-row">' +
    '  <div>' +
    '    <span class="pcg-k">#' + row.step + ' ' + rollStr + '</span>' + parentStr +
    '    <div class="pcg-roll">' + rollStr + (rollVal ? ' roll=' + rollVal : '') + ' ' + thStr + '</div>' +
    '    <div class="pcg-bar ' + shinyBar + '"><div style="width:' + pct + '%"></div></div>' +
    '  </div>' +
    '  <div class="pcg-val">' + etaStr + '</div>' +
    '</div>';
}

/* ---------- 主渲染 ---------- */
function paint() {
  var panel = document.getElementById('pcg-efh');
  if (!panel) return;
  var body = panel.querySelector('.pcg-body');
  var footer = panel.querySelector('#pcg-efh-stat');

  var save = readSave();
  if (!save) {
    body.innerHTML = '<div class="pcg-err">读不到游戏存档，请先打开游戏页并登录</div>';
    footer.textContent = '未连接';
    return;
  }

  var pen = save.pension || {};
  var info = nextShinyInfo(save);

  if (!info) {
    body.innerHTML = '<div class="pcg-err">存档 pension 字段缺失</div>';
    footer.textContent = '存档不兼容';
    return;
  }

  var html = '';

  /* 顶部：下一颗蛋 */
  var ni = info.next;
  var bxLabel = info.bx ? '<span class="pcg-shiny-badge">✨ 下一颗已喂靛莓果</span>' : '';
  var rollCompare = ni.plainShiny
    ? '<span class="pcg-shiny-badge">🌟 就是闪光！</span>'
    : (ni.bxShiny ? '<span class="pcg-shiny-badge">🫐 吃果后闪光</span>' : '');
  html += '<div class="pcg-sec"><div class="pcg-sec-title">下一颗蛋（k=' + ni.k + '）' + bxLabel + '</div>';
  html += '<div class="pcg-row"><div><span class="pcg-k">roll ' + (ni.roll < 0.001 ? ni.roll.toFixed(5) : ni.roll.toFixed(4)) + '</span>';
  html += '<span class="pcg-parent-badge">' + (ni.parent ? ((ni.parent.shiny ? '✦' : '') + '#' + ni.parent.id + '·槽' + ni.parent.slot) : '无亲代') + '</span>';
  html += rollCompare;
  html += '</div><div class="pcg-val"><span class="pcg-roll">th=' + ni.threshold.toFixed(4) + '</span></div></div>';
  if (info.poolShiny > 0) {
    html += '<div class="pcg-bx-note">⚠️ 亲代池里有 ' + info.poolShiny + ' 只闪光，阈值走 1/16 档</div>';
  }
  html += '</div>';

  /* 三类闪光候选 */
  html += '<div class="pcg-sec"><div class="pcg-sec-title">🌟 闪光亲代能出 (' + info.shinyList.length + ')</div>';
  if (info.shinyList.length) {
    for (var i = 0; i < info.shinyList.length; i++) {
      html += renderRow(info.shinyList[i], 1/16, 'shiny');
    }
  } else { html += '<div class="pcg-empty">50000 颗内未命中</div>'; }
  html += '</div>';

  html += '<div class="pcg-sec"><div class="pcg-sec-title">普通亲代能出 (' + info.plainList.length + ')</div>';
  if (info.plainList.length) {
    for (var j = 0; j < info.plainList.length; j++) {
      html += renderRow(info.plainList[j], 1/512, 'plain');
    }
  } else { html += '<div class="pcg-empty">50000 颗内未命中</div>'; }
  html += '</div>';

  html += '<div class="pcg-sec"><div class="pcg-sec-title">🫐 吃果才会闪 (' + info.flipList.length + ')</div>';
  if (info.flipList.length) {
    for (var f = 0; f < info.flipList.length; f++) {
      html += renderRow(info.flipList[f], info.flipList[f].threshold, 'flip');
    }
  } else { html += '<div class="pcg-empty">2000 颗内未命中</div>'; }
  html += '</div>';

  /* 亲代池概览 */
  html += '<div class="pcg-sec"><div class="pcg-sec-title">亲代池 (' + info.poolSize + ' 只)</div>';
  if (info.pool.length) {
    html += '<div class="pcg-row"><div>';
    for (var p = 0; p < info.pool.length; p++) {
      var pp = info.pool[p];
      html += '<span class="pcg-parent-badge" style="margin-right:4px">' + (pp.shiny ? '✦' : '') + '#' + pp.id + '</span>';
    }
    html += '</div></div>';
  } else { html += '<div class="pcg-empty">没有可繁殖亲代（百变怪不算）</div>'; }
  html += '</div>';

  body.innerHTML = html;
  footer.textContent = 'laid=' + info.laid + ' · 每秒刷新';
}

/* ---------- 启动 ---------- */
if (storeGet('closed') && Date.now() - storeGet('closed') < 60 * 60 * 1000) {
  /* 用户 1 小时内刚关过，先不自动弹出 */
  // 但还是启动计算循环，让用户手动刷新时能看到
}

var panel = createPanel();
paint();
setInterval(paint, 1000);

})();
