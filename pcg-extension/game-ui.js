/* Poke'Catch 防掉线助手 —— 游戏原生图标 / 配色（第七批）
 *
 * 插件 UI 不再自造 emoji 或自定颜色：小图标直接取自线上游戏 assets/，
 * 颜色取自游戏 app.css 的 :root / 组件变量，天气图标与中文名取自
 * t.CONFIG.WEATHER.TYPES + lang-zh-Hans 中文语言包。
 *
 * 图标文件已下载到 icons/game/，随扩展一起打包；content script 注入到
 * 游戏页面时用 chrome.runtime.getURL() 拿绝对地址（manifest 里已开
 * web_accessible_resources），popup 里直接用相对地址即可。
 */
(function (root) {
  'use strict';

  var ASSETS = {
    ball: 'icons/game/poke-ball.png',
    egg: 'icons/game/mystery-egg.png',
    berry: 'icons/game/razz-berry.png',
    honey: 'icons/game/honey.png',
    oran: 'icons/game/berry-oran.png',
    sparkle: 'icons/game/sparkle.svg',
    /* v1.41：详情页「收藏」按钮用的像素金星，做成与 .dc-buddy 同款原生按钮 */
    favStar: 'icons/game/fav-star.svg',
    lock: 'icons/game/padlock.svg',
    grass: 'icons/game/tallgrass-icon.png',
    map: 'icons/game/town-map.png',
    charm: 'icons/game/shiny-charm.png',
    /* 第一百一十一批：路闪监测专属「闪光精灵球」标题图标 */
    shinyBall: 'icons/game/shiny-ball.svg',
    /* 第九十九批：两个分类图标换成本项目里照着游戏画的 SVG */
    weather: 'icons/game/weather-rain.svg',
    evolve: 'icons/game/evolve-arrows.svg',
    /* v1.40：晶洞序列预测图标，全部取自游戏 assets/ui/underground/
     * 与 assets/items/。geodeIcon(tier) / gemIcon(type) 按档位/属性取用。 */
    'geode-common': 'icons/game/geode-common.png',
    'geode-uncommon': 'icons/game/geode-uncommon.png',
    'geode-rare': 'icons/game/geode-rare.png',
    'geode-legendary': 'icons/game/geode-legendary.png',
    /* v1.48：本系威力排名的稀有度列，用游戏原版精灵球图标（TIERS[].ball） */
    'poke-ball': 'icons/game/poke-ball.png',
    'great-ball': 'icons/game/great-ball.png',
    'ultra-ball': 'icons/game/ultra-ball.png',
    'master-ball': 'icons/game/master-ball.png'
    /* gem-{type} 由 gemIcon() 动态拼 key，见下方 */
  };
  /* 游戏 CONFIG.TIERS：稀有度档位 → 原版球图标 / 颜色 / 官方中文名
   * 0 常见(poke-ball) 1 少见(great-ball) 2 稀有(ultra-ball)
   * 3 传说(ultra-ball/金) 4 独一无二(master-ball) */
  var RARITY = [
    { ball: 'poke-ball',  color: '#9aa4b1', zh: '常见' },
    { ball: 'great-ball', color: '#3b82f6', zh: '少见' },
    { ball: 'ultra-ball', color: '#a855f7', zh: '稀有' },
    { ball: 'ultra-ball', color: '#f5c518', zh: '传说' },
    { ball: 'master-ball',color: '#ff5fa2', zh: '独一无二' }
  ];
  function rarityInfo(tier) {
    var i = Number(tier);
    if (!(i >= 0 && i <= 4)) i = 0;
    return RARITY[i];
  }
  function rarityBall(tier) { return icon(rarityInfo(tier).ball); }
  var GEODE_KEYS = ['geode-common', 'geode-uncommon', 'geode-rare', 'geode-legendary'];
  var GEM_TYPES = ['normal','fire','water','grass','electric','ice','fighting','poison',
    'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];

  /* app.css :root + 组件变量（游戏自身的配色） */
  var COLORS = {
    bg: '#12141c', panel: '#1c2030', line: '#333a52', text: '#eef1f8',
    muted: '#9aa3bb', faint: '#687189',
    red: '#e3353b', redDark: '#a8202a', yellow: '#ffcb05',
    blue: '#3b6fe0', blueVivid: '#2b8cff',
    green: '#4cc96a', greenDark: '#2f9e4f',
    gold: '#ffd84a', goldSoft: '#ffe066', goldText: '#9a6b00'
  };

  /* t.CONFIG.WEATHER.TYPES 的 icon + 官方中文语言包名 */
  var WEATHER = {
    rain: { zh: '下雨', icon: '🌧️', color: COLORS.blueVivid },
    storm: { zh: '雷暴', icon: '⛈️', color: '#8a7ad0' },
    sun: { zh: '大晴天', icon: '🔆', color: COLORS.yellow },
    snow: { zh: '下雪', icon: '❄️', color: '#8ecae6' },
    sand: { zh: '沙暴', icon: '🌪️', color: '#c9a227' },
    ash: { zh: '火山灰', icon: '🌋', color: '#a1887f' },
    fog: { zh: '起雾', icon: '🌫️', color: '#90a4ae' },
    blizzard: { zh: '暴风雪', icon: '🌨️', color: '#7fb3d5' },
    breeze: { zh: '微风', icon: '🍃', color: COLORS.green },
    clear: { zh: '晴朗', icon: '☀️', color: COLORS.yellow },
    'tide-low': { zh: '退潮', icon: '🌊', color: COLORS.blueVivid },
    'tide-high': { zh: '涨潮', icon: '🌊', color: COLORS.blueVivid }
  };

  /* t.DAYTIME.PHASES */
  var TIME = {
    night: { zh: '夜晚', icon: '🌙', color: '#8a7ad0' },
    morning: { zh: '早晨', icon: '🌅', color: '#e8a020' },
    day: { zh: '白天', icon: '☀️', color: COLORS.yellow },
    dusk: { zh: '黄昏', icon: '🌇', color: '#e07a39' }
  };

  /* 未捕捉清单的状态分类：图标 + 颜色全部来自游戏 */
  var STATUS = {
    'ready': { zh: '可直接捕捉', asset: 'ball', color: COLORS.green, cat: 'ready' },
    'ready-cond': { zh: '条件已生效 · 优先', asset: 'sparkle', color: COLORS.gold, cat: 'ready' },
    'weather': { zh: '等待天气', asset: 'weather', color: COLORS.blueVivid, cat: 'waiting' },
    'time': { zh: '等待时段', asset: 'weather', color: COLORS.blueVivid, cat: 'waiting' },
    'evo': { zh: '需要进化', asset: 'evolve', color: COLORS.blue, cat: 'evo' },
    'locked': { zh: '地图未开放', asset: 'lock', color: COLORS.faint, cat: 'locked' },
    'hatch': { zh: '需要孵蛋获取', asset: 'egg', color: COLORS.gold, cat: 'hatch' },
    'special': { zh: '特殊获取', asset: 'charm', color: COLORS.muted, cat: 'special' }
  };

  /* 分类标签的顺序、名字与图标（不含传说 / 幻兽排除） */
  var CATS = [
    { key: 'ready', zh: '可直接捕捉', asset: 'ball', color: COLORS.green },
    { key: 'waiting', zh: '等天气 / 时段', asset: 'weather', color: COLORS.blueVivid },
    { key: 'evo', zh: '需进化', asset: 'evolve', color: COLORS.blue },
    { key: 'hatch', zh: '需孵蛋获取', asset: 'egg', color: COLORS.gold },
    { key: 'locked', zh: '地图未开放', asset: 'lock', color: COLORS.faint },
    { key: 'special', zh: '特殊获取', asset: 'charm', color: COLORS.muted }
  ];

  function icon(name) {
    var rel = ASSETS[name] || ASSETS.sparkle;
    try {
      if (root.chrome && root.chrome.runtime &&
          typeof root.chrome.runtime.getURL === 'function') {
        return root.chrome.runtime.getURL(rel);
      }
    } catch (e) { /* ignore */ }
    return rel;
  }
  /* v1.40：晶洞档位图标（0普通/1较少见/2稀有/3传说）与属性宝石图标 */
  function geodeIcon(tier) {
    var i = Number(tier); if (!(i >= 0 && i <= 3)) i = 3;
    return icon(GEODE_KEYS[i]);
  }
  function gemIcon(type) {
    var t = String(type || '').toLowerCase();
    var key = 'gem-' + t;
    // 未登记的属性仍尝试按文件名取（图标文件都下载好了），未知就回退 sparkle
    if (GEM_TYPES.indexOf(t) < 0 && !ASSETS[key]) return icon('sparkle');
    if (!ASSETS[key]) ASSETS[key] = 'icons/game/' + key + '.png';
    return icon(key);
  }
  function color(key) { return COLORS[key] || COLORS.muted; }
  function weather(key) { return WEATHER[key] || null; }
  function time(key) { return TIME[key] || null; }
  function status(key) { return STATUS[key] || STATUS.special; }
  function catOf(statusKey) {
    var s = STATUS[statusKey];
    return s ? s.cat : 'special';
  }
  /* 从游戏「下雨 / 大晴天 / Pluie ...」文字反查天气键 */
  var WEATHER_TEXT = {};
  Object.keys(WEATHER).forEach(function (k) {
    WEATHER_TEXT[WEATHER[k].zh] = k;
  });
  WEATHER_TEXT.Pluie = 'rain'; WEATHER_TEXT.Orage = 'storm';
  WEATHER_TEXT['Soleil ardent'] = 'sun'; WEATHER_TEXT['Tempête de sable'] = 'sand';
  WEATHER_TEXT.Neige = 'snow'; WEATHER_TEXT.Cendres = 'ash';
  WEATHER_TEXT.Brouillard = 'fog'; WEATHER_TEXT.Blizzard = 'blizzard';
  WEATHER_TEXT['Vent léger'] = 'breeze'; WEATHER_TEXT['Ciel dégagé'] = 'clear';
  function weatherKeyFromText(s) {
    var t = String(s || '').trim();
    if (WEATHER[t]) return t;
    if (WEATHER_TEXT[t]) return WEATHER_TEXT[t];
    for (var k in WEATHER_TEXT) {
      if (t.indexOf(k) >= 0) return WEATHER_TEXT[k];
    }
    return '';
  }

  root.PCG_GAME_UI = {
    ASSETS: ASSETS, COLORS: COLORS, WEATHER: WEATHER, TIME: TIME,
    STATUS: STATUS, CATS: CATS,
    icon: icon, color: color, weather: weather, time: time,
    status: status, catOf: catOf, weatherKeyFromText: weatherKeyFromText,
    geodeIcon: geodeIcon, gemIcon: gemIcon,
    RARITY: RARITY, rarityInfo: rarityInfo, rarityBall: rarityBall
  };
})(typeof window !== 'undefined' ? window : this);
