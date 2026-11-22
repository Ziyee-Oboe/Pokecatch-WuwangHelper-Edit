/* Poke'Catch 天气预测（第一百一十四批）
 *
 * 按游戏 CONFIG.WEATHER 的确定性算法离线复算，不读 DOM、不问小桥、不改游戏状态。
 * 依据：玩家提供的「天气预报器」+ 线上 bundle app.0e84ded8d8.js 的 WEATHER 实现，
 * 两边逐位核对过：
 *   · SLOT_MS = 3600000、CHANCE = .54、哈希 H() = FNV-1a + avalanche；
 *   · 每小时一个槽；key = 'ch'+章号；从当前槽往前数连续 H(key+'|'+s) < .54 的个数，
 *     偶数 = 无天气，奇数 = 有天气（这就是游戏的「天气时段」分段）；
 *   · 有天气时按章节聚合权重用 H(slot+'|'+key) 轮盘赌抽类型；
 *   · 夜晚剔除 daylight 天气（CONFIG.WEATHER.TYPES 里只有 sun 标了 daylight）；
 *   · 固定天气章节按 slot % 数组长度 轮换（愤怒之湖 / 危机）。
 *
 * 章节权重表 = 游戏 WEATHER.se(ch)：把该章所有 kind==='route' 且非 indoor 的步骤，
 * 按 CLIMATES[bg] + REGION_OFF + REGION_WEIGHTS 聚合。84/84 章（含合众）与游戏复算口径一致。
 *
 * 与游戏的两点差异（由小桥的游戏真值优先兜住，预报只在桥没数据时用）：
 *   ① 游戏在节点级还有 climateOf + TRANSLATE 校正（同一章洞窟/野外可能不同），
 *      预报按章节算，和玩家那份预报器口径一致；
 *   ② 游戏还有 Roaming 游走神兽带来的天气、以及玩家强制天气，预报不猜这些。
 *
 * 这个模块同时被注入 MAIN / ISOLATED 两个 world，各自挂一份 root.PCG_WX。
 */
