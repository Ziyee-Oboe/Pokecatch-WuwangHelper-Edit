/* Poke'Catch 防掉线助手 —— 培育屋监测（第三批）
 *
 * 给原有的「孵蛋闪光」功能赋能：
 *   1) content.js 的蛋卡闪光标记统一走本模块的 eggIsShiny()（游戏同款确定性哈希，
 *      v0.4.104 起 = 训练家标识 + 蛋序号 k，旧蛋回退 uid 哈希），
 *      本模块接管那段 CSS 的生成（PCG_NURSERY.shinyCss），闪光蛋额外显示中文名 +
 *      金色描边，即使游戏把没见过的蛋画成 ??? 也知道里面是什么。
 *   2) 新增对培育屋的持续监测：亲代、蛋位、每颗蛋的孵化倒计时与进度、生蛋进度与
 *      下一颗蛋预计时间、闪光率、累计孵化与插件自己观测到的闪光率、事件流。
 *   3) 游戏页内一块跟随明暗主题的悬浮看板（只在培育屋页出现，可折叠、可关），
 *      popup 里有完整面板。另有一组默认关闭的自动化开关（下载版 正是吾王#5222）：
 *        · 只取非闪光蛋 / 取所有蛋（含闪光，两者互斥）
 *        · 蛋槽没满时自动吃果子催蛋（按 5 / 15 / 30 分钟性价比选果）
 *        · 有蛋可取自动跑一趟培育屋，办完切回冒险页（差事机，三道具闸）
 *      自动孵出来的图鉴卡会自己点掉，不然弹窗挡住页面，后面的蛋就点不动了。
 *
 * 数据怎么来的（第一百零四批对着线上 bundle app.a2c2781ee3.js，BUILD e84fc156df 重核）：
 *   存档 gachamon-save-v1：
 *     pension: { mons:[{mon:{id,uid,shiny,lv,reg,noEgg},candy}], eggs:[
 *                {uid,k,id,reg,sp?,laidAt,hatchAt,place?}], open?:{slots,eggs},
 *                egg?:<距下一颗蛋已累计毫秒>, tick?:<上次结算时间>, laid?:<已发蛋序号> }
 *     ★ 新蛋不写 shiny，带整数 k（蛋序号）：闪光由 `${trainer.since}:${trainer.id}|egg|k|0`
 *       的哈希定死（见 eggIsShiny / eggKHash / eggHash）；旧蛋（无 k）回退 uid/laidAt 哈希，
 *       更老的存档直接读 shiny 字段。sp:2 = 亲代有闪光（1/16 新档）；
 *       sp:1 = 旧版亲代闪光（10% 档）；bx:1 = 吃了靛莓果阈值 ×2。
 *     stats.hatched：游戏自己记的累计孵化数
 *     dex / seenShiny / items：图鉴状态与道具
 *   配置常量 PENSION：SLOTS 4、INCUBATOR 4、HATCH_MIN 240（一颗蛋 4 小时）、
 *     EGG_MIN 240 分钟（固定 4 小时；app.ac708615ae 起不再按亲代数量分档）、
 *     SHINY_RATE 1/512（蛋专用常量，地区图鉴完成 / 护符的 ×2 只作用于野怪）、
 *     SHINY_PARENT_RATE 1/16（亲代异色新档 ≈6.25%，旧 sp:1 仍 0.1）、
 *     SHINY_BERRY_MULT 2（bx 吃靛莓果 belue-berry）、DITTO 132、
 *     NO_EGG [137,479,47901,47902,47903,47904,47905]（本批按新 bundle 补齐洛托姆形态）。
 *   页面 DOM：
 *     #screen-pension.active                 培育屋屏幕
 *     #pen-eggs .pen-egg[data-egg]          蛋卡；.ready 或没 disabled = 可孵
 *       .meta small                        游戏自己写的剩余时间原文
 *       .pen-gauge i style="width:N%"      孵化进度条
 *       .egg-mon[title]                    游戏显示的名字（未知时 ???）
 *     #pen-res .pen-res[data-uid]           亲代槽；.pen-gauge i 是糖果进度
 *     #pen-egg-n / #pen-res-n               「2/4」计数
 *
 * 时钟：游戏用 Clock.now()（会对服务器校时），隔离世界读不到它。所以本模块用
 * 蛋卡进度条反推游戏当前时刻：Xe = laidAt + (hatchAt-laidAt)*width/100，
 * 与本地 Date.now() 的差就是时钟偏移；没打开培育屋页时退回 Date.now()，并标注 ≈。
 *
 * 数据边界与全插件一致：只读存档和页面 DOM、模拟点击，不改存档、不拦截请求、
 * 不上传数据。本模块自己的配置与统计写在扩展的 chrome.storage.local，
 * 绝不写游戏域名下的 localStorage。
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
    screen: sel('penScreen', '#screen-pension'),
    eggs: sel('penEggs', '#pen-eggs'),
    eggCard: sel('penEggCard', '.pen-egg[data-egg]'),
    eggReady: sel('penEggReady', '.pen-egg.ready[data-egg]:not([disabled])'),
    eggCount: sel('penEggCount', '#pen-egg-n'),
    parents: sel('penParents', '#pen-res'),
    parentCard: sel('penParentCard', '.pen-res[data-uid]'),
    parentCount: sel('penParentCount', '#pen-res-n'),
    gauge: sel('penGauge', '.pen-gauge i'),
    modal: sel('penModal', '#modal-root .modal, .modal')
  };

  var CFG_KEY = 'pcgNurseryCfgV1';
  var STATS_KEY = 'pcgNurseryStatsV1';

  var DEFAULT_CFG = {
    hud: true,             // 游戏页内悬浮看板
    hudFold: false,        // 看板收起
    hudAlways: false,      // 关 = 只在培育屋页显示；开 = 任何页面都显示
    /* 第九十七批：玩家要求「闪光蛋上补出中文名与金色描边」默认开启并收起选项 ——
     * 面板上那一行已经删掉，配置层钉死 true，旧存档里存过 false 也拉回来。 */
    shinyHint: true,       // 闪光蛋上补出中文名（默认开启，无面板开关）
    autoHatch: false,      // 只取非闪光蛋（自动点掉可孵的蛋；默认关，避免和其它自动化抢页面）
    eggTakeAll: false,     // 取所有蛋（包括闪光）：连闪光蛋也自动点掉（和上面互斥，开了它上面的自动关）
    eggBerry: false,       // 蛋槽没满 4 个时自动吃果子催蛋（默认关）
    /* v1.25：催蛋的额外选项（独立开关）。只在该开关打开时：若「下一颗蛋」正好是
     * 吃果才会闪的闪光亲代（roll 落在 [1/16, 1/8) 且抽到的亲代是闪光），就先物理
     * 点一下靛莓果（belue-berry，#pen-berries button[data-myrte]），把下一颗的
     * 闪光率 ×2 领到手，再照常催蛋。默认关，和 eggBerry 各自独立。 */
    shinyBerry: false,     // 下一颗能出吃果闪光亲代时，先自动喂靛莓果再催蛋
    autoJump: true,        // 有蛋可取时自动切到培育屋、办完切回冒险页（关掉就只帮点、不换页）
    sampleSec: 1           // 采样间隔（秒）
  };

  /* 线上 PENSION 常量表。游戏改数值时只改这里，其余逻辑不用动。 */
  var K = {
    SLOTS: 4,
    INCUBATOR: 4,
    HATCH_MS: 240 * 60000,
    /* app.ac708615ae.js：官方把孵蛋与生蛋周期统一成固定 240 分钟（4 小时）：
     *   游戏里 pn = () => gn().length ? EGG_MIN*6e4 : 0，EGG_MIN=240，
     *   只要屋里有一只可繁殖亲代就是 4 小时，不再随亲代数量分档。
     *   旧版 EGG_MS=[360,180,90]（1/2/3 只分档）已失效：按 90 分钟算会让
     *   生蛋进度虚高到 100%，berryReady 误判「不用喂果子」→ 催蛋不生效。
     * 这里改为与 HATCH_MS 相同的固定值，两处 goal 计算同步去掉分档索引。 */
    EGG_MS: 240 * 60000,
    OFFLINE_MS: 8 * 3600 * 1000,
    /* 第一百二十批（app.17255d8d2e.js）：官方把闪光亲代率从 0.1 改成 1/16，
     * 并按蛋上的 sp 区分新旧——sp:2 走 1/16（新，约 6.25%），sp:1 走旧 0.1；
     * 吃 belue-berry（靛莓果）时 bx:1，阈值 ×2。见 eggThreshold / Ao(t)。 */
    SHINY_RATE: 1 / 512,
    SHINY_PARENT_RATE: 1 / 16,      // sp:2 新档，≈6.25%
    SHINY_PARENT_RATE_OLD: 0.1,     // sp:1 旧档，10%
    SHINY_BERRY_MULT: 2,            // bx 吃靛莓果 ×2
    SHINY_BERRY: 'belue-berry',     // 靛莓果（异色果），下一颗蛋闪光率 ×2
    DITTO: 132,
    /* 第一百零四批：线上 PENSION.NO_EGG 已扩充为「不能生蛋」的完整形态表，
       少写几个会让「可繁殖亲代数」虚高，催蛋果子与下一颗蛋倒计时都跟着算错。 */
    NO_EGG: [137, 442, 479, 47901, 47902, 47903, 47904, 47905, 556]
  };

  var ZERO_STATS = {
    eggsSeen: 0, shinySeen: 0, hatched: 0, removed: 0,
    autoHatched: 0, autoFed: 0, since: 0
  };

  /* 官方 Ao(t)：亲代闪光阈值随蛋上的 sp 走：sp:2 → 1/16，sp:1 → 旧 0.1；
   * 再乘 bx（吃靛莓果）×2。base 恒 1/512。整段与 app.17255d8d2e.js 的
   * `const Ao=t=>{const n=Wn(t.reg),o=t.sp&&(+t.sp==2?SHINY_PARENT_RATE:SHINY_PARENT_RATE_OLD);
   *  return(o?Math.max(o,n):n)*(t.bx?SHINY_BERRY_MULT:1)}` 逐字一致。
   * opts: {sp, bx}；sp 可为数字/字符串/布尔。 */
  function shinyThreshold(opts) {
    opts = opts || {};
    var base = K.SHINY_RATE;
    var o = 0;
    if (opts.sp) o = (+opts.sp === 2) ? K.SHINY_PARENT_RATE : K.SHINY_PARENT_RATE_OLD;
    var th = o ? Math.max(o, base) : base;
    if (opts.bx) th = th * K.SHINY_BERRY_MULT;
    return th;
  }

  /* ---------------- 闪光蛋判定（v0.4.104：游戏改成「训练家 + 蛋序号」哈希） ----------------
   * 线上 bundle app.0e84ded8d8.js（BUILD 59d637ffd1）的 PENSION 判定，逐行核对过：
   *   const Qs = [24348,41597,15337,49222];
   *   function Us(s) { ...53 位哈希，归一化到 [0,1)... }        // == 本模块 eggHash
   *   const Vn = () => `${save.trainer?.since??""}:${save.trainer?.id??""}`;
   *   const kn = (d,i,w=0) => Us(`${Vn()}|${d}|${i}|${w}`);
   *   function Un() { ...; const i = pension.laid++;
   *                   return {k:i, uid:uid(), roll:w=>kn("egg",i,w+1)}; }  // 产蛋发号
   *   function ps(d) {                                          // 孵化时定闪光
   *     if ("shiny" in d) return !!d.shiny;                      // ① 旧存档兼容
   *     const base = PENSION.SHINY_RATE;                         // 恒定 1/512
   *     return (Number.isInteger(d.k) ? kn("egg", d.k)           // ② 新蛋：训练家+蛋序号
   *                                   : Us(String(d.uid ?? d.laidAt)))  // ③ 旧蛋：uid 哈希
   *            < (d.sp ? Math.max(PENSION.SHINY_PARENT_RATE, base) : base);
   *   }
   * 蛋对象（zs() / 赠蛋）：{ uid, k, id, reg, ...(sp:1)?, laidAt, hatchAt }
   *   k = 从 pension.laid 递增的整数蛋序号，随存档持久化；sp:1 = 亲代有闪光（10% 档）。
   * 也就是说：作者这次把闪光从「uid 哈希」换成了「产蛋发号那一刻，
   * 用 `${trainer.since}:${trainer.id}|egg|${k}|0` 的哈希」定死；没有 k 的旧蛋
   * 才回退到 uid / laidAt 哈希；更老的存档直接读 shiny 字段。
   * 上一版插件只做 ③（uid 哈希）→ 带 k 的新蛋全部判错：真实的闪光蛋认不出来，
   * 普通蛋反而被标成闪光，「只取非闪光蛋」还会误孵闪光蛋。
   * eggHash 与游戏 Us 逐位一致（Qs 常量、两个 Math.imul 混合、53 位归一化），别动。 */
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

  /* 训练家种子：与游戏 Vn() 完全一致 —— `${trainer.since??""}:${trainer.id??""}`。
   * 读不到存档（例如沙箱单测只塞了蛋对象）时退回 ":"，结果仍确定，不会抛错。 */
  function trainerSeed(save) {
    var t = (save && save.trainer) || null;
    if (!t) return ':';
    var since = (t.since == null) ? '' : t.since;
    var id = (t.id == null) ? '' : t.id;
    return since + ':' + id;
  }

  /* 产蛋序号 k → 游戏 kn("egg", k)：w 默认 0，所以拼的是 |egg|k|0 */
  function eggKHash(k, save) {
    return eggHash(trainerSeed(save) + '|egg|' + k + '|0');
  }

  /* 一颗蛋是不是闪光：完整照抄游戏 ps(d) 的三条分支。
   * 第二参数 save 传全档（要读 trainer.since / trainer.id）；不传时只读当前存档兜底，
   * 这样 content.js / 沙箱单测沿用旧的单参数调用也照样正确。 */
  function eggIsShiny(e, save) {
    if (!e || typeof e !== 'object') return false;
    if (Object.prototype.hasOwnProperty.call(e, 'shiny')) return !!e.shiny;   // ① 旧存档
    var threshold = shinyThreshold(e);   // sp:2→1/16、sp:1→0.1、bx→×2（官方 Ao）
    var roll;
    if (typeof e.k === 'number' && isFinite(e.k) && Math.floor(e.k) === e.k) {
      /* ② 新蛋：Number.isInteger(k) → kn("egg", k) */
      if (!save) save = readSave();
      roll = eggKHash(e.k, save);
    } else {
      /* ③ 旧蛋：Us(String(uid ?? laidAt)) —— 第一百零四批那套，保留兼容 */
      var key = String(e.uid != null ? e.uid : (e.laidAt != null ? e.laidAt : ''));
      if (!key) return false;
      roll = eggHash(key);
    }
    return roll < threshold;
  }

  var D = {
    cfg: Object.assign({}, DEFAULT_CFG),
    stats: Object.assign({}, ZERO_STATS),
    events: [],
    uids: null,             // 上一次采样看到的蛋 uid -> egg，null = 还没建立基线
    gameHatched: null,      // 上次读到的 save.stats.hatched
    snap: null,
    at: 0,
    sig: '',
    clock: { offset: 0, src: 'local', at: 0 },
    lastHatchAt: 0,
    eggWhy: '',             // 这一拍为什么没收蛋（面板上直接显示）
    hud: null,
    hudBody: null,
    hudSig: '',
    loaded: false
  };

  /* ---------------- 扩展存储（模拟环境里没有 chrome，静默降级） ---------------- */
  function storeGet(key, cb) {
    try {
      if (!root.chrome || !chrome.storage || !chrome.storage.local) { cb(null); return; }
      chrome.storage.local.get(key, function (o) {
        void (chrome.runtime && chrome.runtime.lastError);
        cb(o && o[key]);
      });
    } catch (e) { cb(null); }
  }

  function storeSet(key, val) {
    try {
      if (!root.chrome || !chrome.storage || !chrome.storage.local) return;
      var out = {};
      out[key] = val;
      chrome.storage.local.set(out, function () { void (chrome.runtime && chrome.runtime.lastError); });
    } catch (e) { /* ignore */ }
  }

  function note(level, text) {
    try {
      if (root.PCG_LOG && typeof root.PCG_LOG.push === 'function') {
        root.PCG_LOG.push(level, 'nursery', '培育屋：' + text);
      }
    } catch (e) { /* ignore */ }
  }

  function pushEvent(type, text, shiny) {
    D.events.unshift({ t: Date.now(), type: type, text: text, shiny: !!shiny });
    if (D.events.length > 40) D.events.length = 40;
  }

  /* ---------------- 通用小工具（纯函数，冒烟测试直接验） ---------------- */
  function num(v, d) {
    var n = Number(v);
    return isFinite(n) ? n : (d || 0);
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtDur(ms) {
    if (!isFinite(ms) || ms <= 0) return '就绪';
    var m = Math.ceil(ms / 60000);
    if (m < 60) return m + ' 分';
    var h = Math.floor(m / 60), mm = m % 60;
    if (h < 24) return h + ' 小时' + (mm ? ' ' + mm + ' 分' : '');
    return Math.floor(h / 24) + ' 天 ' + (h % 24) + ' 小时';
  }

  function fmtClock(ts) {
    if (!ts) return '—';
    try {
      var d = new Date(ts);
      return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' +
        ('0' + d.getSeconds()).slice(-2);
    } catch (e) { return '—'; }
  }

  /* 第一百一十三批：培育屋只显示宝可梦中文名，不再拼「 #图鉴号」（玩家反馈 #464 多余）。
   * 名字表查不到时才退回 #编号，避免显示空白，也不会丢掉未知形态的辨识信息。 */
  function dexName(id) {
    var n = Number(id);
    var zh = NAMES[n] || NAMES[String(n)] || '';
    return zh || ('#' + n);
  }

  function pctLabel(rate) {
    var p = rate * 100;
    if (p >= 1) return (Math.round(p * 10) / 10) + '%';
    return (Math.round(p * 1000) / 1000) + '%';
  }

  /* 存档只读；1 秒内复用缓存，避免每秒 JSON.parse 一大坨 */
  var saveCache = { at: 0, data: null };
  function readSave(force) {
    var SAVE = root.PCG_SAVE || null;
    if (SAVE) {
      var snap = SAVE.read(!!force);
      saveCache = { at: Date.now(), data: snap };
      return snap;
    }
    if (!force && Date.now() - saveCache.at < 900) return saveCache.data;
    var data = null;
    try {
      var raw = root.localStorage && root.localStorage.getItem(SAVE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) { data = null; }
    saveCache = { at: Date.now(), data: data };
    return data;
  }

  /* ---------------- 页面 DOM ---------------- */
  function q(s, from) {
    try { return (from || doc).querySelector(s); } catch (e) { return null; }
  }

  function qa(s, from) {
    try { return Array.prototype.slice.call((from || doc).querySelectorAll(s)); }
    catch (e) { return []; }
  }

  function penActive() {
    var el = q(Q.screen);
    return !!(el && el.classList && el.classList.contains('active'));
  }

  function gaugeOf(node) {
    if (!node || !node.querySelector) return null;
    var g = node.querySelector(Q.gauge);
    if (!g || !g.style) return null;
    var v = parseFloat(g.style.width);
    return isFinite(v) ? clamp(v, 0, 100) : null;
  }

  /* 读蛋卡：uid -> { ready, disabled, text, gauge, title } */
  function domEggs() {
    var out = {};
    var box = q(Q.eggs);
    if (!box) return out;
    var cards = qa(Q.eggCard, box);
    for (var i = 0; i < cards.length; i++) {
      var el = cards[i];
      var uid = el.getAttribute && el.getAttribute('data-egg');
      if (!uid) continue;
      var small = el.querySelector ? el.querySelector('.meta small') : null;
      var mon = el.querySelector ? el.querySelector('.egg-mon') : null;
      out[String(uid)] = {
        ready: !!(el.classList && el.classList.contains('ready')),
        disabled: !!(el.hasAttribute && el.hasAttribute('disabled')),
        text: small && small.textContent ? String(small.textContent).trim() : '',
        title: mon && mon.getAttribute ? (mon.getAttribute('title') || '') : '',
        gauge: gaugeOf(el)
      };
    }
    return out;
  }

  /* 读亲代槽：uid -> { gauge } */
  function domParents() {
    var out = {};
    var box = q(Q.parents);
    if (!box) return out;
    var cards = qa(Q.parentCard, box);
    for (var i = 0; i < cards.length; i++) {
      var el = cards[i];
      var uid = el.getAttribute && el.getAttribute('data-uid');
      if (!uid) continue;
      out[String(uid)] = { gauge: gaugeOf(el) };
    }
    return out;
  }

  /* 用孵化进度条反推游戏时钟：Xe = laidAt + (hatchAt-laidAt)*w/100。
   * 只取 5%~95% 的样本（两端会被 clamp 截断），取中位数，异常值直接丢掉。 */
  function calibrate(eggs, cards) {
    var samples = [];
    var now = Date.now();
    for (var i = 0; i < eggs.length; i++) {
      var e = eggs[i];
      var c = cards[String(e.uid)];
      if (!c || c.gauge == null || c.gauge < 5 || c.gauge > 95) continue;
      var laid = num(e.laidAt, 0), hatch = num(e.hatchAt, 0);
      if (hatch <= laid || laid <= 0) continue;
      var xe = laid + (hatch - laid) * c.gauge / 100;
      var off = xe - now;
      if (Math.abs(off) <= 30 * 24 * 3600 * 1000) samples.push(off);
    }
    if (!samples.length) return { offset: 0, src: 'local', count: 0 };
    samples.sort(function (a, b) { return a - b; });
    var mid = samples[Math.floor(samples.length / 2)];
    return { offset: mid, src: 'dom', count: samples.length };
  }

  /* ---------------- 存档解析（纯函数） ---------------- */
  function parseEgg(e, gameNow, card, save) {
    var laid = num(e && e.laidAt, 0);
    var hatch = num(e && e.hatchAt, 0);
    var span = hatch > laid ? hatch - laid : K.HATCH_MS;
    var pct = clamp((gameNow - laid) / span * 100, 0, 100);
    var remain = Math.max(0, hatch - gameNow);
    var c = card || {};
    /* 游戏给可孵的蛋加 .ready 并去掉 disabled；多语言文案不参与判定，避免误判。 */
    var ready = gameNow >= hatch || !!c.ready;
    if (c.disabled && !c.ready) ready = false;
    var id = num(e && e.id, 0);
    return {
      uid: String((e && e.uid) || ''),
      id: id,
      name: dexName(id),
      /* v0.4.104：新蛋由「训练家+蛋序号 k」定闪光，旧蛋回退 uid 哈希，见 eggIsShiny */
      shiny: eggIsShiny(e, save),
      sp: !!(e && e.sp),
      region: (e && e.reg) || '',
      laidAt: laid,
      hatchAt: hatch,
      remainMs: ready ? 0 : remain,
      pct: Math.round(pct * 10) / 10,
      ready: ready,
      gameText: c.text || '',
      gameTitle: c.title || '',
      gauge: (c.gauge == null ? null : Math.round(c.gauge * 10) / 10)
    };
  }

  function parseParent(slot, card) {
    var m = (slot && slot.mon) || {};
    var id = num(m.id, 0);
    var noEgg = !!(m.noEgg || K.NO_EGG.indexOf(id) >= 0);
    /* gauge 来自培育屋亲代卡上的进度条：它是「这只宝可梦在屋里攒经验 / 攒糖果」
     * 到下一档的百分比。旧面板把它写成含糊的「可繁殖 xx%」，这里明确成经验进度。 */
    var xp = (card && card.gauge != null) ? Math.round(card.gauge * 10) / 10 : null;
    return {
      uid: String(m.uid || ''),
      id: id,
      name: dexName(id),
      shiny: !!m.shiny,
      level: num(m.lv != null ? m.lv : (m.level != null ? m.level : m.lvl), 0),
      region: m.reg || '',
      ditto: id === K.DITTO,
      noEgg: noEgg,
      canLay: id !== K.DITTO && !noEgg,
      candy: num(slot && slot.candy, 0),
      gauge: xp,
      xpPct: xp,
      xpLabel: xp == null ? '—' : (xp + '%')
    };
  }

  function parseLaying(pension, parents) {
    var layers = 0;
    for (var i = 0; i < parents.length; i++) if (parents[i].canLay) layers++;
    var hasDitto = false;
    for (var j = 0; j < parents.length; j++) if (parents[j].ditto) hasDitto = true;
    var goal = layers ? K.EGG_MS : 0;
    var elapsed = clamp(num(pension && pension.egg, 0), 0, goal || K.OFFLINE_MS);
    return {
      hasDitto: hasDitto,
      layers: layers,
      goalMs: goal,
      elapsedMs: elapsed,
      pct: goal ? Math.round(clamp(elapsed / goal * 100, 0, 100) * 10) / 10 : 0,
      remainMs: goal ? Math.max(0, goal - elapsed) : 0,
      active: !!(goal && hasDitto),
      cycleLabel: goal ? fmtDur(goal) : '—',
      nextLabel: goal ? fmtDur(Math.max(0, goal - elapsed)) : '—'
    };
  }

  /* 新版本蛋的闪光率是**确定性**的，不是每次孵化掷骰。
   * 游戏里 $s = () => PENSION.SHINY_RATE 是个常量（1/512），地区图鉴完成 / 闪光护符
   * 那套 ×2 只作用于野怪，对蛋无效。第一百二十批起官方把闪光亲代率从 10% 改成
   * 1/16（蛋带 sp:2，≈6.25%；旧存档 sp:1 仍是 10%），吃靛莓果 bx 再 ×2。
   * 这里直接和闪光蛋预测（nextShinyInfo 的 parentRate=1/16）对齐，只摆游戏真正用的档。 */
  function parseShiny(save, parents) {
    var base = K.SHINY_RATE;
    var shinyParent = false;
    for (var i = 0; i < parents.length; i++) if (parents[i].shiny) shinyParent = true;
    var eff = shinyParent ? Math.max(K.SHINY_PARENT_RATE, base) : base;
    var currentKey = shinyParent ? 'parent' : 'base';
    var parentText = '1/16 ≈ ' + pctLabel(K.SHINY_PARENT_RATE);
    return {
      base: base,
      baseLabel: '1/512 ≈ ' + pctLabel(base),
      boostedLabel: '1/512 ≈ ' + pctLabel(base),
      parentLabel: parentText,
      boosted: false,
      shinyParent: shinyParent,
      rate: eff,
      label: pctLabel(eff),
      currentKey: currentKey,
      avgEggs: eff > 0 ? Math.max(1, Math.round(1 / eff)) : 0,
      odds: [
        { key: 'base', label: '普通亲代', rate: base, text: '1/512 ≈ ' + pctLabel(base) },
        { key: 'parent', label: '亲代里有闪光宝可梦', rate: K.SHINY_PARENT_RATE, text: parentText }
      ],
      hint: '蛋的闪光在产下时就由「训练家 + 蛋序号」定死，面板直接标出每一颗；' +
        (shinyParent ? '亲代有异色：按游戏的 1/16 档（约 6.25%）' : '当前按基础 1/512 档')
    };
  }

  /* 把一次采样整理成给 popup / HUD 的快照。save、cards、dom 都可直接注入做测试。 */
  function analyse(save, cards, parentCards, wallNow) {
    var now = num(wallNow, Date.now());
    var pension = (save && save.pension) || {};
    var rawEggs = Array.isArray(pension.eggs) ? pension.eggs : [];
    var rawParents = Array.isArray(pension.mons) ? pension.mons : [];
    cards = cards || {};
    parentCards = parentCards || {};

    var cal = calibrate(rawEggs, cards);
    var gameNow = now + cal.offset;

    var eggs = [];
    for (var i = 0; i < rawEggs.length; i++) {
      eggs.push(parseEgg(rawEggs[i], gameNow, cards[String(rawEggs[i].uid)], save));
    }
    eggs.sort(function (a, b) { return (a.ready === b.ready) ? (a.remainMs - b.remainMs) : (a.ready ? -1 : 1); });

    var parents = [];
    for (var j = 0; j < rawParents.length; j++) {
      var m = (rawParents[j] && rawParents[j].mon) || {};
      parents.push(parseParent(rawParents[j], parentCards[String(m.uid)]));
    }

    var laying = parseLaying(pension, parents);
    var shiny = parseShiny(save, parents);

    /* 当前这组亲代「能孵出哪些宝可梦」：培育屋生的是幼体形态，
     * 用离线图鉴表把每只可繁殖亲代回溯到进化链起点；百变怪不产自己的蛋。 */
    var DEXDATA = root.PCG_DEX_DATA || null;
    var offspring = [], seenBase = {};
    for (var oi = 0; oi < parents.length; oi++) {
      var pp = parents[oi];
      if (!pp.canLay) continue;
      var chain = (DEXDATA && typeof DEXDATA.evoChain === 'function')
        ? DEXDATA.evoChain(pp.id) : [pp.id];
      var baseId = num(chain[0], pp.id);
      if (seenBase[baseId]) continue;
      seenBase[baseId] = true;
      offspring.push({
        id: baseId,
        name: DEXDATA ? DEXDATA.name(baseId) : pp.name,
        from: pp.id,
        fromName: pp.name,
        fromShiny: !!pp.shiny,
        rate: shiny.rate,
        label: shiny.label
      });
    }

    var maxParents = Math.min(K.SLOTS, Math.max(num(pension.open && pension.open.slots, 1), rawParents.length, 1));
    var maxEggs = Math.min(K.INCUBATOR, Math.max(num(pension.open && pension.open.eggs, 1), rawEggs.length, 1));

    var readyCount = 0, shinyCount = 0, soonest = Infinity;
    var shinyNames = [];
    for (var x = 0; x < eggs.length; x++) {
      if (eggs[x].ready) readyCount++;
      if (eggs[x].shiny) { shinyCount++; shinyNames.push(eggs[x].name); }
      if (!eggs[x].ready && eggs[x].remainMs < soonest) soonest = eggs[x].remainMs;
    }

    return {
      ok: !!save,
      at: now,
      screen: false,                 // 由 sample() 覆盖成真实页面状态
      clock: { offset: cal.offset, src: cal.src, samples: cal.count },
      slots: {
        parents: parents.length, maxParents: maxParents,
        eggs: eggs.length, maxEggs: maxEggs,
        freeEggs: Math.max(0, maxEggs - eggs.length)
      },
      parents: parents,
      eggs: eggs,
      laying: laying,
      shiny: shiny,
      offspring: offspring,
      game: {
        hatched: num(save && save.stats && save.stats.hatched, 0),
        dex: 0,
        seenShiny: 0
      },
      summary: {
        ready: readyCount,
        shinyEggs: shinyCount,
        shinyNames: shinyNames,
        soonestMs: isFinite(soonest) ? soonest : 0,
        soonestLabel: isFinite(soonest) ? fmtDur(soonest) : '—'
      }
    };
  }

  /* ---------------- 观测统计与事件流 ---------------- */
  function diffStats(snap) {
    var cur = {};
    for (var i = 0; i < snap.eggs.length; i++) cur[snap.eggs[i].uid] = snap.eggs[i];

    if (D.uids == null) {         // 首次采样只建基线，不把已有蛋算成「新蛋」
      D.uids = cur;
      D.gameHatched = snap.game.hatched;
      return;
    }

    var dirty = false;
    var uid;
    for (uid in cur) {
      if (!Object.prototype.hasOwnProperty.call(cur, uid) || D.uids[uid]) continue;
      var e = cur[uid];
      D.stats.eggsSeen++;
      if (e.shiny) D.stats.shinySeen++;
      dirty = true;
      pushEvent('egg', '新蛋：' + e.name + (e.shiny ? ' ✦ 闪光' : ''), e.shiny);
      if (e.shiny) note('ok', '发现闪光蛋 ' + e.name);
    }
    for (uid in D.uids) {
      if (!Object.prototype.hasOwnProperty.call(D.uids, uid) || cur[uid]) continue;
      var gone = D.uids[uid];
      D.stats.removed++;
      dirty = true;
      pushEvent('gone', '蛋离巢：' + gone.name + (gone.shiny ? ' ✦ 闪光' : ''), gone.shiny);
    }

    if (D.gameHatched != null && snap.game.hatched > D.gameHatched) {
      var delta = snap.game.hatched - D.gameHatched;
      D.stats.hatched += delta;
      dirty = true;
      pushEvent('hatch', '游戏记录孵化 +' + delta + '（累计 ' + snap.game.hatched + '）', false);
      note('info', '孵化 +' + delta + '，累计 ' + snap.game.hatched);
    }
    D.gameHatched = snap.game.hatched;

    /* 可孵状态变化单独提醒，闪光蛋特别标出来 */
    for (var k = 0; k < snap.eggs.length; k++) {
      var e2 = snap.eggs[k];
      var old = D.uids[e2.uid];
      if (e2.ready && old && !old.ready) {
        pushEvent('ready', '可孵化：' + e2.name + (e2.shiny ? ' ✦ 闪光' : ''), e2.shiny);
      }
    }

    D.uids = cur;
    if (!D.stats.since) D.stats.since = Date.now();
    if (dirty) storeSet(STATS_KEY, D.stats);
  }

  /* ---------------- 给原「孵蛋闪光」功能赋能 ----------------
   * content.js 的 eggCss(uids) 会优先调用这里：闪光蛋除了「闪光」二字，
   * 还会补出中文名（游戏没见过的蛋本来是 ???），并加一圈金色描边。 */
  function shinyCss(uids, eggsOverride) {
    if (!uids || !uids.length) return '';
    /* eggsOverride 只给冒烟测试注入，运行时一律从只读存档取 */
    var save = Array.isArray(eggsOverride) ? null : readSave();
    var raw = Array.isArray(eggsOverride) ? eggsOverride :
      ((save && save.pension && save.pension.eggs) || []);
    var byUid = {};
    for (var i = 0; i < raw.length; i++) {
      if (raw[i] && raw[i].uid != null) byUid[String(raw[i].uid)] = raw[i];
    }
    var rule =
      ' .meta b::after{' +
        'content:"__LABEL__";' +
        'display:inline-block;margin-left:6px;position:relative;top:-1px;' +
        'font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif;' +
        'font-style:italic;font-weight:900;font-size:13px;line-height:1;letter-spacing:1px;' +
        'background:linear-gradient(100deg,#fff8cf 0%,#ffdd6b 26%,#e9a51d 52%,#fff3b8 76%,#f2b93a 100%);' +
        '-webkit-background-clip:text;background-clip:text;' +
        'color:transparent;-webkit-text-fill-color:transparent;' +
        'filter:drop-shadow(0 1px 0 rgba(120,70,0,.6)) drop-shadow(0 0 6px rgba(255,201,72,.6));' +
        'transform:skewX(-8deg)' +
      '}';
    var out = [];
    for (var j = 0; j < uids.length; j++) {
      var uid = String(uids[j]);
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(uid)) continue;   // 只用在属性选择器里
      var e = byUid[uid];
      var zh = e ? (NAMES[num(e.id, 0)] || '') : '';
      var label = D.cfg.shinyHint && zh ? '闪光 · ' + zh : '闪光';
      var safe = label.replace(/["\\]/g, '');
      out.push('#pen-eggs .pen-egg[data-egg="' + uid + '"]{' +
        'outline:2px solid rgba(255,203,5,.85);outline-offset:2px;border-radius:10px}');
      out.push('#pen-eggs .pen-egg[data-egg="' + uid + '"]' + rule.replace('__LABEL__', safe));
    }
    return out.join('\n');
  }

  /* ---------------- 游戏页内悬浮看板（第六十一批：并入统一看板 PCG_HUD） ----------------
   * 下载版（原作者 正是吾王#5222）这里自己画一张 .pnl（宽 268、只能折叠不能拖）。
   * 本版把这一段整块换成图鉴 / 传说 / 道具 / 树果 / 刷钱 / 黑市 / 地下通道共用的
   * hud-panel.js 那张卡：可拖动、可折叠，位置与折叠状态记在 chrome.storage.local。
   * 只有「画在哪」不一样，取蛋 / 催蛋 / 差事的逻辑与开关全走下载版那一套。 */
  function hudPanel() {
    if (!root.PCG_HUD || typeof root.PCG_HUD.panel !== 'function') return null;
    try {
      return root.PCG_HUD.panel('nursery', '培育屋监测', {
        /* 点 × = 关掉培育屋这一摊自动化：看板收起（hud 关掉，去插件面板重新勾才会再出现），
         * 取蛋 / 催蛋 / 自动跳页一并停下，免得卡片没了它还在后台自己切页面。 */
        onClose: function () {
          config({ hud: false, autoHatch: false, eggTakeAll: false, eggBerry: false, shinyBerry: false, autoJump: false });
          note('info', '已从悬浮看板关闭培育屋监测与取蛋差事（要再开去插件面板勾选）');
        }
      });
    } catch (e) { return null; }
  }
  /* v1.26：找「最近一颗闪光」的亲代（和悬浮看板同一口径：三类里 k 最小者），
   * 返回 { k, parent:{id,shiny,slot,uid}, cat }，供金框与看板共用。 */
  function nearestFlash(np) {
    try {
      var src = [
        [np && np.shinyList, '闪光亲代'],
        [np && np.flipShinyList, '吃果闪光亲代'],
        [np && np.plainList, '普通亲代']
      ];
      var pick = null, cat = '';
      for (var i = 0; i < src.length; i++) {
        var arr = src[i][0] || [];
        for (var j = 0; j < arr.length; j++) {
          var it = arr[j];
          if (!it || !Number.isFinite(it.k)) continue;
          if (!pick || it.k < pick.k) { pick = it; cat = src[i][1]; }
        }
      }
      if (pick && pick.parent) return { k: pick.k, parent: pick.parent, cat: cat };
      /* 下一颗即闪、且列表里还没排到时，用 next.parent 兜底 */
      if (np && np.next && np.next.plainShiny && np.next.parent) {
        return { k: np.next.k, parent: np.next.parent, cat: '本颗即闪' };
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  /* v1.26：给培育屋里「最近闪光」对应的亲代套金框。
   * 用独立 <style> 承载，选择器锁定 data-uid（游戏重绘卡片也不会丢），
   * 只在 uid 变化时改一次 DOM。关掉看板 / 不在培育屋页则撤掉金框。 */
  var FLASH_FRAME = { style: null, uid: '' };
  function paintFlashFrame(snap) {
    var uid = '';
    if (snap && snap.screen && D.cfg.hud) {
      var hit = nearestFlash(snap.nextShiny);
      if (hit && hit.parent && hit.parent.uid) uid = String(hit.parent.uid);
    }
    if (uid === FLASH_FRAME.uid) return;
    FLASH_FRAME.uid = uid;
    if (!FLASH_FRAME.style) {
      FLASH_FRAME.style = doc.createElement('style');
      FLASH_FRAME.style.setAttribute('data-pcg', 'nursery-flash-parent');
      (doc.head || doc.documentElement).appendChild(FLASH_FRAME.style);
    }
    var css = '';
    if (uid && /^[A-Za-z0-9_-]{1,40}$/.test(uid)) {
      css = '#pen-res .pen-res[data-uid="' + uid + '"]{' +
        'position:relative!important;outline:2px solid rgba(255,203,5,.95)!important;outline-offset:2px!important;border-radius:10px!important;' +
        'box-shadow:0 0 10px rgba(255,201,72,.65)!important}' +
        '#pen-res .pen-res[data-uid="' + uid + '"]::after{' +
        'content:"✦ 最近闪光";position:absolute;top:-8px;right:6px;z-index:3;' +
        'padding:1px 6px;border-radius:8px;font-size:10px;font-weight:800;line-height:1.5;' +
        'color:#3a2600;background:linear-gradient(100deg,#fff3b8,#ffd45a);' +
        'box-shadow:0 1px 4px rgba(0,0,0,.3);white-space:nowrap}';
    }
    FLASH_FRAME.style.textContent = css;
  }

  function nurseryHudSnap(s) {
    var lay = s.laying || {};
    var np = s.nextShiny || null;
    var eggs = (s.eggs || []).slice(0, 4);
    /* v1.23：下一颗闪光的产蛋序号 k（三类命中里最小者），供「下一颗闪光」格显示 */
    var nextFlashK = null;
    try {
      var gl = [np && np.shinyList, np && np.flipShinyList, np && np.plainList];
      for (var gi = 0; gi < gl.length; gi++) {
        var ga = gl[gi] || [];
        for (var gk = 0; gk < ga.length; gk++) {
          var gv = ga[gk] && ga[gk].k;
          if (!Number.isFinite(gv)) continue;
          if (nextFlashK === null || gv < nextFlashK) nextFlashK = gv;
        }
      }
    } catch (e) { /* ignore */ }
    var rows = eggs.map(function (e) {
      return {
        nm: e.name + (e.shiny ? ' ✦' : ''),
        sub: e.ready ? '可孵' : '',
        val: e.ready ? '' : fmtDur(e.remainMs),
        w: e.shiny ? 'sh' : ''
      };
    });
    /* v1.23：最近一颗闪光预测——三类（闪光亲代 / 吃果闪光亲代 / 普通亲代）按 k 取最近，
     * 一行直接写明「号位 + 宝可梦名 + 分类」，例如：最近闪光 3号位 独角犀牛 闪光亲代。 */
    try {
      var pick = null, pickCat = '';
      var src = [
        [np && np.shinyList, '闪光亲代'],
        [np && np.flipShinyList, '吃果闪光亲代'],
        [np && np.plainList, '普通亲代']
      ];
      for (var si = 0; si < src.length; si++) {
        var arr = src[si][0] || [];
        for (var ai = 0; ai < arr.length; ai++) {
          var it = arr[ai];
          if (!it || !Number.isFinite(it.k)) continue;
          if (!pick || it.k < pick.k) { pick = it; pickCat = src[si][1]; }
        }
      }
      if (pick) {
        var who = pick.parent && pick.parent.id ? (pick.parent.slot + '号位 ' + dexName(pick.parent.id)) : '';
        /* v1.25：悬浮窗「最近闪光」只写「号位 + 宝可梦 + 类别」，
         * 不再附「第 N 颗 / 再 N 颗」（这两截挪到 popup 的「下一颗闪光」格显示）。 */
        rows.unshift({
          nm: '✦ 最近闪光 ' + (who ? who + ' ' : '') + pickCat,
          sub: '',
          val: '',
          w: 'sh'
        });
      } else if (np && np.next && np.next.plainShiny) {
        rows.unshift({
          nm: '✦ 最近闪光 ' + ((np.next.parent && np.next.parent.id) ? (np.next.parent.slot + '号位 ' + dexName(np.next.parent.id)) : '') +
            ' 本颗即闪',
          sub: '',
          val: '',
          w: 'sh'
        });
      }
    } catch (e) { /* 预测不可用不影响看板 */ }
    rows.push({
      nm: '生蛋进度',
      sub: lay.active ? (lay.pct + '%') : '未开始',
      val: lay.active ? (lay.cycleLabel + ' 一轮') : ''
    });
    var stats = s.stats || {};
    var shiny = s.shiny || {};
    var cfg = s.cfg || {};
    /* 取蛋两种模式互斥（autoHatch / eggTakeAll），看板只标当前生效的那个 */
    var autoTag = '';
    if (cfg.eggTakeAll) autoTag += ' · 自动取蛋（含闪光）';
    else if (cfg.autoHatch) autoTag += ' · 自动取蛋（只取非闪光）';
    if (cfg.eggBerry) autoTag += ' · 催蛋吃果';
    if (cfg.shinyBerry) autoTag += ' · 靛莓果闪光';
    var foot = '累计孵化 ' + ((s.game && s.game.hatched) || 0) +
      ' · 观测 ' + (stats.eggsSeen || 0) + ' 颗蛋 / 闪光 ' + (stats.shinySeen || 0) +
      ' · 理论 ' + (shiny.label || '—') +
      ((s.clock && s.clock.src === 'local') ? ' · 倒计时按本机时间估算' : '') + autoTag;
    return {
      star: s.summary.shinyEggs ? '✦ ' + s.summary.shinyEggs : '',
      cells: [
        ['蛋位', s.slots.eggs + ' / ' + s.slots.maxEggs],
        ['可孵 / 闪光', s.summary.ready + ' / ' + s.summary.shinyEggs, s.summary.shinyEggs ? 'gold' : ''],
        /* v1.25：「下一颗闪光」显示相对颗数「再过 N 颗」（N = k - laid），不再是产蛋序号 */
        ['下一颗闪光', (function () {
          if (nextFlashK == null) return '—';
          var lk = Number.isFinite(np && np.laid) ? np.laid : null;
          if (lk == null) return '第 ' + nextFlashK + ' 颗';
          var st = Math.max(0, nextFlashK - lk);
          return st === 0 ? '下一颗' : ('再过 ' + st + ' 颗');
        })()],
        ['孵蛋 K', Number.isFinite(np && np.laid) ? String(np.laid) : '—']
      ],
      rows: rows,
      empty: eggs.length ? '' : '培育屋里还没有蛋',
      foot: foot,
      footOn: !!s.summary.shinyEggs
    };
  }
  function hudPaint(snap, force) {
    var P = hudPanel();
    if (!P) return;
    if (!D.cfg.hud || !snap || !(D.cfg.hudAlways || snap.screen)) { P.hide(); return; }
    P.set(nurseryHudSnap(snap)).show();
    void force;                        // 统一看板自己按签名去重，这里不用强刷
  }

  /* ---------------- 自动收蛋（只取非闪光蛋；默认关） ---------------- */

  /* 第七十九批：只把**真正显示出来的**弹窗当障碍。
   * 游戏关掉的弹窗节点常常还留在 #modal-root 里（content.js 的 modalVisible() 早踩过
   * 这个坑），这里原来用 querySelector 一判「存在」就 return —— 只要游戏弹过一次窗，
   * 自动收蛋就再也不点了：玩家看到的就是「只补果子、一颗蛋都不收」。 */
  function modalShown() {
    var mr = doc.getElementById('modal-root');
    if (!mr) return false;
    var mods = mr.querySelectorAll('.modal');
    for (var i = 0; i < mods.length; i++) {
      var el = mods[i];
      if (el.getClientRects && el.getClientRects().length) return true;
    }
    return false;
  }

  /* 这一拍为什么没收蛋：写到 D.eggWhy，面板上直接看得到，不用再让玩家猜 */
  function eggWhy(text) {
    if (D.eggWhy !== text) D.eggWhy = text;
  }

  /* 第七十九批：收蛋不再用 hostBusy() 做闸（页面就在培育屋页时它只会自己卡自己）。
   * 函数保留：面板 / 冒烟测试还能查到「页面此刻被别人占着 / 别人正等着用」。 */
  function hostBusy() {
    try {
      /* 第七十五批：只看「页面此刻是不是被别人占着 / 别人正等着用」——
       * 培育屋的切页优先级比六个自动化任务高，所以不再因为「图鉴捕捉开着」就整趟
       * 不取蛋（那只会在图鉴刷一整天的时候把取蛋彻底堵死）。真正防止两边打架的是
       * content.js 那张页面租约：别人正在切页、或已经喊话要用页面，我们才等。 */
      if (pageBusy()) return true;
      var h = root.PCG_DEX_HOST;
      if (h && typeof h.busy === 'function' && h.busy()) return true;
      if (h && typeof h.screenBusy === 'function' && h.screenBusy()) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  /* 「只取非闪光蛋」用的保守判定：宁可少孵，绝不误孵闪光。
   * 旧存档明确写 shiny === false / 0 的按原规则；其余一律交给 eggIsShiny（含新蛋 k 分支）。
   * 蛋读不到、或连 k / uid / laidAt 都没有（无法判定）时当闪光处理 —— 不碰它。
   * 注意：不能再用「没有 uid 就当闪光」的老写法，新蛋是靠 k 判的，那样会全判成闪光。 */
  function isPlainEgg(egg, save) {
    if (!egg || typeof egg !== 'object') return false;
    if (Object.prototype.hasOwnProperty.call(egg, 'shiny')) {
      return egg.shiny === false || egg.shiny === 0;
    }
    var canJudge = (typeof egg.k === 'number' && isFinite(egg.k) && Math.floor(egg.k) === egg.k) ||
      egg.uid != null || egg.laidAt != null;
    if (!canJudge) return false;
    return !eggIsShiny(egg, save);
  }

  var HATCH = {
    tries: {},                 // uid -> 已尝试次数（PC 满了等失败最多 2 次）
    gaveUp: {},                // uid -> 已经报过「点了没反应」，日志只刷一次
    lastHatchAt: 0
  };
  var HATCH_MAX_TRIES = 2;
  var HATCH_GAP_MS = 5000;

  function autoHatchTick() {
    /* eggTakeAll（取所有蛋，包括闪光）是 autoHatch（只取非闪光蛋）的超集：
     * 两个都没开就不动。 */
    var takeAll = !!D.cfg.eggTakeAll;
    if (!D.cfg.autoHatch && !takeAll) { eggWhy('自动收蛋没开'); return; }
    /* 第七十九批：门槛只剩「页面真的停在培育屋」。以前这里有两条会把收蛋永久卡死：
     *   · hostBusy()：页面就在培育屋页时，别人的「占页面」只是还没发生的切页，点了
     *     照样生效；更要命的是它里头含 nurseryBusy()（就是自己），会自己卡自己；
     *   · BERRY.busy：催蛋一次能连点几十颗（每颗最多等 2.5 秒），整段时间收蛋全停。
     * 现在收蛋优先于催蛋：页面在眼前就点，催蛋那边见到可孵的蛋会主动让路。 */
    if (!penActive()) { eggWhy('页面不在培育屋'); return; }
    if (Date.now() - HATCH.lastHatchAt < 5000) return;
    if (modalShown()) { eggWhy('有弹窗挡着'); return; }
    var box = q(Q.eggs);
    if (!box) { eggWhy('培育屋还没渲染'); return; }
    var ready = qa(Q.eggReady, box);
    if (!ready.length) { eggWhy(''); return; }

    /* 只取非闪光蛋模式：拿最新存档核对，只点「存档明确不是闪光」的蛋。
     * 取所有蛋模式：不过滤，闪光蛋也一起收。 */
    var save = readSave(true);
    var raw = (save && save.pension && save.pension.eggs) || [];
    var byUid = {};
    for (var r = 0; r < raw.length; r++) {
      if (raw[r] && raw[r].uid != null) byUid[String(raw[r].uid)] = raw[r];
    }
    /* 第七十九批：「只取非闪光」多一层兜底 —— 整批蛋里一颗闪光都没有时，收哪一颗都
     * 安全，就不必死抠 uid 对不对得上。以前 uid 一旦对不上（蛋卡有 .ready、存档里
     * 找不到同 uid），判定恒为「不确定」→ 一颗也不点，看起来就是「只补果子不收蛋」。 */
    var anyShiny = false;
    for (var q0 = 0; q0 < raw.length; q0++) {
      if (eggIsShiny(raw[q0], save)) { anyShiny = true; break; }
    }

    for (var i = 0; i < ready.length; i++) {
      var card = ready[i];
      if (card.classList.contains('hatching')) continue;
      var uid = String(card.getAttribute('data-egg') || '');
      var egg = byUid[uid];
      if (!takeAll && anyShiny && !isPlainEgg(egg, save)) {
        /* 只取非闪光：闪光 / 读不到存档的不碰 */
        if (!egg) eggWhy('只取非闪光：这颗蛋在存档里对不上 uid，先不碰');
        else eggWhy('只取非闪光：这颗是闪光蛋');
        continue;
      }
      if ((HATCH.tries[uid] || 0) >= HATCH_MAX_TRIES) {   // 点过两次还不行：放弃这枚
        if (!HATCH.gaveUp[uid]) {
          HATCH.gaveUp[uid] = 1;
          eggWhy('这颗蛋点了 2 次没反应，先放弃');
          pushEvent('auto', '这颗蛋点了 2 次都没反应（可能有弹窗 / 页面还没渲染），先跳过', false);
        }
        continue;
      }
      HATCH.tries[uid] = (HATCH.tries[uid] || 0) + 1;
      HATCH.lastHatchAt = Date.now();
      D.lastHatchAt = Date.now();
      eggWhy('');
      try {
        card.click();
        D.stats.autoHatched++;
        storeSet(STATS_KEY, D.stats);
        pushEvent('auto', takeAll
          ? '自动取走一颗蛋（取所有蛋模式）'
          : '自动取走非闪光蛋（第 ' + HATCH.tries[uid] + ' 次尝试）', false);
        note('info', takeAll ? '自动取走一颗蛋（含闪光模式）' : '自动取走一颗非闪光蛋');
        /* 首次孵出会弹图鉴卡：最长等 12 秒，弹窗出现就替玩家点掉主按钮，
         * 不然它会一直挡着下一颗（作者旧版这里是留着让玩家手点）。 */
        (function () {
          var deadline = Date.now() + 12000;
          var waitModal = root.setInterval(function () {
            var gone = !box.isConnected ||
              !box.querySelector('.pen-egg[data-egg="' + uid + '"].ready');
            var modal = q('#modal-root.open .modal.dexcard-modal') || q('#modal-root.open .modal');
            if (modal) {
              var mbtn = modal.querySelector('.modal-actions .btn.gold') ||
                modal.querySelector('.modal-actions .btn') ||
                modal.querySelector('.modal-actions button') ||
                modal.querySelector('button.btn.gold') ||
                modal.querySelector('button.btn');
              if (mbtn) {
                try { mbtn.click(); } catch (e2) { /* ignore */ }
                root.clearInterval(waitModal);
              }
              return;
            }
            if (gone || Date.now() > deadline) root.clearInterval(waitModal);
          }, 400);
        })();
      } catch (e) { /* ignore */ }
      return;                     // 一秒只点一颗，下一颗等下一轮
    }
  }

  /* ---------------- 催蛋：吃果子把 4 个蛋槽填满（默认关） ----------------
   * 取蛋之后槽位空了：产蛋进度还差多少分钟就读出来，按性价比物理点击
   * #pen-berries 里的果子按钮（橙橙 5 分 / 桃桃 15 分 / 文柚 30 分），
   * 游戏会把每颗的收益钳制在剩余进度内。一直吃到 4 槽全满或果子耗尽。 */
  var BERRY = { busy: false };
  var BERRY_ORDER = ['berry-sitrus', 'berry-pecha', 'berry-oran'];   // 大 → 小
  var BERRY_MIN = { 'berry-oran': 5, 'berry-pecha': 15, 'berry-sitrus': 30 };
  var BERRY_MAX_CLICKS = 80;

  function saveFresh() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  /* v1.33：按游戏真实绑定派发事件（已用 CDP 在 app.ac708615ae.js 实测）：
   *   · 普通果子按钮：M.onpointerdown = e => { if(e.button>0)return; e.preventDefault(); B(btn,id) }
   *                    M.onclick = e => { if(e.detail===0) ta(id) }
   *     其中 B() 是「立即吃一颗 + 开长按连点定时器」，定时器由全局 pointerup 清除。
   *     v1.32 同时派发 pointerdown + click，结果同一颗吃两次（实测 oran 一次 -2），
   *     berryFill 的「果子 -1」校验虽仍能过，但白白浪费一倍库存。
   *     正确做法：只派发一次 pointerdown + 全局 pointerup —— 实测精确吃 1 颗。
   *   · 靛莓果按钮：addEventListener('click', Se)，只认 click，用 .click() 即可。
   * 两种按钮走不同分支，避免重复扣库存。 */
  function physicalClick(btn, isMyrte) {
    if (!btn) return false;
    if (isMyrte) {
      try { btn.click(); } catch (e) { return false; }
      return true;
    }
    try {
      var r = btn.getBoundingClientRect ? btn.getBoundingClientRect() : null;
      var cx = r ? (r.left + r.width / 2) : 0, cy = r ? (r.top + r.height / 2) : 0;
      var evInit = { bubbles: true, cancelable: true, composed: true, button: 0, buttons: 1,
        clientX: cx, clientY: cy, pointerId: 1, pointerType: 'mouse', isPrimary: true };
      var PE = root.PointerEvent || (root.MouseEvent);
      if (PE) {
        try { btn.dispatchEvent(new PE('pointerdown', evInit)); } catch (e) { /* ignore */ }
        /* pointerdown 会启动长按连点定时器；立刻在 window/document/btn 上派发 pointerup
         * 清掉它，保证只吃这一颗。实测这条路径稳定 = 1 颗。 */
        var upInit = Object.assign({}, evInit, { buttons: 0 });
        [root, root.document, btn].forEach(function (t) {
          if (!t) return;
          try { t.dispatchEvent(new PE('pointerup', upInit)); } catch (e) { /* ignore */ }
        });
      } else {
        /* 极老的浏览器没有 PointerEvent：退回 click（旧版 onclick 兜底） */
        try { btn.click(); } catch (e) { return false; }
      }
    } catch (e) { /* ignore */ }
    return true;
  }

  function gaugeInfo() {
    var save = saveFresh();
    var pen = (save && save.pension) || {};
    var mons = pen.mons || [];
    var layers = 0, ditto = false;
    for (var i = 0; i < mons.length; i++) {
      var m = (mons[i] && mons[i].mon) || {};
      if (num(m.id, 0) === K.DITTO) ditto = true;
      else if (!m.noEgg && K.NO_EGG.indexOf(num(m.id, 0)) < 0) layers++;
    }
    var goal = layers ? K.EGG_MS : 0;
    var items = (save && save.items) || {};
    var counts = {};
    for (var j = 0; j < BERRY_ORDER.length; j++) {
      counts[BERRY_ORDER[j]] = num(items[BERRY_ORDER[j]], 0);
    }
    return {
      ditto: ditto,
      layers: layers,
      goalMs: goal,
      elapsedMs: num(pen.egg, 0),
      remainMs: Math.max(0, goal - num(pen.egg, 0)),
      eggs: (pen.eggs || []).length,
      full: (pen.eggs || []).length >= K.INCUBATOR,
      counts: counts
    };
  }

  /* 性价比选果：优先「正好装得下剩余进度」的最大的果（点击少、零浪费）；
   * 剩余不足 5 分钟时用最小的果冲线（浪费 ≤4 分钟，不可避免）。 */
  function pickBerry(remainMs, counts) {
    var remainMin = remainMs / 60000;
    for (var i = 0; i < BERRY_ORDER.length; i++) {
      var id = BERRY_ORDER[i];
      if ((counts[id] || 0) > 0 && BERRY_MIN[id] <= remainMin) return id;
    }
    for (var j = BERRY_ORDER.length - 1; j >= 0; j--) {
      var id2 = BERRY_ORDER[j];
      if ((counts[id2] || 0) > 0) return id2;
    }
    return null;
  }

  function berryReady(g) {
    return g.ditto && !g.full && g.goalMs > 0;
  }

  async function berryFill() {
    var g = gaugeInfo();
    if (!berryReady(g)) return;               // 没百变怪 / 槽满 / 没有能生蛋的：点了也白点
    var clicks = 0;
    try {
      for (var i = 0; i < BERRY_MAX_CLICKS; i++) {
        g = gaugeInfo();
        if (!berryReady(g) || g.remainMs <= 0) break;
        /* 第七十九批：中途出现可孵的蛋就停手，让收蛋先把槽位腾出来 */
        var eggsNow = q(Q.eggs);
        if (eggsNow && qa(Q.eggReady, eggsNow).length) break;
        var id = pickBerry(g.remainMs, g.counts);
        if (!id) {
          pushEvent('berry', '催蛋：果子不够了，蛋槽还差 ' + Math.ceil(g.remainMs / 60000) + ' 分', false);
          note('warn', '果子不够，蛋槽还差 ' + Math.ceil(g.remainMs / 60000) + ' 分钟');
          break;
        }
        var btn = q('#pen-berries button[data-berry="' + id + '"]');
        if (!btn || btn.disabled) break;
        var before = g.counts[id] || 0;
        var eggsBefore = g.eggs;
        var elapsedBefore = g.elapsedMs;
        var remainMinBefore = Math.ceil(g.remainMs / 60000);
        try { physicalClick(btn); } catch (e) { break; }
        clicks++;
        // 等存档反映这次点击（果子 -1 / 蛋 +1 / 进度 +），没动静就停手
        var ok = await (function () {
          var deadline = Date.now() + 2500;
          return new Promise(function (resolve) {
            var poll = root.setInterval(function () {
              var g2 = gaugeInfo();
              if ((g2.counts[id] || 0) < before || g2.eggs > eggsBefore || g2.elapsedMs > elapsedBefore) {
                root.clearInterval(poll); resolve(true);
              } else if (Date.now() > deadline) {
                root.clearInterval(poll); resolve(false);
              }
            }, 150);
          });
        })();
        if (!ok) {
          pushEvent('berry', '催蛋：吃果子没生效，先停手', false);
          note('warn', '吃果子没生效，先停下来');
          break;
        }
      }
      if (clicks > 0) {
        D.stats.autoFed = num(D.stats.autoFed, 0) + clicks;
        storeSet(STATS_KEY, D.stats);
        pushEvent('berry', '催蛋：物理吃了 ' + clicks + ' 颗果子（蛋槽 ' + gaugeInfo().eggs + '/' + K.INCUBATOR + '）', false);
        note('info', '催蛋吃了 ' + clicks + ' 颗果子');
      }
    } catch (e) { /* ignore */ }
  }

  /* v1.25：「下一颗能出吃果闪光亲代 → 先喂靛莓果」的判断。
   * 条件全满足才返回 true：
   *   ① 开关 shinyBerry 打开；② 当前没有已喂、待结算的 bx；
   *   ③ 下一颗蛋（k=laid，step 0）不吃果不闪、吃果才闪，且抽到的亲代是闪光；
   *   ④ 背包里有靛莓果。判定的哈希/阈值全部复用 nextShinyInfo，和面板预测同一套。 */
  function shinyBerryPending() {
    if (!D.cfg.shinyBerry) return null;
    var save = saveFresh();
    if (!save || !save.pension) return null;
    var pen = save.pension;
    if (pen.bx) return null;                            // 已经喂过、下一颗就已 ×2，别重复喂
    var items = (save && save.items) || {};
    if (num(items[K.SHINY_BERRY], 0) <= 0) return null; // 没有靛莓果
    var np = nextShinyInfo(save);
    if (!np || !np.next) return null;
    var nx = np.next;
    /* 吃果才闪：不吃不闪(!plainShiny)、吃果会闪(bxShiny)，且这颗的亲代是闪光 → 吃果闪光亲代 */
    if (nx.plainShiny || !nx.bxShiny) return null;
    if (!nx.parent || !nx.parent.shiny) return null;
    return { k: nx.k, slot: nx.parent.slot, item: K.SHINY_BERRY };
  }

  /* 物理点一下靛莓果按钮（game 的 baie-myrte：feedDittoBerry() 设 pension.bx=1），
   * 等到存档里 bx 变成 1（或超时）再返回。返回是否成功。 */
  async function feedShinyBerry() {
    var btn = q('#pen-berries button[data-myrte]');
    if (!btn || btn.disabled) return false;
    var beforeSave = saveFresh();
    var before = num((beforeSave && beforeSave.pension && beforeSave.pension.bx) || 0, 0);
    try { physicalClick(btn, true); } catch (e) { return false; }
    var ok = await (function () {
      var deadline = Date.now() + 2500;
      return new Promise(function (resolve) {
        var poll = root.setInterval(function () {
          var sv = saveFresh();
          var bx = sv && sv.pension && sv.pension.bx;
          if (bx && !before) { root.clearInterval(poll); resolve(true); }
          else if (Date.now() > deadline) { root.clearInterval(poll); resolve(false); }
        }, 150);
      });
    })();
    if (ok) {
      D.stats.autoFed = num(D.stats.autoFed, 0) + 1;
      storeSet(STATS_KEY, D.stats);
    }
    return ok;
  }

  function berryTick() {
    if (!D.cfg.eggBerry && !D.cfg.shinyBerry) return;
    if (BERRY.busy) return;
    /* 第七十九批：有蛋孵好了就先让给收蛋 —— 收蛋要腾槽位，催蛋是往槽位里塞，
     * 两边抢着干只会白吃果子（玩家看到的「蛋槽 3/4、一直吃果子不收蛋」）。 */
    var eggsBox = q(Q.eggs);
    if (eggsBox && qa(Q.eggReady, eggsBox).length) return;
    if (!q('#pen-berries button[data-berry]')) return;   // 培育屋页面没渲染，不切

    /* v1.25：先看「下一颗是否吃果才闪的闪光亲代」。是的话先喂靛莓果（独立开关），
     * 再按原逻辑催蛋填槽。没开催蛋、但开了这个开关时，也会单独把靛莓果喂下去。 */
    var pending = shinyBerryPending();
    var g = gaugeInfo();
    var canFill = D.cfg.eggBerry && berryReady(g) && g.remainMs > 0;
    if (!pending && !canFill) return;
    BERRY.busy = true;
    var chain = Promise.resolve();
    if (pending) {
      chain = chain.then(function () {
        return feedShinyBerry().then(function (ok) {
          if (ok) {
            pushEvent('berry', '下一颗（k=' + pending.k + '，' + pending.slot + '号位闪光亲代）先喂了靛莓果，闪光 ×2', true);
            note('info', '下一颗是吃果闪光亲代，已喂靛莓果');
          }
        });
      });
    }
    if (canFill) chain = chain.then(berryFill);
    chain.then(function () { BERRY.busy = false; })
      .catch(function () { BERRY.busy = false; });
  }

  /* ---------------- 取蛋差事：检测到可孵蛋，自动跑一趟培育屋 ----------------
   * 流程：检测到可孵蛋 → 自动切到培育屋页 → 领蛋 → （开了催蛋就）填满蛋槽 → 切回冒险页。
   * 自己切过去的页才自动送回；玩家本来就在培育屋页时只帮点蛋，不动导航。
   * 三道闸：
   *   A. 蛋槽满 4 且全是闪光、没开「取所有蛋」：一趟都不跑。
   *   B. 催蛋时三种果子库存全 0、槽还没满：不等了，立刻切回冒险页。
   *   C. 联盟刷钱「未通关联盟冠军」运行中、打到第 3/4 位：不去取蛋，
   *      等这轮重进联盟回到第 1/2 位再去（防误通关、1.8 倍赏金没了）。 */
  var ERRAND = { phase: 'idle', auto: false, tries: 0, at: 0, tookAt: 0, berryTries: 0, wantAt: 0, lastWantAt: 0 };

  /* ---------------- 第七十五批：页面租约（切页仲裁） ----------------
   * 培育屋监测干的是**切页**的活：冒险页 ⇄ 培育屋页，过去取蛋 / 催蛋 / 再送回来。
   * 这十几秒页面归我们，六个自动化任务（图鉴捕捉 / 传说追踪 / 稀有道具刷取 /
   * 树果刷取 / 联盟刷钱 / 定点循环）一律停手等着，谁也不许趁这几秒把页面拽走；
   * 反过来，别人正在切页（`pageBusy()` 为真）时我们也不硬抢，最多等一拍（2 秒）
   * 让人家把手里这一步走完 —— 培育屋优先级更高，但打断别人正在点的按钮只会两败俱伤。
   *
   * 桥由 content.js 提供（PCG_SCREEN_HOST，优先级 2 = 高）；拿不到桥（老页面还没
   * 重新注入、或某次改动漏了挂载）就退化成原来的行为，绝不因为桥缺失卡死自己。 */
  function pageCall(name, a, b) {
    try {
      var h = root.PCG_SCREEN_HOST;
      if (!h || typeof h[name] !== 'function') return false;
      return h[name](a, b);
    } catch (e) { return false; }
  }
  function pageBusy() { return !!pageCall('busy', 'nursery'); }
  function pageWant() { return pageCall('want', 'nursery'); }
  function pageHold(ms) { return pageCall('hold', 'nursery', ms); }
  function pageFree() { pageCall('free', 'nursery'); }

  /* 别人正在切页时最多让多久：2 秒一拍的东西，等两拍就够它把当前这一步走完 */
  var PAGE_WAIT_MS = 2500;

  function farmUnclearedBlock() {
    try {
      var st = root.PCG_FARM_STATE ? root.PCG_FARM_STATE() : null;
      if (!st || !st.on || st.mode !== 'uncleared') return false;
      var ch = Number(st.ch);
      var SPAN = [[9, 13], [25, 29], [43, 47], [60, 64]];   // 四地区联盟章（0 起下标）
      for (var i = 0; i < SPAN.length; i++) {
        if (ch >= SPAN[i][0] && ch <= SPAN[i][1]) return (ch - SPAN[i][0] + 1) >= 3;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function navTo(name) {
    var t = doc.querySelector('#side [data-screen="' + name + '"], #tabs [data-screen="' + name + '"]');
    if (!t) return false;
    try { t.click(); } catch (e) { return false; }
    return true;
  }

  function goBackFromErrand(why) {
    if (why) { pushEvent('errand', why, false); note('warn', why); }
    navTo('adventure');
    /* 第七十五批：回到冒险页就把页面交还，六个自动化可以接着切了 */
    pageFree();
    ERRAND.phase = 'idle';
    ERRAND.auto = false;
    ERRAND.wantAt = 0;
    ERRAND.lastWantAt = 0;
  }

  function eggErrandTick() {
    var takeAll = !!D.cfg.eggTakeAll;
    /* v1.33：原来这里只在「自动取蛋」开关打开时才继续——于是只开「催蛋吃果 /
     * 靛莓果闪光」、没开取蛋的用户，蛋位再空也一步都不走。把催蛋类开关也算作
     * 「有要办的事」，让它们同样能走完整的切页差事。 */
    if (!D.cfg.autoHatch && !takeAll && !D.cfg.eggBerry && !D.cfg.shinyBerry) {
      ERRAND.phase = 'idle'; ERRAND.auto = false; ERRAND.wantAt = 0; ERRAND.lastWantAt = 0; return;
    }

    var save = readSave(true);
    var eggs = (save && save.pension && save.pension.eggs) || [];
    var nowMs = Date.now();

    /* 闸 A：满 4 颗全是闪光、没开「取所有蛋」→ 一趟都不跑 */
    if (eggs.length >= 4 && !takeAll) {
      var anyPlain = false;
      for (var a = 0; a < eggs.length; a++) { if (isPlainEgg(eggs[a], save)) { anyPlain = true; break; } }
      if (!anyPlain) {
        if (ERRAND.auto) goBackFromErrand('蛋槽全是闪光蛋（未开「取所有蛋」），先回冒险页');
        ERRAND.phase = 'idle'; ERRAND.auto = false;
        return;
      }
    }

    /* 闸 C：未通关联盟冠军模式打到第 3/4 位 → 等重开回第 1/2 位再取 */
    if (farmUnclearedBlock()) {
      if (ERRAND.auto) goBackFromErrand('联盟在第 3/4 位，暂停取蛋，先回冒险页');
      ERRAND.phase = 'idle'; ERRAND.auto = false;
      return;
    }

    /* 存档判定有蛋可取（本机时间估算；到了培育屋页以游戏 DOM 的 .ready 为准） */
    var readyCnt = 0;
    for (var r = 0; r < eggs.length; r++) {
      var hatch = num(eggs[r] && eggs[r].hatchAt, 0);
      if (hatch > 0 && nowMs >= hatch && (takeAll || isPlainEgg(eggs[r], save))) readyCnt++;
    }

    /* v1.33 —— 催蛋失效的根因就在这里：
     * 过去人不在培育屋页时，只有「有蛋可取(readyCnt>0)」才出发。玩家挂机在冒险页、
     * 蛋位没满(如 1/4)、又没有可孵的蛋(0/0)时，这里直接 return，永远不切过去催蛋，
     * berryTick() 又因为培育屋 DOM 没渲染而 return，于是「催蛋吃果」形同虚设。
     * 现在把「蛋位没满 + 产蛋进度未满 + 有果子」也算作要去的理由；同样，
     * 「下一颗要喂靛莓果」也值得跑这一趟。 */
    var gNeed = gaugeInfo();
    var hasAnyBerry = !!(gNeed.counts['berry-oran'] > 0 || gNeed.counts['berry-pecha'] > 0 || gNeed.counts['berry-sitrus'] > 0);
    var needFeed = !!D.cfg.eggBerry && berryReady(gNeed) && gNeed.remainMs > 0 && hasAnyBerry;
    var needShiny = !!D.cfg.shinyBerry && !!shinyBerryPending();

    if (!penActive()) {
      /* 人不在培育屋页：有蛋可取 / 要催蛋 / 要喂靛莓果，任一成立就出发 */
      if (!readyCnt && !needFeed && !needShiny) {
        ERRAND.phase = 'idle'; ERRAND.auto = false; ERRAND.wantAt = 0; ERRAND.lastWantAt = 0; return;
      }
      var fs = root.PCG_FARM_STATE ? root.PCG_FARM_STATE() : null;
      if (fs && fs.busy) return;                 // 联盟刷钱正在切图，别跟它抢页面
      /* 本版多一个「有要办的事就自动切过去」开关：关掉就只在你已经打开的培育屋页里帮点，
       * 绝不主动换页（老用户习惯用这个开关刹住自动化）。 */
      if (!D.cfg.autoJump) { ERRAND.phase = 'idle'; ERRAND.auto = false; ERRAND.wantAt = 0; ERRAND.lastWantAt = 0; return; }

      /* 第七十五批：这一趟要切页了 —— 先喊话，再按规矩来。
       *   ① 第一次来这里先喊一声「我要用页面了」（25 秒后自动过期，不怕忘了收）；
       *   ② 别人正在切页就等，最多等两拍（≈2.5 秒），让六个自动化把手里这一步走完；
       *   ③ 等够了就切过去并占住页面，从切过去到回冒险页这段谁也抢不走。 */
      /* 第七十九批：喊话只喊一次，最多 20 秒补喊一次。
       * 以前这里每拍都 pageWant()（sample 每秒一拍），只要「有蛋可取但一时切不过去」，
       * 「我要用页面了」就被无限续期 —— 六个自动化永远看到「让路：培育屋监测在切页」，
       * 明明培育屋一步都没走，别的功能却全部停在原地。 */
      if (!ERRAND.lastWantAt || nowMs - ERRAND.lastWantAt > 20000) {
        pageWant();
        ERRAND.lastWantAt = nowMs;
      }
      if (!ERRAND.wantAt) ERRAND.wantAt = nowMs;
      /* 连续 90 秒都抢不到页面就先放弃这一轮，把喊话信号撤掉，绝不长期占着 */
      if (nowMs - ERRAND.wantAt > 90000) {
        ERRAND.phase = 'idle'; ERRAND.auto = false; ERRAND.wantAt = 0; ERRAND.lastWantAt = 0;
        pageFree();
        pushEvent('errand', '页面一直抢不到，这一轮先放弃，过一会儿再试', false);
        return;
      }
      if (pageBusy() && nowMs - ERRAND.wantAt < PAGE_WAIT_MS) {
        ERRAND.phase = 'wait';
        return;
      }
      if (ERRAND.phase !== 'go') { ERRAND.phase = 'go'; ERRAND.tries = 0; }
      /* 第七十九批：先拿页面再切 —— 地下通道刚开始办事（同优先级 20 秒内）时让它先办完，
       * 下一拍再来。以前是先切页后占页面，等于当场把页面从别人手里拽走。 */
      if (!pageHold(90000)) {
        ERRAND.phase = 'wait';
        return;
      }
      if (navTo('pension')) {
        ERRAND.wantAt = 0;                       // 这一轮「等别人走完」的计时到此结束
        ERRAND.auto = true;                      // 自己切来的，取完送回去
        ERRAND.phase = 'take';
        ERRAND.at = nowMs;
        ERRAND.tookAt = 0;
        ERRAND.berryTries = 0;
        var errandWhy = readyCnt ? ('检测到可孵蛋（' + readyCnt + ' 颗），自动去培育屋')
          : (needShiny ? '下一颗要喂靛莓果，自动去培育屋' : '蛋位没满、有果子，自动去培育屋催蛋');
        pushEvent('errand', errandWhy, false);
        note('info', readyCnt ? '有蛋可孵，自动去培育屋取' : '自动去培育屋催蛋/喂果');
      } else {
        ERRAND.tries++;
        if (ERRAND.tries > 3) {
          ERRAND.phase = 'idle'; ERRAND.auto = false; ERRAND.wantAt = 0;
          pageFree();
          pushEvent('errand', '培育屋入口没找到，放弃本轮取蛋', false);
        } else {
          /* 没切过去的这一拍立刻把页面还回去，别空占着 90 秒 */
          pageFree();
        }
      }
      return;
    }

    /* 人已在培育屋页 */
    /* 第七十九批 —— 这条是「其他功能一直让路」的根因：
     * 以前这里无条件 pageHold(45000)，而 sample() 每秒都调一次 eggErrandTick()，
     * 于是只要页面停在培育屋页，租约就被无限续下去（每 45 秒续一次、每秒重续），
     * 图鉴 / 传说 / 道具 / 树果 / 刷钱 / 定点全部卡在
     * 「让路：培育屋监测在切页」，一动不动 —— 其实培育屋早就没事干了。
     *
     * 现在只有「我们自己切过来办事」（ERRAND.auto）才占 / 续租；玩家自己停在培育屋页
     * 时我们只是顺手帮点蛋，不占页面，别人该切就切。办完 goBackFromErrand() 会
     * navTo('adventure') + pageFree()，立刻把页面还回去。 */
    if (ERRAND.auto) pageHold(45000);
    var h0 = D.stats.autoHatched;
    autoHatchTick();                             // 原逻辑：一颗一颗点，图鉴弹窗自动点掉
    if (D.stats.autoHatched > h0) ERRAND.tookAt = nowMs;
    var box = q(Q.eggs);
    var stillReady = box ? qa(Q.eggReady, box).length : 0;

    if (!stillReady) {
      if (!ERRAND.auto) return;
      /* 没取到过且刚来不久：可能还在渲染。取蛋要给 20 秒（蛋卡渲染慢），
       * 纯催蛋/喂果只等 2 秒（果子按钮渲染很快）——别让催蛋干等 20 秒。 */
      var renderWait = (D.cfg.eggBerry || D.cfg.shinyBerry) ? 2000 : 20000;
      if (!ERRAND.tookAt && nowMs - ERRAND.at <= renderWait) return;
      var g0 = gaugeInfo();
      /* 闸 B：想催蛋但三种果子全 0、槽还没满 → 不等了，回（berryFill 自己也会报一次） */
      var noBerry = !g0.counts['berry-oran'] && !g0.counts['berry-pecha'] && !g0.counts['berry-sitrus'];
      if (D.cfg.eggBerry && berryReady(g0) && g0.remainMs > 0 && !g0.full && !noBerry) {
        if (ERRAND.berryTries < 3 && nowMs - (ERRAND.berryAt || 0) > 6000) {
          ERRAND.berryTries++;
          ERRAND.berryAt = nowMs;
          berryTick();                           // 吃果子填槽，填完下一轮回
        } else if (ERRAND.berryTries >= 3) {
          goBackFromErrand('催蛋没进展，先回冒险页');
        }
        return;
      }
      goBackFromErrand();
      return;
    }
    /* 还有 ready 卡在点（一轮一颗 + 5 秒冷却），下一轮再看 */
  }

  /* 闪光蛋预测：纯读存档 + 本地哈希，不碰页面、不发请求、不改存档 */
  function nextShinyInfo(save) {
    try {
      var pen = save && save.pension;
      if (!pen) return null;
      var laid = Number.isFinite(pen.laid)
        ? pen.laid
        : ((+save.stats && +save.stats.hatched || 0) + (Array.isArray(pen.eggs) ? pen.eggs.length : 0));
      var goal = Number(pen.eggGoal) || 0;
      var bxNext = !!pen.bx;                       // 莓榴果：只影响下一颗
      var base = K.SHINY_RATE;
      var parentRate = 1 / 16;                     // 闪光亲代阈值（二创版口径）
      var mult = 2;                                // 吃莓榴果 ×2

      /* 可下蛋池（顺序即抽签顺序） */
      var pool = [];
      var hasDitto = false;
      var breedable = [];      // 所有非百变怪、且能下蛋的精灵（按槽位顺序）
      var allMons = [];        // 所有非百变怪精灵（含不能下蛋的，仅展示用）
      try {
        var roster = Array.isArray(pen.mons) ? pen.mons : [];
        for (var pi = 0; pi < roster.length; pi++) {
          var pm = roster[pi] && roster[pi].mon;
          if (!pm) continue;
          var pid = Number(pm.id) || 0;
          if (pid === K.DITTO) { hasDitto = true; continue; }
          allMons.push({ id: pid, shiny: !!pm.shiny, eligible: !(pm.noEgg || K.NO_EGG.indexOf(pid) >= 0) });
          if (pm.noEgg || K.NO_EGG.indexOf(pid) >= 0) continue;
          breedable.push({ uid: pm.uid, id: pid, shiny: !!pm.shiny });
        }
        /* 固定模型：0 号位百变怪，非百变怪依次 1 / 2 / 3 / 4 号位 */
        for (var bi = 0; bi < breedable.length; bi++) {
          pool.push({ uid: breedable[bi].uid, id: breedable[bi].id, shiny: breedable[bi].shiny, slot: bi + 1 });
        }
      } catch (e3) { /* ignore */ }

      function eta(i) { return goal > 0 ? i * goal : 0; }

      /* 按固定阈值扫 count 个（i 从 0 起；bx 只作用于第 0 颗） */
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
              row.parent = pp ? { id: pp.id, shiny: pp.shiny, slot: pp.slot, uid: pp.uid } : null;
            }
            out.push(row);
          }
        }
        return out;
      }

      /* 池模型：每颗按 r1 抽亲代，按亲代是否闪光定阈值 */
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
              row.parent = pool[idx2] ? { id: pool[idx2].id, shiny: pool[idx2].shiny, slot: pool[idx2].slot, uid: pool[idx2].uid } : null;
            }
            out.push(row);
          }
        }
        return out;
      }

      /* 下一颗（k=laid）在「不吃 / 吃莓榴果」下的真实对比 */
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
        var plainShiny = r0 < th;
        var bxShiny = r0 < th * mult;
        return {
          k: k, roll: r0, threshold: th, thresholdBx: th * mult,
          parent: par ? { id: par.id, shiny: par.shiny, slot: par.slot, uid: par.uid } : null,
          plainShiny: plainShiny, bxShiny: bxShiny,
          bxPending: bxNext
        };
      })();
      /* 吃果子才会闪：哈希落在 (原阈值, ×2 阈值] 之间的 k */
      var flipList = (function () {
        var out = [];
        var max = 2000;
        var N = pool.length;
        for (var i = 0; i < max && out.length < 20; i++) {
          var k = laid + i;
          var th = base;
          var par = null;
          if (N) {
            var idx = Math.floor(eggHash(trainerSeed(save) + '|egg|' + k + '|1') * N);
            par = pool[idx] || null;
            if (par && par.shiny) th = Math.max(parentRate, base);
          }
          var r0 = eggKHash(k, save);
          if (r0 >= th && r0 < th * mult) {
            out.push({ step: i, k: k, etaMs: eta(i), threshold: th, parent: par ? { id: par.id, shiny: par.shiny, slot: par.slot, uid: par.uid } : null });
          }
        }
        return out;
      })();
      /* 吃果子才会闪：roll 落在 [th, th×mult) 区间 */
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
              rowF.parent = ppF ? { id: ppF.id, shiny: ppF.shiny, slot: ppF.slot, uid: ppF.uid } : null;
            }
            out.push(rowF);
          }
        }
        return out;
      }
      var flipShinyList = scanFlip(Math.max(parentRate, base), 10);
      var flipPlainList = scanFlip(base, 10);
      var poolList = scanPool(10, 20000);
      var berryPoolList = scanPool(10, 20000, true);          // 假设现在吃一颗莓榴果
      var shinyList = scanFixed(Math.max(parentRate, base), 10, 20000);
      var plainList = scanFixed(base, 3, 50000);
      return {
        laid: laid,
        bx: bxNext,
        poolSize: pool.length,
        poolShiny: pool.filter(function (p) { return p.shiny; }).length,
        pool: pool,
        hasDitto: hasDitto,
        allMons: allMons,
        poolSlots: pool.map(function (p) { return p.slot; }),
        poolList: poolList,
        flipList: flipList,
        flipShinyList: flipShinyList,
        flipPlainList: flipPlainList,
        berryPoolList: berryPoolList,
        next: nextInfo,
        shinyList: shinyList,
        plainList: plainList,
        shiny: shinyList[0] || null,
        plain: plainList[0] || null,
        poolFirst: poolList[0] || null
      };
    } catch (e) { /* ignore */ }
    return null;
  }

  /* ---------------- 采样 / 对外状态 ---------------- */
  function sample(force) {
    var now = Date.now();
    if (!force && now - D.at < Math.max(1, D.cfg.sampleSec) * 1000) return D.snap;
    D.at = now;
    var save = readSave(force);
    var cards = domEggs();
    var parentCards = domParents();
    var snap = analyse(save, cards, parentCards, now);
    snap.screen = penActive();
    snap.nextShiny = nextShinyInfo(save);

    try {
      snap.game.dex = save && save.dex ? Object.keys(save.dex).length : 0;
      snap.game.seenShiny = save && save.seenShiny ? Object.keys(save.seenShiny).length : 0;
      snap.game.awayMs = num(save && save.stats && save.stats.awayMs, 0);
    } catch (e) { /* ignore */ }

    if (save) diffStats(snap);
    snap.stats = Object.assign({}, D.stats);
    snap.events = D.events.slice(0, 30);
    snap.cfg = Object.assign({}, D.cfg);
    snap.note = snap.ok
      ? (snap.screen ? '正在读培育屋页面' : '读的是游戏存档；打开培育屋页可校准倒计时')
      : '读不到游戏存档：先打开游戏页并登录';
    /* 第七十九批：把「这一拍为什么没收蛋」也带出去，面板上直接显示 */
    snap.eggWhy = D.eggWhy || '';
    snap.autoTag = (D.cfg.eggTakeAll ? '取所有蛋' : (D.cfg.autoHatch ? '只取非闪光蛋' : ''));
    snap.feeding = !!BERRY.busy;
    D.snap = snap;
    hudPaint(snap);
    try { paintFlashFrame(snap); } catch (e) { /* 金框失败不影响监测 */ }
    autoHatchTick();
    berryTick();
    eggErrandTick();
    return snap;
  }

  function state() {
    var snap = sample();
    if (!snap) return { ok: false, cfg: Object.assign({}, D.cfg), stats: Object.assign({}, D.stats), events: [] };
    return snap;
  }

  function sanitize(patch) {
    var p = patch || {};
    var out = Object.assign({}, D.cfg);
    var bools = ['hud', 'hudFold', 'hudAlways', 'shinyHint', 'autoHatch', 'eggTakeAll', 'eggBerry', 'shinyBerry', 'autoJump'];
    for (var i = 0; i < bools.length; i++) {
      var k = bools[i];
      if (p[k] != null) out[k] = !!p[k];
    }
    /* 旧存档 / 旧面板的键名兼容：autoHatchShiny = 取所有蛋，autoFeedEgg = 催蛋吃果。
     * 老用户升级上来不用重勾一遍。 */
    if (p.autoHatchShiny != null) out.eggTakeAll = !!p.autoHatchShiny;
    if (p.autoFeedEgg != null) out.eggBerry = !!p.autoFeedEgg;
    /* 「取所有蛋」和「只取非闪光蛋」互斥：后勾的那个赢 */
    if (p.eggTakeAll === true) out.autoHatch = false;
    if (p.autoHatch === true) out.eggTakeAll = false;
    if (p.autoHatchShiny === true) out.autoHatch = false;
    /* 面板仍按老键名读，这里回写一份镜像，popup.js / 看板文案都不用改 */
    out.autoHatchShiny = !!out.eggTakeAll;
    out.autoFeedEgg = !!out.eggBerry;
    /* 第九十七批：闪光蛋中文名 / 金色描边是默认行为，面板上没有开关了。
     * 这里钉死 true —— 旧配置里存过 false、或者哪条 patch 传了 false，都拉回来。 */
    out.shinyHint = true;
    out.sampleSec = clamp(Math.round(num(p.sampleSec, out.sampleSec)), 1, 30);
    return out;
  }

  function config(patch) {
    var changed = !!patch && Object.keys(patch).length > 0;
    /* 旧键名（autoHatchShiny / autoFeedEgg）先换成新键名，日志与去重才有意义 */
    if (patch && (patch.autoHatchShiny != null || patch.autoFeedEgg != null)) {
      patch = Object.assign({}, patch);
      if (patch.autoHatchShiny != null) {
        patch.eggTakeAll = !!patch.autoHatchShiny;
        delete patch.autoHatchShiny;
      }
      if (patch.autoFeedEgg != null) {
        patch.eggBerry = !!patch.autoFeedEgg;
        delete patch.autoFeedEgg;
      }
    }
    D.cfg = sanitize(patch);
    if (changed) {
      storeSet(CFG_KEY, D.cfg);
      if (patch.eggTakeAll != null) {
        note('info', patch.eggTakeAll ? '取所有蛋已开启（包括闪光）' : '取所有蛋已关闭');
        HATCH.tries = {};               // 重新打开时给之前失败的蛋一次机会
      }
      if (patch.autoHatch != null) {
        note('info', patch.autoHatch ? '只取非闪光蛋已开启' : '只取非闪光蛋已关闭');
        HATCH.tries = {};               // 同上
      }
      if (patch.eggBerry != null) note('info', patch.eggBerry ? '催蛋吃果子已开启' : '催蛋吃果子已关闭');
      if (patch.shinyBerry != null) note('info', patch.shinyBerry ? '靛莓果闪光（吃果亲代）已开启' : '靛莓果闪光已关闭');
    }
    if (D.snap) D.snap.cfg = Object.assign({}, D.cfg);
    hudPaint(D.snap, true);
    return Object.assign({}, D.cfg);
  }

  function refresh() {
    var snap = sample(true);
    return { ok: !!(snap && snap.ok), text: snap && snap.ok ? '已重新读取培育屋' : '读不到游戏存档' };
  }

  function clear() {
    D.stats = Object.assign({}, ZERO_STATS);
    D.stats.since = Date.now();
    D.events = [];
    D.uids = null;
    D.gameHatched = null;
    storeSet(STATS_KEY, D.stats);
    note('info', '观测统计已清零');
    sample(true);                 // 立刻重建基线并刷新快照，popup 不用等下一次轮询
    return { ok: true, text: '观测统计已清零（游戏的累计孵化不会动）' };
  }

  var util = {
    num: num, clamp: clamp, fmtDur: fmtDur, fmtClock: fmtClock,
    dexName: dexName, pctLabel: pctLabel, esc: esc,
    calibrate: calibrate, parseEgg: parseEgg, parseParent: parseParent,
    parseLaying: parseLaying, parseShiny: parseShiny, analyse: analyse,
    diffStats: diffStats, shinyCss: shinyCss,
    /* 游戏同款闪光蛋判定，暴露给 content.js 与沙箱测试（v0.4.104 起支持蛋序号 k） */
    eggIsShiny: eggIsShiny, eggHash: eggHash, eggKHash: eggKHash, trainerSeed: trainerSeed,
    /* 第六十一批：下载版这几样是纯函数，导出来给沙箱测试用（不参与线上逻辑） */
    isPlainEgg: isPlainEgg, pickBerry: pickBerry, berryReady: berryReady,
    gaugeInfo: gaugeInfo, farmUnclearedBlock: farmUnclearedBlock,
    BERRY_ORDER: BERRY_ORDER, BERRY_MIN: BERRY_MIN
  };

  root.PCG_NURSERY = {
    state: state, config: config, refresh: refresh, clear: clear,
    shinyCss: shinyCss, eggIsShiny: eggIsShiny, util: util,
    nextShinyInfo: nextShinyInfo,
    CFG_KEY: CFG_KEY, STATS_KEY: STATS_KEY, CONST: K
  };

  /* ---------------- 启动 ---------------- */
  storeGet(CFG_KEY, function (saved) {
    if (saved) D.cfg = sanitize(saved);
    /* 第一百一十八批：吃树果相关自动化默认全关。老存档里可能存过
     * eggBerry=true（蛋槽没满就自动吃果子催蛋），升级后统一关一次；
     * 之后玩家在「培育屋监测」里自己勾上才生效，不会再被改回去。 */
    if (saved && !saved.berryGateV2) {
      D.cfg.eggBerry = false;
      D.cfg.autoFeedEgg = false;
      D.cfg.berryGateV2 = true;
      storeSet(CFG_KEY, D.cfg);
    }
    storeGet(STATS_KEY, function (st) {
      if (st) D.stats = Object.assign({}, ZERO_STATS, st);
      D.loaded = true;
      sample(true);
    });
  });

  try {
    if (root.setInterval) {
      root.setInterval(function () {
        try { sample(); } catch (e) { note('warn', '采样异常：' + ((e && e.message) || e)); }
      }, 1000);
    }
    if (root.setTimeout) root.setTimeout(function () { sample(true); }, 1500);
    /* 差事活跃时 2 秒一拍（sample 自身是 10 秒节流，取蛋等不了那么久） */
    if (root.setInterval) root.setInterval(function () {
      try { if (ERRAND.phase !== 'idle' || ERRAND.auto) eggErrandTick(); } catch (e) { /* ignore */ }
    }, 2000);
    if (root.PCG_THEME && root.PCG_THEME.onChange) {
      root.PCG_THEME.onChange(function () { hudPaint(D.snap, true); });
    }
  } catch (e) { /* 非浏览器环境 */ }
})(typeof window !== 'undefined' ? window : this);
