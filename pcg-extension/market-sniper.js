/* Poke'Catch 防掉线助手 —— 黑市扫货（第四批）
 *
 * 玩家写一张「意向表」：想买的宝可梦 + 愿意出的最高价 + 要买几只（1~99）。
 * 黑市一旦上架符合条件的商品，插件自动完成购买；没命中就安静等着，不乱点、不乱花钱。
 *
 * 第三十批改动（用户反馈）：
 *   · 意向多了一项「数量」，默认 1、最高 99；买到这么多只就把这条意向自动移出表；
 *   · 每买成一笔都记进「命中商品」栏，这份记录只放内存，关掉浏览器才清空；
 *   · 悬浮看板改成和其它自动化任务同一套（PCG_HUD），功能开时自动出现、停时自动收起；
 *   · 看板里额外列出「是意向里的宝可梦、只是挂牌价超了」的那些（价格从低到高），
 *     点一下就把这只按当前挂牌价加进意向表，下一轮就买；
 *   · 从「自动化任务（六选一互斥）」挪到「日常监测」，不再和别的任务互斥，
 *     并和地下通道一样拿到「优先切页」的待遇（见 content.js 的 MARKET_WANT）。
 *
 * 对着线上 bundle app.443bc13cad.js（BUILD 1009d5ce6f）核对过的关键事实：
 *   黑市屏幕   #screen-market.active / #market-root / #tabs [data-screen="market"]
 *             存档里 mktFound 为假时这个 tab 会带 .mk-hidden（还没解锁）
 *   商品缓存   页面 localStorage 的 pokecatch-market-<userId> = { at, list: [...] }，
 *             由 Cloud.market.list() 拉取；游戏只在黑市页活跃且缓存超过 10 分钟时刷新
 *             （CONFIG.MARKET.REFRESH_MS = 10*60000）。所以本模块会周期性切到黑市页
 *             触发游戏自己的刷新，不会自己去请求接口、也不会改这个缓存。
 *   商品卡     .mk-item[data-l="<id>"]（.own 是自己的挂单，data-own 不是 data-l）
 *              .mk-id b 名字 / .mk-no "N° 25" / .mk-foot b "12 345 ₽" /
 *              .mk-item.shiny 闪光 / .mk-wn 卖家 / .mk-filters #mk-q、#mk-sh、#mk-sort
 *   两道确认   点商品卡 → Na() 弹窗「Acheter pour {price} ₽」（单个 .btn.primary）；
 *              → zt() 先查 market.still()，再弹「Acheter {name} ?」
 *              （.btn.ghost「Retour」+ .btn.primary「Confirmer」）。
 *              两道都在 #modal-root.open > .modal.mk-dlg 里，必须依次点。
 *   硬限制     CONFIG.MARKET.BUYS = 3 次/天、SHINY_BUYS = 1 只闪光/天，
 *              日期按 Europe/Paris 算，存档 mktDay = { day, n, shiny }；
 *              mktBuy 非空表示有一笔没结算完的购买，此时绝不能再点。
 *              买家只付挂牌价 price（30% 税 + 固定费是卖家上架时付的），
 *              钱包不足或当日额度用完时第一道弹窗的主按钮会 disabled。
 *
 * 安全原则（涉及游戏币，宁可少买不可误买）：
 *   · 默认不启用；必须手动点「开始扫货」，且至少有一条有效意向才会动钱
 *   · 支持试运行：只记录命中，不点任何确认
 *   · 购买前再核一次弹窗里显示的真实价格，超过意向价就取消
 *   · 只要点了最后一道「确认」，无论结果是否确认都把这个商品 id 永久记成已处理，
 *     绝不因为「没看到成功信号」而重试（重复扣款比漏买严重得多）
 *   · 玩家最近有真实操作时不去抢页面；地下通道在忙时让路（它比黑市更优先）
 *
 * 数据边界与全插件一致：只读游戏存档、页面 localStorage 缓存和 DOM，最多模拟点击；
 * 不改游戏存档、不拦截请求、不上传数据，也绝不写游戏域名下的 localStorage。
 * 本模块自己的配置 / 统计 / 去重表只写在扩展的 chrome.storage.local。
 */
