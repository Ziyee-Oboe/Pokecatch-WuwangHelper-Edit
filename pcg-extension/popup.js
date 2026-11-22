/* Poke'Catch 防掉线助手 —— popup 逻辑 */
'use strict';

// 默认设置、消息类型、域名规则统一来自 defaults.js（popup.html 先加载它）
var CFG = window.PCG_CONFIG || null;
var DEFAULT_SETTINGS = Object.assign({}, (CFG && CFG.DEFAULTS) || {});
var MSG = (CFG && CFG.MSG) || {};

var settings = Object.assign({}, DEFAULT_SETTINGS, { feedItems: {} });

/* 第八十九批：手机浏览器（Kiwi / Edge Canary）上 chrome.storage.sync 可能不存在，
 * 统一走 defaults.js 给的兼容层；下面的调用点一律用 SYNC。 */
var SYNC = window.PCG_STORE || (chrome.storage && chrome.storage.sync) ||
  (chrome.storage && chrome.storage.local) ||
  { get: function (d, cb) { if (cb) cb({}); }, set: function (o, cb) { if (cb) cb(); },
    remove: function (k, cb) { if (cb) cb(); } };

var GAME_URL_RE = (CFG && CFG.GAME_URL_RE) ||
  /^https:\/\/pokecatch-online\.(netlify\.app|pages\.dev)\//;

var currentTabId = null;
var isGameTab = false;
var pageReady = false;
var pollTimer = null;
var refreshing = false;
var lastUserEdit = 0;

/* ===== 第八十九批：手机浏览器（Kiwi / Edge Canary）适配 =====
 *
 * 手机上有两个桌面没有的坑：
 *   ① 扩展弹窗又窄又会在切换标签页时自动关掉 —— 边玩游戏边调设置根本没法用，
 *      所以给一颗「全屏」键，把同一套界面放到标签页里打开（popup.html?tab=1）；
 *   ② 全屏面板自己也是个标签页，而「当前活动标签页」在那一刻就是它自己 ——
 *      直接问 active tab 只能拿到扩展页。所以要退回「最近用过的那个游戏标签页」。
 */
var TAB_MODE = (function () {
  try { return /(?:^|[?&])tab=1(?:&|$)/.test(String(location.search || '')); } catch (e) { return false; }
})();

/* 手机 / 触摸屏：UI 上有些文案和默认动作要跟着变 */
var IS_MOBILE = !!(window.PCG_MOBILE && window.PCG_MOBILE.isMobile());
/* 「最近用过的游戏标签页」缓存：全屏模式下每 1 秒轮询一次，不必每次都去扫全部标签页 */
var lastGameTabId = null;
/* 空态只画一次：1 秒轮询里反复重建同一块空白列表会让展开的面板跳动 */
var blankShown = { dex: '', nursery: '', market: '', item: '', berry: '' };
var emptyReason = '';

function $(sel) {
  return document.querySelector(sel);
}

function queryActiveTab() {
  return new Promise(function (resolve) {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        void chrome.runtime.lastError;
        var t = (tabs && tabs[0]) || null;
        /* 桌面弹窗：活动页就是玩家正在看的那个页面，直接用。
         * 全屏模式：活动页是扩展面板自己（或者别的页面），得去找游戏标签页。 */
        if (t && GAME_URL_RE.test(String(t.url || ''))) { resolve(t); return; }
        findGameTab().then(resolve, function () { resolve(t); });
      });
    } catch (e) {
      resolve(null);
    }
  });
}

/* 找「最近用过的游戏标签页」：手机上玩家通常只开一个游戏页，
 * 但全屏面板是它自己的标签页，所以按 lastAccessed 排一下取最新的那个。 */
