/* Poke'Catch 防掉线助手 —— 稀有道具重复刷取（第五批 / 第二十六批重做）
 *
 * 游戏里有一批「只在指定地图的道具格、按固定概率掉」的稀有道具，例如：
 *   深海之牙 5%（丰缘 第 34 章 · 弃船）、美丽鳞片 5%（第 40 章 · 冰之间，只有退潮才开）、
 *   深海鳞片 5%（第 41 章 · 海底）、金刚 / 白玉宝珠各 1%（神奥 第 58 章 · 天冠山，
 *   需三圣菇）、白金宝珠 1%（同章 · 积雪的天冠山，需骑拉帝纳）、
 *   玛纳霏之蛋 2%（第 59/60/66 章，需「神奥大师」徽章）。
 *
 * 稀有道具**每种只会给一次**（游戏写进 adv.gifts），所以面板上勾过的道具一旦到手
 * 就变黑不可选、标「已获得」，玩家原本背包里就有的也按已获得显示；
 * 地图章节还没解锁的同样变黑，标「未解锁地图」。
 *
 * 刷取规则（第二十六批 / 第四十批重算）：
 *   · 面板不再提供「选图 / 指定地图 / 速度 / 拿到几个就停」这些参数，
 *     一律自动挑效率最高的**已解锁**地图；
 *   · 第四十批起「效率」不再只看掉率 p，而是算完整期望：
 *       单趟概率 = 0.7（道具格出现）× loot 表里轮到它的概率
 *                  （同格排在前面的稀有条目会抢走机会，已到手的那条不再参与）；
 *       一趟成本 = 道具格在整章时间线里的期望下标 + 2.5 点切图开销；
 *       期望轮数 = 1 ÷ 单趟概率，期望点数 = 期望轮数 × 一趟成本。
 *     于是「道具格在第 17 个点」和「在第 3 个点」的两张同掉率地图能分出高下；
 *   · 每个道具**只去效率第一名那一张图**，不再两张图来回切
 *     （旧版 alternate 会把一半轮次浪费在慢图上）；
 *     只有第一名真去不了（章节未解锁 / 缺前置 / 那章正被游走神兽占着）才用第二名，
 *     状态行写明为什么换；
 *   · 勾了多种就**一种一种找**：先找到第一种，再换下一种，状态里写明正在找哪个；
 *     第五十批起顺序就是玩家**勾选的先后**（勾选框里写着序号 1、2、3…），
 *     同时只会有一个道具在刷；
 *   · 地图有潮汐门禁（冰之间 tide:"low"）时：**队首那一项**正好被天气/时段挡住
 *     （涨潮进不去），就把这一项挪到队尾，先刷后面能刷的目标，等退潮了再回来 ——
 *     只有「剩下的全都刷不了」时才真的挂着等潮；
 *   · 切章优先在本地区里转；唯一那张图在别的地区时，去一趟并在状态里写明；
 *     正被游走神兽占着的章节先等它走（或临时用次优图，写明原因）；
 *   · 勾的几种全部到手（或原本就有）时，功能自己停下来并写日志。
 *
 * 所有切图都先过 shiny-guard：遇到闪光宝可梦，战斗结束再切走。
 */
