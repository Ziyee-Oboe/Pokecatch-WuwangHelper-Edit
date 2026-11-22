/* Poke'Catch 防掉线助手 —— 游戏图鉴页「未捕捉」筛选（第六批）
 *
 * 需求：在游戏自己的图鉴筛选条上，紧挨「异色」(#dex-shiny) 增加一个「未捕捉」按钮。
 *   「未捕捉」= 存档 dex[id] 里没有任何记录：
 *     · 已拥有 (caught)          → 排除
 *     · 不再拥有 (lost)          → 排除（这是和游戏自带「未收集」最大的区别）
 *     · 见过 (seen) / 没见过     → 保留
 *     · 传说 / 幻兽              → 排除（获取方式特殊，不进自动捕捉业务）
 *
 * 兼容性做法（很重要）：游戏内部 Ue = { q, status, types, regions, shiny } 是闭包变量，
 * 外部拿不到，筛选函数 V(T,de) 也是私有的。所以这里**不改游戏状态、不覆盖 hidden**，
 * 只在游戏每次渲染之后，对应该隐藏的 .dex-cell 叠加一个 CSS class：
 *   · 游戏说要显示的 ∩ 我们说要显示的 = 最终显示（天然兼容搜索 / 状态 / 属性 / 地区 / 异色）
 *   · 关掉开关时把 class 全部摘掉，页面立刻恢复原样
 * DOM 用 MutationObserver 观察，游戏重建节点或改 hidden 都会重新叠加。
 *
 * 数据边界：只读页面 localStorage 里的游戏存档、只读 DOM；不写游戏存档、不拦请求。
 * 开关状态写在扩展自己的 chrome.storage.local。
 */