(function (root) {
  'use strict';

  var CFG = root.PCG_CONFIG || null;
  var STAB = root.PCG_STAB || null;
  var NAMES = (STAB && STAB.nm) || {};        // { 图鉴号: 中文名 }，493 只，来自 stab.js
  var SAVE_KEY = (CFG && CFG.SAVE_KEY) || 'gachamon-save-v1';
  var doc = root.document;

  function sel(key, fallback) {
    var v = (CFG && typeof CFG.sel === 'function') ? CFG.sel(key) : '';
    return v || fallback;
  }

  var Q = {
    screen: sel('mkScreen', '#screen-market'),
    root: sel('mkRoot', '#market-root'),
    tab: sel('mkTab', '#tabs [data-screen="market"]'),
    sideTab: sel('mkSideTab', '#side [data-screen="market"]'),
    item: sel('mkItem', '.mk-item[data-l]'),
    listTab: sel('mkListTab', '.mk-tabs [data-tab="list"]'),
    search: sel('mkSearch', '#mk-q'),
    shinyChip: sel('mkShinyChip', '#mk-sh'),
    money: sel('mkMoney', '.mk-money'),
    modal: sel('mkModal', '#modal-root.open .modal.mk-dlg'),
    modalAny: sel('mkModalAny', '#modal-root.open .modal'),
    buyBtn: sel('mkBuyBtn', '.modal-actions button.btn.primary'),
    modalBtns: sel('mkModalBtns', '.modal-actions button.btn'),
    modalClose: sel('mkModalClose', '.dc-x'),
    modalPrice: sel('mkModalPrice', '.mk-price'),
    screenActive: sel('mkScreenActive', '.screen.active')
  };

  var CFG_KEY = 'pcgMarketCfgV1';
  var STATS_KEY = 'pcgMarketStatsV1';
  /* 「命中商品」= 买成的记录：放 chrome.storage.session（只活到关浏览器，刷新游戏页不丢） */
  var BUYS_KEY = 'pcgMarketBuysV1';

  /* 线上 CONFIG.MARKET 里与购买有关的常量，游戏改数值时只改这里 */
  var K = {
    BUYS: 3,
    SHINY_BUYS: 1,
    MIN_PRICE: 1000,
    REFRESH_MS: 10 * 60000,
    LEVEL: 5,
    MAX_RULES: 24,
    HANDLED_TTL: 24 * 3600 * 1000,
    RETRY_SKIP_MS: 90000,
    RETRY_FAIL_MS: 30000
  };

  var DEFAULT_CFG = {
    armed: false,          // 总开关：点「开始扫货」才打开（涉及花钱，默认关）
    dryRun: false,         // 试运行：命中只记录，不点确认
    intervalSec: 60,       // 主动去黑市页检查的间隔
    autoOpen: true,        // 自动切到黑市页（关 = 只在玩家自己开着黑市页时扫）
    restoreScreen: true,   // 扫完切回原来的页面
    idleSec: 10,           // 玩家 N 秒内没真实操作才抢页面；0 = 不检查
    sortBy: 'cheap',       // cheap 最低价 / deal 省得最多 / rule 按意向表顺序
    maxPerRun: 0,          // 本次启用最多买几只，0 = 只受游戏每日上限约束
    reserve: 0,            // 至少保留多少 ₽ 不花
    resume: true,          // 刷新游戏页后接着扫
    hud: false,            // 第五十五批：游戏页内悬浮看板改成默认关（开关仍在面板里）
    hudFold: false,
    hudAlways: false,      // 旧版遗留字段，第三十批起不再使用
    /* 第三十批：qty 的含义从「每轮最多买几只」改成「这条意向总共要买几只」，
     * 买到 qty 只就从意向表里自动移除。 */
    rules: []              // [{ id, query, dex, any, name, maxPrice, shiny, qty, enabled, bought }]
  };

  var ZERO_STATS = {
    scans: 0, hits: 0, bought: 0, spent: 0,
    skipped: 0, failed: 0, since: 0
  };

  var D = {
    loaded: false,
    busy: false,
    cfg: Object.assign({}, DEFAULT_CFG, { rules: [] }),
    stats: Object.assign({}, ZERO_STATS),
    handled: {},           // { 商品id: { at, kind } } —— 防重复扣款的核心
    history: [],           // 最近成交 / 跳过记录
    events: [],            // 最近事件流
    listings: [],          // 合并后的全部在售商品
    matches: [],           // 命中意向表的商品（带 ruleId / deal）
    overBudget: [],        // 第三十批：是意向里的宝可梦、但挂牌价超过意向价
    buysLog: [],           // 第三十批：买成的记录，只在内存里，关掉浏览器才没
    seenIds: {},           // 上一次轮询见到的命中 id，用来识别「刚上架」
    cacheAt: 0,
    wallet: 0,
    today: null,
    phase: '未启用',
    note: '',
    newHit: false,
    lastPollAt: 0,
    lastScanAt: 0,
    lastAttemptAt: 0,
    runBought: 0,
    scanRuleBought: {},        // 每轮扫描里各条意向已买数量（统计用）
    lastCapNoteAt: 0,
    snap: null
  };

  /* ---------------- 小工具 ---------------- */
  function q(s, r) {
    try { return (r || doc).querySelector(s); } catch (e) { return null; }
  }
  function qa(s, r) {
    try { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
    catch (e) { return []; }
  }
  function txt(el) { return String((el && el.textContent) || '').trim(); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function now() { return Date.now(); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function normName(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, '')
      .replace(/[·•・]/g, '')
      .toLowerCase();
  }
  function fmtMoney(n) {
    return String(Math.round(num(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  function fmtAgo(ms) {
    var v = Math.max(0, num(ms));
    if (v < 60000) return Math.floor(v / 1000) + ' 秒前';
    if (v < 3600000) return Math.floor(v / 60000) + ' 分钟前';
    if (v < 86400000) return Math.floor(v / 3600000) + ' 小时前';
    return Math.floor(v / 86400000) + ' 天前';
  }

  /* 中文名 / 图鉴号 → 图鉴号数组；法语、英文名交给显示名模糊匹配 */
  function resolveIds(query) {
    var s = String(query == null ? '' : query).trim();
    var m = s.match(/^#?(\d{1,4})$/);
    if (m) return [Number(m[1])];
    var n = normName(s);
    if (!n) return [];
    var ids = [];
    Object.keys(NAMES).forEach(function (k) {
      if (normName(NAMES[k]) === n) ids.push(Number(k));
    });
    return ids;
  }
  function isAnyQuery(query) {
    var n = normName(query);
    return !n || n === '*' || n === '任意' || n === '任意宝可梦' ||
      n === '全部' || n === 'all' || n === 'any';
  }

  /* 游戏用 Intl 格式化价格（法语千分位是窄不换行空格），这里只取数字 */
  function parseMoney(s) {
    var t = String(s == null ? '' : s).replace(/[\u00a0\u202f\s,'’`]/g, '');
    var m = t.match(/(\d+)/);
    return m ? Number(m[1]) : 0;
  }
  function parseDexNo(s) {
    var m = String(s == null ? '' : s).match(/(\d{1,4})/);
    return m ? Number(m[1]) : 0;
  }
  /* id 只允许安全的字符集，避免把缓存里的东西拼进属性选择器 */
  function safeId(id) {
    var s = String(id == null ? '' : id);
    return /^[A-Za-z0-9_-]{1,80}$/.test(s) ? s : '';
  }

  function parisDay(at) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date(at || now()));
    } catch (e) {
      var d = new Date(at || now());
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
        '-' + String(d.getDate()).padStart(2, '0');
    }
  }

  function dailyState(save) {
    var day = parisDay();
    var d = save && save.mktDay;
    var same = !!(d && d.day === day);
    var n = same ? num(d.n) : 0;
    var sh = same ? num(d.shiny) : 0;
    return {
      day: day, n: n, shiny: sh,
      left: Math.max(0, K.BUYS - n),
      shinyLeft: Math.max(0, K.SHINY_BUYS - sh),
      pending: !!(save && save.mktBuy),
      found: !!(save && save.mktFound)
    };
  }

  /* ---------------- 存档 / 黑市缓存（只读） ---------------- */
  function pageLS() {
    try { return root.localStorage || null; } catch (e) { return null; }
  }
  function readSave() {
    var SAVE = root.PCG_SAVE || null;
    if (SAVE) return SAVE.read();
    var ls = pageLS();
    if (!ls || typeof ls.getItem !== 'function') return null;
    try { return JSON.parse(ls.getItem(SAVE_KEY) || 'null') || null; }
    catch (e) { return null; }
  }
  /* 只读：枚举页面 localStorage 里 pokecatch-market-* 的键，挑最新的那份缓存 */
  function readCache() {
    var ls = pageLS();
    if (!ls || typeof ls.getItem !== 'function') return { at: 0, list: null };
    var best = { at: 0, list: null };
    try {
      var len = num(ls.length);
      for (var i = 0; i < len; i++) {
        var key = typeof ls.key === 'function' ? ls.key(i) : null;
        if (!key || String(key).indexOf('pokecatch-market-') !== 0) continue;
        var obj = JSON.parse(ls.getItem(key) || 'null');
        if (obj && Array.isArray(obj.list) && num(obj.at) >= num(best.at)) best = obj;
      }
    } catch (e) { /* 读不到就退化成只看 DOM */ }
    return best;
  }

  /* ---------------- 商品归一化 / 匹配 ---------------- */
  function normalizeListing(raw, fromDom) {
    var r = raw || {};
    var id = safeId(r.id);
    if (!id) return null;
    var dex = num(r.mon_id != null ? r.mon_id : (r.mon && r.mon.id)) || parseDexNo(r.dex);
    var price = num(r.price) || parseMoney(r.priceText);
    var exp = r.expires_at ? Date.parse(r.expires_at) : num(r.expiresAt);
    var created = r.created_at ? Date.parse(r.created_at) : num(r.createdAt);
    return {
      id: id,
      dex: dex,
      zh: NAMES[dex] || '',
      name: String(r.name || '').trim(),
      shiny: !!r.shiny,
      price: price,
      seller: String(r.seller_name || r.seller || '').trim(),
      reg: String(r.reg || '').trim(),
      level: num(r.level) || K.LEVEL,
      createdAt: isFinite(created) ? created : 0,
      expiresAt: isFinite(exp) ? exp : 0,
      dom: !!fromDom,
      fake: String(id).indexOf('fake-') === 0
    };
  }
  function normalizeCacheItem(raw) { return normalizeListing(raw, false); }

  function mergeListings(cached, dom) {
    var by = {};
    (cached || []).forEach(function (l) { if (l) by[l.id] = l; });
    (dom || []).forEach(function (l) {
      if (!l) return;
      var b = by[l.id];
      if (!b) { by[l.id] = l; return; }
      /* 页面上真正渲染出来的卡片优先：价格 / 名字 / 闪光以它为准 */
      by[l.id] = Object.assign({}, b, {
        dex: l.dex || b.dex,
        zh: NAMES[l.dex || b.dex] || b.zh,
        name: l.name || b.name,
        price: l.price || b.price,
        shiny: l.shiny || b.shiny,
        seller: l.seller || b.seller,
        dom: true
      });
    });
    return Object.keys(by).map(function (k) { return by[k]; });
  }

  function readDomCards() {
    var r = q(Q.root);
    if (!r) return [];
    return qa(Q.item, r).map(function (c) {
      var id = c.getAttribute ? c.getAttribute('data-l') : '';
      var shiny = false;
      try { shiny = c.classList.contains('shiny'); } catch (e) { /* ignore */ }
      return normalizeListing({
        id: id,
        name: txt(q('.mk-id b', c)),
        dex: parseDexNo(txt(q('.mk-no', c))),
        price: parseMoney(txt(q('.mk-foot b', c))),
        shiny: shiny || !!q('.mk-sh', c),
        seller: txt(q('.mk-wn', c))
      }, true);
    }).filter(function (x) { return !!x; });
  }

  function matchRule(l, rule, at, today) {
    if (!l || !rule || rule.enabled === false) return null;
    if (l.fake) return null;                              // 离线测试假货，不花钱
    if (num(rule.bought) >= targetQty(rule)) return null;  // 买够了，这条意向已经收工
    if (l.price < K.MIN_PRICE || l.price > num(rule.maxPrice)) return null;
    if (l.expiresAt && l.expiresAt <= at) return null;
    if (rule.shiny === 'only' && !l.shiny) return null;
    if (rule.shiny === 'no' && l.shiny) return null;
    if (l.shiny && today && today.shinyLeft <= 0) return null;
    if (rule.any) return { ruleId: rule.id, deal: num(rule.maxPrice) - l.price, ruleIndex: num(rule.index) };
    if (rule.dex != null) {
      if (l.dex !== rule.dex) return null;
    } else {
      var n = normName(rule.query);
      if (!n) return null;
      var zh = normName(l.zh), nm = normName(l.name);
      if (!(zh && (zh === n || (n.length >= 2 && zh.indexOf(n) >= 0))) &&
          !(nm && nm !== '???' && (nm === n || (n.length >= 2 && nm.indexOf(n) >= 0)))) return null;
    }
    return { ruleId: rule.id, deal: num(rule.maxPrice) - l.price, ruleIndex: num(rule.index) };
  }

  function matchListings(listings, rules, at, today) {
    var out = [];
    (listings || []).forEach(function (l) {
      for (var i = 0; i < (rules || []).length; i++) {
        var r = Object.assign({}, rules[i], { index: i });
        var hit = matchRule(l, r, at, today);
        if (hit) {
          out.push(Object.assign({}, l, {
            ruleId: hit.ruleId, ruleIndex: hit.ruleIndex,
            deal: hit.deal, rulePrice: num(rules[i].maxPrice)
          }));
          break;
        }
      }
    });
    return out;
  }

  function rankMatches(matches, sortBy) {
    var mode = sortBy || 'cheap';
    return (matches || []).slice().sort(function (a, b) {
      if (mode === 'deal' && b.deal !== a.deal) return b.deal - a.deal;
      if (mode === 'rule' && b.ruleIndex !== a.ruleIndex) return a.ruleIndex - b.ruleIndex;
      if (a.price !== b.price) return a.price - b.price;
      if (mode === 'deal' && b.ruleIndex !== a.ruleIndex) return a.ruleIndex - b.ruleIndex;
      return String(a.id).localeCompare(String(b.id));
    });
  }

  /* 第三十批：「是意向里的宝可梦，但挂牌价超过意向价」的那一批。
   * 只用来提示 + 一键加价，绝不自己动钱。 */
  function nearMissRule(l, rule, at) {
    if (!l || !rule || rule.enabled === false) return null;
    if (l.fake) return null;
    if (num(rule.bought) >= targetQty(rule)) return null;
    var max = num(rule.maxPrice);
    if (!max) return null;
    if (l.price < K.MIN_PRICE) return null;
    if (l.price <= max) return null;                      // 价格够的不算「超价」
    if (l.expiresAt && l.expiresAt <= at) return null;
    if (rule.shiny === 'only' && !l.shiny) return null;
    if (rule.shiny === 'no' && l.shiny) return null;
    if (rule.any) return { ruleId: rule.id, rulePrice: max, over: l.price - max, ruleIndex: num(rule.index) };
    if (rule.dex != null) {
      if (l.dex !== rule.dex) return null;
    } else {
      var n = normName(rule.query);
      if (!n) return null;
      var zh = normName(l.zh), nm = normName(l.name);
      if (!(zh && (zh === n || (n.length >= 2 && zh.indexOf(n) >= 0))) &&
          !(nm && nm !== '???' && (nm === n || (n.length >= 2 && nm.indexOf(n) >= 0)))) return null;
    }
    return { ruleId: rule.id, rulePrice: max, over: l.price - max, ruleIndex: num(rule.index) };
  }

  /* 按挂牌价从低到高（同价看离意向价近的） */
  function nearMisses(listings, rules, at) {
    var out = [];
    (listings || []).forEach(function (l) {
      for (var i = 0; i < (rules || []).length; i++) {
        var r = Object.assign({}, rules[i], { index: i });
        var hit = nearMissRule(l, r, at);
        if (hit) {
          out.push(Object.assign({}, l, {
            ruleId: hit.ruleId, rulePrice: hit.rulePrice, over: hit.over, ruleIndex: hit.ruleIndex
          }));
          break;
        }
      }
    });
    out.sort(function (a, b) {
      if (a.price !== b.price) return a.price - b.price;
      if (a.over !== b.over) return a.over - b.over;
      return String(a.id).localeCompare(String(b.id));
    });
    return out;
  }

  /* ---------------- 日志 / 存储 ---------------- */
  function note(level, text, type) {
    var full = '黑市扫货：' + text;
    try {
      if (root.PCG_LOG && typeof root.PCG_LOG.push === 'function') {
        root.PCG_LOG.push(level, 'market', full);
      }
    } catch (e) { /* ignore */ }
    D.events.unshift({ t: now(), level: level, text: text, type: type || '' });
    if (D.events.length > 40) D.events.length = 40;
  }
  function setPhase(t) { D.phase = t; }

  /* 第二十五批：刷新页面后要不要自动接着扫，统一由「页面自动化」里的 resumeOn 决定；
   * 卡片里那个「刷新游戏页后接着扫」已经删掉，这里留个读不到设置时的兜底。 */
  function resumeOk() {
    try {
      if (typeof root.PCG_SETTINGS_GET === 'function') {
        return root.PCG_SETTINGS_GET('resumeOn') !== false;
      }
    } catch (e) { /* ignore */ }
    return D.cfg.resume !== false;
  }

  function storeGet(key, cb) {
    try { chrome.storage.local.get(key, function (v) { cb((v && v[key]) || null); }); }
    catch (e) { cb(null); }
  }
  function storeSet(key, val) {
    var o = {};
    o[key] = val;
    try { chrome.storage.local.set(o, function () { void chrome.runtime.lastError; }); }
    catch (e) { /* ignore */ }
  }
  /* 第三十批：storage.session 只在这一次浏览器运行期间存在，刷新游戏页不丢、关浏览器才清。
   * 拿不到（老版本 Chrome / 没有权限）就退回纯内存，不影响其它功能。 */
  function sessionStore() {
    try {
      var st = root.chrome && root.chrome.storage && root.chrome.storage.session;
      return (st && typeof st.get === 'function' && typeof st.set === 'function') ? st : null;
    } catch (e) { return null; }
  }
  function loadBuys() {
    var st = sessionStore();
    if (!st) return;
    try {
      st.get(BUYS_KEY, function (v) {
        var list = v && v[BUYS_KEY];
        if (!Array.isArray(list) || !list.length) return;
        D.buysLog = list.slice(0, 80);
        try { poll(); } catch (e) { /* ignore */ }
      });
    } catch (e) { /* ignore */ }
  }
  function saveBuys() {
    var st = sessionStore();
    if (!st) return;
    var o = {};
    o[BUYS_KEY] = D.buysLog.slice(0, 80);
    try { st.set(o, function () { void (root.chrome && root.chrome.runtime && root.chrome.runtime.lastError); }); }
    catch (e) { /* ignore */ }
  }
  function saveCfg() { storeSet(CFG_KEY, D.cfg); }
  function saveStats() {
    pruneHandled();
    storeSet(STATS_KEY, {
      stats: D.stats, handled: D.handled, history: D.history.slice(0, 40)
    });
  }
  function pruneHandled() {
    var cut = now() - K.HANDLED_TTL;
    Object.keys(D.handled).forEach(function (k) {
      if (num(D.handled[k] && D.handled[k].at) < cut) delete D.handled[k];
    });
  }

  /* ---------------- 配置 / 意向表 ---------------- */
  function newRuleId() {
    return 'r' + now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function sanitizeRule(r) {
    var o = r || {};
    var query = String(o.query || '').trim().slice(0, 60);
    var ids = resolveIds(query);
    var id = String(o.id || '');
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) id = newRuleId();
    var shiny = o.shiny === 'only' || o.shiny === 'no' ? o.shiny : 'any';
    return {
      id: id,
      query: query,
      dex: ids.length ? ids[0] : null,
      any: isAnyQuery(query),
      name: ids.length ? (NAMES[ids[0]] || query) : (isAnyQuery(query) ? '任意宝可梦' : query),
      maxPrice: clamp(parseInt(o.maxPrice, 10) || 0, 0, 999999999),
      shiny: shiny,
      /* 第三十批：这条意向总共要买几只（1 ~ 99，默认 1）。
       * 买到 qty 只就从意向表里自动移除，不再继续占额度。 */
      qty: clamp(parseInt(o.qty, 10) || 1, 1, 99),
      enabled: o.enabled !== false,
      bought: clamp(parseInt(o.bought, 10) || 0, 0, 99999)
    };
  }
  /* 一条意向要买的总数 */
  function targetQty(r) {
    return clamp(parseInt(r && r.qty, 10) || 1, 1, 99);
  }
  function ruleValid(r) {
    return !!r && r.enabled !== false && r.maxPrice > 0 &&
      (r.any || r.dex != null || !!normName(r.query));
  }
  /* 还没买够的意向才算「还在找」 */
  function ruleOpen(r) {
    return ruleValid(r) && num(r.bought) < targetQty(r);
  }
  function sanitizeCfg(c) {
    var o = Object.assign({}, DEFAULT_CFG, c || {});
    o.armed = !!o.armed;
    o.dryRun = !!o.dryRun;
    /* 第五十五批：命中排序 / 自动切黑市页 / 切回原页面三项默认开启且已隐藏，
     * 配置层钉死，旧存档里存过 false / 别的排序也一律拉回默认值。 */
    o.autoOpen = true;
    o.restoreScreen = true;
    o.resume = !!o.resume;
    /* 看板默认关：老存档没打过 hudV 标记就按新默认关一次，之后玩家自己开不再被改回去 */
    o.hud = Number((c || {}).hudV) >= 2 ? !!o.hud : false;
    o.hudV = 2;
    o.hudFold = !!o.hudFold;
    o.hudAlways = !!o.hudAlways;
    o.intervalSec = clamp(parseInt(o.intervalSec, 10) || 60, 5, 900);
    o.idleSec = clamp(parseInt(o.idleSec, 10) || 0, 0, 300);
    o.maxPerRun = clamp(parseInt(o.maxPerRun, 10) || 0, 0, 999);
    o.reserve = clamp(parseInt(o.reserve, 10) || 0, 0, 999999999);
    o.sortBy = 'cheap';
    var rules = Array.isArray(o.rules) ? o.rules : [];
    /* 第三十批：买够数量的意向不放回表里（读档 / 改配置时也一致地清掉） */
    o.rules = rules.slice(0, K.MAX_RULES).map(sanitizeRule)
      .filter(function (r) { return num(r.bought) < targetQty(r); });
    return o;
  }
  function config(patch) {
    D.cfg = sanitizeCfg(Object.assign({}, D.cfg, patch || {}));
    saveCfg();
    try { poll(); } catch (e) { /* 配置刚落地就同步刷新面板状态 */ }
    return Object.assign({}, D.cfg, { rules: D.cfg.rules.slice() });
  }
  function rules(op, payload) {
    var p = payload || {};
    var list = D.cfg.rules.slice();
    if (op === 'add') {
      var r = sanitizeRule(p.rule || p);
      if (!r.maxPrice) return { ok: false, text: '请填意向价格（₽）', rules: list };
      if (!r.any && r.dex == null && !normName(r.query)) {
        return { ok: false, text: '请填意向宝可梦', rules: list };
      }
      if (list.length >= K.MAX_RULES) return { ok: false, text: '意向表最多 ' + K.MAX_RULES + ' 条', rules: list };
      list.push(r);
      note('info', '新增意向：' + r.name + ' ≤ ' + fmtMoney(r.maxPrice) + ' ₽ × ' + targetQty(r) + ' 只');
    } else if (op === 'remove') {
      list = list.filter(function (x) { return x.id !== p.id; });
    } else if (op === 'toggle') {
      list = list.map(function (x) {
        return x.id === p.id ? Object.assign({}, x, { enabled: p.enabled != null ? !!p.enabled : !x.enabled }) : x;
      });
    } else if (op === 'replace') {
      list = (Array.isArray(p.rules) ? p.rules : []).slice(0, K.MAX_RULES).map(sanitizeRule);
    } else if (op === 'clear') {
      list = [];
    } else {
      return { ok: false, text: '未知操作', rules: list };
    }
    config({ rules: list });
    poll();
    return { ok: true, rules: D.cfg.rules.slice(), state: state() };
  }

  /* ---------------- 与 content.js 的桥（页面租约 / 空闲 / 互斥） ----------------
   * 桥在 content.js 初始化末尾挂上；本文件先注入，一律运行时才取。 */
  function host() { return root.PCG_MARKET_HOST || null; }
  function hostCall(name, arg) {
    var h = host();
    try { return (h && typeof h[name] === 'function') ? h[name](arg) : false; }
    catch (e) { return false; }
  }
  function hostBusy() {
    return !!(hostCall('busy') || hostCall('screenBusy') || hostCall('otherAuto'));
  }
  /* 桥还没挂上（content.js 没跑完）时不能把「取不到」当成「玩家在操作」，
   * 否则会永远卡在「等你操作完」。取不到就当空闲，由页面租约兜底。 */
  function hostIdle(ms) {
    var h = host();
    if (!h || typeof h.idle !== 'function') return true;
    try { return !!h.idle(ms); } catch (e) { return true; }
  }
  function anyModal() { return !!q(Q.modalAny); }
  async function withScreen(fn) {
    /* 第五批全局规则：闪光宝可梦还在战斗 / 捕捉结算里，绝不把页面切走。
     * 黑市只在「打开页面 → 点两道确认」这几秒占页面，等得起。 */
    var g = root.PCG_SHINY_GUARD;
    if (g && typeof g.waitClear === 'function' && typeof g.blocked === 'function' && g.blocked()) {
      setPhase('等闪光战斗结束');
      var ok = await g.waitClear('market');
      if (!ok) return { ok: false, text: '闪光战斗还没结束，本轮跳过扫货' };
    }
    try { hostCall('hold', 30000); } catch (e) { /* ignore */ }
    try { return await fn(); }
    finally { try { hostCall('free'); } catch (e2) { /* ignore */ } }
  }

  /* ---------------- 页面操作 ---------------- */
  function marketActive() {
    var s = q(Q.screen);
    return !!(s && s.classList && s.classList.contains('active'));
  }
  function activeScreenName() {
    var a = q(Q.screenActive);
    return a && a.id ? String(a.id).replace(/^screen-/, '') : '';
  }
  function marketTab() {
    var t = q(Q.tab);
    if (t && t.classList && t.classList.contains('mk-hidden')) return null;
    return t || q(Q.sideTab);
  }
  async function openMarket() {
    if (marketActive() && q(Q.root)) return true;
    var tab = marketTab();
    if (!tab) { setPhase('黑市未解锁'); return false; }
    try { tab.click(); } catch (e) { return false; }
    for (var i = 0; i < 40; i++) {
      await sleep(200);
      if (marketActive() && q(Q.root)) return true;
    }
    return false;
  }
  function restoreScreen(prev) {
    if (!prev || !D.cfg.restoreScreen) return;
    if (activeScreenName() === prev) return;
    var tab = q('#tabs [data-screen="' + prev + '"]') || q('#side [data-screen="' + prev + '"]');
    if (!tab) return;
    try { if (!tab.classList || !tab.classList.contains('locked')) tab.click(); }
    catch (e) { /* ignore */ }
  }
  async function ensureListTab() {
    var t = q(Q.listTab);
    if (t && t.classList && !t.classList.contains('on')) {
      try { t.click(); } catch (e) { /* ignore */ }
      await sleep(300);
    }
    var inp = q(Q.search);
    if (inp && String(inp.value || '')) {
      try {
        inp.value = '';
        var Ev = root.Event || null;
        if (Ev) inp.dispatchEvent(new Ev('input', { bubbles: true }));
        await sleep(250);
      } catch (e) { /* ignore */ }
    }
    var chip = q(Q.shinyChip);
    if (chip && chip.classList && chip.classList.contains('on')) {
      try { chip.click(); } catch (e) { /* ignore */ }
      await sleep(250);
    }
  }

  /* ---------------- 轮询：只读，不切页面 ---------------- */
  function readWallet() {
    if (!marketActive()) return D.wallet;
    var m = q(Q.money);
    var v = m ? parseMoney(txt(m)) : 0;
    if (v > 0) D.wallet = v;
    return D.wallet;
  }
  function pruneAttempts(at) {
    Object.keys(D.handled).forEach(function (k) {
      var h = D.handled[k];
      if (!h) { delete D.handled[k]; return; }
      var age = at - num(h.at);
      var ttl = h.kind === 'skip' ? K.RETRY_SKIP_MS :
        (h.kind === 'fail' ? K.RETRY_FAIL_MS : K.HANDLED_TTL);
      if (age > ttl) delete D.handled[k];
    });
  }
  function markHandled(id, kind, reason) {
    if (!id) return;
    D.handled[id] = { at: now(), kind: kind, reason: String(reason || '') };
    saveStats();
  }
  function addHistory(e) {
    D.history.unshift(Object.assign({ t: now() }, e || {}));
    if (D.history.length > 40) D.history.length = 40;
    saveStats();
  }

  function poll() {
    var at = now();
    var save = readSave();
    D.today = dailyState(save);
    var cache = readCache();
    D.cacheAt = num(cache.at);
    var cached = (cache.list || []).map(normalizeCacheItem)
      .filter(function (x) { return !!x; });
    var dom = marketActive() ? readDomCards() : [];
    D.listings = mergeListings(cached, dom);
    readWallet();
    D.matches = rankMatches(
      matchListings(D.listings, D.cfg.rules, at, D.today), D.cfg.sortBy);
    /* 意向里的宝可梦、只是价格超出——只提示，不动钱；按价格从低到高 */
    D.overBudget = nearMisses(D.listings, D.cfg.rules, at);
    pruneAttempts(at);

    /* 「刚上架」识别：只在 armed 时记事件，免得刷屏 */
    var seen = {};
    D.matches.forEach(function (m) { seen[m.id] = true; });
    if (D.cfg.armed) {
      var fresh = D.matches.filter(function (m) { return !D.seenIds[m.id]; });
      if (fresh.length) {
        D.newHit = true;
        D.stats.hits += fresh.length;
        fresh.forEach(function (m) {
          note('ok', '上架命中：' + listingLabel(m) + ' · ' + fmtMoney(m.price) + ' ₽', 'hit');
        });
        saveStats();
      }
    }
    D.seenIds = seen;
    D.snap = buildSnap();
    hudPaint(D.snap);
    return D.snap;
  }
  function listingLabel(l) {
    var nm = l.zh || l.name || ('#' + (l.dex || '?'));
    return (l.shiny ? '✦ ' : '') + nm + (l.dex ? ' #' + l.dex : '');
  }

  /* ---------------- 购买：两道确认，绝不重复扣款 ---------------- */
  function modalInfo() {
    var m = q(Q.modal);
    if (!m) return null;
    var btns = qa(Q.modalBtns, m);
    var primary = q(Q.buyBtn, m);
    return {
      el: m,
      btns: btns,
      primary: primary,
      disabled: !!(primary && primary.disabled),
      sig: txt(q('.modal-body', m)).slice(0, 180),
      price: parseMoney(txt(q(Q.modalPrice, m)))
    };
  }
  function closeModal() {
    var m = q(Q.modal);
    if (!m) return;
    var x = q(Q.modalClose, m);
    if (x) { try { x.click(); return; } catch (e) { /* ignore */ } }
    var ghost = q('.modal-actions button.btn.ghost', m);
    if (ghost) { try { ghost.click(); } catch (e2) { /* ignore */ } }
  }
  async function waitFor(fn, ms, step) {
    var end = now() + (ms || 3000);
    while (now() < end) {
      var v = null;
      try { v = fn(); } catch (e) { /* ignore */ }
      if (v) return v;
      await sleep(step || 150);
    }
    return null;
  }

  /* 返回值 ok=true 表示「点过最后一道确认并记成已处理」，无论结果是否确认 */
  async function buyListing(m) {
    var id = safeId(m.id);
    if (!id) return { ok: false, text: '商品 id 不合法' };
    var cardSel = Q.item + '[data-l="' + id + '"]';
    var card = q(cardSel);
    if (!card) return { ok: false, text: '商品卡没渲染出来（可能被搜索/闪光过滤挡住）', retry: true };
    if (anyModal()) return { ok: false, text: '页面上有别的弹窗，先不点', retry: true };

    var before = dailyState(readSave());
    try { card.click(); } catch (e) {
      return { ok: false, text: '点不开商品详情：' + ((e && e.message) || e), retry: true };
    }

    /* 第一道：详情弹窗只有一个 primary 按钮；钱包不足 / 当日额度用完会 disabled */
    var first = await waitFor(function () {
      var mi = modalInfo();
      return (mi && mi.btns.length === 1 && mi.primary) ? mi : null;
    }, 4000);
    if (!first) {
      closeModal();
      return { ok: false, text: '详情弹窗没出现', retry: true };
    }
    if (first.disabled) {
      closeModal();
      note('warn', '跳过 ' + listingLabel(m) + '：游戏把购买按钮禁用了（余额不足 / 今日额度用完 / 有未结算购买）', 'skip');
      D.stats.skipped++;
      markHandled(id, 'skip', '购买按钮禁用');
      addHistory({ name: listingLabel(m), price: m.price, shiny: !!m.shiny, ok: false, reason: '购买按钮禁用' });
      return { ok: false, text: '购买按钮被禁用，已跳过' };
    }
    /* 弹窗里显示的价格是游戏当前真实价格：缓存过期时必须以它为准 */
    var shown = first.price || m.price;
    var live = maxRulePrice(m.ruleId);
    if (shown > num(m.rulePrice) || (live > 0 && shown > live)) {
      closeModal();
      note('warn', '跳过 ' + listingLabel(m) + '：实际价格 ' + fmtMoney(shown) + ' ₽ 超过意向价', 'skip');
      D.stats.skipped++;
      markHandled(id, 'skip', '价格超过意向');
      addHistory({ name: listingLabel(m), price: shown, shiny: !!m.shiny, ok: false, reason: '价格超过意向' });
      return { ok: false, text: '实际价格超过意向价，已取消' };
    }
    if (D.cfg.dryRun) {
      closeModal();
      note('ok', '试运行命中 ' + listingLabel(m) + ' · ' + fmtMoney(shown) + ' ₽（没有点确认）', 'dry');
      markHandled(id, 'skip', '试运行');
      addHistory({ name: listingLabel(m), price: shown, shiny: !!m.shiny, ok: false, reason: '试运行·未购买' });
      return { ok: false, text: '试运行：只记录，没有购买' };
    }

    var sig1 = first.sig;
    try { first.primary.click(); } catch (e) {
      closeModal();
      return { ok: false, text: '第一道确认点不动', retry: true };
    }

    /* 第二道：zt() 会先联网查 market.still()，慢的时候要等；特征是 ghost + primary 两个按钮 */
    var second = await waitFor(function () {
      var mi = modalInfo();
      if (!mi || mi.btns.length < 2 || !mi.primary || mi.disabled) return null;
      if (mi.sig === sig1) return null;
      return mi;
    }, 12000, 200);
    if (!second) {
      /* 商品被别人抢走 / 断线时游戏只弹 toast，不会再有第二道弹窗。
       * 此时还没点过最终确认，允许稍后重试，但要把可能残留的弹窗关掉。 */
      closeModal();
      return { ok: false, text: '没等到最终确认（可能已被买走或网络慢）', retry: true };
    }
    /* 再核一次：最终弹窗里必须是这只宝可梦、这个价格 */
    if (shown > num(m.rulePrice)) {
      closeModal();
      return { ok: false, text: '最终确认前价格核对失败', retry: true };
    }

    var clickedFinal = false;
    try { second.primary.click(); clickedFinal = true; }
    catch (e) { /* 下面按未确认处理 */ }

    if (!clickedFinal) {
      closeModal();
      return { ok: false, text: '最终确认点不动', retry: true };
    }

    /* 已经点了确认：从这一刻起这个 id 永远不再尝试，避免重复扣款 */
    markHandled(id, 'bought', '已点最终确认');
    await waitFor(function () { return !q(Q.modal); }, 8000, 250);

    var verified = await waitFor(function () {
      var d = dailyState(readSave());
      return d.n > before.n || d.shiny > before.shiny;
    }, 8000, 400);
    var pending = dailyState(readSave()).pending;
    var ok = !!verified;
    var reason = ok ? '购买成功' : (pending ? '游戏还在结算（不再重试）' : '没读到成功信号（不再重试）');

    D.stats.bought += ok ? 1 : 0;
    D.stats.spent += ok ? shown : 0;
    D.runBought += ok ? 1 : 0;
    if (ok) D.scanRuleBought[m.ruleId] = num(D.scanRuleBought[m.ruleId], 0) + 1;
    /* 第三十批：买成一次就记进「命中商品」栏（只在内存里，关掉浏览器才清空） */
    if (ok) pushBuy(m, shown);
    /* 买够这条意向的数量 → 自动移出意向表 */
    D.cfg.rules = afterBuy(D.cfg.rules, m.ruleId, ok);
    saveCfg();
    note(ok ? 'ok' : 'warn',
      (ok ? '已买下 ' : '购买结果未确认 ') + listingLabel(m) + ' · ' + fmtMoney(shown) + ' ₽ · ' + reason,
      ok ? 'buy' : 'unknown');
    addHistory({ name: listingLabel(m), price: shown, shiny: !!m.shiny, ok: ok, reason: reason });
    saveStats();
    return { ok: ok, text: reason, price: shown, name: listingLabel(m) };
  }
  function ruleName(ruleId) {
    var r = D.cfg.rules.filter(function (x) { return x.id === ruleId; })[0];
    return r ? r.name : '';
  }
  function pushBuy(m, price) {
    D.buysLog.unshift({
      t: now(), id: safeId(m.id), label: listingLabel(m), price: num(price),
      shiny: !!m.shiny, rule: ruleName(m.ruleId), ruleId: m.ruleId
    });
    if (D.buysLog.length > 80) D.buysLog.length = 80;
    saveBuys();
  }
  /* 买成之后：bought+1；到 qty 就把这条意向从表里摘掉 */
  function afterBuy(list, ruleId, ok) {
    var out = [], done = null;
    (list || []).forEach(function (r) {
      if (r.id !== ruleId) { out.push(r); return; }
      var next = Object.assign({}, r, { bought: num(r.bought) + (ok ? 1 : 0) });
      if (ok && next.bought >= targetQty(next)) { done = next; return; }
      out.push(next);
    });
    if (done) {
      note('ok', '意向已满足：' + done.name + ' ' + done.bought + ' / ' + targetQty(done) +
        ' 只，已自动移出意向表', 'done');
    }
    return out;
  }
  function maxRulePrice(ruleId) {
    var r = D.cfg.rules.filter(function (x) { return x.id === ruleId; })[0];
    return r ? num(r.maxPrice) : 0;
  }

  /* ---------------- 主动扫描 + 购买 ---------------- */
  function pickTarget() {
    var at = now();
    return D.matches.filter(function (m) {
      if (D.handled[m.id]) return false;
      if (m.shiny && D.today && D.today.shinyLeft <= 0) return false;
      if (m.expiresAt && m.expiresAt <= at) return false;
      if (D.cfg.reserve && D.wallet && (D.wallet - m.price < D.cfg.reserve)) return false;
      /* 第三十批：qty 变成「总共要买几只」，买够的意向不再下单 */
      var r = D.cfg.rules.filter(function (x) { return x.id === m.ruleId; })[0];
      if (r && num(r.bought) >= targetQty(r)) return false;
      return true;
    })[0] || null;
  }

  /* 「等一下再试」：把下次检查提前到约 3 秒后，但不改统计里的扫描节奏 */
  function retrySoon() {
    D.lastScanAt = now() - Math.max(0, D.cfg.intervalSec - 3) * 1000;
  }

  async function scanAndBuy() {
    D.lastScanAt = now();
    D.lastAttemptAt = now();
    D.scanRuleBought = {};
    D.stats.scans++;
    if (!D.cfg.armed) { setPhase('未启用'); return { ok: true, text: '未启用，只读监视中' }; }
    var valid = D.cfg.rules.filter(ruleOpen);
    if (!valid.length) {
      setPhase('请先添加意向');
      return { ok: false, text: '还没有有效意向：先填宝可梦 + 意向价格（买够数量的会自动移出）' };
    }
    if (D.today && D.today.pending) {
      setPhase('等游戏结算上一笔');
      return { ok: true, text: '游戏有一笔购买还没结算完，先等一下' };
    }
    if (D.today && D.today.left <= 0) {
      setPhase('今日额度用完');
      if (now() - D.lastCapNoteAt > 300000) {
        D.lastCapNoteAt = now();
        note('info', '今天的 ' + K.BUYS + ' 次购买额度已用完，明天（巴黎时间）自动继续');
      }
      return { ok: true, text: '今日购买额度已用完' };
    }
    if (D.cfg.maxPerRun > 0 && D.runBought >= D.cfg.maxPerRun) {
      setPhase('本次额度用完');
      return { ok: true, text: '本次扫货已达设定上限，点停止可重置' };
    }
    if (hostBusy()) {
      setPhase('让路给其它自动化'); retrySoon();
      return { ok: true, text: '地下通道正在操作页面（它优先），先等一下' };
    }
    if (D.cfg.idleSec > 0 && !hostIdle(D.cfg.idleSec * 1000)) {
      setPhase('等你操作完'); retrySoon();
      return { ok: true, text: '玩家刚操作过，等一下再切页面' };
    }
    if (!D.cfg.autoOpen && !marketActive()) {
      setPhase('等待进入黑市页'); retrySoon();
      return { ok: true, text: '自动切页关着：请自己打开黑市页' };
    }

    /* 第三十批：黑市扫货和地下通道并列为「优先切页」的两件事。
     * 先把「我要用页面」喊出去（20 秒），图鉴 / 道具 / 树果 / 刷钱 / 神兽 / 团体战
     * 这几路循环看到就会主动等一轮，把页面让出来；办完在 finally 里撤回。 */
    hostCall('want', 20000);
    var prev = activeScreenName();
    var result = null;
    try {
      result = await withScreen(async function () {
      if (!await openMarket()) {
        setPhase('黑市打不开'); retrySoon();
        return { ok: false, text: '打不开黑市：可能还没解锁，或游戏没加载完', retry: true };
      }
      /* 进黑市页会触发游戏自己的 He() → 缓存过期时拉新货，给它一点时间 */
      await sleep(700);
      await ensureListTab();
      /* 有些缓存商品被搜索框/闪光过滤挡住，清完过滤后重新读 DOM */
      poll();
      var target = pickTarget();
      if (!target) {
        setPhase('没有符合条件的商品');
        return { ok: true, text: '扫描完成：' + D.listings.length + ' 件在售，没有符合意向的' };
      }
      /* 命中但商品卡没渲染：清过滤后再给一次机会 */
      if (!target.dom) {
        await ensureListTab();
        await sleep(400);
        poll();
        target = pickTarget();
      }
      if (!target || !target.dom) {
        setPhase('命中的商品没在页面上');
        note('warn', '命中 ' + (target ? listingLabel(target) : '商品') + '，但游戏没渲染出商品卡，先跳过', 'skip');
        return { ok: true, text: '命中的商品没在页面上（可能被地区/搜索条件挡住）' };
      }
      setPhase('正在购买 ' + listingLabel(target));
      var r = await buyListing(target);
      if (r && r.retry && r.text) {
        D.stats.failed++;
        markHandled(target.id, 'fail', r.text);
        note('warn', '本次没买成：' + r.text, 'fail');
        saveStats();
      }
      setPhase(r && r.ok ? '购买完成' : '本轮结束');
      return r || { ok: true, text: '本轮结束' };
      });
    } finally {
      hostCall('done');
    }
    restoreScreen(prev);
    saveStats();
    return result;
  }

  async function scan(force) {
    if (D.busy) return { ok: true, text: '上一轮还没结束' };
    D.busy = true;
    try {
      poll();
      var r = await scanAndBuy();
      poll();
      return r;
    } catch (e) {
      note('error', '扫描异常：' + ((e && e.message) || e));
      return { ok: false, text: '出错了：' + ((e && e.message) || e) };
    } finally {
      D.busy = false;
    }
  }

  function start(patch) {
    if (patch && Object.keys(patch).length) config(patch);
    var valid = D.cfg.rules.filter(ruleOpen);
    if (!valid.length) {
      setPhase('请先添加意向');
      return { ok: false, text: '先添加至少一条意向（宝可梦 + 意向价格），再开始扫货' };
    }
    D.runBought = 0;
    D.cfg.armed = true;
    saveCfg();
    D.lastScanAt = 0;
    D.newHit = true;
    setPhase('等待扫描');
    note('info', '开始扫货：' + valid.length + ' 条意向 · 每次间隔 ' + D.cfg.intervalSec + ' 秒' +
      (D.cfg.dryRun ? ' · 试运行（不会花钱）' : ''));
    poll();
    return { ok: true, text: '已开始扫货：' + valid.length + ' 条意向，命中就自动购买' };
  }
  function stop() {
    D.cfg.armed = false;
    saveCfg();
    setPhase('已停止');
    note('info', '已停止扫货（意向表会保留）');
    try { poll(); } catch (e) { /* 立刻把「已停止」同步给 popup，别留着旧快照 */ }
    return { ok: true, text: '已停止扫货' };
  }
  function clear() {
    D.stats = Object.assign({}, ZERO_STATS, { since: now() });
    D.history = [];
    D.events = [];
    D.handled = {};
    D.seenIds = {};
    D.runBought = 0;
    saveStats();
    note('info', '观测统计与去重表已清零（「命中商品」的购买记录保留，关掉浏览器才清空）');
    try { poll(); } catch (e) { /* 同上：统计与事件流要立刻反映到面板 */ }
    return { ok: true, text: '统计已清零（命中商品记录会保留，关掉浏览器才清空）' };
  }

  /* ---------------- 游戏页内悬浮看板（第三十批：改用统一看板） ----------------
   * 以前黑市自己画一套卡片，样式和别的任务不一样，而且只在黑市页才出现。
   * 现在跟图鉴捕捉 / 传说追踪 / 道具 / 树果 / 刷钱一样走 PCG_HUD：
   * 功能开启时自动出现，停止自动收起，位置 / 折叠状态跟其它看板一起记。
   *
   * 额外多一件事：列表里除了「价格够、马上会买」的，还会列出「是意向里的
   * 宝可梦、只是挂牌价超了」的那些，按价格从低到高排；点一下就把这只按现在
   * 的挂牌价加进意向表（qty 默认 1），下一轮就买。 */
  function hudPanel() {
    if (!root.PCG_HUD || typeof root.PCG_HUD.panel !== 'function') return null;
    try {
      return root.PCG_HUD.panel('market', '黑市扫货', {
        onRow: hudRowClick,
        /* 第五十一批：顶栏的 × 就是 popup 里那颗「停止扫货」 */
        onClose: function () { stop(); }
      });
    } catch (e) { return null; }
  }

  /* 点悬浮栏里「超价」那一行：按这只现在的挂牌价加进意向表，下一轮就买 */
  function hudRowClick(key) {
    var s = String(key || '');
    if (s.indexOf('add:') !== 0) return;
    var id = safeId(s.slice(4));
    if (!id) return;
    var pick = null;
    (D.overBudget || []).forEach(function (x) { if (x.id === id) pick = x; });
    if (!pick) return;
    var r = addIntentFromListing(pick);
    D.note = (r && r.text) || '';
    note(r && r.ok ? 'ok' : 'warn', D.note);
    try { poll(); } catch (e) { /* ignore */ }
    if (r && r.ok) retrySoon();
  }

  /* 把在售商品一键变成一条意向（价格就是它现在的挂牌价） */
  function addIntentFromListing(l) {
    if (!l || !l.id) return { ok: false, text: '商品信息不全，先不加' };
    var q = l.dex ? String(l.dex) : (l.zh || l.name || '');
    if (!q) return { ok: false, text: '这只商品的图鉴号 / 名字都读不到，先不加' };
    var price = num(l.price);
    if (price < K.MIN_PRICE) return { ok: false, text: '挂牌价太低（低于 ' + K.MIN_PRICE + ' ₽），游戏不会成交' };
    var wantShiny = l.shiny ? 'only' : 'any';
    var dup = D.cfg.rules.filter(function (r) {
      return r.dex === l.dex && num(r.maxPrice) >= price &&
        (r.shiny === 'any' || r.shiny === wantShiny);
    })[0];
    if (dup) return { ok: false, text: '意向表里已经有「' + dup.name + '」，这个价也买得到' };
    var res = rules('add', {
      rule: { query: q, maxPrice: price, shiny: wantShiny, qty: 1 }
    });
    if (!res || !res.ok) return res || { ok: false, text: '加进意向表失败' };
    return { ok: true, text: '已加进意向表：' + listingLabel(l) + ' ≤ ' + fmtMoney(price) + ' ₽，下一轮就买' };
  }

  function hudPaint(snap, force) {
    void force;
    var P = hudPanel();
    if (!P) return;
    /* 跟其它任务同一套规矩：功能没开 / 看板关了就不出现 */
    if (!D.cfg.hud || !D.cfg.armed) { P.hide(); return; }
    if (!snap) snap = buildSnap();
    var today = snap.today || dailyState(null);
    var rows = [];
    (snap.matches || []).slice(0, 3).forEach(function (m) {
      rows.push({
        nm: m.label, sub: '≤ ' + fmtMoney(m.rulePrice),
        val: fmtMoney(m.price) + ' ₽', w: m.shiny ? 'sh' : ''
      });
    });
    if (!rows.length) {
      (snap.overBudget || []).slice(0, 4).forEach(function (l) {
        rows.push({
          nm: '＋ ' + l.label, sub: '超 ' + fmtMoney(l.over),
          val: fmtMoney(l.price) + ' ₽', k: 'add:' + l.id, w: 'add',
          t: '点一下：按 ' + fmtMoney(l.price) + ' ₽ 加进意向表'
        });
      });
    } else {
      (snap.overBudget || []).slice(0, 2).forEach(function (l) {
        rows.push({
          nm: '＋ ' + l.label, sub: '超 ' + fmtMoney(l.over),
          val: fmtMoney(l.price) + ' ₽', k: 'add:' + l.id, w: 'add',
          t: '点一下：按 ' + fmtMoney(l.price) + ' ₽ 加进意向表'
        });
      });
    }
    var foot = (snap.phase || '') + ' · 已买 ' + (snap.stats.bought || 0) + ' 只 / ' +
      fmtMoney(snap.stats.spent) + ' ₽';
    if ((snap.overBudget || []).length) foot += ' · 金色行点一下就能加价买';
    if (snap.cfg && snap.cfg.dryRun) foot += ' · 试运行（不花钱）';
    P.set({
      star: snap.armed ? (snap.matches.length ? '● ' + snap.matches.length : '○') : '',
      cells: [
        ['今日已买', (today.n || 0) + ' / ' + K.BUYS, (today.n || 0) >= K.BUYS ? 'gold' : ''],
        ['闪光额度', (today.shinyLeft == null ? 0 : today.shinyLeft) + ' / ' + K.SHINY_BUYS],
        ['已买', snap.stats.bought || 0],
        ['在售 / 超价', (snap.listings || 0) + ' / ' + (snap.overBudget || []).length]
      ],
      rows: rows,
      rowsClick: true,
      empty: '没有符合意向的在售商品',
      foot: foot,
      footOn: true
    }).show();
  }

  /* ---------------- 状态 ---------------- */
  function buildSnap() {
    return {
      ok: true,
      armed: !!D.cfg.armed,
      phase: D.phase,
      note: D.note,
      cfg: configView(),
      rules: D.cfg.rules.slice(),
      validRules: D.cfg.rules.filter(ruleValid).length,
      listings: D.listings.length,
      shinyListings: D.listings.filter(function (l) { return !!l.shiny; }).length,
      matches: D.matches.slice(0, 20).map(function (m) {
        return {
          id: m.id, dex: m.dex, name: m.name, zh: m.zh, label: listingLabel(m),
          shiny: !!m.shiny, price: m.price, seller: m.seller, dom: !!m.dom,
          expiresAt: m.expiresAt, ruleId: m.ruleId, rulePrice: m.rulePrice,
          handled: !!D.handled[m.id]
        };
      }),
      allListings: D.listings.slice(0, 30).map(function (l) {
        return { id: l.id, label: listingLabel(l), price: l.price, shiny: !!l.shiny,
          seller: l.seller, dom: !!l.dom, expiresAt: l.expiresAt };
      }),
      /* 第三十批：意向里的宝可梦、挂牌价超了的一批（按价格从低到高） */
      overBudget: D.overBudget.slice(0, 12).map(function (l) {
        return { id: l.id, dex: l.dex, label: listingLabel(l), price: l.price,
          shiny: !!l.shiny, ruleId: l.ruleId, rulePrice: l.rulePrice, over: l.over };
      }),
      /* 买成的记录：只在内存里，关掉浏览器才清空 */
      buys: D.buysLog.slice(0, 30).map(function (b) {
        return { t: b.t, label: b.label, price: b.price, shiny: !!b.shiny, rule: b.rule };
      }),
      today: D.today || dailyState(null),
      wallet: D.wallet,
      unlocked: !!(D.today && D.today.found),
      screen: marketActive(),
      cacheAt: D.cacheAt,
      cacheAge: D.cacheAt ? fmtAgo(now() - D.cacheAt) : '还没读到',
      stats: Object.assign({}, D.stats),
      runBought: D.runBought,
      history: D.history.slice(0, 15),
      events: D.events.slice(0, 20),
      logs: D.events.slice(0, 25),
      lastScanAt: D.lastScanAt,
      nextScanAt: D.cfg.armed ? D.lastScanAt + D.cfg.intervalSec * 1000 : 0,
      consts: { BUYS: K.BUYS, SHINY_BUYS: K.SHINY_BUYS, MIN_PRICE: K.MIN_PRICE,
        REFRESH_MS: K.REFRESH_MS, MAX_RULES: K.MAX_RULES }
    };
  }
  function configView() {
    var c = Object.assign({}, D.cfg);
    c.rules = D.cfg.rules.slice();
    return c;
  }
  function state() { return D.snap || buildSnap(); }

  /* ---------------- 启动 / 定时循环 ---------------- */
  function tick() {
    if (!D.loaded || D.busy) return;
    var at = now();
    if (at - D.lastPollAt < 2000) return;
    D.lastPollAt = at;
    try { poll(); } catch (e) { note('warn', '轮询异常：' + ((e && e.message) || e)); }
    /* 新货命中可以立刻复扫，但两轮之间至少隔 5 秒，别把页面来回拽 */
    var due = D.cfg.armed && at - D.lastAttemptAt >= 5000 &&
      (D.newHit || at - D.lastScanAt >= D.cfg.intervalSec * 1000);
    if (!due || D.busy) return;
    D.newHit = false;
    D.busy = true;
    scanAndBuy().then(function (r) {
      if (r && r.text) D.note = r.text;
      try { poll(); } catch (e) { /* ignore */ }
    }).catch(function (e) {
      note('error', '扫货异常：' + ((e && e.message) || e));
    }).then(function () { D.busy = false; });
  }

  var util = {
    normName: normName, resolveIds: resolveIds, isAnyQuery: isAnyQuery,
    parseMoney: parseMoney, parseDexNo: parseDexNo, safeId: safeId,
    fmtMoney: fmtMoney, fmtAgo: fmtAgo, parisDay: parisDay,
    dailyState: dailyState, normalizeListing: normalizeListing,
    mergeListings: mergeListings, matchRule: matchRule,
    matchListings: matchListings, rankMatches: rankMatches,
    nearMissRule: nearMissRule, nearMisses: nearMisses,
    targetQty: targetQty, ruleOpen: ruleOpen, afterBuy: afterBuy,
    sanitizeRule: sanitizeRule, sanitizeCfg: sanitizeCfg, ruleValid: ruleValid,
    listingLabel: listingLabel, readCache: readCache,
    addIntentFromListing: addIntentFromListing
  };

  root.PCG_MARKET = {
    state: state, config: config, rules: rules,
    start: start, stop: stop, scan: scan, clear: clear,
    poll: poll, util: util,
    CFG_KEY: CFG_KEY, STATS_KEY: STATS_KEY, BUYS_KEY: BUYS_KEY, CONST: K
  };

  storeGet(CFG_KEY, function (saved) {
    if (saved) D.cfg = sanitizeCfg(saved);
    storeGet(STATS_KEY, function (st) {
      if (st) {
        D.stats = Object.assign({}, ZERO_STATS, st.stats || {}, { since: now() });
        D.handled = st.handled || {};
        D.history = Array.isArray(st.history) ? st.history : [];
      } else {
        D.stats.since = now();
      }
      D.loaded = true;
      loadBuys();
      try { poll(); } catch (e) { /* ignore */ }
      if (D.cfg.armed && resumeOk()) {
        D.runBought = 0;
        D.lastScanAt = 0;
        setPhase('等待扫描');
        note('info', '检测到上次未停的扫货任务，自动恢复');
      } else if (D.cfg.armed) {
        D.cfg.armed = false;
        saveCfg();
      }
    });
  });

  try {
    if (root.setInterval) root.setInterval(function () {
      try { tick(); } catch (e) { note('warn', '定时轮询异常：' + ((e && e.message) || e)); }
    }, 1000);
    if (root.setTimeout) root.setTimeout(function () {
      try { poll(); } catch (e) { /* ignore */ }
    }, 1600);
    if (root.PCG_THEME && root.PCG_THEME.onChange) {
      root.PCG_THEME.onChange(function () { hudPaint(D.snap, true); });
    }
  } catch (e) { /* 非浏览器环境 */ }
})(typeof window !== 'undefined' ? window : this);
