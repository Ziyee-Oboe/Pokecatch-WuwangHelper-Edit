/* Poke'Catch 防掉线助手 —— 页面脚本（MAIN world，跑在游戏自己的 JS 环境里）
 *
 * 第一百二十一批：协调「最小化保持在线」与「离线补算」——保活优先，卡死兜底。
 * 保活开着时继续伪造 document.hidden=false / visibilityState='visible' / hasFocus()=true，
 * 游戏在后台照常跑在线收益（这是插件第一项功能的核心价值），并且不再拦截
 * visibilitychange（游戏主动发的事件照常响应）。另加「卡死看门狗」：真在后台且
 * 长时间没有任何进度心跳（帧/网络/WS 消息都不动）时，临时撤销伪造、派发一次
 * visibilitychange 让游戏走 ue(0) 离线补算兜底，随后恢复伪造。默认在线收益，
 * 只有进度真的卡死才补算——两者不再互相打架。
 *
 *   1. 观察 WebSocket（只观察不拦截），把状态写进 <html data-pcg="...">；
 *   2. 【核心】最小化保持在线（只保活，不改可见状态）：
 *        - 放行 visibilitychange / webkitvisibilitychange，让游戏能触发离线补算
 *        - 拦掉窗口级的 blur / pagehide / freeze 事件（防掉线）
 *        - 把 requestAnimationFrame 在“真的被最小化”时接管成定时器驱动，
 *          这样游戏的渲染循环不会因为浏览器停掉 rAF 而整个停摆
 *   3. 收到内容脚本的指令时，派发 online 事件、清理“假在线”的 Supabase 连接；
 *      同时记下网络请求成功的时间（内容脚本用它判断“网页其实没掉线，不用刷新”）。
 */
