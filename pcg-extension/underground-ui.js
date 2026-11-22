/* v1.19.0 popup forecasts and per-expedition recall controls. */
(function (root) {
  'use strict';
  var doc = root.document, last = null, initialized = false, ready = false;
  var options = {tier:0, count:24, filter:'important', bay:'all'}, KEY = 'pcgUnderForecastUiV1';
  var geodeSig = '', runSig = '';
  var transport=null, refreshState=null, drafts=new Map(), notices=new Map(), busy=new Set();
  /* v1.31：闪光化石召回勾选框——独立常驻开关，对所有槽位生效。
   * 勾选状态持久化到 localStorage，不依赖地下通道自动派遣功能是否启动，
   * 也不因「当前无可召回层 / 预览数据未就绪」而弹回或被清空。
   * 勾选后只要有探险检测到闪光化石结算层，就自动对所有相关槽位布防召回。 */
  var RECALL_FLAG='pcgRecallEnabledV1';
  var recallState={notice:'',tone:''}, recallChoices=[];
  var recallEnabled=false, autoArmSig='', recallArming=false;
  function loadRecallFlag(){
    try{recallEnabled=root.localStorage.getItem(RECALL_FLAG)==='1';}catch(e){recallEnabled=false;}
  }
  function saveRecallFlag(v){
    recallEnabled=!!v;
    try{root.localStorage.setItem(RECALL_FLAG,recallEnabled?'1':'0');}catch(e){}
  }
  var TIER = ['普通','较少见','稀有','传说'];
  /* v1.40：晶洞/宝石图标取自游戏 assets（经 game-ui.js）。GUI 在 game-ui.js 里
   * 先于本文件加载；拿不到时安全降级为无图标，绝不影响预测功能。 */
  var GUI = root.PCG_GAME_UI || null;
  function geodeImg(tier, size) {
    if (!GUI || typeof GUI.geodeIcon !== 'function') return '';
    return '<img class="gf-ico" src="' + GUI.geodeIcon(tier) + '" alt=""' +
      (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '>';
  }
  function gemImg(type, size) {
    if (!GUI || typeof GUI.gemIcon !== 'function') return '';
    return '<img class="gf-gem-ico" src="' + GUI.gemIcon(type) + '" alt=""' +
      (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '>';
  }
  /* v1.26：「查看掉落」筛选合并进逐层奖励区，选项集中在这里，逐层奖励详情内渲染 */
  var DROP_FILTERS = [['important','有道具、晶洞等的楼层'],['all','所有楼层的掉落'],
    ['geode','含晶洞的楼层'],['fossil','含化石的楼层'],['plate','含石板的楼层'],['item','含道具的楼层']];
  var TYPES = {normal:'一般',fire:'火',water:'水',electric:'电',grass:'草',ice:'冰',
    fighting:'格斗',poison:'毒',ground:'地面',flying:'飞行',psychic:'超能力',bug:'虫',
    rock:'岩石',ghost:'幽灵',dragon:'龙',dark:'恶',steel:'钢',fairy:'妖精'};
  var THEMES = {flooded:'水淹',volcanic:'火山',crystal:'结晶',dark:'幽暗',ancient:'远古',galleries:'坑道'};
  function q(id) { return doc.getElementById(id); }
  function text(id, value) { var el=q(id); if (el) el.textContent=value; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function mon(id) {
    var d=root.PCG_DEX_DATA;
    return d && d.name ? d.name(id) : '#' + id;
  }
  function item(id) {
    var d=root.PCG_ITEM_DATA;
    return d && d.itemName ? d.itemName(id) : id;
  }
  function fmt(n) { return Number(n || 0).toLocaleString('zh-CN'); }
  function duration(ms) {
    var sec=Math.max(0,Math.ceil(ms/1000)), h=Math.floor(sec/3600), m=Math.floor(sec%3600/60);
    return h ? h+'时'+m+'分' : m ? m+'分'+sec%60+'秒' : sec+'秒';
  }
  function time(at) {
    if (!isFinite(at)) return '时间未知';
    return new Date(at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  }
  function lootName(e) {
    if (e.k==='money') return '金币 '+fmt(e.n);
    if (e.k==='shards') return '碎片 ×'+fmt(e.n);
    if (e.k==='item') return item(e.id)+' ×1';
    if (e.k==='geode') return TIER[e.t]+'晶洞 ×1';
    if (e.k==='plate') return (TYPES[e.type] || e.type)+'石板（领取时核定）';
    if (e.k==='fossil') return mon(e.id)+' Lv.'+e.lv+'（闪光见结算层预测）';
    return '未知奖励';
  }
  function summary(sum) {
    if (!sum) return '暂无奖励';
    var words=[];
    if (sum.money) words.push('金币 '+fmt(sum.money));
    if (sum.shards) words.push('碎片 ×'+fmt(sum.shards));
    Object.keys(sum.items || {}).forEach(function(id){words.push(item(id)+' ×'+sum.items[id]);});
    (sum.geodes || []).forEach(function(n,i){if(n) words.push(TIER[i]+'晶洞 ×'+n);});
    (sum.plates || []).forEach(function(type){words.push((TYPES[type] || type)+'石板');});
    var fossils={};
    (sum.fossils || []).forEach(function(f){fossils[f.id]=(fossils[f.id] || 0)+1;});
    Object.keys(fossils).forEach(function(id){words.push(mon(id)+'化石 ×'+fossils[id]);});
    if (sum.converted) words.push('含重复石板转晶洞 '+sum.converted+' 个');
    return words.length ? words.join('、') : '暂无奖励';
  }
  function reset(reason) {
    geodeSig=runSig=''; last=null;
    text('brief-geodes','等待读档'); text('brief-expedition','等待读档');
    text('gf-status',reason); text('uf-status',reason);
    text('gf-meta','—'); text('gf-next','—'); text('gf-pool','');
    var a=q('gf-rows'), b=q('uf-runs');
    if(a) a.innerHTML='<li class="empty">'+esc(reason)+'</li>';
    if(b) b.innerHTML='<li class="empty">'+esc(reason)+'</li>';
    var rs=q('uf-recall'), rn=q('uf-recall-note'), rl=q('uf-recall-list');
    /* v1.31：勾选是独立常驻开关，读档 / 无数据时也不清空玩家的勾选状态 */
    if(rs){rs.checked=recallEnabled;rs.disabled=false;try{rs.indeterminate=false;}catch(e){}}
    if(rn){rn.textContent=recallEnabled?'当前没有可召回的闪光化石结算层':'';rn.setAttribute('data-tone','');}
    if(rl)rl.innerHTML='';
    recallState={notice:'',tone:'',at:0};recallChoices=[];autoArmSig='';
  }
  function versionNote(s) {
    /* v1.26：这段「游戏已更新 / 按旧规则 / 本机时钟估算」的免责说明按用户要求整段删除，
     * 不再占用探险预览与晶洞面板的抬头。保留函数占位，调用处照旧传参即可。 */
    return '';
  }
  function renderGeodes(s) {
    var data=s.geodes;
    if (!data || !data.ready) {
      text('gf-status',data && data.why || '晶洞预测不可用');
      text('brief-geodes','等待数据'); text('gf-meta','—'); text('gf-next','—'); text('gf-pool','');
      q('gf-rows').innerHTML='<li class="empty">'+esc(data && data.why || '尚未读到训练师标识')+'</li>';
      geodeSig=''; return;
    }
    var chosen=data.tiers[options.tier], count=options.count;
    var sig=JSON.stringify([data,options.tier,count,s.versionStatus]);
    text('gf-status',versionNote(s));
    text('brief-geodes',TIER[options.tier]+' · 库存 '+fmt(chosen.inventory));
    if(sig===geodeSig) return;
    geodeSig=sig;
    text('gf-meta','已开 '+fmt(chosen.opened)+' 个 · 以下从下一次开始');
    var rows=(chosen.rows || []).slice(0,count), upgrade=rows.find(function(r){return r.to>r.from;});
    text('gf-next',!chosen.ready ? '当前档位无法预测' : options.tier===3 ? '传说档已到顶' : upgrade ?
      '未来第 '+upgrade.offset+' 次升档 → '+TIER[upgrade.to] : '未来 '+count+' 次未出现升档');
    text('gf-pool','当前各档宝石池：'+data.pools.map(function(p,i){return TIER[i]+' '+p.length+' 种';}).join(' / '));
    q('gf-rows').innerHTML=rows.length ? rows.map(function(r){
      var gemType=String(r.key||'').split(':')[0];
      return '<li class="uf-geode-row'+(r.to>r.from?' uf-hit':'')+(!r.inStock?' uf-unstocked':'')+'">'+
        '<span class="uf-order">第 '+r.offset+' 次<small>k='+r.index+'</small></span>'+
        '<span class="uf-main">'+gemImg(gemType,18)+'<b>'+esc(r.name)+'</b><small>'+esc(r.to>r.from ? TIER[r.from]+' → '+TIER[r.to] : '不升档')+
        (r.poolTier!==r.to?' · 宝石池为空，回退至'+TIER[r.poolTier]:'')+'</small></span>'+
        '<span class="uf-badges">'+(r.isNew?'<i class="uf-badge">首次新增</i>':'')+
        '<i class="uf-badge'+(r.inStock?' uf-owned':'')+'">'+(r.inStock?'库存内':'需补充')+'</i></span></li>';
    }).join('') : '<li class="empty">'+esc(chosen.why || '当前宝石池为空')+'</li>';
  }
  function keepRow(row) {
    if(options.filter==='all') return true;
    return row.loot.some(function(e){return options.filter==='important' ?
      e.k!=='money' && e.k!=='shards' : e.k===options.filter;});
  }
  function milestoneText(ms) {
    return (ms || []).map(function(m){return m.floor+'层：'+(m.geode!=null?TIER[m.geode]+'晶洞':m.frame?'外观奖励':'里程碑');}).join('、');
  }
  function runKey(run) {return run.id+'@'+run.start;}
  function nextHit(run) {
    return (run.fossilForecast && run.fossilForecast.hits || []).find(function(h){return h.floor>=run.current;});
  }
  /* v1.31：把「化石闪光结算层」检测到的可召回闪光层摊平成目标清单。
   * 只列本次探险中「还没过、且能安全召回」的闪光层；requireShiny 恒为 true，
   * 保证到达该层时游戏结算确实给出闪光化石（不是普通化石层）。
   * 每个目标携带宝可梦名 / 等级 / 当前层，供「槽位2 · 菊石兽 Lv.30 第80层 当前25层 等待召回」文案使用。 */
  function recallOptions(s) {
    var runs=s.expeditions || [], out=[];
    runs.forEach(function(run){
      if(run.done || run.recalled || !run.ready) return;
      var hits=(run.fossilForecast && run.fossilForecast.ready && run.fossilForecast.hits) || [];
      hits.forEach(function(h){
        if(h.floor < run.current || h.floor < run.from || h.floor > run.finalFloor) return;
        var mons=(h.fossils || []).map(function(i){
          var it=run.fossilForecast.items[i];
          return it?{name:mon(it.id),lv:it.lv}:null;
        }).filter(Boolean);
        out.push({key:runKey(run),id:run.id,start:run.start,bay:Number(run.bay),floor:h.floor,
          current:run.current, mons:mons,
          label:'槽位 '+(Number(run.bay)+1)+' · 第 '+h.floor+' 层'+(mons.length?' · 闪光'+mons.map(function(m){return m.name;}).join('/'):'')});
      });
    });
    out.sort(function(a,b){return a.bay-b.bay || a.floor-b.floor;});
    return out;
  }
  function recallCtlValue(runKeyStr,floor) {return runKeyStr+'|'+floor;}
  /* v1.31：把单个可召回目标拼成一行说明：
   * 「槽位2 · 菊石兽 Lv.30 第80层 当前25层 等待召回」 */
  function recallLine(c) {
    var parts=[];
    parts.push('槽位'+(Number(c.bay)+1));
    var mons=(c.mons || []).map(function(m){return m.name+' Lv.'+m.lv;}).join('、');
    if(mons) parts.push(mons);
    parts.push('第'+c.floor+'层');
    parts.push('当前'+c.current+'层');
    parts.push('等待召回');
    return parts.join(' · ');
  }
  /* v1.37：没有可召回层时的说明。旧文案「当前没有可召回的闪光化石结算层」太绝对，
   * 玩家误以为功能坏了。实际上每份化石只在「返回时已完成层数」逐层以 1/2048 判定，
   * 绝大多数探险本就没有闪光层。这里根据当前未结束探险的化石数给出清晰说明，
   * 并明确：一旦真的命中，勾选框会自动对所有槽位布防召回。 */
  function recallEmptyText(s) {
    var runs=s.expeditions || [], fossils=0, slots=0;
    runs.forEach(function(run){
      if(run.done || run.recalled || !run.ready) return;
      var items=(run.fossilForecast && run.fossilForecast.ready && run.fossilForecast.items) || [];
      if(items.length){fossils+=items.length;slots++;}
    });
    if(!fossils) return '当前没有检测到可召回的闪光化石结算层（本趟探险还没有化石，或探险尚未开始）';
    return '当前 '+fossils+' 份化石在剩余楼层内均未命中闪光结算层（闪率约 1/2048，属正常概率）；一旦命中会自动召回，无需手动操作';
  }
  /* v1.31：勾选框是独立常驻开关——回显持久化状态，不受预览读档 / 地下派遣开关影响。
   * 无可召回目标时按用户要求显示「当前没有可召回的闪光化石结算层」；
   * 有目标时逐条列出每个槽位的目标层，并在开关开启时自动对所有目标布防。 */
  function renderRecall(s) {
    var cb=q('uf-recall'), note=q('uf-recall-note'), list=q('uf-recall-list');
    if(!cb) return;
    recallChoices=recallOptions(s);
    try{cb.checked=recallEnabled;cb.indeterminate=false;}catch(e){cb.checked=recallEnabled;}
    if(note){
      var txt=recallState.notice;
      if(!txt){
        if(!recallChoices.length) txt=recallEmptyText(s);
        else if(recallEnabled) txt='已开启自动召回 · 以下 '+recallChoices.length+' 个目标将在到达闪光结算层时自动召回：';
        else txt='检测到以下 '+recallChoices.length+' 个可召回目标，勾选「闪光化石召回」即对所有槽位生效：';
      }
      if(note.textContent!==txt) note.textContent=txt;
      note.setAttribute('data-tone',recallState.tone||'');
    }
    if(list){
      var html=recallChoices.length
        ? recallChoices.map(function(c){return '<li>'+esc(recallLine(c))+'</li>';}).join('')
        : '';
      if(list.innerHTML!==html) list.innerHTML=html;
    }
    /* 开关开启且连接正常时，自动对所有尚未布防的目标逐条布防；签名去重避免重复发送 */
    if(recallEnabled && recallChoices.length && transport && !recallArming) {
      var bySlot={}, targets=[];
      recallChoices.forEach(function(c){if(!bySlot[c.key]){bySlot[c.key]=c;targets.push(c);}});
      var control=s.control || {}, plans=control.plans || [];
      var need=targets.filter(function(c){
        return !plans.some(function(p){
          return p.status==='armed' && p.id===c.id && p.start===c.start && p.bay===c.bay && p.floor===c.floor;
        });
      });
      var sig=need.map(function(c){return recallCtlValue(c.key,c.floor);}).join(',');
      if(need.length && sig!==autoArmSig) armTargets(need, sig, false);
      else if(!need.length) autoArmSig='';
    }
  }
  /* v1.31：对一组目标逐条布防。silent=true 用于自动补布防（不弹「已布防」文案，避免刷屏）。 */
  function armTargets(targets, sig, silent) {
    recallArming=true;
    var cb=q('uf-recall'); if(cb)cb.disabled=true;
    var ok=0, fail=0, lastErr='';
    (function next(i){
      if(i>=targets.length){
        recallArming=false;
        if(q('uf-recall'))q('uf-recall').disabled=false;
        autoArmSig=sig;
        if(fail){
          recallState.notice='已布防 '+ok+' 个，'+fail+' 个失败（'+lastErr+'）';recallState.tone='warn';
        } else if(!silent) {
          recallState.notice='已对所有 '+ok+' 个目标布防，到达闪光结算层时自动召回';recallState.tone='ok';
        } else { recallState.notice='';recallState.tone=''; }
        runSig=''; if(last)render(last); if(refreshState)refreshState();
        return;
      }
      var c=targets[i];
      transport({type:'pcg-under-control',cmd:'arm',args:{id:c.id,start:c.start,bay:c.bay,floor:c.floor,requireShiny:true}})
        .then(function(resp){
          if(resp && resp.ok){if(resp.live)last.control=Object.assign({},resp.live,{fresh:true});ok++;}
          else{fail++;lastErr=(resp&&resp.text)||'没有收到游戏回执';}
        })
        .catch(function(e){fail++;lastErr=e.message||String(e);})
        .then(function(){next(i+1);});
    })(0);
  }
  function fossilPanel(run,s) {
    var f=run.fossilForecast, control=s.control || {}, key=runKey(run), plan=(control.plans || []).find(function(p){return p.id===run.id && p.start===run.start;});
    var draft=drafts.get(key), hit=nextHit(run);
    if(!draft) {draft={floor:plan?String(plan.floor):hit?String(hit.floor):'',only:plan?plan.requireShiny!==false:true};drafts.set(key,draft);}
    var html='<div class="uf-fossil"><b>✦ 化石闪光结算层</b>';
    if(!f || !f.ready) html+='<p class="ug-note">'+esc(f && f.why || '无法计算化石闪光')+'</p>';
    else if(!f.items.length) html+='<p class="ug-note">本次奖励没有化石。</p>';
    else {
      f.items.forEach(function(item){
        var future=item.shinyFloors.filter(function(n){return n>=run.current;}), fixed=item.shinyFloors.indexOf(run.current)>=0;
        /* v1.37：把「为什么没有闪光结算层」讲清楚。游戏对每份化石在"返回时的已完成层数"
         * 逐层掷 fixedRoll，只有 < 当前闪率才闪光；1/2048 是很低的概率，绝大多数趟
         * 数本就没有闪光结算层——这不是插件失效。列出已扫描层数与命中概率，让用户
         * 看懂「没有=正常」，并明确命中时勾选框会自动召回。 */
        var scanN=Math.max(0,(run.finalFloor||0)-Math.max(item.dropFloor,run.current||0)+1);
        var hitPct=scanN>0?(100*(1-Math.pow(1-item.rate,scanN))):0;
        var chance='（扫描 '+scanN+' 层 · 本趟命中概率约 '+(hitPct<0.1?'<0.1':hitPct.toFixed(1))+'%，未命中属正常）';
        html+='<p class="uf-fossil-item"><b>化石 '+(item.index+1)+' · '+esc(mon(item.id))+' Lv.'+item.lv+'</b><br><small>第 '+item.dropFloor+' 层获得 · 当前闪率 1/'+Math.round(1/item.rate)+'</small><br>'+
          (run.done?(item.dropFloor>run.current?'未获得这份化石':fixed?'✦ 在当前结算层预测为闪光':'当前结算层预测为普通'):
          future.length?'完成第 <strong>'+future.join('、')+'</strong> 层后返回可得闪光':'本次剩余可完成楼层中，没有这份化石的闪光结算层 '+chance)+'</p>';
      });
      html+='<p class="ug-note">这里是返回时的已完成层数，不是化石掉落层。只含已获得的化石；每份化石单独编号计算。领取前地区图鉴完成情况变化会改变闪率。</p>';
    }
    html+='</div>';
    return html;
  }
  function renderRuns(s) {
    var allRuns=s.expeditions || [], list=q('uf-runs');
    /* v1.24：按槽位筛选——先按 bay 动态重建下拉，再只显示选中的槽位 */
    var baySel=q('uf-bay');
    if(baySel){
      var bays={};
      allRuns.forEach(function(r){bays[Number(r.bay)]=1;});
      var bayKeys=Object.keys(bays).map(Number).sort(function(a,b){return a-b;});
      var cur=options.bay, wanted=String(cur);
      var html='<option value="all">全部槽位（'+allRuns.length+'）</option>'+bayKeys.map(function(b){
        return '<option value="'+b+'">槽位 '+(b+1)+'</option>';
      }).join('');
      if(baySel.innerHTML!==html) baySel.innerHTML=html;
      // 选中的槽位若已不存在，回退到全部
      if(cur!=='all' && bayKeys.indexOf(Number(cur))<0){cur='all';options.bay='all';wanted='all';}
      baySel.value=wanted;
    }
    var runs=(options.bay==='all')?allRuns:allRuns.filter(function(r){return Number(r.bay)===Number(options.bay);});
    text('brief-expedition',allRuns.length ? (options.bay==='all'?allRuns.length+' 个槽位':'只看槽位 '+(Number(options.bay)+1)) : '暂无派遣');
    /* v1.26：删除「以下按旧规则计算 / 时间按本机时钟估算（≈）」这段抬头文字 */
    text('uf-status','');
    var control=s.control || {};
    var sig=JSON.stringify([runs,options.filter,options.bay,s.versionStatus,control.allowed,control.fresh,control.why,control.plans,Array.from(notices),Array.from(busy)]);
    if(sig!==runSig) {
      runSig=sig;
      var open={}, scroll={}, focused=doc.activeElement, focusKey='', focusField='';
      if(focused && focused.dataset.field) {var parent=focused.closest('[data-control-key]');if(parent){focusKey=parent.dataset.controlKey;focusField=focused.dataset.field;}}
      list.querySelectorAll('details[data-run-id]').forEach(function(el){open[el.dataset.runId]=el.open;});
      list.querySelectorAll('[data-scroll-id]').forEach(function(el){scroll[el.dataset.scrollId]=el.scrollTop;});
      list.innerHTML=runs.length ? runs.map(function(run){
        var title='槽位 '+(run.bay+1)+' · '+(THEMES[run.theme] || run.theme || '地下探险');
        if(!run.ready) return '<li class="uf-exp"><b>'+esc(title)+'</b><p class="ug-note">'+esc(run.why)+'</p></li>';
        var done=run.done, status=run.recalled?'已召回':done?'已结束':'探险中';
        var rows=run.rows.filter(keepRow), outcome=run.recalled?'召回时止于 '+run.current+' 层':
          run.lost==='guard'?'守卫战失败':run.lost==='wild'?'普通战斗失败':run.finalFloor>=300?'完成全部楼层':'本次模拟终点';
        var html='<li class="uf-exp"><div class="uf-exp-head"><b>'+esc(title)+'</b><i class="uf-badge">'+status+'</i></div>'+
          '<div class="ns-grid ns-grid-3 uf-stats"><div class="ns-cell"><small>已完成</small><b>'+run.current+' 层</b></div>'+
          '<div class="ns-cell"><small>原模拟终点</small><b>'+run.finalFloor+' 层</b></div>'+
          '<div class="ns-cell"><small>预计结束</small><b class="uf-time" data-uf-end="'+run.end+'" data-done="'+(done?'1':'0')+'">—</b></div></div>'+
          '<p class="uf-outcome">'+esc(outcome)+' · '+(run.recalled?'已终止':esc(time(run.end)))+'</p>'+
          '<div class="uf-loot"><small>已完成楼层 · 待领取</small><p>'+esc(summary(run.completed))+'</p></div>'+
          '<div class="uf-loot"><small>'+(run.recalled?'原计划跑完可得（召回后不再获得）':'跑完本次预计可得（含已完成）')+'</small><p>'+esc(summary(run.total))+'</p></div>';
        if(run.finalMilestones.length) html+='<p class="ug-note">未领里程碑：'+esc(milestoneText(run.finalMilestones))+'（单独结算，不含在上方合计）</p>';
        if(run.team.length) html+='<p class="ug-note">经验预存：'+run.team.map(function(m){return esc(mon(m.id))+(m.shiny?' ✦':'')+' '+fmt(m.xp)+' / '+fmt(m.finalXp);}).join('；')+'（已完成 / 原模拟终点）</p>';
        if(run.filtered || run.truncated) html+='<p class="uf-warning">记录存在不合规则的数据，已按校验规则过滤；请以游戏结算为准。</p>';
        html+=fossilPanel(run,s);
        /* v1.26：「查看掉落」筛选合并进逐层奖励——在详情里放一行筛选下拉，
         * 与选择槽位不再并列占用顶部空间。整段随 runSig 重建，选中态由 options.filter 决定。 */
        var filterBar='<div class="uf-drop-filter"><label>查看掉落<select data-uf-filter>'+
          DROP_FILTERS.map(function(f){return '<option value="'+f[0]+'"'+(f[0]===options.filter?' selected':'')+'>'+esc(f[1])+'</option>';}).join('')+
          '</select></label></div>';
        html+='<details class="uf-floors" data-run-id="'+esc(run.id)+'"'+(open[run.id]?' open':'')+'><summary>逐层奖励 · 符合筛选：'+rows.length+' 层</summary>'+
          filterBar+
          '<div class="uf-floor-scroll" data-scroll-id="'+esc(run.id)+'">'+(rows.length?rows.map(function(row){
            var finished=row.floor<=run.current;
            return '<div class="uf-floor'+(finished?' uf-finished':'')+'"><div class="uf-floor-head"><b>第 '+row.floor+' 层</b><span>'+esc(row.guard?'守卫 '+mon(row.guard):row.foe?mon(row.foe):'')+'</span></div>'+
              '<p>'+row.loot.map(function(e){return esc(lootName(e));}).join('、')+'</p><small>'+
              (finished?'已完成':run.recalled?'召回后不可获得':'≈ '+esc(time(row.at)))+'</small></div>';
          }).join(''):'<p class="empty">当前筛选没有对应掉落</p>')+'</div></details></li>';
        return html;
      }).join(''):'<li class="empty">没有进行中的探险。正常派遣后会自动读取本次结果。</li>';
      var history=(control.plans || []).filter(function(p){return !runs.some(function(r){return r.id===p.id && r.start===p.start;});});
      if(history.length) list.innerHTML+='<li class="uf-exp"><b>最近召回记录</b>'+history.slice(-4).map(function(p){return '<p class="ug-note">槽位 '+(p.bay+1)+' · 目标 '+p.floor+' 层：'+esc(p.text)+(p.actualFloor!=null?'（实际 '+p.actualFloor+' 层）':'')+'</p>';}).join('')+'</li>';
      list.querySelectorAll('[data-scroll-id]').forEach(function(el){el.scrollTop=scroll[el.dataset.scrollId] || 0;});
      if(focusKey) list.querySelectorAll('[data-control-key]').forEach(function(el){if(el.dataset.controlKey===focusKey){var input=el.querySelector('[data-field="'+focusField+'"]');if(input)input.focus({preventScroll:true});}});
    }
    list.querySelectorAll('[data-uf-end]').forEach(function(el){
      el.textContent=el.dataset.done==='1'?'可领取':'≈ '+duration(Number(el.dataset.ufEnd)-s.now);
    });
  }
  function render(s) {
    last=s;
    if(!ready) return;
    if(!s || !s.ready) {reset(s && s.why || '未收到预测模块数据：请先在扩展管理页重新加载扩展，再刷新游戏页');return;}
    renderGeodes(s); renderRuns(s); renderRecall(s);
  }
  function cleanOptions(o) {
    o=o || {};
    return {tier:[0,1,2,3].indexOf(+o.tier)>=0?+o.tier:0,
      count:[12,24,48].indexOf(+o.count)>=0?+o.count:24,
      filter:['important','all','geode','fossil','plate','item'].indexOf(o.filter)>=0?o.filter:'important',
      bay:(o.bay==='all' || (o.bay!=null && isFinite(+o.bay)))?o.bay:'all'};
  }
  /* v1.40：晶洞档位自定义下拉——每项带游戏原生晶洞图标。保留隐藏的原生 select
   * 供既有读写链路使用；自定义列表选中后写回 select 并派发 change。 */
  function renderTierDD() {
    var btn=q('gf-tier-btn'), menu=q('gf-tier-menu');
    if(!btn || !menu) return;
    btn.innerHTML=geodeImg(options.tier,18)+'<span>'+TIER[options.tier]+'</span><i class="gf-dd-caret"></i>';
    menu.innerHTML=[0,1,2,3].map(function(t){
      return '<span class="gf-dd-item'+(t===options.tier?' sel':'')+'" role="option" data-tier="'+t+'" aria-selected="'+(t===options.tier)+'">'+
        geodeImg(t,20)+'<span>'+TIER[t]+'</span></span>';
    }).join('');
  }
  function initTierDD() {
    var btn=q('gf-tier-btn'), menu=q('gf-tier-menu');
    if(!btn || !menu) return;
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var open=menu.hidden;
      menu.hidden=!open; btn.setAttribute('aria-expanded',open?'true':'false');
    });
    menu.addEventListener('click',function(e){
      var it=e.target.closest?e.target.closest('.gf-dd-item'):null;
      if(!it) return;
      var t=Number(it.getAttribute('data-tier'));
      menu.hidden=true; btn.setAttribute('aria-expanded','false');
      var sel=q('gf-tier'); if(sel){sel.value=String(t);sel.dispatchEvent(new Event('change',{bubbles:true}));}
    });
    doc.addEventListener('click',function(){if(!menu.hidden){menu.hidden=true;btn.setAttribute('aria-expanded','false');}});
    renderTierDD();
  }
  function applyOptions() {
    q('gf-tier').value=String(options.tier); q('gf-count').value=String(options.count);
    renderTierDD();
    /* v1.26：「查看掉落」筛选已移进逐层奖励内部，由逐层奖励的下拉承载，这里不再有顶层 uf-filter */
    if(q('uf-bay')) q('uf-bay').value=String(options.bay);
    geodeSig=runSig=''; if(last) render(last);
  }
  function saveOptions() {
    try {var obj={};obj[KEY]=options;root.chrome.storage.local.set(obj,function(){void root.chrome.runtime.lastError;});}catch(e){/* optional */}
  }
  function init(refresh,send) {
    if(initialized) return;
    initialized=true;
    transport=send;refreshState=refresh;
    loadRecallFlag(); /* v1.31：恢复持久化的召回开关状态 */
    function remember(ev) {
      var el=ev.target, box=el.closest('[data-control-key]');if(!box || !el.dataset.field)return;
      var draft=drafts.get(box.dataset.controlKey);if(!draft)return;
      if(el.dataset.field==='floor')draft.floor=el.value;else draft.only=el.checked;
    }
    q('uf-runs').addEventListener('input',remember);q('uf-runs').addEventListener('change',remember);
    /* v1.26：逐层奖励内的「查看掉落」下拉——事件委托，变更筛选后重画该列表 */
    q('uf-runs').addEventListener('change',function(ev){
      var sel=ev.target.closest('[data-uf-filter]');if(!sel)return;
      options.filter=cleanOptions({filter:sel.value}).filter;
      saveOptions();
      runSig=''; if(last) render(last);
    });
    q('uf-runs').addEventListener('click',async function(ev){
      var button=ev.target.closest('button[data-action]'), box=button && button.closest('[data-control-key]');
      if(!box || button.disabled || !last)return;
      var key=box.dataset.controlKey, run=(last.expeditions || []).find(function(r){return runKey(r)===key;}), draft=drafts.get(key);
      if(!run || !draft || busy.has(key))return;
      var action=button.dataset.action;
      if(action==='nearest') {var hit=nextHit(run);if(hit){draft.floor=String(hit.floor);runSig='';render(last);}return;}
      if(!transport){notices.set(key,'未连接扩展通信，请重新打开面板');runSig='';render(last);return;}
      var floor=Number(draft.floor);
      if(action==='arm' && (!draft.floor || !Number.isInteger(floor) || floor<run.from || floor>run.finalFloor)) {
        notices.set(key,'请输入本次可完成范围内的整数层数');runSig='';render(last);return;
      }
      busy.add(key);notices.delete(key);runSig='';render(last);
      try {
        var response=await transport({type:'pcg-under-control',cmd:action==='detect'?'status':action,
          args:{id:run.id,start:run.start,bay:run.bay,floor:floor,requireShiny:draft.only}});
        if(!response || !response.ok) throw Error(response && response.text || '没有收到游戏回执');
        if(response.live)last.control=Object.assign({},response.live,{fresh:true});
        var actual=(response.live && response.live.runs || []).find(function(r){return r.id===run.id && r.start===run.start;});
        /* v1.34：找不到时的提示给出可操作信息——若实时桥报告了致命阻断，显示其
         * 原因（如未持有标签锁），否则提示刷新；不再一概说「不在槽位」让用户误以为功能坏了。 */
        var detectFail='这次探险已不在槽位，请刷新游戏页后重新读取';
        if(!actual && response.live && response.live.fatal) detectFail=response.live.fatal;
        notices.set(key,action==='detect'?(actual?'实时检测：已完成 '+actual.floor+' 层'+(actual.done?'，本次已结束':'，探险中'):detectFail):
          action==='cancel'?'已取消本次自动召回':'已启用：完成第 '+floor+' 层后召回，关闭助手面板仍有效');
      } catch(e){notices.set(key,e.message || String(e));}
      finally {busy.delete(key);runSig='';render(last);if(refreshState)refreshState();}
    });
    function collectOptions(){
      return cleanOptions({tier:q('gf-tier').value,count:q('gf-count').value,filter:options.filter,
        bay:q('uf-bay')?q('uf-bay').value:'all'});
    }
    /* v1.31：闪光化石召回勾选框是独立常驻开关。
     * 勾选状态持久化、对所有槽位生效，不依赖地下通道自动派遣功能是否启动；
     * 勾选：先把开关打开（即便当前没有目标也允许勾选），布防由 render 中的自动逻辑按目标完成；
     * 取消：撤销当前全部生效的召回计划。 */
    var recallCb=q('uf-recall');
    if(recallCb) recallCb.addEventListener('change',async function(){
      var on=!!recallCb.checked;
      saveRecallFlag(on);
      autoArmSig='';
      recallState.notice='';recallState.tone='';
      if(!on){
        /* 取消勾选：撤销全部生效的召回 */
        var control0=(last && last.control) || {}, armed0=(control0.plans||[]).filter(function(p){return p.status==='armed';});
        if(!armed0.length){runSig='';if(last)render(last);if(refreshState)refreshState();return;}
        if(!transport){recallState.notice='未连接扩展通信，请重新打开面板';recallState.tone='warn';runSig='';if(last)render(last);return;}
        recallCb.disabled=true;runSig='';if(last)render(last);
        var cancelled=0, cancelErr='';
        for(var i=0;i<armed0.length;i++){
          try{
            var resp0=await transport({type:'pcg-under-control',cmd:'cancel',args:{id:armed0[i].id,start:armed0[i].start,bay:armed0[i].bay}});
            if(!resp0 || !resp0.ok) throw Error(resp0&&resp0.text||'撤销失败');
            if(resp0.live)last.control=Object.assign({},resp0.live,{fresh:true});
            cancelled++;
          }catch(e){cancelErr=e.message||String(e);}
        }
        recallState.notice=cancelErr?('撤销了 '+cancelled+' 个，但有失败：'+cancelErr):('已撤销全部 '+cancelled+' 个目标的自动召回');
        recallState.tone=cancelErr?'warn':'ok';
        if(q('uf-recall'))q('uf-recall').disabled=false;
        runSig='';if(last)render(last);if(refreshState)refreshState();
        return;
      }
      /* 勾选：允许无目标时也保持勾选；有目标则由 render 的自动布防逻辑逐条 arm */
      if(!transport){recallState.notice='已开启自动召回；连接游戏页后自动布防';recallState.tone='warn';runSig='';if(last)render(last);return;}
      if(!recallChoices.length){
        recallState.notice='已开启自动召回（对所有槽位生效）；'+recallEmptyText(s);
        recallState.tone='ok';
      }
      runSig='';if(last)render(last);if(refreshState)refreshState();
    });
    ['gf-tier','gf-count','uf-bay'].forEach(function(id){var el=q(id);if(!el)return;el.addEventListener('change',function(){
      options=collectOptions();
      saveOptions();
      applyOptions();
    });});
    ['gf-refresh','uf-refresh'].forEach(function(id){q(id).addEventListener('click',function(){geodeSig=runSig='';refresh();});});
    initTierDD();
    try {
      root.chrome.storage.local.get(KEY,function(data){
        void root.chrome.runtime.lastError;
        options=cleanOptions(data && data[KEY]);ready=true;applyOptions();
      });
    } catch(e){ready=true;applyOptions();}
  }
  root.PCG_UNDER_UI={init:init,render:render,reset:reset,lootName:lootName,summary:summary};
})(window);