function findGameTab() {
  return new Promise(function (resolve) {
    try {
      if (!chrome.tabs || !chrome.tabs.query) { resolve(null); return; }
      chrome.tabs.query({
        url: ['https://pokecatch-online.netlify.app/*', 'https://pokecatch-online.pages.dev/*']
      }, function (tabs) {
        void chrome.runtime.lastError;
        var list = (tabs || []).filter(function (t) {
          return t && typeof t.id === 'number' && GAME_URL_RE.test(String(t.url || ''));
        });
        if (!list.length) { lastGameTabId = null; resolve(null); return; }
        list.sort(function (a, b) {
          return (Number(b.lastAccessed) || 0) - (Number(a.lastAccessed) || 0);
        });
        lastGameTabId = list[0].id;
        resolve(list[0]);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

/* 「全屏」键：把同一个界面在标签页里打开（手机上强烈推荐） */
function openTabMode() {
  var url = '';
  try { url = chrome.runtime.getURL('popup.html?tab=1'); } catch (e) { url = 'popup.html?tab=1'; }
  try {
    chrome.tabs.create({ url: url }, function () {
      void chrome.runtime.lastError;
      /* 从弹窗点出去之后弹窗自己会关；面板已经在标签页里了，这边主动关一下更干脆 */
      try { window.close(); } catch (e2) { /* ignore */ }
    });
    return true;
  } catch (e3) {
    return false;
  }
}

function getSettings() {
  return new Promise(function (resolve) {
    try {
      // 读原始存储（不带默认值），否则 DEFAULT_SETTINGS 里的 ugSecV 会让迁移永远跳过
      SYNC.get(null, function (raw) {
        void chrome.runtime.lastError;
        var v = raw || {};
        /* 第一百二十批：存储是空的（移除插件重装）时绝不写迁移默认值 ——
         * 那会把「空配置」信号冲掉，内容脚本的自动恢复就永远不触发。 */
        var emptyStore = !Object.keys(v).length;
        var s = Object.assign({}, DEFAULT_SETTINGS, v);
        s.feedItems = Object.assign({}, s.feedItems || {});
        /* 第一百零八批：「沉浸通关模式」改回默认关。cfgV 4 只搬一次 ——
         * 老存档里第 100 批强制打开的 autoModal 统一关掉，之后玩家自己打开就不会再被改回去。 */
        if (!(Number(v.cfgV) >= 4)) {
          s.autoModal = false;
          s.cfgV = 4;
          if (!emptyStore) { try { SYNC.set({ autoModal: false, cfgV: 4 }); } catch (e4) { /* ignore */ } }
        }
        /* 第一百一十八批：吃树果相关自动化全部默认关。cfgV 5 只搬一次 ——
         * 老存档里被强制打开的 dexAutoFeed 和勾好的果实统一清掉，
         * 之后玩家自己打开开关就不会再被改回去。
         * 第一百一十九批：总闸 autoFeed 已删除，迁移里不再写这个键。 */
        if (!(Number(v.cfgV) >= 5)) {
          s.dexAutoFeed = false;
          s.legAutoFeed = false;
          s.feedItems = {};
          s.cfgV = 5;
          if (!emptyStore) {
            try {
              SYNC.set({
                dexAutoFeed: false, legAutoFeed: false,
                feedItems: {}, cfgV: 5
              });
            } catch (e5) { /* ignore */ }
          }
        }
        // 检查间隔的默认值搬过一次（60 / 300 → 600 秒 = 10 分钟），只搬一次
        if (!(Number(v.ugSecV) >= 3)) {
          var sec = Number(v.ugCheckSec);
          if (!sec || sec === 60 || sec === 300) {
            s.ugCheckSec = 600;
            if (!emptyStore) { try { SYNC.set({ ugCheckSec: 600, ugSecV: 3 }); } catch (e2) { /* ignore */ } }
          } else {
            if (!emptyStore) { try { SYNC.set({ ugSecV: 3 }); } catch (e3) { /* ignore */ } }
          }
          s.ugSecV = 3;
        }
        /* 第五十五批：六张任务卡的「游戏页内悬浮看板」曾改成默认关。
         * 第六十三批：改回默认开 —— 只搬一次：hudV < 3 的老存档统一打开
         * 图鉴捕捉 / 传说追踪 / 联盟刷钱 / 定点循环 这四张卡的看板
         * （地下通道 ugHud 不在「自动化任务」这六张卡里，维持原值）。
         * 之后玩家自己关掉就不会再被改回去。 */
        if (!(Number(v.hudV) >= 3)) {
          s.dexHud = true; s.legHud = true; s.farmHud = true; s.orbHud = true;
          s.hudV = 3;
          if (!emptyStore) {
            try {
              SYNC.set({
                dexHud: true, legHud: true, farmHud: true, orbHud: true, hudV: 3
              });
            } catch (e4) { /* ignore */ }
          }
        }
        resolve(s);
      });
    } catch (e) {
      resolve(Object.assign({}, DEFAULT_SETTINGS, { feedItems: {} }));
    }
  });
}

function sendToTab(msg) {
  return new Promise(function (resolve) {
    if (currentTabId === null) { resolve(null); return; }
    try {
      chrome.tabs.sendMessage(currentTabId, msg, function (resp) {
        if (chrome.runtime.lastError) { resolve(null); return; }
        resolve(resp || null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

function setPill(text, cls) {
  var pill = $('#pill');
  var t = String(text == null ? '' : text);
  var cn = 'pill' + (cls ? ' ' + cls : '');
  if (pill.textContent !== t) pill.textContent = t;
  if (pill.className !== cn) pill.className = cn;
}

/* 第五十二批：刷新游戏页只剩标题栏一颗图标。
 * 需要刷新（插件刚装 / 更新过、页面里还是旧脚本）时给它描一圈金色，
 * 免得「待刷新」这句话删掉之后玩家不知道说的是哪颗键。 */
function setReloadAsk(on) {
  var btn = $('#reload');
  if (!btn) return;
  var need = !!on;
  if (btn.classList) btn.classList.toggle('ask', need);
  var t = need ? '插件刚安装或更新过，点这里刷新游戏页' : '刷新游戏页';
  if (btn.title !== t) btn.title = t;
  if (btn.setAttribute) btn.setAttribute('aria-label', t);
}

function setHint(text) {
  var hint = $('#hint');
  var t = String(text == null ? '' : text);
  var hide = !t;
  var body = hide ? '' : t;
  if (hint.hidden !== hide) hint.hidden = hide;
  if (hint.textContent !== body) hint.textContent = body;
}

/* 连接状态：简单一条说明；真正的数据读取由各功能面板自己负责。 */
var lastStateForDiag = null;

function disconnectedText() { return '未连接游戏页'; }

function reloadGamePage() {
  if (currentTabId === null) return false;
  try { chrome.tabs.reload(currentTabId); } catch (e) { /* ignore */ }
  /* 弹窗里刷新完就没必要留着（关掉更干净）；全屏面板是个正常标签页，
   * 关掉反而把玩家正在调的设置一起关了 —— 那边不关。 */
  if (!TAB_MODE) { try { window.close(); } catch (e4) { /* ignore */ } }
  return true;
}

function fmtDuration(ms) {
  if (!ms || ms < 0) return '—';
  var s = Math.floor(ms / 1000);
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  if (h > 0) return h + ' 小时 ' + m + ' 分';
  if (m > 0) return m + ' 分 ' + sec + ' 秒';
  return sec + ' 秒';
}

function fmtTime(ts) {
  try {
    var d = new Date(ts);
    return d.toTimeString().slice(0, 8);
  } catch (e) {
    return '--:--:--';
  }
}

/* ---------------- 事件日志：分级 / 模块 / 去重 / 筛选 ---------------- */
var logLevel = 'all';
var lastEvents = [];
var logSig = '';

var MOD_NAME = {
  core: '核心', conn: '连接', feed: '喂食', ug: '地下', leg: '神兽',
  raid: '团体战', dmg: '伤害', ui: '界面', stab: '排名', farm: '联盟刷钱',
  fav: '收藏', battle: '战斗', probe: '兼容', runtime: '运行时', dex: '图鉴',
  nursery: '培育屋', market: '黑市', item: '稀有道具', berry: '树果', shiny: '闪光',
  hud: '看板'
};
var LEVEL_NAME = { debug: '调试', info: '提示', ok: '成功', warn: '警告', error: '错误' };

function eventSig(list) {
  return logLevel + '|' + list.map(function (e) {
    return (e.id || (e.t + '-' + e.m)) + ':' + (e.n || 1) + ':' + e.t;
  }).join(',');
}

function renderLog(events) {
  lastEvents = events || [];
  var ul = $('#log');
  if (!ul) return;

  var list = lastEvents.filter(function (e) {
    return logLevel === 'all' || (e.level || 'info') === logLevel;
  }).slice().reverse().slice(0, 60);

  var cnt = $('#log-count');
  if (cnt) cnt.textContent = lastEvents.length + ' 条' + (logLevel === 'all' ? '' : ' · 已筛选');

  // 面板每秒拉一次状态，内容没变就不重建 DOM，避免闪烁和滚动位置跳动
  var sig = eventSig(list);
  if (sig === logSig) return;
  logSig = sig;

  ul.textContent = '';
  if (!list.length) {
    var li = document.createElement('li');
    li.className = 'empty';
    li.textContent = lastEvents.length ? '这个级别下没有事件' : '还没有事件';
    ul.appendChild(li);
    return;
  }

  list.forEach(function (ev) {
    var level = LEVEL_NAME[ev.level] ? ev.level : 'info';
    var item = document.createElement('li');
    item.className = 'lv-' + level;

    var time = document.createElement('time');
    time.textContent = fmtTime(ev.t);

    var lv = document.createElement('span');
    lv.className = 'lv';
    lv.textContent = LEVEL_NAME[level];

    var msg = document.createElement('span');
    msg.className = 'msg';
    var mod = document.createElement('i');
    mod.className = 'mod';
    mod.textContent = MOD_NAME[ev.mod] || ev.mod || '核心';
    msg.appendChild(mod);
    msg.appendChild(document.createTextNode(String(ev.m == null ? '' : ev.m)));

    item.appendChild(time);
    item.appendChild(lv);
    item.appendChild(msg);

    if (Number(ev.n) > 1) {
      var n = document.createElement('span');
      n.className = 'n';
      n.textContent = 'x' + ev.n;
      item.appendChild(n);
    }
    ul.appendChild(item);
  });
}

/* 第二十批：功能卡片统一规范
 * 1) 标题行最右边 = 运行状态徽标（.brief）：绿=运行中 / 金=等待中 / 灰=未启动 / 红=未连接
 * 2) 展开后第一行 = 功能描述（.pane-hint），第二行 = 运行状态（.run），再往下才是各种选项
 * 所有写入都先比对再落笔：一秒一次的轮询不能改动 DOM，否则整块 UI 会跟着读秒闪。 */
var RUN_TEXT = { on: '运行中', wait: '等待中', off: '未启动', err: '未连接', idle: '手动执行' };

/* 第二十二批：「保留重复」读到状态后把「开启 X/Y」记在这里，轮询每秒刷新时别把它冲掉 */
var kdSum = '';

function setBrief(sel, text, st) {
  var el = $(sel);
  var t = String(text == null ? '' : text);
  var s = st || 'off';
  if (el && el.textContent !== t) el.textContent = t;
  if (el && el.getAttribute('data-state') !== s) el.setAttribute('data-state', s);
}

/* 运行状态行：data-state 决定配色，.rst 是状态标签，.rt 是「正在做什么」 */
function runLine(id, st, label, detail) {
  var el = $(id);
  if (!el) return;
  var s = st || 'off';
  var lb = label || RUN_TEXT[s] || '未启动';
  var d = String(detail == null ? '' : detail);
  if (el.getAttribute('data-state') !== s) el.setAttribute('data-state', s);
  var chip = el.querySelector('.rst');
  if (chip && chip.textContent !== lb) chip.textContent = lb;
  var rt = el.querySelector('.rt');
  if (rt) {
    if (rt.textContent !== d) rt.textContent = d;
    var hide = !d;
    if (rt.hidden !== hide) rt.hidden = hide;
  }
}

/* 第三十二批：「自动化任务」这一栏就是这五张互斥卡片，一键关闭＝把它们一次全停。
 * 停止指令发出去互不干扰（互斥本来就只有一个在跑，其余的会直接回「没在跑」）。 */
var AUTO_STOP_LIST = [
  ['DEX_STOP', 'pcg-dex-stop'],
  ['LEG_STOP', 'pcg-leg-stop'],
  ['ITEM_STOP', 'pcg-item-stop'],
  ['BERRY_STOP', 'pcg-berry-stop'],
  ['FARM_STOP', 'pcg-farm-stop'],
  /* 第五十八批：定点循环也在这栏里，一键关闭照样要停 */
  ['ORB_STOP', 'pcg-orb-stop']
];
/* 定点循环的状态来自另一条消息（orb.js），单独记一下，供「一键关闭」判断 */
var AUTO_ORB_ON = false;
function autoAnyRunning(state) {
  var s = state || {};
  return !!(
    (s.dex && s.dex.running) ||
    (s.leg && s.leg.armed) ||
    (s.items && s.items.running) ||
    (s.berries && s.berries.running) ||
    (s.farm && s.farm.on) ||
    AUTO_ORB_ON
  );
}
/* 这一栏里有东西在跑就把按钮点亮（红色实心），没有就按下去变灰 */
var AUTO_LAST_STATE = null;
function syncAutoStopAll(state) {
  if (state) AUTO_LAST_STATE = state;
  var b = $('#auto-stop-all');
  if (!b || b.getAttribute('data-busy') === '1') return;
  var on = autoAnyRunning(AUTO_LAST_STATE);
  if (b.disabled !== !on) b.disabled = !on;
  var tip = on ? '把这五张卡片一次全关掉' : '这一栏现在没有在跑的功能';
  if (b.title !== tip) b.title = tip;
}

/* 第二十批：数「这一组里开了几项」，给「运行中 · N 项」用 */
function countKeys(keys) {
  var on = 0;
  keys.forEach(function (k) { if (settings[k]) on++; });
  return on;
}

/* 兼容性探针结果：状态栏一枚徽标 + 可展开的逐项明细 */
var probeSig = '';

function renderProbe(probe) {
  var pill = $('#compat-pill');
  var box = $('#compat-detail');
  if (!pill) return;

  if (!probe || !probe.checks || !probe.checks.length) {
    probeSig = '';
    pill.hidden = true;
    if (box) box.hidden = true;
    return;
  }
  pill.hidden = false;
  pill.setAttribute('data-level', probe.level || 'wait');
  pill.textContent = '兼容性 ' + probe.ok + '/' + (probe.ok + probe.failed);
  pill.title = probe.note || '';
  if (!box) return;

  var sig = JSON.stringify([probe.at, probe.level, probe.ok, probe.failed, probe.note,
    probe.build, probe.saveDiag && probe.saveDiag.brief,
    probe.checks.map(function (c) { return [c.key, c.state, c.detail]; })]);
  if (sig === probeSig) return;
  probeSig = sig;

  var frag = document.createDocumentFragment();
  var note = document.createElement('p');
  note.className = 'cnote';
  note.textContent = (probe.note || '') +
    (probe.build ? ' · 游戏构建 ' + String(probe.build).slice(0, 12) : '');
  frag.appendChild(note);

  probe.checks.forEach(function (c) {
    var row = document.createElement('div');
    row.className = 'ci ' + (c.state || 'na');
    var b = document.createElement('b');
    b.textContent = c.label;
    var i = document.createElement('i');
    i.textContent = c.state === 'ok' ? '正常' : (c.state === 'miss' ? '未通过' : '未检测到');
    // 存档那一项即使通过也要显示来源与规模，方便确认「到底读到哪份存档」
    if (c.detail && (c.state !== 'ok' || c.key === 'save')) i.textContent += ' · ' + c.detail;
    row.appendChild(b);
    row.appendChild(i);
    frag.appendChild(row);
  });

  /* 一键复制存档诊断：真实页面里读不到存档时，把这份结果贴给开发者就能定位 */
  if (probe.saveDiag) {
    var cp = document.createElement('button');
    cp.type = 'button';
    cp.className = 'tiny compat-copy';
    cp.textContent = '复制存档诊断';
    cp.addEventListener('click', function () {
      var d = probe.saveDiag || {};
      var text = [
        'Poke\'Catch 防掉线助手 ' + ((CFG && CFG.VERSION) || ''),
        '存档：' + (d.brief || '未知'),
        '来源：' + (d.src || '-') + ' / 键：' + (d.key || '-'),
        '字节：' + (d.bytes || 0) + ' · 宝可梦 ' + (d.mons || 0) +
          ' 只 · 图鉴 ' + (d.dex || 0),
        '页面内存快照：' + (d.mainAt ? new Date(d.mainAt).toLocaleString() : '无'),
        '主存档键：' + (d.primary || '-'),
        '本域键：' + (d.keys || []).join(', ')
      ].join('\n');
      var done = function () {
        var old = '复制存档诊断';
        cp.textContent = '已复制';
        setTimeout(function () { cp.textContent = old; }, 1500);
      };
      var fallback = function () {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        } catch (e) { /* ignore */ }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
    frag.appendChild(cp);
  }
  box.textContent = '';
  box.appendChild(frag);
}

/* ---------------- 地下通道 ---------------- */
// 手动派出后，把结果保留 8 秒，别被每秒一次的状态刷新立刻盖掉
var manualMsg = { at: 0, text: '' };
var manualRaid = { at: 0, text: '' };

function durText(sec) {
  if (!(sec > 0)) return '';
  var h = Math.floor(sec / 3600);
  var m = Math.floor((sec % 3600) / 60);
  var s = sec % 60;
  if (h > 0) return h + ' 小时 ' + m + ' 分 ' + s + ' 秒';
  if (m > 0) return m + ' 分 ' + s + ' 秒';
  return s + ' 秒';
}

function raidPityText(p) {
  if (!p) return '';
  if (p.ready) return '大师球就绪';
  if (p.n > 0) return '大师球 ' + p.n + '/' + (p.max || 200);
  return '';
}

function raidBossName(id) {
  var nm = (window.PCG_STAB && PCG_STAB.nm) ? PCG_STAB.nm[id] : '';
  return nm || ('No.' + id);
}

// 4 个地区的异色 + 自己的进度（1.9.55）：游戏每天只画抽到的那个地区，
// 这里把四个地区都列出来，知道的显示名字，不知道的写「？？？」。
function renderRaidBoard(raid) {
  var board = raid.board;
  var el = $('#raid-note');
  var box = $('#raid-list');
  var sum = $('#raid-sum');
  var stopBtn = $('#raid-stop');
  if (stopBtn) stopBtn.disabled = !raid.on;

  if (sum) {
    sum.textContent = '今天（' + board.day + '）已捕获 ' + board.caught + ' / ' + board.total +
      ' 个地区 · 累计捕获 ' + (board.cleared || 0) + ' 次';
  }
  if (el) {
    if (manualRaid.at && Date.now() - manualRaid.at < 8000) {
      el.textContent = manualRaid.text;
    } else {
      var drawnZh = '';
      board.regions.forEach(function (r) { if (r.key === board.drawn) drawnZh = r.region; });
      if (drawnZh) {
        el.textContent = '今天抽到：' + drawnZh + ' · 只有这个地区的异色能打，其余三个进不去';
      } else if (board.open >= board.total) {
        el.textContent = '四个地区今天都能打（抽签还没开启），想刷哪个刷哪个';
      } else if (board.open > 0) {
        el.textContent = '今天能打 ' + board.open + ' 个地区；抽到的是哪个还没读到，让它抽一次签就会记下来';
      } else {
        el.textContent = '今天哪个地区能打还没读到：打开一次团体战页，或让它抽一次签，就会记下来';
      }
    }
  }

  var sig = board.day + '|' + board.drawn + '|' + board.caught + '|' + (board.open || 0) + '|' + board.regions.map(function (r) {
    return r.key + ':' + r.boss + ':' + (r.done ? 1 : 0) + (r.running ? 2 : 0) + (r.catchable ? 4 : 0) +
      (r.locked ? 8 : 0) + ':' + r.tries + ':' + (r.pity ? r.pity.n + '/' + r.pity.max : 0);
  }).join('|');
  if (box.dataset.sig === sig) return;
  box.dataset.sig = sig;

  box.innerHTML = board.regions.map(function (r) {
    var cls = r.done ? 'done' : r.locked ? 'locked' : r.running ? 'run' : r.catchable ? 'free' : 'off';
    var bits = [];
    if (r.locked) bits.push(r.lockMsg ? ('未解锁 · ' + r.lockMsg) : '未解锁 · 先通关该地区联盟');
    else if (r.done) bits.push('今天已捕获');
    else if (r.running) bits.push('进行中');
    else if (r.catchable) bits.push('今天可抓');
    else if (board.open === 0 && !r.onPage) bits.push('还没读到这个地区');
    else bits.push('今天没抽到 · 进不去');
    if (r.tries > 0) bits.push('今日挑战 ' + r.tries + ' 次');
    var pity = raidPityText(r.pity);
    if (pity) bits.push(pity);
    return '<li class="' + cls + '"><b>' + r.region + '</b><em>' + (r.boss ? raidBossName(r.boss) : '？？？') +
      ' · ' + bits.join(' · ') + '</em></li>';
  }).join('');
}

function renderRaid(raid) {
  /* 第二十批：第二行运行状态 + 右上角徽标 */
  var raidOn = !!(raid && raid.on);
  runLine('#raid-phase', raidOn ? 'on' : 'off', null,
    raidOn ? (raid.why || '连战中，一轮打完自动接着打') : '点「开始连战」启动');
  setBrief('#brief-raid', raidOn ? '运行中' : '未启动', raidOn ? 'on' : 'off');
  if (raid && raid.board && raid.board.regions && raid.board.regions.length) {
    renderRaidBoard(raid);
    return;
  }
  var el = $('#raid-note');
  var box = $('#raid-list');
  var sum = $('#raid-sum');
  if (!el || !box) return;
  var raidStopBtn = $('#raid-stop');
  if (raidStopBtn) raidStopBtn.disabled = !(raid && raid.on);

  if (sum) {
    var left = raid && raid.reset;
    sum.textContent = left > 0
      ? ('新团体战：还有 ' + durText(left) + ' 后刷新')
      : '新团体战：—';
  }

  if (manualRaid.at && Date.now() - manualRaid.at < 8000) {
    el.textContent = manualRaid.text;
  } else if (!raid) {
    el.textContent = '—';
  } else if (raid.note) {
    el.textContent = raid.note + ' · ' + (raid.why || '');
  } else {
    el.textContent = raid.why || '—';
  }

  var cards = (raid && raid.cards) || [];
  if (!cards.length) {
    if (box.dataset.empty !== '1') {
      box.innerHTML = '<li class="empty">打开一次异色团体战页就能读到 4 个地区</li>';
      box.dataset.empty = '1';
      box.dataset.sig = '';
    }
    return;
  }
  box.dataset.empty = '0';

  var sig = cards.map(function (c) {
    var p = c.pity || {};
    return c.key + ':' + c.name + ':' + (c.done ? 1 : 0) + (c.locked ? 2 : 0) + (c.running ? 4 : 0) +
      ':' + (c.status || '') + ':' + (c.tries || 0) + ':' + (p.n || 0) + ':' + (p.ready ? 1 : 0);
  }).join('|');
  if (box.dataset.sig === sig) return;
  box.dataset.sig = sig;

  box.innerHTML = cards.map(function (c) {
    var cls = c.done ? 'done' : c.locked ? 'locked' : c.running ? 'run' : 'free';
    var nm = c.name && c.name !== '???' ? c.name : '？？？';
    var parts = [];

    if (c.locked) {
      parts.push(c.lockMsg ? ('未解锁 · ' + c.lockMsg) : '未解锁 · 先通关该地区联盟');
    } else {
      var statusHasN = /\d/.test(c.status || '');
      if (c.tries > 0 && !(c.running && statusHasN)) parts.push('第 ' + c.tries + ' 次');
      if (c.done) parts.push('已捕获');
      else if (c.running) parts.push(c.status ? c.status.replace(/^[^\u4e00-\u9fa5A-Za-z]+/, '') : '进行中');
      else parts.push(c.status || '今日团体战');
      var pity = raidPityText(c.pity);
      if (pity) parts.push(pity);
    }

    return '<li class="' + cls + '"><b>' + c.region + '</b><em>' + nm + ' · ' + parts.join(' · ') + '</em></li>';
  }).join('');
}

// 距离回来的时间：不到一分钟写「马上」，超过写「X 小时 Y 分」，后面挂具体钟点
function ugEtaText(end) {
  var ms = Number(end) || 0;
  if (!ms) return '';
  var left = ms - Date.now();
  var d = new Date(ms);
  var hh = d.getHours();
  var mi = d.getMinutes();
  var clock = (hh < 10 ? '0' : '') + hh + ':' + (mi < 10 ? '0' : '') + mi;
  if (left <= 0) return '已经该回来了（' + clock + '）';
  var mins = Math.round(left / 60000);
  if (mins < 1) return '马上回来（' + clock + '）';
  var txt;
  if (mins < 60) txt = mins + ' 分钟';
  else txt = Math.floor(mins / 60) + ' 小时 ' + (mins % 60) + ' 分';
  return '还剩 ' + txt + '（' + clock + ' 回来）';
}

function ugSlotText(s) {
  if (!s) return '—';
  var kind = s.kind;
  if (kind === 'running') {
    var base = s.floor ? ('探险中 · 第 ' + s.floor + ' 层') : '探险中';
    var eta = ugEtaText(s.end);
    return eta ? (base + ' · ' + eta) : base;
  }
  if (kind === 'done') return s.ko ? '跑完了 · 全员倒下，待领取' : '跑完了 · 待领取';
  if (kind === 'empty') {
    var full = s.full || 0;
    return full ? ('空闲 · 已选 ' + full + '/3') : '空闲 · 可派遣';
  }
  if (kind === 'ready') return '已选好 3 只 · 待按当前主题重选';
  if (kind === 'blocked') return '派不出去' + (s.why ? '（' + s.why + '）' : '');
  if (kind === 'locked') return '未解锁 · ' + (s.cost || '碎片');
  return '—';
}

function ugSlotClass(s) {
  if (!s) return '';
  if (s.kind === 'running') return 'run';
  if (s.kind === 'done') return 'done';
  if (s.kind === 'empty' || s.kind === 'ready') return 'free';
  if (s.kind === 'locked') return 'locked';
  return '';
}

// 颜色 → 半透明底色，主题徽标用
function ugTint(hex) {
  var h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
  if (h.length !== 6) return '';
  var r = parseInt(h.slice(0, 2), 16);
  var g = parseInt(h.slice(2, 4), 16);
  var b = parseInt(h.slice(4, 6), 16);
  return 'color:' + hex + ';border-color:' + hex + '66;background:rgba(' + r + ',' + g + ',' + b + ',.14)';
}

function ugEscText(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;';
  });
}

// 槽位上的「主题 + 属性」徽标：主题用游戏自己那套配色，属性用图鉴属性色
function ugThemeHtml(s) {
  var th = s && s.theme;
  if (!th) return '';
  var out = '';
  if (th.name) {
    out += '<i class="ug-th"' + (th.color ? ' style="' + ugTint(th.color) + '"' : '') + '>' +
      (th.icon ? th.icon + ' ' : '') + ugEscText(th.name) + '</i>';
  }
  var stab = window.PCG_STAB || {};
  (th.types || []).forEach(function (k) {
    var c = (stab.color && stab.color[k]) || '';
    var n = (stab.tzh && stab.tzh[k]) || k;
    out += '<i class="ug-ty"' + (c ? ' style="color:' + c + ';border-color:' + c + '55"' : '') + '>' +
      ugEscText(n) + '</i>';
  });
  return out ? '<span class="ug-meta">' + out + '</span>' : '';
}

/* 第三十五批：「今天还剩 N / M 次 · 最近一批 12 分钟后回来」不再单占一行，
 * 直接拼进下面那条运行状态栏的同一句里，状态栏一句读完（renderUg 取这个变量）。
 * 第五十五批：去掉「（每只每天一次）」这个括号说明。 */
var ugFeedTxt = '';
/* 第五十五批：状态栏「未启动」那句严格按「今天还剩 N / M 次 · 点「一键派遣」开始」写，
 * 不带「每只每天一次」，也不塞「最近一批 …」；后者仍留在运行中的那一句里。 */
var ugCountTxt = '';

function ugCountText(info) {
  if (!info || !(info.left >= 0)) return '';
  return '今天还剩 ' + info.left + ' / ' + info.perDay + ' 次';
}

function ugFeedText(info) {
  if (!info) return '';
  if (!(info.left >= 0)) {
    return info.source === 'save' ? '今天次数：打开一次地下通道页才读得到' : '';
  }
  /* 时钟（几点回来）槽位那几行已经写了，这里只留还剩多久，一句话放得下
     第二十四批：把「还剩 12 分钟」改成「12 分钟后回来」，跟前面那句连读不别扭 */
  var eta = String(ugEtaText(info.nextEnd) || '').replace(/（[^）]*）\s*$/, '').trim();
  var etaTxt = '';
  if (eta) {
    etaTxt = /^还剩\s*/.test(eta)
      ? ('最近一批 ' + eta.replace(/^还剩\s*/, '') + '后回来')
      : ('最近一批' + eta);
  }
  return ugCountText(info) + (etaTxt ? ' · ' + etaTxt : '');
}

function renderUgSlots(ug) {
  var box = $('#ug-slots');
  if (!box) return;

  var info = (ug && ug.slots) || null;
  var arr = (info && info.slots) || [];

  /* 第三十五批：这句不再自己占一行，算好交给 renderUg 拼进状态栏那句 */
  var feed = ugFeedText(info);
  if (ugFeedTxt !== feed) ugFeedTxt = feed;
  var cnt = ugCountText(info);
  if (ugCountTxt !== cnt) ugCountTxt = cnt;

  if (!arr.length) {
    if (box.dataset.empty !== '1') {
      box.innerHTML = '<li class="empty">打开一次地下通道页就能读到槽位</li>';
      box.dataset.empty = '1';
    }
    return;
  }
  box.dataset.empty = '0';

  var sig = arr.map(function (s) {
    return (s.bay < 0 ? 'x' : s.bay) + ':' + s.kind + ':' + (s.floor || 0) + ':' + (s.full || 0) + ':' + (s.cost || '') +
      ':' + (s.end ? Math.ceil((s.end - Date.now()) / 60000) : '') +
      ':' + (s.theme ? (s.theme.key || '') + '/' + (s.theme.name || '') : '');
  }).join('|');

  if (box.dataset.sig !== sig) {
    box.dataset.sig = sig;
    box.innerHTML = arr.map(function (s, i) {
      var n = s.bay >= 0 ? (s.bay + 1) : (i + 1);
      return '<li class="' + ugSlotClass(s) + '"><b>槽位 ' + n + '</b><em>' + ugSlotText(s) + '</em>' +
        ugThemeHtml(s) + '</li>';
    }).join('');
  }
}

// 起点层数：固定档位，不从游戏里读；没解锁就由游戏页那边按已解锁的最高层派
var UG_FROM_STEPS = [1, 25, 50, 75, 100];   // 游戏里能选的起点就这五档
function renderUgFrom(ug) {
  var sel = $('#ug-from');
  if (!sel) return;
  // 本地面板里的设置才是准的：游戏页那边要晚一步才收到新值，
  // 拿它的 want 会把你刚选的层数刷回「跟随游戏」
  var want = parseInt(settings.ugFrom, 10);
  if (!isFinite(want)) want = parseInt((ug && ug.from && ug.from.want), 10) || 0;
  if (want < 1) want = 0;

  var list = UG_FROM_STEPS.slice();
  if (want && list.indexOf(want) < 0) list.push(want);   // 老版本存下的其它层数也要能显示

  // 只有「选项清单」变了才重建 innerHTML：重建会把浏览器原生选中的项打回第一项，
  // 而这时候下拉还拿着焦点，下面那句 sel.value 又会被跳过——于是刚选的层数看不见
  var listSig = list.join(',');
  var rebuilt = false;
  if (sel.getAttribute('data-list') !== listSig) {
    var html = '<option value="0">跟随游戏</option>';
    list.forEach(function (n) {
      html += '<option value="' + n + '">第 ' + n + ' 层</option>';
    });
    sel.innerHTML = html;
    sel.setAttribute('data-list', listSig);
    rebuilt = true;
  }
  if (rebuilt || document.activeElement !== sel) sel.value = String(want);

  var em = $('#ug-from-em');
  if (!em) return;
  // 第二十二批：这句话每秒都会被算一遍，值没变就别写，免得整行跟着读秒闪
  var emText = want
    ? '派队前会把起点改到第 ' + want + ' 层；这层还没解锁就按已解锁的最高层派'
    : '用游戏里每个槽位自己选的起点';
  if (em.textContent !== emText) em.textContent = emText;
}

function renderUg(state) {
  var el = $('#ug-phase');
  if (!el) return;
  renderUgSlots(state && state.ug);
  renderUgFrom(state && state.ug);

  // 两个按钮的可用状态跟「手动提示」无关，先摆好
  var cur = state && state.ug;
  var btnNow = $('#ug-now');
  if (btnNow) {
    btnNow.disabled = !!(cur && cur.done);
    btnNow.classList.toggle('off', !!(cur && cur.done));
  }
  var btnStop = $('#ug-stop');
  if (btnStop) btnStop.disabled = !(cur && cur.on && !cur.done);

  if (manualMsg.at && Date.now() - manualMsg.at < 8000) {
    runLine('#ug-phase', 'wait', null, manualMsg.text);
    return;
  }
  if (!state || !state.ug) {
    runLine('#ug-phase', 'err', null, isGameTab ? '正在读取…' : '打开游戏页面后可用');
    setBrief('#brief-ug', isGameTab ? '读取中' : '未连接', isGameTab ? 'wait' : 'err');
    return;
  }
  var ug = state.ug;
  /* 第二十四批：状态栏只留「正在做什么」——原来尾巴上那截「（派出 N 次 · 领奖 N 次）」
     跟下面的槽位列表重复，已经删掉；「N 分钟后重试」还留在同一句里，今日次数在第二段（.rx） */
  /* 第三十二批：没在跑的时候，状态栏那句直接写「今天还剩 N / M 次…点「一键派遣」开始」，
     读不到次数才退回「还没开启，点「一键派遣」开始」。
     第三十五批：次数和「最近一批 …」已经并成一处（ugFeedTxt），点「一键派遣」跟在它后面。 */
  var startHint = ugCountTxt ? (ugCountTxt + ' · 点「一键派遣」开始') : '还没开启，点「一键派遣」开始';
  var ugWhy = String(ug.why || '');
  /* 内容脚本给的默认那句「还没开启…」换成带次数的说法；其它的原因（等刷新 / 缺槽位 …）照原样留着 */
  if (!ug.on && (!ugWhy || ugWhy === '还没开启，点「一键派遣」开始')) ugWhy = startHint;
  var head = (ug.state === 'switching' || ug.state === 'working')
    ? '正在操作地下通道…'
    : (ugWhy || (ug.on ? '待命' : startHint));

  if (ug.done) {
    runLine('#ug-phase', 'wait', null, '今天的探险次数用完了，等刷新（巴黎 0 点）后才能再开');
    setBrief('#brief-ug', '今天已用完', 'wait');
    return;
  }
  var line = head;
  if (ug.note && ug.note !== head) line += ' · ' + ug.note;
  if (ug.waitSec > 0 && ug.on) line += ' · ' + Math.max(1, Math.ceil(ug.waitSec / 60)) + ' 分钟后重试';
  /* 第三十五批：在跑（或另有原因 / 提示）时，把「今天还剩 … · 最近一批 …」续在同一句后面；
     startHint 里已经带着它的时候不重复。 */
  /* 第五十五批：没启动时那句就到「点「一键派遣」开始」为止，别再续「最近一批 …」 */
  if (ugFeedTxt && ug.on && line.indexOf(ugFeedTxt) < 0) line += ' · ' + ugFeedTxt;
  runLine('#ug-phase', ug.on ? 'on' : 'off', null, line);
  setBrief('#brief-ug', ug.on ? ('运行中 · 派出 ' + (ug.sends || 0) + ' 次') : '未启动',
    ug.on ? 'on' : 'off');
}

/* ---------------- 传说追踪 ---------------- */
var LEG_FALLBACK = [
  { id: 243, name: '雷公', types: ['electric'] },
  { id: 244, name: '炎帝', types: ['fire'] },
  { id: 245, name: '水君', types: ['water'] },
  { id: 380, name: '拉帝亚斯', types: ['dragon', 'psychic'] },
  { id: 381, name: '拉帝欧斯', types: ['dragon', 'psychic'] },
  { id: 481, name: '艾姆利多', types: ['psychic'] },
  { id: 641, name: '龙卷云', types: ['flying'] },
  { id: 642, name: '雷电云', types: ['electric', 'flying'] }
];

// 属性名牌：名字和颜色照游戏里的（游戏 TYPES 表 + 卡片上的 span.type）
var TYPE_ZH = {
  normal: '一般', fire: '火', water: '水', grass: '草', electric: '电', ice: '冰',
  fighting: '格斗', poison: '毒', ground: '地面', flying: '飞行', psychic: '超',
  bug: '虫', rock: '岩石', ghost: '幽灵', dragon: '龙', dark: '恶', steel: '钢', fairy: '妖'
};
var TYPE_COLOR = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', grass: '#7AC74C',
  electric: '#F7D02C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
  steel: '#B7B7CE', fairy: '#D685AD'
};

// 游戏里长这样：<span class="type" style="background:#EE8130">火</span>
function legTypeBadges(types) {
  var box = document.createElement('span');
  box.className = 'leg-types';
  (types || []).forEach(function (t) {
    var sp = document.createElement('span');
    sp.className = 'ty';
    sp.setAttribute('data-type', t);
    sp.style.background = TYPE_COLOR[t] || '#777';
    sp.textContent = TYPE_ZH[t] || t;
    sp.title = TYPE_ZH[t] || t;
    box.appendChild(sp);
  });
  return box;
}

function legClock(sec) {
  var s = Math.max(0, Math.round(Number(sec) || 0));
  var m = Math.floor(s / 60);
  return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
}

function legRowSmall(p) {
  if (p.got) return '已获得';
  if (p.locked) return '未解锁';
  var txt = p.where ? '第 ' + p.where + ' 章' : '野外';
  var left = p.until ? p.until - Date.now() : 0;
  if (left > 0 && left < 24 * 3600 * 1000) txt += ' · 剩 ' + legClock(left / 1000);
  return txt;
}

function legStatText(leg) {
  var s = (leg && leg.stats) || { win: 0, lose: 0 };
  var win = s.win || 0;
  var lose = s.lose || 0;
  return '挑战 ' + (win + lose) + ' 次 · 击败它 ' + win + ' 次 · 被击败 ' + lose + ' 次';
}

// 被击败次数 > 0 时单独加粗标红，别混在灰字里看不到
function legStatNode(leg) {
  var s = (leg && leg.stats) || { win: 0, lose: 0 };
  var win = Number(s.win) || 0;
  var lose = Number(s.lose) || 0;
  var frag = document.createDocumentFragment();
  frag.appendChild(document.createTextNode('挑战 ' + (win + lose) + ' 次 · 击败它 ' + win + ' 次 · '));
  var b = document.createElement('b');
  b.className = 'leg-lose' + (lose > 0 ? ' hot' : '');
  b.textContent = '被击败 ' + lose + ' 次';
  frag.appendChild(b);
  return frag;
}

function buildLegRow(p, checked) {
  var li = document.createElement('li');
  li.setAttribute('data-id', String(p.id || 0));
  if (checked) li.className += ' on';
  if (p.locked) li.className += ' locked';
  if (p.got) li.className += ' got';

  var label = document.createElement('label');
  var radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'leg-pick';
  radio.value = String(p.id);
  radio.checked = !!checked;
  // 已捕获 / 还没解锁的：不给选（点了也没反应）
  if (p.got) radio.disabled = true;   // 图鉴里已经有了，不用再追
  if (p.locked) radio.disabled = true; // 这个地区还没通关联盟，它根本不会出现

  var nameWrap = document.createElement('span');
  nameWrap.className = 'leg-name';

  /* 第一百一十一批：每只神兽名字前挂一枚游戏原生小立绘 */
  nameWrap.appendChild(monArtNode(p.id, false, 'mon-art-s'));
  var b = document.createElement('b');
  b.textContent = p.name;
  nameWrap.appendChild(b);
  if (p.types && p.types.length) nameWrap.appendChild(legTypeBadges(p.types));

  var small = document.createElement('small');
  small.textContent = legRowSmall(p);

  label.appendChild(radio);
  label.appendChild(nameWrap);
  label.appendChild(small);
  li.appendChild(label);
  return li;
}

var legManual = { at: 0, text: '' };

var LEG_SHORT = {
  idle: '点「立即前往」开始追踪',
  running: '挑战中，它换章节就跟着换',
  fighting: '正在和它战斗，这轮打完再去追',
  done: '图鉴里已经有了',
  lost: '现在没在野外'
};
function legStatusShort(leg) {
  return (leg && LEG_SHORT[leg.status]) || (leg && leg.why) || '追踪中';
}

// 战绩只挂在「正在追的那只」名字后面，不挂在列表行里
/* 第二十二批：状态条和「正在追的那只」并成一块——#leg-cur 自己就是状态条，
 * 左边一枚状态标签（未启动 / 追踪中 / 读取中 / 未连接），右边是名字 + 属性 + 战绩 */
/* 第一百一十一批：「正在追的那只」也挂立绘；只在目标变了才换节点，
 * 免得面板每秒刷新都重新拉一次图。 */
var legCurArtId = -1;
function setLegCurArt(id) {
  var n = Number(id) || 0;
  if (n === legCurArtId) return;
  legCurArtId = n;
  var wrap = document.querySelector('#leg-cur .leg-cur-nm');
  if (!wrap) return;
  var old = wrap.querySelector('img.mon-art');
  if (old) old.parentNode.removeChild(old);
  if (!n) return;
  var img = monArtNode(n, false, 'mon-art-s');
  wrap.insertBefore(img, wrap.firstChild);
  bindMonArt(wrap);
}

function legChip(st, label) {
  var cur = $('#leg-cur');
  if (!cur) return;
  var s = st || 'off';
  if (cur.getAttribute('data-state') !== s) cur.setAttribute('data-state', s);
  var chip = cur.querySelector('.rst');
  if (chip && chip.textContent !== label) chip.textContent = label;
}

function renderLeg(state) {
  var ul = $('#leg-list');
  if (!ul) return;
  var leg = (state && state.leg) || null;
  // 「选中」≠「在追」：只有点过「立即前往」才算真的在追
  var armed = !!(leg && leg.armed);
  var legStopBtn = $('#leg-stop');
  if (legStopBtn) legStopBtn.disabled = !armed;
  var picks = leg && leg.picks && leg.picks.length ? leg.picks : LEG_FALLBACK;
  var target = Number(settings.legendaryId) || Number(leg && leg.target) || 0;

  // 正在追的那只，单独放一条显眼的
  var cur = $('#leg-cur');
  var curName = $('#leg-cur-name');
  var curSub = $('#leg-cur-sub');
  var pick = null;
  for (var i = 0; i < picks.length; i++) {
    if (picks[i].id === target) { pick = picks[i]; break; }
  }

  /* 第二十二批：原来上面还有一条 .run，说的就是这里「正在追的那只 + 一句进度」，
   * 两块重复，已并成一块（状态标签 + 名字 + 属性 + 战绩 + 进度） */
  if (!isGameTab) {
    legChip('err', '未连接');
    setBrief('#brief-leg', '未连接', 'err');
  } else if (!leg) {
    legChip('wait', '读取中');
    setBrief('#brief-leg', '读取中', 'wait');
  } else if (armed && pick) {
    legChip('on', '追踪中');
    setBrief('#brief-leg', '运行中 · ' + pick.name, 'on');
  } else {
    legChip('off', '未启动');
    setBrief('#brief-leg', '未启动', 'off');
  }

  if (cur && curName && curSub) {
    if (target && pick && armed) {
      cur.classList.add('on');
      // 名字后面直接跟「这一只自己」的挑战记录
      curName.textContent = pick.name;
      setLegCurArt(pick.id);
      var tyEl = $('#leg-cur-types');
      if (!tyEl) {
        tyEl = document.createElement('span');
        tyEl.id = 'leg-cur-types';
        curName.parentNode.insertBefore(tyEl, curName.nextSibling);
      }
      tyEl.textContent = '';
      tyEl.appendChild(legTypeBadges(pick.types));
      var statEl = $('#leg-cur-stat');
      if (!statEl) {
        statEl = document.createElement('span');
        statEl.id = 'leg-cur-stat';
        statEl.className = 'leg-cur-stat';
        var nmRow = cur.querySelector('.leg-cur-nm') || curName;
        nmRow.parentNode.insertBefore(statEl, nmRow.nextSibling);
      }
      statEl.textContent = '';
      statEl.appendChild(document.createTextNode('（'));
      statEl.appendChild(legStatNode(leg));
      statEl.appendChild(document.createTextNode('）'));
      if (legManual.at && Date.now() - legManual.at < 6000) curSub.textContent = legManual.text;
      else if (!isGameTab) curSub.textContent = '打开游戏页面后可用';
      else if (!leg) curSub.textContent = '正在读取…';
      else {
        curSub.textContent = legStatusShort(leg);
      }
    } else {
      cur.classList.remove('on');
      /* 第二十四批：不写「没在追」——左边标签已经说了未启动，这里只留名字位空着（CSS 收起整行） */
      curName.textContent = '';
      setLegCurArt(0);
      var tyOff = $('#leg-cur-types');
      if (tyOff) tyOff.textContent = '';
      var statOff = $('#leg-cur-stat');
      if (statOff) statOff.textContent = '';
      curSub.textContent = !isGameTab
        ? '打开游戏页面后可用'
        : (target && pick ? ('已选好 ' + pick.name + '，点「立即前往」开始追踪') : '在下面选一只后点「立即前往」');
    }
  }

  var sig = JSON.stringify([target, picks.map(function (p) {
    return [p.id, p.locked, p.got, p.where, p.regionLabel, (p.types || []).join('+')];
  })]);
  if (ul.getAttribute('data-sig') !== sig) {
    ul.setAttribute('data-sig', sig);
    ul.textContent = '';
    var lastRegion = null;
    picks.forEach(function (p) {
      var reg = p.regionLabel || '';
      if (reg && reg !== lastRegion) {
        lastRegion = reg;
        var head = document.createElement('li');
        head.className = 'leg-grp';
        head.textContent = reg;
        ul.appendChild(head);
      }
      ul.appendChild(buildLegRow(p, target === p.id));
    });
    bindMonArt(ul);
    return;
  }

  // 文字每小时每分都在变，就地更新，不重建整张表
  picks.forEach(function (p) {
    var li = ul.querySelector('li[data-id="' + p.id + '"]');
    if (!li) return;
    var small = li.querySelector('small');
    if (small) small.textContent = legRowSmall(p);
  });
}

function renderEmptyState(reason) {
  pageReady = false;
  $('#conn').textContent = '—';
  $('#spoof').textContent = '—';
  $('#hid').textContent = '—';
  $('#ws').textContent = '—';
  $('#cnt').textContent = '—';
  $('#up').textContent = '—';
  var cs = $('#stat-conn');
  if (cs) cs.setAttribute('data-state', 'off');
  var ss = $('#stat-spoof');
  if (ss) ss.setAttribute('data-state', 'off');
  renderProbe(null);
  logSig = '';
  renderLog([]);
  renderFeed([], settings.feedItems);
  renderUg(null);
  renderLeg(null);
  renderDex(null);
  renderNursery(null);
  renderMarket(null);
  renderFarmPanels({});
  if (window.PCG_UNDER_UI) window.PCG_UNDER_UI.reset('请打开游戏页，更新扩展后刷新一次游戏页面');
  /* 第二十批：没有游戏页时，所有功能卡片统一显示「未连接」
   * 第二十二批：传说追踪 / 宝可梦收藏 / 保留重复 各自处理——前两个的状态条已经并进卡片本身，
   * 保留重复是一次性操作，只留一句「手动操作」，没有运行状态可言 */
  ['#brief-core', '#brief-auto', '#brief-feed', '#brief-farm', '#brief-raid']
    .forEach(function (s) { setBrief(s, '未连接', 'err'); });
  ['#farm-phase', '#raid-phase']
    .forEach(function (s) { runLine(s, 'err', null, '打开游戏页面后可用'); });
  setBrief('#brief-fav', settings.favOn ? '已开启' : '已关闭', 'idle');
  setBrief('#brief-keepdup', kdSum || '手动操作', 'idle');
  $('#reconnect').disabled = true;
  $('#reload').disabled = !isGameTab;
  if (reason === 'not-game') {
    setPill('未在游戏中', 'warn');
    setReloadAsk(false);
    /* 第八十九批：全屏面板是个独立标签页，找不到游戏页时要说清「先打开游戏页再回来」，
     * 不然玩家会以为插件坏了 */
    setHint(TAB_MODE
      ? '没找到 Poke\'Catch 的游戏标签页。先在浏览器里打开游戏页面，再回到这个面板（它会自己接上）。'
      : '当前标签页不是 Poke\'Catch。打开游戏页面后再点开插件。');
  } else if (reason === 'no-hook') {
    /* 第五十二批：原来这里写「请刷新页面」，现在刷新只剩标题栏那颗图标，
     * 提示改成「待刷新」＋把图标点亮（金色描边），一眼看得出点哪儿。 */
    setPill('待刷新', 'warn');
    setReloadAsk(true);
    setHint('插件刚安装或更新过，游戏页需要刷新一次才会生效。点标题栏那颗刷新图标即可。');
  } else {
    setPill('未运行', 'warn');
    setReloadAsk(false);
    setHint('');
  }
}

function applySettingsToUI(settings) {
  Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
    var box = document.querySelector('input[data-key="' + key + '"]');
    if (!box) return;
    var on = !!settings[key];
    if (box.checked !== on) box.checked = on;
  });
  var sec = $('#ug-check');
  // 正在输入时别被轮询覆盖掉
  if (sec && document.activeElement !== sec) {
    var uv = String(clampSec(settings.ugCheckSec));
    if (sec.value !== uv) sec.value = uv;
  }
  var fm = farmModeOf(settings.farmMode);
  document.querySelectorAll('input[name="farmMode"]').forEach(function (r) {
    var on = (r.value === fm);
    if (r.checked !== on) r.checked = on;
  });
}

/* 第五十九批：联盟刷钱三档模式归一化 —— 跟 content.js 的 farmModeOf 同一套规则，
 * 只认 uncleared / top3 / cleared，别的（含老存档的空值）一律按 uncleared。
 *   uncleared（默认）：打完 4 天王就切走重开，永远不打冠军（1.8 倍赏金一直在）
 *   top3            ：打完第 3 位就切走重开
 *   cleared         ：连冠军一起打完再重开 */
function farmModeOf(v) {
  return (v === 'cleared' || v === 'top3') ? v : 'uncleared';
}

// 地下通道的检查间隔：10 ~ 600 秒，默认 300（5 分钟）
function clampSec(v) {
  var n = parseInt(v, 10);
  if (!isFinite(n) || n <= 0) n = 300;
  return Math.max(10, Math.min(600, n));
}

function readSettingsFromUI() {
  var out = Object.assign({}, settings);
  Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
    var box = document.querySelector('input[data-key="' + key + '"]');
    if (box) out[key] = box.checked;
  });
  out.feedItems = Object.assign({}, settings.feedItems || {});
  /* 第六十七批：定点循环正在跑的时候，「刷新页面后自动继续」一定是开的
   * （页面侧 start() 已经写过 true），别拿弹窗打开那一刻的旧值把它写回去 ——
   * 写回 false 会让页面把任务当成「开关被关掉」而当场停。
   * 第六十九批：目标只剩「定点循环」一档，老存档里的 rotom / berry / griseous / egg
   * 一律归到「定点循环」。 */
  if (lastOrb && lastOrb.armed) out.orbOn = true;
  out.orbMode = 'point';
  var sec = document.querySelector('#ug-check');
  if (sec) out.ugCheckSec = clampSec(sec.value);
  var picked = document.querySelector('input[name="farmMode"]:checked');
  if (picked) out.farmMode = farmModeOf(picked.value);
  return out;
}

/* ---------------- 自动喂食列表 ---------------- */
var feedSig = '';

// 效果取自游戏 BUFF_BERRIES（family / mult），全部持续 1 小时
var FEED_EFFECT = {
  'razz-berry': '捕获概率 ×1.25',
  'golden-razz-berry': '捕获概率 ×1.5',
  'nanab-berry': '稀有宝可梦出现率 ×2',
  'enigma-berry': '从未捕获过的宝可梦出现率 ×3',
  'pinap-berry': '战斗经验 ×1.25',
  'lansat-berry': '获得金钱 ×1.25',
  'starf-berry': '异色（闪光）概率 ×2'
};

function feedTip(f) {
  var name = f.name || f.key;
  var eff = FEED_EFFECT[f.key];
  if (!eff) return name;
  var s = name + '：' + eff + '，持续 1 小时';
  if (f.key === 'razz-berry' || f.key === 'golden-razz-berry') {
    s += '\n两种捕获果属于同一类效果，同时只会保留更高的那个。';
  } else if (f.key === 'starf-berry') {
    s += '\n异色果比较稀有，建议留到刷异色的时候再开。';
  }
  return s;
}

function buildFeedRow(f) {
  var li = document.createElement('li');
  li.setAttribute('data-k', f.key);
  li.setAttribute('aria-label', feedTip(f));
  // 悬停显示效果：用插件自己的浮层，不走浏览器原生 tooltip
  li.addEventListener('pointerenter', function () { showFeedTip(f, li); });
  li.addEventListener('pointerleave', hideFeedTip);

  var img = document.createElement('img');
  img.className = 'fi-ico';
  img.alt = '';
  if (f.icon) img.src = f.icon;

  var txt = document.createElement('div');
  txt.className = 'fi-txt';
  var name = document.createElement('b');
  name.textContent = f.name || f.key;
  var meta = document.createElement('small');
  meta.textContent = feedMeta(f);
  txt.appendChild(name);
  txt.appendChild(meta);

  var label = document.createElement('label');
  label.className = 'mini';
  var box = document.createElement('input');
  box.type = 'checkbox';
  box.setAttribute('data-feed-key', f.key);
  box.checked = !!(settings.feedItems && settings.feedItems[f.key]);
  box.addEventListener('change', function () {
    settings.feedItems = Object.assign({}, settings.feedItems || {});
    if (box.checked) settings.feedItems[f.key] = true;
    else delete settings.feedItems[f.key];
    lastUserEdit = Date.now();
    saveAndPush();
  });
  var track = document.createElement('span');
  track.className = 'track';
  label.appendChild(box);
  label.appendChild(track);

  li.appendChild(img);
  li.appendChild(txt);
  li.appendChild(label);
  return li;
}

function feedMeta(f) {
  var s = '×' + (f.qty || 0);
  if (f.left) s += ' · 剩 ' + f.left;
  else if (f.active) s += ' · 生效中';
  return s;
}

/* ---------------- 果实效果浮层 ---------------- */
function showFeedTip(f, anchor) {
  var tip = $('#feed-tip');
  if (!tip || !anchor) return;
  tip.textContent = feedTip(f);
  tip.hidden = false;

  var r = anchor.getBoundingClientRect();
  var w = tip.offsetWidth;
  var h = tip.offsetHeight;
  var vw = window.innerWidth;
  var vh = window.innerHeight;

  var left = Math.round(r.left + r.width / 2 - w / 2);
  left = Math.max(8, Math.min(left, vw - w - 8));

  var top = Math.round(r.top - h - 8);
  if (top < 8) top = Math.round(r.bottom + 8);
  if (top + h > vh - 8) top = Math.max(8, vh - h - 8);

  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}

function hideFeedTip() {
  var tip = $('#feed-tip');
  if (tip) tip.hidden = true;
}

function renderFeed(list, enabled) {
  var ul = $('#feed-list');
  if (!ul) return;
  list = list || [];
  enabled = enabled || (settings.feedItems || {});

  var sig = (isGameTab ? '1' : '0') + '|' + list.map(function (f) { return f.key; }).join(',');
  if (sig !== feedSig) {
    feedSig = sig;
    ul.textContent = '';
    hideFeedTip();
    if (!list.length) {
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = isGameTab
        ? (pageReady ? '背包里暂时没有可喂的果实（去草丛摘点）' : '正在读取背包…')
        : '打开游戏页面后，在这里勾选要自动喂的果实';
      ul.appendChild(li);
      return;
    }
    list.forEach(function (f) { ul.appendChild(buildFeedRow(f)); });
  }

  list.forEach(function (f) {
    var row = ul.querySelector('li[data-k="' + f.key + '"]');
    if (!row) return;
    var meta = row.querySelector('small');
    if (meta) meta.textContent = feedMeta(f);
    var box = row.querySelector('input[data-feed-key]');
    if (box && document.activeElement !== box) box.checked = !!enabled[f.key];
  });
}

/* ---------------- 联盟刷钱（原「刷钱」，第二十三批改名并限定本地区） ---------------- */
var farmMsg = null;

function fmtMoney(n) {
  var v = Math.round(Number(n) || 0);
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function renderFarm(farm) {
  var st = farm || {};
  var mode = farmModeOf(st.mode);
  document.querySelectorAll('input[name="farmMode"]').forEach(function (r) {
    r.checked = (r.value === mode);
  });

  var on = !!st.on;
  var ready = st.ready !== false;
  var sum = $('#farm-sum');
  var list = $('#farm-stat');
  var startBtn = $('#farm-now');
  var stopBtn = $('#farm-stop');
  if (startBtn) startBtn.disabled = on || !ready;
  if (stopBtn) stopBtn.disabled = !on;

  /* 第二十二批：原来另有一条 #farm-note 在说同一件事（没在刷 / 为什么不能刷），
   * 已经删掉，内容全部收进这条运行状态栏；手动点按钮的回执用「提示」标签临时占用 */
  var manual = (farmMsg && Date.now() - farmMsg.at < 6000) ? farmMsg.text : '';
  if (!isGameTab) {
    runLine('#farm-phase', 'err', null, '打开游戏页面后可用');
  } else if (manual) {
    runLine('#farm-phase', 'wait', '提示', manual);
  } else if (st.phase === 'lock' || (!on && !ready)) {
    runLine('#farm-phase', 'wait', null, '⚠ ' + (st.phase === 'lock'
      ? (st.why || '现在还不能刷') : (st.lockWhy || '现在还不能刷')));
  } else if (on) {
    runLine('#farm-phase', 'on', null,
      (st.label ? st.label + ' · ' : '') + (st.why || '待命'));
  } else {
    runLine('#farm-phase', 'off', null, '点「开始联盟刷钱」就行');
  }
  setBrief('#brief-farm', on ? ('运行中 · 本轮 +' + fmtMoney(st.run)) : '未启动', on ? 'on' : 'off');
  if (sum) {
    sum.textContent = (on || st.runs)
      ? ('本轮 +' + fmtMoney(st.run) + ' · 共 ' + (st.runs || 0) + ' 轮 ' + fmtMoney(st.total) + ' · 平均 ' + fmtMoney(st.avg) + '/轮')
      : '收益：—';
  }
  if (list) {
    var rows = [];
    /* 第二十三批：联盟刷钱只在本地区里循环，面板上交代清楚当前地区 */
    if (st.regionZh) rows.push(['所在地区', st.regionZh + '（本地区切章）']);
    if (st.roamSkip) rows.push(['跳过神兽章', st.roamSkip + ' 章']);
    if (st.perHour) rows.push(['每小时', fmtMoney(st.perHour)]);
    if (st.runs) rows.push(['上一轮', fmtMoney(st.lastRun) + (st.lastMs ? ' · ' + fmtDuration(st.lastMs) : '')]);
    if (st.fights) rows.push(['本章训练家', st.fights + ' 场']);
    if (st.elapsed) rows.push(['已跑', fmtDuration(st.elapsed)]);
    if (!rows.length) rows.push(['还没开始', '—']);
    list.innerHTML = rows.map(function (r) {
      return '<li><span>' + r[0] + '</span><b>' + r[1] + '</b></li>';
    }).join('');
  }
}

/* ---------------- 第二批：图鉴捕捉面板 ---------------- */
var dexSig = '';
var dexMsg = { at: 0, text: '' };
var GUI = window.PCG_GAME_UI || null;   // 游戏原生小图标 / 配色
var dexCatFilter = '';                  // 当前点亮的分类（空 = 全部）
/* 第一百二十批：洛托姆按「点击顺序」勾选 —— rotomPick 数组本身就是顺序，
 * 界面上给勾选项显示 1、2、3… 序号；取消勾选后后面的自动前移。 */
var rotomClickOrder = [];
function rotomOrderFrom(cfg) {
  var arr = (cfg && Array.isArray(cfg.rotomPick)) ? cfg.rotomPick.slice() : [];
  return arr.filter(function (n, i) {
    return typeof n === 'number' && n >= 0 && n <= 5 && arr.indexOf(n) === i;
  });
}
function rotomSeqOf(i) {
  /* 第一百二十一批：序号显示在「勾选框里」，不再跟在名字后面。
   * 返回纯数字（未入队返回 0），由调用方写进 .rt-chk-box 的 data-seq。 */
  var k = rotomClickOrder.indexOf(Number(i));
  return k < 0 ? 0 : (k + 1);
}
/* 闪光标记用游戏自己的 sparkle.svg，别再自造 ✦ */
function shinyIco() {
  return GUI && typeof GUI.icon === 'function'
    ? '<img class="ns-sh-ico" alt="" src="' + GUI.icon('sparkle') + '">'
    : '✦ ';
}

/* ---------------- 第一百一十一批：清单里的宝可梦小立绘 ----------------
 * 所有「带宝可梦名字」的清单统一挂一枚游戏原生立绘，取自线上 CDN 的
 *   assets/pokemon/art/still/<id>.png          普通
 *   assets/pokemon/art/shiny/still/<id>.png    闪光
 * 61×57 的透明 PNG、单张 1~3KB，缩到 18px 内联显示，不改行高、不撑高卡片。
 * 洛托姆形态（47901~47905）、传说神兽这些特殊编号游戏里也都有对应立绘。
 * 加载失败先退回同 id 的小 sprite（assets/pokemon/<id>.png），再失败就地隐藏，
 * 不会出现破图占位把排版挤歪。MV3 不允许内联 onerror，统一由 bindMonArt() 绑。 */
var MON_ART = 'https://pokecatch-online.pages.dev/assets/pokemon/art/';
var MON_ART_FB = 'https://pokecatch-online.pages.dev/assets/pokemon/';
function monArtUrl(id, shiny) {
  var n = Number(id) || 0;
  if (!n) return '';
  return MON_ART + (shiny ? 'shiny/still/' : 'still/') + n + '.png';
}
function monArtHtml(id, shiny, cls) {
  var n = Number(id) || 0;
  if (!n) return '';
  return '<img class="mon-art' + (cls ? ' ' + cls : '') + '" src="' + monArtUrl(n, shiny) +
    '" data-id="' + n + '" data-shiny="' + (shiny ? '1' : '0') + '" alt="">';
}
function monArtNode(id, shiny, cls) {
  var n = Number(id) || 0;
  var img = document.createElement('img');
  img.className = 'mon-art' + (cls ? ' ' + cls : '');
  img.alt = '';
  img.src = monArtUrl(n, shiny);
  img.setAttribute('data-id', String(n));
  img.setAttribute('data-shiny', shiny ? '1' : '0');
  return img;
}
function bindMonArt(box) {
  if (!box || !box.querySelectorAll) return;
  var imgs = box.querySelectorAll('img.mon-art[data-id]');
  for (var i = 0; i < imgs.length; i++) {
    (function (img) {
      if (img.getAttribute('data-bound') === '1') return;
      img.setAttribute('data-bound', '1');
      img.addEventListener('error', function () {
        var id = img.getAttribute('data-id');
        var shiny = img.getAttribute('data-shiny') === '1';
        if (img.getAttribute('data-fb') === '1') { img.style.visibility = 'hidden'; return; }
        img.setAttribute('data-fb', '1');
        img.src = MON_ART_FB + (shiny ? 'shiny/' : '') + id + '.png';
      });
    })(imgs[i]);
  }
}
var dexCatInit = false;
var lastDexState = null;

function dexCfgFromUI() {
  var picked = document.querySelector('input[name="dexMode"]:checked');
  var target = $('#dex-target');
  /* 第六十九批：模式三选一（一键补全 / 指定捕捉 / 刷洛托姆 5 形态）。
   * rotomPick = 洛托姆清单里勾了哪几个形态；一个都没勾就当 5 个全刷。 */
  var dm = picked ? String(picked.value || '') : '';
  if (dm !== 'target' && dm !== 'rotom') dm = 'missing';
  /* 第一百二十批：按「点击顺序」而不是 DOM 顺序收集 —— DOM 是形态编号顺序，
   * 点选顺序存在 rotomClickOrder 里（勾上 push、取消 splice）。 */
  var rotomPick = rotomClickOrder.slice();
  if (!rotomPick.length) {
    document.querySelectorAll('#dx-rotom-list input[data-rotom]').forEach(function (el) {
      if (el.checked && !el.disabled) rotomPick.push(Number(el.getAttribute('data-rotom')));
    });
  }
  /* 第二十一批：速度 / 进度检查 / 单只超时 / 无进展重刷这四项参数已从界面移除，
   * 改由图鉴模块自己的默认值决定，这里不再传，免得覆盖页面已有的配置。 */
  return {
    mode: dm,
    rotomPick: rotomPick,
    target: String((target && target.value) || '').trim().slice(0, 60),
    condFirst: !!($('#dex-cond-first') || {}).checked,
    /* 第一百一十五批：等待选项 —— 默认关（无可抓自动关闭），勾上后原地等条件生效 */
    waitCond: !!($('#dex-wait-cond') || {}).checked,
    /* 第五十五批：等轮换 / 进化路径 / 自动关单一确认弹窗三项默认开启且隐藏，
     * 这里直接钉成 true，不读已经删掉的控件；dex-hunter.js 的 sanitize() 同样钉死。 */
    waitWeather: true,
    showEvo: true,
    autoPop: true,
    /* 第二十九批：默认「一直刷到出闪光」；元素缺失时也要保持默认开 */
    untilShiny: ($('#dex-until-shiny') || {}).checked !== false
  };
}

function dexSyncCfgUI(cfg, mode, target) {
  var c = cfg || {};
  function setVal(id, v) {
    var el = $(id);
    if (el && document.activeElement !== el && String(el.value) !== String(v)) el.value = v;
  }
  function setChk(id, v) {
    var el = $(id);
    if (el && el.checked !== !!v) el.checked = !!v;
  }
  var m = (mode === 'target') ? 'target' : (mode === 'rotom' ? 'rotom' : 'missing');
  document.querySelectorAll('input[name="dexMode"]').forEach(function (r) {
    if (r.checked !== (r.value === m)) r.checked = (r.value === m);
  });
  /* 第六十九批：洛托姆勾选按配置回填（没渲染过就先不管，渲染时会带 picked） */
  if (Array.isArray(c.rotomPick)) {
    rotomClickOrder = rotomOrderFrom(c);   /* 第一百二十批：同步点击顺序 */
    document.querySelectorAll('#dx-rotom-list input[data-rotom]').forEach(function (el) {
      var i2 = Number(el.getAttribute('data-rotom'));
      var on = c.rotomPick.indexOf(i2) >= 0;
      if (el.checked !== on) el.checked = on;
    });
  }
  setVal('#dex-target', target || '');
  setChk('#dex-cond-first', c.condFirst !== false);
  /* 第一百一十五批：等待选项回填（默认关） */
  setChk('#dex-wait-cond', !!c.waitCond);
  /* 第五十五批：三个隐藏项不再有控件可回填，值由配置层固定为 true */
  setChk('#dex-until-shiny', c.untilShiny !== false);
}

async function pushDexCfg() {
  var cfg = dexCfgFromUI();
  if (isGameTab) await sendToTab({ type: MSG.DEX_CONFIG || 'pcg-dex-config', cfg: cfg });
  return cfg;
}

/* 第三十八批：图鉴捕捉两个模式互斥的视觉状态。
 *   没选中的那块整块压灰（还能点，点一下就切过去，所以永远不会两边同时跑）；
 *   功能跑起来之后不许换模式——半路换模式只会让主循环按新模式去跑旧目标，
 *   看起来就像「同时追两只、一直切图重进」，必须先停止再换。
 * 第四十八批：跑起来之后只锁「没选中的那块」（压灰 + 不可点），
 *   **选中的那块保持原样**——以前两块一起压灰到 .34，用户看到自己选的模式
 *   变灰了，会以为选错了 / 功能没开。现在选中的那块只加 .run 标记（可点判定交给 disabled）。 */
function dexModePaint(running) {
  var pane = $('#pane-dex');
  if (!pane) return;
  var picked = pane.querySelector('input[name="dexMode"]:checked');
  var dmv = picked ? String(picked.value || '') : '';
  var mode = (dmv === 'target') ? 'target' : (dmv === 'rotom' ? 'rotom' : 'missing');
  var picks = pane.querySelectorAll('.farm-pick');
  for (var i = 0; i < picks.length; i++) {
    var lab = picks[i];
    var inp = lab.querySelector('input');
    var mine = lab.getAttribute('data-mode') ||
      ((inp && (inp.value === 'target' || inp.value === 'rotom')) ? inp.value : 'missing');
    var on = mine === mode;
    if (inp) {
      if (inp.disabled !== !!running) inp.disabled = !!running;
      /* 锁住的时候连「非选中」那块也别再吃 hover，看着就是不可选 */
      inp.setAttribute('aria-checked', on ? 'true' : 'false');
    }
    lab.classList.toggle('dim', !on);
    lab.classList.toggle('lock', !!running && !on);
    lab.classList.toggle('run', !!running && on);
  }
  var row = $('#dex-target-row');
  var tin = $('#dex-target');
  var find = $('#dex-find');
  var res = $('#dex-resolve');
  /* 第七十二批：输入框只在「捕捉指定宝可梦」时露出来 —— 它现在紧跟模式卡，
   * 选别的模式就该收起来，别占着地方把下面的清单推远。 */
  if (row) {
    row.classList.toggle('off', mode !== 'target');
    row.hidden = mode !== 'target';
  }
  if (res) res.hidden = mode !== 'target';
  if (tin) tin.disabled = !!running;
  if (find) find.disabled = !!running;
  /* 第六十九批：洛托姆清单只在这个模式下露出来，跑起来就锁住勾选框。
   * 第一百零九批：已获得限制已强制解除 —— 不再输出 data-owned，图鉴收录过的形态
   * 也能勾选；只剩「没拿到普通洛托姆」被锁的（data-locked）和运行时不可点。 */
  var rt = $('#dx-rotom');
  if (rt) rt.hidden = mode !== 'rotom';
  var rtl = pane.querySelectorAll('#dx-rotom-list input[data-rotom]');
  for (var k = 0; k < rtl.length; k++) {
    var want = !!running || rtl[k].hasAttribute('data-locked');
    if (rtl[k].disabled !== want) rtl[k].disabled = want;
  }
}


function dxCardHtml(c) {
  var why = (c.reasons || []).slice(0, 5).map(function (t) {
    var hi = /缺少|未开放|等待|未拥有|没有野外|超时|未知|还没/.test(t);
    return '<li' + (hi ? ' class="hi"' : '') + '>' + nsEsc(t) + '</li>';
  }).join('');
  var meta = GUI && GUI.status ? GUI.status(c.status) : null;
  var badge = meta
    ? '<span class="dx-badge" style="--dxc:' + meta.color + '">' +
        '<img class="dx-ico" src="' + GUI.icon(meta.asset) + '" alt="">' +
        nsEsc(meta.zh) + '</span>'
    : '<span class="dx-badge">' + nsEsc(c.statusLabel || '') + '</span>';
  var wx = c.weatherIcon ? '<span class="dx-wx">' + nsEsc(c.weatherIcon) + '</span>' : '';
  return '<li class="dx-card st-' + nsEsc(c.status || 'special') + '" style="--dxc:' +
      (meta ? meta.color : 'var(--line)') + '">' +
    '<div class="dx-head">' +
      '<span class="dx-name">' + monArtHtml(c.id, false) + nsEsc(c.name || ('#' + c.id)) +
        ' <small>#' + (c.id || 0) + ' · ' + nsEsc(c.regionLabel || '') + '</small></span>' +
      badge +
    '</div>' +
    '<div class="dx-where">' + wx + nsEsc(c.path || c.spot || '—') +
      (c.pct ? ' · 出没 <b>' + c.pct + '%</b>' : '') + '</div>' +
    '<ul class="dx-why">' + why + '</ul></li>';
}

function renderDex(dex, filter) {
  var phase = $('#dex-phase');
  var list = $('#dex-plan');
  if (!phase || !list) return;
  var startBtn = $('#dex-now'), stopBtn = $('#dex-stop'), scanBtn = $('#dex-scan');

  function blank() {
    /* 第三十八批：连不上游戏页时也按弹窗里选中的模式画一次灰态，
     * 免得两个模式都亮着、看着像能同时跑 */
    dexModePaint(false);
    runLine('#dex-phase', 'err', null, disconnectedText() + ' · 先打开游戏页并登录');
    list.innerHTML = '<li class="empty">还没读到存档</li>';
    var ge = $('#dx-gaps');
    if (ge) ge.innerHTML = '<li class="empty">还没读到存档</li>';
    nsSet('#dx-totals', '—');
    nsSet('#dx-weather', '—');
    nsSet('#dx-time', '—');
    nsSet('#dx-unlock', '—');
    nsSet('#dex-filter-note', '未开启');
    nsSet('#dex-note', '打开 Poke\'Catch 页面后可用');
    setBrief('#brief-dex', '未连接', 'err');
    dexSig = '';
  }

  if (!dex) {
    if (blankShown.dex !== 'no-dex') {
      blankShown.dex = 'no-dex';
      blank();
    }
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = true;
    if (scanBtn) scanBtn.disabled = true;
    return;
  }
  blankShown.dex = '';
  lastDexState = dex;
  if (!dexCatInit) { dexCatFilter = dex.listFilter || ''; dexCatInit = true; }

  /* 图鉴筛选状态由 refresh() 从 state.dexFilter 传入，只参与重绘签名。
   * 之前这里直接引用未定义的 f，会抛 ReferenceError 让整个 refresh() 中断。 */
  var f = filter || {};
  var ready = dex.ready !== false;
  if (startBtn) startBtn.disabled = !!dex.running || !ready;
  if (stopBtn) stopBtn.disabled = !dex.running;
  if (scanBtn) scanBtn.disabled = !!dex.running || !ready;
  dexSyncCfgUI(dex.cfg, dex.mode, dex.target);
  /* 第三十八批：模式互斥的灰态跟着运行状态一起刷新 */
  dexModePaint(dex.running);

  var wObj = dex.weather || {};
  var tObj = dex.time || {};
  /* 顶部这一栏是「当前正在打的那一关」的天气（按 adv.chapter 取），
   * 不是目标关天气；各目标卡的天气在卡片里单独按章节显示。
   * 第九十七批：天气 / 时段的文字串本身已经带游戏图标（dex-hunter 的 condGlyph：
   * 「🌧️ 下雨」「🌙 夜晚」），这里再补一遍前缀就成「🌧️ 🌧️ 下雨」了，所以不再自己拼。 */
  nsSet('#dx-weather', (wObj.chapterNow || '未读到') +
    (wObj.chapterKnown ? ' · 当前关' : ''));
  nsSet('#dx-time', tObj.label || '未知');
  nsSet('#dx-unlock', dex.unlocked == null ? '—' : String(dex.unlocked + 1));

  var t = dex.totals || {};
  var gaps = dex.gaps || [];
  var cards = dex.list || [];
  /* 第二十批：右上角徽标 = 「运行中 · 正在捕捉的那只」 */
  var dxCurName = (dex.cur && dex.cur.name) ? dex.cur.name : '';
  setBrief('#brief-dex',
    dex.running ? ('运行中 · ' + (dxCurName || '捕捉中')) : '未启动',
    dex.running ? 'on' : 'off');

  /* 第二行运行状态：内容没变就别重写，一秒一次的轮询不能动 DOM */
  runLine('#dex-phase', dex.running ? 'on' : (ready ? 'off' : 'wait'), null,
    dex.running
      ? ((dex.phase || '捕捉中') + (dxCurName
        ? ' · ' + dxCurName + ' ' + (dex.cur.pct || 0) + '%' : ''))
      : (ready ? '点「开始捕捉」启动' : '游戏还没加载完，进游戏后再点开始'));

  /* 第六十九批：洛托姆 5 形态清单（哪个已获得 / 在哪 / 什么条件） */
  renderDexRotom(dex.rotom, dex.running);

  var st = dex.stats || {};
  /* 第八十二批：口径跟游戏页看板对齐 —— 原来的「路闪遭遇 / 路闪捕捉」对玩家没用
   * （基本上一直 0 / 0），换成**切出切回轮次**：这一轮跑了多少趟重抽。 */
  /* 第九十九批：玩家要求把这条状态行和下面那句「天气 / 时段一变自动重算清单……」
   * 合并到一处显示，并去掉重复、精简文字 —— 两处都在讲「条件 / 切图」这件事。
   * 现在状态行不再单独占一块，都并到 #dex-note 那一行里（见下面 dxNote）。 */
  var dexSum = '';
  if (dex.mode === 'rotom') {
    var rl = dex.rotom || [];
    var ownN = rl.filter(function (r) { return r.owned; }).length;
    var parkN = rl.filter(function (r) { return r.parked; }).length;
    dexSum = '洛托姆 ' + ownN + '/' + rl.length + ' · 可去刷 ' + (t.ready || 0) +
      ' · 等条件 ' + (t.waiting || 0) +
      (parkN ? '（' + parkN + ' 只先跳过）' : '') +
      ' · 切图重进 ' + (st.rerolls || 0) + ' 轮 · 抓到 ' + (st.caught || 0) + ' 只';
  } else {
    dexSum = '清单 ' + (t.uncaught || 0) + ' 只 · 能直接抓 ' + (t.ready || 0) +
      ' · 等条件 ' + (t.waiting || 0) + ' · 切图重进 ' + (st.rerolls || 0) +
      ' 轮 · 抓到 ' + (st.catches || 0) + ' 只 · 换目标 ' +
      (st.condSwitches || 0) + ' 次';
  }

  var resolve = $('#dex-resolve');
  if (resolve) {
    var dxResolve = (dex.found && dex.found.ids && dex.found.ids.length)
      ? ('已解析成图鉴号 #' + dex.found.ids.join('、#') +
        (dex.found.multi ? '（匹配到多只，只追 #' + dex.found.ids[0] + '）' : '') +
        ' · 已抓过 / 闪光图鉴已解锁的也能继续刷')
      : ((dex.mode === 'target' && dex.target)
        ? ('按显示名匹配「' + dex.target + '」；填中文名或图鉴号更准')
        : '支持 649 个中文名（含合众）、图鉴号，以及游戏里显示的法 / 英文名');
    if (resolve.textContent !== dxResolve) resolve.textContent = dxResolve;
  }

  var note = $('#dex-note');
  if (note) {
    /* 第九十九批：说明精简成一句（「条件失效自动换目标」「错过刷新点自动切图重进」
     * 跟上面的「等条件 N（先跳过）」「切图重进 N 轮」是同一件事，去掉），
     * 后面直接接上状态行 —— 一行看完，不再占两块地方。 */
    var dxNote = (dexMsg.text && Date.now() - dexMsg.at < 8000) ? dexMsg.text
      : (!ready ? '游戏还没加载完，进游戏后再点开始'
        : ((dex.note || '天气或时段一变就自动重算清单') +
          (dexSum ? '　｜　' + dexSum : '')));
    if (note.textContent !== dxNote) note.textContent = dxNote;
  }

  // 面板每秒拉一次状态，签名没变就不重绘，避免滚动位置跳动
  var sig = JSON.stringify([
    dex.running, dex.cur && dex.cur.id, dex.lastScanAt, dexCatFilter,
    dex.listFilter, dex.listTotal,
    f.on, f.uncaught, f.hidden,
    dex.weather, dex.time, dex.unlocked,
    gaps, t, cards.length,
    cards.slice(0, 40).map(function (c) {
      return [c.id, c.status, c.pct, c.spot, (c.reasons || []).join('|')];
    })
  ]);
  if (sig === dexSig) return;
  dexSig = sig;

  var gEl = $('#dx-gaps');
  if (gEl) {
    if (!gaps.length) gEl.innerHTML = '<li class="empty">还没读到存档</li>';
    else gEl.innerHTML = gaps.map(function (g) {
      return '<li class="' + (g.left === 0 ? 'full' : '') + '">' +
        '<div class="gp-hd"><span>' + nsEsc(g.zh) + '</span><b>' +
        (g.left === 0 ? '已集齐' : '还差 ' + g.left + ' 只') + '</b></div>' +
        '<div class="gp-bar"><i style="width:' + (g.pct || 0) + '%"></i></div></li>';
    }).join('');
  }

  var totals = $('#dx-totals');
  if (totals) {
    if (!GUI) {
      totals.textContent = '游戏图标模块没加载';
    } else {
      var COUNT = {
        ready: t.ready || 0, waiting: t.waiting || 0, evo: t.evo || 0,
        hatch: t.hatch || 0, locked: t.locked || 0, special: t.special || 0
      };
      totals.innerHTML = GUI.CATS.map(function (c) {
        var on = dexCatFilter === c.key;
        return '<button type="button" class="dx-cat' + (on ? ' on' : '') +
          '" data-dxcat="' + c.key + '" aria-pressed="' + on +
          '" style="--dxc:' + c.color + '" title="只看' + nsEsc(c.zh) + '">' +
          '<img src="' + GUI.icon(c.asset) + '" alt="">' +
          nsEsc(c.zh) + ' <b>' + (COUNT[c.key] || 0) + '</b></button>';
      }).join('');
    }
  }
  var catLabel = '';
  if (dexCatFilter && GUI) {
    for (var ci = 0; ci < GUI.CATS.length; ci++) {
      if (GUI.CATS[ci].key === dexCatFilter) { catLabel = GUI.CATS[ci].zh; break; }
    }
  }
  nsSet('#dx-list-meta', catLabel
    ? ('只看「' + catLabel + '」· ' + (dex.listTotal != null ? dex.listTotal : cards.length) + ' 只')
    : (cards.length ? ('显示前 ' + cards.length + ' 只 · 按优先级') : '—'));

  list.textContent = '';
  /* 第六十九批：刷洛托姆模式下，上面那块「洛托姆形态」清单就是目标列表，
   * 这里不再重复画一遍（模式切回来会自然恢复） */
  if (dex.mode === 'rotom') return;
  if (!cards.length) {
    var li0 = document.createElement('li');
    li0.className = 'empty';
    li0.textContent = '没有未捕捉的宝可梦了，或者还没读到存档';
    list.appendChild(li0);
    return;
  }
  list.innerHTML = cards.slice(0, 40).map(dxCardHtml).join('');
  bindMonArt(list);
}

/* 第六十九批：图鉴捕捉卡里的「洛托姆」清单。
 * 第七十七批：整份清单改成跟「未捕捉清单」同一套卡片 ——
 *   头部：勾选框 + 形态名「#47901 · 神奥」+ 状态徽标（等待天气 / 等待时段 / 可以去刷 / 已获得）；
 *   第二行：地区 · 第几章 + 地点（卡片的路径行）；
 *   再往下：一组「·」开头的条件明细（有天气限制 / 需求 … 地点），
 *           跟饭匙蛇、巨沼怪那些卡片一个写法。
 * 第八十三批：**普通洛托姆（#479 本体）排第一**，它是 5 种形态的前置 ——
 *   没拿到它之前，另外 5 只全部锁成灰、勾选框不可点、徽标写「需先获得普通洛托姆」；
 *   拿到之后 5 只形态自动开启（勾选由页面侧 rotomBaseSync() 自动全勾上）。
 * 第一百零九批：已获得限制已强制解除 —— 图鉴收录过的形态勾选框不再锁住，
 * 跑起来之后才全部锁住；「没拿到普通洛托姆」的前置锁定仍保留。 */
var dexRotomSig = '';
/* 第八十八批：0.04 → '4%'、0.025 → '2.5%'（洛托姆形态那格每次进图的生成概率） */
function pctTxt(p) {
  var v = Math.round((Number(p) || 0) * 1000) / 10;
  return (v % 1 === 0 ? String(v) : v.toFixed(1)) + '%';
}

function renderDexRotom(list, running) {
  var ul = $('#dx-rotom-list');
  if (!ul) return;
  var arr = list || [];
  var sig = JSON.stringify([!!running, arr]);
  if (sig === dexRotomSig) return;
  dexRotomSig = sig;
  if (!arr.length) {
    ul.innerHTML = '<li class="empty">还没读到存档</li>';
    nsSet('#dx-rotom-meta', '勾要刷的形态');
    return;
  }
  /* 第一百二十批：普通洛托姆排第一，其余按「点击顺序」排并显示序号；
   * 没勾的 / 已收录置灰的排在后面。 */
  var order = rotomClickOrder;
  var rows = arr.slice(0).sort(function (a, b) {
    if (!!a.base !== !!b.base) return a.base ? -1 : 1;
    var ia = order.indexOf(a.i), ib = order.indexOf(b.i);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.i - b.i;
  });
  var doneN = 0, pickN = 0, parkN = 0, lockN = 0;
  ul.innerHTML = rows.map(function (r) {
    /* 第一百二十批：这个「特殊的相遇」已用过 / 图鉴已收录 → 置灰不可选 */
    var done = !!(r.owned || r.onceDone || r.caught);
    if (done) doneN++;
    if (r.locked) lockN++;
    /* 第八十七批：条件不满足被跳过的那几只 —— 勾选还在（不是玩家取消的），
     * 天气回来接着刷，所以单独计数、单独上色，别混进「勾选」里。 */
    else if (r.parked) parkN++;
    else if (r.picked) pickN++;
    var st = done ? 'done' : (r.locked ? 'locked' : (r.status || (r.ok ? 'ready' : 'weather')));
    /* 颜色跟未捕捉清单一样取自游戏配色：可以刷=绿、等天气/时段=蓝；
     * 已获得不传（留给 CSS 的金色，var(--gold) 在明暗两套主题里都压得住） */
    var dxc = (GUI && GUI.status && st !== 'done' && st !== 'locked') ? GUI.status(st).color : '';
    var meta = (GUI && GUI.status && st !== 'done' && st !== 'locked') ? GUI.status(st) : null;
    var badge = done
      ? '<span class="dx-badge dx-badge-done">图鉴已收录</span>'
      : (r.locked
        ? '<span class="dx-badge dx-badge-lock">需先获得普通洛托姆</span>'
        : ('<span class="dx-badge">' +
          (meta ? '<img class="dx-ico" src="' + GUI.icon(meta.asset) + '" alt="">' : '') +
          nsEsc(r.statusZh || '等条件') + '</span>'));
    /* 「·」明细：跟 dxCardHtml 同一套高亮规则（缺条件 / 未读到 这类写成警示色） */
    var why = (r.reasons || []).slice(0, 4).map(function (t) {
      var hi = /缺少|未开放|未拥有|没有野外|超时|未知|还没|刷不出来|未读到|已不满足|需获取/.test(String(t));
      return '<li' + (hi ? ' class="hi"' : '') + '>' + nsEsc(t) + '</li>';
    }).join('');
    var cls = 'dx-card rt-card st-' + st +
      (done ? ' rt-done'
        : (r.locked ? ' rt-lock'
          : (r.parked ? ' rt-park' : (r.picked ? ' rt-on' : ''))));
    return '<li class="' + cls + '"' + (dxc ? ' style="--dxc:' + dxc + '"' : '') + '>' +
      '<div class="dx-head">' +
        /* 第一百二十一批：勾选框自绘，选中后框内显示点击顺序号（1/2/3…）。
         * input 本身不变（事件按 [data-rotom] 委托），只套一层 .rt-chk 承载序号；
         * 序号必须写在 .rt-chk-box 上，CSS attr(data-seq) 才能取到。 */
        '<span class="rt-chk">' +
          '<input type="checkbox" data-rotom="' + r.i + '"' +
            (r.locked ? ' data-locked="1"' : '') +
            (done ? ' data-done="1"' : '') +
            (r.picked && !done ? ' checked' : '') +
            ((r.locked || done || running) ? ' disabled' : '') +
            ' aria-label="' + nsEsc(r.name) + '">' +
          '<span class="rt-chk-box' + (r.picked && !done ? ' has-seq' : '') + '"' +
            (r.picked && !done ? ' data-seq="' + rotomSeqOf(r.i) + '"' : '') +
            ' aria-hidden="true"></span>' +
        '</span>' +
        '<span class="dx-name">' + monArtHtml(r.id, false) + nsEsc(r.name) +
          ' <small>#' + r.id + (r.regionLabel ? ' · ' + nsEsc(r.regionLabel) : '') +
          '</small></span>' + badge +
      '</div>' +
      '<div class="dx-where">' +
        /* 第一百一十五批：路径文字与「图鉴已收录」徽标拆开，徽标靠右且更显眼。
         * 概率说明（每次进图 4% · 期望约 25 次）按玩家要求只保留标题这一处，
         * 卡片下方那整栏「这一格是特别的相遇 / 已重抽 N 次 / 理论上 X%」已删除。 */
        '<span class="dx-where-txt">' + nsEsc(r.path || r.place || '—') +
        ' · 特别的相遇' +
        ((r.chance > 0)
          ? ('（每次进图 ' + pctTxt(r.chance) + ' · 期望约 ' +
            Math.max(1, Math.round(1 / r.chance)) + ' 次切出切回）')
          : '') +
        ((r.dayBreak) ? (' · ' + nsEsc(r.dayBreak) + ' 天亮才有') : '') +
        '</span>' +
        (done ? '<span class="rt-caught">✓ 图鉴已收录</span>' : '') +
        '</div>' +
      '<ul class="dx-why">' + why + '</ul></li>';
  }).join('');
  bindMonArt(ul);
  nsSet('#dx-rotom-meta', lockN
    ? ('先刷普通洛托姆 · 拿到后 5 种形态才开启（图鉴已收录 ' + doneN + ' / ' + rows.length + '）')
    : ('图鉴已收录 ' + doneN + ' / ' + rows.length +
      ' · 收录过（特殊相遇已用过）不可再选，已置灰 · 按点击顺序勾选 ' + pickN + ' 只' +
      (parkN ? ' · ' + parkN + ' 只条件不满足先跳过（条件回来接着刷）' : '')));
}

/* ---------------- 第三批：培育屋监测面板 ---------------- */
var nurserySig = '';
var nurseryUiEditAt = 0;

function nsEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* 闪光蛋预测：合并显示（无筛选项）。三类一次列全：
 *   闪光亲代 10 颗 / 吃果子闪光亲代 10 颗 / 普通亲代 3 颗。
 * 每颗格式：第 N 颗 → X号位 宝可梦名 [分类]。数据由 nursery-monitor 的
 * nextShinyInfo 纯读存档 + 本地哈希算出，只读、不改存档。 */
/* v1.23：三类（闪光亲代 / 吃果闪光亲代 / 普通亲代）合并成一张表，按产蛋序号 k 升序排列，
 * 不再有分类栏标题；每行行尾用一枚小标签标出类别，方便一眼看出是哪一类命中。 */
function nsPredRow(p, cat, hit) {
  if (!p) return '';
  var who = '';
  if (p.parent && p.parent.id) {
    var d = window.PCG_DEX_DATA;
    var nm = d && d.name ? d.name(p.parent.id) : ('#' + p.parent.id);
    who = (p.parent.slot != null ? (p.parent.slot + '号位 ') : '') + nm;
  }
  var when = p.step === 0 ? '下一颗' : ('再过 ' + p.step + ' 颗');
  return '<div class="od-row' + (hit ? ' hit' : '') + '">' +
    '<span>第 ' + (p.step + 1) + ' 颗' + (who ? ' → ' + nsEsc(who) : '') +
    '<i class="pred-tag pred-tag-' + (cat === '闪光亲代' ? 's' : cat === '吃果闪光亲代' ? 'f' : 'p') + '">' + nsEsc(cat) + '</i></span>' +
    '<b>' + nsEsc(when) + (p.k != null ? ' · k=' + p.k : '') + '</b></div>';
}
function nsRenderPrediction(pred) {
  window.__nsLastPred = pred || null;
  var box = document.getElementById('ns-next-shiny');
  var meta = document.getElementById('ns-next-meta');
  if (!box) return;
  if (!pred || (!pred.shinyList && !pred.plainList && !pred.flipShinyList)) {
    box.textContent = '—';
    if (meta) meta.textContent = '打开培育屋页后自动读取';
    return;
  }
  /* 三组合并：闪光亲代 10 / 吃果闪光亲代 10 / 普通亲代 3，统一按 k 升序 */
  var all = [];
  [['闪光亲代', pred.shinyList, 10], ['吃果闪光亲代', pred.flipShinyList, 10],
   ['普通亲代', pred.plainList, 3]].forEach(function (g) {
    (g[1] || []).slice(0, g[2]).forEach(function (it) {
      if (it) all.push({ row: it, cat: g[0] });
    });
  });
  all.sort(function (a, b) { return (a.row.k || 0) - (b.row.k || 0); });
  var nearestK = all.length ? all[0].row.k : null;
  var html = all.length
    ? all.map(function (x) {
        return nsPredRow(x.row, x.cat, x.row.k === nearestK);
      }).join('')
    : '<div class="od-row"><span>范围内暂无命中</span><b>—</b></div>';
  box.innerHTML = html;
  if (meta) {
    var bits = [];
    bits.push(pred.hasDitto === false ? '⚠ 无百变怪（0号位空缺）' : '0号位：百变怪 ✓');
    if (pred.poolSlots && pred.poolSlots.length) {
      bits.push('参与抽签：' + pred.poolSlots.join('/') + '号位');
    }
    if (pred.bx) bits.push('下一颗已吃果 ×2');
    meta.textContent = bits.join(' · ');
  }
}

/* 下一颗闪光：三类命中(k 从小到大)里最近的那个 k。k 是产蛋序号( laid + step )，
 * 玩家也叫它「孵蛋 K」。优先取闪光亲代，再吃果闪光亲代，最后普通亲代里 k 最小者。 */
function nsNextFlashK(pred) {
  if (!pred) return null;
  var lists = [pred.shinyList, pred.flipShinyList, pred.plainList];
  var best = null;
  for (var i = 0; i < lists.length; i++) {
    var arr = lists[i] || [];
    for (var j = 0; j < arr.length; j++) {
      var k = arr[j] && arr[j].k;
      if (!Number.isFinite(k)) continue;
      if (best === null || k < best) best = k;
    }
  }
  return best;
}

function nsShort(ms) {
  var v = Number(ms) || 0;
  if (v <= 0) return '就绪';
  var m = Math.ceil(v / 60000);
  if (m < 60) return m + ' 分';
  var h = Math.floor(m / 60);
  return h < 24 ? (h + ' 小时 ' + (m % 60) + ' 分') : (Math.floor(h / 24) + ' 天 ' + (h % 24) + ' 小时');
}

function nsSet(id, text) {
  var el = $(id);
  var t = String(text == null ? '' : text);
  if (el && el.textContent !== t) el.textContent = t;
}

function nurseryCfgFromUI() {
  var box = function (id) { var el = $(id); return !!(el && el.checked); };
  /* 第九十七批：「闪光蛋上补出中文名与金色描边」玩家要求默认开启并收起选项，
   * 配置层（nursery-monitor 的 sanitize）钉死 true，这里不再从界面读 ——
   * 元素已经不在页面上，硬读会读成 false 反而把它关掉。 */
  return {
    hud: box('#ns-hud'),
    hudAlways: box('#ns-hud-always'),
    autoHatch: box('#ns-auto-hatch'),
    autoHatchShiny: box('#ns-auto-hatch-shiny'),
    autoFeedEgg: box('#ns-auto-feed-egg'),
    shinyBerry: box('#ns-auto-shiny-berry'),
    autoJump: box('#ns-auto-jump')
  };
}

function nurserySyncCfgUI(cfg) {
  // 刚点过开关就别用页面状态把 UI 弹回去
  if (!cfg || Date.now() - nurseryUiEditAt < 3000) return;
  var map = { '#ns-hud': 'hud', '#ns-hud-always': 'hudAlways',
    '#ns-auto-hatch': 'autoHatch',
    '#ns-auto-hatch-shiny': 'autoHatchShiny',
    '#ns-auto-feed-egg': 'autoFeedEgg', '#ns-auto-shiny-berry': 'shinyBerry',
    '#ns-auto-jump': 'autoJump' };
  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (!el) return;
    var on = !!cfg[map[id]];
    if (el.checked !== on) el.checked = on;
  });
  nsSyncShinyLock();
}

/* 第六十一批：两个取蛋开关改成正经的互斥（「取所有蛋」是「只取非闪光」的超集）。
 * 以前是「前一项没勾就把后一项点灰」，现在两个都能单独开，但只能开一个。 */
function nsSyncShinyLock() {
  var all = $('#ns-auto-hatch-shiny');
  var main = $('#ns-auto-hatch');
  if (!all || !main) return;
  if (all.checked && main.checked) main.checked = false;
}

/* ---------------- 第一百一十批：路闪监测 ----------------
 * 记录由 shiny-guard.js 写进 chrome.storage.local（pcgRoadShinyV1）：
 *   { cur: 本次游戏页会话编号, records: [...] }
 * 弹窗直接读本地，不依赖游戏页在线；sess === cur 的是「本次」，其余是「历史」。
 * 立绘用网页游戏自己的闪光立绘资源，加载失败再退回闪光精灵图。 */
var ROAD_KEY = 'pcgRoadShinyV1';
var ROAD_ART = 'https://pokecatch-online.pages.dev/assets/pokemon/art/shiny/still/';
var ROAD_ART_FB = 'https://pokecatch-online.pages.dev/assets/pokemon/shiny/';
var roadSig = '';

function roadTime(t) {
  function p(n) { return (n < 10 ? '0' : '') + n; }
  try {
    var d = new Date(Number(t) || 0);
    if (!isFinite(d.getTime())) return '—';
    return d.getFullYear() + '/' + p(d.getMonth() + 1) + '/' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  } catch (e) { return '—'; }
}

function roadRow(r) {
  var id = Number(r.id) || 0;
  var caught = !!r.caught;
  var art = id ? (ROAD_ART + id + '.png') : '';
  var name = nsEsc(r.name || (id ? '#' + id : '未知宝可梦'));
  var lv = Number(r.level) || 0;
  var chapter = nsEsc(r.chapterName || '未知章节');
  var region = nsEsc(r.region || '');
  var weather = nsEsc(r.weather || '未知');
  return '<li class="rs-row' + (caught ? ' rs-got' : '') + '">' +
    (art ? '<img class="rs-art" src="' + art + '" data-id="' + id + '" alt="">'
      : '<span class="rs-art rs-art-none">?</span>') +
    '<div class="rs-main">' +
    '<div class="rs-line1"><b>' + name + '</b>' +
    '<small>#' + (id || '?') + (lv ? ' · Lv.' + lv : '') + '</small>' +
    '<span class="rs-tag ' + (caught ? 'ok' : 'no') + '">' +
    (caught ? '捕捉成功' : '捕捉失败') + '</span></div>' +
    '<div class="rs-line2">' + roadTime(r.at) + '</div>' +
    '<div class="rs-line3">' + chapter + (region ? ' · ' + region : '') +
    ' · ' + weather + '</div>' +
    '</div></li>';
}

/* MV3 弹窗不允许内联 onerror，图片兜底改用 JS 绑定 */
function roadBindArt(ul) {
  var imgs = ul.querySelectorAll('.rs-art[data-id]');
  for (var i = 0; i < imgs.length; i++) {
    (function (img) {
      img.addEventListener('error', function () {
        var id = img.getAttribute('data-id');
        if (img.src.indexOf('/art/shiny/still/') >= 0) img.src = ROAD_ART_FB + id + '.png';
        else img.style.visibility = 'hidden';
      });
    })(imgs[i]);
  }
}

function roadList(ul, rows, emptyText) {
  if (!rows.length) { ul.innerHTML = '<li class="empty">' + emptyText + '</li>'; return; }
  var list = rows.slice().sort(function (a, b) {
    return (Number(b.at) || 0) - (Number(a.at) || 0);
  });
  ul.innerHTML = list.slice(0, 60).map(roadRow).join('');
  roadBindArt(ul);
}

function renderRoadShiny(force) {
  var ulNow = document.getElementById('rs-now-list');
  var ulHist = document.getElementById('rs-hist-list');
  if (!ulNow || !ulHist) return;
  try {
    chrome.storage.local.get(ROAD_KEY, function (v) {
      var d = (v && v[ROAD_KEY]) || {};
      var cur = d.cur || '';
      /* 第一百一十一批：只显示明确标成野生闪光的记录；上一版没 src 标记的
       * 记录可能混着异色团体战 boss，页面侧启动时已经清掉，这里再兜一层。
       * 第一百一十八批：显示层再加一道真实性校验 —— 没有有效图鉴号、名字
       * 是「未知宝可梦 / #?」占位、或带 raid / boss 标记的一律不显示，
       * 也不计入本次/历史统计。判定内联，切片验证里同样能跑。 */
      var rows = (Array.isArray(d.records) ? d.records : []).filter(function (r) {
        if (!r || r.src !== 'wild' || r.raid || r.boss || r.fromRaid) return false;
        /* v1.38：历史记录照常显示（含升级前没有 shiny 字段的旧记录），保证更新
         * 插件后历史不丢；新记录只记真实闪光，把关在写入端 shiny-guard.js。 */
        if (!(Number(r.id) > 0)) return false;
        var nm = String(r.name || '');
        if (!nm || nm === '未知宝可梦' || nm.charAt(0) === '#') return false;
        return true;
      });
      var last = rows.length ? rows[rows.length - 1] : null;
      var sig = String(cur) + '|' + rows.length + '|' + (last ? last.at : '');
      if (!force && sig === roadSig) return;
      roadSig = sig;
      var now = [], hist = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i] || {};
        (r.sess === cur ? now : hist).push(r);
      }
      var got = now.filter(function (r) { return !!r.caught; }).length;
      var sum = document.getElementById('rs-sum');
      if (sum) sum.textContent = '本次 ' + now.length + ' 只 · 捕捉成功 ' + got +
        ' 只　|　历史 ' + hist.length + ' 只';
      var brief = document.getElementById('brief-roadshiny');
      if (brief) {
        brief.textContent = now.length ? ('本次 ' + now.length + ' 只') : '未记录';
        try { brief.setAttribute('data-state', now.length ? 'on' : 'idle'); } catch (e) { /* ignore */ }
      }
      roadList(ulNow, now, '这一轮还没遇到野外闪光');
      roadList(ulHist, hist, '暂无历史记录');
    });
  } catch (e) { /* storage 读不到就安静跳过 */ }
}

function renderNursery(n) {
  var refreshBtn = $('#ns-refresh');
  var clearBtn = $('#ns-clear');
  if (refreshBtn) refreshBtn.disabled = !n;
  if (clearBtn) clearBtn.disabled = !n;

  if (!n || !n.ok) {
    var nsBlankKey = n ? 'no-save' : 'no-hook';
    if (blankShown.nursery !== nsBlankKey) {
      blankShown.nursery = nsBlankKey;
      setBrief('#brief-nursery', n ? '读不到存档' : '未连接', 'err');
      runLine('#ns-phase', 'err', null,
        n ? '读不到游戏存档：先打开游戏页并登录' : '打开 Poke\'Catch 页面后可用');
      var briefOff = document.querySelector('#brief-nursery');
      if (briefOff && briefOff.classList.contains('ns-brief-gold')) {
        briefOff.classList.remove('ns-brief-gold');
      }
      ['#ns-eggs-n', '#ns-ready', '#ns-soon', '#ns-laid']
        .forEach(function (id) { nsSet(id, '—'); });
      nsSet('#ns-egg-meta', '');
      nsSet('#ns-parent-meta', '');
      nsSet('#ns-rate-meta', '');
      nsSet('#ns-note', n ? '读不到游戏存档：先打开游戏页并登录' : '打开 Poke\'Catch 页面后可用');
      var tips = n ? '读不到存档' : '未连接游戏页';
      $('#ns-eggs').innerHTML = '<li class="empty">' + tips + '</li>';
      $('#ns-parents').innerHTML = '<li class="empty">' + tips + '</li>';
      $('#ns-events').innerHTML = '<li class="empty">还没有新事件</li>';
      var oddsOff = $('#ns-odds');
      if (oddsOff) oddsOff.innerHTML = '';
      var predOff = $('#ns-next-shiny');
      if (predOff) predOff.textContent = '—';
      var predMeta = $('#ns-next-meta');
      if (predMeta) predMeta.textContent = '打开培育屋页后自动读取';
      window.__nsLastPred = null;
      $('#ns-stats').innerHTML = '';
      nurserySig = '';
    }
    return;
  }
  blankShown.nursery = '';

  nurserySyncCfgUI(n.cfg);
  var s = n.slots || {}, sum = n.summary || {}, lay = n.laying || {};
  var sh = n.shiny || {}, st = n.stats || {}, game = n.game || {};
  var eggs = n.eggs || [], parents = n.parents || [], events = n.events || [];

  nsSet('#ns-eggs-n', s.eggs + ' / ' + s.maxEggs);
  nsSet('#ns-ready', sum.ready + ' / ' + sum.shinyEggs);
  /* v1.25：「下一颗闪光」格改为显示相对颗数「再过 N 颗」（N = k - laid），
   * 不再写产蛋序号 k；旁边第 4 格仍显示自己的孵蛋 K（laid）。 */
  var nextK = nsNextFlashK(n.nextShiny);
  var laidK = Number.isFinite(n.nextShiny && n.nextShiny.laid) ? n.nextShiny.laid : null;
  var nextStep = (nextK != null && laidK != null) ? Math.max(0, nextK - laidK) : null;
  nsSet('#ns-soon', nextStep != null
    ? (nextStep === 0 ? '下一颗' : ('再过 ' + nextStep + ' 颗'))
    : (nextK != null ? ('第 ' + nextK + ' 颗') : '—'));
  nsSet('#ns-laid', laidK != null ? String(laidK) : '—');
  var readyEl = $('#ns-ready');
  if (readyEl) {
    var nsReadyCls = sum.shinyEggs ? 'gold' : '';
    if (readyEl.className !== nsReadyCls) readyEl.className = nsReadyCls;
  }
  /* 第九十七批：玩家要求删掉「生蛋进度 …」那条长说明（连同上面的进度条），
   * 生蛋进度仍然写在第二行运行状态里（「· 生蛋 100%」），数据没丢。 */
  nsSet('#ns-egg-meta', '空位 ' + (s.freeEggs || 0) + ' · 时钟' + (n.clock && n.clock.src === 'dom' ? '已校准' : '估算'));
  nsSet('#ns-parent-meta', '等级与经验进度取自培育屋页面');
  nsSet('#ns-rate-meta', sh.hint || '');
  /* 第七十九批：把「这一拍为什么没收蛋」也写出来 —— 以前只写「正在读培育屋页面」，
   * 玩家只能看到催蛋在吃果子，完全不知道收蛋卡在哪一步。 */
  nsSet('#ns-note', (n.note || '') + (n.screen ? ' · 正在读培育屋页面' : ' · 打开培育屋页可校准倒计时') +
    (n.eggWhy ? ' · 收蛋：' + n.eggWhy : '') + (n.feeding ? ' · 正在催蛋' : ''));
  /* 第二十批：第二行运行状态 + 右上角徽标 */
  var nsEggs = Number(s.eggs) || 0;
  var nsCfg = n.cfg || {};
  runLine('#ns-phase', 'on', null,
    '监测 ' + nsEggs + ' / ' + (s.maxEggs || 0) + ' 颗蛋位 · 可孵 ' + (sum.ready || 0) +
    (sum.shinyEggs ? ' · 闪光 ' + sum.shinyEggs : '') +
    (lay.active ? ' · 生蛋 ' + lay.pct + '%' : '') +
    (nsCfg.eggTakeAll ? ' · 自动收蛋（含闪光）'
      : (nsCfg.autoHatch ? ' · 自动收蛋（不含闪光）' : '')) +
    (nsCfg.eggBerry ? ' · 催蛋吃果' : '') +
    (nsCfg.shinyBerry ? ' · 靛莓果闪光' : ''));
  setBrief('#brief-nursery', sum.shinyEggs
    ? ('运行中 · ✦ ' + sum.shinyEggs + ' 只闪耀')
    : ('运行中 · ' + (sum.ready ? ('可孵 ' + sum.ready) : (nsEggs + ' 颗蛋'))), 'on');
  /* 第一处：有闪光蛋时，右上角摘要换成金色艺术字。
   * 先判断再改：classList.remove 即使 token 不存在也会产生一次 attribute mutation，
   * 一秒一次的无意义写入会让这个摘要节点跟着读秒动。 */
  var brief = document.querySelector('#brief-nursery');
  if (brief) {
    var nsGold = brief.classList.contains('ns-brief-gold');
    if (sum.shinyEggs && !nsGold) brief.classList.add('ns-brief-gold');
    else if (!sum.shinyEggs && nsGold) brief.classList.remove('ns-brief-gold');
  }

  // 面板每秒拉一次状态，签名没变就不重绘列表，避免滚动位置跳动
  var sig = JSON.stringify([
    s.eggs, s.maxEggs, s.parents, s.maxParents, sum.ready, sum.shinyEggs,
    Math.floor((sum.soonestMs || 0) / 60000), Math.floor((lay.remainMs || 0) / 60000), lay.pct,
    game.hatched, st.eggsSeen, st.shinySeen, st.hatched, st.removed, st.autoHatched, st.autoFed,
    sh.label, sh.currentKey, (n.offspring || []).length,
    eggs.map(function (e) { return [e.uid, e.ready, e.shiny, Math.floor(e.remainMs / 60000), Math.floor(e.pct)]; }),
    parents.map(function (p) { return [p.uid, p.shiny, p.level, p.gauge, p.xpPct]; }),
    events.slice(0, 12).map(function (ev) { return [ev.t, ev.text]; })
  ]);
  /* 闪光蛋预测（合并显示）：放在签名 return 之前，确保每次都拿到最新推算 */
  nsRenderPrediction(n.nextShiny);
  if (sig === nurserySig) return;
  nurserySig = sig;

  var html = '';
  if (!eggs.length) {
    html = '<li class="empty">培育屋里还没有蛋（放百变怪 + 可繁殖亲代就会开始产蛋）</li>';
  } else {
    eggs.slice(0, 8).forEach(function (e) {
      /* 不显示英文名 / 英文地区名，只留中文名与编号 */
      html += '<li class="' + (e.ready ? 'rd ' : '') + (e.shiny ? 'sh' : '') + '">' +
        '<span class="nm">' + monArtHtml(e.id, e.shiny) +
        nsEsc(e.name) + (e.shiny ? shinyIco() : '') + '</span>' +
        '<span class="ns-mini"><i style="width:' + (e.pct || 0) + '%"></i></span>' +
        '<span class="tm">' + (e.ready ? '可孵' : nsShort(e.remainMs)) + '</span></li>';
    });
  }
  $('#ns-eggs').innerHTML = html;

  html = '';
  if (!parents.length) html = '<li class="empty">培育屋里没有宝可梦</li>';
  else parents.slice(0, 8).forEach(function (p) {
    /* 第三处 = 等级；第四处 = 经验获取进度 */
    var xp = (p.xpPct == null ? p.gauge : p.xpPct);
    html += '<li class="' + (p.shiny ? 'sh' : '') + '">' +
      '<span class="nm">' + monArtHtml(p.id, p.shiny) +
      nsEsc(p.name) + (p.shiny ? shinyIco() : '') + '</span>' +
      '<span class="ns-lv">Lv.' + (p.level || 0) + '</span>' +
      '<span class="ns-xp" title="经验获取进度"><i style="width:' +
        (xp == null ? 0 : Math.max(0, Math.min(100, xp))) + '%"></i></span>' +
      '<span class="ns-xp-t">' + (xp == null ? '—' : xp + '%') + '</span></li>';
  });
  $('#ns-parents').innerHTML = html;
  bindMonArt($('#ns-eggs'));
  bindMonArt($('#ns-parents'));

  /* 直白版闪光概率：当前这组亲代能孵出什么、每颗蛋多少概率、各档位对照 */
  var offs = n.offspring || [];
  var odds = sh.odds || [];
  var curKey = sh.currentKey || 'base';
  var lead = '当前培育屋里的 <b>' + (s.parents || 0) + '</b> 只亲代，' +
    '每产出一颗蛋，孵出闪光宝可梦的概率是 <b>' + nsEsc(sh.label || '—') + '</b>' +
    (sh.avgEggs ? '（平均约 ' + sh.avgEggs + ' 颗出 1 只）' : '') + '。';
  var oddHtml = '<div class="od-lead">' + lead + '</div>';
  if (offs.length) {
    oddHtml += '<div class="od-row"><span>能孵出的宝可梦（' + offs.length + ' 种）</span><b>' +
      offs.slice(0, 3).map(function (o) {
        return monArtHtml(o.id, false, 'mon-art-s') + nsEsc(o.name);
      }).join('、') +
      (offs.length > 3 ? ' 等' : '') + '</b></div>';
    oddHtml += '<div class="od-row hit"><span>上面每一种的闪光概率</span><b>' +
      nsEsc(sh.label || '—') + ' / 颗</b></div>';
  } else {
    oddHtml += '<div class="od-row"><span>可孵出的宝可梦</span><b>需放入百变怪 + 可繁殖亲代</b></div>';
  }
  odds.forEach(function (o) {
    oddHtml += '<div class="od-row' + (o.key === curKey ? ' hit' : '') + '">' +
      '<span>' + (o.key === curKey ? '✓ ' : '') + nsEsc(o.label) + '</span><b>' +
      nsEsc(o.text) + '</b></div>';
  });
  oddHtml += '<div class="od-foot">打勾的是你当前这组亲代命中的档位；概率按「每颗蛋」计算，' +
    '闪光亲代与护符加成不会叠乘，游戏只取最高档。</div>';
  var oddsEl = $('#ns-odds');
  if (oddsEl) { oddsEl.innerHTML = oddHtml; bindMonArt(oddsEl); }

  var observed = st.eggsSeen || 0;
  var realRate = observed ? (Math.round((st.shinySeen || 0) / observed * 10000) / 100) + '%' : '—';
  $('#ns-stats').innerHTML =
    '<div><span>实测闪光</span><b>' + (st.shinySeen || 0) + ' / ' + observed + ' · ' + realRate + '</b></div>' +
    '<div><span>亲眼见过的新蛋</span><b>' + observed + ' 颗</b></div>' +
    '<div><span>自动孵蛋 / 自动喂果</span><b>' + (st.autoHatched || 0) + ' 颗 / ' +
      (st.autoFed || 0) + ' 颗</b></div>';

  html = '';
  if (!events.length) html = '<li class="empty">还没有新事件；新蛋、孵化、闪光会在出现时记下来</li>';
  else events.slice(0, 12).forEach(function (ev) {
    html += '<li class="' + (ev.shiny ? 'sh' : '') + '">' +
      '<span class="tm">' + nsEsc(fmtTime(ev.t)) + '</span>' +
      '<span class="nm">' + nsEsc(ev.text) + '</span></li>';
  });
  $('#ns-events').innerHTML = html;
}

/* ---------------- 第四批：黑市扫货面板 ---------------- */
var marketSig = '';
var marketUiEditAt = 0;
var marketMsg = { at: 0, text: '' };

function mkMoney(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
function mkShinyLabel(v) {
  return v === 'only' ? '只闪光' : (v === 'no' ? '不要闪光' : '闪光不限');
}
function marketCfgFromUI() {
  var box = function (id) { var el = $(id); return !!(el && el.checked); };
  var val = function (id) { var el = $(id); return el ? el.value : ''; };
  return {
    dryRun: box('#mk-dry'),
    /* 第五十五批：自动切黑市页 / 切回原页面 / 最低价优先三项默认开启且隐藏，
     * 这里直接钉死，不读已经删掉的控件；market-sniper.js 的 sanitizeCfg() 同样钉死。 */
    autoOpen: true,
    restoreScreen: true,
    hud: box('#mk-hud'),
    intervalSec: parseInt(val('#mk-interval'), 10) || 60,
    idleSec: parseInt(val('#mk-idle'), 10) || 0,
    /* 「本次最多买 / 保留余额」已按反馈删掉；每条意向默认每轮只买 1 只 */
    maxPerRun: 0,
    reserve: 0,
    sortBy: 'cheap'
  };
}
function marketSyncCfgUI(cfg) {
  // 刚点过开关就别用页面状态把 UI 弹回去
  if (!cfg || Date.now() - marketUiEditAt < 3000) return;
  var checks = { '#mk-dry': 'dryRun', '#mk-hud': 'hud' };
  Object.keys(checks).forEach(function (id) {
    var el = $(id);
    if (!el) return;
    var on = !!cfg[checks[id]];
    if (el.checked !== on) el.checked = on;
  });
  var nums = {
    '#mk-interval': 'intervalSec', '#mk-idle': 'idleSec'
  };
  Object.keys(nums).forEach(function (id) {
    var el = $(id);
    if (el && document.activeElement !== el && String(el.value) !== String(cfg[nums[id]])) {
      el.value = cfg[nums[id]];
    }
  });
  /* 第五十五批：命中排序下拉已经收起，固定最低价优先，不再回填 */
}

function renderMarket(m) {
  var phase = $('#mk-phase');
  var rulesEl = $('#mk-rules');
  if (!phase || !rulesEl) return;
  var scanBtn = $('#mk-scan'), startBtn = $('#mk-now'),
    stopBtn = $('#mk-stop'), clearBtn = $('#mk-clear'), addBtn = $('#mk-add-btn');
  [scanBtn, startBtn, clearBtn, addBtn].forEach(function (b) { if (b) b.disabled = !m; });
  if (stopBtn) stopBtn.disabled = !m || !m.armed;

  if (!m || !m.ok) {
    var mkBlankKey = m ? 'no-save' : 'no-hook';
    if (blankShown.market !== mkBlankKey) {
      blankShown.market = mkBlankKey;
      ['#mk-today', '#mk-left', '#mk-hit', '#mk-bought', '#mk-wallet', '#mk-cache']
        .forEach(function (id) { nsSet(id, '—'); });
      var hitOff = $('#mk-hit');
      if (hitOff) hitOff.className = '';
      runLine('#mk-phase', 'err', null, disconnectedText() + ' · 先打开游戏页并登录');
      nsSet('#mk-sum', m ? '读不到黑市数据' : '打开 Poke\'Catch 页面后可用');
      nsSet('#mk-rule-meta', '');
      nsSet('#mk-hit-meta', '');
      nsSet('#mk-buy-meta', '');
      nsSet('#mk-event-meta', '');
      nsSet('#mk-note', m ? '先打开游戏页并登录' : '打开游戏页后会自动读取黑市商品缓存');
      rulesEl.innerHTML = '<li class="empty">还没有意向</li>';
      var mkMatchesEl0 = $('#mk-matches');
      if (mkMatchesEl0) mkMatchesEl0.innerHTML = '<li class="empty">还没读到商品</li>';
      $('#mk-hits').innerHTML = '<li class="empty">还没买过东西</li>';
      $('#mk-events').innerHTML = '<li class="empty">还没有事件</li>';
      setBrief('#brief-market', '未连接', 'err');
      marketSig = '';
    }
    return;
  }
  blankShown.market = '';

  marketSyncCfgUI(m.cfg);
  var t = m.today || {}, st = m.stats || {}, cfg = m.cfg || {}, K = m.consts || {};
  var buys = K.BUYS || 3, shinyBuys = K.SHINY_BUYS || 1;
  nsSet('#mk-today', (t.n || 0) + ' / ' + buys);
  /* 第一处：只显示「还能买几只闪光」，不再混着普通剩余次数 */
  nsSet('#mk-left', (t.shinyLeft == null ? 0 : t.shinyLeft) + ' / ' + shinyBuys + ' 次');
  var leftEl = $('#mk-left');
  if (leftEl) {
    var mkLeftCls = t.shinyLeft > 0 ? 'gold' : '';
    if (leftEl.className !== mkLeftCls) leftEl.className = mkLeftCls;
  }
  /* 第二处：在售总数 / 其中闪光数 */
  var hitEl = $('#mk-hit');
  nsSet('#mk-hit', (m.listings || 0) + ' / ' + (m.shinyListings || 0));
  if (hitEl) {
    var mkHitCls = m.shinyListings > 0 ? 'gold' : '';
    if (hitEl.className !== mkHitCls) hitEl.className = mkHitCls;
  }
  /* 第三十批：格子窄，「2 只 / 21 800 ₽」会被截断，去掉「只」字 */
  nsSet('#mk-bought', (st.bought || 0) + ' / ' + mkMoney(st.spent) + ' ₽');
  nsSet('#mk-wallet', m.wallet ? mkMoney(m.wallet) + ' ₽' : '—');
  nsSet('#mk-cache', m.cacheAge || '—');
  /* 第二十批：第二行运行状态 + 右上角徽标 */
  runLine('#mk-phase', m.armed ? 'on' : 'off', null,
    m.armed
      ? ((m.phase || '扫货中') + (cfg.dryRun ? '（试运行）' : '') +
        (m.screen ? ' · 正在读黑市页' : ''))
      : (m.unlocked === false ? '黑市还没解锁' : '点「开始扫货」启动'));
  nsSet('#mk-sum', '已扫描 ' + (st.scans || 0) +
    ' 次 · 命中 ' + (st.hits || 0) + ' 次 · 跳过 ' + (st.skipped || 0) +
    ' · 失败 ' + (st.failed || 0) + (m.unlocked ? '' : ' · 黑市未解锁'));
  nsSet('#mk-rule-meta', (m.validRules || 0) + ' 条生效 / ' + (m.rules || []).length + ' 条');
  nsSet('#mk-hit-meta', m.screen ? '正在读黑市页' : '来自商品缓存');
  /* 第三十批：命中商品栏 = 买成的记录（只在内存里，关掉浏览器才清空） */
  var mkBuys = m.buys || [];
  var mkSpentAll = 0;
  mkBuys.forEach(function (b) { mkSpentAll += Number(b.price) || 0; });
  nsSet('#mk-buy-meta', mkBuys.length
    ? ('本次会话 ' + mkBuys.length + ' 笔 · ' + mkMoney(mkSpentAll) + ' ₽')
    : '本次会话');
  nsSet('#mk-event-meta', '本次页面会话');
  var msg = (marketMsg.text && Date.now() - marketMsg.at < 8000) ? marketMsg.text : (m.note || '');
  nsSet('#mk-note', msg);
  var mkHits = (m.matches ? m.matches.length : 0);
  setBrief('#brief-market', m.armed ? ('运行中 · 命中 ' + mkHits) : '未启动',
    m.armed ? 'on' : 'off');

  // 面板每秒拉一次状态，列表签名没变就不重绘，避免滚动位置跳动
  var sig = JSON.stringify([
    m.armed, m.phase, t.n, t.shiny, t.left, t.shinyLeft, m.listings, m.shinyListings,
    st.scans, st.hits, st.bought, st.spent, m.wallet, m.cacheAt,
    (m.rules || []).map(function (r) {
      return [r.id, r.name, r.maxPrice, r.shiny, r.qty, r.enabled, r.bought];
    }),
    (m.matches || []).map(function (h) { return [h.id, h.price, h.handled]; }),
    (m.overBudget || []).map(function (h) { return [h.id, h.price]; }),
    (m.buys || []).map(function (b) { return [b.t, b.label, b.price]; }),
    (m.events || []).slice(0, 10).map(function (e) { return [e.t, e.text, e.level]; })
  ]);
  if (sig === marketSig) return;
  marketSig = sig;

  var html = '';
  var rlist = m.rules || [];
  if (!rlist.length) html = '<li class="empty">还没有意向：填宝可梦 + 意向价格，点「添加」</li>';
  else rlist.forEach(function (r) {
    /* 第三十批：数量 + 已买数量写进名字下面一行，别把价格 / 删按钮挤出去 */
    html += '<li class="' + (r.enabled ? '' : 'off') + '">' +
      '<input class="mk-tog" type="checkbox" data-act="toggle" data-id="' + nsEsc(r.id) + '"' +
        (r.enabled ? ' checked' : '') + ' title="启用 / 停用">' +
      '<span class="nm">' + nsEsc(r.name) + ' <span class="tag">' +
        nsEsc(mkShinyLabel(r.shiny)) + '</span>' +
        '<em class="mk-meta" title="这条意向总共要买几只（买够就自动移出意向表）">意向 ' +
        (r.qty || 1) + ' · 已买 ' + (r.bought || 0) + '</em></span>' +
      '<span class="pr">≤ ' + mkMoney(r.maxPrice) + ' ₽</span>' +
      '<button class="mk-act del" type="button" data-act="remove" data-id="' +
        nsEsc(r.id) + '">删</button></li>';
  });
  rulesEl.innerHTML = html;

  html = '';
  var hits = m.matches || [];
  if (!hits.length) html = '<li class="empty">还没有符合意向的在售商品</li>';
  else hits.slice(0, 12).forEach(function (h) {
    html += '<li class="' + (h.shiny ? 'sh ' : '') + (h.handled ? 'done' : '') + '">' +
      '<span class="nm">' + nsEsc(h.label) + (h.handled ? ' · 已处理' : '') + '</span>' +
      '<span class="pr">' + mkMoney(h.price) + ' / ≤' + mkMoney(h.rulePrice) + ' ₽</span></li>';
  });
  var matchesEl = $('#mk-matches');
  if (matchesEl) matchesEl.innerHTML = html;

  /* 命中商品：每买成一笔记一行，一直留到关掉浏览器 */
  html = '';
  if (!mkBuys.length) html = '<li class="empty">每买成一笔都会记在这里，关掉浏览器才清空</li>';
  else mkBuys.slice(0, 20).forEach(function (b) {
    html += '<li class="buy' + (b.shiny ? ' sh' : '') + '">' +
      '<span class="tm">' + nsEsc(fmtTime(b.t)) + '</span>' +
      '<span class="nm">' + nsEsc(b.label) + (b.rule ? ' · ' + nsEsc(b.rule) : '') + '</span>' +
      '<span class="pr">' + mkMoney(b.price) + ' ₽</span></li>';
  });
  $('#mk-hits').innerHTML = html;

  html = '';
  var evs = m.events || [];
  if (!evs.length) html = '<li class="empty">还没有事件；上架命中、成交、跳过都会记下来</li>';
  else evs.slice(0, 12).forEach(function (e) {
    html += '<li class="' + (e.level === 'ok' ? 'ev-ok' : (e.level === 'warn' ? 'ev-warn' : '')) + '">' +
      '<span class="tm">' + nsEsc(fmtTime(e.t)) + '</span>' +
      '<span class="nm">' + nsEsc(e.text) + '</span></li>';
  });
  $('#mk-events').innerHTML = html;
}

/* ---------------- 第五十八批：定点循环（orb.js） ----------------
 * 面板里的「地区 / 章节 / 步骤」三个下拉全部由 chapters-data.js（window.__PCG_CH__）
 * 现算：章节只列本地区的，联盟那 5 章合成一个入口，步骤换成「打到第几位」。
 * 数据取不到时下拉留空，同时提示刷新游戏页 —— 不会静默点不动。 */
var lastOrb = null;

function orbPointData() {
  return (typeof window !== 'undefined' && window.__PCG_CH__) || [];
}
function orbRegionOf(ch) {
  if (ch <= 13) return 'kanto';
  if (ch <= 30) return 'johto';
  if (ch <= 47) return 'hoenn';
  if (ch <= 65) return 'sinnoh';
  return 'unova';
}
/* 合众有「尘土」现象的章节（按步骤 bg=cave/mountain 筛出来的 0 基下标） */
var DUST_CHAPTERS = [67, 69, 71, 72, 73, 74, 76, 81, 82, 83];
/* 每趟出尘土的大致概率 = 1-(0.925^洞窟步数) */
var DUST_PCT = { 67: '7%', 69: '7%', 71: '7%', 72: '14%', 73: '21%', 74: '7%', 76: '7%', 81: '7%', 82: '7%', 83: '7%' };
var DUST_DEFAULT_A = 73;   // 第 74 章 冰柱徽章（3 个洞窟步，21%）
var DUST_DEFAULT_B = 72;   // 第 73 章 喷射徽章（2 个洞窟步，14%）

function orbFillCh(region, ch) {
  var sel = $('#point-ch');
  if (!sel) return;
  sel.textContent = '';
  var seenLeague = false;
  var dustOnly = !!settings.dustDual;
  orbPointData().forEach(function (c, i) {
    if (!c || c[0] !== region) return;
    if (dustOnly && region === 'unova' && DUST_CHAPTERS.indexOf(i) < 0) return;
    if (c[3]) { if (seenLeague) return; seenLeague = true; }
    var o = document.createElement('option');
    o.value = String(i);
    o.textContent = (i + 1) + '. ' + (c[3] ? '联盟（四天王 + 冠军）' : c[1]) + (dustOnly && DUST_PCT[i] ? '（尘土≈' + DUST_PCT[i] + '）' : '');
    sel.appendChild(o);
  });
  if (ch != null && ch >= 0) sel.value = String(ch);
  var sel2 = $('#point-ch2');
  if (sel2) {
    sel2.textContent = '';
    var first2 = null;
    orbPointData().forEach(function (c, i) {
      if (!c || c[0] !== region || c[3]) return;
      if (dustOnly && region === 'unova' && DUST_CHAPTERS.indexOf(i) < 0) return;
      var o2 = document.createElement('option');
      o2.value = String(i); o2.textContent = (i + 1) + '. ' + c[1] + (dustOnly && DUST_PCT[i] ? '（尘土≈' + DUST_PCT[i] + '）' : '');
      sel2.appendChild(o2);
      if (first2 == null) first2 = i;
    });
    var keep2 = Number(settings.pointCh2);
    if (dustOnly && region === 'unova') {
      if (!(keep2 >= 0) || DUST_CHAPTERS.indexOf(keep2) < 0) {
        if (DUST_CHAPTERS.indexOf(DUST_DEFAULT_B) >= 0) sel2.value = String(DUST_DEFAULT_B);
      } else sel2.value = String(keep2);
      if (Number(settings.pointCh) < 0 || DUST_CHAPTERS.indexOf(Number(settings.pointCh)) < 0) {
        if (DUST_CHAPTERS.indexOf(DUST_DEFAULT_A) >= 0) sel.value = String(DUST_DEFAULT_A);
      }
    } else if (keep2 >= 0) sel2.value = String(keep2);
    else if (first2 != null) sel2.value = String(first2);
  }
  orbFillStep(sel.value, null);
}
/* 第六十五批：点位下拉改成**时间线第几个点**（跟下载版引擎同一套口径）。
 * 旧版按「第几步」存，引擎却按「连续同名节点合并后的第 N 段」去找位置 ——
 * 龙之洞那种一段几十个节点的章会整整点偏一大截，这就是「定点循环是坏的」的根因。
 * 这里把章节数据的步骤按节点展开：route 步 = 野怪 + 训练家 + 道具格 个节点，其它步 1 个，
 * 每行写「第 N 个点 · 步骤名」，值 = 节点下标（0 起）。 */
function orbNodeList(chIdx) {
  var c = orbPointData()[Number(chIdx)];
  var out = [];
  ((c && c[2]) || []).forEach(function (s, j) {
    if (!s) return;
    var n = (s[1] === 'route')
      ? (Number(s[2]) || 0) + (Number(s[3]) || 0) + (s[4] ? 1 : 0)
      : 1;
    if (!(n > 0)) n = 1;
    for (var k = 0; k < n; k++) {
      out.push({ i: out.length, name: s[0] || ('第 ' + (j + 1) + ' 步'), k: k, n: n });
    }
  });
  return out;
}
/* 当前是联盟第几关（1~5）；不是联盟章返回 0 */
function orbLeagueSlotOf(ch) {
  var d = orbPointData();
  ch = Number(ch);
  if (!d[ch] || !d[ch][3]) return 0;
  var st = ch;
  while (st > 0 && d[st - 1] && d[st - 1][3]) st--;
  return Math.min(5, ch - st + 1);
}
function orbFillStep(chIdx, step) {
  var sel = $('#point-step');
  if (!sel) return;
  sel.textContent = '';
  var c = orbPointData()[Number(chIdx)];
  if (c && c[3]) {
    var CHL = orbPointData();
    var lstart = Number(chIdx);
    while (lstart > 0 && CHL[lstart - 1] && CHL[lstart - 1][3]) lstart--;
    var lnames = [];
    for (var lk = 0; lk < 5; lk++) {
      var e2 = CHL[lstart + lk];
      lnames.push(e2 ? String(e2[1]).replace(/^四天王[：:]\s*/, '') : ('第 ' + (lk + 1) + ' 位'));
    }
    [['105', '打到冠军（' + lnames[4] + '）'],
      ['104', '只打到第 4 位（' + lnames[3] + '）'],
      ['103', '只打到第 3 位（' + lnames[2] + '）'],
      ['102', '只打到第 2 位（' + lnames[1] + '）'],
      ['101', '只打到第 1 位（' + lnames[0] + '）']].forEach(function (o) {
      var el = document.createElement('option');
      el.value = o[0];
      el.textContent = o[1];
      sel.appendChild(el);
    });
    if (step != null && step >= 0) sel.value = String(step >= 101 ? step : 105);
    return;
  }
  orbNodeList(Number(chIdx)).forEach(function (nd) {
    var o = document.createElement('option');
    o.value = String(nd.i);
    o.textContent = (nd.i + 1) + '. ' + nd.name + (nd.n > 1 ? '（' + (nd.k + 1) + '/' + nd.n + '）' : '');
    sel.appendChild(o);
  });
  if (step != null && step >= 0) sel.value = String(step);
}
function orbUiFill(orb) {
  var ch = Number(orb && orb.pointCh);
  var reg = ch >= 0 ? orbRegionOf(ch) : (settings.pointRegion || 'kanto');
  var r = $('#point-region');
  if (r) r.value = reg;
  orbFillCh(reg, ch >= 0 ? ch : null);
  var selCh = $('#point-ch');
  var picked = selCh ? selCh.value : '';
  var step = Number(orb && orb.pointStep);
  orbFillStep(picked, step >= 0 ? step : null);
  var sel2b = $('#point-ch2');
  if (sel2b && Number(settings.pointCh2) >= 0) sel2b.value = String(settings.pointCh2);
  var rSel = $('#point-region');
  if (rSel) rSel.value = settings.dustDual ? 'dust2' : reg;
  if (settings.dustDual) {
    orbFillCh('unova', null);
    var cA = $('#point-ch'), cB = $('#point-ch2');
    if (cA && Number(settings.pointCh) >= 0) cA.value = String(settings.pointCh);
    if (cB && Number(settings.pointCh2) >= 0) cB.value = String(settings.pointCh2);
  }
  orbSyncDustUi();
}
/* 尘土双章：地区下拉选「尘土双章」→ 只显示两个章节下拉，隐藏点位 */
function orbSyncDustUi() {
  var dust = !!(settings.dustDual || ($('#point-region') && $('#point-region').value === 'dust2'));
  var c2 = $('#point-ch2'), s = $('#point-step');
  if (c2) c2.style.display = dust ? '' : 'none';
  if (s) s.style.display = dust ? 'none' : '';
}

function orbUiBind() {
  var r = $('#point-region'), c = $('#point-ch'), s = $('#point-step'), t = $('#point-take');
  var c2 = $('#point-ch2'), dust = $('#point-dust');
  function commit() {
    settings.pointRegion = r ? r.value : 'kanto';
    settings.pointCh = (c && c.value !== '') ? Number(c.value) : -1;
    settings.pointStep = (s && s.value !== '') ? Number(s.value) : -1;
    if (c2 && c2.value !== '') settings.pointCh2 = Number(c2.value);
    var rv = r ? r.value : 'kanto';
    settings.dustDual = (rv === 'dust2');
    settings.pointRegion = (rv === 'dust2') ? 'unova' : rv;
    lastUserEdit = Date.now();
    saveAndPush();
  }
  if (r) r.addEventListener('change', function () {
    if (r.value === 'dust2') {
      settings.dustDual = true;
      settings.pointRegion = 'unova';
      orbFillCh('unova', null);
    } else {
      settings.dustDual = false;
      settings.pointRegion = r.value;
      orbFillCh(r.value, null);
    }
    orbSyncDustUi();
    commit();
  });
  if (c) c.addEventListener('change', function () { orbFillStep(c.value, null); commit(); });
  if (s) s.addEventListener('change', commit);
  if (c2) c2.addEventListener('change', commit);
  if (dust) dust.addEventListener('change', commit);
  if (t) t.addEventListener('click', function () {
    if (!lastOrb || Number(lastOrb.curCh) < 0) {
      setHint('还没读到你在第几章：先进游戏走到想停的位置，再回来点「取当前」。');
      return;
    }
    var ch = Number(lastOrb.curCh);
    if (r) r.value = orbRegionOf(ch);
    orbFillCh(orbRegionOf(ch), ch);
    /* 联盟章取当前 = 现在是第几位；普通章 = 时间线右上角那个「第几个点」（1 起 → 存 0 起） */
    var slot = orbLeagueSlotOf(ch);
    if (slot > 0) orbFillStep(ch, 100 + slot);
    else {
      var nd = Number(lastOrb.curNode) || 0;
      orbFillStep(ch, nd > 0 ? nd - 1 : 0);
    }
    commit();
    refresh();
  });
}

function renderOrb(orb) {
  var note = $('#orb-note');
  var sum = $('#orb-sum');
  var cyc = $('#orb-cycles');
  var logUl = $('#orb-log');
  var nowBtn = $('#orb-now');
  var stopBtn = $('#orb-stop');
  var box = document.querySelector('input[data-key="orbOn"]');
  if (!orb) {
    lastOrb = null;
    if (note) note.textContent = '页面里还没加载「定点循环」模块：刷新一次游戏页';
    if (sum) sum.textContent = '金刚宝珠 — · 白玉宝珠 —';
    if (cyc) cyc.textContent = '';
    var t0 = $('#orb-tally');
    if (t0) t0.textContent = '累计获得 0 次道具';
    var i0 = $('#orb-items');
    if (i0) {
      i0.textContent = '';
      var e1 = document.createElement('li');
      e1.className = 'empty';
      e1.textContent = '还没有统计';
      i0.appendChild(e1);
    }
    if (logUl) {
      logUl.textContent = '';
      var e0 = document.createElement('li');
      e0.className = 'empty';
      e0.textContent = '还没开始';
      logUl.appendChild(e0);
    }
    if (nowBtn) nowBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = true;
    runLine('#orb-phase', 'off', '未启动', isGameTab ? '刷新游戏页后可用' : '打开游戏页面后可用');
    setBrief('#brief-orb', '未启动', 'off');
    return;
  }

  var ZH = { 'adamant-orb': '金刚宝珠', 'lustrous-orb': '白玉宝珠', 'griseous-orb': '白金宝珠' };
  lastOrb = orb;
  settings.orbArmed = !!orb.armed;
  /* 第六十九批：目标只剩「定点循环」，下拉和形态行都已从界面删掉；
   * 页面那边 normMode() 也会把老存档里的 rotom / berry 等一律当定点。 */
  var isBerry = orb.mode === 'berry';
  var isGriseous = orb.mode === 'griseous';
  var isPoint = orb.mode !== 'berry' && orb.mode !== 'griseous' && orb.mode !== 'egg';
  var pointRow = $('#point-row');
  if (pointRow) pointRow.hidden = false;
  if (isPoint) orbUiFill(orb);

  var tally0 = orb.tally || { total: 0, items: {}, money: 0, moneyCount: 0 };
  var have = orb.have || {};
  var counts = orb.counts || {};
  var parts = [];
  if (orb.mode === 'egg') {
    parts.push('目标：玛娜菲蛋（只拿第一格）');
  } else if (isPoint) {
    parts.push('当前 ' + (Number(orb.curCh) >= 0 ? '第 ' + (Number(orb.curCh) + 1) + ' 章' : '?') +
      ' · 第 ' + (Number(orb.curNode) || 0) + ' 个点');
  } else if (isBerry) {
    parts.push('金色蔓莓果 × ' + (Number(tally0.items && tally0.items['金色蔓莓果']) || 0));
    parts.push('星桃果 × ' + (Number(tally0.items && tally0.items['星桃果']) || 0));
  } else if (isGriseous) {
    var gN = Number(counts['griseous-orb']) || 0;
    parts.push(ZH['griseous-orb'] + (have['griseous-orb'] ? ' ✓' : ' —') + (gN > 1 ? ' ×' + gN : ''));
  } else {
    ['adamant-orb', 'lustrous-orb'].forEach(function (id) {
      var n = Number(counts[id]) || 0;
      parts.push(ZH[id] + (have[id] ? ' ✓' : ' —') + (n > 1 ? ' ×' + n : ''));
    });
  }
  if (sum) sum.textContent = parts.join(' · ');

  if (note) {
    if (isPoint && !(Number(orb.pointCh) >= 0 && Number(orb.pointStep) >= 0)) {
      note.textContent = '定点模式：先选地区、章节和步骤，或走到想停的点位点「取当前」';
    } else if (isGriseous && !orb.giratina) {
      note.textContent = '缺骑拉帝纳（487）：积雪的天冠山那一格不会掉白金宝珠';
    } else if (!isBerry && !isPoint && !isGriseous && orb.mode !== 'egg' && !orb.trio) {
      note.textContent = '缺三圣菇（由克希 / 艾姆利多 / 亚克诺姆）：有它们这一格才会掉宝珠';
    } else if (!orb.armed && orb.phase === 'idle') {
      note.textContent = '没在跑：点下面「开始」';
    } else {
      note.textContent = orb.why || '—';
    }
  }

  /* 运行状态行：跟其它自动化一个写法（标签 + 正在做什么） */
  runLine('#orb-phase', orb.armed ? ((orb.phase === 'settle' || orb.phase === 'wait') ? 'wait' : 'on') : 'off',
    orb.armed ? (orb.phase === 'wait' ? '让路中' : '运行中') : '未启动', orb.why || '');
  setBrief('#brief-orb',
    orb.armed ? ('运行中 · 循环 ' + (orb.cycles || 0) + ' 次') : '未启动',
    orb.armed ? 'on' : 'off');

  if (cyc) {
    var mins = orb.startedAt ? Math.max(0, Math.round((Date.now() - orb.startedAt) / 60000)) : 0;
    cyc.textContent = '循环 ' + (orb.cycles || 0) + ' 次' +
      (orb.startedAt && orb.armed ? ' · 已跑 ' + mins + ' 分钟' : '');
  }

  var tally = orb.tally || { total: 0, items: {} };
  var session = orb.items || {};
  var sessionTotal = 0;
  Object.keys(session).forEach(function (k) { sessionTotal += Number(session[k]) || 0; });
  var tl2 = $('#orb-tally');
  if (tl2) {
    var money = Number(tally.money) || 0;
    var moneyCount = Number(tally.moneyCount) || 0;
    tl2.textContent = '累计获得 ' + (tally.total || 0) + ' 次道具' +
      (sessionTotal ? '（本次 ' + sessionTotal + ' 次）' : '') +
      ' · 金钱 ' + money + ' ₽' + (moneyCount ? '（' + moneyCount + ' 次）' : '');
  }
  var itemsUl = $('#orb-items');
  if (itemsUl) {
    var rows = Object.keys(tally.items || {}).map(function (k) {
      return [k, Number(tally.items[k]) || 0];
    }).filter(function (r) { return r[1] > 0; })
      .sort(function (a, b) { return b[1] - a[1]; });
    itemsUl.textContent = '';
    if (!rows.length) {
      var li0 = document.createElement('li');
      li0.className = 'empty';
      li0.textContent = '还没有统计';
      itemsUl.appendChild(li0);
    } else {
      rows.forEach(function (r) {
        var li = document.createElement('li');
        li.textContent = r[0] + ' × ' + r[1];
        itemsUl.appendChild(li);
      });
    }
  }

  if (logUl) {
    var logs = orb.logs || [];
    logUl.textContent = '';
    if (!logs.length) {
      var li0b = document.createElement('li');
      li0b.className = 'empty';
      li0b.textContent = '还没开始';
      logUl.appendChild(li0b);
    } else {
      logs.slice().reverse().forEach(function (e) {
        var li = document.createElement('li');
        li.textContent = fmtTime(e.t) + ' ' + e.m;
        logUl.appendChild(li);
      });
    }
  }

  if (nowBtn) nowBtn.disabled = !!orb.armed;
  if (stopBtn) stopBtn.disabled = !orb.armed;
  if (box) box.checked = !!orb.armed || !!settings.orbOn;
}

async function refresh() {
  // 防止 1 秒一次的轮询里前一个 refresh 还在跑就又发起一轮
  if (refreshing) return;
  refreshing = true;
  try {
  /* 第一百一十批：路闪监测读的是本地存储，游戏页没打开也要能看历史记录 */
  renderRoadShiny();
  var tab = await queryActiveTab();
  currentTabId = tab && typeof tab.id === 'number' ? tab.id : null;
  isGameTab = !!tab && GAME_URL_RE.test(String(tab.url || ''));

  if (!isGameTab) {
    lastStateForDiag = null;
    if (emptyReason !== 'not-game') {
      emptyReason = 'not-game';
      renderEmptyState('not-game');
    }
    $('#reload').disabled = true;
    return;
  }

  /* 轮询期间保留上一轮画面。以前每轮都先把五个面板清空成「未连接」，
   * 等状态回来再填回真实值，摘要就会随读秒一闪一闪。
   * 只有第一次（还没拿到过状态）显示一次「检测中」，真正读不到状态时才清空一次。 */
  if (!pageReady && !emptyReason) setPill('检测中', 'warn');

  var state = await sendToTab({ type: 'pcg-get-state' });
  /* 第五十八批：定点循环是独立 content script（orb.js），状态单独问一次 */
  var orbState = await sendToTab({ type: MSG.ORB_STATE || 'pcg-orb-state' });
  AUTO_ORB_ON = !!(orbState && orbState.armed);
  lastStateForDiag = state || null;
  if (!state) {
    if (emptyReason !== 'no-hook') {
      emptyReason = 'no-hook';
      renderEmptyState('no-hook');
    }
    renderOrb(orbState);
    return;
  }
  emptyReason = '';
  pageReady = true;

  /* 第二十五批：换了一轮页面会话（刷新过游戏页）就把卡片展开状态收回默认 */
  paneApply(paneSigOf(state));

  // 刚点过开关就别用后台状态覆盖，免得手快时被弹回去
  if (Date.now() - lastUserEdit > 3000) {
    applySettingsToUI(state.settings || DEFAULT_SETTINGS);
    // 传说追踪可能被对面互斥关掉，本地也要跟上
    if (state.settings && typeof state.settings.legendaryId === 'string') {
      settings.legendaryId = state.settings.legendaryId;
      settings.legArmed = !!state.settings.legArmed;
    }
    // 地下通道没有界面开关了，状态由内容脚本 / 「一键派遣」决定，跟着它走
    if (state.settings) {
      settings.autoUnderground = !!state.settings.autoUnderground;
      settings.ugArmed = !!state.settings.ugArmed;
      settings.autoRaid = !!state.settings.autoRaid;
      settings.autoFarm = !!state.settings.autoFarm;
      if (state.settings.farmMode) settings.farmMode = farmModeOf(state.settings.farmMode);
      if (state.settings.ugCheckSec) settings.ugCheckSec = state.settings.ugCheckSec;
    }
  }
  setHint('');
  $('#reconnect').disabled = false;
  $('#reload').disabled = false;

  // 页面里跑的还是老版本脚本时，新功能不会生效，直接说出来
  var mine = '';
  try { mine = chrome.runtime.getManifest().version; } catch (e) { mine = ''; }
  if (mine && state.version && state.version !== mine) {
    setReloadAsk(true);
    /* v1.24：去掉这条黄框版本提示（用户要求），刷新仍用标题栏图标 */
  }

  var connected = !!state.connected;
  setReloadAsk(!(mine && state.version && state.version !== mine));
  setPill(connected ? '守护中' : '断线自愈中', connected ? 'on' : 'off');

  var conn = state.conn || {};
  var downSec = Number(conn.downSec) || 0;
  $('#conn').textContent = connected
    ? (state.hookReady ? '已连接' : '等待游戏启动')
    : ('已断开' + (downSec > 0 ? '（' + fmtDuration(downSec * 1000) + '）' : ''));
  if (!state.settings || state.settings.keepVisible === false) {
    $('#spoof').textContent = '未启用';
  } else if (state.spoofOn) {
    var ticks = Number(state.fbTicks) || 0;
    $('#spoof').textContent = ticks > 0 ? ('工作中（已接管 ' + ticks + ' 帧）') : '待命';
  } else {
    $('#spoof').textContent = '等待页面生效';
  }
  var hidSecs = Number(state.hiddenSecs) || 0;
  $('#hid').textContent = hidSecs > 0 ? fmtDuration(hidSecs * 1000) : '还没最小化过';
  var wsTail = '';
  if (!connected) {
    if (conn.code) wsTail = ' · 关闭码 ' + conn.code + (conn.clean ? '' : ' 异常');
    if (conn.tries) wsTail += ' · 重连 ' + conn.tries + ' 次';
  }
  $('#ws').textContent = state.wsTotal > 0
    ? (state.wsOpen + ' / 共 ' + state.wsTotal + wsTail)
    : '无连接（未使用 WebSocket）';

  // 断开的时候把「接下来会怎么处理」写清楚，别让人只看到一个红标
  // （已经有一句更要紧的提示——比如版本不匹配——就别盖掉它）
  var hintBox = $('#hint');
  var hinted = !!(hintBox && String(hintBox.textContent || '').trim());
  if (hinted) {
    /* 保留上面的提示 */
  } else if (!connected && state.reloadBlocked) {
    setHint('10 分钟内已自动刷新 3 次还是没连上：多半是服务器或网络的问题，等一会儿再手动刷新。');
  } else if (!connected && conn.manual) {
    setHint('正在重连：9 秒还没连上就自动整页刷新。');
  } else if (!connected && conn.downSec >= 60) {
    setHint(downSec >= 180
      ? '断开超过 3 分钟，会自动刷新页面（10 分钟内最多 3 次）。'
      : '断开 ' + fmtDuration(downSec * 1000) + '，还在自动重连；异常断开超过 60 秒会刷新页面。');
  }
  $('#cnt').textContent = state.reconnects + ' 次 / ' + state.reloads + ' 次';
  $('#up').textContent = fmtDuration(Date.now() - (state.startedAt || Date.now()));

  var connStat = $('#stat-conn');
  if (connStat) connStat.setAttribute('data-state', connected ? 'ok' : 'off');
  var spoofStat = $('#stat-spoof');
  if (spoofStat) {
    spoofStat.setAttribute('data-state',
      (!state.settings || state.settings.keepVisible === false) ? 'off'
        : (state.spoofOn ? 'ok' : 'warn'));
  }

  renderProbe(state.probe);
  /* 第二十批：这两组是「一堆开关」，开了几项就是运行中几项 */
  var coreOn = countKeys([
    'keepVisible', 'keepAlive', 'antiIdle', 'autoReconnect',
    'autoReload', 'autoRetryBoot', 'keepSystemAwake'
  ]);
  setBrief('#brief-core', coreOn ? ('运行中 · ' + coreOn + ' 项') : '未启动',
    coreOn ? 'on' : 'off');
  var autoOn = countKeys(['autoContinue', 'autoModal', 'dmgOn', 'battleInfo',
    'resumeOn', 'shinyGuardOn', 'dexFilterOn', 'dexJumpOn']);
  setBrief('#brief-auto', autoOn ? ('运行中 · ' + autoOn + ' 项') : '未启动',
    autoOn ? 'on' : 'off');

  var feedOn = Object.keys(settings.feedItems || {}).filter(function (k) {
    return !!settings.feedItems[k];
  }).length;
  var feedLive = feedOn > 0;   /* 第一百一十九批：没有总闸，勾了果实才算运行 */
  /* 第二十四批：自动喂食卡片里的那条运行状态行已删除，状态只留在卡片右上角这句 */
  setBrief('#brief-feed', feedLive ? ('运行中 · ' + feedOn + ' 种') : '未启动',
    feedLive ? 'on' : 'off');

  /* 第二十二批：宝可梦收藏 / 保留重复都是一次性操作卡片——不放运行状态行、
   * 不写「运行中」，右上角只用灰字交代开关状态或上次读到的家族数 */
  var favLive = !!settings.favOn;
  setBrief('#brief-fav', favLive ? '已开启' : '已关闭', 'idle');
  setBrief('#brief-keepdup', kdSum || '手动操作', 'idle');

  renderLog(state.log || state.events || []);
  renderFeed(state.feedables, settings.feedItems);
  renderUg(state);
  renderFarm(state.farm);
  renderLeg(state);
  renderRaid(state && state.raid);
  renderDex(state.dex, state.dexFilter);
  renderNursery(state.nursery);
  renderMarket(state.market);
  renderFarmPanels(state);
  if (window.PCG_UNDER_UI) window.PCG_UNDER_UI.render(state.underground);
  renderOrb(orbState);
  syncAutoStopAll(state);
  } finally {
    refreshing = false;
  }
}

async function saveAndPush() {
  settings = readSettingsFromUI();
  // 没打开游戏页时读不到「到底在不在追」，就别拿默认值去覆盖存储里的真值
  var toStore = Object.assign({}, settings);
  if (!isGameTab) delete toStore.legArmed;
  /* 第六十七批：orbArmed 是**页面里那条任务自己的状态**，弹窗只读不写。
   * 以前每点一次「开始」都跟着 saveAndPush()，把弹窗打开那一刻的旧值
   * （false）原样写回 sync；页面里的 onChanged 一看 orbArmed 变 false，
   * 就把刚开起来的定点循环当场停掉 —— 这就是「一开就自己停」的真凶。
   * 顺手把改下拉、改点位、勾看板这些操作也带上了，全都会误停。 */
  delete toStore.orbArmed;
  try {
    SYNC.set(toStore, function () { void chrome.runtime.lastError; });
  } catch (e) { /* ignore */ }
  if (isGameTab) await sendToTab({ type: 'pcg-settings', settings: settings });
  try {
    chrome.runtime.sendMessage({ type: 'pcg-sync' }, function () {
      void chrome.runtime.lastError;
    });
  } catch (e) { /* ignore */ }
}

/* ---------------- 第二十五批：卡片展开状态 ----------------
 * 每次游戏页刷新以后，所有功能栏都回到「收起」，只把「本系威力排名」展开。
 * 判断依据是页面会话（url + 内容脚本启动时间）：同一个页面会话里，玩家点开的
 * 卡片会记住；页面一刷新，会话变了，就整体回到默认。 */
var PANE_KEY = 'pcgPanesV3';
var paneSig = '';
var paneEls = [];

function paneDefaults() {
  var all = {};
  Array.prototype.forEach.call(paneEls, function (x) {
    if (x.id) all[x.id] = (x.id === 'pane-stab');
  });
  return all;
}

function paneApply(sig) {
  if (!sig || sig === paneSig) return;
  paneSig = sig;
  var saved = null;
  try {
    var raw = JSON.parse(localStorage.getItem(PANE_KEY) || '{}');
    if (raw && raw.sig === sig && raw.panes) saved = raw.panes;
  } catch (e) { saved = null; }
  var def = paneDefaults();
  Array.prototype.forEach.call(paneEls, function (x) {
    if (!x.id) return;
    var want = (saved && typeof saved[x.id] === 'boolean') ? saved[x.id] : def[x.id];
    if (x.open !== want) x.open = want;
  });
}

function paneSigOf(state) {
  if (!state) return '';
  return String(state.url || '') + '|' + String(state.startedAt || '');
}

function paneInit() {
  paneEls = document.querySelectorAll('details.group, details.pane');
  Array.prototype.forEach.call(paneEls, function (d) {
    d.addEventListener('toggle', function () {
      if (!paneSig) return;
      var all = {};
      Array.prototype.forEach.call(paneEls, function (x) { if (x.id) all[x.id] = x.open; });
      try { localStorage.setItem(PANE_KEY, JSON.stringify({ sig: paneSig, panes: all })); }
      catch (e) { /* ignore */ }
    });
  });
}

function bind() {
  paneInit();
  if (window.PCG_UNDER_UI) window.PCG_UNDER_UI.init(refresh, sendToTab);

  var compatPill = $('#compat-pill');
  if (compatPill) compatPill.addEventListener('click', function () {
    var box = $('#compat-detail');
    if (box) box.hidden = !box.hidden;
  });

  var filters = $('#log-filters');
  if (filters) filters.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('button[data-level]') : null;
    if (!b) return;
    logLevel = b.getAttribute('data-level') || 'all';
    Array.prototype.forEach.call(filters.querySelectorAll('button'), function (x) {
      x.classList.toggle('on', x === b);
    });
    logSig = '';
    renderLog(lastEvents);
  });

  var clearBtn = $('#log-clear');
  if (clearBtn) clearBtn.addEventListener('click', async function () {
    logSig = '';
    renderLog([]);
    try { await sendToTab({ type: MSG.CLEAR_LOG || 'pcg-clear-log' }); } catch (e) { /* ignore */ }
  });

  /* 第一百一十批：路闪「清除统计」—— 只清 records，保留 cur（会话编号不能变，
   * 否则之后新记录会被算进「历史」）。游戏页那边由 storage.onChanged 自动同步内存。 */
  var rsClear = $('#rs-clear');
  if (rsClear) rsClear.addEventListener('click', function () {
    var note = $('#rs-note');
    try {
      chrome.storage.local.get(ROAD_KEY, function (v) {
        var d = (v && v[ROAD_KEY]) || {};
        var o = {}; o[ROAD_KEY] = { cur: d.cur || '', records: [] };
        chrome.storage.local.set(o, function () {
          roadSig = '';
          renderRoadShiny(true);
          if (note) note.textContent = '统计已清除';
        });
      });
    } catch (e) { if (note) note.textContent = '清除失败'; }
  });

  var copyBtn = $('#log-copy');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var text = lastEvents.slice().map(function (e) {
      return '[' + fmtTime(e.t) + '] [' + (LEVEL_NAME[e.level] || '提示') + '] [' +
        (MOD_NAME[e.mod] || e.mod || '核心') + '] ' + String(e.m || '') +
        (Number(e.n) > 1 ? ' (x' + e.n + ')' : '');
    }).join('\n');
    var done = function () {
      var old = copyBtn.textContent;
      copyBtn.textContent = '已复制';
      setTimeout(function () { copyBtn.textContent = old; }, 1200);
    };
    var fallback = function () {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) { /* ignore */ }
      done();
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else fallback();
    } catch (e) { fallback(); }
  });

  document.querySelectorAll('input[data-key]').forEach(function (box) {
    box.addEventListener('change', function () {
      lastUserEdit = Date.now();
      // 互斥：开了异色团体战，传说追踪就停（两个都要占冒险页）
      if (box.getAttribute('data-key') === 'autoFarm' && box.checked) {
        // 刷钱要一直占着冒险页，传说追踪 / 异色团体战先停
        settings.autoRaid = false;
        settings.legendaryId = '';
        settings.legArmed = false;
        var raidBox0 = document.querySelector('input[data-key="autoRaid"]');
        if (raidBox0) raidBox0.checked = false;
        var legUl0 = $('#leg-list');
        if (legUl0) legUl0.setAttribute('data-sig', '');
      }
      if (box.getAttribute('data-key') === 'autoRaid' && box.checked) {
        settings.legendaryId = '';
        settings.legArmed = false;
        var legUl = $('#leg-list');
        if (legUl) legUl.setAttribute('data-sig', '');
      }
      saveAndPush();
      /* 第八批：两条页面自动化开关除了写设置，还即时推给游戏页，
       * 不用等下一轮状态轮询；页面刷新后的兜底同步在 content.applySettings()。 */
      var key = box.getAttribute('data-key');
      if (isGameTab && key === 'shinyGuardOn') {
        sendToTab({ type: MSG.SHINY_CONFIG, cfg: { enabled: !!box.checked } })
          .then(function () { refresh(); });
      } else if (isGameTab && key === 'dexFilterOn') {
        sendToTab({ type: MSG.DEX_FILTER, on: !!box.checked })
          .then(function () { refresh(); });
      } else if (isGameTab && key === 'dexJumpOn') {
        sendToTab({ type: MSG.DEX_JUMP, on: !!box.checked })
          .then(function () { refresh(); });
      }
    });
  });

  $('#reconnect').addEventListener('click', async function () {
    var resp = await sendToTab({ type: 'pcg-reconnect-now' });
    if (resp && resp.ok) refresh();
  });

  $('#reload').addEventListener('click', reloadGamePage);

  /* 第八十九批：「全屏」键 —— 手机弹窗太窄、一切换标签页就关，改到标签页里调 */
  var expandBtn = $('#expand');
  if (expandBtn) expandBtn.addEventListener('click', openTabMode);

  /* ---------------- 第五十八批：定点循环 ----------------
   * 第六十九批：目标只剩「定点循环」一种，下面的「选形态」下拉已经删了（整套搬去图鉴捕捉） */
  orbUiBind();
  var orbBtn = $('#orb-now');
  if (orbBtn) {
    orbBtn.addEventListener('click', async function () {
      if (!isGameTab) {
        setHint('当前标签页不是 Poke\'Catch。');
        return;
      }
      orbBtn.disabled = true;
      var r = null;
      try { r = await sendToTab({ type: MSG.ORB_NOW || 'pcg-orb-now' }); } catch (e) { /* ignore */ }
      if (!r || !r.text) {
        setHint('插件和页面没连上，刷新游戏页后再试。');
        orbBtn.disabled = false;
        return;
      }
      var note = $('#orb-note');
      if (note) note.textContent = (r.ok ? '✓ ' : '✗ ') + r.text;
      if (!r.ok) setHint(r.text);
      if (r.ok) {
        /* 第六十七批：开成功就把弹窗这边的状态一起对上（armed 由页面侧写存储，
         * 弹窗只跟读不改），否则下一次 saveAndPush 会拿旧值把任务写停 */
        settings.orbOn = true;
        settings.orbArmed = true;
        var box0 = document.querySelector('input[data-key="orbOn"]');
        if (box0) box0.checked = true;
        saveAndPush();
      }
      refresh();
    });
  }
  var orbStopBtn = $('#orb-stop');
  if (orbStopBtn) {
    orbStopBtn.addEventListener('click', async function () {
      if (!isGameTab) {
        setHint('当前标签页不是 Poke\'Catch。');
        return;
      }
      orbStopBtn.disabled = true;
      var r = null;
      try { r = await sendToTab({ type: MSG.ORB_STOP || 'pcg-orb-stop' }); } catch (e) { /* ignore */ }
      var note = $('#orb-note');
      if (note && r && r.text) note.textContent = r.text;
      settings.orbOn = false;
      settings.orbArmed = false;
      var box2 = document.querySelector('input[data-key="orbOn"]');
      if (box2) box2.checked = false;
      saveAndPush();
      refresh();
    });
  }
  var orbClear = $('#orb-clear');
  if (orbClear) {
    orbClear.addEventListener('click', async function () {
      if (!isGameTab) {
        setHint('当前标签页不是 Poke\'Catch。');
        return;
      }
      orbClear.disabled = true;
      try { await sendToTab({ type: MSG.ORB_CLEAR || 'pcg-orb-clear' }); } catch (e) { /* ignore */ }
      orbClear.disabled = false;
      refresh();
    });
  }

  var ugSec = $('#ug-check');
  if (ugSec) {
    var commitSec = function () {
      var v = clampSec(ugSec.value);
      ugSec.value = v;
      settings.ugCheckSec = v;
      settings.ugSecV = 2;          // 这是玩家自己填的，别再当成旧默认值搬走
      lastUserEdit = Date.now();
      saveAndPush();
    };
    ugSec.addEventListener('change', commitSec);
    ugSec.addEventListener('blur', commitSec);
  }

  var ugFrom = $('#ug-from');
  if (ugFrom) {
    ugFrom.addEventListener('change', function () {
      var v = parseInt(ugFrom.value, 10);
      if (!isFinite(v) || v < 0) v = 0;
      settings.ugFrom = v;
      lastUserEdit = Date.now();
      saveAndPush();
      renderUgFrom(null);
    });
  }

  var favClearBtn = $('#fav-clear');
  if (favClearBtn) {
    favClearBtn.addEventListener('click', async function () {
      if (!isGameTab) {
        setHint('先切到游戏页再点：备份文件存在网页里，得让页面自己删。');
        return;
      }
      if (!window.confirm('确定要清空全部收藏吗？\n\n扩展里的收藏表和网页里的本地备份文件都会删掉，删了找不回来。')) return;
      if (!window.confirm('再确认一次：真的要全部取消收藏？')) return;
      var r = null;
      try { r = await sendToTab({ type: 'pcg-fav-clear' }); } catch (e) { /* ignore */ }
      try { chrome.storage.local.remove('pcgFavs'); } catch (e4) { /* ignore */ }
      var note = $('#fav-note');
      var text = (r && r.text) || '没连上页面：刷新一次游戏页再点';
      if (note) note.textContent = text;
      if (!r || !r.ok) setHint(text);
      refresh();
    });
  }

  /* 第十二批：一键「保留重复」（全部宝可梦家族）
   * 第二十二批：卡片没有状态栏了，读到的结果只用右上角角标 + 下面那行小字交代 */
  var kdNote = $('#kd-note');

  function kdRender(r, silent) {
    var text = (r && r.text) || '没连上游戏页：打开游戏页并刷新一次再点';
    if (kdNote) {
      kdNote.textContent = (r && r.ok) ? text : (silent ? '' : text);
      kdNote.className = 'kd-note ' + (r && r.ok ? 'ok' : 'bad');
    }
    if (r && r.ok && typeof r.total === 'number') {
      kdSum = '开启 ' + r.on + '/' + r.total;
      setBrief('#brief-keepdup', kdSum, 'idle');
    }
    if (!silent && !(r && r.ok)) setHint(text);
  }

  async function kdSend(msg, silent) {
    if (!isGameTab) {
      if (!silent) kdRender({ ok: false, text: '先切到游戏页再点：开关在游戏页面里，弹窗本身改不了。' }, false);
      return;
    }
    var btns = [$('#kd-on'), $('#kd-off'), $('#kd-refresh')];
    btns.forEach(function (b) { if (b) b.disabled = true; });
    var r = null;
    try { r = await sendToTab(msg); } catch (e) { r = null; }
    btns.forEach(function (b) { if (b) b.disabled = false; });
    kdRender(r, !!silent);
  }

  var kdOnBtn = $('#kd-on');
  if (kdOnBtn) kdOnBtn.addEventListener('click', function () {
    kdSend({ type: 'pcg-keepdup', on: true });
  });
  var kdOffBtn = $('#kd-off');
  if (kdOffBtn) kdOffBtn.addEventListener('click', function () {
    kdSend({ type: 'pcg-keepdup', on: false });
  });
  var kdRefreshBtn = $('#kd-refresh');
  if (kdRefreshBtn) kdRefreshBtn.addEventListener('click', function () {
    kdSend({ type: 'pcg-keepdup-status' });
  });
  // refresh() 是异步的，延后一拍静默读一次当前状态
  setTimeout(function () {
    if (isGameTab) kdSend({ type: 'pcg-keepdup-status' }, true);
  }, 700);

  document.querySelectorAll('input[name="farmMode"]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (!r.checked) return;
      lastUserEdit = Date.now();
      saveAndPush();
    });
  });

  var farmStartBtn = $('#farm-now');
  if (farmStartBtn) {
    farmStartBtn.addEventListener('click', async function () {
      if (!isGameTab) { setHint('当前标签页不是 Poke\'Catch。'); return; }
      farmStartBtn.disabled = true;
      var r = null;
      try { r = await sendToTab({ type: 'pcg-farm-now' }); } catch (e) { /* ignore */ }
      if (!r || !r.text) {
        farmMsg = { at: Date.now(), text: '没有响应：刷新一次游戏页再点' };
        setHint('插件和页面没连上，刷新游戏页后再试。');
        farmStartBtn.disabled = false;
        return;
      }
      farmMsg = { at: Date.now(), text: (r.ok ? '✓ ' : '✗ ') + r.text };
      if (!r.ok) { setHint(r.text); farmStartBtn.disabled = false; }
      refresh();
    });
  }

  var farmStopBtn = $('#farm-stop');
  if (farmStopBtn) {
    farmStopBtn.addEventListener('click', async function () {
      if (!isGameTab) { setHint('当前标签页不是 Poke\'Catch。'); return; }
      farmStopBtn.disabled = true;
      var r = null;
      try { r = await sendToTab({ type: 'pcg-farm-stop' }); } catch (e) { /* ignore */ }
      farmMsg = { at: Date.now(), text: (r && r.ok ? '✓ ' : '✗ ') + ((r && r.text) || '没有响应') };
      refresh();
    });
  }

  /* 第三十二批：「自动化任务」栏标题右边的一键关闭——一次把这一栏的五张卡片全停掉。
   * 逐个发停止指令（互斥本来就只有一个在跑，其余会直接回「没在跑」，不算失败）。 */
  var autoStopBtn = $('#auto-stop-all');
  if (autoStopBtn) {
    autoStopBtn.addEventListener('click', async function () {
      if (autoStopBtn.disabled || autoStopBtn.getAttribute('data-busy') === '1') return;
      if (!isGameTab) { setHint('当前标签页不是 Poke\'Catch，先切到游戏页。'); return; }
      var label = autoStopBtn.textContent;
      autoStopBtn.setAttribute('data-busy', '1');
      autoStopBtn.disabled = true;
      autoStopBtn.textContent = '正在关闭…';
      var n = 0;
      for (var i = 0; i < AUTO_STOP_LIST.length; i++) {
        var it = AUTO_STOP_LIST[i];
        try {
          var r = await sendToTab({ type: MSG[it[0]] || it[1] });
          if (r && r.ok !== false) n++;
        } catch (e) { /* ignore：某一个没响应也继续关下一个 */ }
      }
      autoStopBtn.setAttribute('data-busy', '0');
      autoStopBtn.textContent = n ? '已全部关闭' : '没能关闭';
      try { await refresh(); } catch (e2) { /* ignore */ }
      /* 回执照旧挂 1.4 秒，但别在这之后把按钮硬点亮——交给 syncAutoStopAll 按最新状态定 */
      setTimeout(function () {
        autoStopBtn.textContent = label;
        syncAutoStopAll(AUTO_LAST_STATE);
      }, 1400);
    });
  }

  var ugBtn = $('#ug-now');
  if (ugBtn) {
    ugBtn.addEventListener('click', async function () {
      if (!isGameTab) {
        setHint('当前标签页不是 Poke\'Catch。');
        return;
      }
      ugBtn.disabled = true;
      var label = ugBtn.textContent;
      ugBtn.textContent = '派出中…';
      var r = null;
      try {
        r = await sendToTab({ type: 'pcg-ug-now' });
      } catch (e) { /* ignore */ }
      ugBtn.disabled = false;
      ugBtn.textContent = label;

      if (!r || !r.text) {
        manualMsg = { at: Date.now(), text: '没有响应：刷新一次游戏页再点' };
        runLine('#ug-phase', 'wait', null, manualMsg.text);
        setHint('插件和页面没连上，刷新游戏页后再试。');
        return;
      }
      manualMsg = { at: Date.now(), text: (r.ok ? '✓ ' : '✗ ') + r.text };
      runLine('#ug-phase', 'wait', null, manualMsg.text);
      if (!r.ok) setHint(r.text);
      refresh();
    });
  }

  var ugStopBtn = $('#ug-stop');
  if (ugStopBtn) {
    ugStopBtn.addEventListener('click', async function () {
      if (!isGameTab) {
        setHint('当前标签页不是 Poke\'Catch。');
        return;
      }
      ugStopBtn.disabled = true;
      var r = null;
      try {
        r = await sendToTab({ type: 'pcg-ug-stop' });
      } catch (e) { /* ignore */ }
      ugStopBtn.disabled = false;
      if (!r || !r.text) {
        manualMsg = { at: Date.now(), text: '没有响应：刷新一次游戏页再点' };
        runLine('#ug-phase', 'wait', null, manualMsg.text);
        return;
      }
      manualMsg = { at: Date.now(), text: (r.ok ? '✓ ' : '✗ ') + r.text };
      runLine('#ug-phase', 'wait', null, manualMsg.text);
      refresh();
    });
  }

  var legStopBtn = $('#leg-stop');
  if (legStopBtn) {
    legStopBtn.addEventListener('click', async function () {
      if (!isGameTab) { setHint('当前标签页不是 Poke\'Catch。'); return; }
      legStopBtn.disabled = true;
      var r = null;
      try { r = await sendToTab({ type: 'pcg-leg-stop' }); } catch (e) { /* ignore */ }
      if (!r || !r.text) { setHint('没有响应：刷新一次游戏页再点'); return; }
      legManual = { at: Date.now(), text: (r.ok ? '✓ ' : '✗ ') + r.text };
      if (r.ok) {
        settings.legendaryId = '';
        var ul0 = $('#leg-list');
        if (ul0) ul0.setAttribute('data-sig', '');
      }
      refresh();
    });
  }

  var raidStopBtn = $('#raid-stop');
  if (raidStopBtn) {
    raidStopBtn.addEventListener('click', async function () {
      if (!isGameTab) { setHint('当前标签页不是 Poke\'Catch。'); return; }
      raidStopBtn.disabled = true;
      var r = null;
      try { r = await sendToTab({ type: 'pcg-raid-stop' }); } catch (e) { /* ignore */ }
      if (!r || !r.text) { setHint('没有响应：刷新一次游戏页再点'); return; }
      manualRaid = { at: Date.now(), text: (r.ok ? '✓ ' : '✗ ') + r.text };
      refresh();
    });
  }

  var raidBtn = $('#raid-now');
  if (raidBtn) {
    raidBtn.addEventListener('click', async function () {
      if (!isGameTab) {
        setHint('当前标签页不是 Poke\'Catch。');
        return;
      }
      raidBtn.disabled = true;
      var label = raidBtn.textContent;
      raidBtn.textContent = '开打…';
      var r = null;
      try {
        r = await sendToTab({ type: 'pcg-raid-now' });
      } catch (e) { /* ignore */ }
      raidBtn.disabled = false;
      raidBtn.textContent = label;

      var note = $('#raid-note');
      if (!r || !r.text) {
        if (note) note.textContent = '没有响应：刷新一次游戏页再点';
        setHint('插件和页面没连上，刷新游戏页后再试。');
        return;
      }
      manualRaid.at = Date.now();
      manualRaid.text = (r.ok ? '✓ ' : '✗ ') + r.text;
      if (note) note.textContent = manualRaid.text;
      if (!r.ok) setHint(r.text);
      refresh();
    });
  }

  var stabTabs = $('#stab-tabs');
  if (stabTabs) {
    stabTabs.addEventListener('click', function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest('.stab-tab') : null;
      if (!t) return;
      stabCur = t.getAttribute('data-t') || '';
      saveStabTab(stabCur);
      renderStab();
    });
  }

  var legList = $('#leg-list');
  if (legList) {
    legList.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || t.name !== 'leg-pick') return;
      settings.legendaryId = String(t.value);
      settings.legArmed = false;   // 换一只就要重新点「立即前往」
      // 互斥：开始追神兽，异色团体战就关掉
      if (settings.legendaryId) {
        settings.autoRaid = false;
        var raidBox = document.querySelector('input[data-key="autoRaid"]');
        if (raidBox) raidBox.checked = false;
      }
      lastUserEdit = Date.now();
      legList.setAttribute('data-sig', '');
      saveAndPush();
      refresh();
    });
  }

  var legBtn = $('#leg-now');
  if (legBtn) {
    legBtn.addEventListener('click', async function () {
      if (!isGameTab) {
        setHint('当前标签页不是 Poke\'Catch。');
        return;
      }
      if (!settings.legendaryId) {
        setHint('先在上面选一只神兽。');
        return;
      }
      legBtn.disabled = true;
      var label = legBtn.textContent;
      legBtn.textContent = '前往中…';
      var r = null;
      try {
        r = await sendToTab({ type: 'pcg-leg-now' });
      } catch (e) { /* ignore */ }
      legBtn.disabled = false;
      legBtn.textContent = label;
      legManual = { at: Date.now(), text: (r && r.text) || '没有响应：刷新一次游戏页再点' };
      refresh();
    });
  }

  /* ---- 第二批：图鉴捕捉面板 ---- */
  function needGameTab() {
    if (isGameTab) return false;
    setHint('当前标签页不是 Poke\'Catch，先切到游戏页。');
    return true;
  }

  // 参数改动即时推给页面（PCG_DEX 自己会存到扩展本地存储）
  var dexCfgIds = ['#dex-cond-first', '#dex-until-shiny', '#dex-wait-cond'];
  dexCfgIds.forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('change', function () { pushDexCfg(); });
  });
  /* 第七批：分类标签可点击筛选；点亮的再点一次取消。
   * 筛选条件写到图鉴模块配置里，状态快照直接回传筛选后的清单。 */
  var dxTotals = $('#dx-totals');
  if (dxTotals) {
    dxTotals.addEventListener('click', async function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest('.dx-cat') : null;
      if (!btn) return;
      var key = btn.getAttribute('data-dxcat') || '';
      dexCatFilter = (dexCatFilter === key) ? '' : key;
      dexSig = '';
      if (isGameTab) {
        try {
          await sendToTab({
            type: MSG.DEX_CONFIG || 'pcg-dex-config',
            cfg: { listFilter: dexCatFilter }
          });
        } catch (e) { /* ignore */ }
      }
      if (lastDexState) renderDex(lastDexState);
      refresh();
    });
  }
  document.querySelectorAll('input[name="dexMode"]').forEach(function (r) {
    r.addEventListener('change', function () {
      /* 第三十八批：点了就立刻重画灰态（没选中的那块变灰），再写回配置 */
      dexModePaint(false);
      pushDexCfg();
    });
  });
  /* 第六十九批：洛托姆清单里勾 / 取消勾，直接写回配置（rotomPick） */
  var dexRotomList = $('#dx-rotom-list');
  if (dexRotomList) {
    dexRotomList.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute || t.getAttribute('data-rotom') == null) return;
      if (t.getAttribute('data-done') === '1') return;   // 已收录置灰，不给勾
      var ri = Number(t.getAttribute('data-rotom'));
      var at = rotomClickOrder.indexOf(ri);
      if (t.checked && at < 0) rotomClickOrder.push(ri);        // 勾上 → 排末尾
      else if (!t.checked && at >= 0) rotomClickOrder.splice(at, 1);  // 取消 → 移除
      /* tab 回执有一拍延迟：先把本地清单 / 配置同步成新顺序，界面立刻重画 */
      if (lastDexState) {
        if (lastDexState.cfg) lastDexState.cfg.rotomPick = rotomClickOrder.slice();
        if (lastDexState.rotom) lastDexState.rotom.forEach(function (r) {
          r.picked = rotomClickOrder.indexOf(r.i) >= 0;
        });
      }
      dexRotomSig = '';                 // 勾选变了，右上角计数跟着重画
      pushDexCfg();
      if (lastDexState) renderDex(lastDexState);
    });
  }
  /* 第三十八批：弹窗一打开就先按当前选中的模式画一次灰态 */
  dexModePaint(false);
  var dexTarget = $('#dex-target');
  if (dexTarget) {
    var commitTarget = function () { pushDexCfg(); };
    dexTarget.addEventListener('change', commitTarget);
    dexTarget.addEventListener('blur', commitTarget);
    /* 第三十八批：一点输入框就自动切到「捕捉指定宝可梦」——
     * 两个模式互斥，填了目标当然是要追那一只，不用再回头点一次单选框 */
    dexTarget.addEventListener('focus', function () {
      var picked = document.querySelector('input[name="dexMode"]:checked');
      if (picked && picked.value !== 'target') {
        var t = document.querySelector('input[name="dexMode"][value="target"]');
        if (t && !t.disabled) { t.checked = true; dexModePaint(false); pushDexCfg(); }
      }
    });
    dexTarget.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); dexTarget.blur(); }
    });
  }

  var dexScanBtn = $('#dex-scan');
  var dexFindBtn = $('#dex-find');
  var dexScanning = false;
  var doScan = async function () {
    if (dexScanning) return;              // 第四十八批：连点也别叠着扫
    if (needGameTab()) return;
    if (lastDexState && lastDexState.running) return;   // 跑起来时刷新清单是禁用的
    dexScanning = true;
    var btn = dexScanBtn;
    if (btn) btn.disabled = true;
    try {
      var cfg = await pushDexCfg();
      var r = null;
      try { r = await sendToTab({ type: MSG.DEX_SCAN || 'pcg-dex-scan', options: cfg }); }
      catch (e) { /* ignore */ }
      dexMsg = { at: Date.now(), text: (r && r.text) || '没有响应：刷新一次游戏页再点' };
      if (!r || !r.ok) setHint(dexMsg.text);
    } finally {
      dexScanning = false;
      /* 扫完把按钮还回「该不该可点」的真实状态：跑起来 / 存档还没读到就继续灰着 */
      if (btn) btn.disabled = !lastDexState || !!lastDexState.running || lastDexState.ready === false;
    }
    refresh();
  };
  if (dexScanBtn) dexScanBtn.addEventListener('click', doScan);
  if (dexFindBtn) dexFindBtn.addEventListener('click', doScan);

  /* 第四十八批：点「一键补全未捕捉」这张卡就等于点了一次「刷新清单」——
   * 这个模式吃的就是整份未捕捉清单，点完立刻重读一次存档，不用再单独去点刷新。
   * 点「捕捉指定宝可梦」不这么干：那个模式靠输入框 + 查找，扫早了只是空扫。
   * 两个坑：
   *   ① label 的点击要等「激活行为」把单选框勾上之后再判断，
   *      直接在 click 里读 checked 拿到的还是切换前的旧值 → 延后一拍；
   *   ② 点 label 会先派发一次 click，浏览器再往里面的单选框转发一次，
   *      转发的那次又冒泡回 label —— 一次点击进两次监听，真跑起来是扫两遍，
   *      所以 500ms 内只认第一下。 */
  var dexCardScanAt = 0;
  var dexMissingCard = document.querySelector('#dex-mode .farm-pick[data-mode="missing"]');
  if (dexMissingCard) {
    dexMissingCard.addEventListener('click', function () {
      setTimeout(function () {
        var picked = document.querySelector('input[name="dexMode"]:checked');
        if (picked && picked.value !== 'missing') return;   // 没切到「一键补全」就别扫
        var now = Date.now();
        if (now - dexCardScanAt < 500) return;              // 同一次点击的第二次触发
        dexCardScanAt = now;
        doScan();
      }, 0);
    });
  }

  var dexStartBtn = $('#dex-now');
  if (dexStartBtn) {
    dexStartBtn.addEventListener('click', async function () {
      if (needGameTab()) return;
      dexStartBtn.disabled = true;
      /* 第三十八批：开始捕捉一律以「弹窗里当前选中的那个模式」为准——
       * 先把选中的模式 / 目标写进配置，再把同一份配置交给 start，
       * 不再依赖页面里上一次留下的旧模式。 */
      var cfg = dexCfgFromUI();
      if (cfg.mode === 'target' && !cfg.target) {
        dexMsg = { at: Date.now(), text: '先在输入框里填要捕捉的宝可梦（中文名 / 图鉴号）' };
        setHint(dexMsg.text);
        dexStartBtn.disabled = false;
        dexModePaint(false);
        return;
      }
      if (isGameTab) {
        try { await sendToTab({ type: MSG.DEX_CONFIG || 'pcg-dex-config', cfg: cfg }); }
        catch (e) { /* ignore */ }
      }
      var r = null;
      try { r = await sendToTab({ type: MSG.DEX_START || 'pcg-dex-start', options: cfg }); }
      catch (e) { /* ignore */ }
      dexMsg = { at: Date.now(), text: (r && r.text) || '没有响应：刷新一次游戏页再点' };
      if (!r || !r.ok) { setHint(dexMsg.text); dexStartBtn.disabled = false; }
      refresh();
    });
  }

  var dexStopBtn = $('#dex-stop');
  if (dexStopBtn) {
    dexStopBtn.addEventListener('click', async function () {
      if (needGameTab()) return;
      dexStopBtn.disabled = true;
      var r = null;
      try { r = await sendToTab({ type: MSG.DEX_STOP || 'pcg-dex-stop' }); }
      catch (e) { /* ignore */ }
      dexMsg = { at: Date.now(), text: (r && r.text) || '没有响应：刷新一次游戏页再点' };
      refresh();
    });
  }

  /* --- 第三批：培育屋监测（配置存在扩展本地，改完立刻推给页面） --- */
  var nurseryCfgIds = ['#ns-hud', '#ns-hud-always', '#ns-auto-hatch',
    '#ns-auto-hatch-shiny', '#ns-auto-feed-egg', '#ns-auto-shiny-berry', '#ns-auto-jump'];
  nurseryCfgIds.forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('change', async function () {
      nurseryUiEditAt = Date.now();
      /* 第九十七批：两个取蛋开关改成真正互斥 —— 点哪个哪个留下，另一个自动取消。
       * 以前只有「同时勾上时让『连闪光蛋一起收』赢」，玩家先勾了「只收非闪光蛋」
       * 再去勾另一项，前一项只是自己弹回去，看着像点不动。 */
      if (el.checked && el.id === 'ns-auto-hatch') {
        var nsAllSwap = $('#ns-auto-hatch-shiny');
        if (nsAllSwap) nsAllSwap.checked = false;
      } else if (el.checked && el.id === 'ns-auto-hatch-shiny') {
        var nsMainSwap = $('#ns-auto-hatch');
        if (nsMainSwap) nsMainSwap.checked = false;
      }
      nsSyncShinyLock();
      if (needGameTab()) return;
      await sendToTab({ type: MSG.NURSERY_CONFIG || 'pcg-nursery-config', cfg: nurseryCfgFromUI() });
      refresh();
    });
  });
  nsSyncShinyLock();
  var nsRefreshBtn = $('#ns-refresh');
  if (nsRefreshBtn) {
    nsRefreshBtn.addEventListener('click', async function () {
      if (needGameTab()) return;
      var r = await sendToTab({ type: MSG.NURSERY_REFRESH || 'pcg-nursery-refresh' });
      nsSet('#ns-note', (r && r.text) || '没有响应：刷新一次游戏页再点');
      refresh();
    });
  }
  var nsClearBtn = $('#ns-clear');
  if (nsClearBtn) {
    nsClearBtn.addEventListener('click', async function () {
      if (needGameTab()) return;
      if (!window.confirm('清零插件自己记录的观测统计？游戏存档里的累计孵化不会动。')) return;
      var r = await sendToTab({ type: MSG.NURSERY_CLEAR || 'pcg-nursery-clear' });
      nsSet('#ns-note', (r && r.text) || '没有响应：刷新一次游戏页再点');
      nurserySig = '';
      refresh();
    });
  }

  /* --- 第四批：黑市扫货（意向表与参数都存扩展本地，改完立刻推给页面） --- */
  var marketCfgIds = ['#mk-dry', '#mk-hud', '#mk-interval', '#mk-idle'];
  var pushMarketCfg = async function () {
    var cfg = marketCfgFromUI();
    if (isGameTab) await sendToTab({ type: MSG.MARKET_CONFIG || 'pcg-market-config', cfg: cfg });
    return cfg;
  };
  marketCfgIds.forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('change', async function () {
      marketUiEditAt = Date.now();
      if (needGameTab()) return;
      await pushMarketCfg();
      refresh();
    });
  });

  var mkAddBtn = $('#mk-add-btn');
  if (mkAddBtn) {
    mkAddBtn.addEventListener('click', async function () {
      if (needGameTab()) return;
      var qi = $('#mk-q'), pi = $('#mk-price'), si = $('#mk-shiny'), ni = $('#mk-qty');
      var rule = {
        query: qi ? String(qi.value || '').trim() : '',
        maxPrice: pi ? (parseInt(pi.value, 10) || 0) : 0,
        shiny: si ? si.value : 'any',
        /* 第三十批：这条意向总共要买几只，默认 1、最高 99 */
        qty: ni ? (parseInt(ni.value, 10) || 1) : 1
      };
      var r = await sendToTab({
        type: MSG.MARKET_RULES || 'pcg-market-rules', op: 'add', payload: { rule: rule }
      });
      marketMsg = { at: Date.now(), text: (r && r.text) || (r && r.ok ? '意向已添加' : '没有响应：刷新一次游戏页再点') };
      if (r && r.ok) {
        if (qi) qi.value = '';
        if (pi) pi.value = '';
        if (ni) ni.value = '1';
      } else if (r && r.text) {
        setHint(r.text);
      }
      marketSig = '';
      refresh();
    });
  }

  var mkRulesEl = $('#mk-rules');
  if (mkRulesEl) {
    mkRulesEl.addEventListener('click', async function (ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!el || needGameTab()) return;
      var act = el.getAttribute('data-act');
      var id = el.getAttribute('data-id');
      if (!id) return;
      if (act === 'toggle') {
        await sendToTab({
          type: MSG.MARKET_RULES || 'pcg-market-rules', op: 'toggle',
          payload: { id: id, enabled: !!el.checked }
        });
      } else if (act === 'remove') {
        await sendToTab({
          type: MSG.MARKET_RULES || 'pcg-market-rules', op: 'remove', payload: { id: id }
        });
      }
      marketSig = '';
      refresh();
    });
  }

  var mkScanBtn = $('#mk-scan');
  if (mkScanBtn) {
    mkScanBtn.addEventListener('click', async function () {
      if (needGameTab()) return;
      mkScanBtn.disabled = true;
      await pushMarketCfg();
      var r = await sendToTab({ type: MSG.MARKET_SCAN || 'pcg-market-scan' });
      marketMsg = { at: Date.now(), text: (r && r.text) || '没有响应：刷新一次游戏页再点' };
      if (!r || !r.ok) setHint(marketMsg.text);
      mkScanBtn.disabled = false;
      refresh();
    });
  }

  var mkStartBtn = $('#mk-now');
  if (mkStartBtn) {
    mkStartBtn.addEventListener('click', async function () {
      if (needGameTab()) return;
      mkStartBtn.disabled = true;
      var cfg = await pushMarketCfg();
      var r = await sendToTab({ type: MSG.MARKET_START || 'pcg-market-start', cfg: cfg });
      marketMsg = { at: Date.now(), text: (r && r.text) || '没有响应：刷新一次游戏页再点' };
      if (!r || !r.ok) { setHint(marketMsg.text); mkStartBtn.disabled = false; }
      refresh();
    });
  }

  var mkStopBtn = $('#mk-stop');
  if (mkStopBtn) {
    mkStopBtn.addEventListener('click', async function () {
      if (needGameTab()) return;
      var r = await sendToTab({ type: MSG.MARKET_STOP || 'pcg-market-stop' });
      marketMsg = { at: Date.now(), text: (r && r.text) || '已停止扫货' };
      refresh();
    });
  }

  var mkClearBtn = $('#mk-clear');
  if (mkClearBtn) {
    mkClearBtn.addEventListener('click', async function () {
      if (needGameTab()) return;
      if (!window.confirm('清零插件自己记录的统计、事件和「已处理商品」去重表？意向表会保留。')) return;
      var r = await sendToTab({ type: MSG.MARKET_CLEAR || 'pcg-market-clear' });
      marketMsg = { at: Date.now(), text: (r && r.text) || '没有响应：刷新一次游戏页再点' };
      marketSig = '';
      refresh();
    });
  }
}

