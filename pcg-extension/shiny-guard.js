/* Poke'Catch 防掉线助手 —— 闪光战斗守卫（第五批）
 *
 * 一条给「所有会切换地图 / 屏幕的功能」共用的前置逻辑：
 *   遇到闪光（异色）宝可梦时，战斗结束、捕捉结算完之前，一律不许切走。
 *
 * 为什么必须做成全局守卫：游戏把「自动捕捉」开成了常开
 *   （存档 adv.capture = { on:true, target:"new", shiny:true }），
 *   闪光野怪一出现游戏会自己丢球；这时若插件为了刷道具 / 刷树果 / 补图鉴 /
 *   扫黑市 / 追神兽 / 刷钱而切章节或切页，等于把这一场仗连同闪光一起丢掉。
 *
 * 三道信号，任一成立即视为「闪光战斗还没结束」：
 *   1) 存档 adv.battle.enemies[].shiny === true        ← 最权威，bundle 里 Os() 直接写进 adv.battle
 *   2) 敌人卡上的闪光标记（page-hook.js 给精灵图打的 data-pcg-shiny，
 *      /shiny/ 资源路径、.shiny-ico、.in-ball 捕捉动画）
 *   3) 战斗日志 / 提示条里新出现的 chromatique / shiny / 闪光 / 异色 / ✦
 *
 * 战斗结束后还要留 graceMs（默认 6 秒）的缓冲：等捕捉动画、奖励飘字、
 * 「已获得」提示和存档落盘全部完成，再放行切图。另有 maxBlockMs 硬上限，
 * 万一某个信号卡死也不会把插件永久冻住。
 *
 * 两层拦截：
 *   · 软闸：各模块出发前 await PCG_SHINY_GUARD.waitClear(owner)，
 *     被挡住时把状态写成「等闪光战斗结束」，不空转、不重复点地图。
 *   · 硬闸：捕获阶段拦下所有「自动化发起的」(isTrusted === false) 切图点击，
 *     覆盖 content.js 里那些没来得及逐个改的老功能。玩家自己手点的（isTrusted）
 *     永远放行，不会抢玩家的操作。
 *
 * 第六十四批：守卫顺手把「路闪」两个数数清楚，给图鉴捕捉看板用 ——
 *   stats.seen   = 每遇到一只**野生闪光** +1（同一只刷两场算两次）
 *   stats.caught = 其中真正**抓到手**的次数：每一场开打时拍下「总捕捉数」和
 *                  「仓库里已有的闪光实例 uid」，结算时对比，多出来的就算抓到。
 *   两个数都只增不减，只有手动 clear() 才归零。
 *
 * 第六十五批：生效范围收窄 —— 只管「**地区章节里走野怪节点**时遇到的野生闪光」。
 *   ① 当前激活屏幕必须是冒险页（#screen-adventure）；
 *      团体战（#screen-raid）、地下通道、培育屋、黑市等一律不管；
 *   ② 时间线上当前节点必须是野怪节点（.tl-node.current.wild，
 *      读不到就读存档 adv.nodes[adv.node].type === 'wild'）；
   *   ③ 训练家 / 道馆·天王 / 休息点 / 道具节点一律不管 —— 那些地方不会刷野生闪光，
   *      拦下来只会把正在跑的任务白冻一场。
   *   第一百一十一批补：异色团体战开打时仍停在冒险页、run 里也有 wild 节点，
   *   所以单靠 ① ② 会漏；另加 raidContext() 读存档里的 raid 标记，团体战
   *   boss 一律不拦、不记路闪。
   *   已经开打的那一场不受范围抖动影响（G.live 期间照旧守到结算完）。
 *
 * 只读 DOM 和页面 localStorage，不改存档、不拦截请求、不上传数据。
 */
