/* Poke'Catch 防掉线助手 —— 统一存档读取层（隔离世界 / document_start）
 *
 * 各功能（图鉴 / 培育屋 / 黑市 / 刷取 / 神兽追踪 / 联盟刷钱）都从这里取存档。
 *
 * 线上游戏把存档存在 localStorage["gachamon-save-v1"]。直接读、容错解析即可：
 * 兼容「双重 JSON」「{data:...} 包裹」「尾部多出日志/分隔符」这几种常见情况。
 * 不做任何「形状打分 / 字段白名单」——游戏改版增删字段也要照样能读，
 * 解析成功即采用，避免误判成「读不到存档」。
 *
 * 边界：全程只读，绝不写游戏域名下任何 localStorage / sessionStorage。
 * 配置、统计、日志照旧只写扩展自己的 chrome.storage。
 */
(function (root) {
  'use strict';

  if (root.PCG_SAVE) return;

  var CFG = root.PCG_CONFIG || {};
  var PRIMARY = CFG.SAVE_KEY || 'gachamon-save-v1';
  var CACHE_MS = 240;

  var S = { at: 0, obj: null, raw: '', src: '', err: '' };

  /* 一层容错 JSON 解析：裸 JSON、双重 JSON、尾部多余字符都能兜住。 */
  function jsonParse(s) {
    if (typeof s !== 'string') return null;
    var t = s.replace(/^\uFEFF/, '').replace(/^\s+|\s+$/g, '');
    if (!t) return null;
    try { return JSON.parse(t); } catch (e) { /* 继续尝试 */ }
    // 有些版本会把存档整体当字符串再序列化一次
    try {
      var once = JSON.parse(t);
      if (typeof once === 'string' && once.length > 20) return JSON.parse(once);
    } catch (e2) { /* 继续尝试 */ }
    // 尾部多出日志 / 分隔符时，截到最后一个完整括号
    var end = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if (end > 0 && end < t.length - 1) {
      try { return JSON.parse(t.slice(0, end + 1)); } catch (e3) { /* ignore */ }
    }
    return null;
  }

  /* 容忍一层 {data:...} / {save:...} / {state:...} 包裹。 */
  function unwrap(v) {
    if (!v || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v;
    var names = ['data', 'save', 'state', 'value', 'payload', 'S', 'game', 'result', 'record'];
    for (var i = 0; i < names.length; i++) {
      var c = v[names[i]];
      if (!c) continue;
      if (c && typeof c === 'object') return c;
      if (typeof c === 'string' && c.length > 20) {
        var p = jsonParse(c);
        if (p && typeof p === 'object') return p;
      }
    }
    return v;
  }

  function parse(raw) {
    var v = jsonParse(raw);
    if (!v) return null;
    if (typeof v === 'string') {
      var inner = jsonParse(v);
      return (inner && typeof inner === 'object') ? inner : null;
    }
    return unwrap(v);
  }

  /* force=true 绕过时间缓存，用于「此刻」就要最新数据的地方（收藏 / 战斗结算）。 */
  function read(force) {
    var now = Date.now();
    if (!force && S.obj && now - S.at < CACHE_MS) return S.obj;
    var raw = '';
    try { raw = root.localStorage.getItem(PRIMARY) || ''; } catch (e) { raw = ''; }
    var obj = raw ? parse(raw) : null;
    S.at = now;
    S.obj = obj;
    S.raw = obj ? raw : '';
    S.src = obj ? 'localStorage' : '';
    S.err = obj ? '' : ('localStorage 里没有 ' + PRIMARY);
    return obj;
  }

  function rawOf(force) { read(force); return S.raw; }

  function diag() {
    read();
    var o = S.obj || {};
    var mons = Array.isArray(o.mons) ? o.mons.length : 0;
    return {
      ok: !!S.obj, src: S.src, key: PRIMARY, err: S.err,
      bytes: S.raw.length, mons: mons,
      brief: S.obj
        ? '存档 OK · ' + S.src + ':' + PRIMARY + ' · ' + mons + ' 只'
        : '读不到存档 · ' + (S.err || '未知原因')
    };
  }

  root.PCG_SAVE = {
    read: read,
    raw: rawOf,
    diag: diag,
    parse: parse,
    PRIMARY: PRIMARY
  };
})(typeof window !== 'undefined' ? window : this);