/* ---------------- 本系威力排名（数据在 stab.js） ---------------- */
/* v1.48：属性选择记忆。默认火属性；玩家切到别的属性后收起 / 重开插件，
 * 都从 localStorage 恢复上次看的那一个，不再被强切回火。 */
var STAB_TAB_KEY = 'pcgStabTabV1';
var stabCur = '';

function loadStabTab(D) {
  var t = '';
  try { t = localStorage.getItem(STAB_TAB_KEY) || ''; } catch (e) { t = ''; }
  if (D && D.order && D.order.indexOf(t) >= 0) return t;
  return (D && D.order && D.order.indexOf('fire') >= 0) ? 'fire' : (D ? D.order[0] : '');
}
function saveStabTab(t) {
  try { localStorage.setItem(STAB_TAB_KEY, t || 'fire'); } catch (e) { /* ignore */ }
}

function renderStab() {
  var D = window.PCG_STAB;
  var tabs = $('#stab-tabs');
  var tbl = $('#stab-tbl');
  if (!D || !tabs || !tbl) return;

  if (!stabCur) stabCur = loadStabTab(D);

  if (!tabs.childElementCount) {
    D.order.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'stab-tab';
      b.setAttribute('data-t', t);
      b.textContent = D.tzh[t] || t;
      b.style.setProperty('--c', D.color[t] || '#777');
      tabs.appendChild(b);
    });
  }
  Array.prototype.forEach.call(tabs.children, function (b) {
    var on = b.getAttribute('data-t') === stabCur;
    b.classList.toggle('on', on);
    b.style.background = on ? (D.color[b.getAttribute('data-t')] || '#777') : '';
  });

  /* 第一百一十三批：全属性阿尔宙斯形态插进来后，火 / 格斗形态最高排到第 11 名，
   * 榜单至少显示到 D.arceus.maxRank，保证新增形态在每个属性页都能被看到。 */
  var topN = Math.max(10, (D.arceus && D.arceus.maxRank) || 0);
  var rows = D.top(stabCur, topN);
  var max = rows.length ? rows[0].val : 1;
  var col = D.color[stabCur] || '#777';

  tbl.textContent = '';
  var thead = document.createElement('thead');
  var htr = document.createElement('tr');
  [['#', 'r'], ['宝可梦', 'n'], ['稀有度', 'rare'], ['本系招式', 'm'], ['期望值', 'v']].forEach(function (c) {
    var th = document.createElement('th');
    th.className = c[1];
    th.textContent = c[0];
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  tbl.appendChild(thead);

  var tbody = document.createElement('tbody');
  rows.forEach(function (r) {
    var tr = document.createElement('tr');
    if (r.rank === 1) tr.className = 'first';

    var td0 = document.createElement('td');
    td0.className = 'r';
    td0.textContent = String(r.rank);

    var td1 = document.createElement('td');
    td1.className = 'n';
    /* 第一百一十一批：战力榜里的宝可梦名字也挂小立绘 */
    if (r.id) td1.appendChild(monArtNode(r.id, false, 'mon-art-s'));
    td1.appendChild(document.createTextNode(r.name));

    /* v1.49：稀有度按游戏原版徽章样式——彩色描边胶囊 + 档位中文名，
       配色取游戏 CONFIG.TIERS：常见#9aa4b1 少见#3b82f6 稀有#a855f7
       传说#f5c518 独一无二#ff5fa2。 */
    var tdR = document.createElement('td');
    tdR.className = 'rare';
    var tier = (D.rr && D.rr[r.id] != null) ? Number(D.rr[r.id]) : 0;
    var rinfo = (GUI && typeof GUI.rarityInfo === 'function')
      ? GUI.rarityInfo(tier)
      : { zh: ['常见','少见','稀有','传说','独一无二'][tier] || '常见',
          color: ['#9aa4b1','#3b82f6','#a855f7','#f5c518','#ff5fa2'][tier] || '#9aa4b1' };
    var pill = document.createElement('span');
    pill.className = 'stab-rare-pill';
    pill.textContent = rinfo.zh;
    pill.title = '稀有度：' + rinfo.zh;
    pill.style.setProperty('--rc', rinfo.color);
    tdR.appendChild(pill);

    var td2 = document.createElement('td');
    td2.className = 'm';
    var mv = document.createElement('b');
    mv.textContent = r.mv;
    var sub = document.createElement('i');
    sub.textContent = r.pw + (r.cat === 'phys' ? ' 物' : ' 特') + ' · ' + Math.round(r.acc) + '%';
    td2.appendChild(mv);
    td2.appendChild(sub);

    var td3 = document.createElement('td');
    td3.className = 'v';
    var num = document.createElement('b');
    num.textContent = Math.round(r.val).toLocaleString('en-US');
    var bar = document.createElement('span');
    bar.className = 'bar';
    bar.style.width = Math.max(4, Math.round(r.val / max * 44)) + 'px';
    bar.style.background = col;
    td3.appendChild(num);
    td3.appendChild(bar);
    td3.title = r.name + ' ' + (r.cat === 'phys' ? '物理' : '特殊') + ' ' + r.mv +
      ' 威力 ' + r.pw + ' × ' + (r.cat === 'phys' ? '攻击' : '特攻') + ' ' + r.stat + '（Lv100）' +
      ' × 本系 1.5 × 命中 ' + Math.round(r.acc) + '% = ' + Math.round(r.val);

    tr.appendChild(td0);
    tr.appendChild(td1);
    tr.appendChild(tdR);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  bindMonArt(tbody);

  var eg = $('#stab-eg');
  if (eg && rows.length) {
    var r0 = rows[0];
    eg.textContent = '第 1 名：' + r0.name + ' ' + (r0.cat === 'phys' ? '物理' : '特殊') +
      ' ' + r0.mv + ' 威力 ' + r0.pw + ' × ' + (r0.cat === 'phys' ? '攻击' : '特攻') + ' ' + r0.stat +
      '（Lv100） × 本系 1.5 × 命中 ' + Math.round(r0.acc) + '% = ' + Math.round(r0.val) +
      '（这个属性一共 ' + (D.rank[stabCur] || []).length + ' 只参赛）';
  }
}

/* 第七批：content 在「开始追踪」时会自动打开蔓莓果自动喂食，
 * 这里跟着 storage 变化把面板上的勾选框同步过来，不用重新开 popup。 */
try {
  chrome.storage.onChanged.addListener(function (changes, area) {
    /* 第八十九批：手机浏览器上没有 sync 区时插件退回 local，这里两个区都收 */
    if (area !== 'sync' && area !== 'local') return;
    if (changes.feedItems) {
      settings.feedItems = Object.assign({}, changes.feedItems.newValue || {});
      document.querySelectorAll('input[data-feed-key]').forEach(function (box) {
        box.checked = !!settings.feedItems[box.getAttribute('data-feed-key')];
      });
    }
  });
} catch (e) { /* ignore */ }

/* 第七批：所有功能面板的标题小图标统一取自游戏 assets/，
 * 不再由插件自造符号；GUI.icon() 会按上下文返回扩展绝对地址或相对地址。 */
var PANE_ICONS = {
  'grp-core': 'ball', 'grp-auto': 'map',
  'pane-item': 'honey', 'pane-berry': 'berry',
'pane-dex': 'ball', 'pane-nursery': 'egg',
  'pane-feed': 'oran', 'pane-leg': 'sparkle', 'pane-ug': 'grass',
  'pane-raid': 'lock', 'pane-stab': 'grass',
  'pane-fav': 'ball', 'pane-keepdup': 'ball',
  'pane-roadshiny': 'shinyBall', 'pane-geodes': 'geode-legendary'
};
/* 第六十五批：这两枚标题图标改成**文字符号** —— 联盟刷钱挂 ₽（钱），
 * 定点循环挂 🔁（循环）。游戏 assets 里没有这两个东西，用文字画在同样的位置、
 * 同样的 14px 格子里，跟图片图标对齐（样式见 popup.css 的 .pane-glyph）。 */
var PANE_GLYPH = { 'pane-farm': '₽', 'pane-orb': '🔁' };
function paintPaneIcons() {
  Object.keys(PANE_GLYPH).forEach(function (id) {
    var box = document.getElementById(id);
    if (!box) return;
    var sum = box.querySelector('summary');
    if (!sum || sum.querySelector('.pane-glyph')) return;
    var b = sum.querySelector('b');
    if (!b) return;
    var sp = document.createElement('span');
    sp.className = 'pane-glyph';
    sp.setAttribute('aria-hidden', 'true');
    sp.textContent = PANE_GLYPH[id];
    sum.insertBefore(sp, b);
  });
  if (!GUI) return;
  Object.keys(PANE_ICONS).forEach(function (id) {
    var box = document.getElementById(id);
    if (!box) return;
    var sum = box.querySelector('summary');
    if (!sum || sum.querySelector('img.pane-ico')) return;
    var b = sum.querySelector('b');
    if (!b) return;
    var img = document.createElement('img');
    img.className = 'pane-ico';
    img.alt = '';
    img.src = GUI.icon(PANE_ICONS[id]);
    sum.insertBefore(img, b);
  });
}

/* ---------------- 第七十三批：面板收起再打开，停在原来那一行 ----------------
 *
 * 面板是个固定高度的小窗口，定点循环那三个下拉框（地区 / 章节 / 第几个点）在整页
 * 很靠下的位置 —— 玩家关掉面板再点开图标，就得一路重新滚下去找它们。这里在滚动时
 * 把位置记进 localStorage（跟卡片展开状态一样，存在扩展自己的存储里），下次打开、
 * 等列表和卡片都画完（页面高度够了）再滚回去，那个下拉框就还在原来那一行。
 *
 * 三条边界：
 *   - 只恢复一次：滚到位就把标记清掉，玩家自己再滚不会被打回原位；
 *   - 数据没画完就滚会被「最大滚动高度」截住 —— 所以按「高度够了再滚」重试几拍；
 *   - 存的是绝对像素：万一这次内容更矮（卡片被收起 / 游戏页没连上），自然截到能滚的最底，
 *     不会出现「滚不动又反复跳」。 */
var SCROLL_KEY = 'pcgScrollY1';
var SCROLL_TRIES = 12;          // 最多试 12 拍（100ms 一拍），等卡片 / 列表把高度撑起来
var scrollLeftTries = 0;        // > 0 表示正在恢复，这期间的滚动不往存储里写
var scrollWantY = 0;
var scrollSaveAt = 0;

function panelScrollY() {
  var d = document.documentElement, b = document.body;
  return Math.max(
    window.pageYOffset || 0,
    d ? d.scrollTop || 0 : 0,
    b ? b.scrollTop || 0 : 0
  );
}

function panelScrollMax() {
  var d = document.documentElement, b = document.body;
  var m = 0;
  /* 面板真正的滚动条挂在 body 上（body{max-height:600px;overflow-y:auto}），
   * 所以先按各自的可滚距离取大的，再用「内容高 - 视口高」兜一次。 */
  if (b) m = Math.max(m, (b.scrollHeight || 0) - (b.clientHeight || 0));
  if (d) m = Math.max(m, (d.scrollHeight || 0) - (d.clientHeight || 0));
  m = Math.max(m, Math.max(d ? d.scrollHeight || 0 : 0, b ? b.scrollHeight || 0 : 0) -
    (window.innerHeight || 0));
  return Math.max(0, m);
}

/* 滚到指定位置：面板的滚动容器是 body，只调 window.scrollTo 不管用，三处都写一遍 */
function panelScrollTo(y) {
  var b = document.body, d = document.documentElement;
  try { if (b) b.scrollTop = y; } catch (e) { /* ignore */ }
  try { if (d) d.scrollTop = y; } catch (e) { /* ignore */ }
  try { window.scrollTo(0, y); } catch (e) { /* ignore */ }
}

function panelScrollSave() {
  if (scrollLeftTries > 0) return;   // 恢复途中别把自己的目标值写花
  try { localStorage.setItem(SCROLL_KEY, String(Math.round(panelScrollY()))); }
  catch (e) { /* ignore */ }
}

/* 滚动时记位置：节流到 200ms 一次，省得每一帧都写一次存储 */
function panelScrollNote() {
  var t = Date.now();
  if (t - scrollSaveAt < 200) return;
  scrollSaveAt = t;
  panelScrollSave();
}

function panelScrollTick() {
  if (!(scrollLeftTries > 0)) return;
  scrollLeftTries--;
  /* 高度还不够就到不了目标位置 —— 先滚（能滚多少算多少），下一拍再看 */
  if (panelScrollMax() + 2 >= scrollWantY) {
    panelScrollTo(scrollWantY);
    if (Math.abs(panelScrollY() - scrollWantY) <= 2) { scrollLeftTries = 0; return; }
  }
  if (scrollLeftTries > 0) setTimeout(panelScrollTick, 100);
  /* 试到最后一拍还没够高：这次内容比上次矮（卡片被收起 / 没连上游戏页），
   * 那就停在能滚到的最底，别死磕一个到不了的位置 */
  else panelScrollTo(Math.min(scrollWantY, panelScrollMax()));
}

/* 面板打开后调一次：读过上次的位置就滚回去 */
function panelScrollRestore() {
  var v = 0;
  try { v = Number(localStorage.getItem(SCROLL_KEY) || 0); } catch (e) { v = 0; }
  if (!(v > 0)) return;
  scrollWantY = Math.round(v);
  scrollLeftTries = SCROLL_TRIES;
  panelScrollTick();
}

/* ==================== 第一百一十九批：配置本地持久化（弹窗侧） ====================
 * content.js 把全量设置双写到游戏页面 localStorage，manifest 也固定了扩展 ID。
 * 这里再给玩家三个手动入口：导出配置（下载 JSON）、导入配置、从本地备份恢复。 */
(function bindConfigBackup() {
  function el(id) { return document.getElementById(id); }
  function setNote(text, tone) {
    var n = el('cfg-note');
    if (!n) return;
    n.textContent = text;
    n.setAttribute('data-tone', tone || 'idle');
  }
  function tsText(ms) {
    if (!ms) return '还没有本地备份（打开一次游戏页后自动生成）';
    try {
      return '上次本地备份：' + new Date(Number(ms)).toLocaleString('zh-CN', { hour12: false });
    } catch (e) { return '上次本地备份：时间未知'; }
  }

  var exp = el('cfg-export');
  if (exp) exp.addEventListener('click', function () {
    try {
      SYNC.get(null, function (raw) {
        void chrome.runtime.lastError;
        var mfVer = '';
        try { mfVer = (chrome.runtime.getManifest() || {}).version || ''; } catch (e0) { /* ignore */ }
        var data = JSON.stringify({
          app: "Poke'Catch 防掉线助手", ver: mfVer,
          at: Date.now(), settings: raw || {}
        }, null, 2);
        var url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
        var a = document.createElement('a');
        a.href = url;
        a.download = 'pokecatch-settings-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e1) { /* ignore */ }
        }, 1000);
        setNote('已导出配置文件', 'ok');
      });
    } catch (e2) { setNote('导出失败：' + ((e2 && e2.message) || e2), 'warn'); }
  });

  var imp = el('cfg-import'), file = el('cfg-file');
  if (imp && file) {
    imp.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var obj = JSON.parse(String(reader.result || ''));
          var cfg = (obj && obj.settings && typeof obj.settings === 'object') ? obj.settings : obj;
          if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw new Error('文件格式不对');
          settings = Object.assign({}, DEFAULT_SETTINGS, settings, cfg);
          settings.feedItems = Object.assign({}, settings.feedItems || {});
          applySettingsToUI(settings);
          document.querySelectorAll('input[data-feed-key]').forEach(function (b) {
            b.checked = !!settings.feedItems[b.getAttribute('data-feed-key')];
          });
          saveAndPush();
          setNote('已导入配置并应用到游戏页', 'ok');
        } catch (e3) { setNote('导入失败：' + ((e3 && e3.message) || e3), 'warn'); }
      };
      reader.onerror = function () { setNote('读取文件失败', 'warn'); };
      reader.readAsText(f);
      file.value = '';
    });
  }

  var rst = el('cfg-restore');
  if (rst) rst.addEventListener('click', function () {
    sendToTab({ type: 'pcg-cfg-restore' }).then(function (r) {
      if (r && r.ok && r.cfg) {
        settings = Object.assign({}, DEFAULT_SETTINGS, r.cfg);
        settings.feedItems = Object.assign({}, settings.feedItems || {});
        applySettingsToUI(settings);
        setNote('已从本地备份恢复上次的设置', 'ok');
      } else {
        setNote((r && r.text) || '没找到本地备份（先打开一次游戏页）', 'warn');
      }
    });
  });

  // currentTabId 要等首轮 refresh() 才拿到，延迟问一次本地备份时间
  setTimeout(function () {
    sendToTab({ type: 'pcg-cfg-info' }).then(function (r) {
      setNote(tsText(r && r.at), 'idle');
    });
  }, 1600);
})();