(function () {
  'use strict';

  if (window.__PCG_HOOK__) return;
  window.__PCG_HOOK__ = true;

  var doc = document;

  /* ---------------- 0. 先抓住“原生”句柄，后面靠它判断真实状态 ---------------- */
  var NativeWS = window.WebSocket;
  var nativeFetch = window.fetch;
  var nativeRAF = window.requestAnimationFrame;
  var nativeCAF = window.cancelAnimationFrame;

  if (typeof nativeRAF !== 'function') {
    nativeRAF = function (cb) { return setTimeout(function () { cb(Date.now()); }, 16); };
  }
  if (typeof nativeCAF !== 'function') {
    nativeCAF = function (id) { clearTimeout(id); };
  }

  var hiddenDesc = null;
  var stateDesc = null;
  try {
    hiddenDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')
      || Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'hidden');
    stateDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')
      || Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'visibilityState');
  } catch (e) { /* ignore */ }

  function reallyHidden() {
    try {
      if (hiddenDesc && hiddenDesc.get) return !!hiddenDesc.get.call(doc);
    } catch (e) { /* ignore */ }
    try { return doc.hidden === true; } catch (e2) { return false; }
  }

  /* ---------------- 状态对象（内容脚本通过 data-pcg 读取） ---------------- */
  var state = {
    total: 0,          // 累计建立过的 WebSocket 数
    open: 0,           // 当前 OPEN 的连接数
    lastCloseAt: 0,    // 最后一次断开时间
    lastMsgAt: 0,      // 最后一次收到消息的时间
    lastCloseCode: 0,  // close code（1000 正常 / 1006 异常）
    lastCloseClean: 1,
    spoof: 0,          // 最小化保持在线是否生效
    fb: 0,             // 由定时器接管的动画帧计数（说明确实在最小化状态下继续跑）
    hid: 0,            // 累计处于“真·最小化/隐藏”状态的秒数，用来验证接管确实在工作
    netOk: 0,          // 成功的网络请求数（fetch / XHR 都在数）
    netFail: 0,        // 失败的网络请求数
    lastNetAt: 0,      // 最后一次请求成功的时间——判断“游戏到底还连不连得上网”
    ready: 1
  };

  var live = [];          // [{ ws, lastMsgAt }]
  var lastPublished = '';

  function publish() {
    var open = 0;
    var newestMsg = 0;
    for (var i = 0; i < live.length; i++) {
      var item = live[i];
      if (item.ws && item.ws.readyState === 1) open++;
      if (item.lastMsgAt > newestMsg) newestMsg = item.lastMsgAt;
    }
    state.open = open;
    state.lastMsgAt = newestMsg;

    var payload = JSON.stringify(state);
    if (payload === lastPublished) return;
    // document_start 时 <html> 可能还没建出来，所以每次都现取一遍
    var node = doc.documentElement;
    if (!node) return;
    lastPublished = payload;
    try {
      node.setAttribute('data-pcg', payload);
    } catch (e) { /* 写不进去也不影响游戏 */ }
  }

  /* ---------------- 1. WebSocket 观察 ---------------- */
  function track(ws) {
    var item = { ws: ws, lastMsgAt: Date.now() };
    for (var i = 0; i < live.length; i++) {
      if (live[i].ws === ws) return item;
    }
    live.push(item);

    try {
      ws.addEventListener('message', function () {
        item.lastMsgAt = Date.now();
      });
      ws.addEventListener('open', function () {
        item.lastMsgAt = Date.now();
        publish();
      });
      ws.addEventListener('close', function (ev) {
        state.lastCloseAt = Date.now();
        state.lastCloseCode = (ev && typeof ev.code === 'number') ? ev.code : 1006;
        state.lastCloseClean = (ev && ev.wasClean) ? 1 : 0;
        for (var j = live.length - 1; j >= 0; j--) {
          if (live[j].ws === ws) live.splice(j, 1);
        }
        publish();
      });
      ws.addEventListener('error', function () {
        state.lastCloseAt = Date.now();
        publish();
      });
    } catch (e) { /* ignore */ }

    publish();
    return item;
  }

  if (typeof NativeWS === 'function') {
    try {
      var Wrapped = function (url, protocols) {
        var ws = arguments.length >= 2 ? new NativeWS(url, protocols) : new NativeWS(url);
        state.total++;
        track(ws);
        return ws;
      };
      Wrapped.prototype = NativeWS.prototype;
      Wrapped.CONNECTING = 0;
      Wrapped.OPEN = 1;
      Wrapped.CLOSING = 2;
      Wrapped.CLOSED = 3;
      window.WebSocket = Wrapped;
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 1a2. 交换 RPC 抓包（第一百二十一批） ----------------
   * 游戏的交换 offer 明细（give_id / want_id / have / give_shiny）只存在于闭包里，
   * 隔离世界读不到，species 缓存又没有 want_id，无法区分「问号求任意闪光」和
   * 「指定交换」。这里在 MAIN world 的 fetch 包装里，把 supabase 的
   * trade_offers / trade_list 响应 clone 一份解析，写到 <html data-pcg-offers>，
   * 隔离世界的 trade-boost.js 就能读到明细。只 clone、只读，不改游戏拿到的响应。 */
  var OFFER_KEYS = ['trade_offers', 'trade_list'];
  var lastOffersJson = '';
  function captureOffers(url, res) {
    try {
      var isOffer = false;
      var u = String(url || '');
      for (var i = 0; i < OFFER_KEYS.length; i++) {
        if (u.indexOf(OFFER_KEYS[i]) >= 0) { isOffer = true; break; }
      }
      if (!isOffer || !res || typeof res.clone !== 'function') return;
      res.clone().json().then(function (data) {
        var arr = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : null);
        if (!arr || !arr.length) return;
        /* 只保留做筛选需要的字段，减小 DOM 属性体积 */
        var slim = arr.map(function (o) {
          return {
            id: o.id, give_id: Number(o.give_id) || 0,
            give_shiny: !!o.give_shiny, want_id: Number(o.want_id) || 0,
            have: Array.isArray(o.have) ? o.have : [],
            reg: o.reg, owner: o.owner_name || o.owner || '',
            friend: !!o.friend, exp: o.expires_at || 0
          };
        });
        var json = JSON.stringify({ at: Date.now(), offers: slim });
        if (json === lastOffersJson) return;
        lastOffersJson = json;
        var node = doc.documentElement;
        if (node) node.setAttribute('data-pcg-offers', json);
      }).catch(function () { /* 解析失败不影响游戏 */ });
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 1b. 网络请求观察（只记时间，不改请求） ---------------- */
  // 断线判定的第二证据：WebSocket 断了不代表网断了（游戏只是不用那条连接）。
  // 只要游戏还在成功发请求，就说明它没掉线，不该刷新页面。
  try {
    if (typeof nativeFetch === 'function') {
      window.fetch = function () {
        var reqUrl = arguments[0] && (arguments[0].url || arguments[0]);
        var p = nativeFetch.apply(this, arguments);
        if (p && typeof p.then === 'function') {
          return p.then(function (res) {
            state.netOk++;
            state.lastNetAt = Date.now();
            publish();
            try { captureOffers(reqUrl, res); } catch (e) { /* ignore */ }
            return res;
          }, function (err) {
            state.netFail++;
            publish();
            throw err;
          });
        }
        return p;
      };
    }
  } catch (e) { /* 改不动就算了，只是少一个旁证 */ }

  try {
    var NativeXHR = window.XMLHttpRequest;
    if (typeof NativeXHR === 'function') {
      var wrapXhr = function () {
        var x = new NativeXHR();
        try {
          x.addEventListener('loadend', function () {
            if (x.status >= 200 && x.status < 400) { state.netOk++; state.lastNetAt = Date.now(); }
            else if (x.status >= 400) state.netFail++;
            publish();
          });
        } catch (e) { /* ignore */ }
        return x;
      };
      wrapXhr.prototype = NativeXHR.prototype;
      window.XMLHttpRequest = wrapXhr;
    }
  } catch (e) { /* ignore */ }

  /* ---------------- 1c. 精灵图 → 图鉴号（战斗属性提示用） ---------------- */
  // 游戏把精灵图画进 canvas、裁掉透明边之后 toDataURL，所以战斗里那个 <img> 的 src
  // 是一串 data:image/png;base64,…，光看 src 根本认不出是哪一只（敌方尤其）。
  // 这里在 MAIN world 里把线串起来：
  //   资产路径 assets/pokemon/<id>.png → 那个 Image 记下 id
  //   → 它被 drawImage 画进 canvas 时，id 也记到 canvas 上
  //   → toDataURL 出来的那串 URL 和 id 一起存进表
  //   → 之后谁被设上这串 URL，就在它身上打 data-pcg-id="<id>"
  // 内容脚本只用读属性，不用跟页面脚本通信。
  try {
    var spriteIds = Object.create(null);        // dataURL → 图鉴号
    var spriteMeta = Object.create(null);       // dataURL → { id, shiny }
    var idFromPath = function (s) {
      var m = /assets\/pokemon\/(?:[\w-]+\/)*(\d+)[\w-]*\.png/.exec(s);
      if (!m) m = /\/(\d+)[\w-]*\.png(?:[?#]|$)/.exec(s);
      return m ? Number(m[1]) : 0;
    };
    /* 第五批「闪光战斗守卫」的第二个信号：
     * 游戏给闪光宝可梦用的资源路径是 assets/pokemon/shiny/<id>.png，
     * 但战斗里那个 <img> 的 src 常常是裁切后的 canvas dataURL，光看路径认不出来。
     * 下面把「路径 → canvas → dataURL → img」这条链上的 shiny 标记一路带过去，
     * 内容脚本只要读 data-pcg-shiny 就能知道场上是不是闪光。 */
    var shinyFromPath = function (s) { return /\/shiny\//.test(s) || /[?&]shiny=1/.test(s); };
    var srcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (srcDesc && srcDesc.get && srcDesc.set) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        configurable: true,
        enumerable: srcDesc.enumerable,
        get: function () { return srcDesc.get.call(this); },
        set: function (v) {
          try {
            var s = String(v == null ? '' : v);
            var id = 0, shiny = false;
            if (s.indexOf('data:image') === 0) {
              var meta = spriteMeta[s];
              if (meta) { id = meta.id; shiny = !!meta.shiny; }
              else id = spriteIds[s] || 0;
            } else if (s.indexOf('assets/') >= 0) {
              id = idFromPath(s);
              shiny = shinyFromPath(s);
            }
            this.__pcgId = id || this.__pcgId;
            this.__pcgShiny = shiny;
            if (id) this.setAttribute('data-pcg-id', String(id));
            if (shiny) this.setAttribute('data-pcg-shiny', '1');
            else this.removeAttribute('data-pcg-shiny');
          } catch (e) { /* 只是标记，失败不影响游戏 */ }
          return srcDesc.set.call(this, v);
        }
      });
    }
    var ctxProto = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
    if (ctxProto && ctxProto.drawImage) {
      var nativeDraw = ctxProto.drawImage;
      ctxProto.drawImage = function () {
        try {
          var im = arguments[0];
          if (im && im.__pcgId && this.canvas) {
            this.canvas.__pcgId = im.__pcgId;
            this.canvas.__pcgShiny = !!im.__pcgShiny;
          }
        } catch (e) { /* ignore */ }
        return nativeDraw.apply(this, arguments);
      };
    }
    var nativeDataUrl = window.HTMLCanvasElement && HTMLCanvasElement.prototype.toDataURL;
    if (nativeDataUrl) {
      HTMLCanvasElement.prototype.toDataURL = function () {
        var url = nativeDataUrl.apply(this, arguments);
        try {
          if (this.__pcgId && url) {
            spriteIds[url] = this.__pcgId;
            spriteMeta[url] = { id: this.__pcgId, shiny: !!this.__pcgShiny };
          }
        } catch (e) { /* ignore */ }
        return url;
      };
    }
  } catch (e) { /* 页面环境不对就跳过，属性牌会退回读 src */ }

  /* ---------------- 2. 最小化保持在线 ---------------- */
  var spoofOn = false;

  // 2a. 拦掉“窗口被隐藏 / 失焦”这类事件：只挡窗口级的，输入框自己的 blur 不碰
  function blockWindowEvent(ev) {
    if (!spoofOn) return;
    if (!ev.isTrusted) return;   // 只挡浏览器自己发的（我们合成的 focus 之类要放行）
    var t = ev.target;
    if (t !== doc && t !== window && t !== doc.documentElement && t !== doc.body) return;
    try {
      ev.stopImmediatePropagation();
    } catch (e) { /* ignore */ }
  }

  /* 第一百二十一批：visibilitychange 依旧不拦 —— 游戏等的就是这个事件结算离线
   * 收益；拦了它，document.hidden 为真时游戏会永远卡在 await visibilitychange。
   * 卡死看门狗要用它做兜底补算，更不能拦。 */
  var BLOCKED = ['pagehide', 'freeze', 'blur', 'focus'];
  for (var b = 0; b < BLOCKED.length; b++) {
    window.addEventListener(BLOCKED[b], blockWindowEvent, true);
  }

  // 2b. rAF 接管：真被最小化时，浏览器会完全停掉 requestAnimationFrame，
  //     游戏的循环一停就会判定“你不在了”。这里换成 16ms 定时器驱动，逻辑照跑。
  var fallbackPending = {};
  var fallbackNextId = 1000000000; // 用很大的 id，避免和原生 rAF 的 id 撞车

  function fallbackEnabled() {
    return spoofOn && reallyHidden();
  }

  function tickFallback() {
    // rAF 被接管时，每帧回调都要用“现在”当时间戳，游戏按它算 deltaTime
    return performance && performance.now ? performance.now() : Date.now();
  }

  try {
    window.requestAnimationFrame = function (cb) {
      if (typeof cb !== 'function' || !fallbackEnabled()) {
        return nativeRAF.call(window, cb);
      }
      var id = fallbackNextId++;
      fallbackPending[id] = setTimeout(function () {
        delete fallbackPending[id];
        if (!spoofOn) return;
        state.fb++;
        try {
          cb(tickFallback());
        } catch (e) {
          try { console.error('[防掉线] 动画帧回调出错', e); } catch (e2) { /* ignore */ }
        }
      }, 16);
      return id;
    };

    window.cancelAnimationFrame = function (id) {
      if (fallbackPending[id] !== undefined) {
        clearTimeout(fallbackPending[id]);
        delete fallbackPending[id];
        return;
      }
      nativeCAF.call(window, id);
    };
  } catch (e) { /* 改不动就只靠事件拦截 */ }

  // 2c. 可见状态伪造的开关（第一百二十一批：保活优先，恢复伪造）
  //     fakeFront=true 时把页面钉成「前台」，游戏后台继续拿在线收益；
  //     卡死看门狗判断进度停摆时会临时摘掉伪造（fakeFront=false）走一次离线补算。
  var fakeFront = false;
  function applyFake(on) {
    on = !!on;
    if (on === fakeFront) return;
    fakeFront = on;
    try {
      if (on) {
        /* 只在原型访问器存在时钉死；拿不到描述符就退回自有属性，双重保险 */
        if (hiddenDesc && hiddenDesc.get && hiddenDesc.configurable !== false) {
          Object.defineProperty(doc, 'hidden', { configurable: true, get: function () { return false; } });
        } else {
          try { Object.defineProperty(doc, 'hidden', { configurable: true, get: function () { return false; } }); } catch (e) {}
        }
        if (stateDesc && stateDesc.get) {
          Object.defineProperty(doc, 'visibilityState', { configurable: true, get: function () { return 'visible'; } });
        } else {
          try { Object.defineProperty(doc, 'visibilityState', { configurable: true, get: function () { return 'visible'; } }); } catch (e2) {}
        }
        var nativeFocus = doc.hasFocus;
        try { doc.hasFocus = function () { return true; }; } catch (e3) {}
      } else {
        try { delete doc.hidden; } catch (e4) {}
        try { delete doc.visibilityState; } catch (e5) {}
        try { delete doc.hasFocus; } catch (e6) {}
      }
    } catch (e7) { /* ignore */ }
  }

  function setSpoof(on) {
    on = !!on;
    if (on === spoofOn) return;
    spoofOn = on;
    state.spoof = on ? 1 : 0;
    if (on) {
      applyFake(true);          // 保活开 → 钉成前台，拿在线收益
      resetWatchdog();
    } else {
      applyFake(false);         // 保活关 → 交还原生，切后台正常结算离线收益
      Object.keys(fallbackPending).forEach(function (k) {
        try { clearTimeout(fallbackPending[k]); } catch (e) { /* ignore */ }
        delete fallbackPending[k];
      });
    }
    publish();
  }

  /* ---------------- 2d. 卡死看门狗（第一百二十一批） ----------------
   * 保活钉成前台后，理论上游戏一直在拿在线收益；但极端情况下（浏览器把后台
   * 定时器节流到近乎停摆、rAF 接管没跑起来）游戏进度会卡死。这里在真·后台
   * 监测「进度心跳」：帧数 fb / 成功请求 netOk / WS 消息 lastMsgAt 三者若连续
   * STALL_MS 都没进展，就判定卡死 → 临时摘掉伪造、派发 visibilitychange，
   * 让游戏走一次 ue(0) 离线补算兜底；补算后恢复伪造继续拿在线收益。
   * 只有「保活确实卡死」才触发，正常情况下绝不打断在线收益。 */
  var STALL_MS = 120000;      // 2 分钟没有任何心跳进展算卡死
  var WATCH_DOG_MS = 5000;    // 每 5 秒查一次
  var wd = { fb: -1, net: -1, msg: 0, since: 0, cooling: 0, fixing: false };
  function resetWatchdog() {
    wd.since = 0; wd.cooling = 0; wd.fixing = false;
    wd.fb = state.fb; wd.net = state.netOk; wd.msg = state.lastMsgAt;
  }
  function fireOfflineFallback() {
    /* 临时交还原生可见状态（真·后台 hidden=true），派发事件触发游戏补算，
     * 几秒后恢复伪造。用 sessionStorage 去重，避免同一轮后台反复补算。 */
    var stamp = 'pcgOfflineFix_' + String(Date.now());
    try {
      if (sessionStorage.getItem('pcgOfflineFixAt') &&
          Date.now() - Number(sessionStorage.getItem('pcgOfflineFixAt')) < 60000) return;
      sessionStorage.setItem('pcgOfflineFixAt', String(Date.now()));
      sessionStorage.setItem('pcgOfflineFixLast', stamp);
    } catch (e) { /* ignore */ }
    logOfflineFix();
    applyFake(false);
    try { doc.dispatchEvent(new Event('visibilitychange')); } catch (e) {}
    wd.fixing = true;
    setTimeout(function () {
      if (spoofOn) applyFake(true);   // 补算窗口过后恢复伪造，继续在线收益
      wd.fixing = false;
      resetWatchdog();
      wd.cooling = Date.now();
    }, 4000);
  }
  function logOfflineFix() {
    try { console.info('[防掉线] 进度长时间无进展，触发一次离线收益补算兜底'); } catch (e) {}
    try {
      var payload = JSON.stringify({ offlineFixAt: Date.now() });
      doc.documentElement.setAttribute('data-pcg-fix', payload);
    } catch (e) {}
  }
  function watchdogTick() {
    if (!spoofOn || wd.fixing) return;
    if (!reallyHidden()) { resetWatchdog(); return; }   // 前台：不需要补算
    if (wd.cooling && Date.now() - wd.cooling < STALL_MS) return;
    var progressed = (state.fb !== wd.fb) || (state.netOk !== wd.net) || (state.lastMsgAt > wd.msg);
    if (progressed) {
      wd.fb = state.fb; wd.net = state.netOk; wd.msg = state.lastMsgAt;
      wd.since = 0;
      return;
    }
    if (!wd.since) { wd.since = Date.now(); return; }
    if (Date.now() - wd.since >= STALL_MS) fireOfflineFallback();
  }
  setInterval(watchdogTick, WATCH_DOG_MS);
  resetWatchdog();

  /* ---------------- 3. 每秒上报 ---------------- */
  setInterval(function () {
    try {
      for (var i = live.length - 1; i >= 0; i--) {
        var rs = live[i].ws.readyState;
        if (rs === 2 || rs === 3) live.splice(i, 1);
      }
    } catch (e) { /* ignore */ }
    if (reallyHidden()) state.hid++;
    publish();
  }, 1000);

  publish();

  /* ---------------- 4. 接收内容脚本指令 ---------------- */
  function isSupabase(url) {
    return /supabase\.(co|in)|realtime/i.test(String(url || ''));
  }

  function hardReconnect() {
    var now = Date.now();
    for (var i = live.length - 1; i >= 0; i--) {
      var item = live[i];
      var ws = item.ws;
      if (!ws || !isSupabase(ws.url)) continue;
      var stale = ws.readyState === 1 && now - item.lastMsgAt > 75000;
      if (ws.readyState === 1 && !stale) continue;
      try { ws.close(); } catch (e) { /* ignore */ }
    }
  }

  function softReconnect() {
    try { window.dispatchEvent(new Event('online')); } catch (e) { /* ignore */ }
    try { window.dispatchEvent(new Event('focus')); } catch (e) { /* ignore */ }
  }

  window.addEventListener('pcg-cmd', function (ev) {
    var cmd = '';
    try { cmd = String((ev && ev.detail) || ''); } catch (e) { cmd = ''; }

    if (cmd === 'reconnect') {
      softReconnect();
      setTimeout(function () { hardReconnect(); }, 1500);
    } else if (cmd === 'reconnect-hard') {
      hardReconnect();
      softReconnect();
    } else if (cmd === 'spoof:1') {
      setSpoof(true);
    } else if (cmd === 'spoof:0') {
      setSpoof(false);
    } else if (cmd === 'ping') {
      publish();
    }
  });

  // 调试入口：控制台里 window.__PCG_STATE__ 看实时计数
  try {
    Object.defineProperty(window, '__PCG_STATE__', { get: function () { return state; } });
  } catch (e) { /* ignore */ }
})();
