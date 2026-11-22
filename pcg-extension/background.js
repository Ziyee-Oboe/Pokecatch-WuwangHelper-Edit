/* Poke'Catch 防掉线助手 —— 后台 Service Worker
 *
 * 只做内容脚本做不到的几件事：
 *   - 把游戏标签页标记为「不可自动丢弃」；
 *   - 可选地阻止系统休眠；
 *   - 在图标上显示连接状态。
 *
 * 重要：这里不再维护一份 DEFAULT_SETTINGS，也不在 onInstalled 往存储写默认值。
 * 旧版后台那份默认值只有 12 项、ugCheckSec 还是老的 60 秒，会把新值覆盖掉。
 * 现在全扩展只有 defaults.js 一份默认值，由 content / popup 负责读取与迁移。
 */
'use strict';

var GAME_PATTERNS = [
  'https://pokecatch-online.netlify.app/*',
  'https://pokecatch-online.pages.dev/*'
];

var GAME_URL_RE = /^https:\/\/pokecatch-online\.(netlify\.app|pages\.dev)\//;

var AWAKE_KEY = 'keepSystemAwake';
var ALARM_NAME = 'pcg-heartbeat';

/* 第八十九批：手机浏览器（Kiwi / Edge Canary）上 chrome.storage.sync 可能不存在。
 * Service Worker 不加载 defaults.js，这里自己做一次同样的挑选：有 sync 用 sync，
 * 没有就退回 local（同一台手机上读写正常，只是不跨设备同步）。 */
var SYNC = (function () {
  var s = null;
  try { s = chrome.storage && chrome.storage.sync; } catch (e) { s = null; }
  if (s && typeof s.get === 'function') return s;
  try { return chrome.storage.local; } catch (e2) { return { get: function (d, cb) { if (cb) cb({}); } }; }
})();

/* 第三十批：黑市扫货的「命中商品」（买成的记录）放在 storage.session 里——
 * 它只活在这一次浏览器运行期间，刷新游戏页不会丢，关掉浏览器才清空，正是玩家要的语义。
 * content script 默认没有 session 区的访问权限，这里放开（老版本 Chrome 没有这个区就跳过，
 * 黑市模块会退回纯内存）。 */
try {
  if (chrome.storage && chrome.storage.session && chrome.storage.session.setAccessLevel) {
    chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });
  }
} catch (e) { /* ignore */ }

function readAwakeSetting() {
  return new Promise(function (resolve) {
    try {
      SYNC.get(AWAKE_KEY, function (v) {
        void chrome.runtime.lastError;
        resolve(!!(v && v[AWAKE_KEY]));
      });
    } catch (e) {
      resolve(false);
    }
  });
}

function queryGameTabs() {
  return new Promise(function (resolve) {
    try {
      chrome.tabs.query({ url: GAME_PATTERNS }, function (tabs) {
        void chrome.runtime.lastError;
        resolve(tabs || []);
      });
    } catch (e) {
      resolve([]);
    }
  });
}

function protectTab(tabId) {
  try {
    chrome.tabs.update(tabId, { autoDiscardable: false }, function () {
      void chrome.runtime.lastError;
    });
  } catch (e) { /* ignore */ }
}

async function syncEverything() {
  var tabs = await queryGameTabs();
  for (var i = 0; i < tabs.length; i++) {
    if (typeof tabs[i].id === 'number') protectTab(tabs[i].id);
  }

  var wantAwake = (await readAwakeSetting()) && tabs.length > 0;
  try {
    if (wantAwake) chrome.power.requestKeepAwake('system');
    else chrome.power.releaseKeepAwake();
  } catch (e) { /* 某些平台没开放 chrome.power */ }
}

function setBadge(tabId, connected, hookReady) {
  var text = '';
  var color = '#3ddc84';
  if (hookReady === false) {
    text = '';
  } else if (connected) {
    text = '\u25CF';
    color = '#3ddc84';
  } else {
    text = '!';
    color = '#e3353b';
  }
  try {
    chrome.action.setBadgeText({ tabId: tabId, text: text }, function () {
      void chrome.runtime.lastError;
    });
    chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: color }, function () {
      void chrome.runtime.lastError;
    });
  } catch (e) { /* ignore */ }
}

function ensureAlarm() {
  try {
    chrome.alarms.get(ALARM_NAME, function (a) {
      void chrome.runtime.lastError;
      if (!a) chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    });
  } catch (e) {
    try { chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 }); } catch (e2) { /* ignore */ }
  }
}

chrome.runtime.onInstalled.addListener(function (details) {
  ensureAlarm();
  syncEverything();
});

chrome.runtime.onStartup.addListener(function () {
  ensureAlarm();
  syncEverything();
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm && alarm.name === ALARM_NAME) syncEverything();
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  if (info.status !== 'complete') return;
  var url = (tab && tab.url) || '';
  if (!GAME_URL_RE.test(url)) return;
  protectTab(tabId);
  syncEverything();
});

chrome.tabs.onRemoved.addListener(function () { syncEverything(); });

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg || !msg.type) return;

  if (msg.type === 'pcg-status') {
    var tabId = sender && sender.tab && sender.tab.id;
    if (typeof tabId === 'number' && msg.status) {
      setBadge(tabId, !!msg.status.connected, msg.status.hookReady);
    }
    return;
  }

  if (msg.type === 'pcg-sync') {
    syncEverything().then(function () { sendResponse({ ok: true }); });
    return true;
  }

  // popup 里「刷新游戏页」统一走后台
  if (msg.type === 'pcg-page-reload') {
    var tabId = (sender && sender.tab && sender.tab.id) || msg.tabId;
    if (typeof tabId !== 'number') tabId = null;
    if (tabId !== null) {
      try { chrome.tabs.reload(tabId, function () { void chrome.runtime.lastError; }); }
      catch (e) { /* ignore */ }
    }
    sendResponse({ ok: tabId !== null });
    return true;
  }
});

chrome.storage.onChanged.addListener(function (changes, area) {
  if (area !== 'sync' && area !== 'local') return;
  if (changes && changes[AWAKE_KEY]) syncEverything();
});

// Service Worker 每次被唤醒也同步一次，不等 alarm
syncEverything();
