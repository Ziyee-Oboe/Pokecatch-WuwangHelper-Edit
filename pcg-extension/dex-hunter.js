/* Poke'Catch 防掉线助手 —— 图鉴捕捉（第六批：完全重构）
 *
 * 旧版（v1.11.0）做法是一张张打开地图章节、读 .mp-grid 里的图鉴格子，
 * 再按格子位次估概率排序。问题：慢、依赖地图详情 DOM、和游戏图鉴页的
 * 「未捕捉」概念对不上（游戏 lost = 已抓过但不再拥有，不该再抓）。
 *
 * 新版完全由存档 + 离线数据表驱动，不再扫描章节：
 *   1. 数据源 PCG_DEX_DATA.uncaughtList(save) = !save.dex[id]，
 *      天然排除「已拥有 / 不再拥有」，并排除传说 / 幻兽（获取方式特殊）。
 *   2. 对每只未捕捉宝可梦生成一张「状态卡」：幼体 / 等级进化 / 道具进化
 *      （道具是否拥有）/ 天气限制（需求 + 当前）/ 时段要求 / 地图未开放 /
 *      可去的最优章节与出没概率。
 *   3. 状态为 ready（条件已满足或本来就无条件）的，直接按概率挑最高效章节
 *      出发捕捉；有天气 / 时段窗口且此刻生效的抬进第一档（稀缺窗口优先）。
 *   4. 捕捉进度看存档 dex[id] 是否出现，抓到就重算清单，不再读地图格子。
 *   5. 面板显示四个地区各还差多少只，以及每只未捕捉宝可梦的状态。
 *
 * 游戏自带「自动捕捉新宝可梦」常开，本模块只负责把队伍带到对的章节。
 * 所有切图先过 PCG_SHINY_GUARD：遇到闪光宝可梦，战斗结算完才切走。
 *
 * 【第二十三批】切章刷新只在「所在地区」里转：同一只宝可梦在别的地区也有
 * 出没点时，优先留在玩家现在所在地区的那个；「绕中立章再重进」也由
 * PCG_MAP_CYCLE 保证同地区、且不停在正被游走神兽占着的章节。
 *
 * 【第三十九批】限制条件（spawns[].off）：
 *   游戏 HABITATS 的条件池除了「加成 / 只在这里出现」，还有第三种写法——
 *   基础池里有的物种，在某个条件池里被写成权重 0（night:{太阳岩:0} /
 *   day:{月石:0} / storm:{卡蒂狗:0}），意思就是**这种天气或时段里它刷不出来**。
 *   以前只认夜晚清零，于是月石（要求夜晚）白天也挂在「可直接捕捉」里，
 *   去了也遇不到。现在按 off 通用判定：命中就转「等待时段 / 等待天气」，
 *   卡片上写明「白天 时刷不出来」，条件过去后自动接着追。
 *   另外清单不再只靠手动 / 5 分钟重扫：DOM 里各章节的当前天气与当前时段一变，
 *   4 秒内就会自己重算一遍（autoRescan），窗口开了立刻能抢。
 *
 * 数据边界：只读页面 localStorage 的游戏存档与 DOM、模拟点击；
 * 配置和断点写在扩展自己的 chrome.storage.local，绝不写游戏存档。
 */
