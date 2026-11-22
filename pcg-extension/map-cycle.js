/* Poke'Catch 防掉线助手 —— 通用「切图重进」引擎（第七批）
 *
 * 背景：游戏只在「换章节」时重建 adv.nodes（刷新点 / 道具格）。
 * 神兽追踪早就用了这套：先绕去本地区一个没目标的中立章节，再回目标章，
 * 等于重开一轮。以前只有神兽追踪享受这套，图鉴捕捉停在同一章干等，
 * 错过宝可梦刷新点就只能等下一轮，效率很差。
 *
 * 本模块把这套逻辑抽出来，做成所有会切图功能的默认行为：
 *   · 图鉴捕捉：进入章节后，目标刷新点没刷出来 / 已经走过去还没抓到
 *     → neutralHop() 绕一下 → travelFn() 重进，立刻重抽一轮。
 *   · 道具 / 树果刷取：travelTo() 已在目标章时不再固定回「回家章」，
 *     改由 neutralChapter() 挑本地区最近的中立章，减少无谓跨区。
 *   · 神兽追踪：legRestartPlan() 优先取本模块的中立章节。
 *
 * 所有切图都先过 PCG_SHINY_GUARD：遇到闪光宝可梦，战斗结算完才切走。
 *
 * 【第十九批】游戏冒险页的「此处出没」会给出当前地段的刷新进度
 * （`.zone-count`「17/18」，打满时带 `.done`）。目标宝可梦只在自己那个
 * 地段出没，草丛没刷完就切章，后面剩下的刷新点全白丢了。所以所有
 * 「错过刷新点 / 一轮跑完 / 这轮没刷出目标」触发的切图重进，都要先过
 * gateZone()：没打满就留在这一章继续刷，超时才放行一次避免死等。
 * 第七十六批：这里原来还有一种「同一章待太久 / 进图 12 秒」的挂钟触发，
 * 已整套删掉 —— 它会在真正走到靠后那一格 / 撞上目标草丛之前把一轮掐断。
 *
 * 【第二十三批】两条硬规则，所有会切章的功能（稀有道具刷取 / 树果刷取 /
 * 图鉴捕捉 / 传说追踪 / 联盟刷钱）共用：
 *   1. 「绕一下再回来」的那一章必须和目标章**同地区**。跨地区切图要过
 *      「出发去某地区 + 确认弹窗」，又慢又容易点歪，玩家也不希望角色到处跑。
 *      本地区实在没有可绕的章（只有一章 / 都被占着）就不绕，直接重进目标章。
 *   2. 绝不停在**正被游走神兽占着的章节**（存档 `roam.at = {id:{ch,until}}`）。
 *      走进去就要打神兽，等于把刷取/补图鉴的节奏全打乱。
 *
 * 只读页面 DOM 与存档、只模拟点击，不写游戏存档。
 */