/* 第一百二十批：配置持久化兜底。游戏页内容脚本启动时会自动恢复，
 * 但插件刚装 / 重装、游戏页还没刷新过时，弹窗这边主动问一次本地备份。
 * currentTabId 要等首轮 refresh() 才拿到，所以由 init() 在 refresh() 之后调用。 */
async function tryCfgAutoRestore() {
  if (!isGameTab) return;
  var raw = await new Promise(function (res) {
    try { SYNC.get(null, function (r) { void chrome.runtime.lastError; res(r || {}); }); }
    catch (e) { res({}); }
  });
  var keys = Object.keys(raw);
  var onlyMigrations = keys.every(function (k) {
    return ['autoModal', 'cfgV', 'dexAutoFeed', 'legAutoFeed', 'feedItems',
      'ugCheckSec', 'ugSecV', 'dexHud', 'legHud', 'farmHud', 'orbHud', 'hudV'].indexOf(k) >= 0;
  });
  if (keys.length && !onlyMigrations) return;
  var r = await sendToTab({ type: 'pcg-cfg-restore' });
  if (!r || !r.ok || !r.cfg) return;
  settings = Object.assign({}, DEFAULT_SETTINGS, r.cfg);
  settings.feedItems = Object.assign({}, settings.feedItems || {});
  applySettingsToUI(settings);
  var note = document.getElementById('cfg-note');
  if (note) {
    note.textContent = '已自动从本地备份恢复上次的设置';
    note.setAttribute('data-tone', 'ok');
  }
}