(function (root) {
  'use strict';

  var CFG = root.PCG_CONFIG || null;
  var STAB = root.PCG_STAB || null;
  var NAMES = (STAB && STAB.nm) || {};       // { 图鉴号: 中文名 }，493 只，来自 stab.js
  var DATA = root.PCG_DEX_DATA || null;      // 离线表：图鉴 / 进化 / 出现条件 / 章节
  var FILTER = null;                        // 运行时取，加载期还没挂上
  var UI = root.PCG_GAME_UI || null;        // 游戏原生小图标 / 配色 / 天气图标
  var MAP = root.PCG_MAP_CYCLE || null;     // 通用「切图重进」引擎（神兽追踪同款）

  function sel(key, fallback) {
    var v = (CFG && typeof CFG.sel === 'function') ? CFG.sel(key) : '';
    return v || fallback;
  }
  var Q = {
    mapScreen: sel('dexMapScreen', '#screen-map'),
    mapTab: sel('dexMapTab', '#tabs [data-screen="map"]'),
    advTab: sel('dexAdvTab', '#tabs [data-screen="adventure"]'),
    regionOpen: sel('dexRegionCard', '.rg.open[data-rg]'),
    regionAny: sel('dexRegionAny', '.rg[data-rg]:not(.depart):not([data-depart])'),
    row: sel('dexMapRow', '.mp-row[data-ch]'),
    detail: sel('dexMapDetail', '.pg-info'),
    detClose: sel('dexDetailClose', '.pg-det-x'),
    grid: sel('dexGrid', '.mp-grid'),
    cell: sel('dexCell', '[data-dex]'),
    cond: sel('dexZoneCond', '.zone-cond'),
    go: sel('dexMapGo', '.mp-go[data-go]'),
    speed: sel('dexSpeedBtns', '#speed-btns'),
    condNow: sel('dexCondNow', '.zone-cond.now'),
    weather: sel('dexWeatherNow', '[data-weather], .weather-now, .wx-now, #weather-now'),
    chapterRow: sel('dexChapterRow', '.mp-row[data-ch]'),
    chapterWeather: sel('dexChapterWeather', '.pg-wx[data-cond]'),
    wxLine: sel('dexWxLine', '.wx[data-cond]'),
    weatherBar: sel('dexWeatherBar', '.sb-h[class*="wx-"].now'),
    zoneWeather: sel('dexZoneWeather', '.zone-weather.now'),
    condAny: sel('dexCondAny', '.zone-cond[data-cond]')
  };

  var CFG_KEY = 'pcgDexCfgV1';
  var RUN_KEY = 'pcgDexRunV1';

  var DEFAULT_CFG = {
    mode: 'missing',        // missing = 一键补全「未捕捉」 / target = 指定宝可梦 / rotom = 刷洛托姆 5 形态
    target: '',             // 中文名 / 图鉴号 / 游戏内显示名
    /* 第六十九批：刷洛托姆模式要刷哪几个形态（ROTOM_FORMS 的下标），默认 5 个全刷。
     * 第八十三批：多了一项「普通洛托姆」（下标 5），它是 5 种形态的前置 ——
     * 没拿到它时勾选会被强制改成 [5]（只刷它），拿到后自动换回 [0,1,2,3,4]。 */
    rotomPick: [0, 1, 2, 3, 4],
    /* 第八十三批：普通洛托姆是否已经「开过门」——拿到它的那一刻把 5 种形态
     * 自动全勾上，且**只做一次**，不会盖掉玩家后来的手动勾选。 */
    rotomBaseOk: false,
    speed: 3,               // 游戏速度 ×1 / ×2 / ×3
    intervalSec: 20,        // 每隔多少秒回读一次存档看图鉴进度
    /* 第七十六批：删掉三项挂钟参数 —— timeoutMin（单只超时换下一只）、
     * stallMin（无新捕获 N 分钟重开一轮）、rerollSec（同一章待太久，重开一轮
     * 保证效率）。旧存档里残留的同名字段会被 sanitize 直接丢掉。 */
    condFirst: true,        // 天气 / 时段限定且当前生效的，优先捕捉
    waitWeather: true,      // 只剩等待条件的目标时，留在章节里等轮换
    /* 第一百一十五批：等待选项（默认关）。
     * 关 = 所有勾选目标都不可捕捉时自动关闭功能（玩家要求的默认收尾）；
     * 开 = 不可捕捉时原地等条件生效，不切图、不关闭，条件满足了继续捕捉。 */
    waitCond: false,
    allRegions: true,       // 保留兼容：清单本来就跨全部地区
    autoPop: true,          // 自动点掉单一确认按钮的弹窗
    resume: true,           // 兼容旧配置；第二十五批起由页面自动化里的 resumeOn 统一决定
    showEvo: true,          // 状态卡里同时给出进化路径（幼体 / 等级 / 道具是否拥有）
    listFilter: '',         // popup 分类筛选：ready/waiting/evo/hatch/locked/special/空
    condExit: true,         // 追踪目标的限制条件失效时，立刻换下一只
    reroll: true,           // 错过刷新点就按神兽追踪逻辑切图重进（所有切图功能默认）
    /* 第三十八批：条件（天气 / 时段）一直不生效时最多干等多久（分钟）。
     * 补全模式到点先跳过这只去追别的；指定捕捉模式继续等，但会在状态行 /
     * 日志里说明「在等窗口」，不会切图空转、也不会看着像卡死。 */
    waitMaxMin: 20,
    autoStopNoReady: true,  // 「可直接捕捉」为 0 时自动关闭功能，别空转
    /* 第二十九批：指定宝可梦模式默认一直刷同一种，直到本轮真抓到它的闪光才收工。
     * 第一百零七批：判定改成「点开始之后新增的闪光实例」；历史 seenShiny /
     * dex[id].shiny（闪光图鉴已解锁）不再算，也不再据此把目标踢出清单。
     * 关掉就退回旧逻辑：抓到一只就停。 */
    untilShiny: true
  };

  var D = {
    running: false,
    phase: '空闲',
    cfg: Object.assign({}, DEFAULT_CFG),
    cards: [],              // 全部未捕捉宝可梦的状态卡
    rotom: [],              // 第六十九批：5 种洛托姆形态的追踪进度（有几只 / 在哪 / 什么条件）
    plan: [],               // 可去的目标（状态卡的子集）
    gaps: [],               // 四个地区缺口
    totals: { uncaught: 0, ready: 0, waiting: 0, evo: 0, hatch: 0, locked: 0, special: 0, excluded: 0 },
    weather: { key: '', label: '未知', src: 'none' },
    time: { key: '', label: '未知', src: 'none' },
    unlocked: 0,
    cur: null,
    curSince: 0,
    condHold: null,      // 条件失效后给这只 90 秒冷却，别立刻又选回来
    /* 第八十七批：跳过的形态改记在配置里（D.cfg.rotomSkip），跟着配置持久化 ——
     * 关掉功能之后重新点开始，只要条件回来了它自己就会重新参与，不用玩家再勾一次。 */
    parkSince: 0,        // 兼容旧断点：以前「勾的全被跳过」从什么时候开始等（新口径不再等）
    lastScanAt: 0,
    doneCh: [],             // 兼容旧字段：现在存已抓到的图鉴号
    skipped: [],            // 兼容旧字段：现在存跳过的图鉴号
    found: null,
    note: '',
    stats: { caught: 0, travels: 0, rescans: 0, rerolls: 0, condSwitches: 0 },
    caughtOnce: {},          // 本轮已经计过「进图鉴」的图鉴号，重复抓到不再计数
    shinyHave: {},           // 指定宝可梦模式：开局就已经「点亮过闪光图鉴」的图鉴号（只作提示）
    /* 第一百零七批：开局快照。
     * dexAtStart     —— 目标开局是否已经在图鉴里（已抓过 / 闪光图鉴已解锁）。
     *                   这类目标不能再用「dex[id] 出现」当「刚抓到」，否则一启动就收工。
     * shinyBaseKeys  —— 开局手上所有闪光实例的 uid 集合；「刷到出闪」只认这之后新增的，
     *                   不再被 seenShiny / dex[id].shiny 这类历史记录误判。 */
    dexAtStart: {},
    shinyBaseKeys: {},
    logs: []
  };

  /* ---------------- 小工具 ---------------- */
  function q(s, r) {
    try { return (r || document).querySelector(s); } catch (e) { return null; }
  }
  function qa(s, r) {
    try { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    catch (e) { return []; }
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function txt(el) { return String((el && el.textContent) || '').trim(); }

  function normName(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, '')
      .replace(/[·•・]/g, '')
      .toLowerCase();
  }

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
    // 离线表带法文名，兼容玩家直接粘游戏里的显示名
    if (!ids.length && DATA && DATA.mons) {
      Object.keys(DATA.mons).forEach(function (k) {
        if (normName(DATA.mons[k].f) === n) ids.push(Number(k));
      });
    }
    return ids;
  }

  /* 第三十八批：指定捕捉**一次只追一只**。
   * 名字写得不巧（或法文名撞车）匹配到好几只时，老代码会一只一只换着追，
   * 在游戏里的表现就是不停地切章节重进。这里固定取图鉴号最小的那只；
   * 「查找」按钮要全部候选时仍用 resolveIds()。 */
  function wantIds(query) {
    var q = query == null ? D.cfg.target : query;
    var w = resolveIds(q).slice().sort(function (a, b) { return a - b; });
    return w.length > 1 ? [w[0]] : w;
  }

  /* 天气 / 时段中文标签（离线表 weatherZh 打底，这里补齐 bundle 里出现过的 key） */
  var COND_ZH = {
    clear: '晴朗', rain: '下雨', sun: '大晴天', storm: '暴风雨', snow: '下雪',
    breeze: '微风', sand: '沙暴', blizzard: '暴风雪', fog: '雾',
    day: '白天', night: '夜晚', morning: '早晨', dusk: '黄昏',
    high_tide: '涨潮', tide: '涨潮', surf: '冲浪'
  };
  var WEATHER_KEYS = { rain: 1, sun: 1, storm: 1, snow: 1, clear: 1,
    breeze: 1, sand: 1, blizzard: 1, fog: 1, ash: 1,
    'tide-low': 1, 'tide-high': 1 };
  var TIME_KEYS = { day: 1, night: 1, morning: 1, dusk: 1 };

  function condLabel(k) {
    if (!k) return '';
    // 优先用游戏官方中文语言包 / WEATHER.TYPES 里的名字
    var w = UI && UI.weather ? UI.weather(k) : null;
    if (w) return w.zh;
    var t = UI && UI.time ? UI.time(k) : null;
    if (t) return t.zh;
    var zh = (DATA && DATA.weatherZh) || {};
    return COND_ZH[k] || zh[k] || k;
  }
  function condIcon(k) {
    var w = UI && UI.weather ? UI.weather(k) : null;
    if (w) return w.icon;
    var t = UI && UI.time ? UI.time(k) : null;
    return t ? t.icon : '';
  }
  /* 第九十七批：玩家要求「图鉴捕捉里所有天气 / 时段都换成游戏里那个图标」。
   * 游戏自己的进度页 / 地图详情 / 图鉴页写的就是「🌙 夜晚」「🌙·🌧️ 下雨」这种
   * 药丸，图标来自 t.CONFIG.WEATHER.TYPES 与 t.DAYTIME.PHASES（game-ui.js 已抄一份）。
   * 所以显示串统一拼成「图标 + 中文名」：卡片明细、看板、筛选 chip、日志全走这一个口，
   * 不会再出现一处有图标、另一处只有文字。UI 没加载时退回纯文字。 */
  function condGlyph(k) {
    var zh = condLabel(k);
    if (!zh) return '';
    var ic = condIcon(k);
    return ic ? (ic + ' ' + zh) : zh;
  }
  function condsLabel(list) {
    var out = [];
    (list || []).forEach(function (k) {
      var l = condGlyph(k);
      if (l && out.indexOf(l) < 0) out.push(l);
    });
    return out;
  }
  function isWeatherCond(k) { return !!WEATHER_KEYS[k]; }
  function isTimeCond(k) { return !!TIME_KEYS[k]; }

  /* ---------------- 日志 / 配置 / 断点 ---------------- */
  function note(level, text) {
    var full = '图鉴捕捉：' + text;
    try {
      if (root.PCG_LOG && typeof root.PCG_LOG.push === 'function') {
        root.PCG_LOG.push(level, 'dex', full);
      }
    } catch (e) { /* ignore */ }
    D.logs.unshift({ t: Date.now(), level: level, m: text });
    if (D.logs.length > 60) D.logs.length = 60;
  }
  function setPhase(text) { D.phase = text; }

  function sanitize(c) {
    var o = Object.assign({}, DEFAULT_CFG, c || {});
    o.mode = (o.mode === 'target') ? 'target' : (o.mode === 'rotom' ? 'rotom' : 'missing');
    /* 第六十九批：勾了哪几个洛托姆形态（下标 0-4），空 = 5 个全刷。
     * 第八十三批：下标 5 = 普通洛托姆（5 种形态的前置），合法范围跟着放宽到 5。 */
    var rp = Array.isArray(o.rotomPick) ? o.rotomPick : null;
    if (rp) {
      var keep = [];
      rp.forEach(function (v) {
        var n = parseInt(v, 10);
        if (n >= 0 && n <= ROTOM_BASE_I && keep.indexOf(n) < 0) keep.push(n);
      });
      o.rotomPick = keep;
    } else {
      o.rotomPick = [0, 1, 2, 3, 4];
    }
    /* 第八十七批：洛托姆「条件不满足 → 跳过这一项」的名单（下标 → 缺什么 / 下次窗口） */
    var rs = o.rotomSkip, rsOut = {};
    if (rs && typeof rs === 'object' && !Array.isArray(rs)) {
      Object.keys(rs).forEach(function (k) {
        var n = parseInt(k, 10);
        if (!(n >= 0 && n <= ROTOM_BASE_I)) return;
        var v = rs[k] || {};
        rsOut[n] = {
          need: String(v.need || '').slice(0, 40),
          miss: String(v.miss || '').slice(0, 40),
          at: num(v.at, 0),
          nextAt: num(v.nextAt, 0)
        };
      });
    }
    o.rotomSkip = rsOut;
    o.target = String(o.target || '').trim().slice(0, 60);
    o.speed = clamp(parseInt(o.speed, 10) || 3, 1, 3);
    o.intervalSec = clamp(parseInt(o.intervalSec, 10) || 20, 5, 600);
    /* 第七十六批：三项挂钟参数不再保留（timeoutMin / stallMin / rerollSec）——
     * 显式删掉，免得旧配置带着它们继续被读。 */
    delete o.timeoutMin;
    delete o.stallMin;
    delete o.rerollSec;
    ['condFirst', 'waitWeather', 'waitCond', 'allRegions', 'autoPop', 'resume', 'showEvo',
      'condExit', 'reroll', 'autoStopNoReady', 'untilShiny', 'rotomBaseOk'].forEach(function (k) {
      o[k] = !!o[k];
    });
    /* 第五十五批：等轮换 / 进化路径 / 自动关单一确认弹窗三项默认开启且已隐藏，
     * 配置层钉死成 true，旧存档里存过 false 也拉回来。 */
    o.waitWeather = true;
    o.showEvo = true;
    o.autoPop = true;
    var CAT_KEYS = ['ready', 'waiting', 'evo', 'hatch', 'locked', 'special'];
    o.listFilter = CAT_KEYS.indexOf(o.listFilter) >= 0 ? o.listFilter : '';
    o.waitMaxMin = clamp(parseInt(o.waitMaxMin, 10) || 20, 2, 720);
    return o;
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
  function storeDel(key) {
    try { chrome.storage.local.remove(key, function () { void chrome.runtime.lastError; }); }
    catch (e) { /* ignore */ }
  }
  function config(patch) {
    var p = Object.assign({}, patch || {});
    /* 第三十八批：跑起来之后不许换模式 / 换目标。
     * 半路换会让主循环拿着上一只的 card 按新模式去判断（比如「补全」的清单
     * 突然按「指定捕捉」的语义跑），表现就是一会儿追这只、一会儿追那只，
     * 一会儿切图重进——必须先停下来再换。 */
    if (D.running) { delete p.mode; delete p.target; }
    D.cfg = sanitize(Object.assign({}, D.cfg, p));
    storeSet(CFG_KEY, D.cfg);
    return Object.assign({}, D.cfg);
  }
  function saveRun() {
    if (!D.running) { storeDel(RUN_KEY); return; }
    storeSet(RUN_KEY, {
      mode: D.cfg.mode, target: D.cfg.target,
      ch: D.cur ? D.cur.ch : null,
      id: D.cur ? D.cur.id : null,
      at: Date.now()
    });
  }

  /* ---------------- 与 content.js 的桥（页面租约 / 互斥） ---------------- */
  function guard() { return root.PCG_SHINY_GUARD || null; }
  function shinyBlocked() {
    var g = guard();
    try { return !!(g && typeof g.blocked === 'function' && g.blocked()); }
    catch (e) { return false; }
  }
  async function guardWait(owner) {
    var g = guard();
    if (!g || typeof g.waitClear !== 'function' || !shinyBlocked()) return true;
    try { return await g.waitClear(owner, 180000); } catch (e) { return true; }
  }
  function host() { return root.PCG_DEX_HOST || null; }
  function hostCall(name) {
    var h = host();
    try { return (h && typeof h[name] === 'function') ? h[name]() : false; }
    catch (e) { return false; }
  }
  function hostBusy() {
    return !!(hostCall('busy') || hostCall('screenBusy') || hostCall('otherAuto'));
  }
  async function withScreen(fn) {
    var h = host();
    try { if (h && typeof h.hold === 'function') h.hold(25000); } catch (e) { /* ignore */ }
    try { return await fn(); }
    finally { try { if (h && typeof h.free === 'function') h.free(); } catch (e2) { /* ignore */ } }
  }

  /* ---------------- 只读存档 / 当前天气与时段 ---------------- */
  var lastSaveRaw = '', lastSaveObj = null, lastSaveAt = 0;
  function readSave() {
    var SAVE = (typeof root !== 'undefined' && root && root.PCG_SAVE) ||
      (typeof window !== 'undefined' && window.PCG_SAVE) || null;
    if (SAVE) return SAVE.read();
    var at = Date.now();
    if (lastSaveObj && at - lastSaveAt < 800) return lastSaveObj;
    var raw = '';
    try { raw = localStorage.getItem((CFG && CFG.SAVE_KEY) || 'gachamon-save-v1') || ''; }
    catch (e) { raw = ''; }
    if (raw === lastSaveRaw && lastSaveObj) { lastSaveAt = at; return lastSaveObj; }
    lastSaveRaw = raw;
    try { lastSaveObj = raw ? JSON.parse(raw) : null; } catch (e) { lastSaveObj = null; }
    lastSaveAt = at;
    return lastSaveObj;
  }

  function parisHour() {
    try {
      var s = new Date().toLocaleString('en-GB', {
        timeZone: 'Europe/Paris', hour: '2-digit', hour12: false
      });
      var h = parseInt(s, 10);
      return isFinite(h) ? h : -1;
    } catch (e) { return -1; }
  }

  /* 第七批：当前天气优先从「关卡」（地图章节行 .mp-row .pg-wx）读。
   * 游戏把每个章节里各条路线此刻的天气渲染成 <span class="pg-lv pg-wx"
   * data-cond="rain">🌧️ 下雨</span>，这才是刷怪真正在用的天气；
   * 全局天气条 / zone 面板只作兜底。byCh 让每只宝可梦按自己目标章节
   * 的天气判定，不会拿别的章的雨误判成「条件已生效」。 */
  function normCond(k) {
    k = String(k || '').trim();
    if (!k) return '';
    if (UI && typeof UI.weatherKeyFromText === 'function') {
      k = UI.weatherKeyFromText(k) || k;
    }
    return k;
  }
  function chapterWeatherMap() {
    var byCh = {}, all = [];
    var rows = qa(Q.chapterRow);
    for (var i = 0; i < rows.length; i++) {
      var ch = rows[i].getAttribute('data-ch');
      if (ch == null) continue;
      /* 即使这一章没有任何天气徽标也要登记空数组：
       * 「有行但没雨」和「进度页根本没渲染这一章」必须能区分开。 */
      if (!Object.prototype.hasOwnProperty.call(byCh, ch)) byCh[ch] = [];
      var badges = qa(Q.chapterWeather, rows[i]);
      var keys = byCh[ch];
      for (var j = 0; j < badges.length; j++) {
        var k = normCond(badges[j].getAttribute('data-cond')) ||
          (UI && UI.weatherKeyFromText ? UI.weatherKeyFromText(txt(badges[j])) : '');
        if (!k) continue;
        if (keys.indexOf(k) < 0) keys.push(k);
        if (all.indexOf(k) < 0) all.push(k);
      }
    }
    return { byCh: byCh, keys: all };
  }

  /* 只取「目标关卡所在章节」的天气。进度页一次只会渲染当前地区的章节行，
   * 别的地区（例如丰缘 ch=37）压根不在 DOM 里；此时绝不能拿其它章的徽标、
   * 或当前正在战斗那关的全局天气条，冒充成目标关的天气。
   * 第八十七批：DOM 里没有这一章时改问小桥（任何章都读得到，见 WXC），
   * 顺手把这一关登记进「下一拍要问的清单」。
   *
   * 第九十三批：**小桥优先**，DOM 退回备胎 ——
   * 桥给的是游戏自己算的这一刻天气（`WEATHER.current(node)`，每 1.5 秒问一次），
   * 而进度页那几行徽标只是「上次画出来的快照」，页面不重画它就一辈子不变。
   * 老写法「DOM 有这一行就再也不问桥」，于是玩家看到的就是
   * 「洛托姆的天气只有开始那一下是新的，之后一直冻在那儿」：
   * 判定读这份冻住的快照，天气明明已经变了还当成照旧满足 → 不跳过、接着在错的地图里刷。
   * 现在：先问桥（读不到才看 DOM，DOM 也没有才 unknown —— 依旧绝不硬判成不满足）。 */
  function chapterCondView(ch, ctx, step) {
    var cm = (ctx && ctx.weather && ctx.weather.byCh) || {};
    var key = String(ch);
    /* 不管 DOM 有没有这一行，都要登记：桥要**持续**被问，才谈得上实时 */
    wxWantAdd(ch, step);
    var w = wxView(ch, step);
    var known = !!w || Object.prototype.hasOwnProperty.call(cm, key);
    var keys = w ? (w.wxs || []).slice() : ((cm[key] || []).slice());
    var src = '';
    if (w) src = w.src || 'bridge';
    else if (known) src = 'dom';
    var wk = keys.filter(isWeatherCond);
    var tk = keys.filter(isTimeCond);
    /* 第一百一十九批：时段也按确定性预报自主复算。以前 wxs 里只有天气，
     * timeKeys 恒为空 → 洛托姆 / 图鉴卡片只能等玩家切到对应关卡读 DOM 徽标，
     * 或等小桥回执，才判得出「现在白天还是夜晚」。现在任何章、任何时刻
     * 都由 PCG_WX.view(ch).night 直接给出，跟天气一样离线可算。
     * 这里内联调用（不引 dayKeys()），保证天气集成验证的 VM 切片可执行。 */
    if (!tk.length) {
      var FT = forecast();
      if (FT && typeof FT.view === 'function') {
        try {
          var ftv = FT.view(ch);
          if (ftv) tk = [ftv.night ? 'night' : 'day'];
        } catch (eT) { /* ignore */ }
      }
    }
    return {
      known: known, weatherKeys: wk, timeKeys: tk, src: src,
      weatherLabel: wk.length ? condsLabel(wk).join(' / ')
        : (known ? '无特殊天气' : '未读到该关天气'),
      weatherIcon: wk.length ? (condIcon(wk[0]) || '') : ''
    };
  }
  function currentWeather(save) {
    var cm = chapterWeatherMap();
    var all = cm.keys.slice();
    var src = all.length ? 'chapter' : '';

    // 地图详情 / 区域面板里标着「现在」的条件行
    var conds = qa('.zone-cond.now[data-cond], .wx[data-cond], .zone-weather.now');
    for (var i = 0; i < conds.length; i++) {
      var el = conds[i];
      var k = normCond(el.getAttribute && el.getAttribute('data-cond')) ||
        (UI && UI.weatherKeyFromText ? UI.weatherKeyFromText(txt(el)) : '');
      if (k && all.indexOf(k) < 0) { all.push(k); if (!src) src = 'dom'; }
    }
    // 天气时间条：.sb-h.wx-rain.now
    var bars = qa(Q.weatherBar);
    for (var b = 0; b < bars.length; b++) {
      var m = /wx-([a-z-]+)/.exec(String(bars[b].className || ''));
      if (m && all.indexOf(m[1]) < 0) { all.push(m[1]); if (!src) src = 'dom'; }
    }
    var el2 = q(Q.weather);
    if (el2) {
      var k2 = normCond(el2.getAttribute && el2.getAttribute('data-weather')) ||
        (UI && UI.weatherKeyFromText ? UI.weatherKeyFromText(txt(el2)) : '');
      if (k2 && all.indexOf(k2) < 0) { all.push(k2); if (!src) src = 'dom'; }
    }
    if (!all.length && save) {
      var sw = save.weather || (save.adv && save.adv.weather) || '';
      var k3 = normCond((sw && sw.key) || (typeof sw === 'string' ? sw : ''));
      if (k3) { all.push(k3); src = 'save'; }
    }

    var wkeys = all.filter(isWeatherCond);
    var tkeys = all.filter(isTimeCond);
    var labels = [], glyphs = [];
    for (var w = 0; w < wkeys.length && w < 3; w++) {
      labels.push(condLabel(wkeys[w]));
      var ic = condIcon(wkeys[w]);
      if (ic) glyphs.push(ic);
    }
    /* 顶部状态栏要的是「当前正在打的那一关」的天气，单独按 adv.chapter 取，
     * 不要用所有章节徽标的汇总，也不要和目标关的天气混为一谈。
     * 第一百一十五批：存档里这个字段在不同版本叫法不一，多兜底几个，
     * 免得 curCh 一直为空 → 顶部栏永远显示「未读到」，玩家以为天气功能坏了。 */
    var adv = (save && save.adv) || {};
    var curCh = '';
    var chCand = [adv.chapter, adv.ch, adv.chapterIndex, adv.curChapter,
      save && save.chapter, save && save.ch, adv.unlocked];
    for (var cci = 0; cci < chCand.length; cci++) {
      if (typeof chCand[cci] === 'number' && isFinite(chCand[cci]) && chCand[cci] >= 0) {
        curCh = String(chCand[cci]); break;
      }
    }
    var curKnown = !!curCh && Object.prototype.hasOwnProperty.call(cm.byCh, curCh);
    var curWx = (cm.byCh[curCh] || []).filter(isWeatherCond);
    /* 第一百一十四批：进度页那行徽标只是「上次画出来的快照」，页面不重画就永远不变。
     * 顶部状态栏要的是「现在正在打的这一关」，用确定性预报重算一遍，
     * 顺手把 byCh 里这一项也刷成当前值，指纹才跟着天气走。
     * 第一百一十五批：从「只刷当前章」扩展成「把所有关心的章都填上预报」——
     * 以前未启动捕捉、小桥还没回话时，目标章在 byCh 里没有值，chapterCondView
     * 判成「天气未知」，洛托姆 / 图鉴卡片就按「可抓」显示，点了开始才变真实状态。
     * 预报是确定性算法、随时可算，填进 byCh 当兜底后，弹窗一打开就是真实天气。 */
    var F = forecast();
    if (F && typeof F.view === 'function') {
      var fill = {};
      try {
        Object.keys(wxWant || {}).forEach(function (k) {
          var wc = wxWant[k] && wxWant[k].ch;
          if (typeof wc === 'number' && isFinite(wc) && wc >= 0) fill[String(wc)] = 1;
        });
      } catch (eW) { /* 登记表还没建好也不影响 */ }
      for (var ri = 0; ri < ROTOM_FORMS.length; ri++) {
        if (typeof ROTOM_FORMS[ri].ch === 'number') fill[String(ROTOM_FORMS[ri].ch)] = 1;
      }
      if (curCh !== '' && isFinite(Number(curCh)) && Number(curCh) >= 0) {
        fill[curCh] = 1;
        var fv = F.view(Number(curCh));
        cm.byCh[curCh] = fv.wxs.slice();
        curWx = fv.wxs.filter(isWeatherCond);
        curKnown = true;
      }
      Object.keys(fill).forEach(function (ck) {
        if (ck === curCh) return;                    // 当前章上面已经算过
        try { cm.byCh[ck] = F.view(Number(ck)).wxs.slice(); }
        catch (eF) { /* 单章算不出不影响其它章 */ }
      });
    }
    return {
      key: wkeys[0] || '',
      keys: wkeys,
      timeKeys: tkeys,
      byCh: cm.byCh,
      label: labels.length ? labels.join(' / ') : '未知',
      icons: glyphs.join(''),
      src: src || 'none',
      chapter: curCh,
      chapterKnown: curKnown,
      chapterNow: curWx.length ? condsLabel(curWx).join(' / ')
        : (curKnown ? '无特殊天气' : '未读到'),
      chapterNowIcon: curWx.length ? (condIcon(curWx[0]) || '') : ''
    };
  }

  function currentTime(save, weather) {
    /* 第八十七批：桥通着就直接用游戏自己的「现在算不算夜晚」（DAYTIME.matches）。
     * 时段是全地图统一的，比按本机时钟推算准，也比等玩家打开进度页快。 */
    var bd = dayKeys();
    if (bd.length) {
      var bk = bd[0];
      /* 第一百一十九批：桥没回话时这份时段来自确定性预报，来源如实标出来 */
      var bsrc = (wxFresh(120000) && WXC.day) ? 'bridge' : 'forecast';
      return {
        key: bk, keys: bd, label: condGlyph(bk), icon: condIcon(bk), src: bsrc,
        phase: (WXC.day && WXC.day.key) || '', nextHour: num(WXC.day && WXC.day.nextHour, 0)
      };
    }
    /* 游戏会在 .zone-cond.now[data-cond] / .wx[data-cond] 上直接标出「现在」
     * 的时段，以它为准；按本机时钟推算会和游戏不一致
     * （真机对照：游戏显示「白天」，巴黎时钟却算成「早晨」）。 */
    var w = weather || currentWeather(save);
    var all = ((w && w.timeKeys) || []).filter(isTimeCond).slice();
    var t = String(save && (save.daytime || save.timeOfDay ||
      (save.adv && save.adv.daytime)) || '');
    if (t && all.indexOf(t) < 0) all.push(t);
    var key = '', src = '';
    if (all.length) { key = all[0]; src = 'game'; }
    if (!key) {
      /* 游戏时段实测只有白天 / 夜晚两档（关卡详情标注 ☀️白天 / 🌙夜晚），
       * 别再按 6–10 点硬推「早晨」：真机巴黎 08:28 游戏显示的就是白天。 */
      var h = parisHour();
      if (h >= 0) {
        /* 第一百一十九批：与游戏 DAYTIME / 确定性预报对齐（20:00–08:00 为夜），
         * 旧写法 h<6 会把清晨 6–8 点误判成白天。 */
        key = (h >= 20 || h < 8) ? 'night' : 'day';
        src = 'clock';
      }
    }
    return {
      key: key, keys: all, label: key ? condGlyph(key) : '未知',
      icon: key ? condIcon(key) : '', src: src || 'none'
    };
  }

  /* ============ 第八十七批：天气 / 时段「真·实时」 ============
   * 老做法只能读进度页 `.mp-row[data-ch] .pg-wx[data-cond]` 这些徽标，而游戏
   * **只渲染玩家当前所在地区**的章节行：目标在别的地区（比如人在城都、要刷神奥的
   * 洛托姆）时永远读不到 → 一律按「未知」放行，于是就有了玩家说的
   * 「开着洛托姆捕捉，切到对应地图才发现时段不对、天气不对」。
   * 现在改成直接问游戏：keep-dup.js 那条小桥（pcg-cmd = wxinfo:…）把
   * WEATHER.current / WEATHER.changes / DAYTIME.phase 的结果带回来 ——
   * 任何章、任何时间都读得到，而且跟游戏画徽标用的是同一套函数，不会各说各话。
   *
   * 这里只做三件事：
   *   ① 跑着的时候每 1.5 秒问一次「清单里用到的那些章现在什么天气」（闲着 8 秒）；
   *   ② 把答案缓存起来，纯函数（condState / rotomCond）同步读缓存，不阻塞主循环；
   *   ③ 天气 / 时段一变，清单指纹跟着变 → autoRescan 立刻重算，窗口一开就能抢。
   * 桥没通（旧页面 / 游戏改版）时一律回 null，判定退回原来的 DOM 口径：
   * 读不到就算「未知」，绝不硬判成「不满足」。
   */
  var WXC = {
    state: 0,       // 0 未知 / 1 通 / -1 不通
    at: 0,          // 最后一次拿到正常回执的时间
    askedAt: 0,     // 最后一次发问的时间
    fails: 0,       // 连着几次没回话
    byCh: {},       // '章号' → { known, wxs:[…], changes:[{key,at}], at }
    byStep: {},     // '章号|下标' → 同上（同一章不同路段可能不同：洞窟里没有天气）
    day: null,      // { key, night, nextHour, at }
    sig: ''
  };
  var wxWant = {};  // 清单里要用到的关卡：'章|下标' → { ch, step, at }

  /* 第一百一十四批：确定性天气预测模块（weather-forecast.js）。
   * 按游戏 CONFIG.WEATHER 的算法离线复算，不依赖 DOM / 小桥，任何章、任何时刻
   * 都给得出答案；桥连不上游戏内部接口时，清单不再退回「天气未知」放行。 */
  function forecast() { return root.PCG_WX || null; }

  function wxFresh(ms) {
    return WXC.state === 1 && WXC.at > 0 && (Date.now() - WXC.at) < (ms || 90000);
  }

  /* 清单里问过的章登记一下，下一拍就一起去问 */
  function wxWantAdd(ch, step) {
    if (typeof ch !== 'number' || !isFinite(ch) || ch < 0) return;
    var k = ch + '|' + (typeof step === 'number' ? step : -1);
    if (wxWant[k]) { wxWant[k].at = Date.now(); return; }
    var keys = Object.keys(wxWant);
    if (keys.length > 160) {
      /* 太多了（「未捕捉」还有好几百只时）：把最久没被问到的先丢掉 */
      keys.sort(function (a, b) { return (wxWant[a].at || 0) - (wxWant[b].at || 0); });
      for (var i = 0; i < 40 && i < keys.length; i++) delete wxWant[keys[i]];
    }
    wxWant[k] = { ch: ch, step: (typeof step === 'number' ? step : -1), at: Date.now() };
  }

  function wxSig() {
    var out = [];
    Object.keys(WXC.byCh).sort().forEach(function (ch) {
      var e = WXC.byCh[ch];
      if (!e || !e.known) return;
      out.push(ch + ':' + (e.wxs || []).join('+'));
    });
    var d = WXC.day ? (WXC.day.night ? 'night' : (WXC.day.key || '')) : '';
    /* 第一百一十四批：预报指纹常驻（里面带当前槽号）。桥没回话时 WXC.sig 也会
     * 跟着天气换槽一起变，清单才不会卡在「上一小时的天气」里。 */
    var F = forecast(), fs = '';
    if (F && typeof F.signature === 'function') {
      var seen = {}, chs = [];
      Object.keys(wxWant).forEach(function (k) {
        var c = wxWant[k] && wxWant[k].ch;
        if (typeof c === 'number' && !seen[c]) { seen[c] = 1; chs.push(c); }
      });
      chs.sort(function (a, b) { return a - b; });
      fs = F.signature(chs, Date.now());
    }
    return out.join(',') + '|' + d + '|' + fs;
  }

  function wxApply(data) {
    if (!data) return;
    if (!data.ok) { WXC.state = -1; WXC.fails++; return; }
    WXC.state = 1;
    WXC.fails = 0;
    WXC.at = Date.now();
    (data.list || []).forEach(function (it) {
      if (!it) return;
      var ent = {
        known: !!it.known,
        wxs: Array.isArray(it.wxs) ? it.wxs.slice() : [],
        changes: Array.isArray(it.changes) ? it.changes.slice() : [],
        /* 第八十八批：这一格自己的生成条件（见 keep-dup.js 的 storyStep） */
        chance: num(it.chance, 0),
        day: !!it.day, night: !!it.night,
        skies: Array.isArray(it.skies) ? it.skies.slice() : [],
        once: String(it.once || ''),
        endsAt: num(it.endsAt, 0),
        src: String(it.src || 'bridge'),
        at: WXC.at
      };
      WXC.byCh[String(it.ch)] = ent;
      if (typeof it.step === 'number' && it.step >= 0) WXC.byStep[it.ch + '|' + it.step] = ent;
    });
    if (data.day) {
      WXC.day = {
        key: String(data.day.key || ''),
        night: !!data.day.night,
        nextHour: num(data.day.nextHour, 0),
        at: WXC.at
      };
      /* 第一百一十四批：把游戏自己的昼夜判定喂给预报模块，
       * 让「夜里剔除大晴天」这一槽的口径与游戏完全一致。 */
      var Fw = forecast();
      if (Fw && typeof Fw.setNight === 'function') Fw.setNight(!!data.day.night);
    }
    WXC.sig = wxSig();
  }

  try {
    document.addEventListener('pcg-wx-result', function (ev) {
      var data = null;
      try { data = JSON.parse(String((ev && ev.detail) || '')); } catch (e) { return; }
      wxApply(data);
    });
  } catch (e) { /* ignore */ }

  function wxAsk() {
    var keys = Object.keys(wxWant);
    if (!keys.length) return false;
    var list = [];
    for (var i = 0; i < keys.length && i < 160; i++) {
      list.push({ ch: wxWant[keys[i]].ch, step: wxWant[keys[i]].step });
    }
    var payload = '';
    try { payload = JSON.stringify({ q: list }); } catch (e) { return false; }
    WXC.askedAt = Date.now();
    /* document 上的事件会冒泡到 window，MAIN world 那边的监听挂在 window 上；
     * 有的 Chrome 版本跨 world 只递到其中一个，所以两个都派一次（回执幂等）。 */
    try {
      document.dispatchEvent(new CustomEvent('pcg-cmd', { detail: 'wxinfo:' + payload }));
      return true;
    } catch (e2) { /* ignore */ }
    try {
      window.dispatchEvent(new CustomEvent('pcg-cmd', { detail: 'wxinfo:' + payload }));
      return true;
    } catch (e3) { return false; }
  }
  setInterval(function () {
    try {
      var now = Date.now();
      /* 第一百一十四批：预报指纹常驻 + 跨整点立刻重算清单。
       * 游戏天气每小时换一次槽，换槽那一刻就是「可捕捉列表」该变的一刻 ——
       * 不等 autoRescan 的 2 秒轮询、也不吃它 2.5 秒的节流。 */
      var F = forecast();
      if (F && typeof F.slot === 'function') {
        var sl = F.slot();
        if (WXC.fcSlot === undefined) WXC.fcSlot = sl;
        var freshSig = wxSig();
        if (freshSig !== WXC.sig) WXC.sig = freshSig;
        if (sl !== WXC.fcSlot) {
          WXC.fcSlot = sl;
          try { if (gameReady()) scan(); } catch (e4) { /* 重算失败下一拍再试 */ }
        }
      }
      /* 连问三次都没回话 → 认定桥不通，一分钟后再试（旧页面 / 没刷新） */
      if (WXC.askedAt && now - WXC.askedAt > 2000 && num(WXC.at, 0) < WXC.askedAt) {
        WXC.fails++;
        if (WXC.fails >= 3 && WXC.state !== -1) WXC.state = -1;
      }
      if (WXC.state === -1 && now - num(WXC.at, 0) < 60000) return;
      var gap = D.running ? 1500 : 8000;
      if (WXC.askedAt && now - WXC.askedAt < gap) return;
      wxAsk();
    } catch (e) { /* 问天气出错不影响捕捉 */ }
  }, 800);

  /* 第八十七批：开跑前先等一次小桥的答案（最多 1.5 秒）。
   * 不等的话第一趟会把「还没读到天气」当成「可以进」，又冲进错的那一章。 */
  function wxPrime(ms) {
    return new Promise(function (resolve) {
      /* 第一百一十四批：预报模块在就立刻开跑，不必等桥那 1.5 秒 */
      if (wxFresh(8000) || forecast()) { resolve(true); return; }
      var limit = num(ms, 1500);
      var t0 = Date.now();
      var settled = false;
      var finish = function (ok) {
        if (settled) return;
        settled = true;
        clearInterval(timer);
        resolve(!!ok);
      };
      var timer = setInterval(function () {
        if (wxFresh(8000)) finish(true);
        else if (Date.now() - t0 > limit) finish(false);
      }, 100);
      try { wxAsk(); } catch (e) { /* ignore */ }
    });
  }

  /* 某一关此刻的天气。第一百一十四批改成三级优先：
   *   ① 小桥（游戏自己算的 WEATHER.current，含节点级校正，最新鲜）；
   *   ② 确定性预报（按 CONFIG.WEATHER 离线复算，任何章、任何时刻都有答案）；
   *   ③ 都没有才返回 null，让 chapterCondView 退回 DOM。
   * step 传了优先用「章+下标」那一份（同一章洞窟 / 野外路段可能不同）。
   * 以前桥一连不上就是「天气未知」→ 条件目标一律放行，清单追着刷不出来的宝可梦跑；
   * 现在预报兜住，连「晴」也给出一个明确的空天气答案，判定才谈得上真实。
   * changes 由预报补齐，洛托姆卡片因此能写明「下一场雨几点来」。 */
  function wxView(ch, step) {
    var k = (typeof step === 'number') ? (ch + '|' + step) : '';
    var e = (k && WXC.byStep[k]) || WXC.byCh[String(ch)] || null;
    var bridge = wxFresh(120000) && e && e.known;
    var F = forecast();
    if (!bridge && !F) return null;
    var fv = (!bridge && F && typeof F.view === 'function') ? F.view(ch) : null;
    var wxs, changes, atMs, endsMs, src;
    if (bridge) {
      wxs = (e.wxs || []).slice();
      changes = (e.changes || []).slice();
      atMs = e.at; endsMs = num(e.endsAt, 0); src = 'bridge';
    } else {
      wxs = fv ? fv.wxs.slice() : [];
      changes = [];
      if (F && typeof F.changes === 'function' && fv) {
        try {
          changes = F.changes(ch, 3, fv.at, 24).map(function (c) {
            return { key: String(c.key || ''), at: Number(c.at) || 0 };
          }).filter(function (c) { return c.at > 0; });
        } catch (e2) { changes = []; }
      }
      atMs = fv ? fv.at : 0; endsMs = fv ? fv.endsAt : 0; src = 'forecast';
    }
    return {
      known: true, wxs: wxs, changes: changes, at: atMs, endsAt: endsMs, src: src,
      chance: e ? num(e.chance, 0) : 0,
      day: e ? !!e.day : false, night: e ? !!e.night : false,
      skies: e ? (e.skies || []).slice() : [],
      once: e ? String(e.once || '') : ''
    };
  }

  /* 第八十八批：这一格「每次进图生成的概率」。
   * 刷洛托姆那 5 只形态在游戏数据里都是 chance:.04（4%），普通洛托姆没有 chance（必出）。
   * 桥通着就以游戏真值为准（游戏以后调概率这边自动跟上），读不到才退回表里的 0.04。 */
  function rotomChance(f) {
    if (!f) return 0;
    var v = wxView(f.ch, f.step);
    if (v && num(v.chance, 0) > 0) return num(v.chance, 0);
    return num(f.chance, 0);
  }
  /* 4% → '4%'；2.5% → '2.5%' */
  function pctText(p) {
    var v = Math.round(num(p, 0) * 1000) / 10;
    return (v % 1 === 0 ? String(v) : v.toFixed(1)) + '%';
  }
  /* 「按 N 次重抽算，理论上该出了」—— 让玩家看得出是概率还是在打转 */
  function oddsText(p, n) {
    var k = Math.max(0, num(n, 0));
    if (!(p > 0) || !k) return '';
    var hit = (1 - Math.pow(1 - p, k)) * 100;
    if (hit > 99.9) hit = 99.9;
    return '已重抽 ' + k + ' 次，按 ' + pctText(p) + ' 算理论上有 ' +
      Math.round(hit) + '% 该出了';
  }

  /* 桥给的「现在算不算夜晚」→ 时段 key（跟游戏图鉴里写的 day / night 一个口径）。
   * 第一百一十九批：桥没回话时不再等玩家切到对应关卡看「☀️白天 / 🌙夜晚」徽标，
   * 直接用确定性预报自主算（weather-forecast.js 的 view().night 与游戏
   * DAYTIME.indexAt 同口径：20:00–08:00 为夜）。时段全地图统一，跟章节无关。 */
  function dayKeys() {
    if (wxFresh(120000) && WXC.day) {
      if (WXC.day.night === true) return ['night'];
      if (WXC.day.night === false) return ['day'];
    }
    var F = forecast();
    if (F && typeof F.view === 'function') {
      try { return [F.view(0).night ? 'night' : 'day']; } catch (eD) { /* ignore */ }
    }
    return [];
  }

  function clockText(ms) {
    var d = new Date(Number(ms) || 0);
    if (!isFinite(d.getTime())) return '';
    var h = d.getHours(), m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function context() {
    var save = readSave() || {};
    var dex = (save.dex && typeof save.dex === 'object') ? save.dex : {};
    var mons = {};
    var arr = Array.isArray(save.mons) ? save.mons : [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id) mons[num(arr[i].id, 0)] = true;
    }
    var items = (save.items && typeof save.items === 'object') ? save.items : {};
    var adv = save.adv || {};
    var badges = Array.isArray(adv.badges) ? adv.badges : [];
    var gifts = (adv.gifts && typeof adv.gifts === 'object') ? adv.gifts : {};
    var w = currentWeather(save);
    return {
      save: save, dex: dex, mons: mons, items: items, badges: badges, gifts: gifts,
      unlocked: typeof adv.unlocked === 'number' ? adv.unlocked : 0,
      chapter: typeof adv.chapter === 'number' ? adv.chapter : -1,
      weather: w,
      time: currentTime(save, w)
    };
  }

  /* ---------------- 状态卡：一只未捕捉宝可梦的全部限制条件 ---------------- */
  function evoInfo(id, ctx) {
    var from = DATA ? DATA.evoFrom(id) : 0;
    if (!from) return null;
    var edge = null;
    var evos = DATA.evoTo(from) || [];
    for (var i = 0; i < evos.length; i++) if (num(evos[i].to, 0) === id) edge = evos[i];
    if (!edge) edge = evos[0] || null;
    var item = (edge && edge.item) || '';
    var itemZh = item ? ((DATA.evoItems && DATA.evoItems[item]) || item) : '';
    return {
      from: from,
      fromName: DATA.name(from),
      level: num(edge && edge.level, 0),
      item: item,
      itemZh: itemZh,
      itemOwned: item ? (num(ctx.items[item], 0) > 0) : null,
      haveBase: !!(ctx.mons[from] || ctx.dex[from]),
      haveNow: !!ctx.mons[from],
      text: (function () {
        if (item) {
          return '道具进化：' + itemZh + '（' + (num(ctx.items[item], 0) > 0 ? '已拥有' : '缺少') + '）';
        }
        if (num(edge && edge.level, 0)) return '等级进化：Lv.' + edge.level;
        return '需要进化（亲代 / 亲密度 / 队伍条件）';
      })()
    };
  }

  /* ---------------- 第九十二批：只能靠进化的那些 → 该去刷哪只幼体 ----------------
   * 「指定捕捉」撞上一个**野外真的刷不出来**的目标时（道具进化 / 传说 / 化石这类），
   * 清单会是空的、rankCards 直接滤掉，插件一点开始就写「剩下的需要进化」然后收工 ——
   * 玩家看到的就是「点了没反应」。现在这种目标自动改成去刷它能野外抓到的幼体
   * （尼多王 → 尼多力诺 · 月之石），抓到以后再提示「用月之石就进化」。
   * 自己本来就有出没点的返回 null。
   *
   * 第九十四批修正：吞食兽 #317 **不是**这一类 —— 它在丰缘 110 号道路本来就有 3% 的
   * 野生点（游戏 zonePool 会把等级够了的进化形态一起放进池子），是离线表漏了。
   * 数据补齐以后 `spawnsOf(317)` 有值，这里自然返回 null，插件直接去 110 号道路刷。
   *
   * 三段进化（尼多朗 → 尼多力诺 → 尼多王）要把**整条链**写出来：
   * 只报目标那一段的条件会导致「拿到了幼体也不知道下一步」。 */
  function evoHopText(seg) {
    var how = seg.item ? (seg.itemZh || seg.item) : (seg.level ? ('Lv.' + seg.level) : '');
    return (how ? how + ' ' : '') + '进化成 ' + seg.name;
  }
  function evoPathText(segs) {
    var out = [];
    for (var i = 0; i < (segs || []).length; i++) out.push(evoHopText(segs[i]));
    return out.join('，再 ');
  }
  function evoHuntOf(id) {
    if (!DATA || typeof DATA.evoFrom !== 'function') return null;
    if (spawnsOf(id).length) return null;                 // 自己有野外点，不用换
    var need = Number(id), hop = 0;
    var segs = [];                                        // 从幼体那一段排到目标
    var cur = DATA.evoFrom(need);
    while (cur && hop++ < 6) {
      var edges = DATA.evoTo(cur) || [];
      var edge = null;
      for (var i = 0; i < edges.length; i++) {
        if (Number(edges[i].to) === Number(need)) { edge = edges[i]; break; }
      }
      if (!edge && edges.length === 1) edge = edges[0];
      if (edge) {
        var it = edge.item || '';
        segs.unshift({
          id: need,                                       // 这一段「变成的编号」
          name: DATA.name(need),                          // 这一段「变成谁」
          level: Number(edge.level) || 0,
          item: it,
          itemZh: it ? ((DATA.evoItems && DATA.evoItems[it]) || it) : ''
        });
      }
      if (spawnsOf(cur).length) {
        var first = segs[0] || {};
        return {
          id: cur, name: DATA.name(cur),
          /* level / item 取**幼体那一段**的边（抓到以后第一步要做什么） */
          level: first.level || 0, item: first.item || '', itemZh: first.itemZh || '',
          hops: segs.length, chain: segs,
          pathText: evoPathText(segs)
        };
      }
      need = cur;
      cur = DATA.evoFrom(cur);
    }
    return null;
  }

  /* 第三十九批：条件池里权重被写成 0 = 这种天气 / 时段**根本刷不出来**。
   * 例：流星瀑布 base 里有月石（8）和太阳岩（8），但同时
   *      night:{太阳岩:0} / day:{月石:0}——白天怎么刷都不会出月石。
   * 老数据只有 nightOff（只认夜晚清零），所以月石一直被算成「可直接捕捉」。
   * 现在数据里每条出没点带 off:[条件…]，这里是通用的判定与文案。 */
  function offNeed(keys) {
    var out = [];
    (keys || []).forEach(function (k) {
      var zh;
      /* 游戏时段实测只有白天 / 夜晚两档：白天刷不到 = 等夜晚，反之亦然 */
      if (k === 'day') zh = condGlyph('night');
      else if (k === 'night') zh = condGlyph('day');
      else if (isTimeCond(k)) zh = '非 ' + condGlyph(k);
      else zh = '避开 ' + condGlyph(k);
      if (out.indexOf(zh) < 0) out.push(zh);
    });
    return out;
  }
  function offText(keys) {
    var names = (keys || []).map(condGlyph).filter(Boolean);
    return names.length ? (names.join(' / ') + ' 时刷不出来') : '';
  }

  /* 一个出现点当前是否刷得出来。
   * unknown = 目标关的天气没读到，不硬判为不满足（避免把条件目标全锁死），
   * 但 UI 会写清「需求天气 / 该关当前天气」。 */
  function condState(sp, ctx) {
    var conds = sp.conds || [];
    /* 只认「目标章节自己那一行」：这一行存在但没有天气徽标 = 该关当前没下雨；
     * 这一行压根没渲染（进度页只显示当前地区）= 天气未知，绝不能拿其它章的
     * 徽标或当前正在战斗那关的全局天气条来判定。
     * 第八十七批：这一行没渲染时 chapterCondView 会去问小桥，问到了就有答案了。 */
    var view = chapterCondView(sp.ch, ctx, sp.step);
    var wk = view.weatherKeys;
    var tk = (ctx.time && ctx.time.keys) || [];
    if (!tk.length && ctx.time && ctx.time.key) tk = [ctx.time.key];
    /* 第二十一批：把「限制」和「加成」分开。
     * 游戏 HABITATS 每个区域有一份基础池 base + 若干条件池（night / rain / fog …）：
     *   物种 ∈ base      → 任何时候都能遇到，条件池里再出现只是概率加成，不是限制；
     *   物种 ∉ base      → 只在这些条件池里出现，才是真限制（数据里 only = 1）。
     * 以前把 only = 0 的加成也当条件用，风铃铃就被写成了「该关条件：起雾」。 */
    var hard = !!sp.only;
    var any = false, unknown = false;
    if (hard) {
      for (var i = 0; i < conds.length; i++) {
        var c = conds[i];
        var ok = null;
        if (isWeatherCond(c)) {
          ok = view.known ? (wk.indexOf(c) >= 0) : null;
        } else if (isTimeCond(c)) ok = tk.length ? (tk.indexOf(c) >= 0) : null;
        if (ok === true) any = true;
        if (ok === null) unknown = true;
      }
    }
    /* 第一百一十四批：等天气时顺手用确定性预报算出「下一次轮到」的时间。
     * 以前卡片只能写「有天气限制」，玩家不知道要干等多久；现在能写明几点开窗口，
     * 而清单在跨整点那一刻也会自己重算，窗口一开就抢。 */
    var nextAt = 0;
    if (hard) {
      var vw = null;
      try { vw = wxView(sp.ch, sp.step); } catch (e3) { vw = null; }
      if (vw && vw.changes) {
        for (var ni = 0; ni < vw.changes.length; ni++) {
          var nc = vw.changes[ni];
          if (nc && nc.at > Date.now() && isWeatherCond(nc.key) &&
            conds.indexOf(nc.key) >= 0) { nextAt = nc.at; break; }
        }
      }
    }
    /* 第三十九批：off = 「这种天气 / 时段里权重被清零」，当前命中的就是刷不出来的。
     * nightOff 是老数据的写法（= off 里含 night），继续认，兼容旧断点与旧断言。 */
    var offKeys = (sp.off && sp.off.length) ? sp.off.slice()
      : (sp.nightOff ? ['night'] : []);
    var offHit = [], offUnknown = false;
    for (var oi = 0; oi < offKeys.length; oi++) {
      var ok2 = null;
      if (isTimeCond(offKeys[oi])) ok2 = tk.length ? (tk.indexOf(offKeys[oi]) >= 0) : null;
      else if (isWeatherCond(offKeys[oi])) ok2 = view.known ? (wk.indexOf(offKeys[oi]) >= 0) : null;
      else ok2 = false;
      if (ok2 === true) offHit.push(offKeys[oi]);
      else if (ok2 === null) offUnknown = true;
    }
    if (offHit.length) {
      return {
        ready: false, wait: true, unknown: offUnknown, cond: true, matched: any,
        /* 需求写「夜晚 / 白天 / 避开下雪」，卡片与看板直接显示这句 */
        need: offNeed(offHit), bonus: [],
        off: offHit, offAll: offKeys,
        kind: offHit.some(isTimeCond) ? 'time' : 'weather',
        nextAt: nextAt
      };
    }
    if (hard && conds.length && !any) {
      return {
        ready: false, wait: true, unknown: unknown, cond: true, matched: false,
        need: condsLabel(conds), bonus: [],
        off: [], offAll: offKeys,
        kind: conds.some(isTimeCond) && !conds.some(isWeatherCond) ? 'time' : 'weather',
        nextAt: nextAt
      };
    }
    return {
      ready: true, wait: false, unknown: (unknown && hard) || offUnknown,
      /* cond 只表示「有硬限制」；加成不算，不然会被排序和标签当成条件目标 */
      cond: hard && !!conds.length,
      matched: any,
      need: condsLabel(conds),
      /* 加成：只提高出现率，不影响能不能遇到 */
      bonus: hard ? [] : condsLabel(conds),
      off: [], offAll: offKeys,
      kind: hard
        ? (conds.some(isWeatherCond) ? 'weather' : (conds.some(isTimeCond) ? 'time' : ''))
        : '',
      nextAt: nextAt
    };
  }
  /* 加成条件的说明文案，统一口径：「起雾 时出现率更高（加成，不是限制）」 */
  function bonusText(list) {
    var names = (list || []).filter(Boolean);
    if (!names.length) return '';
    return names.join(' / ') + '时出现率更高（加成，不是限制）';
  }

  /* ---------------- 第九十二批：出没点的「这一关真的会刷」校验 ----------------
   * 游戏 STORY.CHAPTERS[ch].steps[i] 里的 wild 是**野生刷新点个数**：
   * 银河百代大楼 / 银河仓库 / 银河队基地 / 四天王房间 这些都是 `wild:0`，
   * 只有训练家、道具和剧情，野外根本不会出宝可梦（游戏扫图时会直接提示
   * 「这里没有野生宝可梦，只有训练家」）。这些步上还有一个 `species` 数组，
   * 那是**训练家队伍池**（银河队小兵的宝可梦），不是出没点。
   * 离线表 gen 的时候把这一串当成了出没点算进 spawns，于是：
   *   · 魅力喵「最高概率」被算成「神奥第二章 银河百代大楼 20%」，
   *     插件每次点开始就奔着那一关去，走完一整章也刷不出一只（干打训练家）；
   *   · 杰尼龟 / 大嘴蝠 / 利牙鱼 / 毒骷蛙 / 臭鼬噗 … 一共 15 只都被这么带偏。
   * 现在两道保险：离线表已经把 wild===0 的行整条删掉（104 行），
   * 这里再按章节表过一次，将来重新生成数据也不会再把它们放进来。 */
  function stepHasWild(ch, step) {
    if (!DATA) return true;
    if (typeof DATA.hasWild === 'function') return !!DATA.hasWild(ch, step);
    var c = DATA.chapter ? DATA.chapter(ch) : (DATA.chapters || [])[ch];
    var st = c && c.st && c.st[step];
    if (!st) return true;
    return (st.w || 0) > 0;
  }
  function spawnsOf(id) {
    var list = (DATA && typeof DATA.spawnsOf === 'function') ? (DATA.spawnsOf(id) || []) : [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var sp = list[i];
      if (!sp) continue;
      if (!stepHasWild(sp.ch, sp.step)) continue;
      out.push(sp);
    }
    return out;
  }

  function chapterOpen(ch, ctx) {
    return ch <= ctx.unlocked;
  }
  function chapterLabel(ch) {
    if (DATA && typeof DATA.chapterName === 'function') return DATA.chapterName(ch);
    return '第 ' + (ch + 1) + ' 章';
  }
  function spotLabel(sp) {
    return chapterLabel(sp.ch) + ' · ' + (sp.label || DATA.stepName(sp.ch, sp.step) || ('节点 ' + sp.step));
  }
  /* 第四十六批：同一章里**其它**也能遇到这只的出没地段。
   * 一只宝可梦常常在同一章的好几处地段都能刷出来（风铃铃在毁坏的世界：
   * 天冠山 4.26% / 积雪的天冠山 2.74% / 送行之泉 2.09%）。这一章的时间线是一次
   * 生成、线性走完的，走过去根本不花额外代价；只盯最高效的那一处、刷完它的草丛
   * 就切图重抽，等于把本章其余出没点全扔掉，效率直接砍半。
   * 所以把本章所有出没地段都交给 MAP 当成「目标窗口」，整章走完最后一处才重抽。 */
  function sameChapterSpots(id, ch, exceptStep) {
    var out = [], seen = {};
    var spawns = spawnsOf(id);
    for (var i = 0; i < spawns.length; i++) {
      var sp = spawns[i];
      if (!sp || sp.ch !== ch) continue;
      if (typeof exceptStep === 'number' && sp.step === exceptStep) continue;
      if (seen[sp.step]) continue;
      seen[sp.step] = 1;
      out.push({
        step: sp.step,
        area: (DATA && typeof DATA.stepName === 'function') ? (DATA.stepName(ch, sp.step) || '') : '',
        ids: (DATA && typeof DATA.stepAreas === 'function') ? DATA.stepAreas(ch, sp.step) : []
      });
    }
    return out;
  }

  /* ---------------- 第二十九批：地点写法「城都.第四章 满金市」 ----------------
   * 章节表里的 n 是徽章名（雾徽章 / 冲击徽章），对玩家没意义；真正好读的是
   * 「地区 + 本地区第几章 + 这一步的地名」。地区起始章由 chRg 反查，
   * 所以关都 / 城都 / 丰缘 / 神奥各自从「第一章」重新数。 */
  var ZH_DIGIT = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  function zhNum(n) {
    n = Math.round(num(n, 0));
    if (n <= 0) return String(n);
    if (n <= 10) return ZH_DIGIT[n];
    if (n < 20) return '十' + ZH_DIGIT[n - 10];
    if (n < 100) {
      var t = Math.floor(n / 10), u = n % 10;
      return ZH_DIGIT[t] + '十' + (u ? ZH_DIGIT[u] : '');
    }
    return String(n);
  }
  function regionStartCh(rg) {
    var arr = (DATA && DATA.chRg) || [];
    for (var i = 0; i < arr.length; i++) if (arr[i] === rg) return i;
    return 0;
  }
  /* 「城都.第四章 满金市」；数据缺失时退回旧写法，绝不显示空白 */
  function spotPath(ch, step) {
    if (ch == null || ch < 0) return '';
    var rg = regionOfCh(ch) || '';
    var region = (DATA && typeof DATA.regionLabel === 'function')
      ? (DATA.regionLabel(rg) || '') : '';
    var idx = ch - regionStartCh(rg) + 1;
    var city = (DATA && typeof DATA.stepName === 'function') ? (DATA.stepName(ch, step) || '') : '';
    var head = region ? (region + '.第' + zhNum(idx) + '章') : chapterLabel(ch);
    return city ? head + ' ' + city : head;
  }

  /* 是否「见过 / 点亮过」这只的闪光：存档 seenShiny / dex[id].shiny /
   * 仓库·培育屋·地下通道里的 shiny 实例，任一命中即可。
   * 第一百零七批起只用于提示，不再当「指定捕捉」的排除或完成条件 ——
   * seenShiny 只是闪光图鉴解锁，不代表手上还有这只闪光。 */
  function shinyOwned(id, ctx) {
    id = Number(id) || 0;
    if (!id) return false;
    var save = (ctx && ctx.save) || readSave() || {};
    var ss = save.seenShiny;
    if (ss && typeof ss === 'object' && ss[id]) return true;
    var d = save.dex && save.dex[id];
    if (d && (d.shiny === 1 || d.shiny === true)) return true;
    var box = [];
    if (Array.isArray(save.mons)) box = box.concat(save.mons);
    if (save.pension && Array.isArray(save.pension.mons)) {
      box = box.concat(save.pension.mons.map(function (x) { return x && x.mon; }));
    }
    if (save.under && Array.isArray(save.under.slots)) {
      save.under.slots.forEach(function (s) {
        if (s && Array.isArray(s.mons)) box = box.concat(s.mons);
      });
    }
    for (var i = 0; i < box.length; i++) {
      var m = box[i];
      if (m && Number(m.id) === id && (m.shiny === true || m.shiny === 1)) return true;
    }
    return false;
  }

  /* 指定宝可梦模式是否「无限刷到出闪」：只对能在野外反复遇到的普通种生效。
   * 第一百零七批：开局「闪光图鉴已解锁」不再让它退回「抓一只就收工」——
   * 那只是见过 / 点亮过，不代表手上还有这只闪光，更不该让功能一启动就停。 */
  function shinyFarmMode(id) {
    if (D.cfg.mode !== 'target' || D.cfg.untilShiny === false) return false;
    if (id && DATA && typeof DATA.isSpecial === 'function' && DATA.isSpecial(id)) return false;
    return true;
  }

  /* 第一百零七批：两份闪光实例快照之间新出现了哪些 uid。
   * id 传 0 / 空则不限图鉴号，否则只认这一只的新闪光。纯函数，便于冒烟直接验。 */
  function shinyNewKeys(base, now, id) {
    var want = Number(id) || 0, out = [];
    for (var k in now) {
      if (!Object.prototype.hasOwnProperty.call(now, k) || base[k]) continue;
      if (!want || Number(now[k]) === want) out.push(k);
    }
    return out;
  }
  /* 「刷到出闪」的完成条件：只看本轮新抓到的闪光实例。
   * 基线是点「开始」那一刻的 D.shinyBaseKeys，历史 seenShiny / dex[id].shiny
   * 一律不参与，所以已解锁闪光图鉴的宝可梦也能正常指定捕捉，刷到新的闪光才停。 */
  function shinyCaughtThisRun(id, ctx, base) {
    var save = (ctx && ctx.save) || readSave() || {};
    return shinyNewKeys(base || D.shinyBaseKeys || {}, shinyInstances(save), id).length > 0;
  }

  /* ---------------- 地区门禁（第二十三批） ----------------
   * 切章刷新只在本地区里转：
   *   1) 同一只宝可梦可能在好几个地区都有出没点，优先挑玩家现在所在地区的那个；
   *   2) 正被游走神兽占着的章节一律排掉（进去就要打神兽，等于白跑）；
   *   3) 本地区一个候选都没有时才退回全部，保证「有目标就能去」。 */
  function regionOfCh(ch) {
    if (MAP && typeof MAP.regionOf === 'function') {
      var r = MAP.regionOf(ch);
      if (r) return r;
    }
    return (DATA && typeof DATA.chapterRegion === 'function') ? (DATA.chapterRegion(ch) || '') : '';
  }
  function regionNow(save) {
    if (MAP && typeof MAP.regionNow === 'function') {
      var r = MAP.regionNow(save);
      if (r) return r;
    }
    var ch = (save && save.adv && typeof save.adv.chapter === 'number') ? save.adv.chapter : -1;
    return ch < 0 ? '' : regionOfCh(ch);
  }
  function roamNow(save) {
    if (MAP && typeof MAP.roamChapters === 'function') {
      try { return MAP.roamChapters(save) || {}; } catch (e) { return {}; }
    }
    return {};
  }
  function narrowBy(list, save, chOf) {
    var rows = (list || []).slice(0);
    if (!rows.length) return rows;
    var rg = regionNow(save);
    if (rg) {
      var same = rows.filter(function (x) { return regionOfCh(chOf(x)) === rg; });
      if (same.length) rows = same;
    }
    var busy = roamNow(save);
    var free = rows.filter(function (x) { return !busy[chOf(x)]; });
    return free.length ? free : rows;
  }

  /* ============ 第六十九批：洛托姆 5 形态（原来在「定点循环」里，整套搬过来） ============
   * 定点循环那边只保留「定点循环」，不再选形态。搬过来的东西一样不少：
   *   · 每个形态固定一章 + 一个「特别的相遇」静态点（ch / step 是离线步骤下标）；
   *   · 天气 / 时段要求（只标注、不拦截：不符也照进，按游戏内实际刷出来的算）；
   *   · 进图后扫时间线：这一趟**所有**「特别的相遇」格都走到、每一场打完才切图重抽；
   *     一个都没刷出来（或这一趟压根没排到这个地段）就立刻切走重进（第七十八批）；
   *   · 到手判定 = 存档 dex 里出现该形态的图鉴号（47901~47905），抓到自动去下一个。
   * 5 个形态共用一张卡的结构，所以能直接走进图鉴捕捉原来的
   * 选目标 / 切图重进 / 回读存档 / 看板 那一整套流程。 */
  /* 第八十三批：普通洛托姆（#479 本体）= 5 种形态的**前置**。
   * 游戏里没拿到它之前，5 种形态根本不会在地图上刷出来，所以：
   *   · 弹窗清单里它排第一，另外 5 只全部锁成灰、不可勾选，写「需获取普通洛托姆」；
   *   · 引擎侧没拿到它时**只刷它**（rotomEffPick），拿到那一刻自动把 5 只形态勾上。
   * 它的点在**神奥第 50 章「森之洋馆的电视」第 10 步**（ch 49 / step 9），
   * 仅限一次的相遇，只在**夜晚**出现（游戏图鉴写「现在不行 · 夜晚」）。
   * 下标固定 5：0~4 是 5 种形态，老存档里的 rotomPick 不会错位。 */
  /* 第八十八批：chance = 游戏章节数据里这一格的生成概率（**每次重建这一章的时间线**掷一次）。
   * 翻线上 bundle 的 STORY.CHAPTERS 能直接看到：
   *   {kind:"static", name:"Jardin Trophée", id:47905, rate:13, once:"rotom-mow",
   *    caught:[479], need:"Capture d'abord Motisma", day:!0, chance:.04, …}
   * 5 只形态全是 chance:.04 —— 也就是**每切出切回一次只有 4% 概率真的刷出这一格**，
   * 期望约 25 次才出一次；100 次不出是 1/60 的运气，不是插件坏了。
   * 普通洛托姆没写 chance（必出，只要夜晚），所以它那一项是 0。
   * 桥通着的时候以游戏真值为准（见 rotomChance），这个值只是读不到时的兜底。 */
  var ROTOM_BASE_I = 5;
  /* 第一百二十批：once = 游戏 STORY 里这一格 static 节点的一次性标记。
   * 游戏判定是 !(ga.once && adv.gifts[ga.once]) 才生成；捕捉成功（或用对应的
   * 形态变换道具）后 adv.gifts[once] 被写入，这一格就再也不会出现。
   * 插件据此判断「该存档还能不能触发这个特殊的相遇」，能才允许勾选。 */
  var ROTOM_FORMS = [
    { i: 0, key: 'oven', zh: '加热洛托姆', ch: 65, step: 4, dex: 47901, once: 'rotom-heat', weather: ['ash', 'sun'], needZh: '灰烬 / 晴', place: '227号道路', chance: 0.04 },
    { i: 1, key: 'washer', zh: '清洗洛托姆', ch: 52, step: 6, dex: 47902, once: 'rotom-wash', weather: ['rain', 'storm'], needZh: '下雨 / 雷暴', place: '213号道路', chance: 0.04 },
    { i: 2, key: 'fridge', zh: '冰冻洛托姆', ch: 55, step: 3, dex: 47903, once: 'rotom-frost', weather: ['blizzard'], needZh: '暴风雪', night: true, place: '217号道路', chance: 0.04 },
    { i: 3, key: 'fan', zh: '旋转洛托姆', ch: 49, step: 5, dex: 47904, once: 'rotom-fan', weather: ['storm'], needZh: '雷暴', place: '山谷发电厂', chance: 0.04 },
    { i: 4, key: 'mower', zh: '切割洛托姆', ch: 52, step: 11, dex: 47905, once: 'rotom-mow', weather: [], needZh: '白天', day: true, place: '自豪的后院', chance: 0.04 },
    /* 普通洛托姆：无天气要求，只要夜晚；图鉴号用它自己的 479（不是 479xx）。
     * 它没有 chance —— 进图必出（夜晚），所以这里写 0。 */
    { i: 5, key: 'base', zh: '洛托姆', ch: 49, step: 9, dex: 479, once: 'rotom-tv', weather: [], needZh: '夜晚', night: true, base: true, place: '森之洋馆的电视', chance: 0 }
  ];
  /* 第八十一批：刷洛托姆「切出」时不就近乱挑一章，**默认切出到灯塔徽章**（神奥第 58 章）。
   * 挑它的理由：跟 5 个形态全在同一个地区（神奥）、章节号比所有目标章（49 / 52 / 55 / 65）
   * 都靠后 —— 目标章能进，它就一定能进，不会出现「绕行章反而没解锁」。
   * 万一它真的不可用（被游走神兽占着 / 地图行 locked），MAP.reenter 会自动退回
   * 「本地区最近的中立章」，绝不会因为指定章不可用就不切了。 */
  var ROTOM_HOP_CH = 58;
  function rotomHopName() { return chapterLabel(ROTOM_HOP_CH); }
  /* 切图重进的参数：洛托姆固定 hopCh，其它功能照旧让引擎自己挑中立章 */
  function rerollOpts(card) {
    return {
      owner: 'dex',
      save: readSave(),
      hopCh: (card && card.rotom) ? ROTOM_HOP_CH : -1
    };
  }
  function rotomFormOfId(id) {
    var n = num(id, -1);
    for (var i = 0; i < ROTOM_FORMS.length; i++) {
      /* 第八十三批：普通洛托姆（#479）不进 cardOf 的形态分流 ——
       * 它在 493 图鉴里，走「未捕捉清单」时保持原来的卡片，别把普通模式也带进
       * 刷洛托姆那套切图逻辑。 */
      if (ROTOM_FORMS[i].base) continue;
      if (ROTOM_FORMS[i].dex === n) return ROTOM_FORMS[i];
    }
    return null;
  }
  /* 第一百二十批：恢复「已获得」限制，判据改成存档里的 adv.gifts[once]。
   * 玩家要求：检测该存档里这个「特殊的相遇」捕捉成功后还能不能触发；
   * 不能触发就显示「图鉴已收录」、选项变灰不可选，不再无限切图空转。
   * 图鉴已收录同样视为完成（收录过就不再是可捕捉目标）。 */
  function rotomOnceDone(f, ctx) {
    var g = (ctx && ctx.gifts) || {};
    return !!(f.once && (g[f.once] || g[String(f.once)]));
  }
  /* 真实图鉴状态：用于「前置判定」和弹窗上「已收录」的展示 */
  function rotomDexOwned(f, ctx) {
    var d = (ctx && ctx.dex) || {};
    return !!(d[f.dex] || d[String(f.dex)]);
  }
  /* 逻辑上的「不能再触发 / 已获得」：锁定 / done / 队列剔除 / 置灰都读它 */
  function rotomOwned(f, ctx) {
    return rotomOnceDone(f, ctx) || rotomDexOwned(f, ctx);
  }
  /* 第八十三批：普通洛托姆 = 5 种形态的前置（拿到了才刷得出形态）。
   * 第一百零九批：前置判定读真实 dex，不受「解除已获得限制」影响。 */
  function rotomBaseForm() { return ROTOM_FORMS[ROTOM_BASE_I]; }
  function rotomBaseOwned(ctx) { return rotomDexOwned(rotomBaseForm(), ctx); }
  /* 拿到普通洛托姆之前：勾选强制只留它一项（其余 5 只在弹窗里锁成灰）；
   * 拿到的那一刻把 5 种形态自动全勾上 —— 只做一次，不盖掉玩家后来的手动勾选。 */
  function rotomBaseSync(ctx) {
    var pick = Array.isArray(D.cfg.rotomPick) ? D.cfg.rotomPick : [];
    if (!rotomBaseOwned(ctx)) {
      var onlyBase = pick.length === 1 && pick[0] === ROTOM_BASE_I;
      if (!onlyBase) {
        config({ rotomPick: [ROTOM_BASE_I], rotomBaseOk: false });
        note('info', '还没有普通洛托姆：先刷「' + rotomBaseSpot() +
          '」（仅限一次的相遇 · ' + (rotomBaseForm().needZh || '夜晚') +
          '），拿到它之后 5 种形态才会开启');
      }
      return false;
    }
    if (!D.cfg.rotomBaseOk) {
      /* 勾选里本来就还留着形态（老存档 / 玩家刚勾过）就照旧，只补一个「已开门」标记；
       * 一只形态都没有（之前被强制成只刷普通洛托姆）才把 5 只全勾上。 */
      var hadForms = pick.some(function (i) {
        var f = ROTOM_FORMS[i];
        return !!f && !f.base;
      });
      var forms = hadForms ? pick.filter(function (i) {
        var f = ROTOM_FORMS[i];
        return !!f && !f.base;
      }) : [0, 1, 2, 3, 4];
      config({ rotomPick: forms, rotomBaseOk: true });
      if (!hadForms) {
        note('ok', '已获得普通洛托姆：5 种形态现已开启（已全部勾上），接着刷形态');
      }
    }
    return true;
  }
  /* 实际要刷的下标：没拿到普通洛托姆 → 只刷它；拿到了 → 按勾选来，
   * 勾选里一只形态都没有（空 = 老的「5 只全刷」口径 / 只剩普通洛托姆）就退回 5 只全刷。 */
  function rotomEffPick(ctx) {
    /* 第八十七批：条件不满足被跳过的（rotomSkip）不参与，但**勾选不动** ——
     * 条件一回来 rotomRearm() 把跳过标记去掉，它自己就重新排进清单。 */
    var skip = rotomSkipMap();
    if (!rotomBaseOwned(ctx)) return skip[ROTOM_BASE_I] ? [] : [ROTOM_BASE_I];
    var pick = Array.isArray(D.cfg.rotomPick) ? D.cfg.rotomPick : [];
    /* 第一百零九批：解除已获得限制后，普通洛托姆自己也允许被勾上重复刷 ——
     * 以前这里把 base 一律过滤掉，拿到它就再也排不进队列。
     * 一个都没勾时仍按老口径默认 5 种形态。 */
    var eff = pick.filter(function (i) { return !!ROTOM_FORMS[i]; });
    if (!eff.length) eff = [0, 1, 2, 3, 4];
    /* 第一百二十批：
     *   未勾选等待条件 —— 条件不满足（skip）或已收录的直接跳过；
     *   勾选等待条件   —— 不剔除，把条件不满足的踢到队列末尾，
     *                     条件一回来它仍在清单里，不用玩家重新勾。 */
    var waiting = !!D.cfg.waitCond;
    var live = eff.filter(function (i) {
      return !rotomOwned(ROTOM_FORMS[i], ctx) && (waiting || !skip[i]);
    });
    if (!waiting) return live;
    var ready = [], later = [];
    live.forEach(function (i) {
      var cd = null;
      try { cd = rotomCond(ROTOM_FORMS[i], ctx); } catch (e) { cd = null; }
      (cd && cd.ok === false && !cd.unknown ? later : ready).push(i);
    });
    return ready.concat(later);
  }
  function rotomBaseSpot() {
    var f = rotomBaseForm();
    return '第 ' + (f.ch + 1) + ' 章「' + f.place + '」';
  }
  /* 条件：weather 是「这一章要有哪种天气」；night / day 是时段。
   * 第七十二批：天气只认**目标章自己那一行**的徽标 —— 跟普通卡片 condState() 一个口径。
   * 以前拿「进度页所有章节徽标的汇总」当「现在天气」，5 只形态会一起写成
   * 「现在 下雨 / 下雪 / 暴风雪 / 雷暴」，跟各自关卡的实际天气对不上。
   * 该章没在进度页渲染（页面只渲染当前地区）时标 unknown，不硬判「不满足」。
   * 读不到天气 / 时段时给 unknown = true（按「可以进」处理，只是把那句提示写出来）。 */
  function rotomCond(f, ctx) {
    /* 第八十七批：ctx 可以不传 —— 主循环每秒顺手查一次条件时只想要「现在到底行不行」，
     * 那时候用小桥 + 缓存的时段就够了，不用把整个 context() 算一遍。
     * 传了 ctx 时 DOM 优先（玩家就在那个地区，跟游戏显示的一模一样）。 */
    var view = chapterCondView(f.ch, ctx, f.step);
    var wk = view.weatherKeys.slice();
    var tk = view.timeKeys.slice();
    /* 时段：先看这一行自己标的；没有就用「现在」那一份（时段是全地图统一的） */
    if (!tk.length && ctx && ctx.time) {
      tk = (ctx.time.keys && ctx.time.keys.length) ? ctx.time.keys.slice()
        : (ctx.time.key ? [ctx.time.key] : []);
    }
    if (!tk.length) tk = dayKeys();
    var need = [], miss = [];
    (f.weather || []).forEach(function (k) { need.push(k); });
    if (f.night) need.push('night');
    if (f.day) need.push('day');
    var wxKnown = !!view.known, tKnown = tk.length > 0;
    if (f.weather && f.weather.length && wxKnown) {
      if (!f.weather.some(function (k) { return wk.indexOf(k) >= 0; })) miss = f.weather.slice();
    }
    if (f.night && tKnown && tk.indexOf('night') < 0) miss.push('night');
    if (f.day && tKnown && tk.indexOf('day') < 0) miss.push('day');
    var unknown = (!!(f.weather && f.weather.length) && !wxKnown) ||
      (!!(f.night || f.day) && !tKnown);
    /* 第七十七批：缺的到底是「天气」还是「时段」要分得出来 ——
     * 弹窗卡片的状态徽标得写「等待天气」还是「等待时段」，不能一律「等条件」。 */
    var missWx = miss.filter(function (k) { return k !== 'night' && k !== 'day'; });
    /* 第八十七批：缺天气的，顺手算下一次「天气轮到它」是什么时候（小桥给的预报）——
     * 跳过它 / 关掉功能时能直接写明「22:00 前后就轮到它了」。 */
    var nextAt = 0;
    if (missWx.length && f.weather && f.weather.length) {
      var v = wxView(f.ch, f.step);
      if (v) {
        for (var ci = 0; ci < v.changes.length; ci++) {
          var c = v.changes[ci];
          if (c && c.at > Date.now() && f.weather.indexOf(c.key) >= 0) { nextAt = c.at; break; }
        }
      }
    }
    /* 第八十八批：只在白天出现的形态（切割洛托姆），夜里要直接告诉玩家「几点天亮」——
     * 否则插件一直重抽、玩家以为卡死，其实天赋概率是 0。
     * 游戏 DAYTIME.until() 给的是**下一个时段的起始整点**（夜里 → 08 点），不是时间戳。 */
    var dayBreak = '';
    if (f.day && tKnown && tk.indexOf('day') < 0 && WXC.day && WXC.day.night === true) {
      var bh = num(WXC.day.nextHour, 0);
      if (bh >= 0 && bh <= 23) dayBreak = (bh < 10 ? '0' : '') + bh + ':00';
    }
    return {
      /* 第一百一十五批：天气 / 时段读不到时（unknown）绝不能算「条件满足」。
       * 以前 ok = !miss.length，unknown 时 miss 恰好为空 → ok=true → 弹窗把
       * 不满足天气的形态显示成「可以去刷」，点了开始、读到真实天气才变等待。
       * 现在必须「没有缺项」且「不是未知」才算可抓。 */
      ok: !miss.length && !unknown,
      unknown: unknown && !miss.length ? true : false,
      need: condsLabel(need),
      miss: condsLabel(miss),
      missKeys: miss.slice(),
      timeOnly: miss.length > 0 && missWx.length === 0,
      weatherNeed: condsLabel(f.weather || []),
      timeNeed: f.night ? condsLabel(['night']) : (f.day ? condsLabel(['day']) : []),
      /* 现在天气 = 目标章这一行读到的天气（章在但没徽标 = 无特殊天气；章没渲染 = 未读到） */
      now: wxKnown ? (wk.length ? condsLabel(wk).join(' / ') : '无特殊天气')
        : '未读到该关天气',
      nowTime: tKnown ? condsLabel(tk).join(' / ') : '未读到',
      known: wxKnown, timeKnown: tKnown,
      src: view.src || '',
      chapterNow: view.weatherLabel,
      nextAt: nextAt,
      dayBreak: dayBreak
    };
  }
  /* 洛托姆形态的状态键：跟未捕捉清单同一套（ready / weather / time），
   * 已获得的单独给 done（卡片上写「已获得」，左侧金边）。 */
  /* 第一百一十七批：状态徽标文案统一按「当前条件」生成。
   * 普通洛托姆以前写死「先去刷它」，完全不看天气 / 时段 —— 明明现在是白天
   * （它只在夜晚出现）、条件不满足，卡片还叫玩家去刷，容易误导。现在跟其余
   * 5 只形态同口径：已获得 / 未解锁 / 可以去刷 / 等待时段 / 等待天气。
   * 它是纯时段形态（weather:[] + night:true），所以 normal 情况下只会落到
   * 「可以去刷」或「等待时段」。抽成纯函数便于专项验证做行为模拟。 */
  function rotomStatusZh(owned, locked, status) {
    if (owned) return '图鉴已收录';
    if (locked) return '需先获得普通洛托姆';
    if (status === 'ready') return '可以去刷';
    if (status === 'time') return '等待时段';
    return '等待天气';
  }
  function rotomStatus(f, cd, owned) {
    if (owned) return 'done';
    /* 第一百一十五批：天气 / 时段还没读到（unknown）时不能算「可以去刷」。
     * 以前 cd.ok = !miss.length，unknown 时 miss 恰好是空的 → ok=true → ready，
     * 于是弹窗刚打开就把不满足天气的形态显示成绿色「可抓」，点了开始、小桥
     * 回话读到真实天气后才变成「等待天气」。现在未知一律当等待，配合确定性
     * 预报（state() 每次都刷新）正常情况下 unknown 不会出现，只作安全兜底。 */
    if (cd.unknown) return cd.timeOnly ? 'time' : 'weather';
    if (cd.ok) return 'ready';
    return cd.timeOnly ? 'time' : 'weather';
  }
  /* ---------------- 第八十七批：条件不满足就「跳过这一项」，条件回来接着刷 ----------------
   * 第八十二批只管「同时勾了好几只」时的多选场景，还留了两条不拦的规矩
   * （只剩一只不拦 / 全员不满足就一直不拦）。玩家这次的诉求把这两条都推翻了：
   *   「洛托姆捕捉开启后，天气变化导致不满足限制时自动跳过该项；
   *     天气变化满足限制条件时则恢复抓取；没有可抓取的了就关闭功能。」
   *
   * 所以现在改成：
   *   · 读得到条件（known）且不满足 → 这一项就跳过，不管还剩几只；
   *   · 跳过的记在配置的 rotomSkip 里（跟着配置持久化，重开插件也记得），
   *     **不再取消勾选** —— 勾了就是勾了，天气回来接着刷，不用玩家手动再勾；
   *   · 条件回来（或本来就没问题）→ 自动从跳过名单里出来，日志写一句「接着刷」；
   *   · 读不到条件（unknown）不跳 —— 宁可照老口径进去按实际刷出来的算。
   * 一只都刷不了时怎么收尾，交给 autoStopIfNoReady()：直接关掉功能（见 rotomWaitText）。
   */
  function rotomSkipMap() {
    var m = D.cfg.rotomSkip;
    if (!m || typeof m !== 'object' || Array.isArray(m)) return {};
    return m;
  }
  function rotomStale(ctx, pickIn) {
    var pick = Array.isArray(pickIn) ? pickIn.slice()
      : (Array.isArray(D.cfg.rotomPick) ? D.cfg.rotomPick.slice() : []);
    var out = [];
    pick.forEach(function (i) {
      var f = ROTOM_FORMS[i];
      if (!f) return;
      /* 第一百零九批：已收录的形态照样参与天气判断 —— 解除已获得限制，天气限制保留 */
      if (rotomOwned(f, ctx)) return;
      var cd = rotomCond(f, ctx);
      if (cd.ok || cd.unknown) return;
      out.push({ f: f, cd: cd });
    });
    return out;
  }
  /* 主循环每一圈 / 每次重算清单前都调一次：新出现的不满足条件进跳过名单，
   * 条件回来的自动出来。返回这次「新跳过了几只」。 */
  function rotomDropStale(ctx) {
    /* 第一百二十批：勾选「等待条件」时不把条件不满足的剔除，只踢去末尾；
     * 没勾等待条件才按老口径写跳过名单（不满足就跳过）。 */
    if (D.cfg.waitCond) return 0;
    var skip = rotomSkipMap();
    var changed = 0, added = [];
    rotomStale(ctx, D.cfg.rotomPick).forEach(function (s) {
      if (skip[s.f.i]) {
        skip[s.f.i].miss = (s.cd.miss || []).join(' / ');
        skip[s.f.i].nextAt = s.cd.nextAt || 0;
        return;
      }
      skip[s.f.i] = {
        need: (s.cd.need || []).join(' / '),
        miss: (s.cd.miss || []).join(' / '),
        at: Date.now(),
        nextAt: s.cd.nextAt || 0
      };
      added.push(s);
      changed++;
    });
    if (changed) {
      config({ rotomSkip: skip });
      note('info', '洛托姆 ' + added.map(function (s) { return s.f.zh; }).join('、') +
        ' 的条件现在不满足（' + added.map(function (s) {
          return (s.cd.miss || []).join(' / ') || (s.cd.need || []).join(' / ') || '条件';
        }).join('、') + '），先跳过这一项' +
        (added.some(function (s) { return s.cd.nextAt; })
          ? '；' + clockText(added.filter(function (s) { return s.cd.nextAt; })[0].cd.nextAt) +
            ' 前后天气就轮到它了'
          : '') + '，条件回来会自动接着刷');
    }
    return changed;
  }
  /* 条件回来了就把跳过名单里那几只放出来（只动插件自己记的，玩家勾选原样不动） */
  function rotomRearm(ctx) {
    var skip = rotomSkipMap(), keys = Object.keys(skip);
    if (!keys.length) return 0;
    var back = [], changed = false;
    keys.forEach(function (k) {
      var f = ROTOM_FORMS[Number(k)];
      if (!f) { delete skip[k]; changed = true; return; }
      /* 第一百零九批：不再因为「已收录」就把跳过项放出来，天气限制照旧 */
      if (rotomOwned(f, ctx)) { delete skip[k]; changed = true; return; }
      var cd = rotomCond(f, ctx);
      if (!cd.ok) return;
      delete skip[k];
      changed = true;
      back.push(f);
    });
    if (changed) config({ rotomSkip: skip });
    if (back.length) {
      note('ok', '洛托姆 ' + back.map(function (f) { return f.zh; }).join('、') +
        ' 的条件回来了，自动恢复抓取');
    }
    return back.length;
  }
  /* 现在被「条件不满足」跳过的形态 */
  function rotomParkLeft() {
    var skip = rotomSkipMap();
    return Object.keys(skip).map(function (k) { return ROTOM_FORMS[Number(k)]; })
      .filter(function (f) { return !!f; });
  }
  /* 第七十七批：五张洛托姆卡片的「·」明细，口径跟未捕捉清单里的卡片完全一致
   * （有天气限制 / 需求 … 地点）。
   * 以前是「地点：… / 条件已满足 · … / 这一关的天气…」三段各说各的，
   * 现在跟玩家看惯的饭匙蛇 / 巨沼怪那类卡片一个写法。
   * 第八十三批：玩家要求「需求」那一行不再挂条件尾巴，改成单独一行写
   * **对应章节现在的天气和时段**（第九十八批：这一行又按玩家要求删掉了，见下）。
   * 第九十七批：条件类型那行和「需求 … 地点」这行并成一行（needLine）。
   * 第九十八批：玩家要求删掉「这一关现在天气 … / 时段 …」—— 顶部栏已有，卡片上不再重复。 */
  /* 第九十七批：玩家要求「有天气限制」和「需求 … 地点」两行并成一行 ——
   * 条件类型 + 需求（带图标的） + 地点写成同一句，少占一行高度：
   *   「有天气限制：🌋 火山灰 / 🔆 大晴天 · 神奥·227号道路」 */
  function needLine(kind, need, spot) {
    var n = (need || []).filter(Boolean).join(' / ');
    if (n) return kind + '：' + n + (spot ? ' · ' + spot : '');
    return kind + (spot ? ' · ' + spot : '');
  }
  function rotomReasons(f, cd, view, owned) {
    var out = [];
    if (owned) {
      out.push('图鉴已收录（#' + f.dex + '）：这个「特殊的相遇」已用过，不能再触发');
      return out;
    }
    var wxN = (f.weather || []).length, tN = !!(f.night || f.day);
    var kind = wxN && tN ? '有天气和时段要求'
      : (tN ? '有时间要求' : (wxN ? '有天气限制' : '没有条件限制'));
    out.push(needLine(kind, cd.need, rotomSpotText(f)));
    /* 第一百一十五批：玩家要求「能显示天气状态」—— 把目标关此刻的天气 / 时段
     * 和「条件是否满足」直接写在卡片上。以前第 98 批删过这行（当时说顶部栏有），
     * 现在顶部栏在没读到 adv.chapter 时经常是「未读到」，卡片上必须自带。
     * 有确定性预报，未点开始捕捉也能给出真实值，不再是「条件未知」。 */
    var nowBits = [];
    if (wxN) nowBits.push('当前天气 ' + (cd.now || '未读到'));
    if (tN) nowBits.push('时段 ' + (cd.nowTime || '未读到'));
    if (nowBits.length) {
      out.push(nowBits.join(' · ') + ' · ' +
        (cd.unknown ? '天气/时段未读到，暂按等待处理'
          : (cd.ok ? '条件已满足，可以捕捉'
            : ('条件不满足（需 ' + (cd.need.join(' / ') || '—') + '），等待生效'))));
    }
    if (cd.unknown) {
      out.push('这一关的天气和时段还没读到（进度页只渲染当前地区，切到该地区才读得到）');
    }
    return out;
  }
  /* 「神奥·227号道路」——卡片上的地点短写（不带第几章，章节在前面的路径行里） */
  function rotomSpotText(f) {
    var rg = '', label = '';
    try {
      rg = regionOfCh(f.ch) || '';
      label = (DATA && typeof DATA.regionLabel === 'function') ? (DATA.regionLabel(rg) || '') : '';
    } catch (e) { label = ''; }
    return (label ? label + '·' : '') + (f.place || '');
  }
  function rotomCardOf(f, ctx) {
    var owned = rotomOwned(f, ctx);
    var cd = rotomCond(f, ctx);
    var view = chapterCondView(f.ch, ctx, f.step);
    var status = rotomStatus(f, cd, owned);
    var reasons = rotomReasons(f, cd, view, owned);
    /* 第一百一十五批：按玩家要求删掉「这一格是特别的相遇 / 4% / 期望 25 次」
     * 整栏说明。chance 仍保留在卡片字段里（刷取逻辑与概率日志要用），只是不再
     * 往卡片明细里塞这行字。 */
    var chance = rotomChance(f);
    if (!owned && cd.dayBreak) {
      reasons.push('现在不是白天：' + cd.dayBreak + ' 天亮之后才会出现');
    }
    var card = {
      id: f.dex,
      name: f.zh,
      rotom: true, rotomIdx: f.i, rotomKey: f.key,
      region: regionOfCh(f.ch) || '',
      regionLabel: '',
      status: status,
      statusLabel: owned ? '图鉴已收录' : (cd.ok ? '可以去刷' : '等条件'),
      reasons: reasons,
      pct: 100,
      ch: f.ch,
      step: f.step,
      spot: '第 ' + (f.ch + 1) + ' 章 · ' + f.place,
      conds: cd.need,
      off: [],
      offLabel: [],
      bonusConds: [],
      weatherNeed: cd.weatherNeed.join(' / '),
      timeNeed: cd.timeNeed.join(' / '),
      weatherNow: view.weatherLabel,
      weatherIcon: view.weatherIcon,
      timeNow: cd.nowTime,
      baby: false, familyEvolved: 0, familyOwned: [],
      nightOff: false, evo: null,
      spawns: [{
        ch: f.ch, step: f.step, label: f.place, pct: 100, open: true,
        conds: cd.need, only: false, off: []
      }],
      mapLocked: false,
      unknownCond: !!cd.unknown,
      rotomOwned: owned,
      chance: chance,
      dayBreak: cd.dayBreak || ''
    };
    card.score = owned ? 0 : scoreCard(card, D.cfg);
    return card;
  }
  /* 第七十七批：弹窗那张「洛托姆形态」清单的一行 = 一张卡片的全部内容。
   * scan() 和 state() 都走这里，别在两处各拼一遍（以前两处字段还不一致）。 */
  function rotomRowOf(f, ctx) {
    var owned = rotomOwned(f, ctx);
    /* 第一百零九批：真实图鉴收录状态只用于弹窗展示，不再影响能不能勾 / 能不能刷 */
    var caught = rotomDexOwned(f, ctx);
    var cd = rotomCond(f, ctx);
    var view = chapterCondView(f.ch, ctx, f.step);
    var status = rotomStatus(f, cd, owned);
    var rg = '', rgLabel = '';
    try {
      rg = regionOfCh(f.ch) || '';
      rgLabel = (DATA && typeof DATA.regionLabel === 'function') ? (DATA.regionLabel(rg) || '') : '';
    } catch (e) { rg = ''; rgLabel = ''; }
    var isBase = !!f.base;
    /* 第八十三批：没拿到普通洛托姆之前，5 种形态一律锁着（灰色、不可勾选） */
    var locked = !isBase && !rotomBaseOwned(ctx);
    var reasons = rotomReasons(f, cd, view, owned);
    var skipNow = rotomSkipMap();
    var parked = !owned && !!skipNow[f.i];
    /* 第八十七批：条件不满足被跳过的那几只，卡片上要写清楚为什么没在刷 ——
     * 勾选还在（不用玩家再勾一次），条件一回来就自动接着刷。 */
    if (parked) {
      var pk = skipNow[f.i] || {};
      reasons.push('条件现在不满足（' + (pk.miss || (cd.miss || []).join(' / ') || '天气 / 时段') +
        '），先跳过这一项' +
        (pk.nextAt > Date.now() ? '；' + clockText(pk.nextAt) + ' 前后就轮到它了' : '') +
        '，条件回来会自动接着刷');
    }
    /* 第一百一十五批：按玩家要求删掉「这一格是特别的相遇 / 4% / 已重抽 N 次 /
     * 理论上 X% 该出了」整栏说明。chance / tries 字段仍回传（概率日志与刷取逻辑用），
     * 只是不再往弹窗卡片里塞这行字。oddsText() 保留给工具函数，UI 不再调用。 */
    var chance = rotomChance(f);
    if (locked) {
      reasons.unshift('需获取普通洛托姆（#479 · ' + rotomBaseSpot() + '）后这只才会开启');
    }
    return {
      i: f.i, key: f.key, id: f.dex, name: f.zh, ch: f.ch,
      region: rg, regionLabel: rgLabel,
      place: '第 ' + (f.ch + 1) + ' 章 · ' + f.place,
      path: spotPath(f.ch, f.step) || ('第 ' + (f.ch + 1) + ' 章 · ' + f.place),
      owned: owned,
      onceDone: rotomOnceDone(f, ctx),
      caught: caught,
      base: isBase,
      locked: locked,
      picked: (D.cfg.rotomPick || []).indexOf(f.i) >= 0,
      status: status,
      /* 第一百一十七批：普通洛托姆不再写死「先去刷它」，按当前天气 / 时段条件
       * 与其它 5 只形态同口径显示（见 rotomStatusZh）。 */
      statusZh: rotomStatusZh(owned, locked, status),
      reasons: reasons,
      parked: parked,
      /* 第八十八批：弹窗那行「特别的相遇（每次进图 4%，期望约 25 次）」用这两个字段 */
      chance: chance,
      tries: num(D.stats && D.stats.rerolls, 0),
      dayBreak: cd.dayBreak || '',
      needZh: f.needZh || '无', conds: cd.need,
      ok: cd.ok && !cd.unknown, unknown: !!cd.unknown,
      nowWx: cd.now, nowTime: cd.nowTime
    };
  }
  /* 这一趟时间线里**所有**洛托姆相遇格的下标（升序，空数组 = 这一趟压根没有）。
   *
   * 用户口径（第七十八批）：洛托姆 5 个形态都只在**自己那一章的那个地段**的
   * 「特别的相遇」格刷新（切割洛托姆 = 神奥.第五章 自豪的后院 · 特别的相遇）。
   * 这一趟地图没刷出相遇格 → 直接切走重进重抽，不在里面白跑。
   *
   * 上一版有两个位置兜底，正是「没有相遇格也一路打穿整段」的元凶：
   *   ② 该地段在时间线上、但段内没标出相遇格 → 退到这一段自己的起点当遭遇格；
   *   ③ 连带段都没有 → 退到「离离线表预期位置最近」的那一处。
   * 于是时间线里只要排了「自豪的后院」这一整段野怪（一个相遇格都没有），
   * 也会被判成「这里有 1 处遭遇格」，主循环就一路打到该段最后一个点才肯切图 ——
   * 玩家看到的正是「地图上明明没刷特别的相遇，却把自豪的后院打穿了」。
   * 这两个兜底整条删掉：没有相遇格就是没有。
   *
   * 现在的认法（只认**明确写着相遇**的格子，「?」「地段起点」一律不算）：
   *   ① 时间线里出现目标地段（段名一致 / 互相包含）→ 只取**这一段里**的相遇格；
   *      段内一个都没有 → 空数组；
   *   ② 时间线里压根没有这个地段 → 也是空数组（这一趟没排到它，同样该重抽）；
   *   ③ 认不出目标地段名（f.place 为空）→ 退到「整条时间线上的相遇格」。 */
  /* 第八十五批：「特别的相遇」格到底长什么样 —— 之前一直认错，这才是「进图就切走」的根因。
   *
   * 翻游戏源码（bundle 里时间线渲染那一段）：
   *
   *     qe = va.type === 'wild' && !va.special ? 'wild' : … : 'misc';
   *     title = e(va.name) + ' · ' + e(we[va.type]);   // we.wild = '野生宝可梦'
   *
   * 也就是说：**「特别的相遇」节点的 class 是 misc（不是 wild），
   * title 里写的仍然是「野生宝可梦」，压根没有「特别的相遇」这四个字**。
   * 以前只认 title 里的「特别的相遇 / 特殊相遇」，于是这一格永远认不出来 ——
   * 进图 1.2 秒就判「这一趟没刷出相遇格，立刻切走重进」，
   * 玩家看到的就是「明明弹出『在战斗区有特别的相遇！』，插件却把这一场切走了」。
   *
   * 现在两种都认：
   *   ① title 里明确写着相遇（兼容其它语言 / 旧版游戏）；
   *   ② **class 是 misc、title 的类型文字是「野生宝可梦」** —— 普通野怪是 wild 类，
   *      不会跟它撞；misc 里的道具 / 树果 / 礼物 / 石碑类型文字都不是「野生宝可梦」。 */
  var ROTOM_STATIC_TXT = /特别的相遇|特殊相遇|特殊遭遇|特别遭遇|固定相遇|固定遭遇|Rencontre sp[eé]ciale|sp[eé]cial|statique|static/i;
  var ROTOM_WILD_TXT = /^(野生宝可梦|野生寶可夢|Pokémon sauvage|Wild Pokémon|Pokémon salvaje|Pokémon selvatico|야생)/i;

  function rotomStaticNode(types, cls) {
    var t = String(types || '');
    if (ROTOM_STATIC_TXT.test(t)) return true;
    var c = ' ' + String(cls || '') + ' ';
    if (c.indexOf(' misc ') >= 0 && ROTOM_WILD_TXT.test(t)) return true;
    return false;
  }

  function rotomAreaRuns(scan, f) {
    var res = { seen: false, points: [], first: -1, last: -1, unknownIn: 0 };
    if (!scan || !scan.types || !scan.types.length || !scan.seq) return res;
    var place = String((f && f.place) || '');
    if (!place) return res;
    var cls = scan.cls || [];
    var n = Math.min(scan.types.length, scan.seq.length);
    var runs = [], i;
    for (i = 0; i < n; i++) {
      var nm = String(scan.seq[i] || '');
      var last = runs[runs.length - 1];
      if (!last || last.name !== nm) runs.push({ name: nm, statics: [], first: i, last: i });
      runs[runs.length - 1].last = i;
      if (rotomStaticNode(scan.types[i], cls[i])) runs[runs.length - 1].statics.push(i);
    }
    for (var r = 0; r < runs.length; r++) {
      var rn = runs[r].name;
      if (!rn) continue;
      if (!(rn === place || rn.indexOf(place) >= 0 || place.indexOf(rn) >= 0)) continue;
      res.seen = true;
      if (res.first < 0) res.first = runs[r].first;
      res.last = runs[r].last;
      for (var s = 0; s < runs[r].statics.length; s++) res.points.push(runs[r].statics[s]);
    }
    res.points.sort(function (a, b) { return a - b; });
    /* 第八十批：这一段里还有多少个「没读到 title」的节点 —— 段内的格子还没
     * 全部渲染出来时，不能断言「这一段没刷相遇格」，得再等一拍。 */
    if (res.seen) {
      for (var k = res.first; k >= 0 && k <= res.last && k < n; k++) {
        if (!String(scan.seq[k] || '')) res.unknownIn++;
      }
    }
    return res;
  }
  function rotomPointsAt(scan, f) {
    var res = rotomAreaRuns(scan, f);
    if (res.seen) return res.points;
    /* 第八十五批：段名跟时间线对不上时**也要**把相遇格捞出来，别白切。
     * 系统里同一块地方有两套名字：离线表写「227号道路」，而游戏时间线/横幅写的是
     * 「战斗区」（截图里弹的就是「在战斗区有特别的相遇！」），名字一不一致，
     * 以前就会一路判到「这一趟时间线里没有这个地段 → 立刻切走重进」。
     * 章节早就确认是目标章了（rotomMissed 里 chNow === card.ch），所以这里退到
     * 「整条时间线上的相遇格」是安全的：认出来的还是本章的 special 格。 */
    var out = [];
    if (!scan || !scan.types) return out;
    var cls = scan.cls || [];
    for (var i = 0; i < scan.types.length; i++) {
      if (rotomStaticNode(scan.types[i], cls[i])) out.push(i);
    }
    return out;
  }

  /* 洛托姆专用的「切图重进」判定：不看 adv.nodes 里有没有这只 id
   * （洛托姆格是静态节点，池子里挂的不是 4790x），改成扫时间线找「特别的相遇」格。
   * 这一趟没有这一格 / 已经走过还没到手 → 切走重进重抽（跟定点循环那边一致）。 */
  function tlScan() {
    var nodes = qa('#timeline .tl-node');
    if (!nodes.length) return null;
    var seq = [], types = [], cls = [], unknown = 0;
    for (var i = 0; i < nodes.length; i++) {
      var t = String(nodes[i].getAttribute('title') || '');
      /* 第八十五批：节点的 class 也要读 —— 游戏把「特别的相遇」节点渲染成
       * .tl-node.misc（type 是 wild 但带 special），title 里只有「野生宝可梦」，
       * 光看 title 永远认不出来。见 rotomStaticNode()。
       * cls 跟 seq / types 严格同下标，没 title 的节点也占一位。 */
      var c = String(nodes[i].className || '');
      /* 第八十批：以前这里「有一个节点没 title 就整条返回 null」—— 刚进图时间线
       * 还在渲染的那几拍，于是整条判定被作废，要等下一拍；碰上节点是逐个揭示的
       * 情况，就一直读到不满意的状态，直到走进去十几个格子才第一次能判。
       * 现在改成：没 title 的节点留空占位（**索引位置保持不变**，跟 tl-count 的
       * 第 N 个点仍然对得上），单独的 unknown 计数交给 rotomMissed 去决定
       * 「信息够不够下结论」。 */
      if (!t) { seq.push(''); types.push(''); cls.push(c); unknown++; continue; }
      var parts = t.split(' · ');
      seq.push(parts[0] || '');
      types.push(parts.length > 1 ? parts[1] : '');
      cls.push(c);
    }
    var el = document.getElementById('tl-count');
    var m = /^(\d+)\s*\/\s*(\d+)$/.exec(String(el ? el.textContent : '').trim());
    return {
      seq: seq, types: types, cls: cls, unknown: unknown,
      cur: m ? Number(m[1]) : 0,
      total: m ? Number(m[2]) : seq.length
    };
  }
  /* 第八十五批：游戏自己弹的那条横幅 = 「你已经踏进相遇格了」的铁证。
   *
   * 游戏开打前会走这一段（bundle 里 battleStart）：
   *     if (a.kind === 'wild' && !a.roam) await Hn(G),
   *     a.node?.special && await aa(e('Rencontre spéciale à {place} !'), 900, 'special')
   * 中文包就是「在{place}有特别的相遇！」，横幅容器是 #banner（class 变成 banner show ...）。
   *
   * 换句话说：**这条横幅出来的时候，玩家脚底下那一格就是相遇格**，
   * 此时插件如果判「这一趟没刷出相遇格、立刻切走重进」，就是当场把这场相遇扔掉。
   * 用户在截图里碰到的正是这件事。所以只要读到它，这一趟就绝不许再判「没有相遇格」。 */
  function rotomStaticHint() {
    /* #banner 是战场模板里的 <div class="banner" id="banner">（boot.js 的 arena 那段），
     * 弹提示时 class 变成 "banner show"。另外两路是兜底：万一模板改了 id，
     * .banner 和游戏通用 toast（#toasts .toast）里的同一句话也认。 */
    var boxes = qa('#banner, .banner, #toasts .toast');
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (!b) continue;
      if (b.id === 'banner' || (b.classList && b.classList.contains('banner'))) {
        if (!b.classList || !b.classList.contains('show')) continue;
      }
      var t = String(b.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t) continue;
      if (/特别的相遇|特殊相遇|Rencontre sp[eé]ciale|encuentro especial|incontro speciale|특별한 만남|特異な出会い/i.test(t)) return t;
    }
    return '';
  }
  function rotomMark(card) {
    return {
      ch: card.ch, id: card.id, rotom: true,
      enteredAt: Date.now(), lastCur: -1, hit: -1,
      walkWhy: '', zoneAhead: false, retryAfter: 0,
      rerolls: 0, zoneWaitSince: 0, zoneWhy: '',
      /* 第八十二批：原来那一套「等这场战斗打完」的计时 + 提示 + 硬理由字段
       * 整组删掉 —— 现在战斗中不再等，判出该切就直接切出再切回。
       * battleNow 只用来在日志里说一句「这一趟是战斗中切出去的」。 */
      battleNow: 0,
      /* 第八十五批：第一次读到「有特别的相遇」横幅的时间（这一趟的有效期起点） */
      hintAt: 0
    };
  }
  /* 第七十二批：现在是不是正在打 —— 路上撞到的野生洛托姆 / 其它遭遇也算。
   * 这时候切图会把这一场连同「可能正是要抓的那只」一起丢掉，得等它打完。
   *
   * 第八十批：原来这里有三处「读不出来就当在打」的保守兜底 ——
   *   ① 存档有 adv.battle 对象但没有敌人列表 → true；
   *   ② 敌人的血条字段名对不上 → 默认 1 → 永远 > 0 → true；
   *   ③ DOM 上血条读不到宽度 → true。
   * 三条叠在一起，只要游戏把一场战斗的 adv.battle 残留下来，判定就恒为
   * 「正在战斗」；本该进图 1 秒就切的「这一趟没刷出相遇格」只好拖满 90 秒上限，
   * 90 秒正好走十多个格子 —— 玩家看到的就是「地图上明明没刷相遇格，却一路
   * 打到地段的最后几个点才切图」。
   * 现在改成：**读到的证据说没在打，就没在打**。只有「存档没写这一场、界面上
   * 又确实站着活着的敌人」时才算在打。 */
  function foeHpLeft(f) {
    if (!f || typeof f !== 'object') return null;
    var raw = (f.hp != null) ? f.hp
      : (f.hpNow != null ? f.hpNow : (f.curHp != null ? f.curHp : (f.curhp != null ? f.curhp : null)));
    if (raw == null) return null;
    if (typeof raw === 'object') return null;   // {cur,max} 这种读不准，交给界面判定
    var v = num(raw, null);
    return v == null ? null : v;
  }
  /* 界面上还站着活着的敌人吗？只认**渲染出来**的卡片、血条宽 > 0 才算活 ——
   * 打完以后残留的敌人卡片血条是 0%，不会再被当成「还在打」。 */
  function enemyAliveInDom() {
    var cards = qa('#enemy-slot .enemy');
    for (var j = 0; j < cards.length; j++) {
      var el = cards[j];
      if (!el) continue;
      if (el.classList && el.classList.contains('fxclone')) continue;
      if (el.getClientRects && !el.getClientRects().length) continue;
      var bar = q('.hp > div', el);
      var w = bar && bar.style && bar.style.width ? parseFloat(bar.style.width) : NaN;
      if (isFinite(w) && w > 0) return true;
    }
    return false;
  }
  function battleLive(save) {
    var sv = save || readSave() || {};
    var b = sv && sv.adv && sv.adv.battle;
    if (b && typeof b === 'object') {
      var foes = b.enemies || b.foes || null;
      if (foes && foes.length) {
        var known = 0;
        for (var i = 0; i < foes.length; i++) {
          var hp = foeHpLeft(foes[i]);
          if (hp == null) continue;
          known++;
          if (hp > 0) return true;
        }
        if (known) return false;        // 敌人的血都读出来了、全都倒了 = 打完了
        return enemyAliveInDom();       // 血条字段对不上：以界面上站着的活敌为准
      }
      if (foes) return false;           // 敌人列表是空数组 = 这一场没有敌人
      return enemyAliveInDom();         // battle 对象里没有敌人列表：以界面为准
    }
    return enemyAliveInDom();
  }
  /* 第八十二批：原来这里有一个「等这场打完再切图」的门禁（硬理由 8 秒 / 软理由
   * 90 秒）。玩家实测：一场战斗动画就要十几秒，等的这段时间够切出+切回重抽一整趟，
   * 而且这一趟本来就已经没戏了（没刷相遇格 / 相遇格全走完了），等它只是白等。
   * 现在整条删掉：判出该切就**直接切出再切回**，战斗照切不误。
   * battleLive() 仍然保留，只用来在日志里标一句「这一趟是战斗中切出去的」。 */
  /* 洛托姆专用「切图重进」判定：不看 adv.nodes 里有没有这只 id
   * （洛托姆格是静态节点，池子里挂的不是 4790x），改成扫时间线找「特别的相遇」格。
   *
   * 用户口径（第七十七 / 七十八批）：洛托姆 5 个形态都只在**自己那一章**的
   * 「特别的相遇」格刷新（切割洛托姆 = 神奥.第五章 自豪的后院 · 特别的相遇）。
   * 所以这一趟地图没刷出相遇格，就是白跑，别在里面打穿整段：
   *   ① 这一趟一处相遇格都没有 → **立刻**切走重进重抽（不等走完）；
   *   ② 还有相遇格排在后面 → 一路往里走，状态行写清「后面还有几处」；
   *   ③ 走到**最后一处**相遇格、并且不在战斗中 → 才切图重抽；
   *   ④ 这一趟跑完了（时间线下标回落）→ 也切图重抽。
   * 第七十八批的关键修正：判断「有没有相遇格」不再用任何位置兜底
   * （以前「地段在时间线上但段内没标相遇格」会被算成有 1 处），
   * 现在只认真的写着「特别的相遇」的格子，见 rotomPointsAt() 的注释。 */
  /* 第八十三批：从卡片反查形态 —— 普通洛托姆（#479）不进 rotomFormOfId()
   * （那一项要给 493 图鉴的常规卡片让路），但切图判定必须拿到它的地段名，
   * 所以卡片上带着 rotomIdx，这里优先按它取。 */
  function rotomFormOfCard(card) {
    if (!card) return null;
    var i = card.rotomIdx;
    if (i != null && ROTOM_FORMS[i]) return ROTOM_FORMS[i];
    return rotomFormOfId(card.id);
  }
  function rotomMissed(save, card, m) {
    if (m) m.walkWhy = '';
    /* 第八十五批：目标已经进图鉴了 —— 这一秒起就不要再切了。
     * 用户要求「捕捉完再切」：抓到那一刻存档里已经有它了，切片还继续判
     * 「相遇格走完 → 切图重抽」的话，会白切一次（多跑一趟中立章再回来）。
     * 这里直接不切，交给主循环的 ctx.dex 分支换下一只形态。 */
    var dNow = (save && save.dex && typeof save.dex === 'object') ? save.dex : {};
    if (card && (dNow[card.id] || dNow[String(card.id)])) return '';
    var sc = tlScan();
    if (!sc) return '';
    var chNow = (save && save.adv && typeof save.adv.chapter === 'number') ? save.adv.chapter : -1;
    if (chNow >= 0 && chNow !== card.ch) return '章节不是目标章了，重新进一次';
    var f = rotomFormOfCard(card) || {};
    var area = rotomAreaRuns(sc, f);
    var pts = rotomPointsAt(sc, f);

    /* ⑥ 这一趟压根没有相遇格 —— 先判这个，连「还没开始走」也一样要切。
     *    留 1.2 秒只是为了等刚进图那一拍的时间线渲染完（否则会把上一趟的
     *    旧节点当成这一趟的，白白多切一次）。
     *    两种情形分开写，方便一眼看出是「地段排进来了但没刷相遇格」还是
     *    「这一趟连这个地段都没排到」。
     *    第八十二批：这一趟已经没戏了，判出来就立刻切 —— 遇到战斗也不等，
     *    直接切出再切回（等一场战斗十几秒，够重抽一整趟了）。
     *    另外：只要有节点还没读到 title（时间线还没渲染完），「这一段没刷出
     *    相遇格」就只是「还没看到」而不是「没有」，先不下结论；
     *    20 秒还读不全就按已知的判，别被几个永远不写 title 的节点拖死。 */
    if (!pts.length) {
      var seenMs = Date.now() - num(m && m.enteredAt, Date.now());
      var settled = seenMs > 20000;
      if (!settled && ((area.seen && area.unknownIn > 0) || (!area.seen && num(sc.unknown, 0) > 0))) {
        if (m) {
          m.walkWhy = '时间线还有 ' + (area.seen ? area.unknownIn : sc.unknown) +
            ' 个点没渲染出来，先等它加载完再判这一趟有没有相遇格';
        }
        return '';
      }
      /* 第八十五批：**读到游戏横幅就绝不切**。
       * 横幅（#banner「在{place}有特别的相遇！」）是游戏在「踏进相遇格、开始那场战斗」
       * 那一刻弹的 —— 它一出来就说明这一趟确实走到了相遇格，此时判「没刷出相遇格」
       * 并切走，等于当场把这只会变成洛托姆的相遇扔掉（用户截图里碰到的正是这件事）。
       * 所以拿到这条证据后，这一趟只认两件事收尾：
       *   ① 时间线跑完一轮（走着走着下标回落）→ 这一趟确实白跑了，切图重抽；
       *   ② 提示挂太久（8 分钟）还没到手 → 兜底切走，免得真卡死。 */
      var hint = rotomStaticHint();
      if (m && hint) m.hintAt = Date.now();
      var hintAt0 = num(m && m.hintAt, 0);
      if (hintAt0 > 0) {
        var atNow = num(sc.cur, 0) > 0 ? num(sc.cur, 0) - 1 : -1;
        var prevCur = num(m && m.lastCur, -1);
        if (m && atNow >= 0) m.lastCur = atNow;
        if (prevCur > 0 && atNow >= 0 && atNow < prevCur) {
          return '这一趟跑完一轮（相遇格的这一场都打过了）还没把洛托姆拿到手，切图重抽';
        }
        if (Date.now() - hintAt0 > 480000) {
          return '这一趟一直挂着「有特别的相遇」提示、' +
            Math.round((Date.now() - hintAt0) / 60000) + ' 分钟还没到手，切图重抽';
        }
        if (m) {
          m.walkWhy = '游戏已经弹出「' + (hint || '有特别的相遇') +
            '」—— 这一趟确实走到了相遇格，先把它打完、抓到再切（不切走）';
        }
        return '';
      }
      if (seenMs > 1200) {
        var nm = f.place || '目标地段';
        return area.seen
          ? ('这一趟「' + nm + '」没刷出「特别的相遇」格（时间线共 ' + sc.total + ' 个点），立刻切走重进重抽')
          : ('这一趟时间线里没有「' + nm + '」这个地段（共 ' + sc.total + ' 个点），立刻切走重进重抽');
      }
      return '';
    }
    if (!sc.cur) return '';
    var at = sc.cur - 1;
    /* 一轮跑完（下标回落）：不管有没有刷出，都该重开一轮 */
    var prev = num(m && m.lastCur, -1);
    if (m) m.lastCur = at;
    var wrapped = prev > 0 && at < prev;

    var last = pts[pts.length - 1];
    /* 第八十五批：横幅正在显示 = 这一秒刚从相遇格踏进那场战斗。
     * 这时候切图就是当场把这场相遇扔掉（战斗还没结算，洛托姆还在里面）。
     * 只要还能读到横幅，就先不切，等这一场打完再说。 */
    var hintNow = rotomStaticHint();
    if (hintNow && m) m.hintAt = Date.now();
    if (hintNow && (wrapped || at > last)) {
      if (m) m.walkWhy = '刚踏进「有特别的相遇」这一场，先打完、抓到再切（不切走）';
      return '';
    }
    if (wrapped) {
      return '这一趟跑完了（' + pts.length + ' 处相遇格都在里面）还没到手，切图重抽';
    }
    if (at > last) {
      return '这一趟 ' + pts.length + ' 处相遇格（第 ' +
        pts.map(function (x) { return x + 1; }).join('、') + ' 个点）都走完、打完了还没到手，切图重抽';
    }
    if (m && at >= pts[0] && at < last) {
      var left = 0;
      for (var i = 0; i < pts.length; i++) if (pts[i] >= at) left++;
      m.walkWhy = '这一趟有 ' + pts.length + ' 处「特别的相遇」格，还有 ' + left + ' 处没走到，先走过去';
    }
    return '';
  }

  function cardOf(id, ctx, cfg) {
    var rf = rotomFormOfId(id);
    if (rf) return rotomCardOf(rf, ctx);
    var spawns = spawnsOf(id);
    var evo = (cfg && cfg.showEvo !== false) ? evoInfo(id, ctx) : null;
    // 第七批：t.POKEDEX 里带 baby:!0 的幼生宝可梦，只能培育屋孵蛋获得；
    // 同时检查整个进化家族里有没有已经拥有的「进化后状态」可当亲代。
    var baby = !!(DATA && typeof DATA.isBaby === 'function' && DATA.isBaby(id));
    var fam = baby && DATA.familyState ? DATA.familyState(id, ctx.save) : null;
    var usable = [], lockedSpots = [];
    for (var i = 0; i < spawns.length; i++) {
      if (chapterOpen(spawns[i].ch, ctx)) usable.push(spawns[i]);
      else lockedSpots.push(spawns[i]);
    }
    /* 第二十三批：优先只保留本地区（且没有游走神兽）的出没点，
     * 这样后面所有「切走重进」都留在本地区里 */
    usable = narrowBy(usable, ctx.save, function (x) { return x.ch; });
    var status = 'special', reasons = [], best = null, bestCond = null;
    var readySpots = [], waitSpots = [];

    for (var j = 0; j < usable.length; j++) {
      var cs = condState(usable[j], ctx);
      if (cs.ready) { readySpots.push({ sp: usable[j], cs: cs }); }
      else waitSpots.push({ sp: usable[j], cs: cs });
    }
    readySpots = narrowBy(readySpots, ctx.save, function (x) { return x.sp.ch; });
    waitSpots = narrowBy(waitSpots, ctx.save, function (x) { return x.sp.ch; });

    if (readySpots.length) {
      // 条件窗口已生效的排前面（稀缺窗口优先），否则纯按出没概率
      readySpots.sort(function (a, b) {
        var ac = a.cs.cond && a.cs.ready ? 1 : 0;
        var bc = b.cs.cond && b.cs.ready ? 1 : 0;
        if (ac !== bc && cfg && cfg.condFirst) return bc - ac;
        return num(b.sp.pct, 0) - num(a.sp.pct, 0);
      });
      best = readySpots[0].sp;
      bestCond = readySpots[0].cs;
      status = bestCond.cond ? 'ready-cond' : 'ready';
      reasons.push('可直接捕捉');
      if (bestCond.cond) {
        /* 第八十三批：条件尾巴（当年挤在需求行右边那句「当前天气 … / 时段 …」）
         * 单独挪到下一行，写清**对应章节现在的天气和时段**。 */
        reasons.push((bestCond.matched ? '限制已生效：' : '该关条件：') +
          (bestCond.need.join(' / ') || '—') + ' · ' + spotLabel(best));
      }
      /* 第二十一批：加成条件不再混进「该关条件」，单独一行写清是加成 */
      if (bestCond.bonus && bestCond.bonus.length) {
        reasons.push(bonusText(bestCond.bonus));
      }
      /* 第三十九批：这一关还有「某种条件里刷不出来」的限制，即使此刻没命中也要写明 */
      if (best && best.off && best.off.length) {
        reasons.push('注意：' + offText(best.off));
      }
      if (bestCond.unknown) reasons.push('该关天气未读到，条件以游戏内提示为准');
    } else if (waitSpots.length) {
      best = waitSpots[0].sp;
      bestCond = waitSpots[0].cs;
      status = bestCond.kind === 'time' ? 'time' : 'weather';
      reasons.push(needLine(
        status === 'time' ? '有时间要求' : '有天气限制',
        bestCond.need, spotLabel(best)));
      /* 第一百一十四批：等天气的目标写明下次开窗口的钟点（确定性预报算出来的），
       * 不再只写一句「有天气限制」让玩家干等。 */
      if (bestCond.nextAt > Date.now()) {
        reasons.push('下次轮到：' + clockText(bestCond.nextAt) + ' 前后（到点自动重算清单）');
      }
      /* 第九十八批：删掉「这一关现在天气 … / 时段 …」—— 顶部栏已有，重复。 */
      if (bestCond.unknown) {
        reasons.push('进度页只渲染当前地区：切到该关所在地区才会读到它的天气');
      }
    } else if (usable.length) {
      // 理论上不会走到：usable 至少落进上面两支
      best = usable[0];
      status = 'ready';
      reasons.push('可直接捕捉');
    } else if (lockedSpots.length) {
      best = lockedSpots[0];
      status = 'locked';
      reasons.push('地图未开放：' + spotLabel(best) + '（当前解锁到第 ' +
        (ctx.unlocked + 1) + ' 章）');
    } else if (baby && fam) {
      status = 'hatch';
      reasons.push('没有野外出现点，需要孵蛋获取');
      var evolvedNames = fam.evolved.slice(0, 4).map(function (m) {
        return m.name + ' #' + m.id + (m.inDex ? '（已有）' : '');
      });
      if (fam.anyOwned) {
        reasons.push('家族已有进化后状态：' + fam.owned.slice(0, 3).map(function (m) {
          return m.name + ' #' + m.id;
        }).join('、') + ' · 可放进培育屋当亲代');
      } else {
        reasons.push('家族里还没有任何进化后状态，先抓 / 进化一只亲代再孵');
      }
      if (evolvedNames.length) reasons.push('同族形态：' + evolvedNames.join('、'));
      if (fam.anyInBox) reasons.push('仓库里现成就有同族亲代，可直接放入培育屋');
    } else if (evo) {
      status = 'evo';
      reasons.push('没有野外出现点，只能由幼体进化');
    } else {
      status = 'special';
      reasons.push('没有野外出现点，也无可用进化路径（特殊获取）');
    }

    if (evo) {
      reasons.push((evo.haveNow ? '已有幼体 ' : (evo.haveBase ? '曾有幼体 ' : '未拥有幼体 ')) +
        evo.fromName + ' #' + evo.from);
      reasons.push(evo.text);
    }

    var pct = num(best && best.pct, 0) * 100;
    var bestView = best ? chapterCondView(best.ch, ctx, best.step) : null;
    var card = {
      id: id,
      name: DATA.name(id),
      region: DATA.regionOf(id),
      regionLabel: DATA.regionLabel(DATA.regionOf(id)),
      status: status,
      /* 条件没真正命中时（only=false 的加成条件）别把标签写成「已生效」。 */
      statusLabel: (status === 'ready-cond' && bestCond && !bestCond.matched)
        ? '条件目标 · 优先'
        : (({
          'ready': '可直接捕捉', 'ready-cond': '条件已生效 · 优先',
          'weather': '等待天气', 'time': '等待时段',
          'locked': '地图未开放', 'evo': '需要进化', 'hatch': '需要孵蛋获取',
          'special': '特殊获取'
        })[status] || status),
      reasons: reasons,
      pct: Math.round(pct * 100) / 100,
      ch: best ? best.ch : -1,
      step: best ? best.step : -1,
      spot: best ? spotLabel(best) : '—',
      conds: bestCond ? bestCond.need : [],
      /* 第三十九批：off = 当前把它挡在外面的条件（白天 / 夜晚 / 暴风雪…） */
      off: bestCond ? (bestCond.off || []) : [],
      offLabel: bestCond ? offNeed(bestCond.off) : [],
      bonusConds: bestCond ? bestCond.bonus : [],
      weatherNeed: condsLabel((best && best.conds || []).filter(isWeatherCond)),
      timeNeed: condsLabel((best && best.conds || []).filter(isTimeCond)),
      weatherNow: bestView ? bestView.weatherLabel : '未读到该关天气',
      weatherIcon: bestView ? bestView.weatherIcon : '',
      timeNow: ctx.time.label,
      baby: baby,
      familyEvolved: fam ? fam.evolved.length : 0,
      familyOwned: fam ? fam.owned.slice(0, 4).map(function (m) {
        return { id: m.id, name: m.name };
      }) : [],
      nightOff: !!(best && (best.nightOff ||
        (best.off && best.off.indexOf('night') >= 0))),
      evo: evo,
      spawns: spawns.slice(0, 4).map(function (sp) {
        return {
          ch: sp.ch, step: sp.step, label: spotLabel(sp),
          pct: Math.round(num(sp.pct, 0) * 10000) / 100,
          open: chapterOpen(sp.ch, ctx),
          conds: condsLabel(sp.conds), only: !!sp.only,
          off: condsLabel(sp.off || [])
        };
      }),
      mapLocked: !usable.length && !!lockedSpots.length,
      unknownCond: !!(bestCond && bestCond.unknown)
    };
    card.score = scoreCard(card, cfg);
    return card;
  }

  /* 排序档位：条件窗口已生效 > 可直接捕捉 > 等待窗口 > 其它（不自动前往） */
  function scoreCard(c, cfg) {
    var o = cfg || D.cfg;
    var p = num(c.pct, 0);
    if (c.status === 'ready-cond') return 100000 + p * 1000;
    if (c.status === 'ready') return 10000 + p * 1000;
    if ((c.status === 'weather' || c.status === 'time') && o.waitWeather) {
      return 5000 + p * 1000;
    }
    return 0;
  }
  function rankCards(cards, cfg) {
    var o = cfg || D.cfg;
    return (cards || []).filter(function (c) {
      return scoreCard(c, o) > 0;
    }).sort(function (a, b) {
      return scoreCard(b, o) - scoreCard(a, o) || a.id - b.id;
    });
  }
  function chanceLabel(n) {
    return (Math.round(num(n, 0) * 10) / 10) + '%';
  }

  /* ---------------- 扫描 = 读存档 + 算清单，不打开地图 ---------------- */
  function scan() {
    if (!DATA) throw new Error('离线图鉴数据表没加载，刷新一次游戏页');
    var ctx = context();
    /* 第六十九批：刷洛托姆模式跟「未捕捉清单」完全无关（那 5 个形态不在 493 里），
     * 清单直接来自固定表；只保留用户勾选要刷的那几只。
     * 第八十三批：普通洛托姆（#479 本体）也在这张表里，而且是 5 种形态的前置 ——
     * 没拿到它时 rotomBaseSync() 会把勾选强制改成「只刷它」，拿到了再放回 5 只形态。 */
    if (D.cfg.mode === 'rotom') {
      try { rotomBaseSync(ctx); } catch (e) { /* ignore */ }
      /* 第八十七批：每次重算清单前先把「跳过名单」对一遍 ——
       * 条件回来了的放出来（恢复抓取），条件已经不满足的收进去（跳过这一项）。
       * 都在 rotomEffPick() 之前做，下面选的 pick 才是这一拍真正该刷的。 */
      try { rotomRearm(ctx); } catch (e) { /* ignore */ }
      try { rotomDropStale(ctx); } catch (e2) { /* ignore */ }
      var pick = rotomEffPick(ctx);
      /* 第一百二十批：按「点击顺序」生成清单（rotomEffPick 已把不满足条件的
       * 踢到末尾），别再被 ROTOM_FORMS 的形态编号固定顺序盖掉。 */
      var rcards = pick.map(function (i) { return ROTOM_FORMS[i]; })
        .filter(function (f) { return !!f; })
        .map(function (f) { return rotomCardOf(f, ctx); });
      D.cards = rcards;
      D.found = null;
      D.gaps = DATA.regionGaps(ctx.save);
      D.weather = ctx.weather;
      D.time = ctx.time;
      D.unlocked = ctx.unlocked;
      var rt = { uncaught: rcards.length, ready: 0, waiting: 0, evo: 0,
        hatch: 0, locked: 0, special: 0, excluded: 0 };
      rcards.forEach(function (c) {
        if (c.status === 'done') rt.special++;
        else if (c.status === 'ready' || c.status === 'ready-cond') rt.ready++;
        else if (c.status === 'weather' || c.status === 'time') rt.waiting++;
        else rt.special++;
      });
      D.totals = rt;
      var rranked = rankCards(rcards, D.cfg);
      D.plan = rranked.map(function (c) {
        return {
          ch: c.ch, region: c.region, label: c.spot, locked: false,
          have: 0, total: 1, best: 100, score: c.score,
          active: 1, wait: 0, conds: c.conds,
          top: [{ id: c.id, name: c.name, pct: 100, est: false,
            condOn: c.status === 'ready', condLabel: (c.conds || []).join(' / ') }],
          id: c.id, status: c.status
        };
      });
      /* 第七十七批：5 张形态卡片的内容统一由 rotomRowOf() 出（scan / state 共用），
       * 而且是**全部 5 只**都回 —— 清单要一直列着 5 个形态，用户临时取消勾选也不会消失。 */
      D.rotom = ROTOM_FORMS.map(function (f) { return rotomRowOf(f, ctx); });
      D.lastScanAt = Date.now();
      D.condSig = condSignature(ctx);
      D.stats.rescans++;
      return D.plan;
    }
    var ids = DATA.uncaughtList(ctx.save);
    if (D.cfg.mode === 'target') {
      /* 第三十八批：用 wantIds() 而不是 resolveIds()——指定捕捉只认一只，
       * 匹配到多只时也不会一只一只换着追（那就是不停切图重进）。 */
      var want = wantIds(D.cfg.target);
      var allWant = resolveIds(D.cfg.target);
      ids = ids.filter(function (id) { return want.indexOf(id) >= 0; });
      /* 第九十二批：want 里「只能靠进化」的那一只 → 换成它的幼体。
       * 幼体已经在图鉴里时不再加进清单（抓过了，只差练级），只写一行说明。 */
      var evoHunt = [];
      want.forEach(function (id) {
        var e = evoHuntOf(id);
        if (!e) return;
        var baseOwned = !!(ctx.dex[e.id] || ctx.mons[e.id]);
        evoHunt.push({
          id: id, name: DATA.name(id),
          baseId: e.id, baseName: e.name,
          level: e.level, item: e.item, itemZh: e.itemZh,
          hops: e.hops, chain: e.chain, pathText: e.pathText,
          owned: baseOwned
        });
        if (baseOwned || ids.indexOf(e.id) >= 0) return;
        ids.push(e.id);
      });
      /* 第一百零七批：指定目标一律留在清单里，哪怕已经进过图鉴、闪光图鉴已解锁。
       * 旧写法只在 untilShiny 开着时补目标，还用 shinyOwned() 把「点亮过闪光」的
       * 整只踢掉 —— 于是玩家已解锁闪光图鉴的宝可梦永远选不中，点开始就是空的。
       * untilShiny 只决定「抓到一只就停」还是「刷到本轮新闪光才停」，
       * 不该决定目标能不能被选中。 */
      want.forEach(function (id) {
        if (!DATA.mons[id] || ids.indexOf(id) >= 0) return;
        if (DATA.isSpecial && DATA.isSpecial(id)) return;    // 传说 / 幻兽没法反复刷
        /* 第九十二批：只能靠进化的目标不刷闪 —— 刷一百只幼体的闪光也变不出它，
         * 抓到幼体就收工，让玩家去练级。 */
        if (evoHuntOf(id)) return;
        ids.push(id);
      });
      D.found = {
        query: D.cfg.target, ids: want, allIds: allWant,
        multi: allWant.length > 1,
        evoHunt: evoHunt,
        unlocked: 0, locked: 0,
        top: []
      };
    } else {
      D.found = null;
    }
    var cards = ids.map(function (id) { return cardOf(id, ctx, D.cfg); });
    /* 第九十二批：这张卡片是「替某只进化型刷幼体」，写清是替谁、练到几级 */
    if (D.found && D.found.evoHunt && D.found.evoHunt.length) {
      D.evoNoted = D.evoNoted || {};
      D.found.evoHunt.forEach(function (h) {
        var how = h.pathText || (h.item ? h.itemZh : ('Lv.' + (h.level || '?')));
        if (h.owned) {
          if (!D.evoNoted['o' + h.id]) {
            D.evoNoted['o' + h.id] = 1;
            note('info', '「' + h.name + '」没有野外出现点：幼体 ' + h.baseName +
              ' 已经在图鉴里了，' + how + '（图鉴捕捉先停下）');
          }
          return;
        }
        cards.forEach(function (c) {
          if (c.id !== h.baseId) return;
          c.huntFor = h;
          c.reasons.unshift('「' + h.name + '」没有野外出现点：先刷幼体 ' + h.baseName +
            '（抓到后 ' + how + '）');
          c.statusLabel = '刷幼体 · 抓到后 ' + how;
        });
        if (!D.evoNoted['n' + h.id]) {
          D.evoNoted['n' + h.id] = 1;
          note('info', '「' + h.name + '」没有野外出现点：改成先去刷幼体 ' + h.baseName +
            '（抓到后 ' + how + '）');
        }
      });
    }
    D.cards = cards;
    D.gaps = DATA.regionGaps(ctx.save);
    D.weather = ctx.weather;
    D.time = ctx.time;
    D.unlocked = ctx.unlocked;

    var t = { uncaught: cards.length, ready: 0, waiting: 0, evo: 0,
      hatch: 0, locked: 0, special: 0, excluded: 0 };
    cards.forEach(function (c) {
      if (c.status === 'ready' || c.status === 'ready-cond') t.ready++;
      else if (c.status === 'weather' || c.status === 'time') t.waiting++;
      else if (c.status === 'locked') t.locked++;
      else if (c.status === 'evo') t.evo++;
      else if (c.status === 'hatch') t.hatch++;
      else t.special++;
    });
    t.excluded = 649 - Object.keys(DATA.mons).length +
      (DATA.legendary ? DATA.legendary.length : 0) +
      (DATA.mythical ? DATA.mythical.length : 0);
    D.totals = t;

    var ranked = rankCards(cards, D.cfg);
    D.plan = ranked.map(function (c) {
      return {
        ch: c.ch, region: c.region, label: c.spot, locked: c.mapLocked,
        have: 0, total: 1, best: c.pct, score: c.score,
        active: 1, wait: 0, conds: c.conds,
        top: [{ id: c.id, name: c.name, pct: c.pct, est: false,
          condOn: c.status === 'ready-cond', condLabel: (c.conds || []).join(' / ') }],
        id: c.id, status: c.status
      };
    });
    if (D.found) {
      D.found.unlocked = D.plan.length;
      D.found.locked = cards.filter(function (c) { return c.mapLocked; }).length;
      D.found.top = D.plan.slice(0, 5).map(function (p) {
        return { ch: p.ch, region: p.region, label: p.label, pct: p.best,
          condOn: p.status === 'ready-cond', conds: p.conds.slice(0, 3) };
      });
    }
    D.lastScanAt = Date.now();
    D.condSig = condSignature(ctx);
    D.stats.rescans++;
    return D.plan;
  }

  /* ---------------- 第三十九批：天气 / 时段一变就自己重算清单 ----------------
   * 以前只有三种时机：点「开始」、点「扫描」、主循环里每 5 分钟一次。
   * 天气 / 时段轮换是不定时的，晚一拍就会追着一只**已经刷不出来**的目标跑
   * （月石白天、太阳岩夜里、某些关下雨就换池子），所以这里盯着 DOM 里
   * 「各章节当前天气 + 当前时段」的指纹，一变就重算一遍清单。
   * 指纹只算读到的东西：进度页没打开时 parts 为空、指纹稳定，不会反复刷。 */
  function condSignature(ctx) {
    var w = (ctx && ctx.weather) || {}, t = (ctx && ctx.time) || {};
    var byCh = w.byCh || {};
    var parts = [];
    Object.keys(byCh).sort().forEach(function (k) {
      var arr = (byCh[k] || []).slice().sort();
      if (arr.length) parts.push(k + ':' + arr.join('+'));
    });
    var ch = (ctx && ctx.save && ctx.save.adv &&
      typeof ctx.save.adv.chapter === 'number') ? String(ctx.save.adv.chapter) : '';
    /* 第八十七批：小桥（游戏自己算的天气 / 时段）也进指纹 —— 别的地区的章节
     * 在 DOM 里根本没有行，靠它才能在天气一变就重算清单。 */
    /* 第一百一十四批：WXC.sig 现在常驻含预报指纹（定时器每 800ms 更新），
     * 桥不通时也要让它进指纹，否则跨整点天气变了却没人通知清单重算。 */
    var bx = WXC.sig || '';
    return {
      sig: parts.join(',') + '|' + (t.key || '') + '|' + ch + '#' + bx,
      known: parts.length > 0 || !!t.key || !!bx
    };
  }
  var autoScanAt = 0;
  function autoRescan() {
    if (!DATA) return false;
    var ctx;
    try { ctx = context(); } catch (e) { return false; }
    var cur = condSignature(ctx);
    /* 什么都没读到（进度页没渲染、存档还没来）时不动清单，也别把指纹写成空 */
    if (!cur.known) return false;
    if (!D.condSig) { D.condSig = cur.sig; return false; }
    if (cur.sig === D.condSig) return false;
    var now = Date.now();
    /* 第八十七批：小桥每 1.5 秒给一次天气，重算也跟得上 —— 从 6 秒收到 2.5 秒，
     * 「天气一变就重算」才真的算实时（还留着这点间隔防止页面上下来回渲染造成连刷）。 */
    if (now - autoScanAt < 2500) return false;
    if (!gameReady()) return false;
    D.condSig = cur.sig;
    autoScanAt = now;
    try { scan(); } catch (e) { return false; }
    /* 第八十一批：原来这里会把一句「天气 / 时段变了、清单已重算（现在是 X / Y）」
     * 写成 D.note 挂到看板底部状态行上 —— 纯描述，玩家不需要，已整段删掉。
     * 清单该重算还是重算（上面 scan()），状态行不再多这一截。 */
    D.note = '';
    return true;
  }
  setInterval(function () {
    try { autoRescan(); } catch (e) { /* 自动刷新出错不影响捕捉 */ }
  }, 2000);

  /* ---------------- 页面操作（只用于「出发」，不扫描） ---------------- */
  function gameReady() {
    return (!!q(Q.speed) || !!q(Q.mapTab) || !!q('#app')) && !!readSave();
  }
  function mapActive() {
    var s = q(Q.mapScreen);
    return !!(s && s.classList.contains('active') && qa(Q.row).length);
  }
  async function openMap() {
    if (mapActive()) return true;
    var btn = q('#chapter-btn') || q('#side-chapter') || q(Q.mapTab);
    if (!btn) return false;
    try { btn.click(); } catch (e) { return false; }
    for (var i = 0; i < 40; i++) {
      await sleep(200);
      if (mapActive()) return true;
    }
    return false;
  }
  function backToAdventure() {
    var tab = q(Q.advTab);
    if (!tab) return;
    var scr = q('#screen-adventure');
    if (!scr || !scr.classList.contains('active')) {
      try { tab.click(); } catch (e) { /* ignore */ }
    }
  }
  function closeDetail() {
    var x = q(Q.detClose);
    if (x) { try { x.click(); } catch (e) { /* ignore */ } }
  }
  function rowSel(ch) { return Q.row + '[data-ch="' + ch + '"]'; }
  function regionCards() {
    var open = qa(Q.regionOpen);
    if (open.length) return open;
    return qa(Q.regionAny).filter(function (c) {
      return !c.classList.contains('locked') && c.getAttribute('aria-disabled') !== 'true';
    });
  }
  function rowSig() {
    return qa(Q.row).map(function (e) { return e.getAttribute('data-ch'); }).join(',');
  }
  async function showRegion(card) {
    if (!card) return false;
    var before = rowSig();
    try { card.click(); } catch (e) { return false; }
    await sleep(350);
    return rowSig() !== before || !!q(Q.row);
  }
  async function findRow(ch) {
    if (q(rowSel(ch))) return true;
    var cards = regionCards();
    for (var i = 0; i < cards.length; i++) {
      await showRegion(cards[i]);
      if (q(rowSel(ch))) return true;
    }
    return !!q(rowSel(ch));
  }
  /* 线上 boot.js 速度按钮是 data-speed="1"/"2"/"4"（界面 ×1/×2/×3） */
  var SPEED_VALUE = { 1: 1, 2: 2, 3: 4, 4: 4 };
  function setSpeed(n) {
    var v = SPEED_VALUE[Number(n) || 3] || 4;
    var btn = q(Q.speed + ' button[data-speed="' + v + '"]');
    if (!btn) btn = q(Q.speed + ' button[data-speed="4"]');
    if (btn) { try { btn.click(); } catch (e) { /* ignore */ } }
    return v;
  }
  function autoClosePops() {
    if (!D.cfg.autoPop) return;
    var boxes = qa('.modal, .mvd-root, [class*="modal"]');
    boxes.forEach(function (box) {
      var acts = qa('.modal-actions button, .btn', box).filter(function (b) {
        return b.offsetParent !== null;
      });
      if (acts.length === 1 &&
          /^(明白了！|明白了|OK|确定|好|Compris !|Compris|OK !|Continuer|Suivant|Valider)$/i.test(txt(acts[0]))) {
        try { acts[0].click(); } catch (e) { /* ignore */ }
      }
    });
  }

  /* 出发：闪光战斗结束 → 打开地图 → 找到目标章节 → 出发按钮没被禁用才点。
   * 存档说已解锁但页面 disabled 时一律不点，符合「未解锁区域不捉」。 */
  async function travelTo(card) {
    if (!await guardWait('dex')) return false;      // 闪光战斗结束再切走
    if (card.ch < 0) return false;
    /* 第七批：游戏只在「换章节」时重建 adv.nodes。已经在目标章时，
     * 先用神兽追踪同款的「绕中立章 → 重进」重抽一轮刷新点，
     * 否则点同一个出发按钮不会重刷，白白浪费时间。 */
    if (D.cfg.reroll && MAP && MAP.chapterNow(readSave()) === card.ch) {
      /* 第八十二批：这里也是一次「切出再切回」，算进面板的轮次里 */
      var okHop = await MAP.reenter(card.ch, function () { return goToCard(card); },
        rerollOpts(card));
      if (okHop && D.stats) D.stats.rerolls++;
      return okHop;
    }
    return await goToCard(card);
  }

  async function goToCard(card) {
    if (card.ch < 0) return false;
    if (!await openMap()) return false;
    if (!await findRow(card.ch)) return false;
    closeDetail();
    await sleep(220);
    var row = q(rowSel(card.ch));
    if (row) { try { row.click(); } catch (e) { /* ignore */ } }
    await sleep(250);
    var go = q(Q.detail + ' ' + Q.go + '[data-go="' + card.ch + '"]:not([disabled])') ||
      q(Q.go + '[data-go="' + card.ch + '"]:not([disabled])');
    /* 兜底时只认 data-go 正好等于目标章节的按钮，绝不误点别的章节 */
    if (!go) {
      var candidates = qa(Q.detail + ' ' + Q.go + ':not([disabled])');
      for (var gi = 0; gi < candidates.length; gi++) {
        if (String(candidates[gi].getAttribute('data-go') || '') === String(card.ch)) {
          go = candidates[gi];
          break;
        }
      }
    }
    if (!go || go.disabled || go.getAttribute('aria-disabled') === 'true') return false;
    var goCh = go.getAttribute('data-go');
    if (goCh && String(goCh) !== String(card.ch)) return false;
    try { go.click(); } catch (e) { return false; }
    await sleep(800);
    closeDetail();
    backToAdventure();
    return true;
  }

  /* ---------------- 主循环 ---------------- */
  /* 第十九批：弹窗「可直接捕捉」计数为 0 时，剩下的都要等天气 / 进化 /
   * 孵蛋 / 开图（或干脆已补齐），继续跑只是空转，直接收工并在弹窗留原因。 */
  /* 第八十七批：一只都刷不了时的那句话 —— 谁、缺什么、下一次窗口大概什么时候，
   * 玩家照着这句话就能知道「到点再点开始」。 */
  function rotomWaitText(parked) {
    var parts = [], next = 0, dawn = '';
    (parked || []).forEach(function (f) {
      var cd = rotomCond(f);
      var need = (cd.need || []).join(' / ') || '条件';
      var miss = (cd.miss || []).join(' / ') || need;
      parts.push(f.zh + '（要 ' + need + '，现在缺 ' + miss + '）');
      if (cd.nextAt && (!next || cd.nextAt < next)) next = cd.nextAt;
      /* 第八十八批：只在白天出现的（切割洛托姆）—— 夜里天赋概率是 0，直接写几点天亮 */
      if (cd.dayBreak && !dawn) dawn = cd.dayBreak;
    });
    return '洛托姆 ' + (parts.join('、') || '形态') +
      ' 的条件现在不满足，没有可抓取的了，图鉴捕捉先关掉' +
      (next ? '；' + clockText(next) + ' 前后天气就轮到它了，到点再点开始'
        : (dawn ? '；' + dawn + ' 天亮之后它才会出现，到点再点开始'
          : '；条件回来了再点开始'));
  }

  /* 第八十八批：洛托姆形态的「特别的相遇」是每进一次图掷一次骰子（4%），
   * 所以「切了 100 多次还没出」在概率上完全可能（0.96^100 ≈ 1.7%）。
   * 每 25 轮在日志里报一次进度，玩家一眼就能分清「运气」和「插件坏了」。
   * 天亮之前天赋概率是 0，这时候不要写「该出了」，得写「等天亮」。 */
  function rotomOddsNote(card) {
    var f = rotomFormOfCard(card);
    if (!f) return;
    var n = num(D.stats && D.stats.rerolls, 0);
    if (!n || n % 25) return;
    var cd = rotomCond(f);
    if (cd.dayBreak) {
      note('warn', f.zh + '：已经切出切回 ' + n + ' 次，现在不是白天（' +
        cd.dayBreak + ' 天亮才有），继续重抽也刷不出来 —— 到点再点开始');
      return;
    }
    var p = rotomChance(f);
    if (!(p > 0)) return;
    var hit = Math.min(99, Math.round((1 - Math.pow(1 - p, n)) * 100));
    note('info', f.zh + '：已经切出切回 ' + n + ' 次（这一格每次进图 ' + pctText(p) +
      ' 概率刷出来），按概率算现在有 ' + hit + '% 该出了 —— 还没出就是运气，继续跑');
  }

  /* 第一百一十五批：还有「条件没生效、暂时抓不了」的目标吗？
   * 洛托姆模式看跳过名单（天气 / 时段不满足被 park 的形态），
   * 其它模式看清单里 status=weather / time 的卡。用来区分：
   *   · 真的没目标了（该自动关闭）  vs  · 只是这一刻抓不了（等待选项可继续等）。 */
  function waitPending() {
    if (D.cfg.mode === 'rotom') {
      var parked = rotomParkLeft();
      if (parked.length) return parked.map(function (f) { return f.zh; });
    }
    return D.cards.filter(function (c) {
      return c.status === 'weather' || c.status === 'time';
    }).map(function (c) { return c.name; });
  }

  function autoStopIfNoReady() {
    /* 第一百二十批：洛托姆模式勾选「等待条件」时永不自动关闭 ——
     * 条件不满足的踢去末尾，所有可捕捉捉完也不切图、原地等待。 */
    if (D.cfg.mode === 'rotom' && D.cfg.waitCond) return false;
    /* 第一百一十五批：其它模式勾选「等待」且还有条件未生效 → 不关闭、不切图，
     * 交给主循环原地等条件生效（见 runLoop 的 wait 分支）。 */
    if (D.cfg.waitCond && waitPending().length) return false;
    /* 第八十七批：洛托姆模式先走自己的口径 ——
     *   · 还有能刷的形态 → 继续；
     *   · 一只都刷不了、但有「条件不满足被跳过」的 → 直接关掉功能
     *     （玩家口径：没有可抓取的了就关掉，别在错的天气里空转）；
     *   · 一只都刷不了、也没有被跳过的 → 勾的全都到手了，照旧收工。 */
    if (D.cfg.mode === 'rotom') {
      /* 第一百一十五批：只数「现在真能抓」的卡。以前数的是 status !== 'done'，
       * 于是清单里剩下几只「等待天气」也会被当成还有目标，功能一直空转不关。 */
      var readyLeft = D.cards.filter(function (c) {
        return c.status === 'ready' || c.status === 'ready-cond';
      });
      if (readyLeft.length) return false;
      var parked = rotomParkLeft();
      if (parked.length) {
        var why = rotomWaitText(parked);
        note('ok', why);
        stop(why);
        return true;
      }
      if (!D.cfg.autoStopNoReady) return false;
      /* 清单里只剩「等待天气 / 时段」的卡（跳过名单还没来得及写）时，
       * 同样按「无可抓自动关闭」收工，别报成「都到手了」误导玩家。 */
      var stillWaiting = D.cards.some(function (c) {
        return c.status === 'weather' || c.status === 'time';
      });
      if (stillWaiting && !D.cards.some(function (c) { return c.status === 'done'; })) {
        stop('当前没有满足天气 / 时段条件、可捕捉的洛托姆，图鉴捕捉已自动关闭');
        return true;
      }
      var got = D.cards.map(function (c) { return c.name; }).join('、');
      stop('洛托姆都到手了' + (got ? '（' + got + '）' : '') + '，图鉴捕捉已自动关闭');
      return true;
    }
    /* 第九十二批：指定捕捉那只只能靠进化的、幼体已经在图鉴里 → 别报「可直接捕捉为 0，
     * 已自动关闭」，直接说清「练到几级就进化」。 */
    if (D.cfg.mode === 'target' && D.found && D.found.evoHunt && D.found.evoHunt.length) {
      var eh0 = D.found.evoHunt[0];
      var how0 = eh0.pathText || (eh0.item ? eh0.itemZh : ('Lv.' + (eh0.level || '?')));
      note('ok', '「' + eh0.name + '」没有野外出现点，只能靠进化：幼体 ' + eh0.baseName +
        (eh0.owned ? ' 已经在图鉴里' : ' 已经到手') +
        '，' + how0 + '（图鉴捕捉先停下）');
      stop('「' + eh0.name + '」只能靠进化：' + how0);
      return true;
    }
    if (!D.cfg.autoStopNoReady || D.totals.ready > 0) return false;
    /* 第二十九批：指定宝可梦「刷到出闪」期间，可能整段时间都在等天气窗口，
     * 这时 ready 是 0，但目标还在清单里，不能当成「没得抓了」收工。 */
    if (shinyFarmMode(wantIds()[0])) return false;
    /* 第三十九批：剩下的只是「受天气 / 时段限制」时，别只写一句「可直接捕捉为 0」——
     * 把是谁、缺什么条件写清楚（例：月石（夜晚）），玩家才知道要等什么。 */
    var waiting = D.cards.filter(function (c) {
      return c.status === 'weather' || c.status === 'time';
    });
    if (waiting.length) {
      var eg = waiting.slice(0, 3).map(function (c) {
        return c.name + ((c.conds && c.conds.length) ? '（' + c.conds.join(' / ') + '）' : '');
      }).join('、');
      stop('可直接捕捉的为 0：' + eg +
        (waiting.length > 3 ? ' 等 ' + waiting.length + ' 只' : '') +
        ' 要等条件，窗口开了再点开始就能直接追');
      return true;
    }
    stop('可直接捕捉的宝可梦为 0，已自动关闭图鉴捕捉');
    return true;
  }

  async function runLoop() {
    try { scan(); }
    catch (e) {
      note('error', '清单计算失败：' + ((e && e.message) || e));
      return stop('清单计算失败，已停止');
    }

    while (D.running) {
      if (autoStopIfNoReady()) return;
      if (hostBusy()) {
        setPhase('让路：' + (hostCall('who') || '其它自动化') + '在切页');
        await sleep(5000);
        continue;
      }
      /* 第八十七批：刷洛托姆时，天气 / 时段一变就重算「跳过名单」——
       * 不满足条件的这一项跳过（单只也跳），满足的恢复，绝不为了它一直往那一章切。 */
      if (D.cfg.mode === 'rotom') {
        try {
          var dropped = rotomDropStale(context());
          var backNow = rotomRearm(context());
          if (dropped || backNow) scan();
        } catch (e) { /* 读不到天气就按原样继续 */ }
      }
      var ranked = rankCards(D.cards, D.cfg).filter(function (c) {
        if (D.doneCh.indexOf(c.id) >= 0 || D.skipped.indexOf(c.id) >= 0) return false;
        if (D.condHold && D.condHold.id === c.id && Date.now() < D.condHold.until) return false;
        /* 第一百一十五批：条件没生效（等待天气 / 时段）的目标一律不前往 ——
         * 玩家要求「不可捕捉时不切图」。以前 scoreCard 给等待目标 5000 分，
         * 主循环会 travelTo 过去在错的天气里空转。等待选项打开时由下面的
         * wait 分支原地等，不切图、不关闭；没开等待选项则按「无可抓自动关闭」。 */
        if (c.status === 'weather' || c.status === 'time') return false;
        /* 第九十三批：洛托姆形态「这一刻条件不满足」的直接不进候选 ——
         * 不靠 scan() 什么时候被触发，也不靠跳过名单什么时候写进去。
         * 判定用的还是游戏自己算的实时天气（小桥），读不到就不拦（照旧原口径）。 */
        if (D.cfg.mode === 'rotom') {
          var rfLive = rotomFormOfCard(c);
          if (rfLive) {
            try {
              var cdLive = rotomCond(rfLive);
              if (cdLive && cdLive.ok === false && !cdLive.unknown) return false;
            } catch (eL) { /* 读不到条件就照旧当候选 */ }
          }
        }
        return true;
      });
      var card = ranked[0];
      /* 手上有活干就不算「在等条件」—— 等条件的计时只统计彻底没事可做的那段 */
      if (card) D.parkSince = 0;
      if (!card) {
        /* 第一百一十五批：等待选项 —— 勾选后，条件没生效时原地等，不切图、不关闭。
         * sleep 后主动 scan() 再 continue：循环顶部会重新 autoStopIfNoReady()（等待
         * 开启时不关）与 rankCards()，天气 / 时段一变、条件生效就自动接着捕捉。
         * 不点 travelTo、不 backToAdventure，所以整个过程完全不切图。 */
        /* 第一百二十批：洛托姆勾选等待条件时，即使全部可捕捉都捉完了
         * （waitPending 为空），也是「不切图原地等待」，绝不自动关闭。 */
        if (D.cfg.waitCond && (waitPending().length || D.cfg.mode === 'rotom')) {
          var wp = waitPending();
          setPhase('等待条件生效 · ' + wp.slice(0, 2).join('、') +
            (wp.length > 2 ? ' 等 ' + wp.length + ' 只' : '') +
            '（不切图，条件回来接着刷）');
          await sleep(2000);
          try { scan(); } catch (eW) { /* 下一圈还会再算 */ }
          continue;
        }
        var waiting = D.cards.some(function (c) {
          return c.status === 'weather' || c.status === 'time';
        });
        /* 第三十八批：还剩的都要等天气 / 时段时，别报成「清单已补齐」——
         * 那些只是被 20 分钟冷却挂起的，过一会儿窗口开了还能接着刷。 */
        var onlyHeld = D.cards.some(function (c) {
          return D.condHold && D.condHold.id === c.id && Date.now() < D.condHold.until;
        });
        if (D.cfg.mode === 'rotom') {
          /* 第八十七批：勾的形态全被「条件不满足」跳过 → 按玩家口径**直接关掉功能**
           * （不再原地干等到 waitMaxMin 分钟）。日志里写清是谁、缺什么、
           * 下一次窗口大概什么时候，到点再点开始就行。 */
          var parked = rotomParkLeft();
          if (parked.length) {
            var ptext = rotomWaitText(parked);
            note('ok', ptext);
            return stop(ptext);
          }
          var gotAll = D.cards.filter(function (c) { return c.status === 'done'; })
            .map(function (c) { return c.name; }).join('、');
          var rtext = gotAll
            ? ('洛托姆都到手了（' + gotAll + '），收工')
            : '勾选的洛托姆形态都跑过一轮，没新目标了';
          note('ok', rtext);
          return stop(rtext);
        }
        /* 第九十二批：指定捕捉那只「只能靠进化」的，幼体到手后别再报「需要进化」，
         * 直接告诉玩家练到几级就进化（这才是这只的全部操作）。 */
        var evoNote = '';
        if (D.cfg.mode === 'target' && D.found && D.found.evoHunt && D.found.evoHunt.length) {
          var eh = D.found.evoHunt[0];
          evoNote = '「' + eh.name + '」没有野外出现点，只能靠进化：幼体 ' + eh.baseName +
            (eh.owned ? ' 已经在图鉴里' : ' 已经到手') +
            '，' + (eh.pathText || (eh.item ? eh.itemZh : ('Lv.' + (eh.level || '?')))) +
            '（图鉴捕捉先停下）';
        }
        var text = evoNote ? evoNote : (waiting
          ? (D.cfg.waitWeather || onlyHeld
            ? '剩下的目标都要等天气 / 时段轮换，先停下；窗口开了再点开始'
            : '其余目标都要等天气 / 时段轮换，已停下')
          : (D.cfg.mode === 'target' && D.cfg.untilShiny !== false
            ? '「' + D.cfg.target + '」的闪光已经到手，指定捕捉收工'
            : (D.totals.locked || D.totals.evo || D.totals.special
              ? '能直接捕捉的都补齐了；剩下的需要进化 / 开图 / 特殊获取'
              : '「未捕捉」清单已经全部补齐')));
        note('ok', text);
        return stop(text);
      }

      D.cur = {
        id: card.id, name: card.name, ch: card.ch, step: card.step,
        label: card.spot, pct: card.pct, score: card.score,
        status: card.status, conds: card.conds.slice(0, 3),
        huntFor: card.huntFor || null
      };
      /* 第二十九批：指定宝可梦模式一直刷同一种，直到抓到闪光。
       * 第九十二批：替进化型刷幼体时只抓一只（刷幼体的闪光变不出进化型）。 */
      var farming = shinyFarmMode(card.id) && !card.huntFor;
      D.curSince = Date.now();
      saveRun();
      setPhase('前往 ' + card.name + ' · ' + (spotPath(card.ch, card.step) || card.spot || ('章节#' + card.ch)));
      note('info', card.rotom
        ? ('前往 ' + card.name + '（' + card.spot +
          '，只在这个地段的「特别的相遇」格刷；这一趟没刷出来才切走重进；' +
          '只要游戏弹出「有特别的相遇」就一定要把那场打完、抓到再走）')
        : ('前往 ' + card.name + ' #' + card.id + '（' + card.spot +
          '，出没 ' + chanceLabel(card.pct) + '）' +
          (card.status === 'ready-cond' ? ' · 天气/时段窗口已生效，优先' : '')));

      var ok = await withScreen(function () { return travelTo(card); });
      if (!ok) {
        note('warn', card.name + ' 的目的地无法前往（多半未解锁），跳过');
        D.skipped.push(card.id);
        continue;
      }
      D.stats.travels++;
      setSpeed(D.cfg.speed);
      setPhase('捕捉中：' + card.name);

      /* 第七十六批：这里原来有三套挂钟计时（lastChange / dwellSince / lastRerollAt），
       * 分别喂「无新捕获 N 分钟重开一轮」「单只超时换下一只」「同一章待太久，重开
       * 一轮保证效率」三条判定。它们跟用户要删的那条是同一路货：只看时钟不看进度，
       * 于是——
       *   · 道具格 / 目标草丛排在整章靠后的位置（美丽鳞片在冰之间第 29.4 个点那种），
       *     还没走到就被判「待太久」切走，重进又把时间线归零，永远走不到那一格；
       *   · 路上撞进草丛打一场、战斗动画偏长，时间线这几秒不动，同样被抓去重开。
       * 现在三套计时连同那三条判定全部删掉，只认事件（一轮跑完 / 走过目标刷新点 /
       * 草丛打完 / 目标到手 / 章节变了），绝不因为「待久了」主动重开一轮。 */
      /* 第三十六批：把「目标地段」也交给 MAP，判断「没刷出目标」时才能分清
       * 「这一轮真没有」和「目标在后面的地段、还没走过去」。
       * 第四十三批：地段还要带上**内部 id**（DATA.stepAreas）。中文地段名跟
       * 时间线里的 rse:mt-pyre-summit 这类 id 既不同名也没编号，
       * 只靠名字比对会一直误判成「这一轮的地段里没有目标」，永远走不到目标地段
       * （风铃铃 #358 就卡死在这儿）。 */
      var spotName = (DATA && typeof DATA.stepName === 'function')
        ? (DATA.stepName(card.ch, card.step) || '') : '';
      var spotAreas = (DATA && typeof DATA.stepAreas === 'function')
        ? DATA.stepAreas(card.ch, card.step) : [];
      /* 第四十六批：本章其它也能遇到它的地段一起交给 MAP，
       * 整章最后一处草丛打完才准切走重进（别刷完天冠山就切，积雪的天冠山还没刷）。 */
      var spotZones = sameChapterSpots(card.id, card.ch, card.step);
      if (spotZones.length) {
        note('info', '同一章还有 ' + spotZones.length + ' 处地段能遇到 ' + card.name +
          '（' + spotZones.map(function (z) { return z.area || ('节点 ' + z.step); }).join('、') +
          '），会一起刷完再重开');
      }
      /* 第六十九批：洛托姆格是静态节点，MAP 的 id 比对认不出来，用专用标记 */
      var rerollMark = card.rotom ? rotomMark(card)
        : (MAP ? MAP.markFor(card.ch, card.id, spotName, card.step, spotAreas, spotZones) : null);

      var done = false;
      var checks = 0;
      /* 第三十八批：等条件的计时（跟「多久没新捕获」分开算） */
      var waitSince = 0;
      var waitNoteAt = 0;
      // 约 5 分钟重算一次清单：天气 / 时段窗口一开就要抢
      var rescanEvery = Math.max(2, Math.round(300 / D.cfg.intervalSec));

      while (D.running) {
        /* 第八十批：心跳仍然 intervalSec（默认 20 秒）一次 —— 回读存档、重算清单、
         * 看图鉴都值得这么慢。但「这一趟时间线里到底有没有相遇格」是**进图 1 秒内
         * 就能读出来**的事：时间线在进章那一刻就整体渲染好了，39 个点全在 DOM 里，
         * 跟走到第几格没有任何关系。
         * 原来它跟着 20 秒心跳走 —— 一进图先白打 5~8 个格子才轮到第一次判定，
         * 路上再撞两场野怪、等「正在战斗」的 90 秒上限，正好十多个格子。玩家说的
         * 「明明没刷相遇格，为什么要走十多个格子才切图重刷」就是这么来的。
         * 现在洛托姆模式把这段等待切成 1 秒一片：每片只读一次存档 + 扫一次时间线
         * （纯读，不点页面），一旦判定「该切图」立刻醒来，最多 1~2 秒就动身。 */
        var earlyWhy = '';
        var condGone = null;
        if (card.rotom && D.cfg.reroll && MAP && rerollMark) {
          var sleptMs = 0, budgetMs = D.cfg.intervalSec * 1000;
          while (D.running && sleptMs < budgetMs) {
            await sleep(1000); sleptMs += 1000;
            if (!D.running) break;
            /* 第八十七批：每秒顺手看一眼这一只的条件。整点换天 / 天黑天亮时
             * **立刻**判出来（不等 20 秒心跳）—— 不在这张已经刷不出来的图里跑穿。 */
            try {
              var rfCard = rotomFormOfCard(card);
              var cdCard = rfCard ? rotomCond(rfCard) : null;
              if (cdCard && cdCard.ok === false && !cdCard.unknown) {
                condGone = cdCard;
                break;
              }
            } catch (e0) { /* 读不到条件就按原样继续扫时间线 */ }
            try {
              var svNow = readSave();
              var wNow = rotomMissed(svNow, card, rerollMark);
              if (!wNow) {
                if (rerollMark.walkWhy) {
                  setPhase(D.cur.name + '：' + rerollMark.walkWhy);
                } else if (!document.getElementById('timeline') &&
                           Date.now() - num(rerollMark.enteredAt, 0) > 3000) {
                  /* 时间线压根不在页面上（还停在章节页 / 地图页）—— 先回冒险页，
                   * 否则一片一片地空等，等于又白等十几格。 */
                  backToAdventure();
                }
              } else {
                /* 第八十二批：判出该切就走，**不等这场战斗打完** —— 战斗动画
                 * 十几秒，够切出+切回重抽一整趟了。只在标记里记一笔「是战斗中
                 * 切出去的」，日志里写清楚。 */
                if (battleLive(svNow)) rerollMark.battleNow = 1;
                earlyWhy = wNow;
                break;
              }
            } catch (e) { /* 读不到就等下一片 */ }
          }
        } else if (card.rotom) {
          /* 第九十三批：没开「切图重进」（或者 MAP 没就绪）时也要**每秒**看一眼条件 ——
           * 以前这段判定整块长在上面那个 `if (reroll && MAP && rerollMark)` 里，
           * 关了重抽就只剩 20 秒心跳才轮到一次，天气一变那 20 秒全在错的图里空转。
           * 这里只读条件，不动页面、不切图，纯判定。 */
          var sleptR = 0, budgetR = D.cfg.intervalSec * 1000;
          while (D.running && sleptR < budgetR) {
            await sleep(1000); sleptR += 1000;
            if (!D.running) break;
            try {
              var rfCard2 = rotomFormOfCard(card);
              var cdCard2 = rfCard2 ? rotomCond(rfCard2) : null;
              if (cdCard2 && cdCard2.ok === false && !cdCard2.unknown) {
                condGone = cdCard2;
                break;
              }
            } catch (e1) { /* 读不到条件就按原样继续刷 */ }
          }
        } else {
          await sleep(D.cfg.intervalSec * 1000);
        }
        if (!D.running) break;
        /* 第八十七批：这一只的条件刚刚不满足了 → 记进「跳过名单」、清单重算，
         * 换下一只（或按「没有可抓取的了」收工），绝不留在错的天气里继续刷。
         * 第九十三批：drop 完**必须立刻 scan()** —— 只改名单不重算清单的话，
         * 外层还是拿旧 `D.cards` 选目标，一转头又把同一只捞回来，
         * 表现就是「一直在天气不符合的地图重刷」。 */
        if (condGone) {
          var goneWhy = (condGone.miss || []).join(' / ') || (condGone.need || []).join(' / ') || '条件';
          setPhase(D.cur.name + '：条件不满足了（' + goneWhy + '），先跳过');
          note('info', D.cur.name + ' 的「' + goneWhy + '」现在不满足了，先跳过这一只；' +
            '条件一回来会自动接着刷');
          try { rotomDropStale(context()); } catch (e2) { /* ignore */ }
          try { scan(); } catch (e3) { /* 重算失败就按旧清单继续，下一圈还会再试 */ }
          D.cur = null;
          done = true;
          break;
        }
        autoClosePops();
        if (hostBusy()) { setPhase('让路：' + (hostCall('who') || '其它自动化') + '在切页'); continue; }
        checks++;

        var ctx = context();
        try { refreshCounters(); } catch (e) { /* ignore */ }
        /* 第一百零七批：目标开局就在图鉴里（已抓过 / 闪光图鉴已解锁）时，
         * 「dex[id] 出现」不能再当作「刚抓到」，否则点开始第一拍就收工。
         * 这类目标改看本轮的捕捉增量；刷闪完成条件见 shinyCaughtThisRun()。 */
        var already = !!(D.dexAtStart && D.dexAtStart[D.cur.id]);
        var gotThisRun = already
          ? (num(D.stats.catches, 0) > 0)
          : !!ctx.dex[D.cur.id];
        if (gotThisRun) {
          /* 第一百零七批：完成条件改成「本轮新抓到的闪光实例」。
           * 历史 seenShiny / dex[id].shiny 只是图鉴点亮，不算这一轮的成果。 */
          if (farming && shinyCaughtThisRun(D.cur.id, ctx)) {
            if (!D.caughtOnce[D.cur.id]) { D.caughtOnce[D.cur.id] = 1; D.stats.caught++; }
            var winName = D.cur.name, winId = D.cur.id;
            note('ok', '✨ 本轮抓到 ' + winName + ' #' + winId + ' 的闪光，指定捕捉完成');
            D.cur = null;
            return stop('已抓到 ' + winName + ' #' + winId + ' 的闪光，图鉴捕捉已自动关闭');
          }
          var firstCatch = !D.caughtOnce[D.cur.id];
          if (firstCatch) {
            D.caughtOnce[D.cur.id] = 1;
            D.stats.caught++;
            note('ok', '🎉 ' + D.cur.name + ' #' + D.cur.id + ' 已经进图鉴');
          }
          if (!farming) { done = true; break; }
          /* 刷闪模式：第一次进图鉴只是记一笔，之后照旧留在本章刷；
           * 后面几轮还要走「重进 / 等刷新 / 超时重开」，所以不能 continue。 */
          if (firstCatch) {
            setPhase('捕捉中：' + D.cur.name + ' · 已到手 ' + (D.stats.catches || 0) + ' 只，等闪光');
            backToAdventure();
            continue;
          }
        }

        /* 第七批①：用关卡里最新的天气 / 时段重算当前目标。
         * 天气窗口关了、地图锁了、条件不再满足 → 立刻换下一只，
         * 不留在这一章干等（给这只 90 秒冷却，避免来回抖动）。 */
        var fresh = null;
        try { fresh = cardOf(D.cur.id, ctx, D.cfg); } catch (e) { fresh = null; }
        /* 第六十九批：洛托姆的目标是固定的（形态只有这一章这一格），
         * 条件不符也不能「换下一只」——那只会永远在 5 个形态之间来回跳 */
        if (D.cfg.condExit && fresh && !card.rotom) {
          var wasReady = card.status === 'ready' || card.status === 'ready-cond';
          var stillReady = fresh.status === 'ready' || fresh.status === 'ready-cond';
          var stillActionable = scoreCard(fresh, D.cfg) > 0;
          if ((wasReady && !stillReady) || !stillActionable) {
            D.condHold = { id: D.cur.id, until: Date.now() + 90000 };
            D.stats.condSwitches++;
            note('info', D.cur.name + ' 的限制条件已不满足（' + fresh.statusLabel +
              '），自动开始追踪下一只');
            done = true;
            break;
          }
        }

        /* 第三十八批：天气 / 时段窗口还没开的时候**绝不能重抽**。
         * 这类目标（比如要求下雨的巨翅飞鱼）在条件不开时压根不会进刷新池，
         * 切走重进只是白绕一圈，状态行还一路写「切走重进重抽」，
         * 看着就像卡死在原地打转。改成留在章节里等窗口轮换，
         * 窗口一开（下一跳 fresh 就变成 ready-cond）立刻恢复追刷新点。 */
        var waitingNow = fresh
          ? (fresh.status === 'weather' || fresh.status === 'time')
          : (card.status === 'weather' || card.status === 'time');
        /* 第六十九批：洛托姆不等窗口 —— 它那一格刷不刷得出来由地图重抽决定，
         * 留在章节里干等什么都不发生，照旧扫时间线、没有就切走重进。 */
        if (card.rotom) waitingNow = false;

        /* 第七批②：错过刷新点 / 一轮跑完 → 神兽追踪同款切图重进。
         * adv.nodes 是游戏为当前章生成的一轮时间线，只有换章节才重建，
         * 所以先绕去本地区一个中立章，再回目标章，等于立刻重抽一轮。
         * 第七十六批：这里只剩「事件」类理由（一轮跑完 / 走过目标刷新点 /
         * 草丛打完 / 这一轮压根没有目标地段）—— 「同一章待太久，重开一轮保证
         * 效率」那条挂钟判定已整条删掉，不再因为待久了主动把一轮掐断。 */
        if (D.cfg.reroll && MAP && rerollMark && !waitingNow && !shinyBlocked() &&
            !(rerollMark.retryAfter && Date.now() < rerollMark.retryAfter)) {
          /* 第八十批：切片里已经判过的结论直接用（earlyWhy）—— 那就是「进图 1 秒
           * 后就该动身」的那一份，不必等到 20 秒心跳再重算一遍。 */
          var why = earlyWhy || (card.rotom
            ? rotomMissed(readSave(), card, rerollMark)
            : MAP.missed(readSave(), D.cur.id, rerollMark));
          /* 第三十六批：这一轮还没走到目标地段（比如目标在 40-41 号道路，
           * 现在还在 38 号道路）——不切走，只在状态行写清楚，让它继续往里走。 */
          if (!why && rerollMark && rerollMark.walkWhy) {
            setPhase(D.cur.name + '：' + rerollMark.walkWhy);
          }

          /* 第八十二批：**战斗中不再等这一场打完**（原来硬理由 8 秒 / 软理由 90 秒）。
           * 玩家实测一场战斗动画十几秒，等的这段时间够切出+切回重抽一整趟 ——
           * 这一趟本来就已经没戏了，等它只是白等。现在直接切出再切回；
           * 真打不动（闪光战被守门拦住时 reenter 会回 false）照下面 5 秒重试。 */
          var battleNowCut = false;
          if (card.rotom && why) {
            battleNowCut = battleLive(readSave()) || !!rerollMark.battleNow;
            rerollMark.battleNow = 0;
          }
          if (why) {
            setPhase(D.cur.name + '：' + why);
            note('info', D.cur.name + '：' + why +
              (card.rotom
                ? ('（先切出到' + rotomHopName() + '，再重进这一章' +
                  (battleNowCut ? '；战斗中直接切出、不等这场打完' : '') + '）')
                : '（绕中立章再重进）'));
            var rerolled = await withScreen(function () {
              return MAP.reenter(card.ch, function () { return goToCard(card); },
                rerollOpts(card));
            });
            if (rerolled) {
              D.stats.travels++;
              D.stats.rerolls++;
              rerollMark = card.rotom ? rotomMark(card)
                : MAP.markFor(card.ch, card.id, spotName, card.step, spotAreas, spotZones);
              /* 第八十八批：洛托姆这格是 4% 概率刷出来的 —— 每 25 轮说一句进度，
               * 让玩家看得出「是在运气上，不是在打转」（100 轮不出只是 1/60 的运气）。 */
              if (card.rotom) {
                try { rotomOddsNote(card); } catch (e0) { /* 提示出错不影响捕捉 */ }
              }
            } else if (!(rerollMark.retryAfter && Date.now() < rerollMark.retryAfter)) {
              /* 第三十七批：切图没成功（地图点不开 / 闪光战被拦住）时别每个心跳
               * 都去点一次。第八十二批：刷洛托姆时战斗正在打，重试间隔缩到 5 秒 ——
               * 战斗一结束就能立刻切出去，不用再等 15 秒。 */
              var retryMs = card.rotom ? 5000 : 15000;
              rerollMark.retryAfter = Date.now() + retryMs;
              note('warn', D.cur.name + '：切走重进没成功，' +
                Math.round(retryMs / 1000) + ' 秒后再试');
            }
            backToAdventure();
            continue;
          }
        }

        if (checks % rescanEvery === 0) {
          try {
            var before = D.cur.score || 0;
            scan();                       // 定期重扫：天气 / 解锁 / 图鉴变了都要重排
            var better = rankCards(D.cards, D.cfg).filter(function (c) {
              if (c.id === D.cur.id || D.doneCh.indexOf(c.id) >= 0 ||
                  D.skipped.indexOf(c.id) >= 0) return false;
              if (D.condHold && D.condHold.id === c.id && Date.now() < D.condHold.until) return false;
              return true;
            })[0];
            if (better && better.score >= before + 50000) {
              note('ok', '别的宝可梦开了天气 / 时段窗口，优先换过去');
              done = true;
              break;
            }
          } catch (e) { note('warn', '定期重扫失败：' + ((e && e.message) || e)); }
          if (autoStopIfNoReady()) return;
        }

        var waiting = waitingNow;
        if (waiting) {
          /* 第三十八批：等条件的时候单独记「已经等了多久」，状态行要能看出是在等。
           * 第七十六批：dwellSince 那套「等太久就重开一轮」的计时已删，这里只留展示。 */
          if (!waitSince) waitSince = Date.now();
          var waitMin = (Date.now() - waitSince) / 60000;
          setPhase('等待条件（' + (card.conds.slice(0, 2).join('、') || '天气 / 时段轮换') +
            ' · 目标关天气 ' + chapterCondView(card.ch, ctx, card.step).weatherLabel + '）' +
            (waitMin >= 1 ? ' · 已等 ' + Math.round(waitMin) + ' 分钟' : ''));
          if (waitMin > num(D.cfg.waitMaxMin, 20)) {
            if (farming) {
              /* 指定捕捉只有一个目标：不能跳过，只能继续等；每 10 分钟说一句 */
              if (Date.now() - waitNoteAt > 600000) {
                waitNoteAt = Date.now();
                note('warn', D.cur.name + ' 的条件还没开到（已等 ' + Math.round(waitMin) +
                  ' 分钟），继续守在章节里等窗口，不切图空转');
              }
              waitSince = Date.now();
            } else {
              note('info', D.cur.name + ' 的条件 ' + Math.round(waitMin) +
                ' 分钟没开，先跳过它去追别的；30 分钟内不再排它');
              D.condHold = { id: D.cur.id, until: Date.now() + 1800000 };
              done = true;
              break;
            }
          }
        } else if (rerollMark && rerollMark.zoneWhy) {
          waitSince = 0;
          setPhase('捕捉中：' + D.cur.name + ' · 等地段草丛打完再切章');
        } else {
          waitSince = 0;
          setPhase('捕捉中：' + D.cur.name);
        }

        /* 第七十六批：这里原来还有两条挂钟重开，一并删掉 ——
         *   ①「N 分钟没新捕获就重进一轮」（旧 stallMin）；
         *   ②「刷了 N 分钟就重进一轮接着等闪光 / 超时换下一只」（旧 timeoutMin）。
         * 两条都只按挂钟走：目标草丛排在章节靠后位置、路上打一场、战斗动画长一点，
         * 都会被判「待太久」而切走重进，时间线一归零就永远走不到那一格 ——
         * 这正是玩家反馈的「靠后道具格 / 草丛遭遇永远触发不了」。
         * 现在这一轮由事件决定什么时候结束：目标到手、草丛打完、一轮跑完才切。 */
        backToAdventure();
      }
      if (done) { D.cur = null; saveRun(); }
      if (!D.running) break;
      try { scan(); }
      catch (e) { note('warn', '重新计算清单失败：' + ((e && e.message) || e)); }
    }
  }

  /* ---------------- 对外 API ---------------- */
  async function start(opts) {
    if (D.running) return { ok: false, text: '已经在跑了，先点停止' };
    if (!DATA) return { ok: false, text: '离线图鉴数据表没加载，刷新一次游戏页' };
    if (!gameReady()) return { ok: false, text: '游戏还没加载完，进游戏后再点开始' };
    var o = opts || {};
    var patch = {};
    if (o.mode) patch.mode = o.mode;
    if (typeof o.target === 'string') patch.target = o.target;
    if (o.cfg) Object.assign(patch, o.cfg);
    if (Object.keys(patch).length) config(patch);
    /* 第八十七批：先扫一遍把「清单里要用到的章」登记上，问一次天气 / 时段，
     * 再往下挑目标 —— 这样「天气不对就别去」从第一趟就生效，不用等玩家切到那张图才发现。 */
    try { scan(); } catch (e) { /* 页面还没 ready，主循环会再算 */ }
    try { await wxPrime(1500); } catch (e) { /* ignore */ }
    if (D.cfg.mode === 'target' && !D.cfg.target) {
      return { ok: false, text: '先填要捕捉的宝可梦（中文名、图鉴号或游戏内显示名）' };
    }
    /* 第三十八批：名字没对上就别开跑（否则清单是空的，一秒就自己收工） */
    if (D.cfg.mode === 'target' && !wantIds().length) {
      return { ok: false, text: '「' + D.cfg.target + '」没对上任何图鉴，填中文名或图鉴号再试' };
    }
    /* 第六十九批：刷洛托姆模式至少勾一个形态，而且不能全都已经有了。
     * 第八十三批：实际要刷哪几只由 rotomEffPick() 定 —— 没拿到普通洛托姆时
     * 它只回「普通洛托姆」这一项，所以这里不用再单独拦。 */
    if (D.cfg.mode === 'rotom') {
      var ctxR = null;
      try { ctxR = context(); } catch (e) { ctxR = null; }
      if (ctxR) {
        try { rotomBaseSync(ctxR); } catch (e) { /* ignore */ }
        /* 第八十七批：先把「跳过名单」和现在的天气对一遍，条件回来了的放出来 */
        try { rotomRearm(ctxR); } catch (e2) { /* ignore */ }
        try { rotomDropStale(ctxR); } catch (e3) { /* ignore */ }
      }
      var picked = ctxR ? rotomEffPick(ctxR)
        : (Array.isArray(D.cfg.rotomPick) ? D.cfg.rotomPick : []);
      if (!picked.length) {
        var parkedNow = rotomParkLeft();
        if (parkedNow.length) {
          return { ok: false, text: rotomWaitText(parkedNow) };
        }
        return { ok: false, text: '一个可刷的洛托姆形态都没有：勾上要刷的形态（或等对的天气 / 时段）再点开始' };
      }
    }
    D.running = true;
    D.doneCh = [];
    D.skipped = [];
    D.cur = null;
    D.caughtOnce = {};
    /* 第六十四批：roadShiny = 这一轮遇到的野生闪光次数，
     * shinyCaught = 其中真抓到的次数。基线取「点开始这一刻」的
     * 守卫计数 / 存档闪光实例，之后只看增量，所以数字只增不减。 */
    var g0 = guardShinyStats(), s0 = readSave() || {};
    D.stats = { caught: 0, travels: 0, rescans: 0, rerolls: 0, condSwitches: 0,
      catches: 0, roadShiny: 0, shinyCaught: 0,
      catchBase: saveCaught(s0),
      shinySeenBase: g0.seen,
      shinyCaughtBase: g0.caught,
      seenShinyBase: seenShinyCount(s0),
      shinyKeys: shinyInstances(s0) };
    /* 第一百零七批：开局快照。
     * shinyBaseKeys 给「刷到出闪」当基线（只认这之后新出现的闪光实例）；
     * dexAtStart 标记哪些目标开局就在图鉴里（已抓过 / 闪光图鉴已解锁），
     * 这类目标不能拿 dex[id] 当「刚抓到」，否则一启动就收工。 */
    D.shinyBaseKeys = shinyInstances(s0);
    D.dexAtStart = {};
    D.shinyHave = {};
    if (D.cfg.mode === 'target') {
      var wantShiny = wantIds(D.cfg.target);
      var ctx0 = null;
      try { ctx0 = context(); } catch (e) { ctx0 = null; }
      wantShiny.forEach(function (id) {
        D.shinyHave[id] = ctx0 ? shinyOwned(id, ctx0) : false;   // 只作提示，不再决定行为
        D.dexAtStart[id] = !!(ctx0 && ctx0.dex && ctx0.dex[id]);
      });
    }
    D.condHold = null;
    /* 第八十七批：跳过名单（D.cfg.rotomSkip）不清 —— 它记的是「天气 / 时段不满足」，
     * 跟这一轮有没有跑过无关；条件回来了 scan() 里的 rotomRearm() 会自动放出来。 */
    D.parkSince = 0;
    D.note = '';
    saveRun();
    setPhase('启动中');
    note('ok', D.cfg.mode === 'target'
      ? ('开始捕捉指定宝可梦「' + D.cfg.target + '」' +
        (D.cfg.untilShiny !== false ? '（会一直刷到出闪光为止）' : ''))
      : (D.cfg.mode === 'rotom'
        ? ('开始刷洛托姆（已勾 ' + (D.cfg.rotomPick || []).length +
          ' 个形态）：进图找「特别的相遇」格，没有才切走重进；弹出「有特别的相遇」就打完捕到再走')
        : '开始按「未捕捉」清单补全图鉴'));
    runLoop().catch(function (e) {
      note('error', '主循环异常：' + ((e && e.message) || e));
      stop('主循环异常，已停止');
    });
    return { ok: true, text: D.cfg.mode === 'target'
      ? ('已开始：正在计算「' + D.cfg.target + '」的可去章节' +
        (D.cfg.untilShiny !== false ? '，会一直刷到出闪光' : ''))
      : (D.cfg.mode === 'rotom'
        ? '已开始：按勾选的洛托姆形态逐个去对应的「特别的相遇」格刷'
        : '已开始：正在按未捕捉清单挑概率最高、条件已生效的目标') };
  }

  function stop(text) {
    D.running = false;
    D.cur = null;
    setPhase('空闲');
    saveRun();
    try { hudPaint(); } catch (e) { /* 立刻收起看板 */ }
    var h = host();
    try { if (h && typeof h.free === 'function') h.free(); } catch (e) { /* ignore */ }
    var t = text || '已停止';
    note('info', t);
    backToAdventure();
    return { ok: true, text: t };
  }

  async function scanNow(opts) {
    var o = opts || {};
    var patch = {};
    if (o.mode) patch.mode = o.mode;
    if (typeof o.target === 'string') patch.target = o.target;
    if (o.cfg) Object.assign(patch, o.cfg);
    if (Object.keys(patch).length) config(patch);
    if (!DATA) return { ok: false, text: '离线图鉴数据表没加载，刷新一次游戏页' };
    if (D.cfg.mode === 'target' && !D.cfg.target) {
      return { ok: false, text: '先填要找的宝可梦再点扫描' };
    }
    try {
      // 只读存档，不打开地图，不抢页面
      var before = D.stats.rescans;
      scan();
      D.stats.rescans = before;
      return {
        ok: true,
        text: '清单已刷新：未捕捉 ' + D.totals.uncaught + ' 只 · 可去 ' +
          D.plan.length + ' 只 · 地区缺口 ' +
          D.gaps.map(function (g) { return g.zh + ' ' + g.left; }).join(' / ')
      };
    } catch (e) {
      var t = '清单计算失败：' + ((e && e.message) || e);
      note('error', t);
      return { ok: false, text: t };
    }
  }

  /* 供 popup / 冒烟测试用的纯函数：给一份存档就能算出完整状态卡 */
  function analyse(save, cfg) {
    var c = sanitize(cfg || D.cfg);
    var w = currentWeather(save);
    var ctx = {
      save: save || {}, dex: (save && save.dex) || {}, mons: {}, items: (save && save.items) || {},
      badges: (save && save.adv && save.adv.badges) || [],
      unlocked: (save && save.adv && typeof save.adv.unlocked === 'number') ? save.adv.unlocked : 0,
      chapter: (save && save.adv && typeof save.adv.chapter === 'number') ? save.adv.chapter : -1,
      weather: w, time: currentTime(save, w)
    };
    if (Array.isArray(save && save.mons)) {
      save.mons.forEach(function (m) { if (m && m.id) ctx.mons[num(m.id, 0)] = true; });
    }
    var ids = DATA.uncaughtList(ctx.save);
    var cards = ids.map(function (id) { return cardOf(id, ctx, c); });
    return {
      cards: cards, ranked: rankCards(cards, c),
      gaps: DATA.regionGaps(ctx.save),
      weather: ctx.weather, time: ctx.time,
      unlocked: ctx.unlocked
    };
  }

  function trimCard(c) {
    return {
      id: c.id, name: c.name, region: c.region, regionLabel: c.regionLabel,
      status: c.status, statusLabel: c.statusLabel,
      reasons: c.reasons.slice(0, 5),
      pct: c.pct, spot: c.spot, ch: c.ch,
      /* 第二十九批：卡片上也写「城都.第四章 圆朱市」，跟看板同一套 */
      path: spotPath(c.ch, c.step) || c.spot,
      conds: (c.conds || []).slice(0, 4),
      off: (c.off || []).slice(0, 4),
      offLabel: (c.offLabel || []).slice(0, 4),
      weatherNeed: c.weatherNeed, timeNeed: c.timeNeed,
      weatherNow: c.weatherNow, weatherIcon: c.weatherIcon, timeNow: c.timeNow,
      baby: !!c.baby, familyEvolved: c.familyEvolved || 0,
      familyOwned: c.familyOwned || [],
      mapLocked: c.mapLocked, unknownCond: c.unknownCond,
      evo: c.evo, spawns: c.spawns.slice(0, 3), score: c.score
    };
  }

  function catOf(statusKey) {
    if (UI && typeof UI.catOf === 'function') return UI.catOf(statusKey);
    if (statusKey === 'ready' || statusKey === 'ready-cond') return 'ready';
    if (statusKey === 'weather' || statusKey === 'time') return 'waiting';
    if (statusKey === 'evo') return 'evo';
    if (statusKey === 'hatch') return 'hatch';
    if (statusKey === 'locked') return 'locked';
    return 'special';
  }
  var lastStateScanAt = 0;
  function state() {
    FILTER = root.PCG_DEX_FILTER || null;
    /* 第一百一十五批：未启动「开始捕捉」时，弹窗每秒也会来拉一次 state()。
     * 以前 D.cards（未捕捉清单）/ D.rotom 只在 scan() 时重建，而 scan() 主要靠
     * 主循环（点了开始才跑）和 autoRescan（要 gameReady 且指纹变化）——于是玩家
     * 刚打开面板看到的是一份旧清单：不满足天气条件的目标还挂在「可直接捕捉」，
     * 点了开始捕捉、scan() 跑起来之后才跳成真实状态。
     * 现在未启动时也按「预报槽 + 距上次重算时间」主动重算，弹窗一打开就是实时的。 */
    if (!D.running && DATA && D.cfg.mode !== 'rotom') {
      try {
        var Fs = forecast();
        var slotNow = Fs && typeof Fs.slot === 'function' ? Fs.slot() : -1;
        if (gameReady() && (slotNow !== D.stateSlot || Date.now() - lastStateScanAt > 4000)) {
          D.stateSlot = slotNow;
          lastStateScanAt = Date.now();
          scan();
        }
      } catch (eState) { /* 页面还没 ready，下一次 state() 再算 */ }
    }
    /* 进度页的章节行是用户点开后才渲染的，scan() 时的天气快照会过期。
     * 顶部栏每次回执都重新读一次 DOM，保证「当前关天气 / 时段」是实时的；
     * 卡片列表仍由定期重扫 / 手动扫描更新，不影响正在进行的捕捉。 */
    var liveSave = readSave() || {};
    var liveW = currentWeather(liveSave);
    var liveT = currentTime(liveSave, liveW);
    var allCards = D.cards.map(trimCard).sort(function (a, b) {
      return b.score - a.score || a.id - b.id;
    });
    var catFilter = D.cfg.listFilter || '';
    var shown = catFilter ? allCards.filter(function (c) {
      return catOf(c.status) === catFilter;
    }) : allCards;
    return {
      version: (CFG && CFG.VERSION) || '',
      build: DATA ? DATA.build : '',
      running: D.running,
      phase: D.phase,
      mode: D.cfg.mode,
      target: D.cfg.target,
      cfg: Object.assign({}, D.cfg),
      ready: gameReady(),
      gaps: D.gaps.slice(),
      totals: Object.assign({}, D.totals),
      weather: Object.assign({}, liveW),
      time: Object.assign({}, liveT),
      unlocked: D.unlocked,
      list: shown.slice(0, 80),
      listFilter: catFilter,
      listTotal: shown.length,
      mapCycle: !!(MAP && D.cfg.reroll),
      // 「此处出没」当前地段的刷新进度，供弹窗 / 真机诊断读取
      zone: MAP && typeof MAP.zoneProgress === 'function' ? MAP.zoneProgress() : null,
      plan: D.plan.map(function (p) { return Object.assign({}, p); }),
      cur: D.cur ? Object.assign({}, D.cur) : null,
      doneCh: D.doneCh.slice(),
      skipped: D.skipped.slice(0, 20),
      lockedTargets: D.cards.filter(function (c) { return c.mapLocked; })
        .slice(0, 20).map(function (c) {
          return { ch: c.ch, region: c.region, label: c.spot, names: [c.name] };
        }),
      found: D.found,
      /* 第六十九批：5 种洛托姆形态的追踪（已获得 / 地点 / 条件 / 勾没勾），
       * 不管当前是哪个模式都回，弹窗那张卡直接照着渲染。
       * 第七十七批：行内容改由 rotomRowOf() 统一生成（跟 scan() 同一份），
       * 卡片上那组「·」明细也一起回，弹窗不再自己拼文案。 */
      rotom: ROTOM_FORMS.map(function (f) {
        var advLive = (liveSave && liveSave.adv) || {};
        return rotomRowOf(f, {
          dex: (liveSave && liveSave.dex) || {},
          gifts: (advLive.gifts && typeof advLive.gifts === 'object') ? advLive.gifts : {},
          weather: liveW, time: liveT
        });
      }),
      /* 第八十七批：天气是「游戏自己算的（桥）」还是「进度页徽标」，以及现在跳过了哪几只 ——
       * 弹窗 / 看板 / 真机诊断都能直接看出来，不用猜。 */
      wx: {
        bridge: WXC.state === 1,
        at: WXC.at || 0,
        src: (liveW && liveW.src) || '',
        day: (WXC.day && WXC.day.key) || '',
        skipped: rotomParkLeft().map(function (f) { return f.zh; })
      },
      stats: Object.assign({}, D.stats),
      lastScanAt: D.lastScanAt,
      since: D.curSince,
      note: D.note,
      filter: FILTER ? FILTER.state() : null,
      logs: D.logs.slice(0, 30)
    };
  }

  /* 纯函数挂出来给 tools/smoke.mjs 直接验，不依赖 DOM / Chrome。
   * 下面这一组是旧版「地图格子解析」工具，保留仅为兼容既有冒烟用例与
   * 游戏改版时的手动排查；新版主流程完全不调用它们。 */
  function parseChance(title, idx) {
    var src = String(title == null ? '' : title);
    if (/<\s*1\s*%/.test(src)) return { pct: 0.5, est: false };
    var m = src.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (m) {
      var v = parseFloat(String(m[1]).replace(',', '.'));
      if (isFinite(v) && v >= 0 && v <= 100) return { pct: v, est: false };
    }
    var rank = Math.max(0, Number(idx) || 0);
    return { pct: Math.max(1, Math.round(100 / (1 + rank))), est: true };
  }
  function matchTarget(cell, query) {
    var ids = resolveIds(query);
    if (ids.length) return ids.indexOf(Number(cell && cell.id)) >= 0;
    var n = normName(query);
    if (!n) return false;
    var zh = normName(cell && cell.zh);
    var nm = normName(cell && cell.name);
    if (zh && (zh === n || (n.length >= 2 && zh.indexOf(n) >= 0))) return true;
    if (nm && nm !== '???' && nm !== normName('#' + (cell && cell.id)) &&
        (nm === n || (n.length >= 2 && nm.indexOf(n) >= 0))) return true;
    return false;
  }
  function scoreChapter(p, opts) {
    var o = opts || {};
    if (!p || p.locked) return -1000;
    var active = p.active || [];
    var wait = p.wait || [];
    if (!active.length) return (wait.length && o.waitWeather) ? 1 : -1;
    var best = 0, sum = 0, condNow = 0;
    active.forEach(function (m) {
      best = Math.max(best, m.pct);
      sum += m.pct;
      if (m.condKey) condNow++;
    });
    var base = best
      + Math.min(30, (active.length - 1) * 3)
      + sum * 0.1
      + (wait.length ? 2 : 0);
    var tier = (o.condFirst && condNow > 0) ? 1000 : 0;
    return Math.round((tier + base) * 10) / 10;
  }
  function rankChapters(plan, opts) {
    var o = opts || {};
    return (plan || []).filter(function (p) {
      return !p.locked && scoreChapter(p, o) > 0;
    }).sort(function (a, b) {
      return scoreChapter(b, o) - scoreChapter(a, o) || a.ch - b.ch;
    });
  }
  function readCells(info) {
    var out = [];
    var cond = { key: '', label: '', on: true };
    var seq = 0;
    var kids = qa(Q.cond + ', ' + Q.grid, info);
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.classList.contains('zone-cond')) {
        cond = {
          key: el.getAttribute('data-cond') || '',
          label: txt(el).replace(/现在|maintenant/gi, '').trim() || '?',
          on: el.classList.contains('now')
        };
        continue;
      }
      var gridOff = el.classList.contains('off');
      var cells = qa(Q.cell, el);
      for (var j = 0; j < cells.length; j++) {
        var c = cells[j];
        var id = parseInt(c.getAttribute('data-dex'), 10);
        if (!isFinite(id)) continue;
        var title = c.getAttribute('title') || '';
        var parts = title.split('·');
        var raw = (parts[0] || '').trim();
        var zh = NAMES[id] || '';
        var chance = parseChance(title, seq);
        out.push({
          id: id,
          name: (raw && raw !== '???') ? raw : (zh || ('#' + id)),
          zh: zh,
          got: c.classList.contains('got'),
          pct: chance.pct,
          est: chance.est,
          condKey: cond.key,
          condLabel: cond.label,
          condOn: cond.on && !gridOff
        });
        seq++;
      }
    }
    return out;
  }
  function makePlanItem(detail, mode, query) {
    var all = detail.cells.filter(function (c) { return !c.got; });
    var missing = mode === 'target'
      ? all.filter(function (c) { return matchTarget(c, query); })
      : all;
    var active = missing.filter(function (c) { return c.condOn; });
    var wait = missing.filter(function (c) { return !c.condOn; });
    var conds = [];
    wait.forEach(function (c) {
      if (c.condLabel && conds.indexOf(c.condLabel) < 0) conds.push(c.condLabel);
    });
    var p = {
      ch: detail.ch, region: detail.region, label: detail.label,
      locked: detail.locked, have: detail.have, total: detail.total,
      missing: missing, active: active, wait: wait, conds: conds, cells: detail.cells
    };
    p.best = active.reduce(function (s, c) { return Math.max(s, c.pct); }, 0);
    p.score = scoreChapter(p, D.cfg);
    return p;
  }

  var util = {
    /* 新版 */
    normName: normName, resolveIds: resolveIds, condLabel: condLabel, condGlyph: condGlyph,
    condsLabel: condsLabel, condState: condState, evoInfo: evoInfo,
    cardOf: cardOf, scoreCard: scoreCard, rankCards: rankCards,
    catOf: catOf, chapterWeatherMap: chapterWeatherMap,
    chapterCondView: chapterCondView,
    /* 第二十九批：地点写法 / 闪光判定给 smoke 直接验 */
    spotPath: spotPath, zhNum: zhNum, regionStartCh: regionStartCh,
    shinyOwned: shinyOwned, shinyFarmMode: shinyFarmMode,
    /* 第一百零七批：本轮新增闪光的判定给冒烟直接验 */
    shinyNewKeys: shinyNewKeys, shinyCaughtThisRun: shinyCaughtThisRun,
    seenShinyCount: seenShinyCount, saveCaught: saveCaught,
    /* 第六十四批：路闪两个数的口径给 smoke 直接验 */
    guardShinyStats: guardShinyStats, shinyInstances: shinyInstances,
    refreshCounters: refreshCounters,
    /* 第三十九批：指定捕捉「只认一只」的解析结果给 smoke 直接验 */
    wantIds: wantIds,
    /* 第三十九批：出没点限制条件（off / 条件文案 / 天气指纹）给 smoke 直接验 */
    offNeed: offNeed, offText: offText, condSignature: condSignature,
    currentWeather: currentWeather, currentTime: currentTime,
    /* 第七十二批：洛托姆这三样给 smoke 直接验（该关天气 / 时间段判定 / 战斗中不切图） */
    rotomForms: ROTOM_FORMS, rotomCond: rotomCond,
    battleLive: battleLive,
    /* 第七十七批：这一趟时间线里**所有**洛托姆遭遇格（原来是「只取一个」的
     * rotomStaticAt，已整条换掉）；顺带把卡片文案生成器也挂出来给冒烟真跑 */
    rotomPointsAt: rotomPointsAt, rotomAreaRuns: rotomAreaRuns, rotomRowOf: rotomRowOf,
    /* 第八十五批：相遇格的真实特征（class=misc + 类型「野生宝可梦」）与游戏横幅
     * 「有特别的相遇」，外加一份整条时间线的扫描，方便测试直接喂假 DOM */
    rotomStaticNode: rotomStaticNode, rotomStaticHint: rotomStaticHint,
    rotomScan: tlScan, rotomMissed: rotomMissed,
    /* 第九十二批：出没点过滤 / 进化型改刷幼体的口径给 smoke 直接验 */
    spawnsOf: spawnsOf, stepHasWild: stepHasWild, evoHuntOf: evoHuntOf,
    rotomReasons: rotomReasons, rotomStatus: rotomStatus,
    /* 第八十七批：洛托姆「条件不满足就跳过这一项 / 条件回来接着刷」的三件套，
     * 外加天气小桥（wxView 读缓存、wxApply 收回执、dayKeys 读时段、wxSig 指纹） */
    rotomStale: rotomStale, rotomDropStale: rotomDropStale,
    rotomRearm: rotomRearm, rotomParkLeft: rotomParkLeft,
    rotomSkipMap: rotomSkipMap, rotomWaitText: rotomWaitText,
    /* 第八十八批：这一格的生成概率（游戏数据里的 chance，洛托姆形态是 4%） */
    rotomChance: rotomChance, pctText: pctText, oddsText: oddsText,
    wxView: wxView, wxApply: wxApply, wxAsk: wxAsk, wxSig: wxSig,
    wxWantAdd: wxWantAdd, wxFresh: wxFresh, dayKeys: dayKeys,
    wxState: function () { return { state: WXC.state, at: WXC.at, sig: WXC.sig, day: WXC.day }; },
    wxReset: function () { WXC.state = 0; WXC.at = 0; WXC.askedAt = 0; WXC.fails = 0;
      WXC.byCh = {}; WXC.byStep = {}; WXC.day = null; WXC.sig = ''; wxWant = {}; },
    /* 第八十三批：普通洛托姆是 5 种形态的前置 —— 到手之前只刷它、其余锁灰 */
    rotomBaseIdx: ROTOM_BASE_I, rotomBaseOwned: rotomBaseOwned,
    rotomBaseSync: rotomBaseSync, rotomEffPick: rotomEffPick,
    rotomBaseSpot: rotomBaseSpot, rotomFormOfCard: rotomFormOfCard,
    analyse: analyse, chapterOpen: chapterOpen, context: context,
    readSave: readSave, chanceLabel: chanceLabel,
    /* 旧版纯工具（兼容 / 排查用，主流程不调用） */
    parseChance: parseChance, matchTarget: matchTarget,
    scoreChapter: scoreChapter, rankChapters: rankChapters,
    makePlanItem: makePlanItem, readCells: readCells
  };

  root.PCG_DEX = {
    state: state,
    start: start,
    stop: stop,
    scan: scanNow,
    config: config,
    util: util,
    CFG_KEY: CFG_KEY,
    RUN_KEY: RUN_KEY
  };

  /* ---------------- 第二十五批：悬浮看板 + 统一的「刷新后继续」 ----------------
   * 1. 刷新后是否自动接着跑，由页面自动化里那条总开关（resumeOn）决定，
   *    卡片里原来的「刷新游戏页后自动接着跑」已经删掉。
   * 2. 看板跟伤害统计面板一套外观（hud-panel.js），开局才出现、停止就收起；
   *    参数栏里的「游戏页内悬浮看板」（dexHud）第五十五批曾默认关，
   *    第六十三批起跟「自动化任务」其它卡一样**默认勾选**（关掉就不显示）。 */
  function resumeOk() {
    try {
      if (root.PCG_SETTINGS_GET && root.PCG_SETTINGS_GET('resumeOn') === false) return false;
    } catch (e) { /* ignore */ }
    return true;
  }
  function hudOn() {
    try {
      if (root.PCG_SETTINGS_GET && root.PCG_SETTINGS_GET('dexHud') === false) return false;
    } catch (e) { /* ignore */ }
    return true;
  }
  function saveCaught(save) {
    var s = save && save.stats;
    return num(s && s.caught, 0);
  }
  function seenShinyCount(save) {
    var ss = save && save.seenShiny, n = 0;
    if (ss && typeof ss === 'object') {
      for (var k in ss) { if (Object.prototype.hasOwnProperty.call(ss, k) && ss[k]) n++; }
    }
    return n;
  }
  /* 闪光守卫自己的两个计数（第六十四批）：
   *   seen   = 每遇到一只野生闪光 +1
   *   caught = 其中真正抓到手的次数（守卫在每场结算时对比存档判定） */
  function guardShinyStats() {
    var g = guard();
    try {
      if (g && typeof g.state === 'function') {
        var st = g.state() || {};
        var s = st.stats || {};
        return {
          on: st.enabled !== false,
          seen: num(s.seen, 0),
          caught: num(s.caught, 0)
        };
      }
    } catch (e) { /* ignore */ }
    return { on: false, seen: 0, caught: 0 };
  }
  /* 存档里所有闪光实例的「key → 图鉴号」（仓库 / 培育屋 / 地下通道）。
   * 守卫不在时用它兜底：多出来的那只闪光就是抓到的。 */
  function shinyInstances(save) {
    var out = {};
    function put(m) {
      if (!m || !(m.shiny === true || m.shiny === 1)) return;
      var uid = String(m.uid || '');
      var key = uid || ((Number(m.id) || 0) + '@' + num(m.lv != null ? m.lv : m.level, 0));
      out[key] = Number(m.id) || 0;
    }
    function putAll(arr) {
      for (var i = 0; i < (arr || []).length; i++) put(arr[i]);
    }
    if (!save) return out;
    putAll(save.mons);
    var pen = (save.pension && save.pension.mons) || [];
    for (var i = 0; i < pen.length; i++) put(pen[i] && pen[i].mon);
    var us = (save.under && save.under.slots) || [];
    for (i = 0; i < us.length; i++) putAll(us[i] && us[i].mons);
    return out;
  }
  /* 看板四格要的是「这轮跑了多少」，第六十四批把两个数改成**真口径**：
   *   路闪遭遇 = 这一轮在野外遇到的野生闪光次数（闪光守卫逐场计数）；
   *   路闪捕捉 = 其中真正抓到手的那几场（守卫结算时对比存档判定，
   *             不再是「期间总捕捉数涨了几只」那种把普通怪也算进来的估法）。
   * 守卫没加载 / 被关掉时退回存档：遭遇看 seenShiny 的种类数增量，
   * 捕捉看仓库 / 培育屋 / 地下通道里新出现的闪光实例数。
   * 两个数都只增不减，避免界面数字来回跳。 */
  function refreshCounters() {
    var save = readSave() || {};
    var st = D.stats;
    var gs = guardShinyStats();
    var road, cap;
    if (gs.on) {
      road = gs.seen - num(st.shinySeenBase, 0);
      cap = gs.caught - num(st.shinyCaughtBase, 0);
    } else {
      road = seenShinyCount(save) - num(st.seenShinyBase, 0);
      var nowKeys = shinyInstances(save), base = st.shinyKeys || {}, added = 0;
      for (var k in nowKeys) {
        if (!Object.prototype.hasOwnProperty.call(nowKeys, k) || base[k]) continue;
        added++;
        base[k] = nowKeys[k];
      }
      st.shinyKeys = base;
      cap = num(st.shinyCaught, 0) + added;
    }
    if (!(road >= 0)) road = 0;
    if (!(cap >= 0)) cap = 0;
    if (road > num(st.roadShiny, 0)) st.roadShiny = road;
    if (cap > num(st.shinyCaught, 0)) st.shinyCaught = cap;
    /* 抓到的不可能比遇到的次数还多（守卫偶尔漏一场遭遇也不能让这对数看着别扭） */
    if (num(st.shinyCaught, 0) > num(st.roadShiny, 0)) st.roadShiny = num(st.shinyCaught, 0);
    /* 总捕捉数（含普通宝可梦）照旧留给弹窗那一行 */
    var got = saveCaught(save) - num(st.catchBase, 0);
    if (got > num(st.catches, 0)) st.catches = got;
  }
  function hudPaint() {
    var HUD = root.PCG_HUD;
    if (!HUD) return;
    /* 第四十三批：图鉴 / 路闪看板停在**左下角**（右边常被游戏自己的按钮和
     * 别的看板占着）。停在哪一侧只是默认值，玩家拖动过的位置照旧生效。
     * 第五十一批：顶栏的 × 直接挂到 stop —— 关掉看板就等于停掉这次捕捉。 */
    var hud = HUD.panel('dex', '图鉴捕捉', {
      side: 'left',
      onClose: function () { stop('已从悬浮看板关闭'); }
    });
    if (!D.running || !hudOn()) { hud.hide(); return; }
    try { refreshCounters(); } catch (e) { /* ignore */ }
    var rows = [];
    if (D.cur) {
      rows.push({ nm: '正在前往', sub: spotPath(D.cur.ch, D.cur.step) || D.cur.spot || '',
        val: D.cur.pct ? chanceLabel(D.cur.pct) : '' });
    }
    var ranked = rankCards(D.cards, D.cfg).slice(0, 3);
    ranked.forEach(function (c, idx) {
      /* 第三十八批：排队等追踪的这几只不再上底色（plain），只有「正在前往」高亮。
       * 第三十九批：紧随其后的第一条（就是此刻正在追的那只）也保留金色，
       * 从第二只开始才是纯排队。 */
      rows.push({ nm: c.name, sub: '#' + c.id, plain: idx > 0,
        val: c.pct ? chanceLabel(c.pct) : (c.statusLabel || '') });
    });
    hud.set({
      star: D.running ? '●' : '',
      /* 第四十九批：四格 2×2 ——
       *   已捕获 / 切出·切回轮次（合成一格）
       *   可直接捕捉 / 受天气·时段限制（无法捕捉）
       * 第八十二批：「路闪遭遇 / 路闪捕捉」这格对玩家没用（一共就 0/0 蹲着），
       * 改成**轮次** —— 这一轮跑下来切出再切回了多少趟，用来反推每只形态刷了几轮。 */
      cells: [
        ['已捕获', D.stats.caught || 0, 'gold'],
        ['切出 · 切回\n轮次', D.stats.rerolls || 0],
        ['可直接捕捉', D.totals.ready || 0],
        ['受天气/时段限制\n无法捕捉', D.totals.waiting || 0]
      ],
      rows: rows,
      rowsHl: true,
      empty: rows.length ? '' : '还没算出可去的目标',
      foot: D.phase + (D.note ? ' · ' + D.note : ''),
      footOn: true
    }).show();
  }
  setInterval(function () {
    try { hudPaint(); } catch (e) { /* 看板出错不影响捕捉 */ }
  }, 2000);

  /* ---------------- 启动：先算一次清单，再按需恢复断点 ---------------- */
  storeGet(CFG_KEY, function (saved) {
    if (saved) D.cfg = sanitize(saved);
    try { scan(); } catch (e) { /* 页面还没 ready，主循环启动时会再算 */ }
    if (!resumeOk()) return;
    storeGet(RUN_KEY, function (run) {
      if (!run) return;
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        if (gameReady()) {
          clearInterval(timer);
          var patch = { mode: run.mode || 'missing', target: run.target || '' };
          config(patch);
          note('warn', '检测到上次未跑完的图鉴捕捉，自动恢复');
          start({}).catch(function () {});
        } else if (tries > 60) {
          clearInterval(timer);
        }
      }, 2000);
    });
  });
})(typeof window !== 'undefined' ? window : this);
