/* Poke'Catch 防掉线助手 —— 「同家族跳转」（第八十四批 · 图鉴卡 / 第八十六批 · 拥有卡）
 *
 * 【第八十四批】游戏图鉴详情卡里「进化」那一排，点同家族的其它形态，
 *   直接关掉现在这张图鉴卡、打开点的那一只的图鉴。
 *
 * 游戏本身没有给这排小格绑任何点击（bundle 里 Xa() 只吐
 *   <div class="evo[ cur|unknown|own]"><div class="sprbox"><img data-id="113" ...></div><span>吉利蛋</span></div>
 * 既没有 onclick 也没有 data-*），但：
 *   1. 每格的 <img> 上带着 data-id，够我们认出是哪一只；
 *   2. 图鉴页 .dex-cell[data-id] 每格都绑了 onclick = () => we(id)（打开那张详情卡），
 *      而且 493 格是一次性全渲染、靠 hidden 属性做筛选的 —— 所以关掉卡片后
 *      直接 .click() 目标格，就等于「打开那一只的图鉴」，搜索 / 状态 / 地区 /
 *      我们自己的「未捕捉」筛选都不影响（.click() 不看可见性）；
 *   3. 详情卡右上角的 .dc-x 会把弹窗 resolve 成 null，we() 里 `else return` 收尾，
 *      不会又弹回原来那一只。
 *
 * 所以这里的做法是【事件拦截 + 复用游戏自己的开关】：
 *   · 只在「详情卡里的『进化』小节」这一块拦（其余点击一律放过）；
 *   · 先确认图鉴页那一格真的在（不在就先点一次图鉴页标签，等它渲染），
 *     确认不了就什么都不做 —— 绝不把卡片关掉之后打不开新的；
 *   · 点 .dc-x 关卡片 → 等它真从 DOM 上消失 → 点目标格。
 *
 * 【第八十六批】仓库 / 队伍里点开的那张「拥有宝可梦」详情卡（.mon-card）也有
 *   一排「家族」（.fam-sec，`<h4>家族</h4>` + 同一套 .evo-chain），
 *   那一排同样是纯展示。小格上写着 `Nv.80 ×2`（这只在箱子里有几只、最高几级），
 *   但点不动。这一批把「点一下换成那一只」接上：
 *
 *   · 目标哪一只：格子上的 <img data-id> 就是图鉴号；
 *   · 存档里同图鉴号的可能有好几只——**取等级最高的那只**（用户明确要求）；
 *     异色格只找异色的、普通格只找普通的（格子里的图就是 pool 的样式）；
 *   · 换卡动作：点 .dc-x 关掉现在这张 → 等它消失 → 让页面里的小桥
 *     （keep-dup.js 抓到的游戏命名空间）调一次游戏自己的 UI.monDetail(uid)，
 *     也就是游戏自己「从仓库点开那一只」走的同一个函数。这里不读也不写任何存档；
 *   · 桥没连上（扩展刚装、游戏页还没刷新）就**先握手再关卡**：
 *     握手不过什么都不做，绝不留「卡片关了、新的没开」；
 *   · 没拥有 / 认不出 / 点的就是当前这只 → 什么都不做。
 *
 * 开关：与图鉴跳转合并成同一条（popup「页面自动化 → 图鉴 / 拥有宝可梦『同家族跳转』」）。
 * 全程只读游戏存档、只点游戏自己的节点，只调游戏自己的函数，不写游戏状态、不改存档。
 */