async function init() {
  /* 第八十九批：全屏模式（popup.html?tab=1）先给 body 打标，
   * CSS 里 .mode-tab 那几条（宽度按屏幕走、标题栏吸顶、不限高）才会生效。 */
  if (TAB_MODE) {
    try { document.body.classList.add('mode-tab'); } catch (e0) { /* ignore */ }
    try { document.title = document.title + ' · 全屏面板'; } catch (e1) { /* ignore */ }
  }
  var verEl = $('#ver');
  try {
    if (verEl) verEl.textContent = 'v' + chrome.runtime.getManifest().version;
  } catch (e) { /* ignore */ }
  paintPaneIcons();
  bind();
  renderStab();
  settings = await getSettings();
  applySettingsToUI(settings);
  renderUgFrom(null);   // 档位是写死的，不用等游戏页报状态
  await refresh();
  tryCfgAutoRestore();
  /* 第七十三批：首屏（含卡片展开状态、几个下拉框）都画完了再滚回上次的位置 */
  panelScrollRestore();
  pollTimer = setInterval(refresh, 1000);
}

window.addEventListener('unload', function () {
  if (pollTimer) clearInterval(pollTimer);
  panelScrollSave();
  hideFeedTip();
});

// 滚动时把浮层收起来，免得它飘在原地
window.addEventListener('scroll', hideFeedTip, true);
// 第七十三批：顺手记下滚到哪儿了，下次打开还停在这一行
window.addEventListener('scroll', panelScrollNote, true);

