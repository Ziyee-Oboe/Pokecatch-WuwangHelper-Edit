/* Poke'Catch 防掉线助手 —— 日志系统（隔离世界）
 *
 * 解决旧版三个问题：
 *   1. 只有内存里的 40 条，游戏页一刷新就全丢；
 *   2. 没有级别 / 模块，几十条流水账混在一起看不出重点；
 *   3. 异常被 try/catch 吞掉，全局报错也没人记录。
 *
 * 对外只暴露 window.PCG_LOG，content.js 的 log() 和 probe.js 都往这里写。
 * 持久化用 chrome.storage.local，写入做了节流，不会每秒打存储。
 */
(function () {
  'use strict';

  var STORE_KEY = 'pcgLogV1';
  var MAX = 200;
  var FLUSH_MS = 3000;
  var DEDUPE_MS = 3000;

  var items = [];
  var lastByKey = {};
  var dirty = false;
  var flushTimer = null;
  var loaded = false;

  var LEVELS = { debug: 0, info: 1, ok: 2, warn: 3, error: 4 };

  function now() { return Date.now(); }

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(function () {
      flushTimer = null;
      flush();
    }, FLUSH_MS);
  }

  function flush() {
    // 历史日志还没读回来之前不写，否则会把刚产生的日志覆盖掉
    if (!loaded || !dirty) return;
    dirty = false;
    try {
      var out = {};
      out[STORE_KEY] = items.slice(-MAX);
      chrome.storage.local.set(out, function () { void chrome.runtime.lastError; });
    } catch (e) { /* 存储不可用时日志仍在内存里 */ }
  }

  function load() {
    try {
      chrome.storage.local.get(STORE_KEY, function (v) {
        var saved = v && v[STORE_KEY];
        var history = Object.prototype.toString.call(saved) === '[object Array]'
          ? saved.filter(function (x) { return x && typeof x.m === 'string'; })
          : [];
        // load 是异步的：这期间 content.js 可能已经写了新日志，合并而不是覆盖
        var merged = history.concat(items);
        merged.sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
        var seen = {};
        items = merged.filter(function (x) {
          var k = x.id || (x.t + '|' + x.m);
          if (seen[k]) return false;
          seen[k] = 1;
          return true;
        }).slice(-MAX);
        loaded = true;
        if (dirty) flush();
      });
    } catch (e) { loaded = true; }
  }

  /* push(level, mod, msg)
   * level: debug / info / ok / warn / error
   * 同一条消息 3 秒内重复只累加次数，避免每秒刷屏。 */
  function push(level, mod, msg) {
    if (LEVELS[level] === undefined) level = 'info';
    var text = String(msg == null ? '' : msg);
    if (!text) return null;
    mod = String(mod || 'core');
    var t = now();
    var key = level + '|' + mod + '|' + text;
    var prev = lastByKey[key];

    if (prev && t - prev.t < DEDUPE_MS) {
      var hit = null;
      for (var i = items.length - 1; i >= 0; i--) {
        if (items[i].id === prev.id) { hit = items[i]; break; }
      }
      if (hit) {
        hit.n = (hit.n || 1) + 1;
        hit.t = t;
        prev.t = t;
        dirty = true;
        scheduleFlush();
        return hit;
      }
    }

    var entry = { id: t + '-' + Math.random().toString(36).slice(2, 7), t: t, level: level, mod: mod, m: text, n: 1 };
    items.push(entry);
    if (items.length > MAX) items.splice(0, items.length - MAX);
    lastByKey[key] = { t: t, id: entry.id };
    dirty = true;
    scheduleFlush();
    return entry;
  }

  function list() { return items.slice(); }

  function clear() {
    items = [];
    lastByKey = {};
    dirty = true;
    flush();
  }

  function count(level) {
    if (!level || level === 'all') return items.length;
    var n = 0;
    for (var i = 0; i < items.length; i++) if (items[i].level === level) n++;
    return n;
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function clock(t) {
    try {
      var d = new Date(t);
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    } catch (e) { return '--:--:--'; }
  }

  function exportText() {
    return items.map(function (e) {
      return '[' + clock(e.t) + '] [' + e.level.toUpperCase() + '] [' + e.mod + '] ' +
        e.m + (e.n > 1 ? ' (x' + e.n + ')' : '');
    }).join('\n');
  }

  /* ---------------- 第九十五批：把浏览器的「良性报错」挡在错误栏外面 ----------------
   *
   * 1) ResizeObserver loop completed with undelivered notifications.
   *    这不是异常，是浏览器的一句「上一轮观察回调里改了布局，我下帧再算一次」。
   *    游戏本体自己就有十几处 ResizeObserver，其中好几处在回调里直接改样式
   *    （setProperty('--k', …) / classList.toggle('narrow', …)），必然会踩到这条。
   *    页面照常渲染、逻辑照常跑，但浏览器会把它当成一个 error 事件抛到 window 上，
   *    于是被下面这个监听器原样记成「运行时 · 错误」—— 玩家看到满屏红字，以为插件坏了。
   *    老版 Chrome 的措辞是 ResizeObserver loop limit exceeded，一并算进来。
   *
   * 2) Script error.
   *    跨域脚本的未捕获异常会被浏览器抹成这一句，没有 message、没有行号、没有文件，
   *    记下来也定位不到任何东西，属于纯噪音。
   *
   * 两条都只「不记」，不影响任何功能；第一次命中时写一条 debug（只在「全部」里看得到），
   * 说明一下是被主动忽略的，免得以后自己排查时以为日志丢了。计数用 PCG_LOG.muted() 取。 */
  var BENIGN = [
    /^ResizeObserver loop (completed with undelivered notifications|limit exceeded)\.?$/i,
    /^Script error\.?$/i
  ];
  var mutedCount = 0;

  function benign(text) {
    var s = String(text == null ? '' : text).trim();
    for (var i = 0; i < BENIGN.length; i++) {
      if (BENIGN[i].test(s)) return true;
    }
    return false;
  }

  function mute(text) {
    mutedCount++;
    if (mutedCount === 1) {
      push('debug', 'runtime', '已忽略浏览器的 ResizeObserver / Script error 告警（正常现象，不是插件错误）');
    }
  }

  // 全局未捕获异常统一记一条 error，别再无声无息地失败
  try {
    window.addEventListener('error', function (ev) {
      var m = ev && ev.message ? ev.message : '未知脚本错误';
      if (benign(m)) { mute(m); return; }
      push('error', 'runtime', m + (ev && ev.filename ? ' @ ' + String(ev.filename).split('/').pop() : ''));
    });
    window.addEventListener('unhandledrejection', function (ev) {
      var r = ev && ev.reason;
      var m = (r && r.message) || String(r || '未知');
      if (benign(m)) { mute(m); return; }
      push('error', 'runtime', '未处理的 Promise 异常：' + m);
    });
  } catch (e) { /* ignore */ }

  window.PCG_LOG = {
    push: push,
    list: list,
    clear: clear,
    count: count,
    exportText: exportText,
    flush: flush,
    clock: clock,
    /* 第九十五批：被主动忽略的良性报错条数（ResizeObserver 循环 / Script error） */
    muted: function () { return mutedCount; },
    isLoaded: function () { return loaded; }
  };

  load();
})();