(function (root) {
  'use strict';

  var CFG = root.PCG_CONFIG || {};
  var SAVE_KEY = CFG.SAVE_KEY || 'gachamon-save-v1';
  var CFG_KEY = 'pcgShinyGuardCfgV1';

  /* 第一百一十批：路闪监测。每一次「地区章节野怪节点的野生闪光」都落一条记录到
   * chrome.storage.local：现实时间、章节名、地区、章节天气、宝可梦、捕捉成功 / 失败。
   * SESSION 是「这一次打开游戏页」的编号 —— 刷新页面会换新编号，于是旧记录
   * 自动归到「历史」，新的一轮从零开始，正好满足「历史 / 本次分开显示」。
   * 第一百一十一批：每条记录带 src:'wild'，团体战 boss 不落库。 */
  var ROAD_KEY = 'pcgRoadShinyV1';
  var SESSION = String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8);
  var ROAD_MAX = 500;

  var DEFAULT = {
    enabled: true,
    graceMs: 6000,        // 战斗结束后继续等这么久，让捕捉结算走完
    maxBlockMs: 300000,   // 单次硬上限 5 分钟，防止信号卡死
    hardBlock: true,      // 捕获阶段拦下自动化的切图点击
    logDefer: true        // 被拦时写一条日志
  };

  var G = {
    cfg: Object.assign({}, DEFAULT),
    blocked: false,
    live: false,
    reason: '',
    since: 0,
    clearAt: 0,
    lastShinyAt: 0,
    active: null,         // { id, uid, level }
    signals: { save: 0, dom: 0, text: 0, scope: 0 },
    scope: null,          // 第六十五批：这一帧的生效范围判定 { ok, why, from }
    stats: { seen: 0, caught: 0, released: 0, waits: 0, deferrals: 0, maxWaitMs: 0 },
    /* 第六十四批：每一次「野生闪光遭遇」都记一条，结算时核对有没有抓到。
     *   enc      = 正在打的这一场 { id, uid, level, at }
     *   encBase  = 这一场开始时的存档总捕捉数 stats.caught
     *   encKeys  = 这一场开始时的闪光实例 uid 集合（仓库 / 培育屋 / 地下通道）
     *   encounters = 最近 50 条遭遇记录（含 caught 结果），给看板 / 排查用 */
    enc: null,
    encBase: 0,
    encKeys: null,
    encounters: [],
    roadRecords: [],
    logs: [],
    lastRaw: '',
    lastSave: null,
    lastText: '',
    textAt: 0,
    lastLogAt: 0
  };

  /* ---------------- 小工具 ---------------- */
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function q(sel, r) {
    try { return (r || document).querySelector(sel); } catch (e) { return null; }
  }
  function qa(sel, r) {
    try { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }
    catch (e) { return []; }
  }
  function txt(el) { return String((el && el.textContent) || ''); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function log(level, msg) {
    G.logs.push({ t: Date.now(), level: level, m: String(msg) });
    if (G.logs.length > 30) G.logs.shift();
    try {
      if (root.PCG_LOG && typeof root.PCG_LOG.push === 'function') {
        root.PCG_LOG.push(level, 'shiny', '闪光守卫：' + msg);
      }
    } catch (e) { /* ignore */ }
  }

  function storeGet(key, cb) {
    try { chrome.storage.local.get(key, function (v) { cb(v || {}); }); }
    catch (e) { cb({}); }
  }
  function storeSet(obj) {
    try { chrome.storage.local.set(obj, function () { void chrome.runtime.lastError; }); }
    catch (e) { /* ignore */ }
  }

  function sanitize(o) {
    var out = {}, src = o || {};
    out.enabled = src.enabled !== false;
    out.hardBlock = src.hardBlock !== false;
    out.logDefer = src.logDefer !== false;
    out.graceMs = clamp(num(src.graceMs, DEFAULT.graceMs), 1000, 60000);
    out.maxBlockMs = clamp(num(src.maxBlockMs, DEFAULT.maxBlockMs), 20000, 1800000);
    return out;
  }

  /* ---------------- 第一百一十一批：把「异色团体战」从路闪里剔干净 ----------------
   * 团体战开打时底部仍停在「冒险」页（并没有切到别的 screen），所以原来那道
   * activeScreenId() === 'screen-adventure' 的闸根本拦不住；团体战自己的 run
   * 里也有 type:'wild' 的节点，存档兜底同样会被骗过去，boss 就混进路闪了。
   *
   * 线上 bundle 里团体战有四处很硬的标记，任一成立即判定「这是团体战」：
   *   ① adv.event.raid === true        ← Raids.prepare() 返回 {raid:!0,...} 写进 adv.event
   *   ② adv.nodes[adv.node].raidRun / event / name 以 "Raid · " 开头
   *                                    ← Raids.buildRun() 给每个节点打的
   *   ③ adv.battle.enemies[].raid === true  ← boss 自己带（还同时带 shiny:true）
   *   ④ DOM 上 #screen-raid 激活 / [data-raid-run] 团体战 HUD
   * 只记「地区章节野怪节点」的野生闪光，团体战 boss 一律不拦、不记。 */
  function raidContext(save) {
    try {
      var a = (save && save.adv) || {};
      if (a.event && (a.event.raid || /raid/i.test(String(a.event.type || a.event.kind || '')))) return true;
      if (a.raid) return true;
      var n = (a.nodes && typeof a.node === 'number') ? a.nodes[a.node] : null;
      if (n && (n.raidRun === true || n.raid === true || n.event === true ||
                /^Raid\s*·/i.test(String(n.name || '')))) return true;
      var b = a.battle || {};
      /* 第一百一十八批：线上团体战把 raid:!0 / boss:!0 直接写在**战斗对象**上
       * （bundle: ss({ kind:'static', enemies:[Le], ...k.raid?{raid:!0,boss:!0}:{} })，
       * 再 k.battle=h）。以前这里只翻 enemies[]，boss 自己没带 raid 字段时就会漏判，
       * 于是异色团体战的记录混进了路闪。战斗对象层补一道最硬的闸。 */
      if (b.raid === true || b.boss === true || b.raidRun === true ||
          /raid/i.test(String(b.kind || ''))) return true;
      var foes = b.enemies || b.foes || [];
      for (var i = 0; i < foes.length; i++) {
        if (foes[i] && (foes[i].raid === true || foes[i].raidRun === true ||
                        foes[i].boss === true)) return true;
      }
    } catch (e) { /* ignore */ }
    try {
      if (q('#screen-raid.active') ||
          q('[data-raid-run], .raid-hud, .raid-run, .raid-boss, [data-raid-boss]')) return true;
    } catch (e2) { /* ignore */ }
    return false;
  }

  /* ---------------- 第一百一十批：路闪监测的遭遇上下文 ----------------
   * 守卫只管「冒险页 + 野怪节点」，且上面 raidContext() 已把异色团体战剔掉，
   * 所以这里落库的天然只剩地区章节野怪节点的野生闪光。 */
  function roadChapter(save) {
    var ch = -1;
    try {
      var a = (save && save.adv) || {};
      if (typeof a.chapter === 'number') ch = a.chapter;
    } catch (e) { /* ignore */ }
    var name = '', region = '';
    try {
      var D = root.PCG_DEX_DATA;
      if (D && typeof D.chapter === 'function') {
        var c = D.chapter(ch);
        if (c) {
          name = c.n || '';
          if (D.regionLabel) region = D.regionLabel(c.rg || '') || '';
        }
      }
      if (!name && D && typeof D.chapterName === 'function') name = D.chapterName(ch) || '';
    } catch (e2) { /* 数据表没加载就只写章号 */ }
    return {
      ch: ch,
      region: region,
      chapterName: ch >= 0
        ? ('第 ' + (ch + 1) + ' 章' + (name ? '「' + name + '」' : ''))
        : '未知章节'
    };
  }

  /* 章节天气：优先用图鉴模块按 adv.chapter 取到的「这一章现在的天气」，
   * 读不到再退回全局天气标签，最后才是页面上的天气元素文本。 */
  function roadWeather(save) {
    var out = '未知';
    try {
      var X = root.PCG_DEX;
      if (X && typeof X.currentWeather === 'function') {
        var w = X.currentWeather(save);
        if (w && w.chapterNow && w.chapterNow !== '未读到') out = w.chapterNow;
        else if (w && w.label && w.label !== '未知') out = w.label;
      }
    } catch (e) { /* ignore */ }
    if (out === '未知') {
      try {
        var el = q('[data-weather], .zone-weather.now, .wx[data-cond]');
        var t = el ? (txt(el) || el.getAttribute('data-weather') || '') : '';
        if (t) out = String(t).trim().slice(0, 24);
      } catch (e2) { /* ignore */ }
    }
    return out;
  }

  function roadMonName(id) {
    if (!id) return '未知宝可梦';
    try {
      var D = root.PCG_DEX_DATA;
      if (D && typeof D.name === 'function') {
        var n = D.name(id);
        if (n && String(n).charAt(0) !== '#') return String(n);
      }
    } catch (e) { /* ignore */ }
    return '#' + id;
  }

  /* 第一百一十八批：读档 / 弹窗显示时，把「认不出是谁 / 团体战混进来」的
   * 历史脏记录剔掉。截图里那三条「未知宝可梦 #?」就是上一版 id=0 时硬记的，
   * 留着只会让人以为插件记了假数据。纯函数，切片验证也能单独跑。 */
  /* 读取/显示层的历史记录校验。v1.38：这里刻意不要求 shiny 标记 —— 更新插件
   * 后，v1.37 及更早存下的历史记录（当时没有这个字段）仍要能读出来，不能因为
   * 升级就把玩家累计的路闪历史全清掉。真实性的把关放在「新记录落库」roadSave：
   * 从 v1.38 起只有存档确认带 shiny 的才会写进来，旧的误报不会再新增。 */
  function roadRecValid(r) {
    if (!r || r.src !== 'wild' || r.raid || r.boss || r.fromRaid) return false;
    if (!(Number(r.id) > 0)) return false;
    var nm = String(r.name || '');
    if (!nm || nm === '未知宝可梦' || nm.charAt(0) === '#') return false;
    return true;
  }

  /* 落一条到扩展本地；同一份数据既给「本次」也给「历史」用，靠 sess 分组。
   * 第一百一十一批：只收带 src:'wild' 的记录，来源不明的（含团体战）一律不落库。
   * 第一百一十八批：再加两道闸门 ——
   *   ① 团体战 / boss 相关标记一律不落（异色团体战的数据绝不进路闪）；
   *   ② 没有有效图鉴号的不落。截图里那种「未知宝可梦 #?」就是身份没采到
   *      还硬记了一条，属于不真实的数据，宁可不记也不留占位垃圾。 */
  function roadSave(rec) {
    if (!rec || rec.src !== 'wild' || rec.raid || rec.boss || rec.fromRaid) return;
    if (rec.shiny !== true) return;   // v1.38：只落存档确认的真实闪光
    if (!(Number(rec.id) > 0)) return;
    G.roadRecords.push(rec);
    if (G.roadRecords.length > ROAD_MAX) G.roadRecords.shift();
    var o = {}; o[ROAD_KEY] = { cur: SESSION, records: G.roadRecords };
    storeSet(o);
  }

  /* ---------------- 存档信号 ----------------
   * 整份存档可能几百 KB：只在字符串真的变了时才 JSON.parse。 */
  function readSave() {
    var SAVE = (typeof root !== 'undefined' && root && root.PCG_SAVE) ||
      (typeof window !== 'undefined' && window.PCG_SAVE) || null;
    if (SAVE) {
      var obj = SAVE.read();
      G.lastSave = obj;
      G.lastRaw = SAVE.raw() || '';
      return obj;
    }
    var raw = '';
    try { raw = localStorage.getItem(SAVE_KEY) || ''; } catch (e) { return G.lastSave; }
    if (raw === G.lastRaw) return G.lastSave;
    G.lastRaw = raw;
    try { G.lastSave = raw ? JSON.parse(raw) : null; }
    catch (e) { G.lastSave = null; }
    return G.lastSave;
  }

  function battleOf(save) {
    return (save && save.adv && save.adv.battle) || null;
  }

  function shinyFoes(save) {
    var b = battleOf(save);
    if (!b) return [];
    var arr = b.enemies || b.foes || [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var e = arr[i];
      if (e && (e.shiny === true || e.shiny === 1)) {
        out.push({ id: Number(e.id) || 0, uid: String(e.uid || ''), level: Number(e.level) || 0 });
      }
    }
    return out;
  }

  /* 存档里的总捕捉数（游戏自己数的 stats.caught，抓一只涨一只） */
  function saveCaught(save) {
    var s = save && save.stats;
    return num(s && s.caught, 0);
  }

  /* 存档里所有闪光实例的「key → 图鉴号」：仓库 / 培育屋 / 地下通道。
   * 遭遇前后各取一次，多出来的那一只就是这一场抓到的。
   * key 优先用 uid（游戏给每只实例的唯一 id），没有就退成「图鉴号@等级」。 */
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

  /* 第一百一十八批：闪光宝可梦的「身份」不能只靠存档 battle.enemies[].id。
   * 线上把闪光立绘挂在 #enemy-slot .enemy 的 <img> 上，page-hook.js 会给这些图
   * 打 data-pcg-id（图鉴号）/ data-pcg-shiny；存档里那只敌人的字段名也可能是
   * id / dexId / num / dex。以前只认 foe.id 一个来源，遇到「DOM 闪光信号触发、
   * 存档敌人还没写好」就全落成 0，弹窗于是显示「未知宝可梦 #?」加一个问号
   * （本轮截图三条记录全是这个）。这里按优先级把身份兜回来。 */
  function roadFoeId(save, foe) {
    var out = { id: 0, uid: '', level: 0 };
    var f = foe || G.active || null;
    if (f) {
      out.id = num(f.id, 0);
      out.uid = String(f.uid || '');
      out.level = num(f.level, 0);
    }
    if (out.id > 0) return out;
    var b = battleOf(save);
    var arr = (b && (b.enemies || b.foes)) || [];
    for (var i = 0; i < arr.length; i++) {
      var e = arr[i];
      if (!e) continue;
      var sid = num(e.id != null ? e.id : (e.dexId != null ? e.dexId :
                (e.num != null ? e.num : e.dex)), 0);
      if (sid > 0) {
        out.id = sid;
        out.uid = String(e.uid || out.uid || '');
        out.level = num(e.level != null ? e.level : e.lv, out.level);
        return out;
      }
    }
    /* DOM 敌人卡：优先带闪光标记的那一张 */
    var cards = qa('#enemy-slot .enemy');
    for (var j = 0; j < cards.length; j++) {
      var c = cards[j], cid = 0, isShiny = false;
      if (c.getAttribute) {
        cid = num(c.getAttribute('data-id'), 0);
        if (c.getAttribute('data-pcg-shiny') === '1' ||
            c.getAttribute('data-shiny') === '1') isShiny = true;
      }
      var imgs = qa('img', c);
      for (var k = 0; k < imgs.length; k++) {
        var im = imgs[k], pid = 0;
        if (im.getAttribute) {
          pid = num(im.getAttribute('data-pcg-id'), 0);
          if (im.getAttribute('data-pcg-shiny') === '1' ||
              im.getAttribute('data-shiny') === '1') isShiny = true;
        }
        var src = String((im && im.getAttribute &&
                 (im.getAttribute('src') || im.getAttribute('data-src'))) || '');
        var m = src.match(/assets\/pokemon\/(?:shiny\/)?(\d+)\.png/i) ||
                src.match(/(\d+)\.png/i);
        if (!pid && m) pid = num(m[1], 0);
        if (pid > 0) { cid = cid || pid; if (isShiny) break; }
      }
      if (cid > 0) {
        out.id = cid;
        if (c.getAttribute) out.uid = out.uid || String(c.getAttribute('data-uid') || '');
        if (isShiny) return out;   // 闪光那张优先，直接定
      }
    }
    return out;
  }

  /* 这一场闪光开打前，把「结算时要拿来做对比」的两份快照下来。
   * v1.38：shinyConfirmed = 存档里这只敌人确实带 shiny 标记（shinyFoes 命中）。
   * DOM 的 .shiny class / 战斗日志「闪光」字样都可能误报（普通野怪丢球动画也会带），
   * 只能用来触发「拦切图保护」，不能作为「这是真闪光」的落库依据。 */
  function markEncounter(save, foe, now, shinyConfirmed) {
    var who = roadFoeId(save, foe);
    G.enc = {
      id: who.id,
      uid: who.uid,
      level: who.level,
      at: now,
      shiny: !!shinyConfirmed
    };
    G.encBase = saveCaught(save);
    G.encKeys = shinyInstances(save);
    /* 第一百一十批：开打这一刻就把「现实时间 / 章节 / 天气 / 宝可梦」记下来，
     * 结算时只补一个「抓到没抓到」，免得战斗打完画面已经切走、天气也变了。 */
    var here = roadChapter(save);
    G.enc.meta = {
      name: roadMonName(G.enc.id),
      ch: here.ch,
      region: here.region,
      chapterName: here.chapterName,
      weather: roadWeather(save),
      sess: SESSION,
      /* 第一百一十九批：记下游戏自己写的战斗种类（这里只可能是 'wild'，
       * 因为 huntScope 已挡掉 static/trainer/gym/团战），便于日后排查来源。 */
      kind: String((battleOf(save) || {}).kind || 'wild'),
      src: 'wild',         // 第一百一十一批：明确「野生闪光」来源，旧记录没这个标记
      /* v1.38：只有存档确认带 shiny 标记的才落「真实路闪」库；DOM/文本误报的
       * 普通野怪仍会被守卫拦一会（保护可能真闪光的捕捉），但绝不记进统计。 */
      shiny: !!shinyConfirmed
    };
    /* 第一百一十八批：开打这一刻 battle 一定还在，先把团体战判定固化进
     * meta。结算时战斗对象通常已被清掉，那时再判会漏；带着这个标记走，
     * roadSave() / 弹窗过滤才能可靠地把异色团体战挡在路闪之外。 */
    if (raidContext(save)) G.enc.meta.raid = true;
    return G.enc;
  }

  /* 这一场闪光结束：对比快照判断「到底抓没抓到」，并把结果记进 encounters。
   * 两条判据任一成立就算抓到：
   *   ① 游戏的总捕捉数比开打时多了（正常捕捉路径）；
   *   ② 仓库 / 培育屋 / 地下通道里多出一只**同图鉴号（或同 uid）**的闪光实例。
   * 快照没拿到（开打那一刻还没读到存档）时两条判据都不成立 —— 宁可少记一次
   * 「抓到」，也不能把后来的普通捕捉当成闪光。 */
  function settleEncounter() {
    var e = G.enc;
    if (!e) return null;
    var save = readSave() || {};
    var base = num(G.encBase, 0), keyBase = G.encKeys;
    var caught = false;
    if (base > 0 && saveCaught(save) > base) caught = true;
    if (!caught && keyBase) {
      var nowKeys = shinyInstances(save);
      for (var k in nowKeys) {
        if (!Object.prototype.hasOwnProperty.call(nowKeys, k) || keyBase[k]) continue;
        if (!e.id || nowKeys[k] === e.id || (e.uid && k === e.uid)) {
          caught = true;
          /* v1.38 二次证据：仓库/培育屋/地下里多出一只同号的【闪光】实例，
           * 这就是「这场确实是真闪光」的铁证。开打瞬间 foe 可能还没进存档，
           * 靠这条把真实路闪补记回来，既不漏真闪光，也不会把普通野怪误记。 */
          if (e.meta) e.meta.shiny = true;
          break;
        }
      }
    }
    e.caught = caught;
    e.endAt = Date.now();
    G.enc = null;
    G.encKeys = null;
    G.encBase = 0;
    if (caught) G.stats.caught++;
    /* 第一百一十批：给路闪监测落一条完整记录（含开打时采到的上下文）。 */
    var rec = {
      id: e.id, uid: e.uid, level: e.level,
      at: e.at, endAt: e.endAt, caught: caught,
      src: 'wild'
    };
    var meta = e.meta || {};
    for (var mk in meta) {
      if (Object.prototype.hasOwnProperty.call(meta, mk)) rec[mk] = meta[mk];
    }
    if (!rec.sess) rec.sess = SESSION;
    G.encounters.push(rec);
    if (G.encounters.length > 50) G.encounters.shift();
    /* 第一百一十八批：落库前最后一道闸。结算这一刻再确认一次不是团体战，
     * 且身份确实采到了（有效图鉴号 + 认得出名字）；认不出就宁可不记，
     * 也不往面板里塞「未知宝可梦 #?」这种不真实的数据。内部战斗日志仍保留。 */
    var recName = String(rec.name || '');
    var realWild = !raidContext(save) && !rec.raid && !rec.boss && !rec.fromRaid &&
      Number(rec.id) > 0 && !!recName && recName !== '未知宝可梦' &&
      recName.charAt(0) !== '#';
    if (realWild) roadSave(rec);
    log(caught ? 'ok' : 'info', '闪光结算：' + (caught ? '捕捉成功' : '捕捉失败（跑掉 / 换图 / 还在身上）') +
      (e.id ? ' #' + e.id : '') + ' · 累计遇到 ' + G.stats.seen + ' 次，抓到 ' + G.stats.caught + ' 次');
    return e;
  }

  /* ---------------- DOM 信号 ---------------- */
  var SHINY_RE = /chromatique|shiny|闪光|异色|色違い|색이 다|✦|✨/i;

  function domShiny() {
    var cards = qa('#enemy-slot .enemy');
    if (!cards.length) return { hit: false, inBall: false };
    var hit = false, inBall = false;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c.classList.contains('in-ball')) inBall = true;
      if (c.classList.contains('shiny') || c.classList.contains('is-shiny') ||
          c.classList.contains('chroma') || c.getAttribute('data-pcg-shiny') === '1' ||
          c.getAttribute('data-shiny') === '1') hit = true;
      var imgs = qa('img', c);
      for (var j = 0; j < imgs.length; j++) {
        var im = imgs[j];
        var src = String(im.getAttribute('src') || im.getAttribute('data-src') || '');
        if (/\/shiny\//.test(src) || im.getAttribute('data-pcg-shiny') === '1') hit = true;
      }
      if (q('.shiny-ico', c)) hit = true;
    }
    return { hit: hit, inBall: inBall };
  }

  /* 战斗日志 / 提示条里「新出现」的闪光字样。
   * 只看新增的那一段：常驻的「闪光」说明文字不能每次都算一次新闪光。 */
  function textShiny(now) {
    var parts = [];
    var logEl = q('#battle-log');
    if (logEl) parts.push(txt(logEl));
    var toast = q('#toasts');
    if (toast) parts.push(txt(toast));
    var modal = q('#modal-root.open .modal');
    if (modal) parts.push(txt(modal));
    var s = parts.join(' | ').slice(-1200);
    if (s && s !== G.lastText) {
      var fresh = (G.lastText && s.indexOf(G.lastText) === 0) ? s.slice(G.lastText.length) : s;
      if (fresh && SHINY_RE.test(fresh)) G.textAt = now;
      G.lastText = s;
    }
    return now - G.textAt < 12000;
  }

  /* ---------------- 第六十五批：生效范围 ----------------
   * 返回 { ok, why, from }：ok=false 时这一帧一律不起阻塞、也不记「遇到闪光」。
   * 只在两种情况下放行：DOM 的 current 节点写着 wild，或存档节点表说是 wild。 */
  function activeScreenId() {
    var el = q('.screen.active');
    return el ? String(el.id || '') : '';
  }
  function currentTlNode() {
    return q('#timeline .tl-node.current');
  }
  function huntScope(save) {
    /* 第一百一十一批：团体战一律不算路闪，也不拦切图。 */
    if (raidContext(save)) {
      return { ok: false, why: '异色团体战不算路闪', from: 'raid' };
    }
    var sid = activeScreenId();
    /* ① 屏幕：只认冒险页。切页动画中间读不到就不拦着判节点 */
    if (sid && sid !== 'screen-adventure') {
      return { ok: false, why: '不在冒险页（' + sid.replace('screen-', '') + '）', from: 'screen' };
    }

    var a = (save && save.adv) || null;
    var b = (a && a.battle) || null;

    /* 第一百一十九批（v1.27）核心修正：路闪的唯一统计对象 =
     * 「在冒险页、各大地区章节里，走草丛节点时遭遇的野生闪光」。
     * 游戏把每场战斗写进 adv.battle.kind（bundle 里 Ka({kind:"wild"|...})）：
     *   'wild'                       ← 章节时间线野怪格撞出来的野生宝可梦（唯一计入）
     *   'static'                     ← 神兽 / 礼物 / 特别的相遇（固定相遇，不计）
     *   'trainer' / 'gym' / 'league' ← 训练家 / 道馆 / 联盟（不计）
     * 团体战虽也带 shiny，但 raidContext() 已在上面挡掉。
     * 旧版只靠 DOM 的 .tl-node.current.wild 或存档 nodes[node].type==='wild'，
     * 在地下通道 / 固定相遇 / 战斗切到别的节点时会误判；现在以游戏自己写的
     * battle.kind 为准，从根上把非章节野生的闪光全部排除。 */
    if (!b || String(b.kind || '') !== 'wild') {
      return { ok: false, why: '不是章节野生战斗', from: 'battle' };
    }

    /* ② 必须确实身处某个地区章节（adv.chapter 为有效章号 + 时间线已生成） */
    var nodes = a && a.nodes;
    if (!(typeof a.chapter === 'number' && a.chapter >= 0) ||
        !(nodes && nodes.length && typeof a.node === 'number')) {
      return { ok: false, why: '不在地区章节里', from: 'chapter' };
    }

    /* ③ 当前节点必须是野怪格。battle.kind==='wild' 只会在 wild 节点上出现，
     * 这里用存档节点类型再确认一次；DOM 的 .wild 作为兜底（切页动画中节点可能
     * 暂时读不到）。带 special:true 的「特别的相遇」也算 wild 战斗，按玩家
     * 口径「章节里遭遇的野生闪光」照常计入。 */
    var n = nodes[a.node];
    if (n && n.type === 'wild') return { ok: true, why: '章节野生节点', from: 'save' };
    var cur = currentTlNode();
    if (cur && cur.classList && cur.classList.contains('wild')) {
      return { ok: true, why: '野怪节点（DOM 兜底）', from: 'dom' };
    }
    return { ok: false, why: '当前节点不是野生节点', from: 'node' };
  }

  /* ---------------- 采样 ---------------- */
  function sample() {
    var now = Date.now();
    var save = readSave();
    var foes = shinyFoes(save);
    var dom = domShiny();
    var battle = battleOf(save);
    var textHit = !!battle || !!q('#enemy-slot .enemy') ? textShiny(now) : false;

    /* 只有「确凿的闪光信号」才起阻塞：避免把每一场普通野怪的丢球动画
     * （.in-ball 对非闪光也会加）误判成闪光。一旦确认过闪光，
     * 就一路守到这场战斗 / 捕捉动画真正结束，再进入结算缓冲。 */
    var shinyNow = !!(foes.length || dom.hit || (textHit && !!battle));
    var stillSettling = G.live && !!(battle || dom.inBall || q('#enemy-slot .enemy'));
    var live = !!(shinyNow || stillSettling);
    G.signals.save = foes.length;
    G.signals.dom = (dom.hit ? 1 : 0) + (dom.inBall ? 1 : 0);
    G.signals.text = textHit ? 1 : 0;

    if (foes.length) G.active = foes[0];
    else if (!live && G.active && now - (G.clearAt || 0) > 1000) G.active = null;

    if (!G.cfg.enabled) {
      if (G.blocked) { G.blocked = false; G.live = false; G.reason = '守卫已关闭'; release('守卫关闭'); }
      return;
    }

    /* 第一百一十一批：这一帧确定在团体战里 —— 不拦切图、不记路闪。
     * 万一上一帧刚把团体战 boss 当成野闪开了场，这里把那一场直接作废，
     * 别让 settleEncounter() 在结算时把它写进统计。 */
    if (raidContext(save)) {
      if (G.enc) { G.enc = null; G.encKeys = null; G.encBase = 0; }
      if (G.live) { G.live = false; G.stats.seen = Math.max(0, G.stats.seen - 1); }
      if (G.blocked || G.clearAt) {
        G.blocked = false; G.clearAt = 0; G.since = 0; G.reason = '';
      }
      G.scope = { ok: false, why: '异色团体战不算路闪', from: 'raid' };
      G.signals.scope = 0;
      return;
    }

    /* 第六十五批：范围闸。不在「地区章节的野怪节点」上就一律不管 ——
     * 不拦、不记遭遇，只把上一场（如果还挂着）的账结掉。 */
    var scope = huntScope(save);
    G.scope = scope;
    G.signals.scope = scope.ok ? 1 : 0;
    if (!scope.ok && !G.live) {
      if (G.blocked) { G.blocked = false; release('不在生效范围：' + scope.why); }
      return;
    }

    if (live) {
      if (!G.live) {
        G.stats.seen++;
        G.since = now;
        G.lastShinyAt = now;
        /* 第六十四批：这一场开打时拍两张快照，结算时用来核对「有没有抓到」。
         * v1.38：第四个参数=存档是否确认闪光（foes 来自 shinyFoes，必带 shiny 标记）；
         * 纯靠 DOM/文本误报触发的那一场不记真实路闪。 */
        markEncounter(save, foes[0] || null, now, foes.length > 0);
        var nm = G.active && G.active.id ? ' #' + G.active.id : '';
        log('ok', '发现闪光宝可梦' + nm + '，切图暂停，等这一场打完');
      }
      G.live = true;
      G.clearAt = 0;
      G.blocked = true;
      G.reason = battle ? '闪光战斗中' : (dom.inBall ? '闪光捕捉结算中' : '闪光战斗结算中');
      // 硬上限：任何单一信号卡死也不无限期冻结
      if (now - G.since > G.cfg.maxBlockMs) {
        log('warn', '等待超过 ' + Math.round(G.cfg.maxBlockMs / 60000) + ' 分钟，强制放行（请检查游戏是否卡住）');
        release('超时放行');
      }
      return;
    }

    if (G.live) {
      G.live = false;
      G.clearAt = now;
      G.reason = '闪光战斗结束，等结算落盘';
    }

    if (G.clearAt) {
      var wait = now - G.clearAt;
      var modalOpen = !!q('#modal-root.open .modal');
      var enemyLeft = !!q('#enemy-slot .enemy');
      var settled = wait >= G.cfg.graceMs && !modalOpen && !enemyLeft;
      if (settled) {
        G.reason = '';
        release('结算完成');
      } else {
        G.blocked = true;
        G.reason = '闪光战斗结束，等结算（' + Math.round(Math.max(0, G.cfg.graceMs - wait) / 1000) + 's）';
        if (wait > G.cfg.maxBlockMs) {
          log('warn', '结算等待超时，强制放行');
          release('超时放行');
        }
      }
      return;
    }

    G.blocked = false;
    G.reason = '';
  }

  function release(why) {
    /* 第六十四批：放行的这一刻就是「这一场结束了」，先把抓没抓到结掉再放行 */
    try { settleEncounter(); } catch (e) { /* ignore */ }
    G.blocked = false;
    G.live = false;
    G.clearAt = 0;
    G.since = 0;
    G.reason = '';
    G.stats.released++;
    log('info', '已放行切图（' + why + '）');
  }

  /* ---------------- 硬闸：拦下自动化的切图点击 ----------------
   * 只拦 isTrusted === false 的合成点击：玩家自己用鼠标点的永远放行。
   * 「回到冒险页」也放行——闪光战斗本来就发生在冒险页。 */
  var SWITCH_SEL = [
    '.mp-go', '.mp-row', '.rg[data-depart]', '#chapter-btn', '#side-chapter',
    '[data-screen]', '.mk-tabs [data-tab]', '.dc-go'
  ].join(',');

  function isBackToAdventure(el) {
    var v = el && el.getAttribute ? el.getAttribute('data-screen') : '';
    return v === 'adventure';
  }

  function onCaptureClick(ev) {
    if (!G.cfg.enabled || !G.cfg.hardBlock || !G.blocked) return;
    if (ev.isTrusted) return;                 // 玩家手点，不拦
    var t = ev.target;
    var el = null;
    try { el = t && t.closest ? t.closest(SWITCH_SEL) : null; } catch (e) { return; }
    if (!el || isBackToAdventure(el)) return;
    /* 侧栏页签：只拦「从冒险页切走」。已经跑到别的页面时，
     * 让它能切回冒险页或回到玩家原来的页面，别把界面卡死。 */
    if (el.hasAttribute && el.hasAttribute('data-screen')) {
      var active = q('.screen.active');
      if (!active || active.id !== 'screen-adventure') return;
    }
    try {
      ev.preventDefault();
      ev.stopImmediatePropagation();
    } catch (e) { /* ignore */ }
    G.stats.deferrals++;
    if (G.cfg.logDefer && Date.now() - G.lastLogAt > 4000) {
      G.lastLogAt = Date.now();
      log('warn', '拦下一次切图（' + (el.className || el.id || el.tagName) + '），闪光战斗还没结算完');
    }
  }

  /* ---------------- 对外 API ---------------- */
  function blocked() { return !!G.cfg.enabled && !!G.blocked; }

  function canSwitch(owner) {
    if (!blocked()) return true;
    G.stats.waits++;
    if (G.cfg.logDefer && Date.now() - G.lastLogAt > 4000) {
      G.lastLogAt = Date.now();
      log('info', (owner || '自动化') + ' 想切图，先等闪光战斗结束');
    }
    return false;
  }

  /* 等到守卫放行；返回 true = 已放行，false = 超时（调用方应自己决定要不要继续） */
  function waitClear(owner, timeoutMs) {
    var limit = clamp(num(timeoutMs, G.cfg.maxBlockMs), 0, 1800000);
    var began = Date.now();
    G.stats.waits++;
    if (!blocked()) return Promise.resolve(true);
    if (G.cfg.logDefer && Date.now() - G.lastLogAt > 4000) {
      G.lastLogAt = Date.now();
      log('info', (owner || '自动化') + ' 想切图，先等闪光战斗结束');
    }
    return new Promise(function (resolve) {
      (function poll() {
        if (!blocked()) { resolve(true); return; }
        if (Date.now() - began >= limit) {
          log('warn', (owner || '自动化') + ' 等闪光守卫超时，本轮跳过切图');
          resolve(false);
          return;
        }
        setTimeout(poll, 250);
      })();
    });
  }

  function config(patch) {
    if (patch && typeof patch === 'object') {
      G.cfg = sanitize(Object.assign({}, G.cfg, patch));
      storeSet({ [CFG_KEY]: G.cfg });
    }
    return Object.assign({}, G.cfg);
  }

  function clear() {
    G.stats = { seen: 0, caught: 0, released: 0, waits: 0, deferrals: 0, maxWaitMs: 0 };
    G.logs = [];
    G.enc = null;
    G.encBase = 0;
    G.encKeys = null;
    G.encounters = [];
    G.roadRecords = [];
    var o = {}; o[ROAD_KEY] = { cur: SESSION, records: [] };
    storeSet(o);
    return { ok: true, text: '闪光守卫与路闪统计已清零' };
  }

  function state() {
    sample();
    return {
      version: CFG.VERSION || '',
      enabled: G.cfg.enabled,
      blocked: !!G.blocked,
      live: !!G.live,
      reason: G.reason,
      since: G.since,
      lastShinyAt: G.lastShinyAt,
      active: G.active ? Object.assign({}, G.active) : null,
      enc: G.enc ? Object.assign({}, G.enc) : null,
      signals: Object.assign({}, G.signals),
      scope: G.scope ? Object.assign({}, G.scope) : null,
      cfg: Object.assign({}, G.cfg),
      stats: Object.assign({}, G.stats),
      encounters: G.encounters.slice(-10).map(function (e) { return Object.assign({}, e); }),
      road: { cur: SESSION, records: G.roadRecords.slice(-10) },
      logs: G.logs.slice(-12)
    };
  }

  /* 纯函数挂出来给 tools/smoke.mjs 直接验，不依赖 DOM / Chrome */
  var util = {
    shinyFoes: shinyFoes,
    battleOf: battleOf,
    saveCaught: saveCaught,
    shinyInstances: shinyInstances,
    /* 只验「对比快照判抓没抓到」这一段，不碰 DOM / chrome */
    judgeCaught: function (save, enc, base, keys) {
      var b = num(base, 0);
      if (b > 0 && saveCaught(save) > b) return true;   // 快照没读到（0）就不拿捕捉数说事
      if (!keys) return false;                          // 没有实例快照也不敢判
      var nowKeys = shinyInstances(save), prev = keys;
      for (var k in nowKeys) {
        if (!Object.prototype.hasOwnProperty.call(nowKeys, k) || prev[k]) continue;
        if (!enc || !enc.id || nowKeys[k] === enc.id || (enc.uid && k === enc.uid)) return true;
      }
      return false;
    },
    sanitize: sanitize,
    isShinyText: function (s) { return SHINY_RE.test(String(s || '')); },
    isBackToAdventure: isBackToAdventure,
    huntScope: huntScope,
    raidContext: raidContext,
    SWITCH_SEL: SWITCH_SEL
  };

  root.PCG_SHINY_GUARD = {
    state: state,
    blocked: blocked,
    canSwitch: canSwitch,
    waitClear: waitClear,
    config: config,
    clear: clear,
    sample: sample,
    util: util,
    /* 第一百一十批：路闪监测给弹窗 / 消息通道用 */
    roadState: function () { return { cur: SESSION, records: G.roadRecords.slice() }; },
    roadClear: function () {
      G.roadRecords = [];
      var o = {}; o[ROAD_KEY] = { cur: SESSION, records: [] };
      storeSet(o);
      return { ok: true, text: '路闪统计已清除' };
    },
    ROAD_KEY: ROAD_KEY,
    CFG_KEY: CFG_KEY
  };

  /* ---------------- 启动 ---------------- */
  try {
    storeGet(CFG_KEY, function (v) {
      if (v && v[CFG_KEY]) G.cfg = sanitize(v[CFG_KEY]);
    });
  } catch (e) { /* ignore */ }

  /* 第一百一十批：把上次的记录接回来，只把 cur 换成这一次的会话编号。
   * 第一百一十一批：上一版记录没有 src 标记，里面可能混着异色团体战 boss，
   * 事后无法反推来源 —— 只继承带 src:'wild' 的新记录，旧的一律不继承。
   * records 原样留着 —— 旧记录靠自己的 sess 自动落进「历史」那一栏，
   * 新的一轮从零开始，刷新游戏页即完成一次归档。 */
  try {
    storeGet(ROAD_KEY, function (v) {
      var d = v && v[ROAD_KEY];
      var old = (d && Array.isArray(d.records)) ? d.records : [];
      G.roadRecords = old.filter(function (r) { return r && r.src === 'wild'; })
        /* 第一百一十八批：再把「认不出是谁 / 团体战混进来」的历史脏记录剔掉，
         * 截图里那三条「未知宝可梦 #?」读档这一刻就要清干净。判定内联。 */
        /* v1.38：统一走 roadRecValid（保留旧记录、升级不丢历史）；真实闪光把关
         * 在写入端 roadSave，从这一版起非闪光不再落库。 */
        .filter(roadRecValid).slice(-ROAD_MAX);
      var o = {}; o[ROAD_KEY] = { cur: SESSION, records: G.roadRecords };
      storeSet(o);
    });
  } catch (e) { /* ignore */ }

  try {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== 'local') return;
      if (changes[CFG_KEY]) G.cfg = sanitize(changes[CFG_KEY].newValue || DEFAULT);
      /* 弹窗点了「清除统计」→ 页面这边也同步把内存里的记录清掉，
       * 否则下一条新记录写回时会把已经清掉的旧记录带回来。 */
      if (changes[ROAD_KEY]) {
        var d = changes[ROAD_KEY].newValue;
        var arr = (d && Array.isArray(d.records)) ? d.records : [];
        G.roadRecords = arr.filter(function (r) { return r && r.src === 'wild'; })
          /* 第一百一十八批：与启动读档同口径，清掉无效 / 团体战脏记录 */
          /* v1.38：与启动读档同口径（保留历史、不因升级丢失） */
          .filter(roadRecValid).slice(-ROAD_MAX);
      }
    });
  } catch (e) { /* ignore */ }

  try { document.addEventListener('click', onCaptureClick, true); } catch (e) { /* ignore */ }
  // 400ms 一采样：战斗状态和闪光提示都是转瞬即逝，错过就漏判
  setInterval(function () { try { sample(); } catch (e) { /* ignore */ } }, 400);

  if (typeof module !== 'undefined' && module.exports) module.exports = root.PCG_SHINY_GUARD;
})(typeof window !== 'undefined' ? window : this);