init();


/* ============================================================
 * 第五批：闪光战斗守卫 / 稀有道具刷取 / 树果刷取面板
 * 两个刷取模块由 farm-engine.create(SPEC) 生成，state / config / scan /
 * start / stop / clear 完全同构，这里用一张表把两个面板一起渲染、一起绑定。
 * ========================================================== */
var FM_UI = {
  item: { p: 'it', label: '稀有道具刷取', dataKey: 'items',
    scan: 'ITEM_SCAN', start: 'ITEM_START', stop: 'ITEM_STOP', cfg: 'ITEM_CONFIG', clear: 'ITEM_CLEAR' },
  berry: { p: 'by', label: '树果刷取', dataKey: 'berries',
    scan: 'BERRY_SCAN', start: 'BERRY_START', stop: 'BERRY_STOP', cfg: 'BERRY_CONFIG', clear: 'BERRY_CLEAR' }
};
var farmSig = { item: '', berry: '' };
var farmBound = false;
var farmUiEditAt = 0;

function fmEsc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function fmSet(id, v) {
  var el = $(id);
  var t = String(v == null ? '' : v);
  if (el && el.textContent !== t) el.textContent = t;
}
/* 第四十批：期望数值统一格式（0.7% / 3.5% / 0.69%） */
function fmPct(v) {
  var n = Number(v) || 0;
  if (!n) return '—';
  var p = n * 100;
  return (p >= 1 ? Math.round(p * 10) / 10 : Math.round(p * 100) / 100) + '%';
}
function fmMins(v) {
  var m = Number(v) || 0;
  if (!m) return '—';
  /* 第四十一批：不到一分钟写秒，别显示成「0 分」 */
  if (m < 1) return Math.max(1, Math.round(m * 60)) + ' 秒';
  return (m >= 10 ? Math.round(m) : Math.round(m * 10) / 10) + ' 分';
}
function fmNum(id, d) {
  var el = $(id); var n = el ? parseInt(el.value, 10) : NaN;
  return isFinite(n) ? n : d;
}
function fmData() { return window.PCG_ITEM_DATA || null; }

