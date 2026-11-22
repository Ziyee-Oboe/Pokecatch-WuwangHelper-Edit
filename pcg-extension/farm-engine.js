/* Poke'Catch 防掉线助手 —— 道具 / 树果刷取共用引擎（第五批）
 *
 * 游戏这边的规则（对着线上 bundle app.443bc13cad.js，BUILD 1009d5ce6f 核对）：
 *   · 每次进入章节会重新生成整章节点表，写进存档 adv.nodes，当前下标是 adv.node；
 *   · 标了 item:true 的步骤有 70%（CONFIG.ITEM_EVENT_CHANCE）概率真的插一个
 *     type:"item" 的「道具格」，插在该步野怪 / 训练家节点之间的随机位置；
 *   · 走到道具格自动掷池，不需要玩家点；普通池是 ITEM_TABLE（树果 / 钱 / 进化石），
 *     若该步带 loot，则先按 loot 的概率判稀有道具，命中会覆盖普通池；
 *   · 稀有道具命中后写进 adv.gifts，同一种只会给一次；
 *   · 换章节 = 节点重刷 = 一次全新的抽奖机会。
 *
 * 所以「最大效率」不是一直挂在一张图里慢慢走，而是：
 *   1) 进章节立刻读 adv.nodes（DOM 时间线只是兜底），找到要的道具格在第几个点；
 *   2) 这一趟根本没刷出道具格 → 立刻切走重来，不陪它把整章走完（省掉 30% 的空转）；
 *   3) 走到道具格、奖励结算完的那一刻立刻切走，绝不等动画；
 *   4) 「回家章节」尽量选另一张也有早期道具格的图，来回两趟都能收，不让切图白跑；
 *   5) 全程把游戏速度拉到 ×3 / ×4（CONFIG.SPEEDS）。
 *
 * 第七十六批：原来第 3 条是「道具格刷得太靠后 → 也切走重来，因为重开一次的期望
 * 步数更短」，另有一套「时间线 N 秒没动 / 等太久就切走」的挂钟上限 —— 全部删掉。
 * 它们跟玩家要的正好相反：越是「只在靠后那一格才掉」的道具（美丽鳞片在冰之间
 * 第 29.4 个点），越会被判「重开更快」当场切走，重进又把时间线归零，
 * 于是永远走不到那一格。现在一轮只有事件能结束它。
 *
 * 另一条贯穿所有切图功能的硬规则由 shiny-guard.js 负责：
 *   遇到闪光宝可梦，战斗结束 + 结算缓冲走完之前，本引擎不切章节、不切屏幕。
 *
 * 数据边界：只读页面 DOM / 页面 localStorage、模拟点击；配置和统计写扩展本地存储，
 * 不改游戏存档、不拦截请求、不上传数据。
 */
