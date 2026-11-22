/* Poke'Catch 助手 v1.20.0 —— 晶洞 / 探险 / 化石闪光预测。
 * 本计算模块只读；显式启用的召回由独立 MAIN bridge 调游戏原接口。
 * 固定随机数与宝石池顺序对齐 app.c0081498f2.js。
 * 数据表随版本固定；游戏换版会标为「待复核」，不宣称预测已验证。
 */
(function (root) {
  'use strict';
  var DATA = root.PCG_UNDER_DATA;
  if (!DATA) return;
  var K = DATA.underground, SPECIES = {};
  DATA.species.forEach(function (m) { SPECIES[m.id] = m; });
  var TYPES = {normal:'一般',fire:'火',water:'水',electric:'电',grass:'草',ice:'冰',
    fighting:'格斗',poison:'毒',ground:'地面',flying:'飞行',psychic:'超能力',
    bug:'虫',rock:'岩石',ghost:'幽灵',dragon:'龙',dark:'恶',steel:'钢',fairy:'妖精'};
  var TIERS = ['普通', '较少见', '稀有', '传说'];
  function arr(a) { return Array.isArray(a) ? a : []; }
  function number(n, fallback) { return typeof n === 'number' && isFinite(n) ? n : fallback; }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o || {}, k); }
  /* v1.34：与地下召回桥 UNDER_MAIN.slotId 保持同一套规则，避免 UI 用 forecast 的 id
   * 去 live.runs 里 find 时因 0 / 空串回退差异而「检测不到槽位」。 */
  function slotId(slot) {
    if(!slot) return '';
    var id=slot.id;
    if(id===null || id===undefined || id==='') id=slot.start;
    return String(id);
  }
  function ownedMons(s) {
    return arr(s.mons).concat(arr(s.pension && s.pension.mons).map(function (m) { return m && m.mon; }),
      arr(s.under && s.under.slots).reduce(function (all, slot) { return all.concat(arr(slot && slot.mons)); }, []))
      .filter(Boolean);
  }
  function regionOpen(s, r) { return r.open || arr(s.travel && s.travel.to).indexOf(r.key) >= 0; }
  function regionUnlocked(s, r) {
    return r && regionOpen(s, r) && number(s.adv && s.adv.unlocked, 0) >= r.first;
  }
  function regionDone(s, r) {
    return r.doneAfter != null && (number(s.adv && s.adv.unlocked, 0) > r.doneAfter ||
      !!r.championBadge && arr(s.adv && s.adv.badges).indexOf(r.championBadge) >= 0);
  }
  function gemKinds(s) {
    var regions = DATA.regions.filter(function (r) { return regionDone(s, r); });
    if (!regions.length) regions = DATA.regions.filter(function (r) { return regionUnlocked(s, r); });
    var ids = [], seen = {}, pools = [[], [], [], []];
    regions.forEach(function (r) {
      var idsInRegion=r.ids || Array.from({length:r.dex[1]-r.dex[0]+1},function(_,i){return r.dex[0]+i;});
      idsInRegion.forEach(function(id){if (SPECIES[id] && !seen[id]) {
        seen[id] = true; ids.push(id);
      }});
    });
    // Array order is significant: preserve the game's regional Pokédex iteration.
    ids.forEach(function (id) { var m = SPECIES[id]; if (m.tier >= 0 && m.tier <= 3) pools[m.tier].push(id); });
    ownedMons(s).forEach(function (m) {
      if (DATA.plateForms.indexOf(m.id) >= 0 && !seen[m.id]) { seen[m.id] = true; pools[3].push(m.id); }
    });
    return pools.map(function (pool) {
      var keys = [], have = {};
      pool.forEach(function (id) {
        var m = SPECIES[id];
        m.types.forEach(function (type) {
          var key = type + ':' + Math.max(0, Math.min(3, m.tier));
          if (!have[key]) { have[key] = true; keys.push(key); }
        });
      });
      return keys;
    });
  }
  function hash(text) {
    var i = 1779033703 ^ (24348 << 16 | 41597);
    var k = 3144134277 ^ (15337 << 16 | 49222);
    for (var p = 0; p < text.length; p++) {
      var ch = text.charCodeAt(p);
      i = Math.imul(i ^ ch, 2654435761); k = Math.imul(k ^ ch, 1597334677);
    }
    i = Math.imul(i ^ i >>> 16, 2246822507) ^ Math.imul(k ^ k >>> 13, 3266489909);
    k = Math.imul(k ^ k >>> 16, 2246822507) ^ Math.imul(i ^ i >>> 13, 3266489909);
    return (4294967296 * (2097151 & k) + (i >>> 0)) / 9007199254740992;
  }
  function fixedRoll(s, context, index, sub) {
    var trainer = s.trainer || {};
    return hash(String(trainer.since == null ? '' : trainer.since) + ':' +
      String(trainer.id == null ? '' : trainer.id) + '|' + context + '|' + index + '|' + (sub || 0));
  }
  function accountKey(s) {
    var t = s && s.trainer;
    return t && t.since != null && t.id != null ? String(hash(String(t.since)+':'+String(t.id))) : '';
  }
  function fossilRate(s, reg, rates) {
    if (rates && typeof rates[reg] === 'number' && rates[reg] >= 0 && rates[reg] <= 1) return rates[reg];
    reg = reg === 'kanto2' ? 'johto' : reg;
    var region = DATA.regions.find(function (r) { return r.key === reg; }) || DATA.regions[0];
    var complete = true;
    var regionIds=region.ids || Array.from({length:region.dex[1]-region.dex[0]+1},function(_,i){return region.dex[0]+i;});
    for (var i=0;i<regionIds.length;i++) if (!(s.dex || {})[regionIds[i]]) { complete = false; break; }
    return (complete ? 2 : 1) / 2048; // v1.29: 官方基础闪率 1/2048（旧 1/4096 已过时）；完成图鉴 ×2 = 1/1024
  }
  var FOSSIL_CACHE = new Map();
  function fossilForecast(s, slot, checked, rates) {
    if (!accountKey(s)) return {ready:false, why:'未读到训练师标识', items:[], hits:[]};
    var items = [];
    checked.loot.forEach(function (drops, floorIndex) { drops.forEach(function (e) {
      if (e.k === 'fossil') items.push({index:items.length, id:e.id, lv:e.lv, reg:e.reg,
        dropFloor:floorIndex+1, rate:fossilRate(s,e.reg,rates)});
    }); });
    var context = 'fossil:' + (slot.id == null ? slot.start : slot.id);
    var key = JSON.stringify([accountKey(s),context,checked.floors,items]);
    if (FOSSIL_CACHE.has(key)) return FOSSIL_CACHE.get(key);
    var hits = [], byFloor = {};
    items = items.map(function (f) {
      var result = Object.assign({},f,{shinyFloors:[]});
      for (var floor = f.dropFloor; floor <= checked.floors; floor++) {
        if (fixedRoll(s,context,floor,f.index) < f.rate) {
          result.shinyFloors.push(floor);
          if (!byFloor[floor]) { byFloor[floor] = {floor:floor, fossils:[]}; hits.push(byFloor[floor]); }
          byFloor[floor].fossils.push(f.index);
        }
      }
      return result;
    });
    hits.sort(function (a,b) { return a.floor-b.floor; });
    var out = {ready:true, items:items, hits:hits};
    if (FOSSIL_CACHE.size >= 16) FOSSIL_CACHE.delete(FOSSIL_CACHE.keys().next().value);
    FOSSIL_CACHE.set(key,out);
    return out;
  }
  function fossilSignature(s, slot, floor, rates) {
    var checked = sanitizeRun(s,slot), fossils = fossilForecast(s,slot,checked,rates);
    return JSON.stringify([accountKey(s),slot.id,slot.start,slot.bay,floor,
      fossils.items.filter(function (f) { return f.dropFloor <= floor; }).map(function (f) {
        return [f.index,f.id,f.lv,f.reg,f.dropFloor,f.rate,f.shinyFloors.indexOf(floor)>=0];
      })]);
  }
  function gemName(key) {
    var parts = String(key).split(':');
    return (TIERS[+parts[1]] || '') + '·' + (TYPES[parts[0]] || parts[0]) + '宝石';
  }
  function predictOne(s, tier, index, pools) {
    var to = tier;
    while (to < 3 && fixedRoll(s, 'geode' + tier, index, to) < K.GEODE_UP[to]) to++;
    var poolTier = to;
    while (poolTier > 0 && !pools[poolTier].length) poolTier--;
    if (!pools[poolTier].length) return null; // Game does not consume or advance the counter.
    var key = pools[poolTier][Math.floor(fixedRoll(s, 'geode' + tier, index, 9) * pools[poolTier].length)];
    return {index: index, from: tier, to: to, poolTier: poolTier, key: key, name: gemName(key),
      isNew: !((s.under && s.under.gems || {})[key])};
  }
  function predictGeodes(s, horizon) {
    var trainer = s.trainer;
    if (!trainer || trainer.id == null || trainer.since == null) return {ready:false, why:'尚未读到训练师标识'};
    horizon = Math.max(1, Math.min(200, Math.floor(number(horizon, 48))));
    var pools = gemKinds(s), under = s.under || {}, results = [];
    for (var tier = 0; tier < 4; tier++) {
      var opened = under.opened && under.opened[tier];
      if (opened == null) opened = 0;
      var inventory = number(under.geodes && under.geodes[tier], 0);
      if (!Number.isSafeInteger(opened) || opened < 0 || !Number.isSafeInteger(opened + horizon)) {
        results.push({tier:tier, inventory:inventory, ready:false, why:'开启计数异常，未进行预测', rows:[]}); continue;
      }
      var rows = [], simulatedGems = Object.assign({}, under.gems || {}), nextUpgrade = null;
      for (var offset = 0; offset < horizon; offset++) {
        var row = predictOne(s, tier, opened + offset, pools);
        if (!row) break;
        row.offset = offset + 1; row.inStock = offset < inventory;
        row.isNew = !simulatedGems[row.key]; simulatedGems[row.key] = (simulatedGems[row.key] || 0) + 1;
        if (row.to > tier && nextUpgrade == null) nextUpgrade = row.offset;
        rows.push(row);
      }
      results.push({tier:tier, opened:opened, inventory:inventory, ready:!!rows.length,
        why:rows.length ? '' : '当前可用宝石池为空，游戏也不会消耗晶洞', rows:rows, nextUpgrade:nextUpgrade});
    }
    return {ready:true, horizon:horizon, pools:pools, tiers:results,
      poolSignature:JSON.stringify(pools), source:DATA.source};
  }
  function band(floor) {
    var n = 0; K.LOOT.BANDS.forEach(function (f, i) { if (floor >= f) n = i; }); return n;
  }
  function itemAllowed(s, id) {
    if (!id) return false;
    if (/-stone$/.test(id) && !/^(fire|water|thunder|leaf|moon)-/.test(id)) {
      return regionUnlocked(s, DATA.regions.find(function (r) { return r.key === (id === 'sun-stone' ? 'johto' : 'sinnoh'); }));
    }
    var targets = (DATA.evolutionItems || {})[id];
    return !targets || !targets.length || targets.some(function (key) {
      return regionUnlocked(s, DATA.regions.find(function (r) { return r.key === key; }));
    });
  }
  // Match collection's structural and per-floor drop limits. Plate availability is
  // explicitly provisional: the live World Boss state may change before collection.
  function sanitizeRun(s, slot) {
    var res = slot.res || {}, from = Math.max(1, Math.floor(number(slot.from, 1))), times = arr(res.at);
    var floors = Math.max(0, Math.min(Math.floor(number(res.floors, 0)), K.FLOORS, times.length));
    var minStep = Math.floor(K.FLOOR_EXTRA + K.WALL_MS * Math.min.apply(Math, K.WALL_SLOW) / K.STEP_MS);
    for (var f = from; f <= floors; f++) {
      if (!(times[f-1] - (f > from ? times[f-2] : 0) >= minStep)) { floors = f-1; break; }
    }
    var items = {};
    K.LOOT.ITEMS.filter(function (r) { return r.kind === 'item'; }).forEach(function (r) {
      (r.of || [r.id]).forEach(function (id) { if (itemAllowed(s, id)) items[id] = true; });
    });
    var fossils = [];
    Object.keys(K.LOOT.FOSSILS).forEach(function (key) {
      if (!regionUnlocked(s, DATA.regions.find(function (r) { return r.key === key; }))) return;
      K.LOOT.FOSSILS[key].forEach(function (m) {
        if((K.LOOT.FOSSIL_AFTER || []).indexOf(key)>=0){
          var known=DATA.species.some(function(mon){
            if(!(s.dex || {})[mon.id])return false;
            var id=mon.baseForm || mon.id,seen={};
            while(SPECIES[id] && !seen[id]){if(id===m[0])return true;seen[id]=true;id=SPECIES[id].from;}
            return false;
          });
          if(!known)return;
        }
        fossils.push(m[0] + ':' + m[1] + ':' + key);
      });
    });
    var removed = 0;
    var loot = arr(res.loot).slice(0, floors).map(function (entries, i) {
      var floor = i+1, b = band(floor), guardFloor = K.GUARD_EVERY && floor % K.GUARD_EVERY === 0;
      if (floor < from || !Array.isArray(entries)) return [];
      var normalBase = false, guardBase = false, normalRolls = 0, guardRolls = 0;
      return entries.filter(function (e) {
        if (!e || typeof e !== 'object') { removed++; return false; }
        var guard = !!e.guard;
        if (guard && !guardFloor) { removed++; return false; }
        if (!guard && !normalBase && e.k === 'money' && e.n === K.LOOT.FIGHT[b]) { normalBase = true; return true; }
        if (guard && !guardBase && e.k === 'shards' && e.n === K.LOOT.GUARD_SHARDS[b]) { guardBase = true; return true; }
        if (guard ? guardRolls >= K.LOOT.GUARD_ROLLS : normalRolls >= K.LOOT.WALL_ROLLS) { removed++; return false; }
        var mult = guard ? K.LOOT.GUARD_MULT : 1;
        var ok = e.k === 'money' ? e.n === K.LOOT.MONEY[b]*mult :
          e.k === 'shards' ? e.n === K.LOOT.SHARDS[b]*mult :
          e.k === 'item' ? !!items[e.id] :
          e.k === 'geode' ? Number.isInteger(e.t) && e.t >= 0 && e.t <= 3 :
          e.k === 'plate' ? own(K.LOOT.PLATES, e.type) && Number.isInteger(e.t) && e.t >= 0 && e.t <= 3 :
          e.k === 'fossil' && fossils.indexOf(e.id+':'+e.lv+':'+e.reg) >= 0;
        if (ok) { if (guard) guardRolls++; else normalRolls++; } else removed++;
        return ok;
      }).map(function (e) { return Object.assign({}, e); });
    });
    return {floors:floors, loot:loot, removed:removed, from:from};
  }
  function aggregate(s, loot, through) {
    var sum = {money:0, shards:0, items:{}, geodes:[0,0,0,0], plates:[], fossils:[], converted:0};
    var plates = Object.assign({}, s.under && s.under.plates || {}), owned = ownedMons(s);
    arr(loot).slice(0, through).forEach(function (entries) { arr(entries).forEach(function (e) {
      if (e.k === 'money') sum.money += e.n;
      else if (e.k === 'shards') sum.shards += e.n;
      else if (e.k === 'item') sum.items[e.id] = (sum.items[e.id] || 0)+1;
      else if (e.k === 'geode') sum.geodes[e.t]++;
      else if (e.k === 'fossil') sum.fossils.push({id:e.id, lv:e.lv, reg:e.reg});
      else if (e.k === 'plate') {
        var ownsForm = owned.some(function (m) {
          return DATA.plateForms.indexOf(m.id) >= 0 && SPECIES[m.id].types[0] === e.type;
        });
        if (plates[e.type] || ownsForm) { sum.geodes[e.t]++; sum.converted++; }
        else { plates[e.type] = 1; sum.plates.push(e.type); }
      }
    }); });
    return sum;
  }
  function expedition(s, slot, now, rates) {
    if (!slot || typeof slot !== 'object' || !slot.res || !Array.isArray(slot.res.at) ||
        !Array.isArray(slot.res.loot) || !isFinite(slot.start) || !isFinite(slot.end)) {
      return {id:slotId(slot), bay:number(slot && slot.bay, 0), ready:false, why:'本次探险记录不完整，无法预览'};
    }
    var checked = sanitizeRun(s, slot), res = slot.res, at = slot.recalled == null ? now : slot.recalled;
    var elapsed = (at-slot.start)/K.STEP_MS, current = 0;
    for (; current < res.at.length && res.at[current] <= elapsed; current++) { /* exact progress rule */ }
    var done = at >= slot.end || slot.recalled != null;
    if (done && slot.recalled == null) current = res.floors;
    current = Math.max(0, Math.min(current, checked.floors));
    var rows = [];
    for (var i = checked.from-1; i < checked.floors; i++) rows.push({
      floor:i+1, at:slot.start + res.at[i]*K.STEP_MS,
      loot:checked.loot[i] || [], foe:res.foes && res.foes[i], guard:res.gfoes && res.gfoes[i+1] || null
    });
    var milestones = K.MILESTONES.filter(function (m) {
      return current >= m.floor && !(s.under && s.under.miles || {})[m.floor];
    });
    var finalMilestones = K.MILESTONES.filter(function (m) {
      return checked.floors >= m.floor && !(s.under && s.under.miles || {})[m.floor];
    });
    var team = arr(slot.mons).map(function (m) {
      return {id:m.id, uid:m.uid, shiny:!!m.shiny,
        xp:current && res.xp && res.xp[m.uid] ? res.xp[m.uid][current-1] || 0 : 0,
        finalXp:checked.floors && res.xp && res.xp[m.uid] ? res.xp[m.uid][checked.floors-1] || 0 : 0};
    });
    return {ready:true, id:slotId(slot), bay:number(slot.bay,0), theme:slot.theme,
      start:slot.start, end:slot.end, from:checked.from, current:current, finalFloor:checked.floors,
      done:done, recalled:slot.recalled != null, lost:res.lost || null, rows:rows, team:team,
      completed:aggregate(s, checked.loot, current), total:aggregate(s, checked.loot, checked.floors),
      milestones:milestones, finalMilestones:finalMilestones,
      fossilForecast:fossilForecast(s,slot,checked,rates),
      filtered:checked.removed, truncated:checked.floors !== res.floors};
  }
  function build(s, now, live) {
    if (!s || typeof s !== 'object') return {ready:false, why:'还没读到游戏存档', now:now};
    var geodes;
    try{geodes=predictGeodes(s,48);}catch(e){geodes={ready:false,why:'晶洞数据校验失败：'+e.message};}
    return {ready:true, now:now, source:DATA.source, checked:DATA.checked,
      geodes:geodes, expeditions:arr(s.under && s.under.slots).slice(0,8).map(function (slot) {
        try{return expedition(s,slot,now,live && live.rates);}catch(e){return {ready:false,id:slotId(slot),bay:number(slot && slot.bay,0),why:'本趟探险数据校验失败：'+e.message};}
      })};
  }
  function currentBundle() {
    try {
      var entries = root.performance && root.performance.getEntriesByType('resource') || [];
      for (var i = entries.length-1; i >= 0; i--) {
        var match = /\/bundle\/(app\.[a-f0-9]+\.js)(?:[?#]|$)/.exec(entries[i].name);
        if (match) return match[1];
      }
      var scripts = root.document && root.document.scripts || [];
      for (var j=scripts.length-1;j>=0;j--) {
        var scriptMatch=/\/bundle\/(app\.[a-f0-9]+\.js)(?:[?#]|$)/.exec(scripts[j].src || '');
        if(scriptMatch)return scriptMatch[1];
      }
    } catch (e) { /* unavailable outside game */ }
    return '';
  }
  function state() {
    var live = root.PCG_UNDER_CONTROL && root.PCG_UNDER_CONTROL.live();
    // Prefer the original Game.S bridge. Preview no longer depends on a stale or
    // wrapped localStorage snapshot, or on the nursery module's polling state.
    if(live && live.ok && live.fresh && live.forecast && live.forecast.ready) {
      var control=Object.assign({},live);delete control.forecast;
      return Object.assign({},live.forecast,{clock:'game',liveSource:live.source,readSource:'game',
        versionStatus:(DATA.verifiedBundles||[DATA.source]).indexOf(live.source)>=0?'matched':live.source?'changed':'unknown',control:control});
    }
    var s = root.PCG_SAVE && root.PCG_SAVE.read(), now = Date.now(), clock = 'local';
    if (live && live.account !== accountKey(s)) live = null;
    if (live && live.ok && live.fresh) { now = live.now; clock = 'game'; }
    // Recompute all summaries at the same recalled timestamp, rather than merely
    // overwriting the displayed floor while leaving XP and loot totals stale.
    if(s && live && live.ok && live.fresh && s.under) {
      s=Object.assign({},s,{under:Object.assign({},s.under,{slots:arr(s.under.slots).map(function(slot){
        var actual=(live.runs || []).find(function(r){return r.id===String(slot.id==null?slot.start:slot.id) && r.start===slot.start;});
        return actual && actual.recalled ? Object.assign({},slot,{recalled:actual.recalledAt}) : slot;
      })})});
    }
    var result = build(s, now, live), source = currentBundle();
    result.clock = clock; result.liveSource = source;
    result.readSource='storage';
    result.versionStatus = !source ? 'unknown' : (DATA.verifiedBundles||[DATA.source]).indexOf(source)>=0 ? 'matched' : 'changed';
    result.control = live || {ok:false, fresh:false, why:'等待实时检测桥；更新扩展后请刷新游戏页', plans:[], runs:[]};
    return result;
  }
  root.PCG_UNDERGROUND = {state:state, build:build, gemKinds:gemKinds, predictGeodes:predictGeodes,
    predictOne:predictOne, fixedRoll:fixedRoll, hash:hash, expedition:expedition,
    sanitizeRun:sanitizeRun, aggregate:aggregate, gemName:gemName, TYPES:TYPES, TIERS:TIERS,
    accountKey:accountKey, fossilRate:fossilRate, fossilForecast:fossilForecast,
    fossilSignature:fossilSignature, currentBundle:currentBundle};
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PCG_UNDERGROUND;
})(typeof window !== 'undefined' ? window : globalThis);
