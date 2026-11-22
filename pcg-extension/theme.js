/* Poke'Catch 防掉线助手 —— 外观主题（唯一数据源）
 *
 * Chrome 不向普通扩展暴露工具栏/窗口的 RGB 色（theme.getCurrent 是 Firefox 的 API），
 * 所以这里用浏览器原生的两条通道来贴合浏览器背景：
 *   1. CSS 系统色 Canvas / CanvasText —— popup 的 body 直接取浏览器窗口底色；
 *   2. prefers-color-scheme + color-scheme —— 明暗切换，滚动条、输入框、单选框等
 *      原生控件由浏览器自己画，颜色天然和浏览器一致。
 * 另外提供「跟随浏览器 / 浅色 / 深色」三态手动覆盖，偏好存扩展自己的存储。
 *
 * 同一份文件被 popup.html 和 content_scripts（隔离世界）加载：
 *   - 扩展页：用 localStorage 同步缓存，首帧不闪白/闪黑；
 *   - 游戏页：绝不碰页面 localStorage（避免污染游戏域名），只读扩展存储。
 */
(function (root) {
  'use strict';

  var STORE_KEY = 'pcgThemeV1';
  var MODES = ['auto', 'light', 'dark'];
  var MODE_TEXT = { auto: '跟随浏览器', light: '浅色', dark: '深色' };
  var MODE_ICON = { auto: '◐', light: '☀', dark: '☾' };

  var doc = root.document;
  var isExtPage = false;
  try { isExtPage = /^chrome-extension:/.test(root.location.protocol); } catch (e) { /* ignore */ }

  var mode = 'auto';
  var listeners = [];

  function norm(v) {
    return MODES.indexOf(v) >= 0 ? v : 'auto';
  }

  function systemDark() {
    try {
      return !!(root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) {
      return false;
    }
  }

  function scheme() {
    return mode === 'auto' ? (systemDark() ? 'dark' : 'light') : mode;
  }

  function readSync() {
    if (!isExtPage) return 'auto';
    try { return norm(root.localStorage.getItem(STORE_KEY)); } catch (e) { return 'auto'; }
  }

  function readStore(cb) {
    try {
      if (!root.chrome || !chrome.storage || !chrome.storage.local) { cb(); return; }
      chrome.storage.local.get(STORE_KEY, function (o) {
        void (root.chrome.runtime && root.chrome.runtime.lastError);
        var v = o && o[STORE_KEY];
        if (v) {
          mode = norm(v);
          if (isExtPage) {
            try { root.localStorage.setItem(STORE_KEY, mode); } catch (e2) { /* ignore */ }
          }
        }
        cb();
      });
    } catch (e) { cb(); }
  }

  function paintButton() {
    if (!isExtPage || !doc || typeof doc.getElementById !== 'function') return;
    var btn = doc.getElementById('theme-btn');
    if (!btn) return;
    var m = mode;
    btn.setAttribute('data-mode', m);
    btn.textContent = MODE_ICON[m];
    btn.title = '外观：' + MODE_TEXT[m] + '（点击切换）';
    btn.setAttribute('aria-label', btn.title);
  }

  function paint() {
    var sc = scheme();
    var el = doc && doc.documentElement;
    // 只改扩展自己的页面，不给游戏页 <html> 挂属性
    if (el && isExtPage) {
      el.setAttribute('data-scheme', sc);
      el.setAttribute('data-theme-mode', mode);
      try { if (el.style) el.style.colorScheme = sc; } catch (e) { /* 非浏览器环境 */ }
    }
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](sc, mode); } catch (e) { /* ignore */ }
    }
    if (isExtPage) paintButton();
  }

  function set(m) {
    mode = norm(m);
    if (isExtPage) {
      try { root.localStorage.setItem(STORE_KEY, mode); } catch (e) { /* ignore */ }
    }
    try {
      var out = {};
      out[STORE_KEY] = mode;
      chrome.storage.local.set(out, function () {
        void (root.chrome.runtime && root.chrome.runtime.lastError);
      });
    } catch (e) { /* 存储不可用时本次会话内仍生效 */ }
    paint();
  }

  function cycle() {
    set(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
  }

  function onChange(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  /* 游戏页内注入的悬浮面板（Shadow DOM）用的配色。
   * 这些颜色直接写到 host 的 inline style 上，Shadow DOM 和普通 DOM 两种降级路径都能继承。
   * dark / light 两组的键必须完全一致，tools/verify.mjs 会检查。 */
  var VARS = {
    dark: {
      'pnl-bg1': '#191c26',
      'pnl-bg2': '#12141c',
      'pnl-border': '#303748',
      'pnl-shadow': 'rgba(0,0,0,.55)',
      'pnl-text': '#e8ecf4',
      'hd-bg': 'rgba(255,255,255,.03)',
      'hd-line': '#262c3a',
      'tabs-bg': '#0d0f16',
      'tb-text': '#8b93a7',
      'tb-on-bg': '#2b3242',
      'tb-on-text': '#ffd76a',
      'sub-text': '#cfd7e8',
      'gold': '#ffd76a',
      'fold-bg': '#222838',
      'fold-text': '#9aa4b8',
      /* 第五十一批：顶栏那个 × 悬停时的红底 */
      'cls-bg': '#c0392b',
      'row-top1': 'rgba(255,203,5,.15)',
      'row-top2': 'rgba(255,203,5,.02)',
      'row-line': 'rgba(255,255,255,.05)',
      'spr-no': '#1e232f',
      'lv-text': '#8b93a7',
      'mvn-text': '#c3cbdc',
      'mvn-dim': '#6b7488',
      'bar-bg': '#232a38',
      'num-dim': '#4d5567',
      'num-sep': '#3f4657',
      'ft-line': '#262c3a',
      'ft-text': '#8b93a7',
      'dot': '#3ddc84',
      'empty': '#6b7488'
    },
    light: {
      'pnl-bg1': '#ffffff',
      'pnl-bg2': '#f3f6fb',
      'pnl-border': '#d4dbe8',
      'pnl-shadow': 'rgba(28,40,70,.20)',
      'pnl-text': '#1b2231',
      'hd-bg': 'rgba(30,50,100,.035)',
      'hd-line': '#e2e7f0',
      'tabs-bg': '#e9edf5',
      'tb-text': '#5c677d',
      'tb-on-bg': '#ffffff',
      'tb-on-text': '#8a5f00',
      'sub-text': '#2b3446',
      'gold': '#8a5f00',
      'fold-bg': '#e5eaf3',
      'fold-text': '#5c677d',
      /* 第五十一批：顶栏 × 的悬停红底（浅色主题同一个红也够对比） */
      'cls-bg': '#c0392b',
      'row-top1': 'rgba(180,135,0,.16)',
      'row-top2': 'rgba(180,135,0,.01)',
      'row-line': 'rgba(30,50,100,.10)',
      'spr-no': '#e6ebf3',
      'lv-text': '#69758c',
      'mvn-text': '#2b3446',
      'mvn-dim': '#98a1b3',
      'bar-bg': '#dfe5ef',
      'num-dim': '#98a1b3',
      'num-sep': '#a9b2c2',
      'ft-line': '#e2e7f0',
      'ft-text': '#69758c',
      'dot': '#0a8f4d',
      'empty': '#98a1b3'
    }
  };

  function applyHost(host) {
    if (!host || !host.style) return;
    var sc = scheme();
    var v = VARS[sc] || VARS.dark;
    for (var k in v) {
      if (Object.prototype.hasOwnProperty.call(v, k)) {
        host.style.setProperty('--pcg-' + k, v[k]);
      }
    }
    host.style.colorScheme = sc;
    try { host.setAttribute('data-pcg-scheme', sc); } catch (e) { /* ignore */ }
  }

  var API = {
    MODES: MODES,
    MODE_TEXT: MODE_TEXT,
    MODE_ICON: MODE_ICON,
    STORE_KEY: STORE_KEY,
    VARS: VARS,
    mode: function () { return mode; },
    scheme: scheme,
    set: set,
    cycle: cycle,
    onChange: onChange,
    applyHost: applyHost,
    paint: paint
  };

  root.PCG_THEME = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;

  // 首帧：同步缓存立即生效，避免浅色浏览器里先闪一下深色
  mode = readSync();
  paint();
  readStore(paint);

  // 系统/浏览器主题在 popup 开着的时候切换，也要立即跟上
  try {
    if (root.matchMedia) {
      var mq = root.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', function () { if (mode === 'auto') paint(); });
      else if (mq.addListener) mq.addListener(function () { if (mode === 'auto') paint(); });
    }
  } catch (e) { /* ignore */ }

  // 其它上下文（popup ↔ 游戏页）改了主题，这里跟着刷新
  try {
    if (root.chrome && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area !== 'local' || !changes[STORE_KEY]) return;
        var v = norm(changes[STORE_KEY].newValue);
        if (v === mode) return;
        mode = v;
        if (isExtPage) {
          try { root.localStorage.setItem(STORE_KEY, mode); } catch (e) { /* ignore */ }
        }
        paint();
      });
    }
  } catch (e) { /* ignore */ }

  if (isExtPage && doc && doc.addEventListener) {
    var bindButton = function () {
      var btn = doc.getElementById('theme-btn');
      if (!btn || btn.__pcgThemeBound) return;
      btn.__pcgThemeBound = true;
      btn.addEventListener('click', cycle);
      paintButton();
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', bindButton);
    else bindButton();
  }
})(typeof window !== 'undefined' ? window : this);
