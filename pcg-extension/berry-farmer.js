/* Poke'Catch 防掉线助手 —— 树果刷取（第五批 / 第四十一批重算 / 第九十一批恢复意向树果）
 *
 * 树果不是某张图专属掉落，而是所有「道具格」共用一张普通池（ITEM_TABLE）。
 * 因此最大效率的算法和稀有道具不同：
 *   · 引擎进图只抓**本章最早的那个道具格**（scanSaveNodes 的 first），
 *     所以一棵图只算一次：一章有 2~5 个道具格的，取 at 最小的那格
 *     （旧版把同一章的后续步骤也当成「另一张图」，排在后面的永远轮不到，
 *      还会让同一章在排行榜里重复出现）；
 *   · 单趟概率 = 0.7（出格）× 普通池份额 × 该树果权重 / 该章池总权重；
 *     普通池份额 = loot 逐条 ∏(1-p)（已到手 / 前置不满足 / 徽章不够的那几条不参与）——
 *     旧的「1-Σp」近似会在前置满足之后算高（天冠山那两条 1% 宝珠照抢池）；
 *     池权重受「本地区已拿徽章数」限制：金色蔓莓果要 3 枚、文柚果/蕉香果/谜芝果
 *     要 6 枚、星桃果要 8 枚，徽章不够时这些树果权重为 0；
 *   · 效率 = 单趟概率 ÷（走到道具格的期望点数 at + 2.5 点切图开销），
 *     期望轮数 = 1 ÷ 单趟概率，期望分钟按 ×4 满速折算；
 *   · 同地区两张图轮换时，**只用效率最高的那两张**（第三名以后不再进入轮换），
 *     来回切图各收一趟，切图不白跑；只剩一张时就在那一张反复重进。
 *
 * 第二十七批：意向树果改成单选；第四十一批补上每张图的获取期望；
 * 第五十四批把「任意树果都算目标」改叫「狂爆刷取任意树果」（进图即切、不走路）；
 * 第六十批 / 第六十六批 / 第六十七批 又把它收成「银河队基地⇄灯塔徽章 两章纯来回刷新」。
 *
 * 第九十批（并成一个「刷取任意树果」，不再算指定树果）：
 *   · 面板上那张「意向树果」单选表**整块删掉** —— 不再选某一种树果，也不再有
 *     「一仓 999 个就停」这种按种计数；「狂爆刷取任意树果」这个选项一并撤掉，
 *     树果刷取只剩一个模式：**刷取任意树果**，任何树果掉到都算到手；
 *   · 因为不再指定树果，统计口径改成**只看总数**：仓库里 10 种树果加起来多少、
 *     本次一共到手多少、单趟出货率（这一趟道具格给到任意树果的概率）、
 *     期望（要几轮 / 约几分钟刷到 1 个）；
 *   · 选图也回到「谁出货率最高去谁」：本地区效率前两名轮换（`topTwo`），
 *     不再固定银河队基地 / 灯塔徽章来回空刷 —— 那两个是「进图即切、一步不走」的
 *     纯刷新，压根走不到道具格，拿不到果子，出货率只能当理论值；
 *   · 新增 `perBerry()`：**每种树果各自效率最高的地图**（面板下方那张对照表
 *     与安装说明里的表格同源），方便想看某种树果该去哪张图。
 *
 * 第九十一批（**意向树果回来了**，第九十批把选择权一起删掉是过头了）：
 *   · 面板回到原版面：`意向树果` 单选表（10 种 + 最后一行「任意树果」）+ `获取期望排行`
 *     + 参数，三格两格统计与「每种树果 · 效率最高的地图」那张新表撤掉；
 *   · 选某一种 = 只刷那一种：挑图、期望、排行、到手、仓库小字全部只按它算
 *     （`wantedIds(cfg)` 回 `[id]`）；tally 也只记它（`gainWanted`）；
 *   · 选最后一行「任意树果」= 10 种全算、只按总数统计（＝第九十批的那套口径），
 *     `targets` 空数组就是它，`anyBerry` 只是它的派生标志；
 *   · 「狂爆刷取任意树果」（进图即切、两章来回刷新）仍然不回来 —— 那套走不到道具格，
 *     farm-engine 的 `isRushPingPong` 也早就不认 `cfg.anyBerry` 了。
 *
 * 所有切图都先过 shiny-guard：遇到闪光宝可梦，战斗结束再切走。
 */