function fmCatalog(kind) {
  var D = fmData();
  if (!D) return [];
  if (kind === 'item') {
    return (D.rares || []).map(function (r) {
      /* 第四十批：小字直接写「只去那张图」的期望（单趟概率 · 期望轮数），
       * 不再是「三张图里最高的那个 p」——那数字根本走不到。 */
      var rows = (D.rankMaps ? D.rankMaps(r.id) : []) || [];
      var b = rows[0] || null;
      var tide = (r.maps || []).some(function (m) { return m.tide === 'low'; });
      var tip = b && b.run
        ? (fmPct(b.run) + '/趟 · ' + Math.round(b.runs) + ' 轮')
        : fmPct(b ? b.p : 0);
      /* v1.26：功能描述走 data-tip 前缀（简洁一句话），概率放后面；
       * 断牙这类 needN>1 的收集道具，进度在 fmMarkTargets 里覆盖成 N/10。 */
      return { id: r.id, name: r.zh || r.fr || r.id,
        desc: r.desc || '',
        tip: (r.desc ? r.desc + ' · ' : '') + tip + (tide ? ' · 需退潮' : '') };
    });
  }
  /* 第五十四批：意向树果按附件的 Word 表格重排 —— 每行两组、每组三段
   * 「名称 / 效果 / 持有数N」。顺序与文案一律照文档，不再用旧版
   * 「普通树果·有12」「最快那张图的期望」那套简写。
   * 名字仍从数据表取（游戏本体中文），只有「效果」这列用文档原文。 */
  var BY_DOC = [
    ['berry-oran', '孵蛋5分钟'], ['nanab-berry', '稀有x2'],
    ['berry-pecha', '孵蛋15分钟'], ['enigma-berry', '未捕获x3'],
    ['berry-sitrus', '孵蛋30分钟'], ['starf-berry', '闪光x2'],
    ['razz-berry', '捕捉x1.25'], ['lansat-berry', '金币x1.25'],
    ['golden-razz-berry', '捕捉×1.5'], ['pinap-berry', '经验x1.25']
  ];
  var byId = {};
  (D.berries || []).forEach(function (b) { byId[b.id] = b; });
  var cat = BY_DOC.map(function (pair) {
    var b = byId[pair[0]];
    return { id: pair[0], name: b ? (b.zh || b.fr || b.id) : pair[0],
      eff: pair[1], tip: pair[1] };
  });
  /* 数据表里若冒出新树果，兜在后面，别悄悄漏掉 */
  (D.berries || []).forEach(function (b) {
    if (!cat.some(function (t) { return t.id === b.id; })) {
      cat.push({ id: b.id, name: b.zh || b.fr || b.id,
        eff: b.buff ? (b.familyZh || b.family || '加成') + ' ×' + b.mult : '普通树果',
        tip: '' });
    }
  });
  /* 第九十一批：单选组最后一行「任意树果」—— 10 种加起来全算、只按总数统计。
   * 文案由这里给，fmMarkTargets 只负责把它写进 small.tip，别在两处各抄一份。 */
  cat.push({ id: 'any', name: '任意树果',
    tip: '所有树果全算 · 只按总数统计 · 固定在效率最高的一张图', any: true });
  return cat;
}

/* 首次把意向表 / 手动地图下拉生成出来，之后只同步选中态 */
function fmBuildStatic(kind) {
  var U = FM_UI[kind], pre = '#' + U.p + '-';
  var box = $(pre + 'targets');
  if (box && !box.getAttribute('data-built')) {
    var cat = fmCatalog(kind);
    /* 第二十七批：树果改单选（radio），道具刷取仍是多选（checkbox）
     * 第五十批：道具刷取多选要按「点击先后」排队，勾选框里直接写序号
     *          （<b class="ord"> 盖在方框里，CSS 见 #it-targets），树果没有这一层。 */
    var typ = kind === 'berry' ? 'radio' : 'checkbox';
    var nm = kind === 'berry' ? ' name="by-berry"' : '';
    box.innerHTML = cat.length ? cat.map(function (t) {
      var chip = kind === 'item' ? '<b class="ord"></b>' : '';
      /* v1.26：道具格的 title 写成「名称 — 功能描述」，鼠标悬停能看全描述；
       * 断牙这类长描述在小字里只留进度，完整说明靠这个 title。 */
      var title = (kind === 'item' && t.desc) ? (' title="' + fmEsc(t.name + ' — ' + t.desc) + '"') : '';
      var head = '<label data-id="' + fmEsc(t.id) + '" data-tip="' + fmEsc(t.tip) + '"' + title + '>' +
        '<span class="cbx"><input type="' + typ + '"' + nm + ' value="' + fmEsc(t.id) + '">' +
        chip + '</span>' + '<span class="nm">' + fmEsc(t.name) + '</span>';
      /* 第五十四批：树果每格三段（名称 / 效果 / 持有数N），照文档表格；
       * 最后一行的「任意树果」是通栏说明，只有一段小字。 */
      if (kind === 'berry') {
        return head + (t.any
          ? '<small class="tip">' + fmEsc(t.tip) + '</small>'
          : '<small class="own">持有数 —</small><small class="eff">' + fmEsc(t.eff) + '</small>') +
          '</label>';
      }
      return head + '<small>' + fmEsc(t.tip) + '</small></label>';
    }).join('') : '<span class="empty">数据表没加载，刷新一次插件</span>';
    box.setAttribute('data-built', '1');
  }
  /* 第三十一批：清单造好就先把「已获得 / 未解锁」画成灰的（读的是上次的结论），
   * 不等页面状态回来，玩家一眼看到的就是不可点。 */
  if (kind === 'item' && box) {
    if (FM_DIM) fmDimPaint(box, FM_DIM);
    else fmDimLoad();
  }
  var sel = $(pre + 'spot');
  if (sel && !sel.getAttribute('data-built')) {
    var D = fmData();
    /* 第四十一批：树果这边一张图＝一章（引擎进图只抓最早那个道具格），
     * 所以手动指定列表也按「每章一格」列，不再把同章后续步骤列成一堆重复项。 */
    var spots = (D && (kind === 'berry' ? D.berrySpots() : D.spots)) || [];
    sel.innerHTML = spots.map(function (sp) {
      return '<option value="' + fmEsc(sp.key) + '">' +
        fmEsc('第 ' + (sp.ch + 1) + ' 章 · ' + sp.zh + '（' + D.regionLabel(sp.rg) + '）') + '</option>';
    }).join('');
    sel.setAttribute('data-built', '1');
  }
}

/* 第二十六批：稀有道具「仅限获得一次」——
 * 已获得（存档 gifts / 背包里有）与地图未解锁的意向道具变黑、勾不动，
 * 右边小字写清是「已获得」还是「未解锁地图」；正在找的那一条描金边。 */
