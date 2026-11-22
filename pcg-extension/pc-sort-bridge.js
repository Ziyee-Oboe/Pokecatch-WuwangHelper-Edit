/* Poke'Catch 防掉线助手 —— 仓库「自定义」排序桥（MAIN world / document_start）
 *
 * 线上游戏的仓库排序下拉 #pc-sort 把当前值存在存档 G.S.pcSort（默认 "recent"），
 * 「自定义」对应的 uid 顺序存在 G.S.pcOrder。游戏保存时是
 *     localStorage.setItem("gachamon-save-v1", JSON.stringify(G.S))
 * 启动时再 JSON.parse 读回来；渲染仓库时按 G.S.pcOrder 的 index 排。
 *
 * 这里只做四件事，不改游戏代码，也不碰其它 localStorage 键：
 *   1. 每次刷新把 pcSort 恢复成 "custom"，让仓库默认显示「自定义」；
 *      玩家当页自己改的排序仍然保留，直到下一次刷新。
 *   2. 把内容脚本发布的顺序「补」进 G.S.pcOrder —— **只追加缺的 uid，不整表覆盖**。
 *      （第一百零二批改的：以前是整表覆盖，玩家拖好的位置下一拍就被冲掉。）
 *   3. 第一百零六批：发布数据带 pin / favs、且当前排序是「自定义」时，把收藏 uid
 *      **整组**提到 pcOrder 最前；组内与组外都保持玩家原有的相对顺序，并且幂等。
 *      这正是「自定义里收藏置顶在仓库不生效」的修复 —— 老档已有 pcOrder 时，
 *      只补不改会让内容脚本算出来的收藏优先顺序永远写不进去。
 *      其它排序下一律不动，全交给游戏。
 *   4. 玩家自己拖出来的相对顺序在各自组内永远是权威。
 *
 * 顺序由内容脚本发布到 localStorage["pcgPcOrderV1"]：
 *     { v:1, at:<毫秒时间戳>, order:[uid,...], pin:<bool>, favs:[uid,...]|null }
 * 之所以直接改 JSON.stringify 收到的那个对象，是因为它就是游戏内存里的 G.S，
 * 只改写盘的字符串会让内存和磁盘不一致、下一次渲染又变回去。
 */