(function (root) {
  'use strict';

  var DATA = root.PCG_ITEM_DATA || null;
  var ENGINE = root.PCG_FARM_ENGINE || null;

  var DEFAULT = {
    targets: ['adamant-orb', 'lustrous-orb'],
    mapMode: 'auto',        // 第二十六批起固定 auto（面板已不提供选图参数，保留字段兼容旧配置）
    spotKey: '57:0',
    alternate: false,       // 第四十批起不再轮换：只去效率第一名那张图（字段保留兼容旧配置）
    speed: 3,               // 面板不再提供，固定拉满
    /* 第七十六批：`skipLate` / `lateFactor` / `maxWatchSec` 三个参数全删了 ——
     * 「道具格刷得太靠后就重开」「等太久就切走」这两类判定已整套撤除，
     * 留着它们只会继续把「只在靠后那一格才掉」的稀有道具判死。 */
    settleMs: 1400,
    intervalMs: 600,
    limit: 0,               // 第二十六批起恒为 0：集齐所勾道具就停
    maxCycles: 0,
    resume: true,
    autoPop: true,
    hud: true,              // 第五十五批曾默认关；第六十三批改回默认开（面板里可随时关）
    hudAlways: false
  };

  var CFG_KEY = 'pcgItemFarmCfgV1';
  var RUN_KEY = 'pcgItemFarmRunV1';
  var TALLY_KEY = 'pcgItemFarmTallyV1';

  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function list(v) {
    if (Array.isArray(v)) return v.slice(0, 20);
    return String(v == null ? '' : v).split(/[,，、\s]+/).filter(Boolean).slice(0, 20);
  }
  function sanitize(o) {
    var s = o || {};
    return {
      targets: list(s.targets).filter(function (id) { return !!(DATA && DATA.rare(id)); }),
      mapMode: 'auto',
      spotKey: String(s.spotKey || DEFAULT.spotKey),
      alternate: s.alternate !== false,
      speed: clamp(Math.round(num(s.speed, 3)), 1, 3),
      /* 第七十六批：skipLate / lateFactor 不再保留（老存档里的值直接被丢掉） */
      settleMs: clamp(num(s.settleMs, 1400), 300, 8000),
      intervalMs: clamp(num(s.intervalMs, 600), 200, 3000),
      limit: 0,
      maxCycles: clamp(Math.round(num(s.maxCycles, 0)), 0, 100000),
      resume: s.resume !== false,
      autoPop: s.autoPop !== false,
      /* 第五十五批：看板曾默认关。第六十三批改回默认开：
       * 老存档（hudV < 3）第一次升级统一打开一次，之后玩家自己关就照关。 */
      hud: Number(s.hudV) >= 3 ? s.hud !== false : true,
      hudV: 3,
      hudAlways: !!s.hudAlways
    };
  }

  function label(id) {
    var r = DATA && DATA.rare(id);
    return r ? r.zh : String(id);
  }
  /* 摘要 / 日志里用：按「先找哪个再找哪个」的顺序写出来 */
  function targetLabel(cfg) {
    var t = cfg.targets || [];
    if (!t.length) return '（未选道具）';
    var names = t.slice(0, 4).map(label);
    return names.join(' → ') + (t.length > 4 ? ' 等 ' + t.length + ' 种' : '');
  }

  /* ---------------- 存档判读 ---------------- */
  /* 已到手判定（仅限获得一次）：adv.gifts 记过一次，或者背包里还有。
   * v1.26 断牙（axew-fang）例外：它是「集齐 needN=10 颗」的一次性收集，
   *   - 游戏把计数存在 items['axew-fang']（0~10），集满后触发 axew-nest 礼物；
   *   - 所以未集满 10 颗前不算「已获得」，面板显示 N/10 进度；
   *   - 集满 10 颗或 adv.gifts['axew-nest'] 记过 → 才算到手。 */
  function ownKind(save, id) {
    var a = (save && save.adv) || {};
    var gifts = a.gifts || {};
    if (gifts[id]) return 'gift';
    var r = DATA && DATA.rare ? DATA.rare(id) : null;
    if (r && r.doneGift && gifts[r.doneGift]) return 'gift';
    var have = Number((save && save.items && save.items[id]) || 0) || 0;
    var need = (r && r.needN) || 1;
    return have >= need ? 'bag' : '';
  }
  function owned(save, id) { return !!ownKind(save, id); }
  function pending(save, cfg) {
    return (cfg.targets || []).filter(function (id) { return !owned(save, id); });
  }
  /* 第二十六批：一次只找一种 —— 按勾选顺序取第一个还没到手的 */
  function currentTarget(save, cfg) {
    var rest = pending(save, cfg);
    return rest.length ? rest[0] : '';
  }

  /* 第五十批：刷取队列。
   * 顺序就是 cfg.targets 的先后（面板上勾选框中那个序号，玩家先勾的先刷），
   * 同时算出每一项「现在能不能刷」：blocked = 'tide' 表示这一项的所有图都要等退潮，
   * 此刻去了也进不去 —— 这种要挪到队尾，先刷后面的目标，别让功能卡在一张图上干等。
   *   ids: 还差哪些道具（有序）
   *   rows: [{ id, name, ord, blocked, why }]  → 面板画序号 / 写原因用 */
  function queueOf(save, cfg, ctx) {
    var ids = pending(save, cfg);
    var rows = [];
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var cands = candidatesOf(id, ctx);
      var usable = cands.filter(function (c) { return c.ok && c.spot; });
      var tideOnly = !usable.length && cands.length > 0 &&
        cands.every(function (c) { return c.wait === 'tide'; });
      var gate = gateOf(id, ctx);
      rows.push({
        id: id, name: label(id), ord: i + 1,
        blocked: tideOnly ? 'tide' : (gate && !gate.open ? 'gate' : ''),
        why: tideOnly ? '受天气/时段限制（要退潮才开）暂时刷不了' :
          (gate && !gate.open ? (gate.msg + '，暂时不能选') : '')
      });
    }
    return { ids: ids.slice(), rows: rows };
  }

  /* 第五十七批：「拥有某只宝可梦」不能只看 save.mons —— PC / 培育屋 /
   * 地下通道里的实例不在主列表里，图鉴 dex[id] 则记着「抓到过」。
   * 抽成模块级函数：引擎 saveCtx / 自建 mkCtx / gateOf 三处共用同一结论。
   * 第九十批：改成「全存档按形状扫描」，不再逐个列举容器 —— 游戏派遣时
   * 用 takeOutMon() 把实例从 mons 移走、转存到 under.slots[].mons 等处，
   * 以后再改字段名也不会漏判。判定严格对齐游戏的
   * owns() = pn().some(m => m.id === id)：只精确匹配实例 id，不折算形态。
   * 与 farm-engine.js 的 ownsAll 完全同一口径。 */
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
  function saveOwnsAll(save, ids) {
    if (!ids || !ids.length) return true;
    var have = ownedIds(save);
    for (var i = 0; i < ids.length; i++) {
      var n = Number(ids[i]);
      if (n > 0 && !have[n]) return false;
    }
    return true;
  }
  /* v1.21：锁定原因文案中文化。
   * 徽章在游戏里是法语名（如 Maître Unys），直接显示玩家看不懂；
   * 这里映射成游戏内中文（Maître Unys → 合众冠军）。未收录的保留原文。 */
  var BADGE_ZH = {
    /* 冠军徽章（用户最常遇到，Maître Unys = 合众冠军，必须准确） */
    'Maître': '冠军', 'Maître Hoenn': '丰缘冠军', 'Maître Johto': '城都冠军',
    'Maître Sinnoh': '神奥冠军', 'Maître Unys': '合众冠军',
    /* 关都 */
    'Roche': '灰色徽章', 'Cascade': '蓝色徽章', 'Chaleur': '橙色徽章',
    'Jet': '彩虹徽章', 'Poing': '粉红徽章', 'Volcan': '金色徽章',
    'Terre': '绿色徽章', 'Sismique': '青绿徽章', 'Esprit': '灵魂徽章',
    /* 城都 */
    'Zéphyr': '疾风徽章', 'Plaine': '平原徽章', 'Brume': '迷雾徽章',
    'Prisme': '棱镜徽章', 'Pluie': '雨水徽章', 'Orage': '雷鸣徽章',
    'Foudre': '雷电徽章', 'Glacier': '冰河徽章', 'Choc': '电击徽章',
    /* 丰缘 */
    'Charbon': '煤炭徽章', 'Forêt': '森林徽章', 'Marais': '沼泽徽章',
    'Palustre': '湿地徽章', 'Plume': '飞羽徽章', 'Minéral': '岩石徽章',
    'Cascade': '潮汐徽章', 'Dynamo': '发电机徽章', 'Stalactite': '石笋徽章',
    /* 神奥 */
    'Glaçon': '冰柱徽章', 'Pavé': '石阶徽章', 'Base': '追寻徽章',
    'Basique': '基础徽章', 'Prisme': '棱彩徽章', 'Mythe': '神话徽章',
    'Légende': '传说徽章', 'Triple': '三重徽章', 'Lever': '崛起徽章',
    /* 合众 */
    'Balance': '平衡徽章', 'Élytre': '鹰击徽章', 'Poing': '拳击徽章',
    'Spring': '喷射徽章', 'Insight': '洞察徽章', 'Quake': '地震徽章',
    'Jet': '飞翔徽章', 'Fantôme': '幽灵徽章', 'Volt': '伏特徽章',
    'Âme': '灵魂徽章', 'Terre': '大地徽章'
  };
  function badgeZh(b) {
    if (!b) return '';
    return BADGE_ZH[b] || b;
  }
  /* 前置宝可梦 ID → 中文名（stab.js 的 nm 表，已含合众 649=盖诺赛克特） */
  function monName(id) {
    var nm = (root.PCG_STAB && root.PCG_STAB.nm) || {};
    return nm[id] || (root.PCG_DEX_DATA && root.PCG_DEX_DATA.name ? root.PCG_DEX_DATA.name(id) : '') || String(id);
  }
  function mkCtx(save) {
    var ctx = {
      save: save,
      unlocked: typeof (save && save.adv && save.adv.unlocked) === 'number' ? save.adv.unlocked : 0,
      lastCh: -1
    };
    ctx.ownsAll = function (ids) { return saveOwnsAll(save, ids); };
    ctx.hasBadge = function (b) {
      var arr = (save && save.adv && save.adv.badges) || [];
      return arr.indexOf(b) >= 0;
    };
    return ctx;
  }

  /* ---------------- 第五十七批：白金宝珠的双条件门禁 ----------------
   * 白金宝珠（griseous-orb）只在第 57 章「积雪的天冠山」掉，而该格 loot 上
   * 挂着 owns:[487]（骑拉帝纳）。以前两个条件散在 mapState 里、面板却一律写
   * 「未解锁地图」，玩家根本看不出差的是哪一关。现在显式列成两个条件，
   * 必须**同时**满足才开放选择：
   *   ① 地图解锁（候选章节 ch <= adv.unlocked）
   *   ② 拥有骑拉帝纳（主队伍 / PC / 培育屋 / 地下通道 / 图鉴记录任一命中）
   * 缺哪个就把哪个写进 lockMsg；两个都缺就一起写。 */
  /* 第五十八批：葛拉西蒂亚花（gracidea）沿用白金宝珠同一套双条件门禁 ——
   * 它只在第 50 章「花苑花田」（花之乐园 / Floaroma Meadow）掉，loot 上挂着
   * owns:[492]（谢米 / Shaymin）。没有谢米时这一格根本不会掉花，所以同样把
   * 「地图解锁 + 拥有谢米」显式列成条件，锁定时把缺的那一条写进 lockMsg。 */
  var GATES = [
    { id: 'griseous-orb', mon: 487, monZh: '骑拉帝纳' },
    { id: 'gracidea', mon: 492, monZh: '谢米' }
  ];
  function gateOf(id, ctx) {
    var G = null;
    for (var gi = 0; gi < GATES.length; gi++) {
      if (GATES[gi].id === id) { G = GATES[gi]; break; }
    }
    if (!G) return null;
    var r = DATA && DATA.rare(id);
    var maps = (r && r.maps) || [];
    var ch = maps.length ? Number(maps[0].ch) : -1;
    var mapOk = ch >= 0 && ch <= ctx.unlocked;
    var monOk = saveOwnsAll(ctx && ctx.save, [G.mon]);
    var miss = [];
    if (!mapOk) miss.push('地图未解锁');
    if (!monOk) miss.push('需拥有' + G.monZh);
    return {
      open: mapOk && monOk, mapOk: mapOk, monOk: monOk,
      msg: miss.length ? miss.join(' + ') : ''
    };
  }

  /* ---------------- 地图可用性 ---------------- */
  /* 一张候选地图能不能真的掉这个道具 */
  function mapState(map, ctx) {
    /* 第五十七批：三个前置是 AND，全部满足才算能去；把所有缺的条件一起写进
     * why，别只报第一个（白金宝珠会同时缺「地图解锁」和「骑拉帝纳」）。 */
    var miss = [];
    if (map.owns && map.owns.length && !ctx.ownsAll(map.owns)) {
      miss.push('缺前置宝可梦 ' + map.owns.map(monName).join('/'));
    }
    if (map.badge && !ctx.hasBadge(map.badge)) {
      miss.push('需要徽章「' + badgeZh(map.badge) + '」');
    }
    if (map.ch > ctx.unlocked) miss.push('章节还没解锁');
    if (miss.length) return { ok: false, why: miss.join(' + ') };
    var spot = DATA.spot(map.ch + ':' + map.step);
    if (!spot) return { ok: false, why: '数据表里没有这张图' };
    /* 第二十六批：潮汐门禁（冰之间只有退潮才开）——不是「去不了」，是「等一会」。 */
    if (!DATA.tideOk(map)) {
      return {
        ok: false, wait: 'tide',
        why: (spot.zh || '这张图') + '要退潮（低潮）才开，现在是涨潮'
      };
    }
    return { ok: true, spot: spot, why: '' };
  }

  /* 只算「当前这一种道具」的候选地图 */
  function lootOpt(ctx) {
    var save = (ctx && ctx.save) || null;
    return {
      ownsAll: function (ids) { return ctx.ownsAll(ids); },
      hasBadge: function (b) { return ctx.hasBadge(b); },
      /* 游戏里只认 adv.gifts（背包里有不算），到手的那条 loot 就不再掷 */
      gifted: function (id) {
        return !!(save && save.adv && save.adv.gifts && save.adv.gifts[id]);
      }
    };
  }
  function candidatesOf(id, ctx) {
    var out = [];
    var r = DATA && DATA.rare(id);
    if (!r) return out;
    var opt = lootOpt(ctx);
    for (var j = 0; j < r.maps.length; j++) {
      var m = r.maps[j];
      var st = mapState(m, ctx);
      var sp = st.spot || (DATA.spot ? DATA.spot(m.ch + ':' + m.step) : null);
      /* 去不了的图也把期望算出来（按条件全满足的最乐观口径），面板要写「解锁后约几分钟」 */
      var eff = sp ? DATA.expect(sp, id, st.ok ? opt : null) : null;
      out.push({
        id: id, name: r.zh, ch: m.ch, step: m.step, p: m.p,
        tide: DATA.tideOf(m),
        spot: st.spot || null, ok: st.ok, why: st.why, wait: st.wait || '',
        eff: eff || { run: 0, cost: 0, runs: 0, nodes: 0, mins: 0, score: -1 },
        score: eff ? eff.score : -1
      });
    }
    return out;
  }

  /* 一个道具「只去」的那一张图（效率第一；去不了时退到下一个能去的）
   * 面板 / 日志里统一从这里取，保证算出来的和实际去的是同一张。 */
  function bestRow(id, ctx) {
    var rows = candidatesOf(id, ctx);
    if (!rows.length) return null;
    var usable = rows.filter(function (c) { return c.ok && c.spot; });
    var pool = (usable.length ? usable : rows).slice();
    pool.sort(function (a, b) { return b.score - a.score; });
    var b = pool[0];
    var sp = b.spot || (DATA.spot ? DATA.spot(b.ch + ':' + b.step) : null);
    return {
      id: id, name: label(id), ch: b.ch, step: b.step,
      label: sp ? ((sp.chapterZh || '') + ' · ' + (sp.zh || '')) : ('第 ' + (b.ch + 1) + ' 章'),
      regionZh: (sp && DATA.regionLabel) ? DATA.regionLabel(sp.rg) : '',
      at: sp ? sp.at : 0, p: b.p, tide: b.tide,
      ways: rows.length, ok: b.ok, why: b.why,
      run: b.eff.run, runs: b.eff.runs, mins: b.eff.mins, nodes: b.eff.nodes,
      score: b.score
    };
  }

  /* ---------------- 地区门禁（第二十三批） ----------------
   * 切章刷新优先在本地区里转；唯一那张图在别的地区时去一趟并写明。
   * 具体实现在 farm-engine 的 region.* 里，两个刷取共用一套。 */
  function RG() { return (ENGINE && ENGINE.region) || null; }
  function roamBusy(save) {
    var r = RG();
    try {
      if (r && typeof r.roamSet === 'function') return r.roamSet(save) || {};
    } catch (e) { /* ignore */ }
    return {};
  }
  function roamUntil(save, ch) {
    var at = (save && save.roam && save.roam.at) || {};
    var t = 0;
    for (var k in at) {
      if (!Object.prototype.hasOwnProperty.call(at, k)) continue;
      var s = at[k];
      if (!s || s.ch !== ch) continue;
      t = Math.max(t, Number(s.until) || 0);
    }
    return t;
  }
  /* 按「这一张图 vs 玩家当前地区 / 游走神兽」凑出 pickNote 需要的字段 */
  function regionInfo(rows, row, save) {
    var r = RG();
    var rg = '', rr = '';
    try {
      if (r && typeof r.regionOfSave === 'function') rg = r.regionOfSave(save) || '';
      if (r && typeof r.rowRegion === 'function') rr = r.rowRegion(row) || '';
    } catch (e) { rr = ''; }
    if (!rr) rr = (row && row.spot && row.spot.rg) || '';
    var busy = roamBusy(save), skipped = 0;
    for (var i = 0; i < rows.length; i++) if (busy[rows[i].ch]) skipped++;
    return {
      rows: rows, region: rg,
      regionZh: (rg && DATA && DATA.regionLabel) ? DATA.regionLabel(rg) : rg,
      sameRegion: !rg || rr === rg,
      roamSkipped: skipped
    };
  }
  function pickNote(pick, row, save) {
    var r = RG();
    return (r && typeof r.pickNote === 'function') ? r.pickNote(pick, row, save) : '';
  }
  function spotName(c) {
    var sp = (c && c.spot) || (DATA && DATA.spot ? DATA.spot(c.ch + ':' + c.step) : null) || {};
    return (sp.chapterZh || ('第 ' + ((c.ch || 0) + 1) + ' 章')) + ' · ' + (sp.zh || '');
  }
  function pctText(v) {
    var n = Number(v) || 0;
    if (!n) return '—';
    var p = n * 100;
    return (p >= 1 ? Math.round(p * 10) / 10 : Math.round(p * 100) / 100) + '%';
  }
  function minText(min) {
    var m = Number(min) || 0;
    if (!m) return '—';
    if (m < 1) return Math.max(1, Math.round(m * 60)) + ' 秒';   // 第四十一批：不到一分钟别写「0 分钟」
    return m >= 10 ? (Math.round(m) + ' 分钟') : (Math.round(m * 10) / 10 + ' 分钟');
  }
  function effText(eff) {
    if (!eff || !eff.run) return '';
    return '单趟 ' + pctText(eff.run) + ' · 期望 ' + Math.round(eff.runs) + ' 轮 / 约 ' +
      minText(eff.mins);
  }
  /* 看板页脚只有一行，压短一点（面板里用完整版） */
  function effShort(eff) {
    if (!eff || !eff.run) return '';
    return '单趟 ' + pctText(eff.run) + ' · ' + Math.round(eff.runs) + ' 轮';
  }

  /* ---------------- 选图（第四十批：每样只去效率第一名那一张） ---------------- */
  function plan(cfg, save, ctx) {
    var q = queueOf(save, cfg, ctx);
    var order = q.ids.slice();
    if (!order.length) return { done: '意向稀有道具都到手了（含原本就有的），功能自动关闭', spot: null, wanted: [] };

    var out = {};
    function ret(o) { return Object.assign({}, o, out); }

    /* 第五十七批：门禁没开放的项（例如白金宝珠缺地图解锁 / 缺骑拉帝纳）
     * 根本不该在刷取队列里 —— 老存档里可能还勾着，这里直接剔除并用 reorder
     * 写回配置，面板序号与引擎配置一起修正，不会卡在「没有能去的地图」。 */
    var gateOff = {};
    for (var g = 0; g < q.rows.length; g++) {
      if (q.rows[g].blocked === 'gate') gateOff[q.rows[g].id] = q.rows[g].why || '条件未满足';
    }
    var dropped = order.filter(function (x) { return gateOff[x]; });
    if (dropped.length) {
      order = order.filter(function (x) { return !gateOff[x]; });
      out.reorder = order.slice();
      out.deferNote = '「' + dropped.map(label).join('」「') + '」' +
        dropped.map(function (x) { return gateOff[x]; }).join('；') + '，已从刷取顺序里移除';
      if (!order.length) {
        return ret({
          done: '可刷的稀有道具都到手了（条件未满足的已跳过），功能自动关闭',
          spot: null, wanted: []
        });
      }
    }

    /* 第五十批：队首那几项现在受天气/时段限制（涨潮，冰之间进不去）就整体挪到队尾，
     * 先刷后面能刷的；只有「剩下的全都刷不了」时才真的挂着等退潮。
     * 挪完的新顺序带 reorder 出去，引擎会写回配置，面板上的序号跟着变。 */
    var blocked = {};
    for (var b = 0; b < q.rows.length; b++) if (q.rows[b].blocked) blocked[q.rows[b].id] = 1;
    var head = 0;
    while (head < order.length && blocked[order[head]]) head++;
    var moved = [];
    if (head > 0 && head < order.length) {
      moved = order.splice(0, head);
      for (var m = 0; m < moved.length; m++) order.push(moved[m]);
    }
    if (moved.length) {
      out.reorder = order;
      var tideNote = '「' + moved.map(label).join('」「') +
        '」受天气/时段限制（要退潮才开），这会儿进不去：先排到队尾，改去刷「' +
        label(order[0]) + '」';
      out.deferNote = out.deferNote ? (out.deferNote + '；' + tideNote) : tideNote;
    }

    /* 第二十六批：勾了几种就一种一种找，先解决队列里的第一个 */
    var id = order[0];
    var all = candidatesOf(id, ctx);
    var usable = all.filter(function (c) { return c.ok && c.spot; });

    if (!usable.length) {
      /* 只有潮汐挡着 → 等退潮，别反复撞墙，也别把功能停掉 */
      var waits = all.filter(function (c) { return c.wait === 'tide'; });
      if (waits.length && waits.length === all.length) {
        var sp = waits[0].spot || DATA.spot(waits[0].ch + ':' + waits[0].step) || {};
        return ret({
          spot: null, wanted: [id], target: id, wait: true, waitMs: 15000,
          phase: '等退潮（' + (sp.zh || '目标地图') + ' 低潮才开）',
          reason: '「' + label(id) + '」只在' + (sp.zh || '这张图') + '掉，现在是涨潮：' +
            '等退潮后再去（潮汐每 3 小时换一次，下一次退潮约 ' +
            fmtClock(DATA.nextLowTide()) + '）',
          regionNote: ''
        });
      }
      var why = all.length ? all[0].why : '意向表里没有可用的地图';
      return ret({ spot: null, wanted: [id], target: id, reason: '没有能去的地图：' + why });
    }

    /* 效率 = 单趟概率 ÷ 一趟成本，第一名就是「只去这张」 */
    usable.sort(function (a, b) { return b.score - a.score; });
    var busy = roamBusy(save);
    var pick = usable[0], swap = '';
    if (busy[pick.ch]) {
      var free = usable.filter(function (c) { return !busy[c.ch]; });
      if (free.length) {
        swap = '首选 ' + spotName(usable[0]) + ' 此刻被游走神兽占着，这一轮改去 ' + spotName(free[0]) +
          '（效率排第 ' + (usable.indexOf(free[0]) + 1) + '）';
        pick = free[0];
      } else {
        var left = Math.round((roamUntil(save, pick.ch) - Date.now()) / 60000);
        return ret({
          spot: null, wanted: [id], target: id, wait: true, waitMs: 20000,
          phase: '等游走神兽离开（' + spotName(pick) + '）',
          reason: '「' + label(id) + '」只去 ' + spotName(pick) + '，这章现在被游走神兽占着' +
            (left > 0 ? '（约 ' + left + ' 分钟后离开）' : '') + '：等它走了再进',
          regionNote: ''
        });
      }
    }
    var info = regionInfo(usable, pick, save);
    var note = pickNote(info, pick, save);
    if (swap) note = note ? (note + '；' + swap) : swap;
    return ret({
      spot: pick.spot, wanted: [id], target: id, reason: '', picked: pick,
      /* 第五十七批：进一次章要把本章所有目标道具点都走完再切走，
       * 所以把「这一章能掉的目标道具」整组交给节点扫描，而不只是当前这一种。 */
      wantedAll: chapterWanted(save, cfg, ctx, pick.ch, id),
      eff: pick.eff, effText: effText(pick.eff), effShort: effShort(pick.eff),
      ways: usable.length, regionNote: note
    });
  }

  /* 第五十七批：同一章里好几块区域都可能有道具格，各自掉不同的目标道具。
   * 第 57 章「毁坏的世界」就是最典型的：
   *   step 0 天冠山       → 金刚宝珠 / 白玉宝珠
   *   step 1 积雪的天冠山 → 白金宝珠
   *   step 5 送行之泉     → 普通池（没目标道具）
   * 老逻辑 wanted 永远只有当前那一种，走到第一格结算完就切走重进，后面几格
   * 白扔。这里把「还差的、且本章有掉落点的」目标全列出来，引擎逐格收齐。 */
  function chapterWanted(save, cfg, ctx, ch, fallback) {
    var ids = pending(save, cfg), out = [];
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var r = DATA && DATA.rare(id);
      if (!r) continue;
      var gate = gateOf(id, ctx);
      if (gate && !gate.open) continue;              // 条件没开放的不算本章目标
      for (var j = 0; j < r.maps.length; j++) {
        if (Number(r.maps[j].ch) === Number(ch)) { out.push(id); break; }
      }
    }
    if (out.indexOf(fallback) < 0) out.unshift(fallback);
    return out;
  }

  function fmtClock(t) {
    var d = new Date(Number(t) || Date.now());
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    return p2(d.getHours()) + ':' + p2(d.getMinutes());
  }

  function rank(cfg, save, ctx) {
    var out = [];
    var ids = pending(save, cfg);
    for (var k = 0; k < ids.length; k++) {
      var rows = candidatesOf(ids[k], ctx);
      rows.sort(function (a, b) { return b.score - a.score; });   // 第一名 = 只去这张
      for (var i = 0; i < rows.length; i++) {
        var c = rows[i], s = c.spot;
        out.push({
          key: s ? s.key : (c.ch + ':' + c.step),
          ch: c.ch, step: c.step, item: c.id, itemZh: c.name,
          label: s ? (s.chapterZh + ' · ' + s.zh) : ('第 ' + (c.ch + 1) + ' 章'),
          region: s ? s.rg : '', regionZh: s ? DATA.regionLabel(s.rg) : '',
          p: c.p, at: s ? s.at : 0, score: c.score,
          /* 第四十批：把期望一起带出去（单趟概率 / 期望轮数 / 期望分钟） */
          run: c.eff.run, runs: c.eff.runs, mins: c.eff.mins, nodes: c.eff.nodes,
          best: i === 0,
          tide: c.tide, wait: c.wait,
          locked: !c.ok, reason: c.why,
          unlocked: c.ch <= ctx.unlocked
        });
      }
    }
    return out.sort(function (a, b) { return b.score - a.score; });
  }

  function validate(cfg, save, data) {
    if (!data) return { ok: false, text: '道具数据表没加载，刷新一次游戏页' };
    if (!(cfg.targets || []).length) return { ok: false, text: '先勾至少要刷的稀有道具' };
    var ctx = mkCtx(save);
    var p = plan(cfg, save, ctx);
    if (p.done) return { ok: false, text: p.done };
    /* 第五十批：队首那项受天气限制、已经挪到队尾去刷后面的了 —— 这不算失败，照常开跑 */
    if (p.reorder && p.reorder.length) return { ok: true, text: p.deferNote || p.phase || '' };
    if (p.wait) return { ok: true, text: p.phase || '在等条件满足' };
    if (!p.spot) return { ok: false, text: p.reason || '没有可用地图' };
    return { ok: true };
  }

  function done(cfg, save, tally, stats) {
    if (!pending(save, cfg).length) {
      return '意向稀有道具都到手了（含原本就有的），功能自动关闭';
    }
    return '';
  }

  /* ---------------- 整张稀有道具表的逐项状态（第三十一批） ----------------
   * 原来只有「勾过的」才有状态，于是面板上没勾的那几项一直是可点的，
   * 玩家点上去（＝加进意向表）之后下一份状态才把它算出来，看起来就像
   * 「点了才变灰」。这里把整张表一次算完，面板一开就按它上灰。
   * 注意：还没读到存档时 ctx.unlocked 是 0，会把所有道具误判成「未解锁地图」，
   * 所以 hasSave 为假时不下 locked 结论（留 unknown，面板别变灰）。 */
  function extraAll(save) {
    var cat = (DATA && DATA.rares) || [];
    var ctx = mkCtx(save);
    var hasSave = !!(save && save.adv);
    var out = [];
    for (var i = 0; i < cat.length; i++) {
      var r = cat[i], id = (r && r.id) || '';
      if (!id) continue;
      var kind = ownKind(save, id);
      var cands = candidatesOf(id, ctx);
      var usable = cands.filter(function (c) { return c.ok; });
      var tideOnly = !usable.length && cands.length > 0 &&
        cands.every(function (c) { return c.wait === 'tide'; });
      var noMap = !usable.length && !tideOnly && cands.length > 0;
      var gate = gateOf(id, ctx);
      /* 第五十七批：白金宝珠按「地图解锁 AND 拥有骑拉帝纳」双条件判定，
       * 而不是笼统地看有没有可用地图；锁定时把缺的那一条写进 lockMsg。 */
      var locked = hasSave && !kind && (gate ? (!gate.open || noMap) : noMap);
      var lockMsg = gate && !gate.open ? gate.msg :
        (noMap && cands[0] ? cands[0].why : '');
      out.push({
        id: id, name: (r.zh || r.fr || id), got: kind,
        desc: r.desc || '', need: (r && r.needN) || 1,
        have: Number((save && save.items && save.items[id]) || 0) || 0,
        locked: !kind && locked, tide: !!tideOnly, lockMsg: lockMsg,
        maps: cands.length, usable: usable.length, unknown: !hasSave,
        /* 第四十批：这个道具「只去」哪一张图，以及期望（单趟概率 / 轮数 / 分钟） */
        best: bestRow(id, ctx),
        why: kind ? '' : (gate && !gate.open ? gate.msg :
          (usable.length ? '' : (tideOnly ? '需退潮' : (cands[0] ? cands[0].why : '没有可用地图'))))
      });
    }
    return out;
  }

  /* ---------------- 面板要用的逐项状态（第二十六批） ----------------
   * got   : gift（存档记过） / bag（背包里还有） / ''（还没到手）
   * locked: 所有地图的章节都还没解锁
   * tide  : 唯一能掉这张图要退潮才开
   * best  : 第四十批加的「只去这张图」——效率第一名 + 算好的期望 */
  function extra(save, cfg) {
    var ctx = mkCtx(save);
    var picked = (cfg && cfg.targets) || [];
    var rows = [], gotCount = 0;
    for (var i = 0; i < picked.length; i++) {
      var id = picked[i];
      var r = DATA && DATA.rare(id);
      if (!r) continue;
      var kind = ownKind(save, id);
      if (kind) gotCount++;
      var cands = candidatesOf(id, ctx);
      var usable = cands.filter(function (c) { return c.ok; });
      var tideOnly = !usable.length && cands.length &&
        cands.every(function (c) { return c.wait === 'tide'; });
      var noMap = !usable.length && !tideOnly;
      var gate = gateOf(id, ctx);
      var locked = gate ? (!kind && (!gate.open || noMap)) : (!kind && noMap);
      var lockMsg = gate && !gate.open ? gate.msg :
        (noMap && cands[0] ? cands[0].why : '');
      var b = bestRow(id, ctx);
      rows.push({
        id: id, name: r.zh, got: kind, locked: !kind && locked, tide: !!tideOnly,
        desc: r.desc || '', need: (r && r.needN) || 1,
        have: Number((save && save.items && save.items[id]) || 0) || 0,
        lockMsg: lockMsg,
        maps: cands.length, usable: usable.length,
        best: b,
        why: kind ? '' : (gate && !gate.open ? gate.msg :
          (usable.length ? '' : (tideOnly ? '需退潮' : (cands[0] ? cands[0].why : '没有可用地图')))),
        p: b ? b.p : 0
      });
    }
    /* 第五十批：当前目标是队列里第一个「现在能刷」的 ——
     * 受天气/时段限制的那几项已经排到队尾去了，显示上也要跟着走，
     * 免得面板写着「正在找美丽鳞片」实际却在刷深海鳞片。 */
    var q = queueOf(save, cfg, ctx);
    var cur = '';
    for (var qi = 0; qi < q.rows.length; qi++) {
      if (!q.rows[qi].blocked) { cur = q.rows[qi].id; break; }
    }
    if (!cur && q.rows.length) cur = q.rows[0].id;
    /* 当前目标是不是卡在「等退潮」上（剩下的全都要退潮） */
    var tideWaiting = false;
    if (cur) {
      var cc = candidatesOf(cur, ctx);
      tideWaiting = !!cc.length && cc.every(function (c) { return c.wait === 'tide'; });
    }
    var tideNow = !!(DATA && DATA.lowTide && DATA.lowTide());
    return {
      list: rows,
      all: extraAll(save),
      /* 第五十批：队列（有序）+ 每一项是否受天气限制，面板画序号 / 写原因用 */
      order: q.ids,
      queue: q.rows,
      current: cur,
      currentName: cur ? label(cur) : '',
      gotCount: gotCount,
      totalCount: rows.length,
      pendingCount: rows.length - gotCount,
      tideNow: tideNow,
      tideWaiting: tideWaiting,
      nextLowTide: (DATA && DATA.nextLowTide) ? DATA.nextLowTide() : 0,
      nextLowTideText: (DATA && DATA.nextLowTide) ? fmtClock(DATA.nextLowTide()) : '',
      unlocked: ctx.unlocked
    };
  }

  var SPEC = {
    kind: 'item',
    title: '稀有道具刷取',
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
    extraAll: extraAll,
    currentTarget: currentTarget,
    queue: queueOf,
    targetLabel: targetLabel,
    gainWanted: function (id, cfg, wanted) { return (wanted || []).indexOf(id) >= 0; }
  };

  root.PCG_ITEMS = ENGINE ? ENGINE.create(SPEC) : null;
  root.PCG_ITEM_SPEC = SPEC;
  if (typeof module !== 'undefined' && module.exports) module.exports = SPEC;
})(typeof window !== 'undefined' ? window : this);