(function (root) {
  'use strict';

  var SLOT_MS = 3600000;
  var CHANCE = 0.54;
  /* CONFIG.WEATHER.TYPES 里只有 sun.daylight = true */
  var DAYLIGHT = { sun: 1 };

  var ZH = { rain:'雨', storm:'雷暴', sun:'大晴天', sand:'沙暴', snow:'下雪',
    ash:'火山灰', fog:'起雾', blizzard:'暴风雪', breeze:'微风' };
  var ICON = { rain:'🌧️', storm:'⛈️', sun:'🔆', sand:'🌪️', snow:'❄️',
    ash:'🌋', fog:'🌫️', blizzard:'🌨️', breeze:'🍃' };

  /* 84 章：[[ [天气key, 权重], … ] 或 null, 固定天气 或 null]（v1.19 含合众 66-83） */
  var CH = [
    [[["rain",7],["storm",1.5]],null],   // 00 灰色徽章
    [[["rain",7],["snow",1],["storm",2]],null],   // 01 蓝色徽章
    [[["rain",9],["storm",2.5]],null],   // 02 橙色徽章
    [[["rain",8],["snow",2],["storm",2]],null],   // 03 彩虹徽章
    [[["rain",8],["storm",2]],null],   // 04 粉红徽章
    [[["rain",7],["storm",1.5]],null],   // 05 金色徽章
    [[["rain",6],["storm",2]],null],   // 06 深红徽章
    [[["rain",10],["storm",2.5]],null],   // 07 绿色徽章
    [[["rain",2],["snow",1],["storm",0.5]],null],   // 08 冠军之路
    [null,null],   // 09 四天王：科拿
    [null,null],   // 10 四天王：希巴
    [null,null],   // 11 四天王：菊子
    [null,null],   // 12 四天王：阿渡
    [null,null],   // 13 联盟冠军
    [[["rain",4],["storm",1]],null],   // 14 飞翼徽章
    [[["rain",6],["storm",1.5]],null],   // 15 昆虫徽章
    [[["rain",7],["storm",1.5]],null],   // 16 平原徽章
    [[["rain",7],["storm",1.5]],null],   // 17 雾徽章
    [[["rain",7],["storm",2]],null],   // 18 冲击徽章
    [[["rain",2],["storm",0.5]],null],   // 19 钢铁徽章
    [[["rain",7],["snow",1],["storm",2]],"storm"],   // 20 愤怒之湖
    [[["rain",2],["storm",0.5]],null],   // 21 冰河徽章
    [[["rain",2]],null],   // 22 广播塔
    [[["rain",7],["snow",2],["storm",2]],null],   // 23 升龙徽章
    [[["rain",4],["snow",2],["storm",1]],null],   // 24 冠军之路
    [null,null],   // 25 四天王：一树
    [null,null],   // 26 四天王：阿桔
    [null,null],   // 27 四天王：希巴
    [null,null],   // 28 四天王：梨花
    [null,null],   // 29 联盟冠军
    [[["rain",4],["storm",1.5],["snow",4]],null],   // 30 白银山
    [[["rain",8],["sun",8],["storm",2]],null],   // 31 原石徽章
    [[["rain",5],["sun",3],["storm",1.5]],null],   // 32 拳头徽章
    [[["rain",6],["sun",6],["storm",2]],null],   // 33 发电徽章
    [[["rain",4],["sun",7],["storm",1.5],["ash",4]],null],   // 34 热量徽章
    [[["sun",3],["rain",5],["storm",1.5]],null],   // 35 烟囱山
    [[["sand",6],["sun",7],["rain",1],["storm",0.5]],null],   // 36 平衡徽章
    [[["rain",15],["sun",5],["storm",4.5]],null],   // 37 羽毛徽章
    [[["rain",8],["sun",5],["storm",2],["fog",3],["snow",1]],null],   // 38 送神山
    [[["rain",6],["sun",5],["storm",1.5]],null],   // 39 心灵徽章
    [[["rain",3],["sun",1],["storm",1]],["storm","sun"]],   // 40 危机
    [[["rain",12],["sun",4],["storm",4]],null],   // 41 雨滴徽章
    [[["sun",3],["rain",1],["storm",0.5]],null],   // 42 冠军之路
    [null,null],   // 43 四天王：花月
    [null,null],   // 44 四天王：芙蓉
    [null,null],   // 45 四天王：波妮
    [null,null],   // 46 四天王：源治
    [null,null],   // 47 联盟冠军
    [[["rain",9],["sun",3.5],["storm",2.5]],null],   // 48 煤炭徽章
    [[["rain",16],["sun",4.75],["storm",5]],null],   // 49 森林徽章
    [[["rain",8],["sun",2.5],["snow",4],["storm",1.5]],null],   // 50 遗迹徽章
    [[["rain",12],["sun",3],["storm",1.5],["fog",1]],null],   // 51 铺石徽章
    [[["rain",20],["sun",5.5],["storm",3],["fog",2]],null],   // 52 湿地徽章
    [[["fog",6],["rain",6],["sun",1],["snow",2],["storm",1.5]],null],   // 53 矿山徽章
    [[["sun",2.5],["rain",7],["storm",2.5]],null],   // 54 三座湖
    [[["snow",16],["blizzard",17]],null],   // 55 冰河徽章
    [[["rain",2],["sun",0.5]],null],   // 56 银河队基地
    [[["snow",8],["blizzard",1],["fog",1],["rain",3],["sun",0.5],["storm",1]],null],   // 57 毁坏的世界
    [[["sun",5],["rain",6],["storm",2.5]],null],   // 58 灯塔徽章
    [[["rain",3],["sun",0.5],["storm",1]],null],   // 59 冠军之路
    [null,null],   // 60 四天王：阿柳
    [null,null],   // 61 四天王：菊野
    [null,null],   // 62 四天王：大叶
    [null,null],   // 63 四天王：悟松
    [null,null],   // 64 联盟冠军
    [[["rain",5],["sun",2.5],["snow",2],["storm",1.5],["ash",3],["sand",4]],null],   // 65 严酷山
    [[["rain",5],["sun",5],["fog",4],["storm",1.0]],null],   // 66 三重徽章
    [[["rain",2],["sun",2],["storm",0.5]],null],   // 67 基础徽章
    [[["rain",5],["storm",1.5],["sun",1]],null],   // 68 飞翔徽章
    [[["sand",9],["sun",2]],null],   // 69 遗迹城堡
    [[["rain",2],["sun",2],["storm",0.5]],null],   // 70 雷电徽章
    [[["rain",2],["storm",1]],null],   // 71 地震徽章
    [[["rain",2],["sun",2],["storm",0.5]],null],   // 72 喷射徽章
    [[["snow",3],["rain",2],["blizzard",0.3]],null],   // 73 石笋徽章
    [[["rain",12],["snow",3],["fog",2],["blizzard",0.3]],null],   // 74 龙螺旋之塔
    [[["rain",2],["sun",2],["storm",0.5]],null],   // 75 神话徽章
    [[["rain",2],["sun",2],["storm",0.5]],null],   // 76 胜利之路
    [null,null],   // 77 四天王：阿洛
    [null,null],   // 78 四天王：梨佳
    [null,null],   // 79 四天王：越橘
    [null,null],   // 80 四天王：卡蒙
    [null,null],   // 81 N的城堡
    [null,null],   // 82 魁奇思
    [[["rain",19],["sun",19],["storm",5.0],["fog",4]],null]   // 83 巨人洞窟
  ];
  var N = CH.length;

  /* 游戏的 H()：FNV-1a 32 位 + avalanche，返回 [0,1)。必须与游戏逐位一致。 */
  function fnv(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    h ^= h >>> 16; h = Math.imul(h, 2246822507);
    h ^= h >>> 13; h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  function slotOf(ms) { return Math.floor(ms / SLOT_MS); }
  /* 游戏 DAYTIME.indexAt：本地时间 20:00–08:00 为夜晚（index 2） */
  function isNight(slot) {
    var h = new Date(slot * SLOT_MS).getHours();
    return (h >= 20 || h < 8);
  }

  /* 桥可以把服务器时钟 / 游戏自己的昼夜判定喂进来，校正本机时钟偏差 */
  var clockOff = 0, nightCur = null;
  function setClock(serverMs) {
    var v = Number(serverMs);
    if (isFinite(v) && v > 0) clockOff = v - Date.now();
  }
  function setNight(v) { nightCur = (v === true || v === false) ? v : null; }
  function now() { return Date.now() + clockOff; }
  function nightOf(slot, curSlot) {
    if (slot === curSlot && nightCur !== null) return nightCur;
    return isNight(slot);
  }

  /* 某一章某一小时的天气 key；null / '' = 无特殊天气（晴）。
   * curSlot 是当前槽：只有算「现在」这一槽才用桥给的 nightCur，未来槽一律按本地时间推。 */
  function at(ch, slot, curSlot) {
    var e = CH[ch];
    if (!e) return null;
    if (e[1]) {
      var f = e[1], arr = Array.isArray(f) ? f : [f];
      if (!arr.length) return null;
      return arr[((slot % arr.length) + arr.length) % arr.length] || null;
    }
    var w = e[0];
    if (!w || !w.length) return null;
    var key = 'ch' + ch;
    var fe = 0;
    while (fe < 64 && fnv(key + '|' + (slot - fe)) < CHANCE) fe++;
    if (fe % 2 === 0) return null;
    var night = nightOf(slot, curSlot === undefined ? slot : curSlot);
    var items = [], tot = 0;
    for (var i = 0; i < w.length; i++) {
      if (night && DAYLIGHT[w[i][0]]) continue;
      items.push(w[i]); tot += w[i][1];
    }
    if (!items.length || !(tot > 0)) return null;
    var st = fnv(slot + '|' + key) * tot;
    for (var j = 0; j < items.length; j++) {
      st -= items[j][1];
      if (st <= 0) return items[j][0];
    }
    return items[items.length - 1][0];
  }

  /* 当前这一刻某章的天气视图（对齐 keep-dup.js 桥回执里的字段） */
  function view(ch, ms) {
    var t = (ms == null) ? now() : ms;
    var s = slotOf(t);
    var k = at(ch, s, s);
    return {
      key: k || '', wxs: k ? [k] : [],
      slot: s, at: t, endsAt: (s + 1) * SLOT_MS,
      night: nightOf(s, s), src: 'forecast'
    };
  }

  /* 未来 n 小时逐槽天气（对齐 WEATHER.hours） */
  function hours(ch, n, ms) {
    var t = (ms == null) ? now() : ms, s0 = slotOf(t), out = [];
    var len = n || 24;
    for (var k = 0; k < len; k++) {
      var s = s0 + k;
      out.push({ slot: s, at: s * SLOT_MS, key: at(ch, s, s0) || null,
        night: nightOf(s, s0) });
    }
    return out;
  }

  /* 未来 n 次天气变化（对齐 WEATHER.changes）；key='' 表示转晴 */
  function changes(ch, n, ms, lookahead) {
    var t = (ms == null) ? now() : ms, s0 = slotOf(t);
    var lim = lookahead || 72, want = n || 3, out = [];
    var prev = at(ch, s0, s0);
    for (var k = 1; k <= lim && out.length < want; k++) {
      var s = s0 + k, key = at(ch, s, s0);
      if (key !== prev) {
        out.push({ key: key || '', at: s * SLOT_MS, slot: s });
        prev = key;
      }
    }
    return out;
  }

  /* 指纹：槽号 + 昼夜 + 关心章节的当前天气。跨整点必变，用来立刻重算清单。 */
  function signature(chs, ms) {
    var t = (ms == null) ? now() : ms, s = slotOf(t), parts = [];
    if (chs && chs.length) {
      for (var i = 0; i < chs.length; i++) parts.push(chs[i] + ':' + (at(chs[i], s, s) || '-'));
    }
    return 'W' + s + (nightOf(s, s) ? 'N' : 'D') + '|' + parts.join(',');
  }

  function slot(ms) { return slotOf((ms == null) ? now() : ms); }
  function endsAt(ms) { return (slotOf((ms == null) ? now() : ms) + 1) * SLOT_MS; }
  function zh(k) { return ZH[k] || (k || '晴'); }
  function icon(k) { return ICON[k] || '☀️'; }

  root.PCG_WX = {
    SLOT_MS: SLOT_MS, CHANCE: CHANCE, DAYLIGHT: DAYLIGHT,
    CH: CH, N: N, ZH: ZH, ICON: ICON,
    fnv: fnv, slotOf: slotOf, isNight: isNight,
    setClock: setClock, setNight: setNight, now: now,
    at: at, view: view, hours: hours, changes: changes,
    signature: signature, slot: slot, endsAt: endsAt,
    zh: zh, icon: icon
  };
})(typeof window !== 'undefined' ? window : this);