function fmMarkTargets(kind, s) {
  /* 第二十七批：树果这边补「简略效果 · 已有 N」，正在刷的那一种描金边 */
  if (kind === 'berry') {
    var bbox = $('#by-targets');
    if (!bbox) return;
    var bex = (s && s.extra) || null;
    var binfo = {};
    ((bex && bex.list) || []).forEach(function (r) { binfo[r.id] = r; });
    var bcur = (bex && bex.current) || '';
    Array.prototype.forEach.call(bbox.querySelectorAll('label[data-id]'), function (lab) {
      var id = lab.getAttribute('data-id');
      var r = binfo[id] || null;
      /* 第五十四批：按文档写成「名称 / 效果 / 持有数N」三段。
       * 效果与持有数是两个独立的小字，各写各的；1 秒轮询里没变化就不写 DOM。
       * 第九十一批：最后一行「任意树果」通栏，只有一段说明。 */
      if (id === 'any') {
        var tip = lab.querySelector('small.tip');
        var tt = lab.getAttribute('data-tip') || '';
        if (tip && tip.textContent !== tt) tip.textContent = tt;
      } else {
        var own = lab.querySelector('small.own');
        var eff = lab.querySelector('small.eff');
        var ot = r ? '持有数 ' + r.owned : '持有数 —';
        var et = r ? r.eff : (lab.getAttribute('data-tip') || '');
        if (own && own.textContent !== ot) own.textContent = ot;
        if (eff && eff.textContent !== et) eff.textContent = et;
      }
      var inp = lab.querySelector('input');
      var cls = fmLockCls(bbox,
        (((inp && inp.checked) ? 'on' : '') + (bcur && bcur === id ? ' cur' : '')).trim(), inp);
      if (lab.className !== cls) lab.className = cls;
    });
    return;
  }
  if (kind !== 'item') return;
  var box = $('#it-targets');
  if (!box) return;
  var ex = (s && s.extra) || null;
  var info = {};
  /* 第三十一批：优先用整张表的状态（ex.all），没勾过的也能立刻变灰；
   * 老版本引擎只给 ex.list（勾过的那几项），退回它别报错。 */
  var src = (ex && ex.all && ex.all.length) ? ex.all : ((ex && ex.list) || []);
  src.forEach(function (r) { info[r.id] = r; });
  var curId = (ex && ex.current) || '';
  /* 第五十批：队列（有序）——勾选框里的序号照着它画；受天气限制的那几项写清原因 */
  var orderIds = (ex && ex.order && ex.order.length) ? ex.order.slice() : fmOrderSync(box);
  var qmap = {};
  ((ex && ex.queue) || []).forEach(function (r) { if (r && r.id) qmap[r.id] = r; });
  fmOrderPaint(box, orderIds);
  var dimMap = {}, dimAny = false;
  Array.prototype.forEach.call(box.querySelectorAll('label[data-id]'), function (lab) {
    var id = lab.getAttribute('data-id');
    var r = info[id] || null;
    var got = !!(r && r.got);
    var locked = !!(r && r.locked && !r.got);
    var dim = got || locked;
    /* 第五十七批：锁定原因一起记下来（例如白金宝珠「需拥有骑拉帝纳」），
     * 下次打开弹窗先用缓存画，也不会退回笼统的「未解锁地图」。 */
    if (dim) {
      dimMap[id] = got ? 'got' : ('locked' + (r && r.lockMsg ? ':' + r.lockMsg : ''));
      dimAny = true;
    }
    var inp = lab.querySelector('input');
    if (inp) {
      if (inp.disabled !== dim) inp.disabled = dim;
      if (dim && inp.checked) inp.checked = false;
    }
    /* 正在找的那一条无论勾没勾都描金边，一眼能看出在刷哪个 */
    var cls = fmLockCls(box, dim ? ('dim ' + (got ? 'got' : 'locked')) :
      (((inp && inp.checked) ? 'on' : '') + (curId && curId === id ? ' cur' : '')).trim(), inp);
    /* 第五十七批：带精确锁定原因的格子改两行，别把名称挤成省略号 */
    if (locked && r && r.lockMsg) cls += ' long-msg';
    if (lab.className !== cls) lab.className = cls;
    var small = lab.querySelector('small');
    if (small) {
      /* 已获得 / 未解锁写明原因；受天气限制的写明是「已置后」还是「在等退潮」；
       * 其余保留概率提示（要退潮的地图在 tip 里本来就写着「需退潮」） */
      var q2 = qmap[id] || null;
      var ordN = orderIds.indexOf(id) + 1;
      /* v1.26：断牙这类 needN>1 的收集道具，未集满时把进度写进小字（如「3/10」），
       * 一眼看出还差几颗；功能描述仍在 data-tip 里，鼠标悬停可见。 */
      var prog = (r && r.need > 1 && !got) ? (' ' + (r.have || 0) + '/' + r.need) : '';
      var t = got ? '已获得' : (locked ? ((r && r.lockMsg) || '未解锁地图') :
        (q2 && q2.blocked ? (ordN > 1 ? '受天气限制·已置后' : '受天气限制·等退潮')
          : ((lab.getAttribute('data-tip') || '') + prog)));
      if (small.textContent !== t) small.textContent = t;
    }
  });
  /* 第三十一批：记到本地，下次打开弹窗不等状态就先把这些格子画成灰的 */
  if (src.length) fmDimSave(dimAny ? dimMap : {});
}

/* 第三十一批：「已获得 / 未解锁地图」记在 storage.local，
 * 弹窗一打开（还没收到页面状态时）就按上次的结论先把格子画灰，不再「点了才变灰」。 */
var FM_DIM_KEY = 'pcgItemDimV1';
var FM_DIM = null;              // { id: 'got' | 'locked' }，null = 还没从存储里读出来
var FM_DIM_TRIED = false;

function fmDimPaint(box, m) {
  if (!box || !m) return;
  Array.prototype.forEach.call(box.querySelectorAll('label[data-id]'), function (lab) {
    var id = lab.getAttribute('data-id');
    var raw = m[id] || '';
    if (!raw) return;
    var k = String(raw).split(':')[0];
    var msg = String(raw).indexOf(':') >= 0 ? String(raw).slice(String(raw).indexOf(':') + 1) : '';
    var inp = lab.querySelector('input');
    if (inp) {
      if (!inp.disabled) inp.disabled = true;
      if (inp.checked) inp.checked = false;
    }
    var cls = 'dim ' + k + (msg ? ' long-msg' : '');
    if (lab.className !== cls) lab.className = cls;
    var small = lab.querySelector('small');
    if (small) {
      var t = k === 'got' ? '已获得' : (msg || '未解锁地图');
      if (small.textContent !== t) small.textContent = t;
    }
  });
}

function fmDimLoad() {
  if (FM_DIM_TRIED) return;
  FM_DIM_TRIED = true;
  FM_DIM = {};
  try {
    chrome.storage.local.get(FM_DIM_KEY, function (raw) {
      void chrome.runtime.lastError;
      var m = (raw && raw[FM_DIM_KEY]) || null;
      if (!m || typeof m !== 'object') return;
      FM_DIM = m;
      fmDimPaint($('#it-targets'), m);
    });
  } catch (e) { /* ignore */ }
}

function fmDimSave(map) {
  FM_DIM = map || {};
  try {
    var o = {};
    o[FM_DIM_KEY] = FM_DIM;
    chrome.storage.local.set(o, function () { void chrome.runtime.lastError; });
  } catch (e) { /* ignore */ }
}

/* ---------------- 第五十批：多选的「点击先后」＝刷取顺序 ----------------
 * 勾选框里那个小数字就是队列序号（1 先刷、2 次之…），引擎按这个顺序
 * 一种一种刷，保证同时只有一个道具在刷。
 *   FM_ORDER.item  玩家点选的先后（只记勾着的、还能勾的）
 *   面板那边可能因为「受天气/时段限制」把某项挪到队尾（ex.order），
 *   收到状态时以它为准，所以序号会跟着变 —— 玩家一眼就能看出来谁被置后了。 */
var FM_ORDER = { item: [] };

function fmOrderSync(box) {
  if (!box) return [];
  /* 第五十六批：功能跑起来时所有 input 都被锁成 disabled，但勾着的还是勾着。
   * 这时若有人改了参数触发一次配置回传，别把整条队列读成空的。 */
  var locked = !!(box.getAttribute && box.getAttribute('data-locked') === '1');
  var on = [];
  Array.prototype.forEach.call(box.querySelectorAll('input'), function (i) {
    if (i.checked && (!i.disabled || locked)) on.push(i.value);
  });
  var out = [], seen = {};
  FM_ORDER.item.forEach(function (id) {
    if (on.indexOf(id) >= 0 && !seen[id]) { seen[id] = 1; out.push(id); }
  });
  on.forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.push(id); } });
  FM_ORDER.item = out;
  return out;
}

/* 刚勾上 → 排到队尾；刚取消 → 从队里删掉（后面的序号自动往前补） */
function fmOrderTouch(box, id, on) {
  if (!box) return [];
  FM_ORDER.item = FM_ORDER.item.filter(function (x) { return x !== id; });
  if (on) FM_ORDER.item.push(id);
  return fmOrderSync(box);
}

/* 第五十三批：序号不再只靠 popup.css 画。
 * 之前 `b.ord` 的 display / 方框的 appearance 全写在样式表里，只要浏览器
 * 还拿着旧版 popup.css（缓存 / 没点「重新加载」/ 解压时漏了样式表），
 * 就会变回原生蓝勾、数字被 display:none 压住 —— 看上去一个序号都没有。
 * 现在改成三层保险：
 *   ① 关键样式直接内联写到元素上（优先级高于任何样式表），老 DOM 缺 .cbx / b.ord
 *      也现场补出来；
 *   ② 勾选框里画金色底 + 白数字的方块徽标，比原来的细金线数字醒目得多；
 *   ③ 清单上方再用**纯文字**写一遍「刷取顺序：① A → ② B → ③ C」，
 *      即便所有样式都丢了，顺序也照样看得见。
 */
var FM_ORD_MARK = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
var FM_ORD_BADGE =
  'position:absolute;left:0;top:0;width:14px;height:14px;box-sizing:border-box;' +
  'align-items:center;justify-content:center;font-size:10px;font-weight:800;' +
  'line-height:1;color:#fff;background:var(--gold,#b07d00);' +
  'border-radius:3px;z-index:3;pointer-events:none;';

/* 只跑一次：把 .cbx / 原生方框 / 序号徽标的关键样式钉成内联的 */
function fmOrderEnsure(box) {
  if (!box || !box.querySelectorAll) return;
  Array.prototype.forEach.call(box.querySelectorAll('label[data-id]'), function (lab) {
    if (!lab.getAttribute || lab.getAttribute('data-ord-ready') === '1') return;
    var cbx = lab.querySelector ? lab.querySelector('.cbx') : null;
    var inp = lab.querySelector ? lab.querySelector('input') : null;
    var canMake = typeof document !== 'undefined' && document && document.createElement;
    if (!cbx && inp && canMake) {
      try {
        cbx = document.createElement('span');
        cbx.className = 'cbx';
        inp.parentNode.insertBefore(cbx, inp);
        cbx.appendChild(inp);
      } catch (e) { cbx = null; }
    }
    if (cbx && cbx.style) {
      cbx.style.position = 'relative';
      cbx.style.display = 'inline-flex';
      cbx.style.flex = '0 0 auto';
      cbx.style.width = '14px';
      cbx.style.height = '14px';
    }
    if (inp && inp.style) {
      if (inp.style.setProperty) inp.style.setProperty('-webkit-appearance', 'none');
      else inp.style.webkitAppearance = 'none';
      inp.style.appearance = 'none';
      inp.style.margin = '0';
      inp.style.width = '14px';
      inp.style.height = '14px';
      inp.style.borderRadius = '4px';
      /* 旧样式表下也不能让没勾的格子变成一块透明空白 */
      inp.style.border = '1px solid var(--line, #c9cfdb)';
      inp.style.background = 'var(--sunken, #fff)';
      inp.style.cursor = 'pointer';
    }
    var b = lab.querySelector ? lab.querySelector('b.ord') : null;
    if (!b && cbx && canMake) {
      try {
        b = document.createElement('b');
        b.className = 'ord';
        cbx.appendChild(b);
      } catch (e2) { b = null; }
    }
    if (b && b.style) b.style.cssText = FM_ORD_BADGE + 'display:none;';
    if (lab.setAttribute) lab.setAttribute('data-ord-ready', '1');
  });
}

/* 纯文字的顺序行：不依赖 CSS，样式表全丢也照显示 */
function fmOrderLinePaint(ids) {
  var el = (typeof document !== 'undefined' && document && document.getElementById)
    ? document.getElementById('it-order') : null;
  if (!el) return;
  var list = (ids || []).filter(function (x) { return !!x; });
  var names = {};
  try {
    fmCatalog('item').forEach(function (t) { names[t.id] = t.name; });
  } catch (e) { /* 数据表没加载也不挡住序号 */ }
  var txt = list.length ? ('刷取顺序：' + list.map(function (id, i) {
    return (FM_ORD_MARK[i] || ('(' + (i + 1) + ')')) + (names[id] || id);
  }).join(' → ')) : '';
  if (el.textContent !== txt) el.textContent = txt;
  if (el.hidden !== !list.length) el.hidden = !list.length;
  if (el.style) {
    if (el.getAttribute && el.getAttribute('data-line-ready') !== '1') {
      el.style.cssText = 'display:block;margin:0 0 6px;padding:5px 8px;' +
        'border-radius:7px;background:var(--gold-wash-soft,#fbf4e2);' +
        'color:var(--text,#333);font-size:11px;line-height:1.5;word-break:break-all;';
      if (el.setAttribute) el.setAttribute('data-line-ready', '1');
    }
    if (el.style.display !== (list.length ? 'block' : 'none')) {
      el.style.display = list.length ? 'block' : 'none';
    }
  }
}

/* 把序号写进勾选框（空串 = 没勾），顺手把文字顺序行也刷新 */
function fmOrderPaint(box, ids) {
  if (!box) return;
  fmOrderEnsure(box);
  var ord = {};
  (ids || []).forEach(function (id, i) { ord[id] = i + 1; });
  Array.prototype.forEach.call(box.querySelectorAll('label[data-id]'), function (lab) {
    var b = lab.querySelector ? lab.querySelector('b.ord') : null;
    if (!b) return;
    var n = ord[lab.getAttribute('data-id')] || 0;
    var t = n ? String(n) : '';
    if (b.textContent !== t) b.textContent = t;
    if (b.style) {
      var want = n ? 'flex' : 'none';
      if (b.style.display !== want) b.style.display = want;
    }
    if (lab.setAttribute && lab.getAttribute('data-ord') !== String(n)) {
      lab.setAttribute('data-ord', String(n));
    }
  });
  fmOrderLinePaint(ids);
}

function fmCfgFromUI(kind) {
  var U = FM_UI[kind], pre = '#' + U.p + '-';
  var ids = [];
  var box = $(pre + 'targets');
  if (box) {
    if (kind === 'item') {
      /* 第五十批：按点击先后发出去（引擎照这个顺序一种一种刷） */
      ids = fmOrderSync(box).slice();
      fmOrderPaint(box, ids);
    } else Array.prototype.forEach.call(box.querySelectorAll('input:checked'), function (i) {
      ids.push(i.value);
    });
  }
  var cfg = {
    targets: ids,
    /* v1.33：树果「同地区两张图轮换」勾选框已删除，固定不轮换（只去效率第一名）。
     * alternate 字段保留兼容旧配置，但一律回传 false。 */
    alternate: false,
    /* 第七十六批：「太靠后就重开」勾选框已删，不再回传该字段 */
    hud: !!($(pre + 'hud') || {}).checked
  };
  /* 第二十六批：道具刷取的「选图 / 指定地图 / 速度 / 拿到几个就停」全部撤掉，
   * 一律自动挑最高效地图、速度拉满、集齐就停，所以这里不再回传这些字段
   * （引擎 sanitize 会给回默认值）。树果那边仍然保留。 */
  if (kind === 'berry') {
    /* 第九十一批：意向树果单选——勾中的那条就是唯一目标；
     * 勾最后一行「任意树果」时 targets 清空、anyBerry 打开（10 种全算、只按总数统计）。 */
    var anySel = ids.indexOf('any') >= 0;
    cfg.targets = anySel ? [] : ids.slice(0, 1);
    cfg.anyBerry = anySel;
    cfg.mapMode = ($(pre + 'map-mode') || {}).value === 'manual' ? 'manual' : 'auto';
    cfg.spotKey = String(($(pre + 'spot') || {}).value || '');
  }
  return cfg;
}

function fmSyncUI(kind, cfg) {
  if (!cfg || Date.now() - farmUiEditAt < 2500) return;
  var U = FM_UI[kind], pre = '#' + U.p + '-';
  var val = function (id, v) {
    var el = $(pre + id);
    if (el && document.activeElement !== el && String(el.value) !== String(v)) el.value = v;
  };
  var chk = function (id, v) {
    var el = $(pre + id);
    if (el && el.checked !== !!v) el.checked = !!v;
  };
  if (kind === 'berry') {
    val('map-mode', cfg.mapMode || 'auto');
    val('spot', cfg.spotKey || '');
  }
  /* v1.33：树果「同地区两张图轮换」勾选框已删，不再回写 alternate。 */
  /* 第七十六批：那个「太靠后就重开」的勾选框已删（整套判定撤除），
   * 这里不再回写；看板开关照旧。 */
  chk('hud', cfg.hud === true);
  var picked = cfg.targets || [];
  var box = $(pre + 'targets');
  /* 第五十批：道具这边顺序以配置为准（页面会因天气把某项排到队尾），
   * 把本地点击顺序也校准成它，序号才不会和实际刷取顺序打岔。 */
  if (kind === 'item' && picked.length) {
    FM_ORDER.item = picked.slice();
    fmOrderPaint(box, picked);
  }
  /* 第五十六批：运行中整张表被锁成 disabled，但配置仍要同步（引擎可能因天气
   * 把某项挪到队尾）。dim 项随后由 fmMarkTargets 清掉，这里不必再拦。 */
  var locked = !!(box && box.getAttribute && box.getAttribute('data-locked') === '1');
  if (box) Array.prototype.forEach.call(box.querySelectorAll('input'), function (i) {
    if (i.disabled && !locked) return;               // 已获得 / 未解锁的勾不动
    var on = kind === 'berry'
      ? (i.value === 'any' ? !!cfg.anyBerry : (picked.length === 1 && picked[0] === i.value))
      : picked.indexOf(i.value) >= 0;
    if (i.checked !== on) i.checked = on;
    if (i.parentNode && !/dim/.test(i.parentNode.className || '')) {
      var cls = on ? 'on' : '';
      if (i.parentNode.className !== cls) i.parentNode.className = cls;
    }
  });
}

/* 第五十六批：点了「开始刷取」就把意向表锁住 —— 没选中的那些变灰、点不动，
 * 选中的那条保持金色高亮但也改不了，直到点「停止」才全部解锁。
 * 半路换目标会让引擎的队列 / 固定图和面板对不上（图鉴模式早就是这套语义）。
 * fmMarkTargets 每 1 秒会按状态重算 className，所以它也调 fmLockCls 补上
 * lock / run，避免同一帧里先把类擦掉再补回来。 */
function fmLockCls(box, cls, inp) {
  if (!box || !box.getAttribute || box.getAttribute('data-locked') !== '1') return cls;
  var out = String(cls || '').replace(/\s*\b(lock|run)\b/g, '').trim();
  return (out ? out + ' ' : '') + (inp && inp.checked ? 'run' : 'lock');
}
function fmLockTargets(kind, running) {
  var U = FM_UI[kind], box = $('#' + U.p + '-targets');
  if (!box || !box.querySelectorAll) return;
  var want = running ? '1' : '0';
  if (box.setAttribute && box.getAttribute && box.getAttribute('data-locked') !== want) {
    box.setAttribute('data-locked', want);
  }
  Array.prototype.forEach.call(box.querySelectorAll('label[data-id]'), function (lab) {
    var inp = lab.querySelector ? lab.querySelector('input') : null;
    var dim = /\bdim\b/.test(String(lab.className || ''));
    /* 已获得 / 未解锁那几格本来就 disable，停止后也别给它们解开 */
    if (inp && !dim && inp.disabled !== !!running) inp.disabled = !!running;
    /* 先把上一轮的 lock / run 擦干净，再按这一轮选中态重算；
     * 停止时直接收工，别把灰类名留在 DOM 上。 */
    var base = String(lab.className || '').replace(/\s*\b(lock|run)\b/g, '').trim();
    var cls = running ? fmLockCls(box, base, inp) : base;
    if (String(lab.className || '') !== cls) lab.className = cls;
  });
}

function renderFarmPane(kind, s) {
  var U = FM_UI[kind], pre = '#' + U.p + '-';
  if (!$(pre + 'phase')) return;
  fmBuildStatic(kind);
  /* 第五十三批：一进面板就把方框 / 徽标的内联样式补齐，不等页面状态回执。
   * 只补样式不写文字，免得和后面 fmMarkTargets 按引擎队列重画的序号打架
   * （1 秒轮询里两次写同一行会闪）。 */
  var ibox = kind === 'item' ? $('#it-targets') : null;
  if (ibox) fmOrderEnsure(ibox);
  var startBtn = $(pre + 'now'), stopBtn = $(pre + 'stop'), scanBtn = $(pre + 'scan');
  if (!s) {
    if (blankShown[kind] !== 'no-state') {
      blankShown[kind] = 'no-state';
      runLine(pre + 'phase', 'err', null, disconnectedText() + ' · 先打开游戏页并登录');
      setBrief('#brief-' + kind, '未连接', 'err');
      fmSet(pre + 'target-meta', '');
      /* 第五十三批：连状态都没有时，序号照样按本地勾选项画出来 */
      if (ibox) fmOrderPaint(ibox, fmOrderSync(ibox));
      if ($(pre + 'ranks')) $(pre + 'ranks').innerHTML = '<li class="empty">打开 Poke\'Catch 页面后可用</li>';
      /* 第九十一批：树果回到原版面，只剩两格（地区·章节名 / 意向到手） */
      var cells = kind === 'berry' ? ['chapter', 'gains'] : [];
      cells.forEach(function (k) { fmSet(pre + k, '—'); });
      farmSig[kind] = '';
    }
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = true;
    if (scanBtn) scanBtn.disabled = true;
    /* 连不上页面时不该把意向表锁死，否则玩家连选都选不了 */
    fmLockTargets(kind, false);
    return;
  }
  blankShown[kind] = '';
  fmSyncUI(kind, s.cfg);
  /* 第二十六批：已获得 / 未解锁地图的意向道具变黑勾不动，正在找的描金边 */
  fmMarkTargets(kind, s);
  /* 第五十六批：开始刷取后锁住整张意向表，停止才解锁 */
  fmLockTargets(kind, !!s.running);
  var ready = s.ready !== false;
  if (startBtn) startBtn.disabled = !!s.running || !ready;
  if (stopBtn) stopBtn.disabled = !s.running;
  if (scanBtn) scanBtn.disabled = !!s.running || !ready;

  var ex = s.extra || null;
  var st = s.stats || {}, ta = s.tally || {};
  /* 第二十批：第二行运行状态 + 右上角徽标；第二十六批起道具刷取先报「正在找哪个」，
   * 第二十七批树果也统一用「正在找 XXX」（单选，所以只有一个名字） */
  var doing = (ex && ex.currentName) || (s.cur && s.cur.item) || '';
  var fmTarget = doing ? '正在找 ' + doing : (s.target || (s.cur && s.cur.label) || '');
  setBrief('#brief-' + kind, s.running ? ('运行中 · ' + (fmTarget || '刷取中')) : '未启动',
    s.running ? 'on' : 'off');
  var fmBlocked = !!(s.guard && s.guard.blocked);
  var fmPhase = s.phase || '刷取中';
  var curLabel = (s.cur && s.cur.label) || '';
  runLine(pre + 'phase', fmBlocked ? 'wait' : (s.running ? 'on' : 'off'), null,
    s.running
      ? ((doing ? '正在找 ' + doing + ' · ' : '') + fmPhase +
        (curLabel && fmPhase.indexOf(curLabel) < 0 ? ' · ' + curLabel : ''))
      : (fmBlocked ? '闪光守卫：等战斗结算完再切图' : '点「开始刷取」启动'));

  var sig = JSON.stringify([s.running, s.phase, s.cur && s.cur.key, st.cycles, st.travels,
    st.gains, st.skips, ta.total, ta.money, s.ranks, s.logs, s.note, s.guard,
    ex && [ex.gotCount, ex.totalCount, ex.current, ex.tideNow, ex.tideWaiting,
      ex.rush, ex.bagNow, ex.chapterCell,
      /* 第五十批：队列顺序 / 哪几项被天气置后也算状态，不然光换顺序不重画 */
      ex.order && ex.order.join(','),
      (ex.queue || []).map(function (r) { return r.blocked ? 1 : 0; }).join(''),
      ex.best && ex.best.key, ex.second && ex.second.key,
      /* 第九十一批：树果那 10 行的持有数 / 正在刷的那一种也进签名，否则数字变了不重画 */
      (ex.list || []).map(function (r) { return r.id + ':' + (r.owned || 0); }).join(',')]]);
  if (sig === farmSig[kind]) return;
  farmSig[kind] = sig;

  if (kind === 'item') {
    /* 第二十六批：统计 6 格与「最高效地图 / 参数」整块撤掉，这里只留一句进度说明
     * 第四十批：补上「只去这张图 + 这张图的期望」 */
    var picked = (s.cfg && s.cfg.targets) || [];
    /* 第五十批：多选按勾选先后排队 —— 一行写清「几个 / 按序号刷 / 谁被天气置后了」 */
    var meta = picked.length ? (picked.length + ' 项已选 · 按序号依次刷') : '还没勾道具';
    if (ex) {
      meta += ' · 已获得 ' + ex.gotCount + ' / ' + ex.totalCount;
      if (s.running && ex.currentName) meta += ' · 正在找 ' + ex.currentName;
      var deferN = 0;
      ((ex.queue) || []).forEach(function (r) { if (r && r.blocked) deferN++; });
      if (deferN) meta += ' · 受天气限制置后 ' + deferN + ' 项';
      var curRow = null;
      (ex.list || []).forEach(function (r) {
        if (r && ex.current && r.id === ex.current) curRow = r;
      });
      var curBest = (curRow && curRow.best) || null;
      if (curBest && curBest.run) {
        meta += ' · 只去 ' + curBest.label + '（' +
          fmPct(curBest.run) + '/趟 · 期望 ' + Math.round(curBest.runs) + ' 轮）';
      }
      if (s.running && ex.tideWaiting) meta += ' · 等退潮';
    }
    fmSet(pre + 'target-meta', meta);
  } else {
    /* 第九十一批：统计回到两格 —— 地区·章节名 / 意向到手（「路遇闪 / 捕捉」早删了）。
     * 章节写名字（「神奥 · 矿山徽章」），不再写「第 54 章」；一律无限刷，
     * 不再显示「仓库达到 N 就停」。 */
    var bBest = (ex && ex.best) || null;
    var bSec = (ex && ex.second) || null;
    var bWhere = bBest
      ? (bSec
        ? ' · 轮换 ' + bBest.label + '（' + fmPct(bBest.run) + '/趟） / ' + bSec.label + '（' + fmPct(bSec.run) + '/趟）'
        : ' · 只去 ' + bBest.label + '（' + fmPct(bBest.run) + '/趟 · 期望 ' + Math.round(bBest.runs) + ' 轮）')
      : '';
    var bMeta = ex
      ? ('已选 ' + (ex.currentName || '—') + '（单选）· 仓库 ' + ex.bagNow + ' 个' + bWhere)
      : (((s.cfg && s.cfg.targets) || []).length + ' 项已选');
    fmSet(pre + 'target-meta', bMeta);
    fmSet(pre + 'chapter', (ex && ex.chapterCell) || '—');
    fmSet(pre + 'gains', String(st.gains || 0));
    var gains = $(pre + 'gains');
    if (gains) {
      var fmGainsCls = st.gains ? 'gold' : '';
      if (gains.className !== fmGainsCls) gains.className = fmGainsCls;
    }
    fmSet(pre + 'rank-meta', '只在本地区挑图 · ' +
      ((ex && ex.second) ? '效率前两名轮换' : '效率第一名') +
      ' · 解锁至第 ' + ((Number(s.unlocked) || 0) + 1) + ' 章');
    var ranks = $(pre + 'ranks');
    var rows = (s.ranks || []).slice(0, 12);
    var D = fmData();
    var curRg = (D && D.regionOf) ? (D.regionOf(Number(s.chapter)) || '') : '';
    var bKey = (bBest && bBest.key) || '', sKey = (bSec && bSec.key) || '';
    if (ranks) ranks.innerHTML = rows.length ? rows.map(function (r) {
      /* 第四十一批：这一格写这张图的获取期望（单趟概率 · 期望轮数 / 约几分钟） */
      var pr = r.run ? fmPct(r.run) : (r.p ? fmPct(r.p) : (r.score > 0 ? '效率 ' + (Math.round(r.score * 100000) / 100) : '—'));
      var rRg = r.region || ((D && D.regionOf) ? (D.regionOf(Number(r.ch)) || '') : '');
      var tag = (curRg && rRg && rRg === curRg) ? '本地区 · ' : '';
      var mark = r.key === bKey ? '①' : (r.key === sKey ? '②' : '');
      var rs;
      if (r.locked) rs = r.reason || '未解锁';
      else if (r.run) rs = '期望 ' + Math.round(r.runs) + ' 轮 / 约 ' + fmMins(r.mins);
      else rs = (r.at != null ? '第 ' + r.at + ' 点' : '');
      return '<li class="' + (r.locked ? 'locked' : '') +
        (r.key === bKey || r.key === sKey ? ' pick' : '') +
        ((s.cur && s.cur.key === r.key) ? ' cur' : '') + '">' +
        '<span class="nm">' + fmEsc((mark ? mark + ' ' : '') + (r.label || r.key)) + '</span>' +
        '<span class="pr">' + fmEsc(pr) + '</span>' +
        '<span class="rs">' + fmEsc(tag + rs) + '</span></li>';
    }).join('') : '<li class="empty">还没扫描，点「扫描地图」看效率排行</li>';
  }

  var top = (ta.top || []);
  var tally = $(pre + 'tally');
  if (tally) tally.innerHTML = top.length ? top.map(function (t) {
    return '<span class="' + (kind === 'berry' ? '' : 'gold') + '">' + fmEsc(t.name) + ' ×' + t.n + '</span>';
  }).join('') + (ta.money ? '<span>金币 +' + fmEsc(ta.money) + '</span>' : '') :
    '<span>还没有收益记录</span>';

  var logs = (s.logs || []).slice(-12).reverse();
  var logBox = $(pre + 'logs');
  if (logBox) logBox.innerHTML = logs.length ? logs.map(function (l) {
    return '<li><b>' + fmEsc(fmtTime(l.t)) + '</b><span>' + fmEsc(l.m) + '</span></li>';
  }).join('') : '<li class="empty">还没有事件</li>';
  fmSet(pre + 'note', s.note || '');
}

/* 第八批：闪光战斗守卫收成「页面自动化」里的一条开关，
 * 统计 / 参数 / 日志这些控件全部撤掉，规则照常生效。 */
function renderFarmPanels(state) {
  var s = state || {};
  renderFarmPane('item', s.items || null);
  renderFarmPane('berry', s.berries || null);
  if (!farmBound) { farmBound = true; bindFarmPanels(); }
}

async function fmSend(kind, type, extra) {
  farmUiEditAt = Date.now();
  if (!isGameTab) { setHint('当前标签页不是 Poke\'Catch，先切到游戏页。'); return null; }
  var msg = Object.assign({ type: MSG[type] || type }, extra || {});
  var r = await sendToTab(msg);
  if (r && r.text) {
    fmSet('#' + FM_UI[kind].p + '-note', (r.ok !== false ? '' : '✗ ') + r.text);
  }
  refresh();
  return r;
}

function bindFarmPanels() {
  Object.keys(FM_UI).forEach(function (kind) {
    var U = FM_UI[kind], pre = '#' + U.p + '-';
    /* 第二十六批：道具刷取只剩三个勾选项（选图 / 速度 / 拿到几个就停都撤了）
     * 第二十七批树果：删掉「速度」，意向树果与「任意」并成一组单选，所以 'any' 也不在这里
     * 第四十批：稀有道具改成「每样只去效率第一名那张图」，轮换勾选也撤了 */
    /* 第七十六批：「太靠后就重开」那个勾选框已删，绑定列表一并去掉 */
    var ids = kind === 'item'
      ? ['hud']
      : ['map-mode', 'spot', 'limit', 'hud', 'prefer-wild'];
    ids.forEach(function (id) {
      var el = $(pre + id);
      if (!el) return;
      el.addEventListener('change', function () {
        farmUiEditAt = Date.now();
        fmSend(kind, U.cfg, { cfg: fmCfgFromUI(kind) });
      });
    });
    var box = $(pre + 'targets');
    if (box) box.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || (t.type !== 'checkbox' && t.type !== 'radio')) return;
      /* 第五十批：道具多选按点击先后排队 —— 刚勾上的排到队尾，刚取消的从队里删掉，
       * 勾选框里的序号立刻重画（1、2、3…），发出去的 targets 也是这个顺序。 */
      if (kind === 'item') fmOrderPaint(box, fmOrderTouch(box, t.value, t.checked));
      /* 树果是 radio：勾中一条其它自动取消，这里把整组高亮重画一遍 */
      Array.prototype.forEach.call(box.querySelectorAll('label[data-id]'), function (lab) {
        if (/dim/.test(lab.className || '')) return;       // 已获得 / 未解锁的不动
        var inp = lab.querySelector('input');
        var on = !!(inp && inp.checked);
        if (lab.className !== (on ? 'on' : '')) lab.className = on ? 'on' : '';
      });
      farmUiEditAt = Date.now();
      fmSend(kind, U.cfg, { cfg: fmCfgFromUI(kind) });
    });
    var btn = function (id, type, withCfg) {
      var b = $(pre + id);
      if (!b) return;
      b.addEventListener('click', function () {
        b.disabled = true;
        var label = b.textContent;
        b.textContent = '处理中…';
        var extra = withCfg ? { cfg: fmCfgFromUI(kind) } : null;
        fmSend(kind, type, extra).then(function () {
          b.disabled = false; b.textContent = label;
        });
      });
    };
    btn('scan', U.scan, false);
    btn('now', U.start, true);
    btn('stop', U.stop, null);
    btn('clear', U.clear, null);
  });

}