(function (root) {
  'use strict';

  var CFG = root.PCG_CONFIG || {};
  var DATA = root.PCG_ITEM_DATA || null;
  var SAVE_KEY = CFG.SAVE_KEY || 'gachamon-save-v1';

  /* 第二十五批：刷新页面后要不要自动接着刷，统一由「页面自动化」里的 resumeOn 决定；
   * 卡片里原来那个「刷新游戏页后接着刷」已经删掉，这里只留一个兜底（读不到设置时按旧配置）。 */
  function resumeOk(cfg) {
    try {
      if (typeof root.PCG_SETTINGS_GET === 'function') {
        return root.PCG_SETTINGS_GET('resumeOn') !== false;
      }
    } catch (e) { /* ignore */ }
    return !cfg || cfg.resume !== false;
  }

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
    go: sel('dexMapGo', '.mp-go[data-go]'),
    speed: sel('dexSpeedBtns', '#speed-btns'),
    tl: '#timeline',
    tlNode: '#timeline .tl-node',
    tlCur: '#timeline .tl-node.current',
    tlCount: '#tl-count',
    enemy: '#enemy-slot .enemy',
    screenActive: '.screen.active'
  };

  /* 时间线上「道具格」的多语言标题后缀 */
  var ITEM_TITLE_RE = /道具|物品| objet|item|objeto|アイテム|아이템/i;
  /* 游戏给东西时弹的「获得」提示（中文 / 法文） */
  var GAIN_RE = /获得了?(.+?)[！!]|obtiens\s+(.+?)[!！]|(\d+)\s*[×x]\s*(.+)/i;

  /* 第五十六批 / 第六十二批 / 第六十七批那条「道具格刷得太靠后就切走重开」的
   * `nodeTooLate()` 判定，第七十六批**整条删掉**了（连同面板上那个勾选框）。
   * 理由：它按「这一格在第几个点」做事，跟玩家实际要的东西正好相反 ——
   * 越是「只在靠后那一格才掉」的稀有道具（美丽鳞片在冰之间第 29.4 个点），
   * 越会被判「太靠后，重开更快」当场切走；重进又把时间线归零，永远走不到那一格。
   * 现在只认事件：走到目标道具格并结算完 / 这一轮压根没刷出道具格，才切图。
   * 说明：狂爆模式本来就是「进图即算一趟」，从来走不到这段判定（第六十七批）。 */
  /* 第七十批那两条挂钟上限（stallLimit / hardLimit）也在第七十六批一起删了 ——
   * 「时间线 N 秒没动就切走」「等太久就切走」跟「同一章待太久，重开一轮保证效率」
   * 是同一类判定：路上撞进草丛打一场、战斗动画偏长、道具格排在很后面，都会被
   * 当成「卡住」把页面切走，表现就是「靠后的道具格永远拾不到」。
   * 现在改成只看事件：走完整轮还没到目标格才算这一轮真的没有这一格（见 watchCycle）。 */
  /* 第六十七批：狂爆 = 纯来回刷新。进图就算这一趟完了，什么都不用等、不用扫。
   * `spot.rushPingPong` 由 berry-farmer 挂在 spot 上。
   *
   * 第九十批：**`cfg.anyBerry` 不再是判据**。树果刷取并成「刷取任意树果」之后
   * anyBerry 恒为 true，再拿它当兜底就等于「每次进图都立刻切走」—— 一步不走、
   * 走不到道具格，一颗果子都拿不到。现在只认 spot 上的显式标记
   * （`rushPingPong` / `rush`），以及万一将来别的模块要用的 `cfg.rushPingPong`。 */
  function isRushPingPong(spot, cfg) {
    return !!(spot && (spot.rushPingPong || spot.rush)) || !!(cfg && cfg.rushPingPong);
  }
  /* 进图之后停多久再切走：给游戏一点时间把新地图排出来。
   * 不能是 0 —— 太密的话点地图的连点会被游戏吞掉；1.2 秒是切图动画的通常时长。 */
  var RUSH_PINGPONG_MS = 1200;

  function q(s, r) {
    try { return (r || document).querySelector(s); } catch (e) { return null; }
  }
  function qa(s, r) {
    try { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    catch (e) { return []; }
  }
  function txt(el) { return String((el && el.textContent) || '').trim(); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function norm(s) {
    return String(s == null ? '' : s).replace(/\s+/g, '').replace(/[·•・]/g, '').toLowerCase();
  }

  function storeGet(key, cb) {
    try { chrome.storage.local.get(key, function (v) { cb(v || {}); }); }
    catch (e) { cb({}); }
  }
  function storeSet(obj) {
    try { chrome.storage.local.set(obj, function () { void chrome.runtime.lastError; }); }
    catch (e) { /* ignore */ }
  }
  function guard() { return root.PCG_SHINY_GUARD || null; }
  function guardBlocked() {
    var g = guard();
    try { return !!(g && typeof g.blocked === 'function' && g.blocked()); }
    catch (e) { return false; }
  }
  function guardWait(owner) {
    var g = guard();
    if (!g || typeof g.waitClear !== 'function') return Promise.resolve(true);
    try { return g.waitClear(owner, 180000); } catch (e) { return Promise.resolve(true); }
  }
  function log(level, mod, msg) {
    try {
      if (root.PCG_LOG && typeof root.PCG_LOG.push === 'function') {
        root.PCG_LOG.push(level, mod, msg);
      }
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 存档 ---------------- */
  function makeReader() {
    var lastRaw = null, lastObj = null;
    return function readSave() {
      // 统一存档层：主键 / 备用键 / 会话存储 / 页面内存逐级兜底，避免各处硬读
      var SAVE = root.PCG_SAVE || null;
      if (SAVE) return SAVE.read();
      var raw = '';
      try { raw = localStorage.getItem(SAVE_KEY) || ''; } catch (e) { return lastObj; }
      if (raw === lastRaw) return lastObj;
      lastRaw = raw;
      try { lastObj = raw ? JSON.parse(raw) : null; } catch (e) { lastObj = null; }
      return lastObj;
    };
  }
  function advOf(save) { return (save && save.adv) || {}; }
  function chapterNow(save) {
    var a = advOf(save);
    return typeof a.chapter === 'number' ? a.chapter : -1;
  }
  function unlockedNow(save) {
    var a = advOf(save);
    return typeof a.unlocked === 'number' ? a.unlocked : 0;
  }
  function snapshotState(save) {
    var s = save || {};
    var items = {};
    if (s.items && typeof s.items === 'object') {
      for (var k in s.items) if (Object.prototype.hasOwnProperty.call(s.items, k)) {
        items[k] = Number(s.items[k]) || 0;
      }
    }
    return { items: items, money: Number(s.money) || 0 };
  }
  /* 第九十批：拥有判定改成「全存档扫描」，不再只认 save.mons。
   * 游戏派遣 / 上架 / 寄存时会用 takeOutMon() 把宝可梦实例从主列表 mons
   * 移走，转存到 pension.mons[].mon、under.slots[].mons、tradeOut.mon、
   * mktOut[].mon、eventTeams、vault… 等容器。旧版只扫 mons，于是
   * 「骑拉帝纳被派遣进地下通道」会被判成没拥有，白金宝珠（owns:[487]）
   * 的地图前置过不了，整个稀有道具刷取被锁死。
   * 现在按形状递归收一遍全部实例（游戏以后换新字段也不用改插件），
   * 图鉴 dex 记过也算拥有（沿用第五十七批既有口径）。
   * 判定严格对齐游戏的 owns() = pn().some(m => m.id === id)：只精确匹配
   * 实例 id，不做形态折算（游戏里变成起源形态 48701 就不再算拥有 487）。
   * 与 item-farmer.js 的 saveOwnsAll 同一口径。 */
  var OWN_CACHE = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
  var OWN_LAST = { save: null, have: null };
  function ownedIds(save) {
    if (!save || typeof save !== 'object') return {};
    if (OWN_CACHE) {
      var hit = OWN_CACHE.get(save);
      if (hit) return hit;
    } else if (OWN_LAST.save === save && OWN_LAST.have) {
      return OWN_LAST.have;
    }
    var have = {};
    /* 只认「长得像宝可梦实例」的对象：数值 id + uid/level/hp/nature/shiny 之一，
     * 免得把 items / stats / dex / gifts 里的普通数字误当成宝可梦。 */
    var stack = [save], seen = (typeof Set !== 'undefined') ? new Set() : null;
    var visited = [], nodes = 0;
    while (stack.length && nodes++ < 200000) {
      var o = stack.pop();
      if (!o || typeof o !== 'object') continue;
      if (seen) { if (seen.has(o)) continue; seen.add(o); }
      else if (visited.indexOf(o) >= 0) continue;
      else visited.push(o);
      if (typeof o.id === 'number' && o.id > 0 &&
          (o.uid != null || o.level != null || o.hp != null ||
           o.nature != null || o.shiny != null)) {
        have[o.id] = true;
      }
      for (var k in o) {
        if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
        var v = o[k];
        if (v && typeof v === 'object') stack.push(v);
      }
    }
    /* 图鉴记过也算拥有（游戏抓到时写 dex[id] = {caught:…}） */
    var dex = save.dex || {};
    for (var d in dex) {
      if (!Object.prototype.hasOwnProperty.call(dex, d) || !dex[d]) continue;
      var dn = Number(d);
      if (dn > 0) have[dn] = true;
    }
    if (OWN_CACHE) OWN_CACHE.set(save, have);
    else { OWN_LAST.save = save; OWN_LAST.have = have; }
    return have;
  }
  function ownsAll(save, ids) {
    if (!ids || !ids.length) return true;
    var have = ownedIds(save);
    for (var i = 0; i < ids.length; i++) {
      var n = Number(ids[i]);
      if (n > 0 && !have[n]) return false;
    }
    return true;
  }
  function hasBadge(save, badge) {
    if (!badge) return true;
    var arr = advOf(save).badges || [];
    for (var i = 0; i < arr.length; i++) if (String(arr[i]) === String(badge)) return true;
    return false;
  }

  /* ---------------- 地区门禁（第二十三批） ----------------
   * 所有切章刷新只允许在「玩家所在地区」里进行：
   *   · regionOfSave(save) = 存档 adv.chapter 所在地区；
   *   · roamSet(save)      = 此刻被游走神兽占着的章节（进去就要打神兽，避开）；
   *   · narrow(rows, save) = 先收窄到本地区，再排掉神兽章；本地区一张可用都没有
   *     时才退回全部（目标道具 / 树果只在别的地区掉，只能去一趟）。 */
  function cycleApi() { return root.PCG_MAP_CYCLE || null; }
  function regionOfCh(ch) {
    var MC = cycleApi();
    if (MC && typeof MC.regionOf === 'function') {
      var r = MC.regionOf(ch);
      if (r) return r;
    }
    return (DATA && typeof DATA.regionOf === 'function') ? (DATA.regionOf(ch) || '') : '';
  }
  function regionOfSave(save) {
    var MC = cycleApi();
    if (MC && typeof MC.regionNow === 'function') {
      var r = MC.regionNow(save);
      if (r) return r;
    }
    var ch = chapterNow(save);
    return ch < 0 ? '' : regionOfCh(ch);
  }
  function roamSet(save) {
    var MC = cycleApi();
    if (MC && typeof MC.roamChapters === 'function') return MC.roamChapters(save);
    var at = (save && save.roam && save.roam.at) || {};
    var now = Date.now(), out = {};
    for (var k in at) {
      if (!Object.prototype.hasOwnProperty.call(at, k)) continue;
      var s = at[k];
      if (!s || typeof s.ch !== 'number') continue;
      var until = Number(s.until) || 0;
      if (until && until <= now) continue;
      out[s.ch] = true;
    }
    return out;
  }
  function rowRegion(r) {
    if (r && r.spot && r.spot.rg) return r.spot.rg;
    if (r && r.region) return r.region;
    return regionOfCh(r && r.ch);
  }
  function narrow(rows, save) {
    var list = rows || [];
    var rg = regionOfSave(save), busy = roamSet(save);
    var same = rg ? list.filter(function (r) { return rowRegion(r) === rg; }) : [];
    var base = same.length ? same : list;
    var free = base.filter(function (r) { return !busy[r.ch]; });
    /* 同一章可能有好几个道具格，按「章」去重再报数 */
    var skipCh = {};
    for (var i = 0; i < base.length; i++) {
      if (busy[base[i].ch]) skipCh[base[i].ch] = true;
    }
    return {
      rows: free.length ? free : base,
      region: rg,
      regionZh: (rg && DATA && DATA.regionLabel) ? DATA.regionLabel(rg) : rg,
      sameRegion: same.length > 0,
      roamSkipped: free.length ? Object.keys(skipCh).length : 0
    };
  }
  /* 状态行 / 日志里的一句说明：什么时候破了「只在本地区切章」这条 */
  function pickNote(pick, row, save) {
    var parts = [];
    if (!pick || !row) return '';
    if (!pick.sameRegion && pick.region) {
      parts.push('当前地区（' + pick.regionZh + '）没有能刷的图，这一趟先去' +
        ((DATA && DATA.regionLabel) ? DATA.regionLabel(rowRegion(row)) : '别的地区') +
        '，到了就在那个地区里切章');
    }
    if (pick.roamSkipped > 0) {
      parts.push('避开 ' + pick.roamSkipped + ' 个正有游走神兽的章节');
    }
    return parts.join('；');
  }

  /* 第五十七批：道具格属于哪块区域。
   * 存档节点常给 name / zh / areas / step，都没有时退回离线表
   * DATA.chapter(ch).steps 里按 i 找中文地段名（ch57 的 steps 是 0/1/5，
   * 不能直接拿 step 当数组下标）。 */
  function nodeAreaOf(n, spot) {
    if (!n) return '';
    if (n.name) return String(n.name);
    if (n.zh) return String(n.zh);
    var a = n.areas || n.area || n.spot || n.stop;
    if (Array.isArray(a) && a.length) return String(a[0]);
    if (a && typeof a !== 'object') return String(a);
    var ch = spot && spot.ch, st = n.step;
    if (typeof ch === 'number' && typeof st === 'number' && DATA && DATA.chapter) {
      var c = DATA.chapter(ch);
      if (c && Array.isArray(c.steps)) {
        for (var i = 0; i < c.steps.length; i++) {
          if (Number(c.steps[i].i) === Number(st) && c.steps[i].zh) return String(c.steps[i].zh);
        }
      }
    }
    return typeof st === 'number' ? ('节点 ' + st) : '';
  }

  /* ---------------- 节点扫描（存档优先，DOM 兜底） ----------------
   * 返回 { idx, total, found, why, src, nodes, targets, lastIdx, ... }；
   * idx 是「第一个要等的道具格」在整章时间线里的 0 起下标。
   * 第五十七批：targets 收齐本章**所有**能掉目标道具的格子（不同区域各一个），
   * 每项带 { idx, hits:[命中的目标道具 id], area:所属区域 }。引擎据此逐格结算，
   * 全部拾取完才切图重进；树果 / 狂爆（wanted 为空）仍是单格，行为不变。 */
  function scanSaveNodes(save, wanted, spot) {
    var nodes = advOf(save).nodes;
    if (!nodes || !nodes.length) return null;
    var first = -1, plain = -1, lootIdx = -1, nameIdx = -1, count = 0, anyLoot = false;
    var targets = [], wantedList = (wanted || []).slice();
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n && n.loot) anyLoot = true;
      if (!n || n.type !== 'item') continue;
      count++;
      if (first < 0) first = i;                       // 本章最早的道具格（树果模式最优）
      if (plain < 0 && !n.find) plain = i;            // 普通池道具格（非一次性 find）
      /* 每个道具格单独判断 loot 里有没有目标道具，全章收齐而不是只看第一个。 */
      if (wantedList.length && !n.find && n.loot) {
        var hits = [];
        for (var j = 0; j < wantedList.length; j++) {
          if (Object.prototype.hasOwnProperty.call(n.loot, wantedList[j])) hits.push(wantedList[j]);
        }
        if (hits.length) {
          if (lootIdx < 0) lootIdx = i;
          targets.push({ idx: i, hits: hits, area: nodeAreaOf(n, spot) });
        }
      }
      if (nameIdx < 0 && n.name) {
        var nm = norm(n.name);
        if (nm && (nm === norm(spot && spot.fr) || nm === norm(spot && spot.zh))) nameIdx = i;
      }
    }
    var idx = -1;
    if (wantedList.length) {
      idx = lootIdx >= 0 ? lootIdx : nameIdx;
      // 存档结构变了（整章都没有 loot 字段）时别误判「这趟没刷出」，退回普通道具格
      if (idx < 0 && !anyLoot) idx = plain;
    } else {
      idx = first;
    }
    /* 名称 / 普通池兜底命中的那个点也要进 targets，保证至少有一个目标点 */
    if (idx >= 0 && !targets.some(function (t) { return t.idx === idx; })) {
      targets.push({ idx: idx, hits: [], area: nodeAreaOf(nodes[idx], spot) });
    }
    targets.sort(function (a, b) { return a.idx - b.idx; });
    var areas = {};
    for (var k = 0; k < targets.length; k++) areas[targets[k].area || ''] = 1;
    return {
      idx: idx,
      lastIdx: targets.length ? targets[targets.length - 1].idx : idx,
      targetIdx: targets.map(function (t) { return t.idx; }),
      targets: targets, areaCount: Object.keys(areas).length,
      total: nodes.length, found: idx >= 0,
      why: idx >= 0 ? '' : '这一趟没刷出目标道具格',
      src: 'save', nodes: nodes, itemCount: count
    };
  }
  function scanDomNodes() {
    var nodes = qa(Q.tlNode);
    if (!nodes.length) return null;
    var idx = -1, cur = -1;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var title = String(el.getAttribute('title') || '');
      if (el.classList.contains('current')) cur = i;
      if (idx < 0 && /道具|物品| objet|item|objeto|アイテム|아이템/i.test(title)) idx = i;
    }
    var pos = q(Q.tlCount);
    var m = /^(\d+)\s*\/\s*(\d+)$/.exec(txt(pos));
    return {
      idx: idx, total: nodes.length, found: idx >= 0,
      why: idx >= 0 ? '' : '这一趟没刷出道具格',
      src: 'dom', cur: m ? Number(m[1]) - 1 : cur,
      nodes: []
    };
  }
  function progress(save, scan) {
    var a = advOf(save);
    if (typeof a.node === 'number' && scan && scan.src === 'save') {
      return { cur: a.node, total: scan.total, src: 'save' };
    }
    var pos = q(Q.tlCount);
    var m = /^(\d+)\s*\/\s*(\d+)$/.exec(txt(pos));
    if (m) return { cur: Number(m[1]) - 1, total: Number(m[2]), src: 'dom' };
    var curEl = q(Q.tlCur);
    if (curEl) {
      var all = qa(Q.tlNode);
      for (var i = 0; i < all.length; i++) if (all[i] === curEl) {
        return { cur: i, total: all.length, src: 'dom' };
      }
    }
    return { cur: -1, total: scan ? scan.total : 0, src: 'none' };
  }

  /* ---------------- 创建引擎实例 ---------------- */
  function create(spec) {
    var readSave = makeReader();
    var ZERO_STATS = { cycles: 0, travels: 0, skips: 0, gains: 0, money: 0, since: 0 };

    var D = {
      running: false,
      busy: false,
      phase: '空闲',
      cfg: Object.assign({}, spec.defaultCfg),
      cur: null,
      note: '',
      stats: Object.assign({}, ZERO_STATS),
      tally: { total: 0, items: {}, money: 0, moneyCount: 0 },
      logs: [],
      lastCh: -1,
      startedAt: 0,
      ready: false,
      snap: null,            // 第三十四批：hud / hudFold 两个自建看板字段已废弃，统一走 PCG_HUD
      guardWaits: 0,
      waitTag: '',           // 第二十六批：等条件（退潮 / 前置）时用来去重日志
      effTag: '',            // 第四十批：记住上次写过的「只去这张图 + 期望」，别每轮重复
      /* 第六十八批：狂爆旁路账本 —— rushing 标记现在是不是狂爆模式，
       * gainBase 是上一份背包快照（含 items 与 money），rushWanted 是这批要认的 id */
      rushing: false,
      gainBase: null,
      rushWanted: []
    };

    /* ---------------- 通用小工具 ---------------- */
    function note(level, msg) {
      D.logs.push({ t: Date.now(), level: level, m: String(msg) });
      if (D.logs.length > 40) D.logs.shift();
      D.note = msg;
      log(level === 'error' ? 'error' : (level === 'warn' ? 'warn' : (level === 'ok' ? 'ok' : 'info')),
        spec.kind === 'berry' ? 'berry' : 'item', spec.title + '：' + msg);
    }
    function setPhase(p) { D.phase = p; }
    function gameReady() { return !!q(Q.speed) || !!q(Q.mapTab); }
    function saveCfg() { var o = {}; o[spec.cfgKey] = D.cfg; storeSet(o); }
    function saveRun() {
      var o = {};
      o[spec.runKey] = { running: D.running, cfg: D.cfg, lastCh: D.lastCh, at: Date.now() };
      storeSet(o);
    }
    function saveTally() {
      var o = {}; o[spec.tallyKey] = D.tally; storeSet(o);
    }
    function config(patch) {
      if (patch && typeof patch === 'object') {
        D.cfg = spec.sanitize(Object.assign({}, D.cfg, patch));
        saveCfg();
      }
      return Object.assign({}, D.cfg);
    }

    /* ---------------- 页面租约 / 互斥 ---------------- */
    function host() { return root.PCG_FARM_HOST || null; }
    function hostCall(name) {
      var h = host();
      try { return (h && typeof h[name] === 'function') ? h[name]() : false; }
      catch (e) { return false; }
    }
    function hostBusy() {
      return !!(guardBlocked() || hostCall('busy') || hostCall('screenBusy') || hostCall('otherAuto'));
    }
    function withScreen(fn) {
      var h = host();
      try { if (h && typeof h.hold === 'function') h.hold(30000); } catch (e) { /* ignore */ }
      try { return Promise.resolve(fn()).then(function (v) { freeHost(h); return v; },
        function (e) { freeHost(h); throw e; }); }
      catch (e) { freeHost(h); return Promise.reject(e); }
    }
    function freeHost(h) {
      try { if (h && typeof h.free === 'function') h.free(); } catch (e) { /* ignore */ }
    }

    /* ---------------- 地图操作 ---------------- */
    function mapActive() {
      var s = q(Q.mapScreen);
      return !!(s && s.classList.contains('active') && qa(Q.row).length);
    }
    async function openMap() {
      if (mapActive()) return true;
      var btn = q('#chapter-btn') || q('#side-chapter') || q(Q.mapTab);
      if (!btn) return false;
      try { btn.click(); } catch (e) { return false; }
      for (var i = 0; i < 30; i++) {
        await sleep(200);
        if (mapActive()) return true;
      }
      return mapActive();
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
    async function findRow(ch) {
      if (q(rowSel(ch))) return true;
      var cards = regionCards();
      for (var i = 0; i < cards.length; i++) {
        var before = qa(Q.row).map(function (e) { return e.getAttribute('data-ch'); }).join(',');
        try { cards[i].click(); } catch (e) { continue; }
        await sleep(320);
        if (q(rowSel(ch))) return true;
        var after = qa(Q.row).map(function (e) { return e.getAttribute('data-ch'); }).join(',');
        if (before !== after && q(rowSel(ch))) return true;
      }
      return !!q(rowSel(ch));
    }
    /* 线上 boot.js 的三颗按钮是 data-speed="1" / "2" / "4"（界面写 ×1 / ×2 / ×3），
     * CONFIG.SPEEDS = [1,2,4]。旧版按 data-speed="3" 找按钮，实际一个都点不中。
     * 这里做映射：面板里的 1/2/3 档 → 真实 1/2/4；默认拉满。 */
    var SPEED_VALUE = { 1: 1, 2: 2, 3: 4, 4: 4 };
    function setSpeed(n) {
      var v = SPEED_VALUE[num(n, 3)] || 4;
      var btn = q(Q.speed + ' button[data-speed="' + v + '"]');
      if (!btn) btn = q(Q.speed + ' button[data-speed="4"]');
      if (btn) { try { btn.click(); } catch (e) { /* ignore */ } }
      return v;
    }
    function autoClosePops() {
      if (!D.cfg.autoPop) return;
      var boxes = qa('.modal, [class*="modal"]');
      boxes.forEach(function (box) {
        var acts = qa('.modal-actions button, .btn', box).filter(function (b) {
          return b.offsetParent !== null;
        });
        if (acts.length === 1 &&
          /^(明白了！|明白了|OK|确定|好|Compris !|Compris|Continuer|Suivant|Valider)$/i.test(txt(acts[0]))) {
          try { acts[0].click(); } catch (e) { /* ignore */ }
        }
      });
    }

    /* 切到某一章。已经在目标章时先绕去「回家章」再回来 —— 换章节才会重刷节点。 */
    async function goChapter(ch, why) {
      if (!await guardWait(spec.kind)) return false;      // 闪光战斗没打完，不切
      if (!await openMap()) return false;
      if (!await findRow(ch)) return false;
      var row = q(rowSel(ch));
      if (!row) return false;
      try { row.click(); } catch (e) { return false; }
      await sleep(420);
      var go = q(Q.detail + ' ' + Q.go + '[data-go="' + ch + '"]:not([disabled])') ||
        q(Q.go + '[data-go="' + ch + '"]:not([disabled])') ||
        q(Q.go + ':not([disabled])');
      if (!go || go.disabled) { closeDetail(); return false; }
      try { go.click(); } catch (e) { closeDetail(); return false; }
      await sleep(650);
      closeDetail();
      backToAdventure();
      for (var i = 0; i < 10; i++) {
        if (chapterNow(readSave()) === ch) {
          D.stats.travels++;
          setSpeed(D.cfg.speed);
          if (why) note('info', why);
          return true;
        }
        await sleep(300);
      }
      return false;
    }
    function homeOf(ch) {
      /* 第七批：所有会切图的功能统一走 PCG_MAP_CYCLE 的中立章选择
       * （本地区、已解锁、离目标章最近、没有游走神兽），和神兽追踪同款「绕一下再回来」。
       * 第二十三批：本地区没有可绕的章时返回 -1，绝不跨地区兜底。 */
      var CYCLE = root.PCG_MAP_CYCLE || null;
      var save = readSave();
      if (CYCLE && typeof CYCLE.neutralChapter === 'function') {
        var n = CYCLE.neutralChapter(ch, save);
        if (typeof n === 'number' && n >= 0 && n !== ch) return n;
      }
      var c = DATA && DATA.chapter ? DATA.chapter(ch) : null;
      var home = c && typeof c.home === 'number' ? c.home : -1;
      if (home < 0 || home === ch || home > unlockedNow(save)) return -1;
      if (CYCLE && typeof CYCLE.regionOf === 'function' &&
        CYCLE.regionOf(home) !== CYCLE.regionOf(ch)) return -1;
      return home;
    }
    async function travelTo(spot) {
      var ch = spot.ch;
      var CYCLE0 = root.PCG_MAP_CYCLE || null;
      if (chapterNow(readSave()) === ch) {
        /* v1.32：游戏在「当前挑战章」详情新增了「重新挑战」按钮，点它直接重建
         * 本章节点（= 重抽一轮道具格），一次点击顶掉老逻辑「绕中立章再回来」两次切图。
         * 按钮不可用（老版本 / 不在当前章）时自动回退到下面的绕章逻辑。 */
        if (CYCLE0 && typeof CYCLE0.restart === 'function') {
          var restarted = false;
          try {
            restarted = await withScreen(function () {
              return CYCLE0.restart(ch, { owner: spec.kind, save: readSave(), readSave: readSave });
            });
          } catch (e) { restarted = false; }
          if (restarted) {
            D.stats.travels++;
            setSpeed(D.cfg.speed);
            return true;
          }
        }
        /* 回退：先离章再回来，否则节点表不会重新生成 */
        var hop = homeOf(ch);
        if (hop >= 0 && hop !== ch) {
          var ok = await withScreen(function () { return goChapter(hop, ''); });
          if (!ok) return false;
          D.lastCh = hop;
        }
        /* 本地区只有这一章 / 都被游走神兽占着 → 不绕，直接重进目标章 */
      }
      return await withScreen(function () {
        /* 第五十四批：狂爆刷取的固定图在界面上叫「银河队基地 · 帷幕市」，
         * 但存档时间线里的道具格仍叫「银河队基地」；显示名与匹配名分开存。 */
        return goChapter(ch, '进入 ' + (spot.chapterZh || ('第 ' + (ch + 1) + ' 章')) +
          ' · ' + (spot.displayZh || spot.zh || '') + '（' + spec.targetLabel(D.cfg) + '）');
      });
    }

    /* ---------------- 一轮：等道具格、结算、记收益 ---------------- */
    async function watchCycle(spot, wanted, scan) {
      /* 第六十七批：狂爆 = 纯来回刷新。走到这里说明刚进完图（travelTo 已经点过「前往」），
       * 这张图的地图已经重排过一次了 —— 这就算这一趟刷完了：
       * 不扫时间线、不找道具格、一步都不走，停 `RUSH_PINGPONG_MS` 就切另一章。
       * 第六十八批：**掉落照记**。原来这里 `return` 得太干脆，一趟只有一个
       * `sleep`，收益一条都没进账 —— 弹窗就永远「还没有收益记录」。
       * 现在停完立刻让旁路账本（`rushTick`）比一次背包，之后每 500ms 还有一条
       * 定时器兜着（进图→拾取→切走的时序不会因为切章快而漏记）。 */
      if (isRushPingPong(spot, D.cfg)) {
        setPhase('刷新了一次，收一下掉落…');
        await sleep(RUSH_PINGPONG_MS);
        var got = null;
        try { got = rushTick(); } catch (e) { got = null; }
        void got;
        return { leave: true, pingPong: true, settled: true, why: '' };
      }
      var base = snapshotState(readSave());
      var frozen = false;
      var began = Date.now();
      /* 第七十六批：`lateLimit` / `lastCur` / `lastMoveAt` 三个变量随之作废 ——
       * 「道具格太靠后重开」和「时间线不动就切走」两条判定都删了，
       * 这里只留 `began`（进图宽限 + 读不到时间线的兜底用）。 */

      /* 第五十七批：本章所有目标道具点（不同区域各一格），逐格结算，
       * **全部拾取完**才 leave 切图重进。 */
      var targets = [], settled = {}, doneCount = 0, lastGains = null;
      function initTargets(sc) {
        if (!sc) return;
        if (sc.targets && sc.targets.length) targets = sc.targets.slice();
        else if (sc.idx >= 0) targets = [{ idx: sc.idx, hits: [], area: '' }];
        targets.sort(function (a, b) { return a.idx - b.idx; });
      }
      initTargets(scan);

      while (D.running) {
        await sleep(Math.max(200, num(D.cfg.intervalMs, 600)));
        if (!D.running) return { leave: false };
        autoClosePops();
        if (guardBlocked()) {
          setPhase('等闪光战斗结束');
          D.guardWaits++;
          await guardWait(spec.kind);
          continue;                                     // 战斗没结束绝不切走
        }
        if (hostCall('busy') || hostCall('screenBusy') || hostCall('otherAuto')) {
          setPhase('让路：' + (hostCall('who') || '其它自动化') + '在切页');
          continue;
        }
        var save = readSave();
        if (chapterNow(save) !== spot.ch) {
          return { leave: true, why: '章节变了，重新选图', skip: false };
        }
        var sc = scan || scanSaveNodes(save, wanted, spot) || scanDomNodes();
        scan = sc;
        if (!targets.length) initTargets(sc);
        if (!sc || !sc.total) {
          if (Date.now() - began > 9000) return { leave: true, why: '读不到时间线，切走重来', skip: true };
          setPhase('等时间线刷新');
          continue;
        }
        if (!sc.found) {
          /* 第七十批：进图第一拍先别信「这趟没刷出道具格」。
           * 点完「前往」之后，存档里的 `adv.chapter` 先变、`adv.nodes` 可能还留着
           * 上一趟那份（或者干脆是空的，只能退回读 DOM 时间线），这一拍扫出来
           * 当然是 `found:false` —— 于是引擎当场切走，永远走不到道具格。
           * 美丽鳞片只有冰之间这一张图（at 29.4，全章最深的一格），一旦这样误判，
           * 表现就是「进图就切走、一辈子刷不到」。所以：
           *   ① 进图 1.2 秒内不下结论；
           *   ② 到点用**最新存档**复核一次，复核说有就接着等；
           *   ③ 两次都说没有才切走。 */
          if (Date.now() - began < 1200) { setPhase('等时间线刷新'); continue; }
          var resc = scanSaveNodes(save, wanted, spot);
          if (resc && resc.found) {
            scan = resc; sc = resc;
            targets = []; settled = {}; doneCount = 0;
            initTargets(resc);
            setPhase('节点表刚刷新，重新等目标道具点');
            continue;
          }
          D.stats.skips++;
          setPhase('这一趟没刷出道具格，切走');
          return { leave: true, why: '没刷出道具格，立刻重开（省掉空转）', skip: true };
        }
        /* 第七十六批：`nodeTooLate()` 那条「道具格太靠后就切走重开」整段删掉。
         * 它是按「这一格排在第几个点」做事的，越需要靠后那一格的道具越会被它
         * 当场判死（美丽鳞片：冰之间第 29.4 个点，阈值 50 只是运气好没撞上），
         * 玩家反馈的「靠后道具格的道具永远拾不到」就是这类判定造成的。
         * 现在不管这一格在第几个点，都老老实实走过去。 */
        var next = -1, nextInfo = null;
        for (var ti = 0; ti < targets.length; ti++) {
          if (!settled[targets[ti].idx]) { next = targets[ti].idx; nextInfo = targets[ti]; break; }
        }
        if (next < 0) next = (sc.lastIdx >= 0 ? sc.lastIdx : sc.idx);
        var pr = progress(save, sc);
        if (!frozen && pr.cur >= 0 && pr.cur < next) base = snapshotState(save);
        if (pr.cur >= 0 && pr.cur >= next) frozen = true;

        if (pr.cur >= 0 && pr.cur > next) {
          // 已经走过这一格：给奖励动画 / 存档落盘一点时间，再按背包差值记账
          await sleep(Math.max(400, num(D.cfg.settleMs, 1400)));
          var nowSave = readSave();
          var gains = applySettle(base, nowSave, wanted);
          lastGains = gains;
          settled[next] = true;
          doneCount++;
          var areaTxt = (nextInfo && nextInfo.area) ? (' · ' + nextInfo.area) : '';
          note(gains.wanted ? 'ok' : 'info',
            '第 ' + doneCount + ' / ' + targets.length + ' 个目标道具点' + areaTxt +
            '：' + (gains.wanted ? '掉到目标道具' : '没掉目标道具') + ' · ' + gains.text);
          /* 下一格要重新取基线，否则上一格的收益会被重复记一次 */
          base = snapshotState(nowSave);
          frozen = false;
          if (doneCount < targets.length) {
            setPhase('继续等下一个目标道具点（' + doneCount + ' / ' + targets.length + '）');
            continue;
          }
          setPhase('本章目标道具点全部拾取，切走重进');
          return {
            leave: true, settled: true, gains: gains, spots: targets.length,
            why: '本章 ' + targets.length + ' 个目标道具点已全部拾取 · ' + gains.text
          };
        }
        setPhase('等目标道具点（第 ' + (doneCount + 1) + ' / ' + targets.length + ' 个' +
          (nextInfo && nextInfo.area ? ' · ' + nextInfo.area : '') +
          ' · 第 ' + Math.max(1, next + 1) + ' / ' + pr.total +
          ' 个点，当前 ' + Math.max(1, pr.cur + 1) + '）');
        /* 第七十六批：两道挂钟上限（stallLimit / hardLimit）全部删掉。
         * 它们跟「同一章待太久，重开一轮保证效率」是同一类判定：路上撞进草丛打一场、
         * 战斗结算慢一点、道具格排在很靠后，时间线这几秒不动就被当成「卡住」切走，
         * 页面一离开，这一格就再也捡不回来了（重进＝时间线归零）。
         * 只留一条**事件**兜底：已经走到这一轮的最后一个点、目标道具格却还没到 ——
         * 那才是「这一轮确实没有这一格 / 节点表已经过期」，切走重抽才有意义。 */
        if (pr.cur >= 0 && pr.total > 0 && pr.cur >= pr.total - 1 && pr.cur < next) {
          return {
            leave: true, skip: true,
            why: '走到这一轮最后一个点（第 ' + pr.total + ' 个）还没到目标道具格，切走重抽'
          };
        }
      }
      void lastGains;
      return { leave: false };
    }

    /* 第六十八批：把「算差值」和「记账」拆成两件事。
     * 原来这里一把梭：只有**走到道具格那一格**（`pr.cur > next`）才会被调用，
     * 记账和 note 都绑在那条路径上。狂爆模式一趟只有 1.2 秒、走的是
     * 「进图 → 切走」那条早退分支，压根进不到这里 —— 于是游戏里明明弹了
     * 「你获得了桃桃果！」，弹窗收益区却一直停在「还没有收益记录」。
     * 现在：`settleDiff` 只算差值（纯函数、可单测），`ledgerBook` 负责写账 + 记日志。 */
    function settleDiff(base, cur, wanted) {
      var items = (cur && cur.items) || {};
      var bItems = (base && base.items) || {};
      var got = [], total = 0, wantedHit = 0;
      for (var id in items) {
        if (!Object.prototype.hasOwnProperty.call(items, id)) continue;
        var n = Number(items[id]) || 0, b = Number(bItems[id]) || 0;
        if (n <= b) continue;
        var add = n - b;
        got.push({ id: id, name: (DATA && DATA.itemName) ? DATA.itemName(id) : id, n: add });
        total += add;
        if (typeof spec.gainWanted === 'function' && spec.gainWanted(id, D.cfg, wanted)) wantedHit += add;
      }
      var money = (Number(cur && cur.money) || 0) - (Number(base && base.money) || 0);
      var parts = [];
      for (var i = 0; i < Math.min(3, got.length); i++) {
        parts.push(got[i].name + (got[i].n > 1 ? ' ×' + got[i].n : ''));
      }
      if (money > 0) parts.push('+' + money + ' ₽');
      var body = parts.length ? parts.join('、') : '没掉东西';
      return {
        items: got, total: total, money: money, wanted: wantedHit,
        body: body, text: '道具格结算：' + body
      };
    }
    function ledgerBook(g, title) {
      if (!g || (!g.items.length && !(g.money > 0))) return g;
      for (var i = 0; i < g.items.length; i++) {
        var id = g.items[i].id;
        D.tally.items[id] = (D.tally.items[id] || 0) + g.items[i].n;
      }
      if (g.money > 0) { D.tally.money += g.money; D.tally.moneyCount++; D.stats.money += g.money; }
      D.tally.total += g.total;
      D.stats.gains += g.wanted;
      saveTally();
      note(g.wanted ? 'ok' : 'info',
        (g.wanted ? '🎯 ' : '') + (title || '道具格结算') + '：' + g.body);
      return g;
    }
    function applySettle(base, save, wanted) {
      var g = settleDiff(base, snapshotState(save), wanted);
      ledgerBook(g, '道具格结算');
      return g;
    }
    /* 狂爆旁路账本：读一次背包，跟基线比，有增量就记账并把基线推到新值。
     * 背包只增不减 —— 出现「某格变少」说明是玩家自己用掉了（喂果 / 卖掉），
     * 这时基线照样降到新值，绝不当负收益。 */
    function rushTick() {
      if (!D.running || !D.rushing) return null;
      var save = readSave();
      /* 读不到存档（切图 / 存档正在重写的瞬间）就跳过这一拍：
       * 否则空快照会把基线抹成 0，下一拍整个背包都会被当成「新掉的」记一遍。 */
      if (!save || !save.items) return null;
      var cur = snapshotState(save);
      if (!D.gainBase) { D.gainBase = cur; return null; }
      var g = settleDiff(D.gainBase, cur, D.rushWanted || []);
      D.gainBase = cur;
      return (g.total > 0 || g.money > 0) ? ledgerBook(g, '狂爆掉落') : g;
    }

    /* ---------------- 主循环 ---------------- */
    async function runLoop() {
      while (D.running) {
        if (hostBusy()) {
          if (guardBlocked()) setPhase('等闪光战斗结束');
          else setPhase('让路：' + (hostCall('who') || '其它自动化') + '在切页');
          await sleep(2500);
          continue;
        }
        var save = readSave();
        var ctx = saveCtx(save);
        var plan;
        try { plan = spec.plan(D.cfg, save, ctx); }
        catch (e) { note('error', '选图出错：' + ((e && e.message) || e)); return stop('选图失败，已停止'); }
        if (plan.done) { note('ok', plan.done); return stop(plan.done); }
        /* 第五十批：选图时把「受天气/时段限制、这会儿刷不了」的那几项挪到了队尾 ——
         * 顺序写回配置（面板上的序号跟着变），照新顺序接着刷，不在这里等。 */
        if (plan.reorder && plan.reorder.length) {
          var reCfg = Object.assign({}, D.cfg, { targets: plan.reorder });
          D.cfg = spec.sanitize ? spec.sanitize(reCfg) : reCfg;
          saveCfg();
          saveRun();
          note('info', plan.deferNote || ('刷取顺序调整成：' + spec.targetLabel(D.cfg)));
        }
        /* 第二十六批：条件暂时不满足（例如冰之间要退潮）——挂起等，不算失败，
         * 也别把功能停掉；每 15 秒重判一次，点停止随时能停。 */
        if (plan.wait) {
          setPhase(plan.phase || '等条件满足');
          if (D.waitTag !== (plan.phase || 'wait')) {
            D.waitTag = plan.phase || 'wait';
            note('warn', plan.reason || plan.phase || '条件还没满足，先等一会');
          }
          await sleep(Math.min(15000, Math.max(2000, num(plan.waitMs, 15000))));
          continue;
        }
        D.waitTag = '';
        if (!plan.spot) { note('warn', plan.reason || '找不到可去的地图'); return stop(plan.reason || '没有可刷的地图'); }
        if (D.cfg.maxCycles > 0 && D.stats.cycles >= D.cfg.maxCycles) {
          var t = '已跑满 ' + D.cfg.maxCycles + ' 轮';
          note('ok', t); return stop(t);
        }
        /* 第六十八批：狂爆旁路账本的开关与基线。
         * 只在**刚切进狂爆**那一刻取基线（= 进图前的背包）；进来之后基线
         * 交给 `rushTick` 一格一格往前推，别每轮都重置 —— 重置会把
         * 「上一趟刚掉、还没来得及记」的那一份直接吞掉。 */
        var rushNow = isRushPingPong(plan.spot, D.cfg);
        if (rushNow && !D.rushing) D.gainBase = snapshotState(save);
        D.rushing = rushNow;
        D.rushWanted = (plan.wantedAll && plan.wantedAll.length)
          ? plan.wantedAll.slice() : (plan.wanted || []).slice();

        D.cur = {
          key: plan.spot.key, ch: plan.spot.ch, step: plan.spot.step,
          label: (plan.spot.chapterZh || ('第 ' + (plan.spot.ch + 1) + ' 章')) +
            ' · ' + (plan.spot.displayZh || plan.spot.zh || ''),
          /* 第五十七批：本章所有能掉目标道具的点一起收，别只带当前那一种 */
          at: plan.spot.at,
          wanted: (plan.wantedAll && plan.wantedAll.length) ? plan.wantedAll : (plan.wanted || []),
          since: Date.now(),
          /* 第二十六批：正在找的是哪一种道具（一次只找一种） */
          item: plan.target ? ((DATA && DATA.itemName) ? DATA.itemName(plan.target) : plan.target) : '',
          /* 第四十批：这一张图的获取期望（「单趟 0.7% · 143 轮」）；
           * 第四十一批树果也给了（「单趟 1.6% · 63 轮」），看板页脚直接读它 */
          expect: plan.effShort || plan.effText || ''
        };
        setPhase('前往 ' + D.cur.label);
        /* 第四十批：稀有道具只去效率第一名那一张图，进图前把这张图的期望写进日志；
         * 第四十一批树果是「前两名轮换」，日志换成两张一起写（plan.effNote）。 */
        if (plan.effText && D.effTag !== plan.effText) {
          D.effTag = plan.effText;
          note('info', plan.effNote || ((D.cur.item ? '「' + D.cur.item + '」' : '') +
            '只去 ' + D.cur.label + '：' + plan.effText));
        }
        var ok = false;
        try { ok = await travelTo(plan.spot); }
        catch (e) { note('warn', '切图失败：' + ((e && e.message) || e)); ok = false; }
        if (!ok) {
          if (guardBlocked()) { setPhase('等闪光战斗结束'); await guardWait(spec.kind); continue; }
          note('warn', '进不去 ' + D.cur.label + '（多半章节未解锁），稍后重试');
          await sleep(4000);
          continue;
        }
        D.lastCh = plan.spot.ch;
        saveRun();
        if (plan.regionNote) note('info', plan.regionNote);
        var res;
        try {
          var wantedAll = (plan.wantedAll && plan.wantedAll.length)
            ? plan.wantedAll : (plan.wanted || []);
          /* 第六十七批：狂爆连扫描都省了 —— 不读存档时间线、不读 DOM 时间线，
           * 进图之后直接进 watchCycle 让它切走。 */
          var scan = isRushPingPong(plan.spot, D.cfg)
            ? null
            : (scanSaveNodes(readSave(), wantedAll, plan.spot) || scanDomNodes());
          res = await watchCycle(plan.spot, wantedAll, scan);
        } catch (e) {
          note('warn', '这一轮出错：' + ((e && e.message) || e));
          res = { leave: true, why: '出错，切走重来', skip: true };
        }
        D.stats.cycles++;
        if (res.why) note(res.settled ? 'info' : 'warn', res.why);
        if (!D.running) break;
        // 完成条件基于最新存档再判一次（稀有道具可能刚刚到手）
        var doneNow = '';
        try { doneNow = spec.done(D.cfg, readSave(), D.tally, D.stats) || ''; } catch (e) { /* ignore */ }
        if (doneNow) { note('ok', doneNow); return stop(doneNow); }
        setPhase('切走重来');
      }
    }

    function saveCtx(save) {
      var CYCLE = root.PCG_MAP_CYCLE || null;
      return {
        data: DATA,
        lastCh: D.lastCh,
        cycles: D.stats.cycles,
        chapter: chapterNow(save),
        unlocked: unlockedNow(save),
        save: save,
        /* 第二十三批：当前所在地区 —— 选图时只在这个地区里挑 */
        region: (CYCLE && typeof CYCLE.regionNow === 'function')
          ? (CYCLE.regionNow(save) || '') : '',
        roam: (CYCLE && typeof CYCLE.roamChapters === 'function')
          ? CYCLE.roamChapters(save) : null,
        ownsAll: function (ids) { return ownsAll(save, ids); },
        hasBadge: function (b) { return hasBadge(save, b); }
      };
    }

    /* ---------------- 开关 / 对外 API ---------------- */
    function start(opts) {
      if (D.running) return { ok: false, text: '已经在跑了，先点停止' };
      if (!gameReady()) return { ok: false, text: '游戏还没加载完，进游戏后再点开始' };
      var o = opts || {};
      if (Object.keys(o.cfg || o).length) config(o.cfg || o);
      var save = readSave();
      var chk = spec.validate ? spec.validate(D.cfg, save, DATA) : null;
      if (chk && !chk.ok) return chk;
      D.running = true;
      D.startedAt = Date.now();
      D.stats = Object.assign({}, ZERO_STATS, { since: Date.now() });
      D.note = '';
      D.lastCh = chapterNow(save);
      /* 第六十八批：开跑先立一份背包基线，狂爆那边从这一刻起算掉落 */
      D.rushing = false;
      D.gainBase = snapshotState(save);
      D.rushWanted = [];
      saveRun();
      setPhase('启动中');
      note('ok', '开始' + spec.title + '：' + spec.targetLabel(D.cfg));
      runLoop().catch(function (e) {
        note('error', '主循环异常：' + ((e && e.message) || e));
        stop('主循环异常，已停止');
      });
      return { ok: true, text: '已开始：' + spec.targetLabel(D.cfg) };
    }
    function stop(text) {
      /* 第六十八批：停之前先把背包比一次 —— 最后一趟的掉落别丢 */
      try { rushTick(); } catch (e) { /* ignore */ }
      D.running = false;
      D.cur = null;
      D.waitTag = '';
      D.rushing = false;
      D.gainBase = null;
      setPhase('空闲');
      saveRun();
      freeHost(host());
      var t = text || '已停止';
      note('info', t);
      hudPaint(null, true);
      return { ok: true, text: t };
    }
    function scan() {
      if (!gameReady()) return { ok: false, text: '游戏还没加载完' };
      try {
        var save = readSave();
        var rows = spec.rank(D.cfg, save, saveCtx(save));
        return { ok: true, text: '扫描完成：' + rows.length + ' 张可用地图', rows: rows };
      } catch (e) {
        return { ok: false, text: '扫描失败：' + ((e && e.message) || e) };
      }
    }
    function clear() {
      D.tally = { total: 0, items: {}, money: 0, moneyCount: 0 };
      D.stats = Object.assign({}, ZERO_STATS, { since: Date.now() });
      D.logs = [];
      saveTally();
      note('info', '统计已清零');
      return { ok: true, text: '统计已清零' };
    }
    function rankRows() {
      try { return spec.rank(D.cfg, readSave(), saveCtx(readSave())); }
      catch (e) { return []; }
    }
    function state() {
      var save = readSave();
      var guardState = null;
      try { if (guard() && guard().state) guardState = guard().state(); } catch (e) { /* ignore */ }
      var top = [];
      for (var id in D.tally.items) {
        if (!Object.prototype.hasOwnProperty.call(D.tally.items, id)) continue;
        top.push({ id: id, name: (DATA && DATA.itemName) ? DATA.itemName(id) : id, n: D.tally.items[id] });
      }
      top.sort(function (a, b) { return b.n - a.n; });
      /* 第二十六批：面板要把「已获得 / 未解锁地图 / 正在找哪个」画出来，
       * 逐项状态由 spec.extra 提供（没有就返回 null，树果那边不受影响）。 */
      var ex = null;
      try { ex = (typeof spec.extra === 'function') ? spec.extra(save, D.cfg) : null; } catch (e) { ex = null; }
      return {
        version: CFG.VERSION || '',
        build: DATA ? DATA.build : '',
        kind: spec.kind,
        title: spec.title,
        running: D.running,
        phase: D.phase,
        cfg: Object.assign({}, D.cfg),
        ready: gameReady(),
        cur: D.cur ? Object.assign({}, D.cur) : null,
        target: spec.targetLabel(D.cfg),
        extra: ex,
        chapter: chapterNow(save),
        unlocked: unlockedNow(save),
        ranks: rankRows().slice(0, 12),
        stats: Object.assign({}, D.stats),
        tally: { total: D.tally.total, money: D.tally.money,
          moneyCount: D.tally.moneyCount, top: top.slice(0, 10) },
        guard: guardState ? { blocked: guardState.blocked, reason: guardState.reason } : null,
        since: D.startedAt,
        note: D.note,
        logs: D.logs.slice(-20)
      };
    }

    /* ---------------- 悬浮看板（第三十四批：并入统一看板 PCG_HUD） ----------------
     * 原来这里自己画一套（宽 262、三格、顶栏只能折叠不能拖）。现在跟图鉴捕捉 /
     * 传说追踪 / 联盟刷钱 / 黑市扫货 / 地下通道共用 hud-panel.js 那一张卡：
     * 可拖动、可折叠、位置和折叠状态按 key 记在 chrome.storage.local；
     * 规矩不变——功能在跑才出现，停止自动收起（cfg.hudAlways 已废弃不再看）。 */
    /* 第五十一批：顶栏的 × 直接挂到 stop —— 关掉看板就等于停掉这次刷取。 */
    function hudPanel() {
      if (!root.PCG_HUD || typeof root.PCG_HUD.panel !== 'function') return null;
      try {
        return root.PCG_HUD.panel(spec.kind, spec.title, {
          onClose: function () { stop('已从悬浮看板关闭'); }
        });
      } catch (e) { return null; }
    }
    function hudSnap(s) {
      var ex = s.extra || null;
      /* 第二十六批：一次只找一种，看板第一格写「正在找哪个」，
       * 第二格写已经到手几种（勾了几种），比只写累计到手个数直观。 */
      /* 没在跑就别写「正在找 X」，空闲时留个破折号，免得看板自相矛盾 */
      var doing = s.running ? ((ex && ex.currentName) || (s.cur && s.cur.item) || '—') : '—';
      var prog = (ex && ex.gotCount != null && ex.totalCount != null)
        ? (ex.gotCount + ' / ' + ex.totalCount)          // 道具刷取：到手几种 / 勾了几种
        : String(s.stats.gains);                          // 树果刷取：本次到手个数
      /* 第二十六批：phase 里可能已经带着目标名（「前往 心灵徽章 · 冰之间」），
       * 那就别把同一句再写一遍，页脚只占一行。 */
      var curTxt = String((s.cur ? s.cur.label : s.target) || '');
      var phLine = s.phase != null ? String(s.phase) : '';
      var foot;
      if (phLine && (phLine === curTxt || (curTxt && phLine.indexOf(curTxt) >= 0))) {
        foot = phLine;                                   // phase 已经带上了目标名，只写一次
      } else {
        foot = curTxt + (phLine ? (curTxt ? ' · ' : '') + phLine : '');
      }
      foot += (s.guard && s.guard.blocked ? ' · 闪光战斗中，暂不切图' : '') +
        (ex && ex.tideWaiting ? ' · 等退潮' : '') +
        /* 第四十批：跑到哪张图就把这张图的期望写在页脚（稀有道具 / 树果都有） */
        ((s.cur && s.cur.expect) ? ' · ' + s.cur.expect : '');
      /* 第五十六批：收益改成弹窗 .fm-tally 同款的一排紧凑胶囊，全部列出来。
       * 原来 rows 只画前 4 行，桃桃果 / 谜芝果 / 金币这些排在后面的收获
       * 在看板上根本看不到（弹窗里却明明有），看着就像「显示不全」。
       * 金币单独补一枚胶囊，跟弹窗最后那枚「金币 +6852」对齐。 */
      var list = (s.tally && s.tally.top) || [];
      var chips = [];
      for (var i = 0; i < list.length; i++) {
        chips.push({ nm: list[i].name, val: '×' + list[i].n });
      }
      if (s.tally && Number(s.tally.money) > 0) {
        chips.push({ nm: '金币', val: '+' + s.tally.money });
      }
      return {
        star: (s.guard && s.guard.blocked) ? '✦' : (D.running ? '●' : ''),
        cells: [
          ['正在找', doing, D.running ? 'gold' : ''],
          ['已到手', prog, 'gold'],
          ['轮次', s.stats.cycles || 0],
          ['累计到手', s.tally ? s.tally.total : 0]
        ],
        rows: [],
        chips: chips,
        empty: '',
        chipsEmpty: chips.length ? '' : '还没有收益记录',
        foot: foot,
        footOn: !!D.running
      };
    }
    function hudPaint(snap, force) {
      var P = hudPanel();
      if (!P) return;
      if (!D.cfg.hud || !D.running) { P.hide(); return; }
      var s = snap;
      if (!s || !s.stats || !s.tally) s = state();
      P.set(hudSnap(s)).show();
      void force;                                        // 统一看板自己按签名去重，这里不用强刷
    }

    /* ---------------- 启动 / 断点恢复 ---------------- */
    storeGet(spec.cfgKey, function (v) {
      if (v && v[spec.cfgKey]) D.cfg = spec.sanitize(v[spec.cfgKey]);
    });
    storeGet(spec.tallyKey, function (v) {
      var t = v && v[spec.tallyKey];
      if (t && typeof t === 'object') {
        D.tally = { total: Number(t.total) || 0, items: Object.assign({}, t.items || {}),
          money: Number(t.money) || 0, moneyCount: Number(t.moneyCount) || 0 };
      }
    });
    storeGet(spec.runKey, function (v) {
      var run = v && v[spec.runKey];
      if (!run || !run.running || !resumeOk(D.cfg)) return;
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        if (gameReady()) {
          clearInterval(timer);
          if (run.cfg) D.cfg = spec.sanitize(run.cfg);
          D.lastCh = Number(run.lastCh) || -1;
          note('warn', '检测到上次未跑完的' + spec.title + '，自动恢复');
          try { start({}); } catch (e) { /* ignore */ }
        } else if (tries > 60) clearInterval(timer);
      }, 2000);
    });
    setInterval(function () {
      try { hudPaint(state(), false); } catch (e) { /* ignore */ }
    }, 2000);
    /* 第六十八批：狂爆旁路账本的心跳。狂爆一趟只有 1.2 秒、不进结算分支，
     * 掉落全靠这条（`rushTick` 自己看 `D.rushing`，非狂爆时立刻返回，零开销）。
     * 500ms 比 RUSH_PINGPONG_MS 细，切章再快也不会整整漏一趟。 */
    setInterval(function () {
      try { rushTick(); } catch (e) { /* ignore */ }
    }, 500);

    return {
      state: state,
      start: start,
      stop: stop,
      scan: scan,
      clear: clear,
      config: config,
      rank: rankRows,
      util: {
        scanSaveNodes: scanSaveNodes,
        scanDomNodes: scanDomNodes,
        progress: progress,
        snapshotState: snapshotState,
        /* 第六十八批：狂爆旁路账本的两个纯函数，smoke 直接抠出来真跑 */
        settleDiff: settleDiff,
        ledgerBook: ledgerBook,
        rushTick: rushTick,
        ownsAll: ownsAll,
        hasBadge: hasBadge,
        chapterNow: chapterNow,
        norm: norm,
        ITEM_TITLE_RE: ITEM_TITLE_RE,
        GAIN_RE: GAIN_RE
      },
      CFG_KEY: spec.cfgKey,
      RUN_KEY: spec.runKey,
      TALLY_KEY: spec.tallyKey
    };
  }

  root.PCG_FARM_ENGINE = {
    create: create,
    DATA: DATA,
    /* 第二十三批：地区门禁，两个刷取模块共用 */
    region: {
      regionOfCh: regionOfCh,
      regionOfSave: regionOfSave,
      roamSet: roamSet,
      rowRegion: rowRegion,
      narrow: narrow,
      pickNote: pickNote
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PCG_FARM_ENGINE;
})(typeof window !== 'undefined' ? window : this);
