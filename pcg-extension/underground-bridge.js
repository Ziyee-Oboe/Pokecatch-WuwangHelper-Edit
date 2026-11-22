/* v1.19.0 MAIN world: session-only, explicitly armed recall through the game's API. */
(function (root) {
  'use strict';
  var F=root.PCG_UNDERGROUND, DATA=root.PCG_UNDER_DATA;
  if (!F || !DATA) return;
  function bayOf(slot) {return typeof slot.bay==='number' && Number.isFinite(slot.bay)?slot.bay:0;}
  /* v1.34：统一「探险槽位 id」的取法。此前三处各写一套：
   *   forecast: String(slot.id || slot.start)          （0 / 空串会误回退到 start）
   *   snapshot: String(slot.id==null?slot.start:slot.id)
   *   find:     String(r.id==null?r.start:r.id)
   * 游戏 slot.id 是 uid() 字符串，但历史存档里可能是 0 / 空串 / 数字，三套规则一旦
   * 判定不一致，UI 用 forecast 的 id 去 live.runs 里 find 就会找不到 —— 正是玩家说的
   * 「检测不到槽位的状态」。这里统一为：只有 null/undefined/'' 才回退 start。 */
  function slotId(slot) {
    if(!slot) return '';
    var id=slot.id;
    if(id===null || id===undefined || id==='') id=slot.start;
    return String(id);
  }
  function windowFor(slot,floor) {
    var at=slot.res && slot.res.at || [], step=DATA.underground.STEP_MS;
    return {open:slot.start+at[floor-1]*step+600,
      close:Math.min(slot.end, floor<at.length?slot.start+at[floor]*step:slot.end)-1200};
  }
  function create(deps) {
    var plans=[], serial=0;
    function context() {
      var g=deps.game(), ns=deps.namespace(), s=g && g.S, u=ns && ns.Underground;
      if (!g || !s || !u || typeof u.progress!=='function' || typeof u.recall!=='function') throw Error('未连接游戏内部接口，请刷新游戏页');
      var now=g.time(), rates={};
      DATA.regions.forEach(function(r){rates[r.key]=g.shinyRate(r.key);});
      /* v1.34：槽位来源改为「游戏自己的 slots()」优先。
       * 游戏的 under 存档是惰性初始化的（j() 里 s.S.under ||= {...}），直接读
       * s.under.slots 在某些时序下会拿到空数组 —— 玩家看到「检测不到槽位状态」。
       * u.slots() 是游戏暴露的同一份数据的 getter，稳定且不改存档。
       * 两条来源合并去重，任一有槽位就用它，保证检测到状态。 */
      var slots=[], byId={};
      function addSlots(arr){
        (arr || []).forEach(function(slot){
          if(!slot || typeof slot!=='object') return;
          var key=slotId(slot)+'|'+slot.start;
          if(!byId[key]){byId[key]=1;slots.push(slot);}
          (slot.res && slot.res.loot || []).forEach(function(row){(row || []).forEach(function(e){
            if(e && e.k==='fossil' && e.reg && rates[e.reg]==null) {
              try{rates[e.reg]=g.shinyRate(e.reg);}catch(e2){/* ignore */}
            }
          });});
        });
      }
      try{ if(typeof u.slots==='function') addSlots(u.slots()); }catch(e){/* ignore */}
      addSlots(s.under && s.under.slots);
      /* 致命阻断仅保留「会误召回」的三条：未持有标签锁、沙盒模式、账号变化。
       * v1.34：版本未匹配 / 时钟未校准 / 无训练师标识 由「硬禁止」降为「软警告」——
       * 它们只影响闪率与预测精度，不该让「检测槽位状态」整块失效；怀旧存档缺 trainer
       * 的玩家以前完全看不到槽位，现在照常显示，只是召回需账号一致时才执行。
       * why 仍保留文本供 UI 显示，但 allowed 只由致命项决定。 */
      var warn=[], why='', fatal='';
      var accepted=DATA.verifiedBundles || [DATA.source];
      if(accepted.indexOf(deps.source())<0) warn.push('游戏版本未核验（预测可能偏差）');
      if(!ns.Clock || ns.Clock.sure!==true || !Number.isFinite(now)) warn.push('游戏时钟未校准');
      if(!F.accountKey(s)) warn.push('未读到训练师标识');
      if(!ns.TabLock || typeof ns.TabLock.mine!=='function' || !ns.TabLock.mine()) fatal='当前游戏页未持有活动标签页锁，禁止召回';
      else if(typeof g.inSandbox==='function' && g.inSandbox()) fatal='测试模式不启用召回';
      why=fatal || warn.join('；');
      return {g:g,s:s,u:u,now:now,rates:rates,why:why,warn:warn.join('；'),fatal:fatal,
        allowed:!fatal,account:F.accountKey(s),slots:slots};
    }
    function find(c,p) {return c.slots.find(function(r){return slotId(r)===p.id && r.start===p.start && bayOf(r)===p.bay;});}
    function signature(c,slot,floor) {
      return JSON.stringify([F.fossilSignature(c.s,slot,floor,c.rates),slot.end,slot.res.at,slot.res.floors]);
    }
    function finish(p,status,text,floor) {p.status=status;p.text=text;if(floor!=null)p.actualFloor=floor;}
    function checkSlot(c,slot,floor,requireShiny) {
      if(!slot || !slot.res) throw Error('这次探险已不存在，请重新读取');
      var run=F.expedition(c.s,slot,c.now,c.rates), progress=c.u.progress(slot,c.now);
      /* v1.34：filtered/truncated 只代表「插件静态白名单没覆盖到某个新掉落物」，
       * 不影响化石结算层与闪光判定的可靠性。旧版以此为硬禁止，导致游戏一更新就
       * 全线「禁止自动召回」。现在仅当探险记录本身完全读不出（!ready）才拦。 */
      if(!run.ready) throw Error('探险记录不完整，请刷新游戏页后重试');
      if(!Number.isInteger(floor) || floor<run.from || floor>run.finalFloor) throw Error('目标层不在本次可完成范围内');
      if(progress.done || slot.recalled!=null) throw Error('本次探险已结束或已召回');
      if(progress.floor>floor) throw Error('已经超过目标层，不能返回之前的楼层');
      var hit=run.fossilForecast.ready && run.fossilForecast.hits.find(function(h){return h.floor===floor;});
      if(requireShiny && !hit) throw Error('目标层没有可领取的闪光化石，请选闪光层或取消仅闪光限制');
      var win=windowFor(slot,floor);
      if(!Number.isFinite(win.open) || !Number.isFinite(win.close) || win.open>=win.close) throw Error('目标层没有足够的召回时间窗口');
      if(c.now>=win.close) throw Error('已错过本层安全召回窗口');
      return win;
    }
    function tick() {
      if(!plans.some(function(p){return p.status==='armed';})) return;
      var c;
      try {c=context();} catch(e) {plans.forEach(function(p){if(p.status==='armed')finish(p,'stopped',e.message);});return;}
      plans.forEach(function(p){
        if(p.status!=='armed') return;
        try {
          if(c.fatal) throw Error(c.fatal);
          /* v1.34：软警告（版本未核验/时钟未校准）不再阻断召回；
           * 账号变化仍阻断——避免跨账号误召回。若旧存档无 account，则只在两边都有值时比对。 */
          if(p.account && c.account && p.account!==c.account) throw Error('账号已变化，计划已停止');
          var slot=find(c,p);
          if(!slot) throw Error('原探险已离开槽位，计划不沿用到下一趟');
          if(signature(c,slot,p.floor)!==p.signature) throw Error('奖励、闪率或时间表已变化，请重新设置');
          var progress=c.u.progress(slot,c.g.time());
          if(progress.done || slot.recalled!=null) {
            finish(p,progress.floor===p.floor?'settled':'stopped',progress.floor===p.floor?'已在目标层结束，请领取奖励':'探险已提前结束或被其他功能召回',progress.floor);return;
          }
          var now=c.g.time();
          if(progress.floor>p.floor || now>=p.close) {finish(p,'missed','错过目标层窗口，已停止；没有在其他楼层召回',progress.floor);return;}
          if(progress.floor!==p.floor || now<p.open) return;
          // No asynchronous step between this final progress check and original recall.
          if(c.u.progress(slot,c.g.time()).floor!==p.floor) {finish(p,'missed','执行前层数发生变化，未召回');return;}
          p.status='executing';
          if(!c.u.recall(slot.id)) {finish(p,'stopped','游戏拒绝召回，请检查本次状态');return;}
          var actual=c.u.progress(slot,c.g.time()).floor;
          finish(p,slot.recalled!=null && actual===p.floor?'recalled':'error',
            slot.recalled!=null && actual===p.floor?'召回成功，已核对停在目标层；请领取奖励':'召回结果未能确认在目标层，请检查游戏',actual);
          try {if(deps.afterRecall)deps.afterRecall();}catch(e){/* UI refresh cannot change the confirmed result. */}
        } catch(e) {finish(p,'stopped',e.message);}
      });
    }
    function snapshot() {
      try {
        var c=context();
        /* v1.34：把统一后的 slots 注入 forecast 的存档副本，确保预测与实际检测
         * 用同一份槽位数据（否则 live.runs 有槽位、expeditions 却空，仍无法布防）。 */
        var fs=c.s;
        try{fs=Object.assign({},c.s,{under:Object.assign({},c.s.under||{},{slots:c.slots})});}catch(e){fs=c.s;}
        return {ok:true,now:c.now,account:c.account,rates:c.rates,allowed:!c.fatal,why:c.why,warn:c.warn,fatal:c.fatal,
          source:deps.source(),forecast:F.build(fs,c.now,{rates:c.rates}),seq:++serial,runs:c.slots.map(function(slot){var p=c.u.progress(slot,c.now);
            return {id:slotId(slot),start:slot.start,bay:bayOf(slot),floor:p.floor,
              done:p.done,recalled:slot.recalled!=null,recalledAt:slot.recalled};}),
          plans:plans.map(function(p){return {id:p.id,start:p.start,bay:p.bay,floor:p.floor,status:p.status,
            requireShiny:p.requireShiny,text:p.text,actualFloor:p.actualFloor,open:p.open,close:p.close};})};
      } catch(e) {return {ok:false,allowed:false,why:e.message,seq:++serial,plans:plans.map(function(p){return {id:p.id,start:p.start,bay:p.bay,floor:p.floor,status:p.status,text:p.text};}),runs:[]};}
    }
    function command(req) {
      try {
        if(req.cmd==='arm') {
          var c=context();if(c.fatal) throw Error(c.fatal);
          var slot=find(c,req), floor=req.floor, only=req.requireShiny!==false;
          var win=checkSlot(c,slot,floor,only);
          plans=plans.filter(function(p){return !(p.id===req.id && p.start===req.start);}).slice(-15);
          plans.push({id:req.id,start:req.start,bay:req.bay,account:c.account,floor:floor,requireShiny:only,
            signature:signature(c,slot,floor),open:win.open,close:win.close,status:'armed',text:'等待完成第 '+floor+' 层后召回'});
        } else if(req.cmd==='cancel') {
          plans.forEach(function(p){if(p.id===req.id && p.start===req.start && p.bay===req.bay && p.status==='armed')finish(p,'cancelled','已取消自动召回');});
        } else if(req.cmd!=='status') throw Error('未知探险控制命令');
        return {ok:true,live:snapshot()};
      } catch(e) {return {ok:false,text:e.message,live:snapshot()};}
    }
    return {tick:tick,snapshot:snapshot,command:command};
  }
  var installed=false;
  function install(access) {
    if(installed) return; installed=true;
    var engine=create({game:access.game,namespace:access.namespace,source:F.currentBundle,afterRecall:function(){
      var ns=access.namespace(), app=ns && ns.App;
      if(app && typeof app.refreshHeader==='function')app.refreshHeader();
      if(app && app.current==='underground' && ns.Screens && ns.Screens.underground && typeof ns.Screens.underground.render==='function')ns.Screens.underground.render();
    }}), last=0;
    function emit(name,data) {root.document.dispatchEvent(new CustomEvent(name,{detail:JSON.stringify(data)}));}
    root.addEventListener('pcg-cmd',function(ev){
      if(typeof ev.detail!=='string' || ev.detail.indexOf('underctl:')!==0) return;
      var req;try{req=JSON.parse(ev.detail.slice(9));}catch(e){return;}
      if(!req || typeof req.rid!=='string')return;
      var result=engine.command(req);result.rid=req.rid;emit('pcg-under-result',result);
    });
    root.setInterval(function(){engine.tick();if(Date.now()-last>=900){last=Date.now();emit('pcg-under-live',engine.snapshot());}},250);
  }
  root.PCG_UNDER_MAIN={create:create,windowFor:windowFor,install:install};
  if(typeof module!=='undefined' && module.exports)module.exports=root.PCG_UNDER_MAIN;
})(typeof window!=='undefined'?window:globalThis);
