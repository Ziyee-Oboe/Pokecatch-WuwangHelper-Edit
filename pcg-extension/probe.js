/* Poke'Catch 防掉线助手 —— 兼容性探针（隔离世界，只读）
 *
 * 游戏在 Cloudflare Pages 上频繁发版，而插件有大量硬编码 DOM 选择器和存档字段。
 * 这里做三件事：
 *   1. 检查「游戏已启动 / 页面钩子已握手 / 存档可读」这些核心前提；
 *   2. 统计当前页面能看到几个关键容器（切页才出现的算「未检测到」，不算失败）；
 *   3. 用资源加载记录里的 bundle 哈希做版本指纹，游戏更新时主动提示。
 *
 * 结果通过 window.PCG_PROBE.result() 交给 content.js 的 buildState()，
 * 最终显示在弹窗状态栏里。全程只读，不改游戏 DOM、不写游戏存档。
 */
(function () {
  'use strict';

  var CFG = window.PCG_CONFIG;
  if (!CFG) return;

  var BUILD_KEY = 'pcgBuildFingerprint';
  var lastBuild = '';
  var state = { at: 0, ready: false, level: 'wait', build: '', changed: false, ok: 0, failed: 0, checks: [], note: '正在检测…' };

  // 版本指纹存扩展自己的存储，不往游戏域名的 localStorage 里写东西
  try {
    chrome.storage.local.get(BUILD_KEY, function (v) {
      lastBuild = (v && v[BUILD_KEY]) || '';
    });
  } catch (e) { /* ignore */ }

  function hit(sel) {
    if (!sel) return false;
    try { return !!document.querySelector(sel); } catch (e) { return false; }
  }

  function saveInfo() {
    // 统一存档层的诊断直接写进兼容性面板，读不到时能看到具体是哪一环断了
    var SAVE = window.PCG_SAVE || null;
    if (SAVE) {
      var d = SAVE.diag();
      if (d.ok) return { state: 'ok', detail: d.brief };
      return {
        state: 'miss',
        detail: d.brief + (d.keys && d.keys.length
          ? '；本域键：' + d.keys.slice(0, 6).join('、') : '')
      };
    }
    try {
      var raw = localStorage.getItem(CFG.SAVE_KEY);
      if (!raw) return { state: 'na', detail: '还没有存档（新游戏）' };
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return { state: 'miss', detail: '存档不是对象' };
      var known = ['roam', 'adv', 'stats', 'dex'].filter(function (k) { return k in obj; });
      return { state: 'ok', detail: '字段 ' + (known.length ? known.join('/') : '可解析') };
    } catch (e) {
      return { state: 'miss', detail: '存档不可读：' + ((e && e.message) || e) };
    }
  }

  // 游戏 bundle 形如 .../bundle/app.1d81357d1b.js，哈希就是版本指纹
  function fingerprint() {
    try {
      var rs = performance.getEntriesByType ? performance.getEntriesByType('resource') : [];
      for (var i = rs.length - 1; i >= 0; i--) {
        var m = /\/([A-Za-z0-9._-]+)\.([a-f0-9]{8,})\.js/.exec(String(rs[i].name || ''));
        if (m && /pokecatch|bundle|app|game|main/i.test(rs[i].name)) return m[2];
      }
    } catch (e) { /* ignore */ }
    try {
      var tags = document.querySelectorAll('script[src]');
      for (var j = 0; j < tags.length; j++) {
        var m2 = /\.([a-f0-9]{8,})\.js/.exec(tags[j].src || '');
        if (m2) return m2[1];
      }
    } catch (e2) { /* ignore */ }
    return '';
  }

  function add(key, label, st, detail) {
    state.checks.push({ key: key, label: label, state: st, detail: detail || '' });
    if (st === 'ok') state.ok++;
    if (st === 'miss') state.failed++;
  }

  function missKey(checks) {
    return checks.filter(function (c) { return c.state === 'miss'; })
      .map(function (c) { return c.key; }).sort().join(',');
  }

  function run() {
    var prevChecks = state.checks;
    state = { at: Date.now(), ready: false, level: 'wait', build: '', changed: false, ok: 0, failed: 0, checks: [], note: '' };

    // 页面还没就绪时别急着判失败，否则刚打开游戏就会刷一堆误报
    var settled = document.readyState === 'complete' || hit(CFG.sel('app'));
    function core(st) { return st === 'ok' ? 'ok' : (settled ? 'miss' : 'na'); }

    // 页面钩子握手信号（page-hook.js 写在 <html> 上）
    var hooked = false;
    try { hooked = document.documentElement.hasAttribute('data-pcg'); } catch (e) { /* ignore */ }
    add('hook', '页面钩子已握手', core(hooked ? 'ok' : 'miss'), hooked ? '' : '刷新游戏页后仍没有就要检查注入');

    var shell = hit(CFG.sel('app')) || (document.documentElement && /(\s|^)px(\s|$)/.test(document.documentElement.className || ''));
    add('shell', '游戏已启动', core(shell ? 'ok' : 'miss'), shell ? '' : '游戏还没渲染出来，或挂载点变了');

    var nav = hit(CFG.sel('nav'));
    add('nav', '主导航', core(nav ? 'ok' : 'miss'), nav ? '' : '选择器需检查 ' + CFG.sel('nav'));

    var sv = saveInfo();
    add('save', '存档格式', sv.state, sv.detail);
    // 完整诊断随状态带到弹窗，供「复制存档诊断」按钮使用
    try { state.saveDiag = window.PCG_SAVE ? window.PCG_SAVE.diag() : null; }
    catch (e) { state.saveDiag = null; }

    var fs = fingerprint();
    state.build = fs;
    if (fs) {
      state.changed = !!lastBuild && lastBuild !== fs;
      var changedNow = state.changed;
      lastBuild = fs;
      if (changedNow) {
        try {
          var save = {};
          save[BUILD_KEY] = fs;
          chrome.storage.local.set(save, function () { void chrome.runtime.lastError; });
        } catch (e) { /* ignore */ }
        /* 第一百二十批：把「本次会话检测到游戏发版」记成一次性标记，
         * content.js 的 versionUpdateTick() 据此在弹窗没出现时也能重启游戏。
         * 刷新页面后新实例不带这个标记，且按 build 去重，不会循环刷新。 */
        try { window.PCG_PROBE.buildChanged = true; } catch (e2) { /* ignore */ }
      }
      add('build', '游戏版本指纹', 'ok', fs.slice(0, 12));
    } else {
      add('build', '游戏版本指纹', 'na', '这次没抓到带哈希的 bundle 地址');
    }

    // 只在对应页面出现，缺失不算失败
    var optional = [
      ['ugRoot', '地下通道', CFG.sel('ugRoot')],
      ['raidScreen', '异色团体战', CFG.sel('raidScreen')],
      ['enemySlot', '战斗区', CFG.sel('enemySlot')],
      ['arenaFx', '伤害飘字', CFG.sel('arenaFx')],
      ['battleLog', '战斗日志', CFG.sel('battleLog')],
      ['bagPanel', '背包', CFG.sel('bagPanel')]
    ];
    var seen = 0;
    optional.forEach(function (o) {
      var yes = hit(o[2]);
      if (yes) seen++;
      add(o[0], o[1], yes ? 'ok' : 'na', yes ? '当前页可见' : '切到该页面才会出现');
    });

    state.ready = shell && hooked && !!settled;
    state.level = state.failed > 0 ? 'warn' : (state.ready ? 'ok' : 'wait');
    state.note = !settled ? '游戏页面还没就绪，等下一轮检测'
      : state.failed > 0
        ? (state.failed + ' 项核心检测没过，相关功能可能失效')
        : (state.changed ? '游戏版本变了，建议刷新并验证自动化' : '核心检测全部通过');

    // 只在「版本变了 / 失败项集合变了」时写日志，30 秒一次的复检不刷屏
    if (window.PCG_LOG && settled) {
      var prevMiss = missKey(prevChecks);
      var nowMiss = missKey(state.checks);
      if (state.changed) {
        window.PCG_LOG.push('warn', 'probe', '检测到游戏更新（bundle ' + fs.slice(0, 12) + '），建议刷新游戏页验证自动化功能');
      } else if (nowMiss && nowMiss !== prevMiss) {
        window.PCG_LOG.push('warn', 'probe', state.note + '：' + state.checks.filter(function (c) { return c.state === 'miss'; }).map(function (c) { return c.label; }).join('、'));
      } else if (!nowMiss && prevMiss) {
        window.PCG_LOG.push('ok', 'probe', '兼容性检测恢复正常');
      }
    }
    return state;
  }

  window.PCG_PROBE = {
    run: run,
    result: function () { return state; }
  };

  setTimeout(run, 2500);
  document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 1500); });
  setInterval(run, 30000);
})();