(function (root) {
  'use strict';

  var CFG = root.PCG_CONFIG || null;
  var DATA = root.PCG_DEX_DATA || null;
  var UI = root.PCG_GAME_UI || null;

  function sel(key, fallback) {
    var v = (CFG && typeof CFG.sel === 'function') ? CFG.sel(key) : '';
    return v || fallback;
  }
  var Q = {
    mapScreen: sel('fmMapScreen', '#screen-map'),
    mapTab: sel('fmMapTab', '#tabs [data-screen="map"]'),
    advTab: sel('fmAdvTab', '#tabs [data-screen="adventure"]'),
    row: sel('fmMapRow', '.mp-row[data-ch]'),
    detail: sel('fmMapDetail', '.pg-info'),
    detClose: sel('fmDetailClose', '.pg-det-x'),
    go: sel('fmMapGo', '.mp-go[data-go]'),
    /* v1.32：游戏新增的「重新挑战」按钮——当前正在挑战的章节详情里出现，
     * 点它 = 游戏内部 restartChapter() = 无条件重建本章 adv.nodes（重抽一轮）。
     * 老的「绕中立章再回来」要靠两次切图，现在一次点击就能重抽，更快更稳。 */
    restart: '.mp-restart[data-restart]'
  };
  /* 「此处出没」当前地段的刷新进度：游戏自己渲染，打满会加 .done */
  var ZQ = {
    head: '.zone-head.foldable',
    count: '.zone-count',
    name: '.muted'
  };
  var ZONE_WAIT_MAX = 180000;   // 地段迟迟打不满时最多等 3 分钟，超时放行一次

  function q(s, r) {
    try { return (r || document).querySelector(s); } catch (e) { return null; }
  }
  function qa(s, r) {
    try { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    catch (e) { return []; }
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function txt(el) { return String((el && el.textContent) || '').trim(); }

  function guard() { return root.PCG_SHINY_GUARD || null; }
  function shinyBlocked() {
    var g = guard();
    try { return !!(g && typeof g.blocked === 'function' && g.blocked()); }
    catch (e) { return false; }
  }
  async function guardWait(owner) {
    var g = guard();
    if (!g || typeof g.waitClear !== 'function' || !shinyBlocked()) return true;
    try { return await g.waitClear(owner || 'map', 180000); } catch (e) { return true; }
  }

  function advOf(save) { return (save && save.adv) || {}; }
  function chapterNow(save) { return num(advOf(save).chapter, -1); }
  function unlockedOf(save) { return num(advOf(save).unlocked, 0); }

  function mapActive() {
    var s = q(Q.mapScreen);
    return !!(s && s.classList && s.classList.contains('active') && qa(Q.row).length);
  }
  async function openMap() {
    if (mapActive()) return true;
    var btn = q('#chapter-btn') || q('#side-chapter') || q(Q.mapTab);
    if (!btn) return false;
    try { btn.click(); } catch (e) { return false; }
    for (var i = 0; i < 30; i++) {
      await sleep(180);
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
    var open = qa(sel('fmRegionOpen', '.rg.open[data-rg]'));
    if (open.length) return open;
    return qa(sel('fmRegionAny', '.rg[data-rg]')).filter(function (c) {
      return !c.classList.contains('locked') &&
        c.getAttribute('aria-disabled') !== 'true';
    });
  }
  function rowSig() {
    return qa(Q.row).map(function (e) { return e.getAttribute('data-ch'); }).join(',');
  }
  async function showRegion(card) {
    if (!card) return false;
    var before = rowSig();
    try { card.click(); } catch (e) { return false; }
    await sleep(300);
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

  /* ---------------- 地区 / 游走神兽 ---------------- */
  /* 章节 → 地区（离线表 chRg：关都 0-13 / 城都 14-30 / 丰缘 31-47 / 神奥 48-65） */
  function regionOf(ch) {
    var n = num(ch, -1);
    if (n < 0) return '';
    if (DATA && typeof DATA.chapterRegion === 'function') return DATA.chapterRegion(n) || '';
    return '';
  }
  /* 某一地区的章节区间 [first, last]（含端点），按离线表 chRg 数出来 */
  function regionRange(rg) {
    if (!rg) return null;
    var out = null;
    var arr = DATA && DATA.chRg;
    if (Array.isArray(arr)) {
      for (var i = 0; i < arr.length; i++) {
        if (String(arr[i]) !== String(rg)) continue;
        if (!out) out = [i, i];
        else out[1] = i;
      }
    }
    if (!out && DATA && DATA.ranges && DATA.ranges[rg]) {
      out = [num(DATA.ranges[rg][0], 0), num(DATA.ranges[rg][1], 0)];
    }
    return out;
  }
  /* 玩家此刻在哪个地区：以存档 adv.chapter 为准 */
  function regionNow(save) {
    var ch = chapterNow(save);
    return ch < 0 ? '' : regionOf(ch);
  }
  /* 此刻被游走神兽占着的章节集合：存档 roam.at = {id:{ch,until}}。
   * 走进去就会撞上神兽，所有「绕一下」「换一张图」都要避开。 */
  function roamChapters(save) {
    var at = (save && save.roam && save.roam.at) || {};
    var now = Date.now(), out = {};
    for (var k in at) {
      if (!Object.prototype.hasOwnProperty.call(at, k)) continue;
      var s = at[k];
      if (!s || typeof s.ch !== 'number' || s.ch < 0) continue;
      var until = num(s.until, 0);
      if (until && until <= now) continue;      // 已经换地方了
      out[s.ch] = true;
    }
    return out;
  }
  function roamAt(save, ch) { return !!roamChapters(save)[num(ch, -1)]; }

  /* ---------------- 中立章节：本地区、已解锁、离目标章最近、没有神兽 ----------------
   * 返回 -1 表示「本地区没有可绕的章」——调用方要么直接重进目标章，
   * 要么这一轮不切。绝不跨地区兜底。 */
  function neutralChapter(ch, save) {
    var target = num(ch, -1);
    if (target < 0) return -1;
    var unlocked = unlockedOf(save);
    var own = regionOf(target);
    if (!own) return -1;
    var busy = roamChapters(save);
    var best = -1, bestDist = 1e9;
    var rows = qa(Q.row).map(function (e) {
      return {
        ch: num(e.getAttribute('data-ch'), -1),
        locked: !!(e.classList && (e.classList.contains('locked') ||
          e.getAttribute('aria-disabled') === 'true'))
      };
    });
    for (var i = 0; i < rows.length; i++) {
      var c = rows[i];
      if (c.ch < 0 || c.ch === target || c.locked || c.ch > unlocked) continue;
      if (regionOf(c.ch) !== own) continue;        // 只在本地区里绕
      if (busy[c.ch]) continue;                    // 不往神兽身上停
      var d = Math.abs(c.ch - target);
      if (d < bestDist) { best = c.ch; bestDist = d; }
    }
    if (best >= 0) return best;
    /* 地图没渲染 / 本地区暂时没有空章：按离线区间在本地区里数，同样避开神兽 */
    var rg = regionRange(own);
    if (!rg) return -1;
    for (var x = rg[0]; x <= rg[1]; x++) {
      if (x === target || x > unlocked || busy[x]) continue;
      var d2 = Math.abs(x - target);
      if (d2 < bestDist) { best = x; bestDist = d2; }
    }
    return best;
  }

  /* 只绕一下：切到中立章，不等它跑完；回到目标章由 travelFn 负责 */
  async function neutralHop(ch, owner) {
    if (!await guardWait(owner)) return false;
    if (shinyBlocked()) return false;
    if (!await openMap()) return false;
    if (!await findRow(ch)) return false;
    var row = q(rowSel(ch));
    if (!row) return false;
    try { row.click(); } catch (e) { return false; }
    await sleep(320);
    var go = q(Q.detail + ' ' + Q.go + '[data-go="' + ch + '"]:not([disabled])') ||
      q(Q.go + '[data-go="' + ch + '"]:not([disabled])');
    if (!go) {
      var all = qa(Q.go + ':not([disabled])');
      for (var gi = 0; gi < all.length; gi++) {
        if (String(all[gi].getAttribute('data-go') || '') === String(ch)) { go = all[gi]; break; }
      }
    }
    if (!go || go.disabled || go.getAttribute('aria-disabled') === 'true') {
      closeDetail(); return false;
    }
    try { go.click(); } catch (e) { closeDetail(); return false; }
    await sleep(620);
    closeDetail();
    backToAdventure();
    return true;
  }

  /* ---------------- v1.32：用游戏新增的「重新挑战」按钮重抽当前章 ----------------
   * 游戏在「当前正在挑战的章节」详情页放了一个 .mp-restart[data-restart] 按钮，
   * 文案「Recommencer（重新挑战）」。点它 = 游戏内部 restartChapter(ch) =
   * 无条件 setChapter(ch) 重建本章 adv.nodes（重抽一轮刷新点 / 道具格），
   * 而不必像老逻辑那样「绕去中立章 → 再切回来」走两次切图。
   *
   * 重要前提：这个按钮只在「当前章」的详情里出现（游戏 sn() 函数的判断：
   * ot.chapter 落在 [Ue,Fa] 且不是刚进图还没 node 时才渲染）。所以 restart()
   * 只负责「人已经在目标章、想重抽」这一步；调用方的流程仍是先进目标章，
   * 需要重抽时调本函数。返回 false 表示按钮不可用，调用方应回退到老的重进逻辑。 */
  async function restart(ch, opts) {
    var o = opts || {};
    var owner = o.owner || 'map';
    var target = num(ch, -1);
    if (target < 0) return false;
    if (!await guardWait(owner)) return false;
    if (shinyBlocked()) return false;

    /* 若传了存档且当前章不是目标章：按钮不会出现在这个章的详情里，直接放弃，
     * 让调用方按原流程先 travel 到目标章。 */
    var save = o.save || null;
    if (save && chapterNow(save) !== target && !o.force) return false;

    if (!await openMap()) return false;
    if (!await findRow(target)) return false;
    var row = q(rowSel(target));
    if (!row) { closeDetail(); return false; }
    try { row.click(); } catch (e) { closeDetail(); return false; }
    await sleep(320);

    /* 找当前详情里的重新挑战按钮：优先精确匹配目标章，退而求其次取详情里第一个。
     * 联盟入口的 data-restart 是一个区间起点，普通章就是章号；两种都接受。 */
    var detail = q(Q.detail) || document;
    var rb = q(Q.restart + '[data-restart="' + target + '"]', detail) ||
      q(Q.restart, detail);
    if (!rb || rb.disabled || rb.getAttribute('aria-disabled') === 'true') {
      closeDetail(); return false;                 // 没有按钮 / 灰色 → 回退老逻辑
    }
    var nodesBefore = null;
    try {
      var sv0 = (o.readSave && o.readSave()) || save;
      nodesBefore = sv0 && sv0.adv && sv0.adv.nodes;
    } catch (e) { /* ignore */ }

    try { rb.click(); } catch (e) { closeDetail(); return false; }
    /* restartChapter 会 show('adventure')，等它回冒险页并重建节点 */
    for (var i = 0; i < 20; i++) {
      await sleep(200);
      var scr = q('#screen-adventure');
      if (scr && scr.classList && scr.classList.contains('active')) break;
    }
    closeDetail();
    backToAdventure();

    /* 确认节点表确实换了（引用变了 / 时间线归零）——读不到就按点了成功处理，
     * 免得页面改版后 here 永远判失败反而卡住。 */
    var rebuilt = true;
    if (o.readSave && nodesBefore) {
      try {
        var sv1 = o.readSave();
        var nodesAfter = sv1 && sv1.adv && sv1.adv.nodes;
        if (nodesAfter === nodesBefore) rebuilt = false;
      } catch (e) { /* ignore */ }
    }
    if (o.onRestart && typeof o.onRestart === 'function') {
      try { o.onRestart(rebuilt); } catch (e) { /* ignore */ }
    }
    return true;
  }

  /* 调用方指定的「绕哪一章」能不能用：同地区、已解锁、不是目标章本身、
   * 没被游走神兽占着、地图行也没标成 locked。任一条不满足就退回最近中立章。 */
  function hopUsable(ch, target, save) {
    var c = num(ch, -1);
    var t = num(target, -1);
    if (c < 0 || t < 0 || c === t) return false;
    if (!regionOf(c) || regionOf(c) !== regionOf(t)) return false;
    if (c > unlockedOf(save)) return false;
    if (roamChapters(save)[c]) return false;
    var row = q(rowSel(c));
    if (row && row.classList && (row.classList.contains('locked') ||
        row.getAttribute('aria-disabled') === 'true')) return false;
    return true;
  }

  /* 错过刷新点后的标准动作：绕中立章 → 重进目标章。
   * travelFn 由调用方提供（只做「去目标章」，不再包一层页面租约）。
   * 本地区没有可绕的章（neutralChapter = -1）时就不绕，直接重进目标章。
   * 第八十一批：新增 opts.hopCh —— 调用方可以指定「固定切出到哪一章」
   * （刷洛托姆要求默认切出到灯塔徽章）。指定的章不可用时退回最近中立章，
   * 绝不因为指定章没了就卡住不切。 */
  async function reenter(ch, travelFn, opts) {
    var o = opts || {};
    var owner = o.owner || 'map';
    if (!await guardWait(owner)) return false;
    if (shinyBlocked()) return false;
    var save = o.save || null;
    /* v1.32：人已经在目标章、游戏详情有「重新挑战」按钮时，直接点它重抽一轮
     * （等价于原来的绕章重进，但只需一次点击，不会跨区、也不会撞上游走神兽）。
     * 按钮不可用则照旧走下面的「绕中立章 → travelFn 重进」，保证老版本兼容。 */
    if (save && chapterNow(save) === ch) {
      var didRestart = false;
      try {
        didRestart = await restart(ch, {
          owner: owner, save: save, force: true,
          readSave: o.readSave || null, onRestart: o.onRestart || null
        });
      } catch (e) { didRestart = false; }
      if (didRestart) return true;
    }
    var hopCh = neutralChapter(ch, save);
    if (o.hopCh != null && hopUsable(o.hopCh, ch, save)) hopCh = num(o.hopCh, -1);
    if (hopCh >= 0 && hopCh !== ch) {
      var hopped = await neutralHop(hopCh, owner);
      if (!hopped && o.onHopFail && typeof o.onHopFail === 'function') {
        try { o.onHopFail(hopCh); } catch (e) { /* ignore */ }
      }
      await sleep(300);
    }
    if (typeof travelFn !== 'function') return false;
    return await travelFn();
  }

  /* ---------------- 当前地段（此处出没）刷完了没有 ---------------- */
  /* 面板结构（对着真机 DOM 核对）：
   *   .zone-head.foldable > b「此处出没」+ .muted「225号道路」+
   *   .zone-count「17/18」(打满时 class 含 done) + .fold
   * 下面的 .zone-cell.caught 就是「这一地段已经抓到的种类」。
   * 只在冒险页渲染；读不到时返回 null，调用方一律按「不拦」处理，
   * 免得页面改版 / 折叠面板把自动化卡死。 */
  function zoneProgress() {
    var heads = qa(ZQ.head);
    for (var i = 0; i < heads.length; i++) {
      var head = heads[i];
      if (!/此处出没/.test(txt(head))) continue;
      var c = q(ZQ.count, head);
      if (!c) continue;
      var m = txt(c).match(/(\d+)\s*\/\s*(\d+)/);
      if (!m) continue;
      var cur = num(m[1], 0), total = num(m[2], 0);
      var nameEl = q(ZQ.name, head);
      return {
        cur: cur, total: total,
        done: !!(c.classList && c.classList.contains('done')) ||
              (total > 0 && cur >= total),
        label: nameEl ? txt(nameEl) : '',
        text: txt(c)
      };
    }
    return null;
  }
  function zoneCleared() {
    var z = zoneProgress();
    return !z || z.done;        // 读不到面板就不拦，别把主循环卡住
  }

  /* 切图重进的统一门禁：草丛没打满 → 先别切章，继续留在这一地段刷。
   * mark.zoneWaitSince 记第一次被推迟的时间，超过上限强制放行一次
   * （差的那种可能要换天气才刷得出来，不能无限死等）。 */
  function gateZone(mark, reason) {
    var m = mark || {};
    if (zoneCleared()) { m.zoneWaitSince = 0; m.zoneWhy = ''; return reason; }
    var now = Date.now();
    var maxMs = Math.max(30000, num(m.zoneWaitMax, ZONE_WAIT_MAX));
    if (!m.zoneWaitSince) m.zoneWaitSince = now;
    if (now - m.zoneWaitSince < maxMs) {
      m.zoneWhy = reason;
      return '';                // 本次不许切章
    }
    m.zoneWaitSince = 0;
    m.zoneWhy = '';
    return reason;              // 兜底放行
  }
  /* 这一轮没有切图理由：故意不清 zoneWaitSince / zoneWhy。
   * 否则「地段草丛没打完」这个推迟计时每轮都会重新起算，超时兜底永远到不了；
   * 状态行也需要一直显示「等地段草丛打完再切章」直到真的放行。 */
  function idleZone() { return ''; }

  /* ---------------- 目标刷新点 / 是否错过 ---------------- */
  /* adv.nodes 是游戏为当前章节生成的一轮时间线：
   *   wild 节点 { type:'wild', species:[...], areas:[...], pool:[{id}] }
   *   item 节点 { type:'item', find:{...} }
   * adv.node 是当前走到第几个节点。换章节才会重建 nodes = 重抽一轮。 */
  /* 第三十六批：节点里的宝可梦可能是纯 id，也可能是 { id } / { mon } 这类对象，
   * 老写法只认纯 id，遇到对象就一律「没刷出目标」——于是永远重抽、永远走不到后面的地段。
   * 这里统一取 id，认不出来就 -1。 */
  function idOf(v) {
    if (v == null) return -1;
    if (typeof v === 'object') {
      if (v.id != null) return num(v.id, -1);
      if (v.mon != null) return num(v.mon, -1);
      if (v.sid != null) return num(v.sid, -1);
      if (v.pid != null) return num(v.pid, -1);
      return -1;
    }
    return num(v, -1);
  }
  function listHas(arr, id) {
    if (!Array.isArray(arr)) return false;
    for (var i = 0; i < arr.length; i++) if (idOf(arr[i]) === id) return true;
    return false;
  }
  function nodeHas(node, id) {
    if (!node || typeof node !== 'object') return false;
    id = num(id, 0);
    if (listHas(node.species, id)) return true;
    if (listHas(node.pool, id)) return true;
    if (Array.isArray(node.spawns) && listHas(node.spawns, id)) return true;
    if (Array.isArray(node.mons) && listHas(node.mons, id)) return true;
    if (node.pool && typeof node.pool === 'object' && !Array.isArray(node.pool)) {
      if (Object.prototype.hasOwnProperty.call(node.pool, String(id))) return true;
      var keys = Object.keys(node.pool);
      for (var k = 0; k < keys.length; k++) {
        if (idOf(node.pool[keys[k]]) === id) return true;
      }
    }
    if (node.find && idOf(node.find.egg) === id) return true;
    if (node.roamer && idOf(node.roamer) === id) return true;
    return false;
  }

  /* ---------------- 地段匹配（第三十七批） ----------------
   * `adv.nodes[i].areas` 里放的是游戏**内部地段 id**，形如
   *   dppt:sinnoh-route-225-area / hgss:johto-route-40-41-area
   * 而不是「225号道路」「40-41号道路」这种中文地段名。第三十六批拿中文名
   * 去比内部 id，永远比不上：于是「目标在后面的地段」这条从来不生效，
   * 走过目标地段之后也判不出「已经走完」——插件就一直跟着时间轴把整章的
   * NPC 全打完（打完了草丛还在打训练家）。
   *
   * 现在三种比法，任意一种命中就算同一个地段：
   *   1. 去掉空格 / 标点 / 大小写后互相包含（中文同名地段名直接命中）；
   *   2. 编号相同（40-41号道路 ↔ route-40-41 / route-40）；
   *   3. 纯数字的地段序号（个别版本给 step）。 */
  function normStop(v) {
    return String(v == null ? '' : v).toLowerCase()
      .replace(/[\s_\-:：·,，、/\\|.。()（）\[\]{}'"]/g, '');
  }
  function digitsOf(v) {
    var m = String(v == null ? '' : v).match(/\d+/g) || [];
    var out = [];
    for (var i = 0; i < m.length; i++) {
      var n = String(parseInt(m[i], 10));
      if (out.indexOf(n) < 0) out.push(n);
    }
    return out;
  }
  /* 两段文字是不是同一个地段（中文名 / 内部 id 混着来也认） */
  function sameStopText(a, b) {
    var A = normStop(a), B = normStop(b);
    if (!A || !B) return false;
    if (A === B || A.indexOf(B) >= 0 || B.indexOf(A) >= 0) return true;
    var da = digitsOf(a), db = digitsOf(b);
    if (!da.length || !db.length) return false;
    for (var i = 0; i < da.length; i++) {
      if (db.indexOf(da[i]) >= 0) return true;
    }
    return false;
  }
  /* 面板上「此处出没」写着的当前地段名（中文，例如「40-41号道路」）；读不到给空串 */
  function areaNow() {
    var z = zoneProgress();
    return z && z.label ? String(z.label).trim() : '';
  }

  /* 这个节点属于哪个地段。
   * wild 节点带 areas（数组或单个字符串），个别版本只给 area / spot / step，
   * 全都兼容；数字认作「地段序号」，字符串认作「地段名 / 内部 id」。 */
  function nodeStops(node) {
    var out = [];
    if (!node || typeof node !== 'object') return out;
    var push = function (v) {
      if (v == null) return;
      if (Array.isArray(v)) { for (var i = 0; i < v.length; i++) push(v[i]); return; }
      if (typeof v === 'object') {
        if (v.n != null) push(v.n);
        if (v.name != null) push(v.name);
        if (v.i != null) push(v.i);
        if (v.step != null) push(v.step);
        return;
      }
      out.push(v);
    };
    push(node.areas);
    push(node.area);
    push(node.spot);
    push(node.stop);
    push(node.step);
    return out;
  }

  /* ---------------- 地段内部 id 精确比对（第四十三批） ----------------
   * 游戏生成时间线时，每个节点都挂着这一步的步骤级 areas：
   *     Ot.push({ ...Xt, type:'wild', areas: Ke.areas })
   * 里面是内部 id（rse:mt-pyre-summit / dppt:sinnoh-route-225-area）。
   * 插件离线表里存的是中文地段名，老的 stopMatch 只能靠「名字互相包含」或
   * 「编号相同」去猜：121号道路 ↔ rse:hoenn-route-121-area 有 121 能猜中，
   * 送神山山顶 ↔ rse:mt-pyre-summit 既没共同子串也没编号 → 永远认不出来，
   * 于是每到第 12 秒就报「这一轮的地段里没有目标」直接重抽，
   * 后面的地段一步都走不到（风铃铃 #358 就卡在这里打转）。
   * 现在把目标步骤的 areas（DATA.stepAreas）一起带进来，逐个 id 直接比。 */
  function normAreaId(v) {
    return String(v == null ? '' : v).trim().toLowerCase();
  }
  function areaIdList(ids) {
    if (!ids) return [];
    if (!Array.isArray(ids)) ids = [ids];
    var out = [];
    for (var i = 0; i < ids.length; i++) {
      var v = normAreaId(ids[i]);
      if (v && out.indexOf(v) < 0) out.push(v);
    }
    return out;
  }
  /* 节点挂的哪些地段 id 与目标步骤的 areas 有交集 */
  function nodeAreaHit(node, ids) {
    var want = areaIdList(ids);
    if (!want.length) return false;
    var list = nodeStops(node);
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] !== 'string') continue;
      if (want.indexOf(normAreaId(list[i])) >= 0) return true;
    }
    return false;
  }

  /* 节点是不是目标地段（第三十七批：中文名 / 内部 id / 编号三种写法都认；
   * 第四十三批：优先用步骤自己的 areas 内部 id 精确比对） */
  function stopMatch(node, area, step, ids) {
    if (nodeAreaHit(node, ids)) return true;
    var list = nodeStops(node);
    var want = String(area == null ? '' : area).trim();
    var idx = typeof step === 'number' ? step : -1;
    for (var i = 0; i < list.length; i++) {
      var v = list[i];
      if (typeof v === 'number') {
        if (idx >= 0 && v === idx) return true;
        continue;
      }
      if (typeof v !== 'string') continue;
      if (!v.trim()) continue;
      if (idx >= 0 && String(parseInt(v, 10)) === String(idx) && /^\d+$/.test(v.trim())) return true;
      if (want && sameStopText(v, want)) return true;
    }
    return false;
  }

  /* ---------------- 同一章里的多处出没地段（第四十六批） ----------------
   * 一只宝可梦常常在**同一章的好几处地段**都能遇到（风铃铃在毁坏的世界：
   * 天冠山 4.26% / 积雪的天冠山 2.74% / 送行之泉 2.09%）。这一章的时间线是
   * 一次生成、线性走完的，走到第二处、第三处根本不花额外代价；可老逻辑只盯
   * 「最好的那一处」，刷完它的草丛就切走重进，等于把同章另外两处白扔掉，
   * 效率直接掉一半。
   * 所以把本章所有出没地段都记成「目标窗口」，整章走完最后一处才准重抽。 */
  function areaZoneList(zones) {
    var out = [];
    if (!Array.isArray(zones)) return out;
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (!z || typeof z !== 'object') continue;
      out.push({
        area: z.area ? String(z.area) : '',
        step: typeof z.step === 'number' ? z.step : -1,
        ids: areaIdList(z.ids)
      });
    }
    return out;
  }

  /* 一处地段在这条时间线里占的窗口：[first, end]，end 取最后一个 wild 节点
   * （训练家 / 道具节点刷不出宝可梦，拿它当边界等于白打一遍） */
  function windowOf(nodes, area, step, ids) {
    var w = {
      area: area ? String(area) : '', step: typeof step === 'number' ? step : -1,
      first: -1, last: -1, wildFirst: -1, wildLast: -1, end: -1
    };
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!stopMatch(n, area, step, ids)) continue;
      if (w.first < 0) w.first = i;
      w.last = i;
      if (n && n.type === 'wild') {
        if (w.wildFirst < 0) w.wildFirst = i;
        w.wildLast = i;
      }
    }
    w.end = w.wildLast >= 0 ? w.wildLast : w.last;
    return w;
  }

  function spawnScan(save, id, area, step, ids, zones) {
    var adv = advOf(save);
    var nodes = Array.isArray(adv.nodes) ? adv.nodes : [];
    var hit = -1, wilds = 0;
    var cur = num(adv.node, -1);
    /* 第四十三批：目标步骤的 areas（内部 id）有没有在这一轮里出现过 */
    var idCount = areaIdList(ids).length, byId = false;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n && n.type === 'wild') wilds++;
      if (hit < 0 && nodeHas(n, num(id, 0))) hit = i;
      if (idCount && nodeAreaHit(n, ids)) byId = true;
    }
    /* 主地段（挑中的那一处）+ 本章其它出没地段，各算一个窗口 */
    var main = windowOf(nodes, area, step, ids);
    var list = areaZoneList(zones), k, w;
    var win = [];
    if (main.first >= 0) win.push(main);
    for (k = 0; k < list.length; k++) {
      w = windowOf(nodes, list[k].area, list[k].step, list[k].ids);
      if (w.first >= 0 && w.end >= 0) win.push(w);
    }
    win.sort(function (a, b) { return a.first - b.first; });
    /* 整章的目标窗口合成一段：第一处的地点到最后一处的地段边界。
     * 只有一处时跟老逻辑完全一样（first / end 就是那一处）。 */
    var areaFirst = -1, areaEnd = -1, areaWildFirst = -1, areaWildLast = -1;
    var zoneAt = -1, zoneEnd = -1, zoneNextFirst = -1, zoneNextArea = '';
    for (k = 0; k < win.length; k++) {
      w = win[k];
      if (areaFirst < 0) areaFirst = w.first;
      if (w.end >= areaEnd) areaEnd = w.end;
      if (w.wildFirst >= 0 && areaWildFirst < 0) areaWildFirst = w.wildFirst;
      if (w.wildLast >= 0) areaWildLast = w.wildLast;
      if (cur >= w.first && cur <= w.end) { zoneAt = k; zoneEnd = w.end; }
      if (cur < w.first && (zoneNextFirst < 0 || w.first < zoneNextFirst)) {
        zoneNextFirst = w.first;
        zoneNextArea = w.area;
      }
    }
    return {
      chapter: num(adv.chapter, -1),
      cur: cur, total: nodes.length,
      hit: hit, wilds: wilds, has: hit >= 0,
      /* 第三十六批：目标地段在这一轮里的位置（没匹配上就是 -1） */
      areaFirst: areaFirst, areaLast: main.last, areaSeen: areaFirst >= 0,
      /* 第四十三批：地段是靠「内部 id 精确命中」认出来的（不是靠名字 / 编号猜） */
      areaById: byId, areaIds: idCount,
      /* 第三十七批：目标地段里最后一个野外刷新点（草丛边界） */
      wildFirst: areaWildFirst, wildLast: areaWildLast, areaEnd: areaEnd,
      /* 第四十六批：本章一共有几处出没地段、人在第几处、这一处的边界、
       * 下一处从第几个刷新点开始（-1 = 本章后面没了） */
      zoneCount: win.length, zoneAt: zoneAt, zoneEnd: zoneEnd,
      zoneNextFirst: zoneNextFirst, zoneNextArea: zoneNextArea,
      zones: win
    };
  }

  /* mark = { ch, id, area, areas, step, enteredAt, hit, lastCur, rerolls, noHitDone }
   * 返回错过的理由（空串表示这一轮还没走完，继续待着）。
   * 第三十六批：多认一个「目标地段」，用来区分「这一轮压根没有目标」和
   * 「目标在后面的地段、还没走到」。 */
  function missed(save, id, mark) {
    var m = mark || {};
    var sc = spawnScan(save, id || m.id, m.area, m.step, m.areas, m.zones);
    /* 第三十七批：再补一条「人现在在哪个地段」——直接读「此处出没」面板上的名字。
     * 时间线里的内部 id 万一对不上，这条还能兜住「已经走过目标地段」。
     * 第四十六批：本章有好几处出没地段时，面板跟任何一处对上就算「在目标地段里」。 */
    var nowArea = areaNow();
    var inArea = !!(m.area && nowArea && sameStopText(nowArea, m.area));
    if (!inArea && nowArea) {
      for (var zi = 0; zi < sc.zones.length; zi++) {
        if (sc.zones[zi].area && sameStopText(nowArea, sc.zones[zi].area)) { inArea = true; break; }
      }
    }
    m.nowArea = nowArea;
    m.inAreaNow = inArea;
    /* 第四十六批：本章后面还有出没地段没走 → 主循环的「同一章待太久」不许硬重抽，
     * 否则整章扫到一半就被 3 分钟超时打断，照样白丢后面的地段。 */
    m.zoneCount = sc.zoneCount;
    m.zoneAhead = sc.zoneNextFirst >= 0;
    if (inArea) { m.areaSeenAt = Date.now(); m.areaLeftAt = 0; }
    m.walkWhy = '';
    if (sc.chapter !== m.ch) return '章节变了，重新选目标';
    if (!sc.total) return idleZone(m);              // 存档还没生成时间线
    var last = typeof m.lastCur === 'number' ? m.lastCur : sc.cur;
    m.lastCur = sc.cur;
    if (sc.cur < 0) return idleZone(m);

    // 一轮跑完（node 归零 / 变小）：不管有没有刷出，都该重开一轮
    if (last > 1 && sc.cur < last) {
      return gateZone(m, '一轮已跑完，切走重进刷新点');
    }

    if (sc.hit >= 0) {
      if (sc.cur > sc.hit) {
        return gateZone(m, '已经走过目标刷新点，但还没抓到');
      }
      return idleZone(m);
    }

    /* ① 这一章**所有**目标地段的野外刷新点都打完了（草丛打完、目标没出来）
     *    → 才切走重进重抽。这一条必须排在「人还在目标地段」前面：
     *    草丛都打完了，面板上「已抓种类」还差的那几种多半要换天气，
     *    在这儿等只会跟着时间轴把这一段剩下的训练家白打一遍。
     *    第四十六批：areaEnd 现在是「本章最后一处出没地段的边界」，
     *    所以刷完第一处不会被当成「整章走完」（风铃铃：天冠山 → 积雪的天冠山 → 送行之泉）。 */
    if (sc.areaSeen && sc.cur > sc.areaEnd) {
      return sc.zoneCount > 1
        ? ('本章 ' + sc.zoneCount + ' 处出没地段的草丛都打完了（目标没出来），切走重进重抽')
        : '目标地段的刷新点已经走完（草丛打完没出目标），切走重进重抽';
    }

    /* ② 人正站在目标地段、草丛还没打完：只看这一片，打满了才切走。
     *    gateZone 自带 3 分钟兜底，免得「差天气才刷得出来」那种死等。
     *    第四十六批：这一处打满时，若本章后面还有出没地段 → 不切图，先走过去。 */
    if (inArea) {
      m.noHitDone = false;
      var whyZone = gateZone(m, '目标地段的草丛已经打完，切走重进重抽');
      if (whyZone && sc.zoneNextFirst >= 0) {
        m.walkWhy = '同一章「' + (sc.zoneNextArea || '下一处地段') +
          '」也有出没（第 ' + (sc.zoneNextFirst + 1) + ' 个刷新点），先走过去';
        return idleZone(m);
      }
      return whyZone;
    }

    /* ③ 目标刷新点还排在后面（比如目标在 40-41 号道路，现在还在 38 号道路）
     *    → 先走过去，绝不能在这儿就切走重进：那样每轮只走第一个地段，永远刷不到目标。 */
    if (sc.areaSeen && sc.cur <= sc.areaEnd) {
      /* 第四十三批：已经走进目标地段了（面板地段名跟离线表对不上时 inArea 认不出来，
       * 别在这儿写「目标在后面的地段」，那是错的）——安静刷，等草丛打完 / 抓到手。 */
      if (sc.cur >= sc.areaFirst) return idleZone(m);
      m.walkWhy = '目标在后面的地段（第 ' + (sc.areaFirst + 1) + ' 个刷新点），先走过去' +
        (sc.zoneCount > 1 ? '（本章 ' + sc.zoneCount + ' 处出没，都会走到）' : '');
      return idleZone(m);
    }

    /* ④ 时间线里的地段写法认不出来，但面板上已经从目标地段挪走了（来过又走）
     *    → 等同「走完」，切走重进。观察 8 秒再动手，防面板一闪而过误判。 */
    if (m.area && m.areaSeenAt && nowArea) {
      if (!m.areaLeftAt) m.areaLeftAt = Date.now();
      if (Date.now() - m.areaLeftAt > 8000) {
        return '已经走过目标地段（草丛打完了），切走重进重抽';
      }
      return idleZone(m);
    }

    // ⑤ 地段完全认不出来：这一轮确实没有目标地段时，切走重进重抽才有意义。
    //    门禁真的放行之后才记账，否则「被拦下来」也会白白吃掉重抽次数。
    /* 第四十三批：这一步本来有 areas 却一个都没在这一轮里出现，多半是游戏
     * 把整个步骤跳过了（`Ke.tide && Ke.tide==='low' !== lowTide()` 直接 continue，
     * 冰之间那类退潮才开的图就是这样）。文案里点明地段名，别只写「没有目标」。 */
    /* 第七十六批：这里原来是「进图满 12 秒就认账」的挂钟判定 —— 车队走得慢一点、
     * 路上撞进草丛打一场、或者目标草丛本来就排在这一轮很靠后的位置，12 秒到点就
     * 把整轮掐断去重抽，重抽又把时间线归零，于是永远撞不上那个草丛 / 走不到靠后
     * 的那一格（玩家反馈的「该遭遇的草丛触发不了」就是这么来的）。
     * 现在改成**走到这一轮最后一个点**才认账：在那之前一路往里走，只有整轮走完、
     * 目标地段确实没出现，才切走重进重抽。 */
    var atEnd = sc.total > 0 && sc.cur >= sc.total - 1;
    if (atEnd && !m.noHitDone &&
        num(m.rerolls, 0) < num(m.maxNoHit, 2)) {
      var whyNo = gateZone(m, m.area && !sc.areaSeen
        ? ('这一轮没有「' + m.area + '」这个地段（可能要等退潮 / 换天气），切走重进重抽')
        : '这一轮没刷出目标刷新点，切走重进重抽');
      if (whyNo) {
        m.noHitDone = true;
        m.rerolls = num(m.rerolls, 0) + 1;
      }
      return whyNo;
    }
    return idleZone(m);

  }

  function markFor(ch, id, area, step, ids, zones) {
    return {
      ch: ch, id: id,
      area: area ? String(area) : '',
      /* 第四十三批：目标步骤的 areas（内部 id），用来精确认地段 */
      areas: areaIdList(ids),
      /* 第四十六批：同一章里其它出没地段（风铃铃：天冠山 / 积雪的天冠山 / 送行之泉）
       * ——整章走完最后一处才准重抽，别刷完第一处草丛就切图 */
      zones: areaZoneList(zones),
      /* 第四十六批：本章还有几处出没地段 / 后面是否还有没走到的一处 */
      zoneCount: 0, zoneAhead: false,
      step: typeof step === 'number' ? step : -1,
      walkWhy: '',
      enteredAt: Date.now(),
      hit: -1, lastCur: -1, rerolls: 0, maxNoHit: 2, noHitDone: false,
      areaSeenAt: 0, areaLeftAt: 0, retryAfter: 0,
      zoneWaitSince: 0, zoneWhy: '', zoneWaitMax: ZONE_WAIT_MAX
    };
  }

  root.PCG_MAP_CYCLE = {
    Q: Q,
    icon: function (name) { return UI && UI.icon ? UI.icon(name) : ''; },
    chapterNow: chapterNow,
    regionOf: regionOf,
    regionRange: regionRange,
    regionNow: regionNow,
    roamChapters: roamChapters,
    roamAt: roamAt,
    neutralChapter: neutralChapter,
    neutralHop: neutralHop,
    hopUsable: hopUsable,
    reenter: reenter,
    restart: restart,       // v1.32：点当前章的「重新挑战」按钮重抽节点
    spawnScan: spawnScan,
    nodeHas: nodeHas,
    nodeStops: nodeStops,
    nodeAreaHit: nodeAreaHit,
    normAreaId: normAreaId,
    stopMatch: stopMatch,
    sameStopText: sameStopText,
    areaNow: areaNow,
    missed: missed,
    markFor: markFor,
    areaZoneList: areaZoneList,
    windowOf: windowOf,
    zoneProgress: zoneProgress,
    zoneCleared: zoneCleared,
    gateZone: gateZone,
    guardWait: guardWait,
    util: {
      neutralChapter: neutralChapter, spawnScan: spawnScan,
      nodeHas: nodeHas, nodeStops: nodeStops, stopMatch: stopMatch,
      nodeAreaHit: nodeAreaHit, normAreaId: normAreaId,
      sameStopText: sameStopText, areaNow: areaNow,
      missed: missed, markFor: markFor,
      areaZoneList: areaZoneList, windowOf: windowOf,
      zoneProgress: zoneProgress, zoneCleared: zoneCleared, gateZone: gateZone,
      regionOf: regionOf, regionRange: regionRange, regionNow: regionNow,
      roamChapters: roamChapters, roamAt: roamAt,
      hopUsable: hopUsable, chapterNow: chapterNow, restart: restart
    }
  };
})(typeof window !== 'undefined' ? window : this);