(function (root) {
  'use strict';

  var CFG = root.PCG_CONFIG || null;
  var DATA = root.PCG_DEX_DATA || null;

  function sel(key, fallback) {
    var v = (CFG && typeof CFG.sel === 'function') ? CFG.sel(key) : '';
    return v || fallback;
  }

  var Q = {
    modal: sel('dexCardModal', '.modal.dexcard-modal, .dexcard-modal'),
    card: sel('dexCardBox', '.dexcard'),
    head: sel('dexCardHead', '.dc-head'),
    close: sel('dexCardClose', '.dc-x'),
    sec: sel('dexCardSec', '.dc-sec'),
    evo: sel('dexEvoTile', '.evo'),
    monCard: sel('dexMonCard', '.mon-card'),
    famSec: sel('dexFamSec', '.fam-sec'),
    cell: sel('dexCellById', '.dex-cell[data-id]'),
    tab: sel('dexTab', '#tabs [data-screen="pokedex"]')
  };

  /* 「进化」小节的小标题：游戏用 e("Évolutions")，中文包是「进化」。
   * 只认标题整句，避免把「可以进化」「进化道具」那些字样当成这一节。 */
  var EVO_TITLE = /^(进化|進化|进化列表|Évolutions?|Evolutions?|Evoluciones?|Evoluzion[ei]|진화)$/i;
  /* 「家族」小节的标题：中文包「家族」，法文「Famille」。这一节后面永远跟着
   * 一个 ⓘ 说明（里面还带着「Famille / 家族」这个词）和「✓ 3 / 3」，所以只认开头。 */
  var FAM_TITLE = /^(家族|族群|Famille|Family|Familia|Famiglia|가족)/i;
  /* 卡头第几号：中文包 "No.{n}"，法文 "N° {n}"，两种都吃 */
  var NUM_RE = /(?:No\.?|N°|Nº)\s*0*(\d{1,3})/i;
  /* 精灵图文件名里的图鉴号：assets/pokemon/25.png、assets/pokemon/art/shiny/still/25.png */
  var SPR_RE = /(\d+)[\w-]*\.(?:png|gif|webp|jpe?g|avif)/g;

  var CSS_ID = 'pcg-dex-jump-css';
  var CSS = '.dc-sec ' + '.evo.pcg-ju{cursor:pointer}' +
    '.dc-sec .evo.pcg-ju:hover{outline:2px solid rgba(240,170,30,.9);outline-offset:2px;border-radius:14px}' +
    '.dc-sec .evo.pcg-ju:active{transform:scale(.97)}';

  var S = {
    on: true,
    jumps: 0,       // 成功跳转次数（图鉴卡）
    last: '',       // 上一次跳到哪一只（No.113 吉利蛋）
    mons: 0,        // 成功换卡次数（拥有卡 → 另一只的详情）
    lastMon: '',    // 上一次换成哪一只（吉利蛋 · Lv.80）
    note: '',       // 最近一次提示 / 为什么没跳
    hover: null     // 当前加了 .pcg-ju 的那一格
  };

  var NAME2ID = null;

  function q(s, r) {
    try { return (r || document).querySelector(s); } catch (e) { return null; }
  }
  function qa(s, r) {
    try { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    catch (e) { return []; }
  }
  function text(el) {
    return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }
  function num(v) { var n = parseInt(v, 10); return isFinite(n) ? n : 0; }
  function sleep(ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  }
  function alive(el) {
    try { return !!(el && el.isConnected && el.getClientRects && el.getClientRects().length); }
    catch (e) { return false; }
  }

  function monName(id) {
    try {
      if (DATA && typeof DATA.name === 'function') return DATA.name(id) || '';
    } catch (e) { /* 形态号（47901 这种）没有中文名 */ }
    return '';
  }

  /* 名字 → 图鉴号：只在精灵图认不出时兜底（??? 的格子没有名字，用不上） */
  function nameMap() {
    if (NAME2ID) return NAME2ID;
    var map = {};
    try {
      var mons = (DATA && DATA.mons) || {};
      var maxId = 649;
      try { var mk = Object.keys((DATA && DATA.mons) || {}); for (var q = 0; q < mk.length; q++) { var qn = Number(mk[q]); if (qn > maxId && qn < 100000) maxId = qn; } } catch (e2) { /* ignore */ }
      for (var id = 1; id <= maxId; id++) {
        if (!mons[id]) continue;
        var n = monName(id);
        if (n) map[n] = id;
      }
    } catch (e) { /* ignore */ }
    NAME2ID = map;
    return map;
  }

  function idFromSrc(src) {
    var s = String(src || '');
    if (!s || s.indexOf('data:') === 0) return 0;
    var m = null, x, re = new RegExp(SPR_RE.source, 'g');
    while ((x = re.exec(s))) m = x;
    return m ? num(m[1]) : 0;
  }

  function attr(el, name) {
    try { return el && el.getAttribute ? (el.getAttribute(name) || '') : ''; } catch (e) { return ''; }
  }
  /* 图鉴号上限留够：493 只是本体，47901 这种是「形态号」（洛托姆 5 形态） */
  function okId(n) { return n > 0 && n < 100000; }

  /* 一格 <div class="evo"> 是哪一只：data-id → img 地址 → canvas 标记 → 名字反查 */
  function tileId(tile) {
    if (!tile || !tile.querySelector) return 0;
    var n = num(attr(tile.querySelector('[data-id]'), 'data-id'));
    if (okId(n)) return n;
    n = num(attr(tile.querySelector('[data-dex]'), 'data-dex'));
    if (okId(n)) return n;
    var img = tile.querySelector('img');
    if (img) {
      n = num(attr(img, 'data-pcg-id')) || num(attr(img, 'data-id')) ||
        idFromSrc(attr(img, 'src') || attr(img, 'data-src'));
      if (okId(n)) return n;
    }
    var cv = tile.querySelector('canvas');
    if (cv && cv.__pcgId) return num(cv.__pcgId);
    var nm = text(tile.querySelector('span') || tile);
    if (nm && nm.indexOf('?') < 0) return num(nameMap()[nm]);
    return 0;
  }

  /* 这一格是不是异色的 pool：游戏把异色精灵图放在 assets/pokemon/shiny/ 下，
   * page-hook 也会在 img 上打 data-pcg-shiny。认不出就返回 null（两种都接受）。 */
  function tileShiny(tile) {
    if (!tile || !tile.querySelector) return null;
    var img = tile.querySelector('img');
    if (!img) return null;
    if (attr(img, 'data-pcg-shiny') === '1') return true;
    var s = attr(img, 'src') || attr(img, 'data-src');
    if (!s) return null;
    if (s.indexOf('data:') === 0) return null;
    return /\/shiny\//.test(s) || /[?&]shiny=1/.test(s);
  }

  /* 现在这张卡讲的是哪一只：先看被标了 .cur 的格子，再看卡头 "No.440" */
  function currentId(modal) {
    var n = tileId(modal.querySelector('.evo.cur'));
    if (n) return n;
    var m = text(modal.querySelector(Q.head)).match(NUM_RE);
    return m ? num(m[1]) : 0;
  }

  /* 卡片里的「进化」小节（找不到就不是图鉴详情卡） */
  function evoSection(modal) {
    var secs = qa(Q.sec, modal);
    for (var i = 0; i < secs.length; i++) {
      var h = secs[i].querySelector('h4') || secs[i].querySelector('h3');
      if (h && EVO_TITLE.test(text(h))) return secs[i];
    }
    return null;
  }

  /* 拥有卡里的「家族」小节：优先认 .fam-sec，认不到再看标题开局是不是「家族 / Famille」 */
  function famSection(modal) {
    if (!modal || !modal.querySelector) return null;
    var box = modal.querySelector(Q.famSec);
    if (box) return box;
    var secs = qa(Q.sec, modal);
    for (var i = 0; i < secs.length; i++) {
      var h = secs[i].querySelector('h4') || secs[i].querySelector('h3');
      if (h && FAM_TITLE.test(text(h))) return secs[i];
    }
    return null;
  }

  /* 眼下真正显示着的图鉴详情卡（关掉的节点可能还挂在 DOM 上） */
  function dexCard() {
    var all = qa(Q.modal);
    var best = null;
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!alive(el)) continue;
      if (!el.querySelector(Q.card)) continue;
      if (!evoSection(el)) continue;
      best = el;
    }
    return best;
  }

  /* 眼下真正显示着的「拥有宝可梦」详情卡（.mon-card + 家族小节） */
  function monCard() {
    var all = qa(Q.modal);
    var best = null;
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!alive(el)) continue;
      if (!el.querySelector(Q.monCard)) continue;
      if (!famSection(el)) continue;
      best = el;
    }
    return best;
  }

  function cellsReady() { return !!q(Q.cell); }
  function findCell(id) {
    if (!id) return null;
    return q('.dex-cell[data-id="' + id + '"]');
  }

  function note(msg, level) {
    S.note = String(msg || '');
    try {
      var L = root.PCG_LOG;
      if (L && typeof L.push === 'function') L.push(level || 'info', 'dex', S.note);
    } catch (e) { /* 日志模块没加载就算了 */ }
    try { if (root.console && root.console.log) root.console.log('[同家族跳转]', S.note); } catch (e) { /* ignore */ }
  }

  /* 图鉴页没渲染过（.dex-cell 一格都没有）就先点一次图鉴页标签，等它渲染。
   * 详情卡是从地图「此处出没」打开的也会走到这里。 */
  async function ensureCells() {
    if (cellsReady()) return true;
    var tab = q(Q.tab);
    if (!tab) return false;
    try { tab.click(); } catch (e) { /* ignore */ }
    for (var i = 0; i < 14; i++) {
      await sleep(100);
      if (cellsReady()) return true;
    }
    return false;
  }

  function gone(modal, ms) {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function tick() {
        if (!alive(modal)) return res(true);
        if (Date.now() - t0 > ms) return res(false);
        setTimeout(tick, 50);
      })();
    });
  }

  async function jump(id, modal) {
    if (!id) return false;
    var ok = await ensureCells();
    if (!ok) {
      note('图鉴页还没打开，跳不过去（先在左侧点一次「图鉴」，再点这一排）', 'warn');
      return false;
    }
    var cell = findCell(id);
    if (!cell) {
      note('图鉴页里没找到 No.' + id + ' 那一格，先翻一下图鉴页再点', 'warn');
      return false;
    }
    var x = modal.querySelector(Q.close);
    if (!x) {
      note('这张图鉴卡上没有关闭按钮，先手动关掉再点', 'warn');
      return false;
    }
    try { x.click(); } catch (e) { /* ignore */ }
    await gone(modal, 1500);
    var again = findCell(id) || cell;
    try { again.click(); } catch (e) {
      note('点不开 No.' + id + ' 的图鉴格', 'warn');
      return false;
    }
    S.jumps++;
    S.last = 'No.' + id + (monName(id) ? ' ' + monName(id) : '');
    note('已跳到 ' + S.last + ' 的图鉴');
    return true;
  }

  /* ---------------- 第八十六批：拥有卡「家族」那排 → 换成那一只的详情 ---------------- */

  /* 这一格能不能点：只有「有」的那几只（.own）和当前这只（.cur）算；
   * 空位（.free）和没抓到的（.unknown）不给点。 */
  function monTileUsable(tile) {
    var cls = ' ' + String((tile && tile.className) || '') + ' ';
    return cls.indexOf(' own ') >= 0 || cls.indexOf(' cur ') >= 0;
  }

  /* 存档里同图鉴号的可能有好几只：取等级最高的那只。
   * shiny 传 true / false 时就只在那一种里挑（异色格 ↔ 异色，普通格 ↔ 普通）。 */
  function ownedPick(id, shiny) {
    if (!okId(id)) return null;
    var SAVE = root.PCG_SAVE || null;
    var save = null;
    try { save = (SAVE && typeof SAVE.read === 'function') ? SAVE.read(true) : null; } catch (e) { save = null; }
    if (!save || !save.mons || !save.mons.length) return null;
    var best = null;
    for (var i = 0; i < save.mons.length; i++) {
      var m = save.mons[i];
      if (!m || num(m.id) !== id || !m.uid) continue;
      if (shiny != null && !!m.shiny !== shiny) continue;
      var lv = Number(m.level);
      if (!isFinite(lv)) lv = 0;
      if (!best || lv > best.lv) best = { uid: String(m.uid), lv: lv, shiny: !!m.shiny };
    }
    return best;
  }

  /* 内容脚本 → 页面（MAIN world）的指令通道：keep-dup.js 那边会回 pcg-monopen-result */
  function dispatchCmd(cmd) {
    try { document.dispatchEvent(new CustomEvent('pcg-cmd', { detail: String(cmd) })); } catch (e) { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent('pcg-cmd', { detail: String(cmd) })); } catch (e) { /* ignore */ }
  }

  var BRIDGE = { state: 0, at: 0 };   // 0 还没问过 / 1 通 / -1 不通

  /* 先挂监听、再发指令、等回执（桥是同步回的，顺序反了就会漏掉回执） */
  function waitBridge(kind, send, ms) {
    return new Promise(function (res) {
      var done = false;
      function on(ev) {
        var msg = null;
        try { msg = JSON.parse(String((ev && ev.detail) || '')); } catch (e) { msg = null; }
        if (!msg || msg.kind !== kind || done) return;
        done = true;
        off();
        res(msg);
      }
      function off() {
        try { document.removeEventListener('pcg-monopen-result', on); } catch (e) { /* ignore */ }
        try { window.removeEventListener('pcg-monopen-result', on); } catch (e) { /* ignore */ }
      }
      try {
        document.addEventListener('pcg-monopen-result', on);
        window.addEventListener('pcg-monopen-result', on);
      } catch (e) { /* ignore */ }
      try { send(); } catch (e2) { /* ignore */ }
      setTimeout(function () {
        if (done) return;
        done = true;
        off();
        res({ ok: false, kind: kind, text: '游戏没回话' });
      }, ms);
    });
  }

  /* 关卡片之前先握手：桥不通就什么都不做，绝不留「卡片关了、新的没开」 */
  async function ensureBridge() {
    if (BRIDGE.state === 1) return true;
    if (BRIDGE.state === -1 && Date.now() - BRIDGE.at < 30000) return false;
    var r = await waitBridge('ready', function () { dispatchCmd('monready:'); }, 500);
    BRIDGE.state = (r && r.ok) ? 1 : -1;
    BRIDGE.at = Date.now();
    return BRIDGE.state === 1;
  }

  /* 让页面调一次游戏自己的 UI.monDetail(uid)（= 从仓库点开那一只） */
  async function openMon(uid) {
    var r = await waitBridge('monopen', function () { dispatchCmd('monopen:' + uid); }, 1500);
    if (r && r.ok) BRIDGE.state = 1;
    return r;
  }

  async function monJump(tile, modal) {
    var id = tileId(tile);
    if (!id) return false;                       // 认不出是哪一只，交回给游戏（本来也没绑东西）
    var cur = currentId(modal);
    if (cur && id === cur) return false;          // 点的是现在这只，什么也不做
    var pick = ownedPick(id, tileShiny(tile));
    if (!pick) {
      note('这一只还没拥有，先抓一只再来换卡', 'warn');
      return false;
    }
    var okBridge = await ensureBridge();
    if (!okBridge) {
      note('没连上游戏内部接口，换不了详情卡（刷新一次游戏页再点）', 'warn');
      return false;
    }
    var x = modal.querySelector(Q.close);
    if (!x) {
      note('这张卡上没有关闭按钮，先手动关掉再点', 'warn');
      return false;
    }
    try { x.click(); } catch (e) { /* ignore */ }
    await gone(modal, 1500);
    var r = await openMon(pick.uid);
    if (!r || !r.ok) {
      note('换卡失败：' + ((r && r.text) || '游戏没回话'), 'warn');
      return false;
    }
    S.mons++;
    S.lastMon = (monName(id) || ('No.' + id)) + ' · Lv.' + pick.lv;
    note('已换成 ' + S.lastMon + ' 的详情');
    return true;
  }

  /* 这一下点击是不是落在「拥有卡的家族那一排」上 */
  function inFamSection(tile, modal) {
    if (!modal.querySelector(Q.monCard)) return null;
    var sec = famSection(modal);
    if (!sec || !sec.contains(tile)) return null;
    return sec;
  }

  /* ---------------- 事件拦截 ---------------- */
  var busy = false;

  function onClick(ev) {
    if (!S.on || busy) return;
    var t = ev.target;
    var tile = (t && t.closest) ? t.closest(Q.evo) : null;
    if (!tile) return;
    var modal = tile.closest(Q.modal);
    if (!modal) return;
    var fam = inFamSection(tile, modal);
    if (fam) {
      if (!monTileUsable(tile)) return;        // 空位 / 没抓到的格子：什么都不做
      if (ev.preventDefault) ev.preventDefault();
      if (ev.stopPropagation) ev.stopPropagation();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      busy = true;
      monJump(tile, modal).then(function () {
        busy = false;
      }, function (e) {
        busy = false;
        note('换卡失败：' + String((e && e.message) || e), 'warn');
      });
      return;
    }
    var sec = evoSection(modal);
    if (!sec || !sec.contains(tile)) return;
    var id = tileId(tile);
    if (!id) return;                       // 认不出来就交给游戏（本来也没绑东西）
    var cur = currentId(modal);
    if (cur && id === cur) return;          // 点的就是现在这只，什么也不做
    if (ev.preventDefault) ev.preventDefault();
    if (ev.stopPropagation) ev.stopPropagation();
    if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    busy = true;
    jump(id, modal).then(function () {
      busy = false;
    }, function (e) {
      busy = false;
      note('跳转失败：' + String((e && e.message) || e), 'warn');
    });
  }

  /* 悬停的那一格给指针 + 金边（点不动的格子不给，一眼看出哪几格能点） */
  function onOver(ev) {
    if (!S.on) return;
    var t = ev.target;
    var tile = (t && t.closest) ? t.closest(Q.evo) : null;
    if (S.hover && S.hover !== tile) {
      try { S.hover.classList.remove('pcg-ju'); } catch (e) { /* ignore */ }
    }
    if (!tile) { S.hover = null; return; }
    var modal = tile.closest(Q.modal);
    var okHere = false;
    if (modal) {
      var fam = inFamSection(tile, modal);
      if (fam) {
        okHere = monTileUsable(tile);
        var curM = currentId(modal), idM = tileId(tile);
        if (!idM || (curM && idM === curM)) okHere = false;
      } else {
        var sec = evoSection(modal);
        if (sec && sec.contains(tile)) {
          var id = tileId(tile), cur = currentId(modal);
          okHere = !!id && !(cur && id === cur);
        }
      }
    }
    if (!okHere) {
      try { tile.classList.remove('pcg-ju'); } catch (e) { /* ignore */ }
      S.hover = null;
      return;
    }
    try { tile.classList.add('pcg-ju'); } catch (e) { /* ignore */ }
    S.hover = tile;
  }

  function css() {
    if (q('#' + CSS_ID)) return;
    try {
      var st = document.createElement('style');
      st.id = CSS_ID;
      st.textContent = CSS;
      (document.head || document.documentElement || document.body).appendChild(st);
    } catch (e) { /* ignore */ }
  }

  function bind() {
    css();
    document.addEventListener('click', onClick, true);
    document.addEventListener('mouseover', onOver, true);
    /* 卡片是游戏按需插进来的：每次 DOM 变化顺手补一次样式（便宜，只是查一下 style 在不在） */
    try {
      var mo = new MutationObserver(function () {
        if (S.on && !q('#' + CSS_ID)) css();
      });
      mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
    } catch (e) { /* 老浏览器没有 MutationObserver 也不影响拦截 */ }
  }

  function setOn(on) {
    S.on = !!on;
    if (!S.on && S.hover) {
      try { S.hover.classList.remove('pcg-ju'); } catch (e) { /* ignore */ }
      S.hover = null;
    }
    return S.on;
  }

  function state() {
    return {
      on: S.on,
      jumps: S.jumps,
      last: S.last,
      mons: S.mons,
      lastMon: S.lastMon,
      note: S.note,
      cards: dexCard() ? 1 : 0,
      mon: monCard() ? 1 : 0,
      cells: qa(Q.cell).length,
      bridge: BRIDGE.state
    };
  }

  function config(cfg) {
    cfg = cfg || {};
    if (cfg.on != null) setOn(cfg.on);
    return state();
  }

  try { bind(); } catch (e) { /* ignore */ }

  root.PCG_DEX_JUMP = {
    state: state,
    config: config,
    set: setOn,
    jump: jump,
    monJump: monJump,
    /* 给测试用的纯函数 */
    _tileId: tileId,
    _curId: currentId,
    _evoSection: evoSection,
    _famSection: famSection,
    _idFromSrc: idFromSrc,
    _nameMap: nameMap,
    _card: dexCard,
    _monCard: monCard,
    _findCell: findCell,
    _tileShiny: tileShiny,
    _tileUsable: monTileUsable,
    _ownedPick: ownedPick
  };
})(typeof window !== 'undefined' ? window : this);
