/* Poke'Catch 防掉线助手 —— 共享配置（唯一数据源）
 *
 * 基于 v1.9.68 基线重构：content_scripts（隔离世界）和 popup.html 都以普通 <script> 加载，
 * 两边通过 window.PCG_CONFIG 读取，不再各自维护一份 DEFAULT_SETTINGS。
 * Service Worker 不加载本文件：它不写默认值，只读自己需要的那一个字段。
 *
 * 改默认设置、消息类型、存档键、关键选择器时，只改这里。
 */
(function (root) {
  'use strict';

  var VERSION = '1.49';

  /* 与 v1.9.68 的 content.js 逐项对齐：ugCheckSec 600 / ugSecV 3 是上游的迁移结论，
   * 以及 1.9.68 新增的刷钱 / 起点层数 / 收藏 / 战斗属性提示。
   * 第一百零八批：autoModal（「沉浸通关模式」）按玩家要求改回**默认关**，
   * cfgV 升到 4 做一次性迁移，把老存档里第 100 批强制打开的值统一关掉一次。
   * 第一百一十八批：吃树果相关自动化全部默认关，cfgV 升到 5 再做一次迁移，
   * 把老存档里被强制打开的果实 / 顺手喂果开关统一关一次。
   * 第一百一十九批：按玩家要求删掉「自动喂食总开关」(autoFeed)，喂不喂只由
   * feedItems 里每格开关决定；版本号规则：新增 UI 页面 1.X，修 bug 1.X.Y。 */
  var DEFAULTS = {
    keepAlive: true,        // 静音保活
    antiIdle: true,         // 反挂机活跃
    autoReconnect: true,    // 断线自动重连
    autoReload: true,       // 长时间断线自动刷新
    autoRetryBoot: true,    // 加载失败自动重试
    autoContinue: true,     // 标题页自动点「继续」
    autoModal: false,       // 第一百零八批「沉浸通关模式」：默认关（玩家要求），要自己去面板打开
    keepSystemAwake: false, // 阻止系统休眠
    keepVisible: true,      // 最小化保持在线
    /* 第一百一十九批：已删除「自动喂食总开关」(autoFeed)，没有任何总闸；
       喂不喂完全由 feedItems 里每格开关决定，默认全部不勾。 */
    autoUnderground: false, // 地下通道默认关，点「一键派遣」才启动
    ugCheckSec: 600,        // 探险检查间隔（秒，1.9.60 起默认 10 分钟）
    ugSecV: 3,              // <3 = 旧默认值还没迁到 600
    ugDoneDay: '',          // 今天次数用完（巴黎日期）
    ugArmed: false,         // 点过「一键派遣」，刷新后自动恢复
    ugSkipParty: true,      // 不派当前出战队伍
    ugAutoClose: true,      // 战利品弹窗自动关掉
    ugFrom: 0,              // 起点层数：0/1 跟随游戏，2+ 由插件改
    legendaryId: '',        // 选中的游走神兽
    legArmed: false,        // 点过「立即前往」才算在追
    autoRaid: false,        // 异色团体战自动连战
    dmgOn: true,            // 伤害统计面板
    battleInfo: true,       // 战斗属性提示
    autoFarm: false,        // 刷钱：打完一轮自动重开同一章（1.9.68）
    /* 第五十九批：联盟刷钱三档 —— 「打到第几位就切走重开」。
     * uncleared（默认）：打完 4 天王切走，永远不打冠军 —— 联盟没通关时训练家是
     *                    1.8 倍赏金，靠的就是「别把冠军打掉」；
     * top3            ：打完第 3 位切走；
     * cleared         ：连冠军一起打完再重开。 */
    farmMode: 'uncleared',  // uncleared / top3 / cleared
    favOn: true,            // 收藏功能
    /* 第一百零六批：收藏置顶开关恢复，默认开（第 105 批撤销过一次，玩家要求加回来）。
     * 只在「自定义」排序下生效，其它排序 / 筛选一律回归游戏自己处理：
     *   · 仓库：publishPcOrder() 把 pin / favs 发布到 pcgPcOrderV1，
     *     pc-sort-bridge.js 据此把收藏整组提到 G.S.pcOrder 最前；
     *   · 培育屋 / 配队弹窗：favLiftAll() 只在下拉是 custom 时才做 DOM 置顶。
     * 关掉时两条路都不走，收藏完全不影响任何排序。 */
    favPinOn: true,
    /* 第八批：闪光守卫与图鉴「未捕捉」筛选收进「页面自动化」，
     * 各只剩一条开关，默认都打开；content.applySettings() 会把状态推给两个模块。 */
    shinyGuardOn: true,
    dexFilterOn: true,
    /* 第八十四批：图鉴详情卡「进化」那一排点同家族其它形态 → 关掉现在这张卡、
     * 直接打开点的那一只。默认开（纯玩家手势，不参与任何自动化）。
     * 第八十六批：同一个开关也管「仓库 / 队伍里点开的那张卡」的「家族」那一排。 */
    dexJumpOn: true,
    /* 第八十七批：点「开始捕捉」时顺手把「蔓莓果 + 谜芝果」两种果子加入自动
     * 喂食候选（游戏里效果 1 小时到期、到期插件会自动补一个）。
     * 第一百一十八批按玩家要求改成**默认关**：不勾就一步都不动喂食设置；
     * 勾了也只有在「自动喂食」总闸打开时才会真的喂。 */
    dexAutoFeed: false,
    /* 第一百一十八批：传说追踪「立即前往」时的顺手喂果，独立开关、默认关，
     * 且同样受「自动喂食」总闸约束。 */
    legAutoFeed: false,
    /* 第二十五批：原来四张卡片各有一条「刷新游戏页后接着刷 / 接着扫 / 接着跑」，
     * 现在合并成页面自动化里这一条总开关，默认开。关掉后刷新页面不自动恢复任何任务。 */
    resumeOn: true,
    /* 第二十五批：六张互斥卡片的游戏页内悬浮看板总闸；
     * 功能启动才出现，停止就自动收起（看板本身还能折叠 / 拖动）。
     * 第三十四批：地下通道补上看板（ugHud），所有看板统一成同一张卡。
     * 第五十五批：曾改成默认关。
     * 第六十三批：**改回默认开** —— 图鉴捕捉 / 传说追踪 / 联盟刷钱 三张卡跟着
     * 「自动化任务」一起默认勾选（地下通道 ugHud 不在这六张任务卡里，维持默认关）。
     * hudV 是一次性迁移标记：<3 的老存档第一次升级时统一打开一次。 */
    dexHud: true,
    legHud: true,
    farmHud: true,
    ugHud: false,
    /* 第五十八批：定点循环（promo 版整块搬过来的 orb.js）。
     * 默认模式是「定点」，但 pointCh 还没选，所以点开始会提示先选章节 / 点位；
     * 想用上游那几套预设（宝珠 / 白金宝珠 / 洛托姆 / 树果 / 玛娜菲蛋）就在面板里换。
     * orbOn = 「刷新页面后自动继续」，orbArmed = 这一轮真的在跑。 */
    orbOn: false,
    orbArmed: false,
    orbMode: 'point',       // orb / griseous / rotom / berry / egg / point
    orbGriseous: false,     // 顺带刷白金宝珠
    orbHud: true,           // 定点循环的悬浮看板（第六十三批起跟其它任务卡一样默认勾选）
    rotomForm: 0,           // 刷洛托姆：形态下标 0-4
    pointRegion: 'kanto',
    pointCh: -1,            // 定点：章节下标（-1 = 没选）
    pointCh2: -1,           // 尘土双章：第二章节下标
    dustDual: false,        // 尘土双章：在两章之间轮换，刷尘土野怪
    /* 第六十五批：pointStep 是「时间线第几个点」的下标（0 起，= 游戏右上角 x / 总数 的 x - 1），
     * 不再是章节数据的步骤下标 —— 下载版引擎按节点下标定位，步骤下标会整整点偏一段。
     * 联盟章仍写 101-105（打到第几位，105 = 冠军）。 */
    pointStep: -1,
    hudV: 3,                // <3 = 老存档里任务卡看板开关还停在「默认关」
    cfgV: 5                 // <5 = 老存档里吃树果开关还被强制开着，升级后把果实 / 两个顺手喂果开关一起关一次（v119 已删总闸）
  };

  // 消息类型集中在这里，避免三个上下文里手写字符串拼错
  var MSG = {
    GET_STATE: 'pcg-get-state',
    SETTINGS: 'pcg-settings',
    RECONNECT: 'pcg-reconnect-now',
    UG_NOW: 'pcg-ug-now',
    UG_STOP: 'pcg-ug-stop',
    LEG_NOW: 'pcg-leg-now',
    LEG_STOP: 'pcg-leg-stop',
    RAID_NOW: 'pcg-raid-now',
    RAID_STOP: 'pcg-raid-stop',
    FARM_NOW: 'pcg-farm-now',
    FARM_STOP: 'pcg-farm-stop',
    FAV_CLEAR: 'pcg-fav-clear',
    /* 第五十八批「定点循环」：orb.js 是独立 content script，用自己的三个消息名 */
    ORB_STATE: 'pcg-orb-state',
    ORB_NOW: 'pcg-orb-now',
    ORB_STOP: 'pcg-orb-stop',
    ORB_CLEAR: 'pcg-orb-clear',
    /* 第十二批：一键「保留重复」（全部宝可梦家族） */
    KEEPDUP: 'pcg-keepdup',
    KEEPDUP_STATUS: 'pcg-keepdup-status',
    /* 刷新游戏页统一走后台 pcg-page-reload；
     * 旧版「连接诊断 / 一键刷新」脚手架（pcg-diagnose、pcg-reload-clear、pcg-reload-flag）
     * 经定位并非根因，已在 v1.16.8 删除，相关常量一并移除。 */
    PAGE_RELOAD: 'pcg-page-reload',
    DEX_SCAN: 'pcg-dex-scan',       // 只扫描，不开始捕捉（第二批）
    DEX_START: 'pcg-dex-start',
    DEX_STOP: 'pcg-dex-stop',
    DEX_CONFIG: 'pcg-dex-config',
    /* 第六批：游戏图鉴页「未捕捉」筛选项（与筛选状态同步） */
    DEX_FILTER: 'pcg-dex-filter',
    /* 第八十四批：图鉴详情卡「同家族跳转」开关 */
    DEX_JUMP: 'pcg-dex-jump',
    /* 第三批「培育屋监测」：配置 / 立即重读 / 清零观测统计 */
    NURSERY_CONFIG: 'pcg-nursery-config',
    NURSERY_REFRESH: 'pcg-nursery-refresh',
    NURSERY_CLEAR: 'pcg-nursery-clear',
    /* 第四批「黑市扫货」：意向表增删改、配置、开始 / 停止 / 立即扫描 / 清零观测 */
    MARKET_SCAN: 'pcg-market-scan',
    MARKET_START: 'pcg-market-start',
    MARKET_STOP: 'pcg-market-stop',
    MARKET_CONFIG: 'pcg-market-config',
    MARKET_RULES: 'pcg-market-rules',
    MARKET_CLEAR: 'pcg-market-clear',
    /* 第五批：闪光战斗守卫 / 道具重复刷取 / 树果刷取 */
    SHINY_CONFIG: 'pcg-shiny-config',
    SHINY_CLEAR: 'pcg-shiny-clear',
    ITEM_SCAN: 'pcg-item-scan',
    ITEM_START: 'pcg-item-start',
    ITEM_STOP: 'pcg-item-stop',
    ITEM_CONFIG: 'pcg-item-config',
    ITEM_CLEAR: 'pcg-item-clear',
    BERRY_SCAN: 'pcg-berry-scan',
    BERRY_START: 'pcg-berry-start',
    BERRY_STOP: 'pcg-berry-stop',
    BERRY_CONFIG: 'pcg-berry-config',
    BERRY_CLEAR: 'pcg-berry-clear',
    CLEAR_LOG: 'pcg-clear-log',
    STATUS: 'pcg-status',
    SYNC: 'pcg-sync'
  };

  var SAVE_KEY = 'gachamon-save-v1';

  var GAME_PATTERNS = [
    'https://pokecatch-online.netlify.app/*',
    'https://pokecatch-online.pages.dev/*'
  ];

  var GAME_URL_RE = /^https:\/\/pokecatch-online\.(netlify\.app|pages\.dev)\//;

  /* 关键选择器适配层。
   * 游戏频繁发版，DOM 一改自动化就碎。这里把最要紧的选择器收拢成一张表：
   * 新增功能请优先用 PCG_CONFIG.sel('key')，改版时只改这张表即可。
   * 存量代码里的硬编码选择器保持原样，后续按模块逐步迁移。 */
  var SELECTORS = {
    app: '#app',
    nav: '#tabs, #side',
    screenActive: '.screen.active',
    modal: '#modal-root .modal, .modal',
    bagPanel: '#bag-panel',
    buffStack: '#buff-stack',
    ugRoot: '#ug-root',
    ugBay: '.ug-bay',
    evtPick: '#evt-pick',
    raidScreen: '#screen-raid',
    raidCard: '.rc-card[data-rc]',
    mapRow: '.mp-row[data-ch]',
    enemySlot: '#enemy-slot',
    teamRail: '#team-rail',
    arenaFx: '#arena-fx',
    battleLog: '#battle-log',
    bootFail: '#boot-fail',
    zonePanel: '#zone-panel',
    dexCard: '.dexcard-modal',
    /* 第二批「图鉴捕捉」用到的地图 / 图鉴格子选择器。
     * 游戏发版改了 DOM，优先改这里而不是散落在 dex-hunter.js 里。 */
    dexMapScreen: '#screen-map',
    dexMapTab: '#tabs [data-screen="map"]',
    dexAdvTab: '#tabs [data-screen="adventure"]',
    dexRegionCard: '.rg.open[data-rg]',
    dexRegionAny: '.rg[data-rg]:not(.depart):not([data-depart])',
    dexMapRow: '.mp-row[data-ch]',
    dexMapDetail: '.pg-info',
    dexDetailClose: '.pg-det-x',
    dexGrid: '.mp-grid',
    dexCell: '[data-dex]',
    dexZoneCond: '.zone-cond',
    dexMapGo: '.mp-go[data-go]',
    dexSpeedBtns: '#speed-btns',
    /* 第六批「未捕捉」筛选：游戏图鉴页的筛选条 / 异色按钮 / 格子列表。
     * 线上 R() 会给 .dex-cell[data-id] 设 hidden，插件只在它之后叠加一层 class，
     * 不碰游戏自己的筛选状态，所以搜索 / 状态 / 属性 / 地区 / 异色都能叠加生效。 */
    dexFilters: '.dex-filters',
    dexShinyBtn: '#dex-shiny',
    dexStatusBtn: '#dex-status-btn',
    dexStatusPop: '#dex-status-pop',
    dexRegionList: '#dex-regions',
    dexCellById: '.dex-cell[data-id]',
    /* 第八十四批「图鉴同家族跳转」：详情卡本身 / 卡头 / 右上角 ✕ / 小节 / 进化小节里的格子 /
     * 图鉴页标签。游戏发版改结构只改这七行。
     * 第八十六批：多了「拥有卡」的卡身 .mon-card 与它的「家族」小节 .fam-sec。 */
    dexCardModal: '.modal.dexcard-modal, .dexcard-modal',
    dexCardBox: '.dexcard',
    dexCardHead: '.dc-head',
    dexCardClose: '.dc-x',
    dexCardSec: '.dc-sec',
    dexEvoTile: '.evo',
    dexMonCard: '.mon-card',
    dexFamSec: '.fam-sec',
    dexTab: '#tabs [data-screen="pokedex"]',
    dexCondNow: '.zone-cond.now',
    dexWeatherNow: '[data-weather], .weather-now, .wx-now, #weather-now',
    /* 第三批「培育屋监测」用到的培育屋屏幕 / 蛋卡 / 亲代槽选择器。
     * 数据主要来自存档，DOM 只用来校准时钟和读进度条，游戏改版优先改这里。 */
    penScreen: '#screen-pension',
    penEggs: '#pen-eggs',
    penEggCard: '.pen-egg[data-egg]',
    penEggReady: '.pen-egg.ready[data-egg]:not([disabled])',
    penEggCount: '#pen-egg-n',
    penParents: '#pen-res',
    penParentCard: '.pen-res[data-uid]',
    penParentCount: '#pen-res-n',
    penGauge: '.pen-gauge i',
    penModal: '#modal-root .modal, .modal',
    /* 第四批「黑市扫货」：黑市屏幕、商品卡、过滤器、两道确认弹窗。
     * 商品数据优先读页面 localStorage 的 pokecatch-market-<uid> 缓存（只读），
     * 点击一律落到真实渲染出来的 .mk-item[data-l] 上。 */
    mkScreen: '#screen-market',
    mkRoot: '#market-root',
    mkTab: '#tabs [data-screen="market"]',
    mkSideTab: '#side [data-screen="market"]',
    mkItem: '.mk-item[data-l]',
    mkListTab: '.mk-tabs [data-tab="list"]',
    mkSearch: '#mk-q',
    mkShinyChip: '#mk-sh',
    mkMoney: '.mk-money',
    mkModal: '#modal-root.open .modal.mk-dlg',
    mkModalAny: '#modal-root.open .modal',
    mkBuyBtn: '.modal-actions button.btn.primary',
    mkModalBtns: '.modal-actions button.btn',
    mkModalClose: '.dc-x',
    mkModalPrice: '.mk-price',
    mkScreenActive: '.screen.active',
    /* 第五批「道具 / 树果刷取」：时间线节点、进度计数、敌人槽、奖励飘字。
     * 主数据来自存档 adv.nodes / adv.node / adv.battle，DOM 只是兜底与校准。 */
    fmTimeline: '#timeline',
    fmNode: '#timeline .tl-node',
    fmCurrent: '#timeline .tl-node.current',
    fmCount: '#tl-count',
    fmEnemy: '#enemy-slot .enemy',
    fmToasts: '#toasts',
    fmReward: '#arena .berry-reward',
    fmSpeed: '#speed-btns',
    fmScreenActive: '.screen.active',
    /* 第五批「闪光战斗守卫」：场上敌人与战斗日志 / 提示条 */
    shEnemy: '#enemy-slot .enemy',
    shEnemyImg: '#enemy-slot .enemy img',
    shShinyIco: '#enemy-slot .enemy .shiny-ico',
    shBattleLog: '#battle-log',
    shToasts: '#toasts',
    shModal: '#modal-root.open .modal',
    shScreenTab: '[data-screen]'
  };

  function sel(key) {
    return SELECTORS[key] || '';
  }

  /* ===== 第八十九批：手机浏览器（Kiwi / Edge Canary 等安卓 Chromium 内核）适配 =====
   *
   * 一、存储区兼容层 STORE
   *   桌面 Chrome 一定有 chrome.storage.sync；安卓上各家移植内核实现不一，
   *   有的只给了 local 区。插件里有四十多处直接调 sync，一旦 sync 是 undefined
   *   就会在 content script 里抛 TypeError —— 整块逻辑哑掉，而玩家只会看到「没反应」。
   *   这里统一成一个「有 sync 用 sync、没有退回 local」的区，其它文件开头取
   *   window.PCG_STORE，不再直接碰 chrome.storage.sync。
   *   退回 local 时数据不再跨设备同步，但同一台手机上读写正常，onChanged 照样能收到
   *   （chrome.storage.onChanged 不分 area，两个区都报）。
   *
   * 二、设备判定 MOBILE
   *   UA 里有 Android / iPhone / iPad … 或者指针是「粗的」（触摸屏）就算手机/平板。
   *   平板外接鼠标时 pointer 是 fine、UA 还是 Android，所以两个条件取「或」。
   */
  function pickArea() {
    var s = null;
    try { s = chrome.storage && chrome.storage.sync; } catch (e) { s = null; }
    if (s && typeof s.get === 'function') return s;
    var l = null;
    try { l = chrome.storage && chrome.storage.local; } catch (e2) { l = null; }
    return (l && typeof l.get === 'function') ? l : null;
  }

  /* 什么区都没有（理论上不会发生）时给个空壳，保证调用不炸 */
  function nullArea() {
    return {
      get: function (d, cb) {
        if (typeof cb === 'function') { try { cb(typeof d === 'object' && d ? d : {}); } catch (e) {} }
      },
      set: function (o, cb) { if (typeof cb === 'function') { try { cb(); } catch (e) {} } },
      remove: function (k, cb) { if (typeof cb === 'function') { try { cb(); } catch (e) {} } },
      clear: function (cb) { if (typeof cb === 'function') { try { cb(); } catch (e) {} } }
    };
  }

  var AREA = pickArea();
  var STORE = AREA || nullArea();

  var MOBILE = (function () {
    var ua = '';
    try { ua = String((typeof navigator !== 'undefined' && navigator.userAgent) || ''); } catch (e) { ua = ''; }
    var byUa = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua);
    var byTouch = false;
    try {
      byTouch = !!(root.matchMedia && root.matchMedia('(pointer: coarse)').matches);
    } catch (e2) { byTouch = false; }
    return {
      ua: ua,
      byUa: byUa,
      byTouch: byTouch,
      /* 有没有拿到真正的 sync 区（false = 已经退回 local） */
      syncArea: !!(AREA && (function () {
        try { return chrome.storage.sync === AREA; } catch (e3) { return false; }
      })()),
      isMobile: function () { return byUa || byTouch; }
    };
  })();

  var API = {
    VERSION: VERSION,
    DEFAULTS: DEFAULTS,
    MSG: MSG,
    SAVE_KEY: SAVE_KEY,
    GAME_PATTERNS: GAME_PATTERNS,
    GAME_URL_RE: GAME_URL_RE,
    SELECTORS: SELECTORS,
    STORE: STORE,
    MOBILE: MOBILE,
    sel: sel
  };

  root.PCG_CONFIG = API;
  /* 内容脚本 / 弹窗 / 定点循环都从这里拿存储区，别再直接写 chrome.storage.sync */
  root.PCG_STORE = STORE;
  root.PCG_MOBILE = MOBILE;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