(function (root) {
  'use strict';

  var CFG = root.PCG_CONFIG || null;
  var DATA = root.PCG_DEX_DATA || null;
  var SAVE_KEY = (CFG && CFG.SAVE_KEY) || 'gachamon-save-v1';
  var STORE_KEY = 'pcgDexFilterV1';
  var BTN_ID = 'pcg-dex-uncaught';
  var CSS_ID = 'pcg-dex-filter-css';
  var HIDE_CLS = 'pcg-uncaught-off';

  function sel(key, fallback) {
    var v = (CFG && typeof CFG.sel === 'function') ? CFG.sel(key) : '';
    return v || fallback;
  }
  var Q = {
    shiny: sel('dexShinyBtn', '#dex-shiny'),
    status: sel('dexStatusBtn', '#dex-status-btn'),
    filters: sel('dexFilters', '.dex-filters'),
    list: sel('dexRegionList', '#dex-regions'),
    cell: sel('dexCellById', '.dex-cell[data-id]')
  };

  var S = {
    on: false,
    loaded: false,
    applying: false,
    button: null,
    cells: 0,
    hidden: 0,
    uncaught: 0,
    specials: 0,
    dexAt: 0,
    dex: null,
    raw: ''
  };

  var mo = null;
  var pending = 0;

  function q(s, r) {
    try { return (r || document).querySelector(s); } catch (e) { return null; }
  }
  function qa(s, r) {
    try { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    catch (e) { return []; }
  }
  function num(v) { var n = parseInt(v, 10); return isFinite(n) ? n : 0; }

  /* ---------------- 存档（只读，1 秒缓存） ---------------- */
  function readDex() {
    var at = Date.now();
    if (S.dex && at - S.dexAt < 1000) return S.dex;
    var SAVE = (typeof root !== 'undefined' && root && root.PCG_SAVE) ||
      (typeof window !== 'undefined' && window.PCG_SAVE) || null;
    if (SAVE) {
      var sv = SAVE.read();
      S.dex = (sv && sv.dex && typeof sv.dex === 'object') ? sv.dex : {};
      S.raw = SAVE.raw() || '';
      S.dexAt = at;
      return S.dex;
    }
    var raw = '';
    try { raw = localStorage.getItem(SAVE_KEY) || ''; } catch (e) { raw = ''; }
    if (raw === S.raw && S.dex) { S.dexAt = at; return S.dex; }
    S.raw = raw;
    var dex = {};
    try {
      var save = raw ? JSON.parse(raw) : null;
      dex = (save && save.dex && typeof save.dex === 'object') ? save.dex : {};
    } catch (e) { dex = {}; }
    S.dex = dex;
    S.dexAt = at;
    return dex;
  }
  function isSpecial(id) {
    try { return !!(DATA && typeof DATA.isSpecial === 'function' && DATA.isSpecial(id)); }
    catch (e) { return false; }
  }
  function uncaught(id, dex) {
    return !dex[id] && !isSpecial(id);
  }

  /* ---------------- 样式 / 按钮 ----------------
   * 启用态要和游戏「异色」(#dex-shiny) 的 .on 一样金色高亮。
   * 游戏的 .chip / .btn / .ghost 样式优先级很高，所以：
   *   1) 同时挂游戏同款 on class 和自己的 is-on class；
   *   2) 金色规则全部加 !important；
   *   3) paintButton() 再写一层内联 !important 兜底（内联优先级最高）。
   * 亮 / 暗主题各一套配色，暗色由 matchMedia 判断（2.5 秒轮询会自动跟随系统切换）。 */
  function darkMode() {
    try {
      return !!(root.matchMedia && root.matchMedia('(prefers-color-scheme:dark)').matches);
    } catch (e) { return false; }
  }
  function gold(dark) {
    return dark ? {
      bg: 'linear-gradient(135deg,#8a6114,#c9941f 55%,#6a4a0d)',
      fg: '#fff6d5', bd: '#e0b451',
      sh: '0 0 0 1px rgba(224,180,81,.5),0 2px 10px rgba(240,170,30,.35)',
      cntBg: 'rgba(255,246,213,.2)', cntFg: '#fff6d5'
    } : {
      bg: 'linear-gradient(135deg,#ffdf85,#f2a91f 55%,#ffe9a8)',
      fg: '#4a2c00', bd: '#c98616',
      sh: '0 0 0 1px rgba(201,134,22,.45),0 2px 10px rgba(240,170,30,.55)',
      cntBg: 'rgba(74,44,0,.18)', cntFg: '#4a2c00'
    };
  }

  function injectCss() {
    if (q('#' + CSS_ID)) return;
    var st;
    try { st = document.createElement('style'); } catch (e) { return; }
    if (!st) return;
    st.id = CSS_ID;
    var B = '#' + BTN_ID;
    var ON = B + '.on,' + B + '.is-on';
    st.textContent = [
      '.dex-cell.' + HIDE_CLS + '{display:none!important}',
      B + '{white-space:nowrap;color:#8a5c00;background:#fff5d8;border-color:#d3a13f}',
      /* 小图标直接用游戏自己的 assets/ui/sparkle.svg；取不到时退回 CSS 圆点 */
      B + ' .pcg-ico{display:inline-block;width:11px;height:11px;margin-right:5px;vertical-align:-1px;',
      '  object-fit:contain;opacity:.35}',
      B + ' i.pcg-ico{border-radius:50%;',
      '  background:radial-gradient(circle at 35% 30%,#fff6c9,#e0a52b 60%,#a86a09);',
      '  box-shadow:0 0 0 1px rgba(160,110,20,.45)}',
      B + ' .pcg-cnt{display:inline-block;margin-left:5px;padding:0 5px;',
      '  border-radius:7px;background:rgba(138,92,0,.14);color:#8a5c00;',
      '  font-size:.85em;font-weight:700}',
      ON + '{',
      '  background:linear-gradient(135deg,#ffdf85,#f2a91f 55%,#ffe9a8)!important;',
      '  color:#4a2c00!important;',
      '  border:1px solid #c98616!important;',
      '  box-shadow:0 0 0 1px rgba(201,134,22,.45),0 2px 10px rgba(240,170,30,.55)!important;',
      '  text-shadow:0 1px 0 rgba(255,255,255,.45)}',
      ON + ' .pcg-ico{opacity:1;',
      '  filter:drop-shadow(0 0 3px rgba(255,196,60,.95))}',
      ON + ' i.pcg-ico{box-shadow:0 0 0 1px #a86a09,0 0 7px 2px rgba(255,196,60,.9)}',
      ON + ' .pcg-cnt{background:rgba(74,44,0,.18)!important;color:#4a2c00!important}',
      '@media (prefers-color-scheme:dark){',
      '  ' + B + '{background:#3a2c0c;color:#ffd979;border-color:#a5791f}',
      '  ' + B + ' .pcg-cnt{background:rgba(255,217,121,.18);color:#ffd979}',
      '  ' + ON + '{',
      '    background:linear-gradient(135deg,#8a6114,#c9941f 55%,#6a4a0d)!important;',
      '    color:#fff6d5!important;border-color:#e0b451!important;',
      '    box-shadow:0 0 0 1px rgba(224,180,81,.5),0 2px 10px rgba(240,170,30,.35)!important}',
      '  ' + ON + ' .pcg-cnt{background:rgba(255,246,213,.2)!important;color:#fff6d5!important}',
      '}'
    ].join('');
    try { (document.head || document.body || document.documentElement).appendChild(st); }
    catch (e) { /* ignore */ }
  }

  function clickBtn(ev) {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    set(!S.on);
  }

  function ensureButton() {
    var found = q('#' + BTN_ID);
    if (found) { S.button = found; return found; }
    var anchor = q(Q.shiny) || q(Q.status) || q(Q.filters);
    if (!anchor) return null;
    var btn;
    try { btn = document.createElement('button'); } catch (e) { return null; }
    if (!btn) return null;
    try {
      btn.id = BTN_ID;
      btn.type = 'button';
      btn.className = 'chip btn small ghost';
      btn.setAttribute('title',
        '未捕捉：只显示从未捕获过的宝可梦（排除「不再拥有」；传说 / 幻兽获取方式特殊，单列不纳入自动捕捉）');
      btn.setAttribute('aria-label', '未捕捉');
      var sparkle = (root.PCG_GAME_UI && typeof root.PCG_GAME_UI.icon === 'function')
        ? root.PCG_GAME_UI.icon('sparkle') : '';
      btn.innerHTML = (sparkle
          ? '<img class="pcg-ico" aria-hidden="true" alt="" src="' + sparkle + '">'
          : '<i class="pcg-ico" aria-hidden="true"></i>') +
        '<span class="chip-l">未捕捉</span><span class="pcg-cnt"></span>';
      btn.addEventListener('click', clickBtn);
      var parent = anchor.parentNode;
      if (parent && typeof parent.insertBefore === 'function') {
        parent.insertBefore(btn, anchor.nextSibling || null);
      } else if (parent && typeof parent.appendChild === 'function') {
        parent.appendChild(btn);
      }
    } catch (e) { return null; }
    S.button = btn;
    return btn;
  }

  function paintButton() {
    /* 优先取页面上的按钮：游戏重建筛选条后，S.button 可能指向已被摘掉的旧节点 */
    var btn = q('#' + BTN_ID) || S.button;
    if (!btn) return;
    S.button = btn;
    var p = gold(darkMode());
    if (btn.classList && typeof btn.classList.toggle === 'function') {
      try {
        btn.classList.toggle('is-on', !!S.on);
        btn.classList.toggle('on', !!S.on);   // 与游戏 #dex-shiny 启用态同一个 class
      } catch (e) { /* ignore */ }
    }
    try { btn.setAttribute('aria-pressed', S.on ? 'true' : 'false'); } catch (e) { /* ignore */ }

    /* 内联 !important 兜底：即使游戏 CSS 后加载或用了 !important，金色高亮依然生效 */
    if (btn.style && typeof btn.style.setProperty === 'function' &&
        typeof btn.style.removeProperty === 'function') {
      try {
        if (S.on) {
          btn.style.setProperty('background', p.bg, 'important');
          btn.style.setProperty('color', p.fg, 'important');
          btn.style.setProperty('border-color', p.bd, 'important');
          btn.style.setProperty('border-style', 'solid', 'important');
          btn.style.setProperty('box-shadow', p.sh, 'important');
        } else {
          ['background', 'color', 'border-color', 'border-style', 'box-shadow']
            .forEach(function (k) { btn.style.removeProperty(k); });
        }
      } catch (e) { /* ignore */ }
    }

    var badge = q('.pcg-cnt', btn);
    if (badge) {
      try {
        badge.textContent = S.on ? String(S.uncaught) : '';
        if (badge.style && typeof badge.style.setProperty === 'function') {
          if (S.on) {
            badge.style.setProperty('background', p.cntBg, 'important');
            badge.style.setProperty('color', p.cntFg, 'important');
          } else {
            badge.style.removeProperty('background');
            badge.style.removeProperty('color');
          }
        }
      } catch (e) { /* ignore */ }
    }
    try {
      btn.title = S.on
        ? '未捕捉已开启：共 ' + S.uncaught + ' 只（已排除不再拥有 / 传说 / 幻兽）；再点一次关闭'
        : '未捕捉：只显示从未捕获过的宝可梦（排除「不再拥有」；传说 / 幻兽不纳入自动捕捉）';
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 核心：叠加隐藏 ----------------
   * 只加 / 摘自己的 class，绝不写 hidden、绝不改游戏渲染出的其它属性。 */
  function apply() {
    if (S.applying) return;
    S.applying = true;
    try { if (mo && typeof mo.disconnect === 'function') mo.disconnect(); }
    catch (e) { /* ignore */ }
    try {
      ensureButton();
      injectCss();
      var dex = readDex();
      var host = q(Q.list) || document;
      var cells = qa(Q.cell, host);
      var hidden = 0, kept = 0, specials = 0;
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        var id = num(c && typeof c.getAttribute === 'function' ? c.getAttribute('data-id') : 0);
        if (!id) continue;
        if (isSpecial(id)) specials++;
        var keep = uncaught(id, dex);
        if (keep) kept++;
        var needHide = !!S.on && !keep;
        if (needHide) hidden++;
        if (c.classList) {
          try {
            if (needHide) c.classList.add(HIDE_CLS);
            else c.classList.remove(HIDE_CLS);
          } catch (e) { /* ignore */ }
        }
      }
      S.cells = cells.length;
      S.hidden = hidden;
      S.uncaught = kept;
      S.specials = specials;
      paintButton();
    } finally {
      try { if (mo && typeof mo.takeRecords === 'function') mo.takeRecords(); } catch (e) { /* ignore */ }
      observe(true);
      S.applying = false;
    }
  }

  function observe(force) {
    if (mo && !force) return;
    if (typeof root.MutationObserver !== 'function') return;
    var target = document.body || document.documentElement;
    if (!target) return;
    try {
      if (!mo) mo = new root.MutationObserver(function () { schedule(); });
      mo.observe(target, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['hidden', 'class', 'data-id']
      });
    } catch (e) { mo = null; }
  }

  function schedule() {
    if (pending) return;
    pending = root.setTimeout(function () {
      pending = 0;
      if (!S.applying) apply();
    }, 120);
  }

  /* ---------------- 对外 API ---------------- */
  function storeSet(on) {
    var o = {};
    o[STORE_KEY] = { on: !!on };
    try { chrome.storage.local.set(o, function () { void chrome.runtime.lastError; }); }
    catch (e) { /* ignore */ }
  }
  function set(on) {
    S.on = !!on;
    storeSet(S.on);
    try { apply(); } catch (e) { /* ignore */ }
    if (root.PCG_LOG && typeof root.PCG_LOG.push === 'function') {
      try {
        root.PCG_LOG.push('info', 'dex',
          S.on ? '图鉴「未捕捉」筛选已开启' : '图鉴「未捕捉」筛选已关闭');
      } catch (e) { /* ignore */ }
    }
    return state();
  }
  function toggle() { return set(!S.on); }
  function state() {
    return {
      on: !!S.on,
      button: !!(S.button || q('#' + BTN_ID)),
      ready: !!(q(Q.list) || q(Q.filters) || q(Q.shiny)),
      cells: S.cells,
      hidden: S.hidden,
      uncaught: S.uncaught,
      specials: S.specials,
      build: DATA ? DATA.build : '',
      note: S.on
        ? '已隐藏已捕捉 / 不再拥有 / 传说幻兽，剩余 ' + S.uncaught + ' 只'
        : '未开启'
    };
  }

  root.PCG_DEX_FILTER = {
    state: state, set: set, toggle: toggle, apply: apply,
    util: {
      uncaught: uncaught, isSpecial: isSpecial, readDex: readDex
    },
    CFG_KEY: STORE_KEY,
    HIDE_CLS: HIDE_CLS,
    BTN_ID: BTN_ID
  };

  /* ---------------- 启动 ----------------
   * document_start 时游戏 DOM 还没渲染，靠 MutationObserver + 2 秒兜底轮询把按钮挂上去。 */
  try {
    chrome.storage.local.get(STORE_KEY, function (v) {
      var rec = v && v[STORE_KEY];
      // 第八批：「未捕捉」筛选默认打开；只有玩家明确关过才保持关。
      // 页面设置（settings.dexFilterOn）是最终权威，content 启动时会再对齐一次。
      S.on = rec ? !!rec.on : true;
      if (!rec) storeSet(true);
      S.loaded = true;
      try { apply(); } catch (e) { /* ignore */ }
    });
  } catch (e) { S.loaded = true; S.on = true; }
  try { observe(false); } catch (e) { /* ignore */ }
  try {
    root.setInterval(function () {
      if (!S.applying) { ensureButton(); apply(); }
    }, 2500);
  } catch (e) { /* ignore */ }
})(typeof window !== 'undefined' ? window : this);
