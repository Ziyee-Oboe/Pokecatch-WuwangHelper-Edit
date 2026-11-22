/* Poke'Catch 防掉线助手 —— 配队窗「排序」桥（MAIN world / document_start）
 *
 * 所有配队界面（活动队伍 / 对战塔 / 团体战 / 世界 BOSS / 糖果工厂 / 地下通道）
 * 其实是同一个弹窗 #evt-pick，网格就是一个 t.VGrid：
 *     Q = allMons().filter(...); Q.sort(X); VGrid.set(Q.map(...))
 * 这里只做一件事 —— 在 Array.prototype.sort 这一层把「这次不该显示哪些 uid」
 * 和「按当前排序应该是什么次序」套到游戏刚准备好的那个数组上；游戏随后 map → set，
 * 布局 / 拖拽 / 拖到空位全都不受影响。
 *
 * 为什么是「黑名单」而不是「白名单」：内容脚本只看得到存档里的宝可梦，
 * 万一有它不认识的 uid（活动临时队、云存档、新玩法），白名单会把人误删；
 * 黑名单只删「明确不满足筛选」的那些，认不出来的一律留着。
 *
 * 第一百零三批：这个文件以前还负责改 #evt-sort 的选项、拨「自定义」。那套是错的 ——
 * 它在 document_start 跑，那时 <body> 还不存在，于是退到 document.documentElement 上
 * 挂 childList 观察器；游戏后来往 body 里塞 #evt-pick，<html> 的子节点一个都没变，
 * 回调永远不来，下拉永远是游戏自己那四项（玩家看到的「该功能并未实现」）。
 * 现在下拉归内容脚本（它每 400ms 一拍，弹窗开着一拍就到），这里不再碰 DOM 选项。
 *
 * 顺序兜底：没有发布数据时退回仓库的老口径 —— pcOrder（内容脚本发布的
 * localStorage["pcgPcOrderV1"]，读不到就用存档里的 G.S.pcOrder），
 * 同下标再按获得时间倒序。两套都没有就不接管，游戏按自己的顺序显示，不会报错。
 */
