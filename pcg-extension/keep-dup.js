/* Poke'Catch 防掉线助手 —— 一键「保留重复」+ 游戏命名空间桥（MAIN world / document_start）
 *
 * 线上游戏把「Garder les doublons / 保留重复」做成宝可梦详情卡上的开关，
 * 状态是 G.S.keepDup[家族根图鉴号]。游戏导出的 Game 里有：
 *   keepOn(id) / setKeep(id, on) / candyFamily(id) / DEX / PREVO /
 *   S(getter) / holdSave(bool) / save()
 * 本模块只调用游戏自己的这些接口：插件不读 localStorage、不碰
 * gachamon-save-v1、不写任何存档字段。批量操作时先 holdSave(true)，
 * 把 setKeep 内部的一次次保存合并掉，最后只让游戏自己 save() 一次，
 * 效果和在每张详情卡上逐个点「保留重复」完全一样。
 *
 * 难点：Game 挂在游戏内部的命名空间 Proxy（t.Game）上，没有暴露到 window。
 * 这里在 document_start 临时包一层 window.Proxy，只捕获那一个命名空间实例，
 * 捕获到立刻还原；没捕获到也会在页面 load 或 30 秒后还原，不长期占用全局构造函数。
 * 游戏自己的原生函数检查只覆盖 Date / performance / setTimeout / rAF，
 * 这层包装不改变任何调用结果。
 *
 * 命令（隔离世界 → 页面）：  pcg-cmd = keepdup:on:<rid> / off:<rid> / status:<rid>
 * 回执（页面 → 隔离世界）：  document 上的 pcg-keepdup-result，detail 是 JSON 字符串
 *
 * 第八十六批：同乡的「同家族跳转」也要调游戏自己的接口 —— 仓库 / 队伍那张详情卡
 * 换一只看，走的是 UI.monDetail(uid)，同样只挂在内部命名空间上。这里把已经抓到的
 * 命名空间拿来当小桥：
 *   命令：pcg-cmd = monready:            （问一句桥通不通）
 *         pcg-cmd = monopen:<uid>        （调 UI.monDetail(uid)）
 *   回执：document / window 上的 pcg-monopen-result，detail 是 JSON 字符串
 *         { kind: 'ready' | 'monopen', ok, uid, text }
 * 桥只调游戏自己的函数，不读不写存档。
 *
 * 第八十七批：图鉴捕捉要「真·实时」的天气 / 时段（洛托姆那几只尤其），DOM 里只有
 * 玩家当前打开的那个地区才渲染天气徽标，别的地区永远读不到。游戏自己算这件事的模块
 * 就在同一个命名空间上，这里也一并接出来：
 *   命令：pcg-cmd = wxinfo:{"q":[{"ch":49,"step":9}, …]}
 *   回执：document / window 上的 pcg-wx-result，detail 是 JSON 字符串
 *         { ok, at, list:[{ ch, step, known, wxs:[天气key…], changes:[{key,at}], endsAt }],
 *           day:{ key:'morning'|'day'|'night', night:bool, nextHour } }
 * 用的就是游戏渲染进度页徽标时的同一套函数（WEATHER.current / WEATHER.changes /
 * DAYTIME.phase），只读结果，不写存档、不改游戏状态。
 *
 * 第八十八批：洛托姆那 5 只形态的「特别的相遇」不是必出的 —— 游戏在章节数据里给
 * 它们写了 chance（0.04），每次重建这一章的时间线只有 4% 概率把这一格放进去；
 * 另外还带 day / night / skies / once 这些门槛。玩家在弹窗里看不到这些，就会以为
 * 「切了一百多次都不出 = 插件坏了」。所以这里把这一格自己的生成条件也带回来：
 *   list 里每条多 { chance, day, night, skies:[…], once }
 * （chance = 每次进图生成概率，0 = 必出；day/night = 只在白天 / 只在夜晚；once 用掉就不再出）
 */