(function () {
  'use strict';

  if (window.__PCG_PC_SORT_BRIDGE__) return;
  window.__PCG_PC_SORT_BRIDGE__ = true;

  var SAVE_KEY = 'gachamon-save-v1';
  var ORDER_KEY = 'pcgPcOrderV1';
  var SORT = 'custom';

  var nativeParse = JSON.parse;
  var nativeStringify = JSON.stringify;
  var nativeGet = null;
  var nativeSet = null;
  try {
    if (window.Storage && window.Storage.prototype) {
      nativeGet = window.Storage.prototype.getItem;
      nativeSet = window.Storage.prototype.setItem;
    }
  } catch (e) { /* 环境不允许就整体降级 */ }

  var sortForced = false;      // 本次页面加载是否已经把 pcSort 设成 custom
  var injectedSig = '';        // 上次注入的 pcOrder 签名
  var injectedAt = 0;          // 上次注入的顺序版本（order.at）
  var replacedToken = '';      // v1.44：已执行过的「一键整理」token，一次性生效防重复覆盖玩家拖拽
  var stat = { reads: 0, writes: 0, injected: 0, kept: 0, appended: 0, pinned: 0 };
  var MIRROR_ID = 'pcg-save-mirror';
  var mirrorAt = 0;

  /* 把游戏最近一次读写过的存档留一份在 DOM 文本里。
   * 隔离世界看不到页面世界的 window，但 DOM 节点与 textContent 是共享的；
   * save-store.js 在主存档读不到时用它兜底（云存档尚未落盘 / 多标签锁只让主标签写盘）。
   * 只在游戏真的读写存档时更新，且最低 400ms 一次，避免拖慢游戏。 */
  function mirrorSave(json, at) {
    try {
      if (typeof json !== 'string' || json.length < 20) return;
      var now = at || Date.now();
      if (now - mirrorAt < 400) return;
      mirrorAt = now;
      var d = window.document;
      if (!d || !d.getElementById || !d.createElement) return;
      var el = d.getElementById(MIRROR_ID);
      if (!el) {
        el = d.createElement('script');
        el.type = 'application/json';
        el.id = MIRROR_ID;
        try { el.style.display = 'none'; } catch (e) { /* ignore */ }
        var host = d.head || d.documentElement || d.body;
        if (!host || !host.appendChild) return;
        host.appendChild(el);
      }
      el.textContent = json;
      el.setAttribute('data-at', String(now));
    } catch (e) { /* DOM 还没就绪就等下一次写盘 */ }
  }

  function isSave(v) {
    try {
      return !!(v && typeof v === 'object' && !Array.isArray(v) &&
        Array.isArray(v.mons) && v.dex && typeof v.dex === 'object');
    } catch (e) { return false; }
  }

  // 用原生句柄读，绕过下面装上的 getItem 钩子，避免自己调自己
  function orderOf() {
    try {
      if (!nativeGet) return null;
      var raw = nativeGet.call(window.localStorage, ORDER_KEY);
      if (!raw) return null;
      var o = nativeParse(raw);
      return (o && Array.isArray(o.order) && o.order.length) ? o : null;
    } catch (e) { return null; }
  }

  function sigOf(arr) { return arr.join('|'); }

  function applySort(save, force) {
    // force 只在「本次加载第一次读到存档」时用；之后玩家改下拉不再被拽回来
    if (force || !sortForced) {
      try { save.pcSort = SORT; sortForced = true; } catch (e) { /* ignore */ }
    }
  }

  function applyOrder(save, force) {
    var o = orderOf();
    if (!o) return;
    var want = o.order;

    /* v1.44：仓库「一键整理」一次性全量替换。
     * 内容脚本点按钮时写入 replace:<token> + 算好的新顺序。桥这边第一次见到这个
     * token 就把 G.S.pcOrder 整体换成新顺序（收藏已在内容脚本侧排到最前），并记住
     * token；之后同一次页面会话里再遇到它一律跳过，玩家随后自己拖的位置不会被
     * 每 2.5 秒的周期发布反复冲掉。玩家下次点整理会生成新 token，再整体替换一次。 */
    if (o.replace && o.replace !== replacedToken && Array.isArray(want) && want.length) {
      replacedToken = o.replace;
      try {
        save.pcOrder = want.slice();
        injectedSig = sigOf(want);
        injectedAt = Number(o.at) || 0;
        stat.tidied = (stat.tidied || 0) + 1;
      } catch (e) { /* ignore */ }
    }

    var cur = Array.isArray(save.pcOrder) ? save.pcOrder : null;
    /* 第一百零二批：只补不改。
       以前这里是整表覆盖 —— 玩家刚拖好的顺序，下一拍就被内容脚本发来的
       旧顺序冲掉（「摆不到鼠标指的那一格」）。现在：
         · 表里已经有的 uid 一个都不动，「谁在第几格」是玩家拖出来的，谁都不能改；
         · 只把发布表里有、存档里没有的 uid 追加到末尾（新抓的宝可梦）；
         · 发布表里没有的也不删 —— 那可能是地下通道 / 临时队伍里的，
           删掉只会让它们以后没地方排。 */
    if (!cur || !cur.length) {
      try {
        save.pcOrder = want.slice();
        injectedSig = sigOf(want);
        injectedAt = Number(o.at) || 0;
        stat.injected++;
      } catch (e) { /* ignore */ }
      return;
    }
    var have = {}, i, added = 0;
    for (i = 0; i < cur.length; i++) have[cur[i]] = 1;
    for (i = 0; i < want.length; i++) {
      if (!want[i] || have[want[i]]) continue;
      have[want[i]] = 1;
      try { cur.push(want[i]); } catch (e) { break; }
      added++;
    }

    /* 第一百零六批：收藏置顶，只在「自定义」排序下生效。
     * 老档的 pcOrder 是玩家拖出来的，上面「只补不改」会让内容脚本算出来的
     * 收藏优先顺序永远写不进去 —— 这就是仓库里自定义收藏置顶不生效的根因。
     * 做法：补完缺 uid 后，把收藏整组提到非收藏之前；组内、组外都保持玩家
     * 原有的相对顺序（不按稀有度重排，玩家拖的位置在组内仍然算数）。
     * 幂等：已经「全部收藏在前」时 need 为 false，一个节点都不动。 */
    var sortNow = (save.pcSort == null) ? SORT : String(save.pcSort);
    var pin = (o.pin === true) && Array.isArray(o.favs) && o.favs.length &&
              sortNow === SORT;
    if (pin) {
      var favSet = {};
      for (i = 0; i < o.favs.length; i++) {
        if (o.favs[i]) favSet[String(o.favs[i])] = 1;
      }
      var head = [], tail = [], seenRest = false, need = false;
      for (i = 0; i < cur.length; i++) {
        if (favSet[String(cur[i])]) {
          head.push(cur[i]);
          if (seenRest) need = true;          // 有收藏排在非收藏之后
        } else {
          tail.push(cur[i]);
          seenRest = true;
        }
      }
      if (need && head.length) {
        try {
          save.pcOrder = head.concat(tail);
          cur = save.pcOrder;
          stat.pinned++;
        } catch (e) { /* ignore */ }
      }
    }

    injectedSig = sigOf(cur);
    injectedAt = Number(o.at) || 0;
    if (added) { stat.injected++; stat.appended += added; }
    else stat.kept++;
  }

  /* 1. 读存档：注入默认排序与顺序（游戏随后 JSON.parse 得到的就是注入后的对象） */
  if (nativeGet) {
    try {
      window.Storage.prototype.getItem = function (k) {
        var raw = null;
        // 钩子绝不能因为自己让页面读存储失败：原生调用一旦异常就原样退出
        try { raw = nativeGet.call(this, k); } catch (e) { return raw; }
        if (k !== SAVE_KEY || !raw) return raw;
        try { mirrorSave(raw); } catch (e) { /* ignore */ }
        try {
          var obj = nativeParse(raw);
          if (isSave(obj)) {
            applySort(obj, false);
            applyOrder(obj, true);
            stat.reads++;
            return nativeStringify(obj);
          }
        } catch (e) { /* 存档损坏就原样交给游戏 */ }
        return raw;
      };
    } catch (e) { /* ignore */ }
  }

  /* 2. 序列化存档：直接改到游戏内存里的 G.S 上，写盘字符串自然也带上 */
  try {
    JSON.stringify = function (value) {
      if (isSave(value)) {
        applySort(value, false);
        applyOrder(value, false);
        stat.writes++;
        // 游戏只在内存里更新、没写盘（多标签锁 / 云同步窗口）时也能留一份
        try {
          if (Date.now() - mirrorAt > 1500) mirrorSave(nativeStringify(value));
        } catch (e) { /* ignore */ }
      }
      return nativeStringify.apply(this, arguments);
    };
  } catch (e) { /* ignore */ }

  /* 3. 兜底：云存档回写等绕过 JSON.stringify 的路径 */
  if (nativeSet) {
    try {
      window.Storage.prototype.setItem = function (k, v) {
        if (k === SAVE_KEY && typeof v === 'string') {
          try { mirrorSave(v); } catch (e) { /* ignore */ }
          try {
            var obj = nativeParse(v);
            if (isSave(obj)) {
              applySort(obj, false);
              applyOrder(obj, false);
              v = nativeStringify(obj);
            }
          } catch (e) { /* ignore */ }
        }
        return nativeSet.call(this, k, v);
      };
    } catch (e) { /* ignore */ }
  }

  // 调试 / 冒烟测试入口
  try {
    Object.defineProperty(window, '__PCG_PC_SORT__', {
      configurable: true,
      get: function () {
        return {
          saveKey: SAVE_KEY, orderKey: ORDER_KEY, sort: SORT,
          forced: sortForced, injectedAt: injectedAt,
          reads: stat.reads, writes: stat.writes,
          injected: stat.injected, kept: stat.kept, appended: stat.appended,
          pinned: stat.pinned, mirrorAt: mirrorAt
        };
      }
    });
  } catch (e) { /* ignore */ }
})();