(function (root) {
  'use strict';

  var DATA = root.PCG_ITEM_DATA || null;
  var ENGINE = root.PCG_FARM_ENGINE || null;

  var DEFAULT = {
    /* 第九十一批：回到「意向树果」单选 —— targets 是最多一种树果的 id；
     * 空数组＝单选表最后那一行「任意树果」（10 种全算、只按总数统计）。
     * anyBerry 只是这件事的派生标志（老存档 / 引擎里别处还在看它）。 */
    targets: [],
    anyBerry: true,
    mapMode: 'auto',
    spotKey: '52:0',        // 银河仓库（at 1.5，普通池出货率最高的一张）
    alternate: false,       // v1.33：删除「同地区两张图轮换」，固定只去效率第一名
    speed: 3,
    settleMs: 1400,
    intervalMs: 600,
    maxCycles: 0,
    resume: true,
    autoPop: true,
    hud: true,              // 第五十五批曾默认关；第六十三批改回默认开（面板里可随时关）
    hudAlways: false
  };

  var CFG_KEY = 'pcgBerryFarmCfgV1';
  var RUN_KEY = 'pcgBerryFarmRunV1';
  var TALLY_KEY = 'pcgBerryFarmTallyV1';

  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function list(v) {
    if (Array.isArray(v)) return v.slice(0, 20);
    return String(v == null ? '' : v).split(/[,，、\s]+/).filter(Boolean).slice(0, 20);
  }
  function sanitize(o) {
    var s = o || {};
    /* 第九十一批：意向树果单选 —— 只留最多一种（勾了新的就把旧的顶掉）；
     * 一种都没有＝单选表最后那一行「任意树果」，此时 anyBerry 为 true。 */
    var tg = list(s.targets).filter(function (id) {
      return !!(DATA && DATA.berry(id));
    }).slice(0, 1);
    return {
      targets: tg,
      anyBerry: !tg.length,
      mapMode: s.mapMode === 'manual' ? 'manual' : 'auto',
      spotKey: String(s.spotKey || DEFAULT.spotKey),
      /* v1.33：轮换功能整体删除，旧配置里存过 true 也一律拉回 false（只去第一名）。 */
      alternate: false,
      speed: 3,                                     // 面板撤掉速度，固定拉满
      settleMs: clamp(num(s.settleMs, 1400), 300, 8000),
      intervalMs: clamp(num(s.intervalMs, 600), 200, 3000),
      maxCycles: clamp(Math.round(num(s.maxCycles, 0)), 0, 100000),
      resume: s.resume !== false,
      autoPop: s.autoPop !== false,
      hud: Number(s.hudV) >= 3 ? s.hud !== false : true,
      hudV: 3,
      hudAlways: !!s.hudAlways
    };
  }

  /* ---------------- 树果名 / 效果小字 ---------------- */
  function label(id) {
    var b = DATA && DATA.berry(id);
    return b ? b.zh : String(id);
  }
  /* 第九十一批：面板 / 日志 / 开跑提示都写「正在找 X」——
   * 选了某一种就写它的名字，选「任意树果」写「任意树果」。 */
  function targetLabel(cfg) {
    var t = (cfg && cfg.targets) || [];
    if (!t.length) return '任意树果';
    return label(t[0]);
  }
  /* 全 10 种树果 */
  function allIds() {
    return (DATA && DATA.berries) ? DATA.berries.map(function (b) { return b.id; }) : [];
  }
  /* 这一轮真正要刷的树果 id 列表：单选里勾了谁就只刷谁，没勾＝10 种全算 */
  function wantedIds(cfg) {
    var t = (cfg && cfg.targets) || [];
    if (!t.length) return allIds();
    return t.slice(0, 1);
  }

  /* 文档表格的「效果」列：普通树果改成孵蛋时长，谜芝果从「图鉴」改成「未捕获」，
   * 其余倍率按文档写法（x 半角 / × 全角照抄）。 */
  var BY_EFF = {
    'berry-oran': '孵蛋5分钟',
    'berry-pecha': '孵蛋15分钟',
    'berry-sitrus': '孵蛋30分钟',
    'razz-berry': '捕捉x1.25',
    'golden-razz-berry': '捕捉×1.5',
    'nanab-berry': '稀有x2',
    'enigma-berry': '未捕获x3',
    'pinap-berry': '经验x1.25',
    'lansat-berry': '金币x1.25',
    'starf-berry': '闪光x2'
  };
  function effText(b) {
    if (!b) return '';
    if (BY_EFF[b.id]) return BY_EFF[b.id];
    if (!b.buff || !b.mult) return '普通树果';
    return (b.familyZh || b.family || '加成') + ' ×' + b.mult;
  }

  /* ---------------- 仓库口径（第九十批：只看总数） ----------------
   * save.items[id] 才是玩家真正持有的树果数；「刷取任意树果」把 10 种加起来。 */
  function bagOf(save, id) {
    var it = (save && save.items) || {};
    return Number(it[id]) || 0;
  }
  function bagTotal(save) {
    var sum = 0, list = (DATA && DATA.berries) || [];
    for (var i = 0; i < list.length; i++) sum += bagOf(save, list[i].id);
    return sum;
  }
  function bagCount(save) {
    var n = 0, list = (DATA && DATA.berries) || [];
    for (var i = 0; i < list.length; i++) if (bagOf(save, list[i].id) > 0) n++;
    return n;
  }
  /* 第九十一批：面板「仓库 N 个」——单选里勾了某一种就只算那一种；
   * 选「任意树果」时算 10 种的总和。 */
  function bagWanted(cfg, save) {
    var t = (cfg && cfg.targets) || [];
    if (!t.length) return bagTotal(save);
    return bagOf(save, t[0]);
  }

  /* 面板第一格：地区 + 章节名（写名字，不写「第 xx 章」） */
  function chapterCell(save) {
    var ch = save && save.adv && typeof save.adv.chapter === 'number' ? save.adv.chapter : -1;
    var c = ch >= 0 ? DATA.chapter(ch) : null;
    var rg = ch >= 0 ? DATA.regionOf(ch) : '';
    var name = (c && c.zh) || '';
    if (!name) return '—';
    return (rg ? DATA.regionLabel(rg) + ' · ' : '') + name;
  }

  /* ---------------- 存档判读 / 条件口径（第四十一批） ----------------
   * loot 那几条稀有道具的「前置宝可梦 / 徽章 / 已到手」决定了它会不会抢普通池，
   * 所以算树果概率时要跟稀有道具用同一套 opt。 */
  function hasMons(save, ids) {
    if (!ids || !ids.length) return true;
    var mons = (save && save.mons) || [], have = {};
    for (var i = 0; i < mons.length; i++) if (mons[i]) have[Number(mons[i].id)] = true;
    for (var j = 0; j < ids.length; j++) if (!have[Number(ids[j])]) return false;
    return true;
  }
  function hasBadge(save, b) {
    if (!b) return true;
    var arr = (save && save.adv && save.adv.badges) || [];
    return arr.indexOf(b) >= 0;
  }
  function mkCtx(save) {
    return {
      save: save,
      unlocked: save && save.adv && typeof save.adv.unlocked === 'number' ? save.adv.unlocked : 0,
      lastCh: -1
    };
  }
  function lootOpt(ctx) {
    var save = (ctx && ctx.save) || null;
    return {
      owned: function (ids) { return hasMons(save, ids); },
      ownsAll: function (ids) { return hasMons(save, ids); },
      hasBadge: function (b) { return hasBadge(save, b); },
      gifted: function (id) {
        return !!(save && save.adv && save.adv.gifts && save.adv.gifts[id]);
      }
    };
  }

  /* ---------------- 文案 ---------------- */
  function pctText(v) {
    var n = Number(v) || 0;
    if (!n) return '—';
    var p = n * 100;
    return (p >= 1 ? Math.round(p * 10) / 10 : Math.round(p * 100) / 100) + '%';
  }
  function minText(m) {
    var n = Number(m) || 0;
    if (!n) return '—';
    if (n < 1) return Math.max(1, Math.round(n * 60)) + ' 秒';
    return (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10) + ' 分';
  }
  /* 一张图的期望：单趟 33.4% · 期望 3 轮 / 约 12 秒 */
  function oneText(r) {
    if (!r || !r.run) return '这张图掉不出树果';
    return '单趟 ' + pctText(r.run) + ' · 期望 ' + Math.round(r.runs) + ' 轮 / 约 ' + minText(r.mins);
  }
  /* 轮换的两张一起写（日志 / 面板用） */
  function pairText(two) {
    if (!two || !two.length) return '';
    if (two.length === 1) return '只去 ' + two[0].label + '：' + oneText(two[0]);
    return '两张轮换 ' + two[0].label + '（' + oneText(two[0]) + '） / ' +
      two[1].label + '（' + oneText(two[1]) + '）';
  }
  function brief(r) {
    if (!r) return null;
    return {
      key: r.key, ch: r.ch, step: r.step, label: r.label,
      region: r.region, regionZh: r.regionZh,
      at: r.at, p: r.p, run: r.run, runs: r.runs, mins: r.mins,
      score: r.score, wild: r.wild
    };
  }

  /* ---------------- 每张图的期望（第九十一批：ids 由意向树果单选决定） ---------------- */
  function rowsFor(ids, ctx) {
    var opt = lootOpt(ctx);
    var list = (ids && ids.length) ? ids : allIds();
    /* 一章只算最早那个道具格（引擎进图抓的就是它） */
    var maps = DATA.berryMaps ? DATA.berryMaps(list, opt) : [];
    var out = [];
    for (var i = 0; i < maps.length; i++) {
      var m = maps[i];
      var gates = [];
      for (var j = 0; j < list.length; j++) {
        var b = DATA.berry(list[j]);
        if (b && (b.gate || 0) > m.badges) gates.push(b.zh + '需 ' + b.gate + ' 徽章');
      }
      var locked = m.ch > ctx.unlocked || !(m.p > 0);
      out.push({
        key: m.key, ch: m.ch, step: m.step, label: m.label,
        region: m.rg, regionZh: DATA.regionLabel(m.rg),
        at: m.at, wild: m.wild, trainers: m.trainers, badges: m.badges,
        p: m.p, run: m.run, runs: m.runs, mins: m.mins, nodes: m.nodes, cost: m.cost,
        score: locked ? -1 : m.score, locked: locked,
        unlocked: m.ch <= ctx.unlocked,
        reason: m.ch > ctx.unlocked ? '章节还没解锁'
          : (!(m.p > 0) ? (gates[0] || '这张图掉不出树果') : ''),
        spot: m.spot
      });
    }
    return out;
  }
  function spotRows(cfg, ctx) { return rowsFor(wantedIds(cfg), ctx); }

  /* ---------------- 地区门禁（第二十三批） ----------------
   * 切章刷新只在本地区里转：同地区优先、避开有游走神兽的章节。
   * 具体实现在 farm-engine 的 region.* 里，两个刷取共用一套。 */
  function RG() { return (ENGINE && ENGINE.region) || null; }
  function narrow(rows, save) {
    var r = RG();
    if (r && typeof r.narrow === 'function') return r.narrow(rows, save);
    return { rows: rows, region: '', regionZh: '', sameRegion: true, roamSkipped: 0 };
  }
  function pickNote(pick, row, save) {
    var r = RG();
    return (r && typeof r.pickNote === 'function') ? r.pickNote(pick, row, save) : '';
  }
  function outsideNote(spot, save) {
    var r = RG();
    if (!r || !spot || !spot.rg) return '';
    var rg = r.regionOfSave(save);
    if (!rg || rg === spot.rg) return '';
    return '手动指定的地图在' + (DATA ? DATA.regionLabel(spot.rg) : spot.rg) +
      '，不在当前地区（' + (DATA ? DATA.regionLabel(rg) : rg) + '），会跨地区前往一次';
  }

  /* 本地区的「两张图」：效率前两名（第四十一批）。
   * 第三名以后不再进入轮换 —— 旧版按「不在上一章就优先」排序，会在三四名之间
   * 来回切，把一半轮次浪费在慢图上。 */
  function topTwo(cfg, save, ctx) {
    var rows = spotRows(cfg, ctx).filter(function (r) { return !r.locked; });
    if (!rows.length) return { two: [], near: [], reason: '没有能掉树果的已解锁地图（多半是徽章还不够）' };
    var pick = narrow(rows, save);
    var sorted = pick.rows.slice().sort(function (a, b) {
      if (Math.abs(b.score - a.score) > 1e-12) return b.score - a.score;
      return a.at - b.at;
    });
    return { two: sorted.slice(0, 2), near: sorted.slice(2, 4), pick: pick };
  }

  /* ---------------- 第九十批：每种树果效率最高的地图 ----------------
   * 安装说明里那张对照表 / 冒烟测试直接读它：一种树果一行，
   * 取「已解锁里效率最高的那张」，没解锁的图只当备选、标一句未解锁。
   * 第九十一批：面板上那张表撤了（回到原版面），这里留着当口径自检与文档来源。 */
  function perBerry(ctx) {
    var list = (DATA && DATA.berries) || [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      var rows = rowsFor([b.id], ctx);
      var openRows = rows.filter(function (r) { return !r.locked && r.run > 0; });
      var best = openRows[0] || rows.filter(function (r) { return r.run > 0; })[0] || null;
      out.push({
        id: b.id, name: b.zh, eff: effText(b),
        gate: b.gate || 0, gateText: b.gate ? ('需 ' + b.gate + ' 徽章') : '',
        owned: bagOf((ctx && ctx.save) || null, b.id),
        label: best ? best.label : '—',
        ch: best ? best.ch : -1, regionZh: best ? best.regionZh : '',
        at: best ? best.at : 0, badges: best ? best.badges : 0,
        run: best ? best.run : 0, runs: best ? best.runs : 0, mins: best ? best.mins : 0,
        score: best ? best.score : 0,
        /* 未解锁：这张图所在章节还没推到 → 表里写「未解锁」，别让人白跑 */
        locked: !!(best && best.locked),
        reason: best ? best.reason : '这张图掉不出该树果',
        key: best ? best.key : ''
      });
    }
    return out;
  }

  function plan(cfg, save, ctx) {
    /* 第九十一批：挑图 / 期望一律按意向树果（`wantedIds`）算 ——
     * 选了某一种就只找它的最高效图，选「任意树果」就是 10 种加起来。
     * 走到道具格拿完再切，进图就切那套（狂爆）已经撤掉。 */
    if (cfg.mapMode === 'manual') {
      var sp = DATA.spot(cfg.spotKey);
      if (!sp) return { spot: null, reason: '手动指定的地图不存在，请重新选', wanted: [] };
      if (sp.ch > ctx.unlocked) return { spot: null, reason: '手动指定的章节还没解锁', wanted: [] };
      var me = DATA.berryExpectOf ? DATA.berryExpectOf(sp, wantedIds(cfg), lootOpt(ctx))
        : { run: 0, runs: 0, mins: 0, cost: 0, nodes: 0, score: 0 };
      var row = {
        key: sp.key, ch: sp.ch, step: sp.step,
        label: (sp.chapterZh || ('第 ' + (sp.ch + 1) + ' 章')) + ' · ' + (sp.zh || ''),
        region: sp.rg, regionZh: DATA.regionLabel(sp.rg), at: sp.at, wild: sp.w,
        p: me.run, run: me.run, runs: me.runs, mins: me.mins, nodes: me.nodes,
        cost: me.cost, score: me.score, spot: sp
      };
      return {
        spot: sp, wanted: wantedIds(cfg), reason: '', regionNote: outsideNote(sp, save),
        picked: row, two: [row], eff: row,
        effText: '手动指定 · ' + row.label + '：' + oneText(row),
        effShort: '单趟 ' + pctText(row.run) + ' · 期望 ' + Math.round(row.runs) + ' 轮',
        effNote: '手动指定 ' + row.label + '：' + oneText(row)
      };
    }
    var r = topTwo(cfg, save, ctx);
    if (!r.two.length) return { spot: null, reason: r.reason, wanted: wantedIds(cfg) };
    var two = r.two, target = two[0];
    /* v1.33：删除「同地区两张图轮换」，固定只去效率第一名那张图。
     * alternate 字段仅兼容旧存档，行为上不再启用，也不再显示「两张轮换」文案。 */
    return {
      spot: target.spot, wanted: wantedIds(cfg), reason: '', picked: target,
      two: two, near: r.near, eff: target,
      effText: oneText(target),
      effShort: '单趟 ' + pctText(target.run) + ' · 期望 ' + Math.round(target.runs) + ' 轮',
      effNote: '「' + targetLabel(cfg) + '」' + oneText(target),
      regionNote: pickNote(r.pick, target, save)
    };
  }

  function rank(cfg, save, ctx) {
    return spotRows(cfg, ctx).sort(function (a, b) { return b.score - a.score; })
      .slice(0, 30).map(function (r) {
        return {
          key: r.key, ch: r.ch, step: r.step, label: r.label,
          region: r.region, regionZh: r.regionZh,
          p: r.p, at: r.at, score: r.score, wild: r.wild, trainers: r.trainers,
          run: r.run, runs: r.runs, mins: r.mins, nodes: r.nodes, cost: r.cost,
          badges: r.badges, locked: r.locked, unlocked: r.unlocked, reason: r.reason
        };
      });
  }

  /* ---------------- 面板数据 ----------------
   * 第九十一批：回到「意向树果」单选那套面板 ——
   * `list` 画那 10 行（效果 / 持有数 / 正在刷的描金边）、`current` 与 `currentName`
   * 给状态栏和看板用，`bagNow` 只算当前那一种（选「任意树果」时算总和）。 */
  function extra(save, cfg) {
    var c = cfg || DEFAULT;
    var ctx = mkCtx(save);
    var p = null;
    try { p = plan(c, save, ctx); } catch (e) { p = null; }
    var two = (p && p.two) || [];
    var ids = wantedIds(c);
    var one = ids.length === 1 ? ids[0] : '';
    var table = ((DATA && DATA.berries) || []).map(function (b) {
      return {
        id: b.id, name: b.zh, gate: b.gate || 0,
        eff: effText(b), owned: bagOf(save, b.id),
        buff: !!b.buff, cur: one === b.id
      };
    });
    return {
      list: table,
      any: !one,
      rush: false,                              // 老字段：狂爆模式已撤
      current: one || 'any',
      currentName: targetLabel(c),
      chapterCell: chapterCell(save),
      bagNow: bagWanted(c, save),
      bagName: one ? label(one) : '任意树果',
      unlocked: save && save.adv && typeof save.adv.unlocked === 'number' ? save.adv.unlocked : 0,
      best: brief(two[0] || null),
      second: brief(two[1] || null),
      top2: two.map(brief),
      twoText: pairText(two),
      effText: (p && p.effText) || '',
      effNote: (p && p.effNote) || '',
      altOn: c.alternate !== false,
      why: (p && !p.spot && p.reason) ? p.reason : ''
    };
  }

  function validate(cfg, save, data) {
    if (!data) return { ok: false, text: '道具数据表没加载，刷新一次游戏页' };
    var ctx = mkCtx(save);
    var p = plan(cfg, save, ctx);
    if (!p.spot) return { ok: false, text: p.reason || '没有可用地图' };
    return { ok: true };
  }

  function done() {
    /* 第九十批：一律无限刷（不按种、不按数停），想停就点「停止」 */
    return '';
  }

  var SPEC = {
    kind: 'berry',
    title: '树果刷取',
    cfgKey: CFG_KEY,
    runKey: RUN_KEY,
    tallyKey: TALLY_KEY,
    defaultCfg: DEFAULT,
    sanitize: sanitize,
    plan: plan,
    rank: rank,
    validate: validate,
    done: done,
    extra: extra,
    targetLabel: targetLabel,
    /* 第四十一批 / 第九十一批：给 smoke 直接验「每章只算最早一格 / 只在前两名之间轮换 /
     * 意向树果单选真的改到挑图上 / 每种树果最高效率那张图」 */
    util: {
      rowsFor: rowsFor,
      spotRows: spotRows,
      topTwo: topTwo,
      perBerry: perBerry,
      allIds: allIds,
      wantedIds: wantedIds,
      targetLabel: targetLabel,
      bagWanted: bagWanted,
      oneText: oneText,
      pairText: pairText,
      mkCtx: mkCtx,
      lootOpt: lootOpt,
      effText: effText,
      bagTotal: bagTotal,
      bagCount: bagCount
    },
    gainWanted: function (id, cfg) {
      /* 第九十一批：单选里勾了某一种就只记那一种；没勾（＝任意树果）任何树果都算 */
      if (!cfg) return !!(DATA && DATA.berry(id));
      var t = cfg.targets || [];
      if (!t.length) return !!(DATA && DATA.berry(id));
      return t.indexOf(id) >= 0;
    }
  };

  root.PCG_BERRIES = ENGINE ? ENGINE.create(SPEC) : null;
  root.PCG_BERRY_SPEC = SPEC;
  if (typeof module !== 'undefined' && module.exports) module.exports = SPEC;
})(typeof window !== 'undefined' ? window : this);