(function () {
  'use strict';

  if (window.__PCG_KEEP_DUP__) return;
  window.__PCG_KEEP_DUP__ = true;

  var NATIVE_PROXY = window.Proxy;
  var ns = null;
  var hooked = false;
  var gameCache = null;
  var last = { kind: '', at: 0, ok: false, total: 0, on: 0, changed: 0 };

  function isNamespaceHandler(h) {
    return !!(h && typeof h.get === 'function' && typeof h.set === 'function' &&
      typeof h.has === 'function' && typeof h.deleteProperty === 'function');
  }

  function restoreProxy() {
    if (!hooked) return;
    hooked = false;
    try { window.Proxy = NATIVE_PROXY; } catch (e) { /* ignore */ }
  }

  /* 只为了拿到游戏内部那个命名空间 Proxy，不改它的行为 */
  if (typeof NATIVE_PROXY === 'function') {
    function CaptureProxy(target, handler) {
      var p = new NATIVE_PROXY(target, handler);
      if (!ns && isNamespaceHandler(handler)) {
        ns = p;
        restoreProxy();          // 抓到就立刻还原，窗口期只有一次构造
      }
      return p;
    }
    CaptureProxy.prototype = NATIVE_PROXY.prototype;
    try { CaptureProxy.revocable = NATIVE_PROXY.revocable; } catch (e) { /* ignore */ }
    // 有些脚本会用 Proxy.toString() 判断是否原生，这里保持和原生一致，
    // 避免临时捕获窗口期被游戏自己的完整性检查误判。
    try {
      CaptureProxy.toString = function () { return NATIVE_PROXY.toString(); };
    } catch (e5) { /* ignore */ }
    try {
      window.Proxy = CaptureProxy;
      hooked = true;
      try { setTimeout(restoreProxy, 30000); } catch (e2) { /* ignore */ }
      // 页面 load 时 bundle 一定已经跑完，没必要继续挂着
      try { window.addEventListener('load', restoreProxy); } catch (e3) { /* ignore */ }
    } catch (e) { /* 环境不允许就走下面的 window 扫描兜底 */ }
  }

  function isGame(o) {
    return !!(o && typeof o === 'object' &&
      typeof o.setKeep === 'function' && typeof o.keepOn === 'function' &&
      typeof o.candyFamily === 'function' && typeof o.save === 'function');
  }

  function gameOf() {
    if (gameCache && isGame(gameCache)) return gameCache;
    var i, v;
    try { if (isGame(window.Game)) { gameCache = window.Game; return gameCache; } }
    catch (e) { /* ignore */ }
    if (ns) {
      try { if (isGame(ns.Game)) { gameCache = ns.Game; return gameCache; } }
      catch (e2) { /* ignore */ }
    }
    // 兜底：某些构建会把命名空间直接挂到 window 上，浅扫一层自有属性
    try {
      var keys = Object.getOwnPropertyNames(window);
      for (i = 0; i < keys.length; i++) {
        try { v = window[keys[i]]; } catch (e3) { continue; }
        if (isGame(v)) { gameCache = v; return gameCache; }
      }
    } catch (e4) { /* ignore */ }
    return null;
  }

  /* 所有家族 = 图鉴里每个图鉴号映射到它进化链的根，再去重。
     这样没抓到过的宝可梦所属家族也会算进去，和游戏 keepDup 的键一致。 */
  function familyIds(G) {
    var out = [], seen = {}, keys = [], i;
    try { keys = Object.keys(G.DEX || {}); } catch (e) { return out; }
    for (i = 0; i < keys.length; i++) {
      var id = Number(keys[i]);
      if (!isFinite(id) || id <= 0) continue;
      var root = 0;
      try { root = Number(G.candyFamily(id)) || 0; } catch (e2) { continue; }
      if (!root || seen[root]) continue;
      seen[root] = 1;
      out.push(root);
    }
    out.sort(function (a, b) { return a - b; });
    return out;
  }

  function statusOf(G) {
    var ids = familyIds(G), on = 0, i;
    if (!ids.length) return { ok: false, text: '没读到游戏的宝可梦家族表' };
    for (i = 0; i < ids.length; i++) {
      try { if (G.keepOn(ids[i])) on++; } catch (e) { /* ignore */ }
    }
    return {
      ok: true, total: ids.length, on: on, off: ids.length - on,
      text: '共 ' + ids.length + ' 个家族，已开启 ' + on + ' 个、关闭 ' + (ids.length - on) + ' 个'
    };
  }

  function applyAll(G, want) {
    var ids = familyIds(G);
    if (!ids.length) return { ok: false, text: '没读到游戏的宝可梦家族表' };
    var changed = 0, failed = 0, held = false, i;
    // setKeep 内部会调 save()：先让游戏暂停保存，几百个家族就不会写几百次盘
    if (typeof G.holdSave === 'function') {
      try { G.holdSave(true); held = true; } catch (e) { held = false; }
    }
    try {
      for (i = 0; i < ids.length; i++) {
        try {
          if (!!G.keepOn(ids[i]) === !!want) continue;   // 已经符合的不重复点
          G.setKeep(ids[i], !!want);                      // 游戏自己的开关
          changed++;
        } catch (e2) { failed++; }
      }
    } finally {
      if (held) {
        try { G.holdSave(false); } catch (e3) { /* ignore */ }
        // 只让游戏自己保存一次；插件从头到尾没有碰过 localStorage
        if (changed && typeof G.save === 'function') {
          try { G.save(); } catch (e4) { /* ignore */ }
        }
      }
    }
    var st = statusOf(G);
    return {
      ok: true, changed: changed, failed: failed,
      total: st.total, on: st.on, off: st.off,
      text: (want ? '已开启 ' : '已关闭 ') + changed + ' 个家族' +
            (failed ? '（' + failed + ' 个失败）' : '') +
            '；现在共 ' + st.total + ' 个家族，开着 ' + st.on + ' 个'
    };
  }

  function reply(res) {
    var payload = '';
    try { payload = JSON.stringify(res); } catch (e) { return; }
    // 两个目标都派发：不同 Chrome 版本的跨 world 事件通道略有差异。
    // 隔离世界用 rid 去重，收到两次也只会处理一次。
    try {
      document.dispatchEvent(new CustomEvent('pcg-keepdup-result', { detail: payload }));
    } catch (e2) { /* ignore */ }
    try {
      window.dispatchEvent(new CustomEvent('pcg-keepdup-result', { detail: payload }));
    } catch (e3) { /* ignore */ }
  }

  window.addEventListener('pcg-cmd', function (ev) {
    var cmd = '';
    try { cmd = String((ev && ev.detail) || ''); } catch (e) { return; }
    if (cmd.indexOf('keepdup:') !== 0) return;
    var parts = cmd.split(':');
    var kind = parts[1] || 'status';
    var rid = parts[2] || '';
    var G = gameOf();
    var res;
    if (!G) {
      res = { ok: false, text: '没连上游戏内部接口：刷新一次游戏页再点（扩展重载后旧页面要刷新）' };
    } else if (kind === 'status') {
      res = statusOf(G);
    } else if (kind === 'on' || kind === 'off') {
      res = applyAll(G, kind === 'on');
    } else {
      res = { ok: false, text: '未知指令' };
    }
    res.rid = rid;
    res.kind = kind;
    res.source = ns ? 'namespace' : (window.Game ? 'window.Game' : 'window.scan');
    last = {
      kind: kind, at: Date.now(), ok: !!res.ok,
      total: res.total || 0, on: res.on || 0, changed: res.changed || 0
    };
    reply(res);
  });

  // 控制台自查入口
  try {
    Object.defineProperty(window, '__PCG_KEEP_DUP_STATE__', {
      configurable: true,
      get: function () {
        return {
          captured: !!ns, hooked: hooked, game: !!gameOf(),
          families: gameOf() ? familyIds(gameOf()).length : 0, last: last,
          monUi: !!monUI(),
          /* 第八十七批：天气 / 时段桥通不通（图鉴捕捉的洛托姆实时条件靠它） */
          wx: !!wxModule(), day: !!dayModule()
        };
      }
    });
  } catch (e) { /* ignore */ }

  /* ---------------- 第八十六批：详情卡换卡（同家族跳转用） ----------------
   * 游戏「从仓库 / 队伍点开某一只」就是 UI.monDetail(uid)；UI 只挂在内部命名空间上。
   * 这里只用已经抓到的那个命名空间调它，不碰存档、不改游戏状态。 */
  function monUI() {
    var UI = null;
    try { UI = ns ? ns.UI : null; } catch (e) { UI = null; }
    if (!UI) {
      try { UI = window.UI || null; } catch (e2) { UI = null; }
    }
    try {
      return (UI && typeof UI.monDetail === 'function') ? UI : null;
    } catch (e3) { return null; }
  }

  function monReply(res) {
    var payload = '';
    try { payload = JSON.stringify(res); } catch (e) { return; }
    try {
      document.dispatchEvent(new CustomEvent('pcg-monopen-result', { detail: payload }));
    } catch (e2) { /* ignore */ }
    try {
      window.dispatchEvent(new CustomEvent('pcg-monopen-result', { detail: payload }));
    } catch (e3) { /* ignore */ }
  }

  window.addEventListener('pcg-cmd', function (ev) {
    var cmd = '';
    try { cmd = String((ev && ev.detail) || ''); } catch (e) { return; }
    var isReady = cmd.indexOf('monready:') === 0;
    if (!isReady && cmd.indexOf('monopen:') !== 0) return;
    var UI = monUI();
    if (isReady) {
      monReply({
        kind: 'ready', ok: !!UI,
        text: UI ? 'ok' : '没连上游戏内部接口'
      });
      return;
    }
    var uid = cmd.slice('monopen:'.length);
    if (!uid) { monReply({ kind: 'monopen', ok: false, uid: '', text: '没给 uid' }); return; }
    if (!UI) {
      monReply({ kind: 'monopen', ok: false, uid: uid, text: '没连上游戏内部接口：刷新一次游戏页再点' });
      return;
    }
    try {
      UI.monDetail(uid);
      monReply({ kind: 'monopen', ok: true, uid: uid, text: '已打开' });
    } catch (e4) {
      monReply({ kind: 'monopen', ok: false, uid: uid, text: '打开失败：' + String((e4 && e4.message) || e4) });
    }
  });

  /* ---------------- 第八十七批：天气 / 时段（图鉴捕捉的洛托姆实时条件用） ----------------
   * 游戏把「某一关此刻是什么天气 / 现在算白天还是夜晚」全算在内部两个模块上：
   *   WEATHER.current(node)          → 这一关此刻的天气 key（null = 没有特殊天气）
   *   WEATHER.changes(node, n, 槽数)  → 接下来 n 次变化 [{key, at}]（at = 毫秒时间戳）
   *   DAYTIME.phase()                → {key:'morning'|'day'|'night'}
   *   DAYTIME.matches('night')       → 现在算不算夜晚（游戏自己的口径）
   * 这正是游戏画进度页那些天气徽标时用的同一套函数（它自己每 30 秒也会跑一遍）。
   * 天气是**按章**算的（同一个 ch 里不同野外路段结果一样），所以只要 ch + 一个路段下标。
   * 只读结果：不写存档、不改游戏状态。 */
  function nsGet(name) {
    var v = null;
    try { v = ns ? ns[name] : null; } catch (e) { v = null; }
    if (v) return v;
    try { return window[name] || null; } catch (e2) { return null; }
  }

  function wxModule() {
    var W = nsGet('WEATHER');
    try { return (W && typeof W.current === 'function') ? W : null; } catch (e) { return null; }
  }
  function dayModule() {
    var D = nsGet('DAYTIME');
    try { return (D && typeof D.phase === 'function') ? D : null; } catch (e) { return null; }
  }

  /* 传进来的下标不是「野外路段」时（道馆 / 宝可梦中心 / 快照对不上）退到这一章
   * 第一条野外路段 —— 天气按章算，用哪条野外路段结果都一样。 */
  function storyNode(ch, step) {
    var S = nsGet('STORY');
    var arr = null;
    try { arr = S && S.CHAPTERS && S.CHAPTERS[ch] && S.CHAPTERS[ch].steps; } catch (e) { arr = null; }
    if (!arr || !arr.length) return null;
    var node = (typeof step === 'number' && isFinite(step) && step >= 0) ? arr[step] : null;
    if (node && node.kind === 'route') return node;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].kind === 'route' && !arr[i].indoor) return arr[i];
    }
    return node || arr[0] || null;
  }

  /* 第八十八批：**原样**取这一章的第 step 个步骤（不做「退到野外路段」那层兜底）。
   * 天气可以用别的路段顶替（天气按章算），但「这一格自己多少概率生成」只能问它本人：
   * 洛托姆形态那些 static 步骤上写着 chance / day / night / skies / once。 */
  function storyStep(ch, step) {
    var S = nsGet('STORY');
    var arr = null;
    try { arr = S && S.CHAPTERS && S.CHAPTERS[ch] && S.CHAPTERS[ch].steps; } catch (e) { arr = null; }
    if (!arr || !arr.length) return null;
    var i = (typeof step === 'number' && isFinite(step) && step >= 0) ? step : -1;
    return (i >= 0 && arr[i]) ? arr[i] : null;
  }

  function wxOne(W, ch, step) {
    var out = {
      ch: ch, step: (typeof step === 'number' && isFinite(step)) ? step : -1,
      known: false, wxs: [], changes: [], endsAt: 0, src: '',
      chance: 0, day: false, night: false, skies: [], once: ''
    };
    /* 第八十八批：先把「这一格自己的生成条件」填好（哪怕天气读不到也要带回）
     *   chance = 每次进图生成概率（0.04 = 4%，0 = 必出）
     *   day / night = 只在白天 / 只在夜晚
     *   skies = 必需天气（空 = 不限）
     *   once = 一次性相遇的 key（用掉以后这一格就再也不出了） */
    var st = storyStep(ch, step);
    if (st) {
      if (typeof st.chance === 'number' && isFinite(st.chance) && st.chance > 0) out.chance = st.chance;
      out.day = !!st.day;
      out.night = !!st.night;
      out.once = String(st.once || '');
      if (Array.isArray(st.skies)) {
        for (var si = 0; si < st.skies.length; si++) if (st.skies[si]) out.skies.push(String(st.skies[si]));
      }
    }
    var FX = (typeof window !== 'undefined') ? window.PCG_WX : null;
    var node = W ? storyNode(ch, step) : null;
    var v = null, got = false;
    if (node) {
      try { v = W.current(node); got = true; } catch (e) { got = false; }
    }
    if (got) {
      out.known = true;      // 读到了（null = 这一关没有特殊天气，也是个确定的答案）
      out.src = 'game';
      if (Array.isArray(v)) {
        for (var i = 0; i < v.length; i++) { if (v[i]) out.wxs.push(String(v[i])); }
      } else if (v) {
        out.wxs.push(String(v));
      }
      try {
        var chg = W.changes(node, 3, 24) || [];
        out.changes = chg.map(function (c) {
          return { key: String((c && c.key) || ''), at: Number(c && c.at) || 0 };
        }).filter(function (c) { return !!c.key && c.at > 0; });
      } catch (e2) { out.changes = []; }
      try { out.endsAt = Number(W.endsAt && W.endsAt()) || 0; } catch (e3) { out.endsAt = 0; }
    } else if (FX && typeof FX.view === 'function') {
      /* 第一百一十四批：游戏内部接口这次没连上（旧页面 / 命名空间没抓到 / 节点取不到），
       * 用按 CONFIG.WEATHER 复算的确定性预报兜底。以前这里直接 known:false，
       * 清单就会退回「天气未知」放行，追着刷不出来的目标跑。 */
      var fv = FX.view(ch);
      out.known = true;
      out.src = 'forecast';
      out.wxs = fv.wxs.slice();
      out.endsAt = fv.endsAt || 0;
      try {
        out.changes = FX.changes(ch, 3, fv.at, 24).map(function (c) {
          return { key: String(c.key || ''), at: Number(c.at) || 0 };
        }).filter(function (c) { return c.at > 0; });
      } catch (e4) { out.changes = []; }
    }
    return out;
  }

  function dayNow() {
    var D = dayModule();
    var key = '', night = null, nextHour = 0;
    if (D) {
      try { var ph = D.phase(); key = String((ph && ph.key) || ''); } catch (e) { key = ''; }
      try { night = !!D.matches('night'); } catch (e2) { night = null; }
      try { nextHour = Number(D.until()) || 0; } catch (e3) { nextHour = 0; }
    }
    var FX = (typeof window !== 'undefined') ? window.PCG_WX : null;
    if (night === null && FX && typeof FX.view === 'function') {
      /* 第一百一十四批：DAYTIME 没抓到时按游戏同一口径（20:00–08:00）自己算，
       * 顺手把结果喂给预报模块，让「现在这一槽」的昼夜与游戏一致。 */
      night = FX.view(0).night;
      var h = new Date().getHours();
      key = night ? 'night' : (h < 10 ? 'morning' : 'day');
      nextHour = night ? 8 : (h < 10 ? 10 : 20);
    }
    if (FX && typeof FX.setNight === 'function' && night !== null) FX.setNight(night);
    if (!key && night === null) return null;
    return { key: key, night: night, nextHour: nextHour };
  }

  function wxReply(res) {
    var payload = '';
    try { payload = JSON.stringify(res); } catch (e) { return; }
    try {
      document.dispatchEvent(new CustomEvent('pcg-wx-result', { detail: payload }));
    } catch (e2) { /* ignore */ }
    try {
      window.dispatchEvent(new CustomEvent('pcg-wx-result', { detail: payload }));
    } catch (e3) { /* ignore */ }
  }

  window.addEventListener('pcg-cmd', function (ev) {
    var cmd = '';
    try { cmd = String((ev && ev.detail) || ''); } catch (e) { return; }
    if (cmd.indexOf('wxinfo:') !== 0) return;
    var req = null;
    try { req = JSON.parse(cmd.slice('wxinfo:'.length) || '{}'); } catch (e2) { req = null; }
    var W = wxModule();
    var FX = (typeof window !== 'undefined') ? window.PCG_WX : null;
    /* 第一百一十四批：把服务器时钟喂给预报模块，避免本机时钟偏差导致错槽 */
    if (FX && typeof FX.setClock === 'function') {
      var CLK = nsGet('Clock');
      try { if (CLK && typeof CLK.now === 'function') FX.setClock(CLK.now()); } catch (e5) { /* ignore */ }
    }
    if (!W && !FX) {
      wxReply({ ok: false, at: Date.now(), text: '没连上游戏内部接口：刷新一次游戏页再试' });
      return;
    }
    var q = (req && Array.isArray(req.q)) ? req.q : [];
    var list = [];
    for (var i = 0; i < q.length && i < 200; i++) {
      var it = q[i] || {};
      var ch = Number(it.ch);
      if (!isFinite(ch) || ch < 0) continue;
      list.push(wxOne(W, ch, Number(it.step)));
    }
    wxReply({ ok: true, at: Date.now(), list: list, day: dayNow() });
  });

  /* v1.47：一键进化确认弹窗——给每只待进化宝可梦配立绘缩略图。
   * 用游戏自己的 game.sideMons().filter(game.levelEvolution) 拿到「这一批到底进化哪几只」，
   * 与游戏弹窗里的 N 完全一致（不自己拿存档猜，避免 los filtros / 道具进化 / 时段进化
   * 造成的偏差）。只返回 uid/id/shiny/level，立绘 URL 由隔离世界按 assets/pokemon 拼。 */
  function evoReply(res) {
    var payload = '';
    try { payload = JSON.stringify(res); } catch (e) { return; }
    try { document.dispatchEvent(new CustomEvent('pcg-evo-result', { detail: payload })); }
    catch (e2) { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent('pcg-evo-result', { detail: payload })); }
    catch (e3) { /* ignore */ }
  }
  window.addEventListener('pcg-cmd', function (ev) {
    var cmd = '';
    try { cmd = String((ev && ev.detail) || ''); } catch (e) { return; }
    if (cmd.indexOf('evoinfo:') !== 0) return;
    var G = gameOf();
    if (!G || typeof G.sideMons !== 'function' || typeof G.levelEvolution !== 'function') {
      evoReply({ ok: false, at: Date.now(), mons: [], text: '没连上游戏内部接口' });
      return;
    }
    var mons = [], list = [];
    try { mons = G.sideMons() || []; } catch (e4) { mons = []; }
    for (var i = 0; i < mons.length && i < 500; i++) {
      var m = mons[i];
      if (!m || !m.uid) continue;
      var can = null;
      try { can = G.levelEvolution(m); } catch (e5) { can = null; }
      if (!can) continue;                       // 只收「等级可进化」的，和 evo-all 的 U() 一致
      list.push({ uid: String(m.uid), id: Number(m.id) || 0,
        shiny: !!m.shiny, level: Number(m.level) || 0,
        to: Number(can.to) || 0 });
    }
    evoReply({ ok: true, at: Date.now(), mons: list });
  });
  /* v1.28.1：安装地下探险「闪光化石自动召回」桥。
   * v1.28 曾在此处同步调用 install()，它挂的 250ms 定时器每 900ms 会执行
   * snapshot()→context()→gameOf()（其中 gameOf 在游戏命名空间就绪前会遍历
   * window 全部自有属性）。在游戏 boot 阶段（"En route pour l'aventure"）反复
   * 执行会在低端手机上把主线程卡死、无法进入游戏。
   * 修复：延迟到「本页 load 完成 + 游戏命名空间已捕获(ns.Game 可用)」再安装，
   * 且用计数上限避免无限轮询。召回本身要玩家进游戏后布防，延后安装不影响功能。 */
  function installUnderBridge() {
    if (!window.PCG_UNDER_MAIN) return;
    var ready = false;
    try {
      ready = document.readyState === 'complete' &&
        !!ns && !!ns.Game &&
        typeof ns.Game.time === 'function';
    } catch (e) { ready = false; }
    if (ready) {
      window.PCG_UNDER_MAIN.install({ game: gameOf, namespace: function () { return ns; } });
      return;
    }
    if (installUnderBridge._tries < 300) {          // 最多约 5 分钟，每 1s 一次
      installUnderBridge._tries++;
      setTimeout(installUnderBridge, 1000);
    }
  }
  installUnderBridge._tries = 0;
  setTimeout(installUnderBridge, 1500);
})();