(function () {
  'use strict';

  if (window.__PCG_EVT_SORT_BRIDGE__) return;
  window.__PCG_EVT_SORT_BRIDGE__ = true;

  var PICK_KEY = 'pcgEvtPickV1';      // 内容脚本发布：{at, key, deny:[uid]|null, order:[uid]|null}
  var ORDER_KEY = 'pcgPcOrderV1';
  var SAVE_KEY = 'gachamon-save-v1';
  var CUSTOM = 'custom';

  var stat = { sorts: 0, filters: 0, fromOrderKey: 0, fromSave: 0, missing: 0, opt: 0 };
  var nativeSort = Array.prototype.sort;
  var orderCache = { at: -1, idx: null };
  var pubCache = { at: -1, deny: null, order: null, key: '', stamp: '' };
  var optAt = 0;

  function byId(id) { return document.getElementById(id); }

  /* ---------- 仓库顺序（自定义排序的兜底） ---------- */

  function buildIdx(list) {
    var m = Object.create(null);
    for (var i = 0; i < list.length; i++) {
      var uid = list[i];
      if (uid && m[uid] === undefined) m[uid] = i;
    }
    return m;
  }

  function readSave() {
    var raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return null; }
    if (!raw) return null;
    try {
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? o : null;
    } catch (e) { return null; }
  }

  function orderIdx() {
    var raw = null;
    try { raw = localStorage.getItem(ORDER_KEY); } catch (e) { raw = null; }
    if (raw) {
      var o = null;
      try { o = JSON.parse(raw); } catch (e2) { o = null; }
      if (o && Array.isArray(o.order) && o.order.length) {
        var at = Number(o.at) || 0;
        if (at !== orderCache.at) {
          orderCache.at = at;
          orderCache.idx = buildIdx(o.order);
        }
        stat.fromOrderKey++;
        return orderCache.idx;
      }
    }
    var save = readSave();
    if (save && Array.isArray(save.pcOrder) && save.pcOrder.length) {
      var sig = save.pcOrder.length + ':' + save.pcOrder[0];
      if (sig !== orderCache.at) {
        orderCache.at = sig;
        orderCache.idx = buildIdx(save.pcOrder);
      }
      stat.fromSave++;
      return orderCache.idx;
    }
    stat.missing++;
    return null;
  }

  /* ---------- 内容脚本发布过来的「能显示谁 / 什么次序」 ---------- */

  function publish() {
    var raw = null;
    try { raw = localStorage.getItem(PICK_KEY); } catch (e) { return null; }
    if (!raw) return null;
    var o = null;
    try { o = JSON.parse(raw); } catch (e2) { return null; }
    if (!o || typeof o !== 'object') return null;
    var at = Number(o.at) || 0;
    if (at !== pubCache.at) {
      pubCache.at = at;
      pubCache.deny = Array.isArray(o.deny) ? buildIdx(o.deny) : null;
      pubCache.order = Array.isArray(o.order) ? buildIdx(o.order) : null;
      pubCache.key = o.key || '';
      pubCache.stamp = o.stamp || '';
    }
    return pubCache;
  }

  /* ---------- 判定 ---------- */

  /* 这个数组是不是「配队网格那一格一格」？
   *
   * 游戏里 allMons() 出来的数组还有两处也会 sort，都在配队弹窗活着的时候可能跑到，
   * 而它们都不该被筛选砍名单：
   *   · 热门榜 / 图鉴区找「这一种里等级最高的那只」：
   *       K.allMons().filter(m => m.id === id && s(m)).sort((a,b) => b.level - a.level)[0]
   *     —— 被砍了会显示「不在你的电脑里」；被重排了会拿到等级不对的那只。
   *     特征：整队都是同一个图鉴号。
   *   · 对战塔开局会造一批改造过的临时副本（uid 带 "t:" 前缀）再 sort。
   *     特征：uid 不是纯数字。
   * 两者都排除掉，剩下的才接管。 */
  function isMonList(arr) {
    var a = arr[0];
    if (!(a && typeof a === 'object' && a.uid != null && a.id != null && a.level != null)) return false;
    if (String(a.uid).indexOf('t:') === 0) return false;      // 对战塔的临时副本
    for (var i = 1; i < arr.length; i++) {
      var m = arr[i];
      if (!m || typeof m !== 'object' || m.uid == null) return false;
      if (m.id !== a.id) return true;                          // 出了第二种，才像配队网格
    }
    return false;                                              // 全同一物种 = 找最优的那只，别插手
  }

  function pickerOpen() {
    var back = byId('evt-pick');
    return !!(back && back.classList && back.classList.contains('open'));
  }

  function customActive() {
    var sel = byId('evt-sort');
    if (!sel || sel.value !== CUSTOM) return false;
    return pickerOpen();
  }

  /* 「一键优化」自己会挑一套克制阵容，它内部的排序不能被筛选条件砍掉名单 */
  function optimizing() {
    return (Date.now() - optAt) < 500;
  }

  function cmpByOrder(idx) {
    return function (a, b) {
      var ia = idx[a.uid];
      var ib = idx[b.uid];
      ia = ia === undefined ? -1 : ia;
      ib = ib === undefined ? -1 : ib;
      if (ia !== ib) return ia - ib;
      return (Number(b && b.caughtAt) || 0) - (Number(a && a.caughtAt) || 0);
    };
  }

  /* 按发布出来的 deny 就地删掉不该显示的，再按 order 就地重排。
     全程只动这一个数组对象本身（游戏随后 Q.map 的就是它），
     不要换成新数组，否则游戏手里的引用就断了。 */
  function dropDenied(arr, deny) {
    var k = 0;
    for (var i = 0; i < arr.length; i++) {
      if (deny[arr[i].uid] !== undefined) continue;
      arr[k++] = arr[i];
    }
    if (k !== arr.length) {
      arr.length = k;
      stat.filters++;
    }
    return arr;
  }

  function reorderBy(arr, idx) {
    var known = [], miss = [];
    for (var i = 0; i < arr.length; i++) {
      if (idx[arr[i].uid] === undefined) miss.push(arr[i]);
      else known.push(arr[i]);
    }
    nativeSort.call(known, cmpByOrder(idx));
    var out = known.concat(miss);
    for (var j = 0; j < out.length; j++) arr[j] = out[j];
    return arr;
  }

  /* ---------- 排序接管 ---------- */

  try {
    Array.prototype.sort = function (cmp) {
      // 只认配队弹窗打开着、且这一数组确实是一队宝可梦
      if (this.length > 1 && pickerOpen() && isMonList(this) && !optimizing()) {
        var pub = publish();
        if (pub && (pub.deny || pub.order)) {
          if (pub.deny) dropDenied(this, pub.deny);
          if (pub.order) {
            stat.sorts++;
            return reorderBy(this, pub.order);
          }
          return nativeSort.apply(this, arguments);
        }
        // 内容脚本还没发布：退回老的「自定义 = 仓库顺序」
        if (cmp === undefined && customActive()) {
          var idx = orderIdx();
          if (idx) {
            stat.sorts++;
            return nativeSort.call(this, cmpByOrder(idx));
          }
        }
      }
      return nativeSort.apply(this, arguments);
    };
  } catch (e) { /* 极端环境（sealed realm）下就别接管，游戏仍按自己的顺序显示 */ }

  try {
    /* 「一键优化」按钮自己那次排序要放过 */
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('#evt-opt')) { optAt = Date.now(); stat.opt++; }
    }, true);
  } catch (e) { /* ignore */ }

  // 调试 / 冒烟测试入口
  try {
    Object.defineProperty(window, '__PCG_EVT_SORT__', {
      configurable: true,
      get: function () {
        var sel = byId('evt-sort');
        var pub = pubCache;
        return {
          key: PICK_KEY, mode: CUSTOM,
          value: sel ? sel.value : null,
          opts: sel ? Array.prototype.map.call(sel.options, function (o) {
            return o.value + (o.hidden ? '(隐)' : '') + (o.disabled ? '(禁)' : '');
          }) : [],
          sorts: stat.sorts, filters: stat.filters, opt: stat.opt,
          fromOrderKey: stat.fromOrderKey, fromSave: stat.fromSave, missing: stat.missing,
          orderIdxSize: orderCache.idx ? Object.keys(orderCache.idx).length : 0,
          pubAt: pubCache.at, pubKey: pub.key || '',
          denyN: pubCache.deny ? Object.keys(pubCache.deny).length : -1,
          orderN: pubCache.order ? Object.keys(pubCache.order).length : -1
        };
      }
    });
  } catch (e) { /* ignore */ }
})();
