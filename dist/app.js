'use strict';
const { steps, signals } = Care;
const $ = sel => document.querySelector(sel);
const main = $('#main'), dialog = $('#panel');
const state = {page:'home', openStep:Care.selected(), detail:null, live:null, timer:0, online:{mat:true,camera:true,reward:true}};
const devices = {mat:'感應墊',camera:'鏡頭',reward:'獎勵器'};
const icons = {
  home:'<path d="m3 11 9-7 9 7v9h-7v-6h-4v6H3z"/>',
  plan:'<path d="M4 4h7a3 3 0 0 1 2 1 3 3 0 0 1 2-1h5v15h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4z"/><path d="M12 6v13"/>',
  records:'<path d="M4 3v17h17M8 15v-3m5 3V7m5 8v-5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 11h18"/>',
  play:'<path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/>',
  check:'<path d="m5 12 4 4L19 6"/>', next:'<path d="m9 5 7 7-7 7"/>', down:'<path d="m5 9 7 7 7-7"/>',
  demo:'<rect x="3" y="4" width="18" height="14" rx="3"/><path d="M9 21h6m-3-3v3"/>',
  camera:'<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',
  mat:'<path d="m3 15 5-9h11l3 9-4 3H6zM3 15h19"/>',
  reward:'<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M3 9h18M12 8v12"/><path d="M12 8C4 10 5 0 9 4zm0 0c8 2 7-8 3-4z"/>',
  hand:'<path d="M7 13V7a1.5 1.5 0 0 1 3 0v5-8a1.5 1.5 0 0 1 3 0v8-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v8c0 4-2 7-6 7-3 0-5-2-7-5l-3-4c-1-2 1-3 3-2z"/>',
  stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>', close:'<path d="m5 5 14 14M19 5 5 19"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>', edit:'<path d="m4 16 11-11 4 4L8 20H4zM13 7l4 4"/>',
  replay:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>', link:'<path d="M8 16 16 8m-3-3 1-1a5 5 0 0 1 7 7l-4 4m-6 4-1 1a5 5 0 0 1-7-7l4-4"/>'
};
function ic(name){return '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">'+icons[name]+'</svg>'}
const paw='<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><ellipse cx="6.7" cy="13" rx="3" ry="4.4" transform="rotate(-25 6.7 13)"/><ellipse cx="13.2" cy="7.9" rx="3" ry="4.4"/><ellipse cx="20.7" cy="8.5" rx="3" ry="4.4" transform="rotate(12 20.7 8.5)"/><ellipse cx="26.1" cy="14.5" rx="2.8" ry="4.1" transform="rotate(25 26.1 14.5)"/><path d="M8 22c1-3 4-8 8-8s7 5 8 9c1 4-2 6-5 5-2-1-4-1-6 0-4 1-7-2-5-6z"/></svg>';
const photo = name=>'media/'+name+'.jpg';
const clock = sec=>String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
const findRecord=id=>Care.records().find(r=>r.id===id);
function btn(label,action,icon='',cls='button',args=''){return '<button type="button" class="'+cls+'" data-act="'+action+'" '+args+'>'+(icon?ic(icon):'')+label+'</button>'}
function tag(label,icon=''){return '<span class="tag">'+(icon?ic(icon):'')+label+'</span>'}
const navs = [['home','首頁'], ['plan','訓練'], ['records','紀錄']];
function header(){
  const online = Object.values(state.online).every(Boolean);
  const tab = navs.map(([key,label]) => {
    const active = state.page===key || (key==='records' && state.page==='detail');
    return btn(label,'nav',key,'tab'+(active?' active':''),'data-page="'+key+'" '+(active?'aria-current="page"':''));
  }).join('');
  const titles={plan:'擦藥練習',records:'訓練總覽',detail:'本次紀錄',live:state.live?steps[state.live.step].name:''};
  document.querySelector('.phone').dataset.screen=state.page;
  const back=state.page==='live'?btn('','finish','next','back','aria-label="結束並返回紀錄"'):btn('','nav','next','back','data-page="'+(state.page==='detail'?'records':'home')+'" aria-label="返回"');
  const menu=btn('示範','demo','','mode','aria-label="示範資料與展示控制"');
  $('#header').innerHTML=state.page==='home'
    ? '<div class="brand">'+paw+'安心爪護</div>'+menu
    : back+'<h1>'+titles[state.page]+'</h1>'+menu;
  $('#mobile-nav').innerHTML = state.page==='live'?'':tab;
}
function page(name){
  state.page=name; header(); main.scrollTop=0;
  if(name==='home') home();
  if(name==='plan') plan();
  if(name==='records') records();
  if(name==='detail') detail();
  if(name==='live') liveScreen();
  main.focus({preventScroll:true});
}
function title(name,tail=''){return '<div class="title-row"><h1>'+name+'</h1>'+tail+'</div>'}
function home(){
  const current=Care.selected();
  const online=Object.values(state.online).every(Boolean);
  main.innerHTML=`
    <section class="pet"><img src="${photo('chin')}" alt="糯米"><div><h1>糯米</h1>
      <button class="connection" data-act="devices"><i class="light ${online?'':'off'}"></i>護理站${online?'已連線':'訊號中斷'}</button></div></section>
    <div class="section-line"><h2>今日訓練</h2></div>
    <section class="task"><div class="task-body"><div class="between"><b><img class="task-icon" src="${photo('art-chin')}" alt="">擦藥練習</b><span>${current+1}／4</span></div>
      <progress value="${current+1}" max="4" aria-label="目前練習步驟"></progress></div>
      <button class="step-link" data-act="expand" data-i="${current}">${paw}<strong>${steps[current].name}</strong>${ic('next')}</button></section>
    ${btn('開始練習','start','play')}`;
}
function plan(){
  const choice=state.openStep;
  main.innerHTML='<div class="plan-list">'+steps.map((step,i)=>`
    <button class="plan-head ${i===choice?'chosen':''}" data-act="toggle-step" data-i="${i}" aria-pressed="${i===choice}">
      <span class="num">${i+1}</span><strong>${step.name}</strong>
      <span class="pick">${i===choice?ic('check'):''}</span></button>`).join('')+'</div>'+
    btn('開始練習','start','play','button','data-i="'+choice+'"');
}
const stepArt = ['step-on','art-chin','art-touch','wipe'];
const shortSteps = ['上墊','靠下巴','輕碰','擦拭'];
const eventVisual = {
  enter:['step-on','上墊'], chin:['art-chin','靠穩'], touch:['art-touch','輕碰'],
  wipe:['wipe','擦拭'], retreat:['art-retreat','退開'], struggle:['art-retreat','扭身'],
  exit:['exit','離墊'], reward:['reward','獎勵已發放'], end:['stop','停手'], lost:['link','斷線']
};
function visualFrame(asset,label){
  const visual=icons[asset]?ic(asset):'<img src="'+photo(asset)+'" alt="">';
  return '<span class="frame-image">'+visual+'</span><span>'+label+'</span>';
}
function lastReaction(record){
  const end=record.events.at(-1).k;
  if(end==='lost')return ['link','訊號中斷'];
  if(record.review?.discomfort)return ['art-retreat','觀察到不適'];
  if(Care.flagged(record))return ['art-retreat','疑似退縮'];
  if(record.events.some(e=>e.k==='struggle'))return ['art-retreat','疑似掙扎'];
  if(end==='end')return ['stop','已停手'];
  return [stepArt[record.step],'未見退縮'];
}
function recordTile(r,index,latest){
  const flagged=Care.flagged(r), struggle=r.events.some(e=>e.k==='struggle');
  const interrupted=r.events.some(e=>e.k==='lost'||e.k==='end');
  const caution=r.review?.discomfort;
  const tone=flagged?'retreated':interrupted?'interrupted':caution?'discomfort':'unmarked';
  const mark=flagged?'↶':interrupted?'Ⅱ':caution?'!':'✓';
  const label=[steps[r.step].name,'第 '+(index+1)+' 次',lastReaction(r)[1],struggle?'疑似掙扎':'',r.duration+' 秒'].filter(Boolean).join('，');
  const attrs='data-id="'+r.id+'" aria-label="'+label+'" title="'+label+'"';
  return btn(mark+(struggle?'<sup>≈</sup>':''),'detail','','session-tile '+tone+(latest?' newest':''),attrs);
}
function records(){
  const all=Care.records(), latest=all.at(-1), proposed=Care.nextStep(all), current=Care.selected();
  const [asset,reaction]=lastReaction(latest);
  const visual=icons[asset]?ic(asset):'<img src="'+photo(asset)+'" alt="">';
  const rows=steps.map((s,i)=>{
    const group=all.filter(r=>r.step===i);
    const tiles=group.map((r,j)=>recordTile(r,j,r.id===latest.id)).join('');
    return `<div class="matrix-row"><div class="motion-key"><img src="${photo(stepArt[i])}" alt=""><span>${shortSteps[i]}</span></div>
      <div class="tile-grid">${tiles||'<span class="no-sessions" aria-label="尚未練習">—</span>'}</div></div>`;
  }).join('');
  const extraKeys=[];
  if(all.some(r=>r.events.some(e=>e.k==='lost'||e.k==='end')&&!Care.flagged(r)))extraKeys.push('<span><i class="interrupted">Ⅱ</i>中斷</span>');
  if(all.some(r=>r.review?.discomfort&&!Care.flagged(r)))extraKeys.push('<span><i class="discomfort">!</i>不適</span>');
  main.innerHTML=`<div class="dashboard glyph-board">
    <button class="last-state" data-act="detail" data-id="${latest.id}"><span class="state-graphic">${visual}</span>
      <span class="state-label">最近一次<strong>${reaction}</strong></span>
      <span class="session-time">${ic('clock')}${latest.duration} 秒</span></button>
    <section class="viz-card session-map"><div class="viz-head"><h2>練習足跡</h2><span>${all.length} 次</span></div>
      ${rows}<div class="tile-legend"><span><i class="unmarked">✓</i>未標記退縮</span><span><i class="retreated">↶</i>疑似退縮</span><span><i class="struggle-key">≈</i>疑似掙扎</span>${extraKeys.join('')}</div></section>
    <section class="viz-card route-card"><div class="viz-head"><h2>下一步</h2><span>${current+1} → ${proposed+1}／4</span></div>
      <div class="route-images"><figure><img src="${photo(proposed===0?'step-on':stepArt[proposed>=2?1:0])}" alt=""><figcaption>${proposed>=2?'靠下巴':'上墊'}</figcaption></figure>
      ${ic('next')}<figure class="destination"><img src="${photo(stepArt[proposed])}" alt=""><figcaption>${steps[proposed].name}</figcaption></figure>
      ${ic('next')}<figure><span>${ic('reward')}</span><figcaption>獎勵器</figcaption></figure></div>
      ${btn('採用練習','adopt','check','button','data-i="'+proposed+'"')}</section>
    </div>`;
}
function openDetail(id){state.detail=id;page('detail')}
function detail(){
  const r=findRecord(state.detail); if(!r){page('records');return}
  const frames=r.events.map(e=>{
    const [asset,label]=eventVisual[e.k];
    return '<li class="event-frame '+(['retreat','struggle','lost'].includes(e.k)?'marked':'')+'" aria-label="'+clock(e.t)+' '+signals[e.k][0]+'，'+signals[e.k][1]+'"><time>'+clock(e.t)+'</time>'+visualFrame(asset,label)+'</li>';
  }).join('');
  const [asset,reaction]=lastReaction(r);
  const visual=icons[asset]?ic(asset):'<img src="'+photo(asset)+'" alt="">';
  main.innerHTML=`<div class="dashboard">
    <section class="last-state"><span class="state-graphic">${visual}</span><span class="state-label">${steps[r.step].name}<strong>${reaction}</strong></span><span class="session-time">${ic('clock')}${r.duration} 秒</span></section>
    <section class="viz-card"><div class="viz-head"><h2>動作回放</h2>${btn('重播','replay','replay','mini-replay')}</div><ol class="storyboard">${frames}</ol></section>
    ${btn('查看訓練總覽','nav','records','button','data-page="records"')}
    </div>`;
}
function showDialog(name,body){dialog.innerHTML='<div class="section-line"><h2 id="dialog-title">'+name+'</h2>'+btn('','close','close','close','aria-label="關閉視窗"')+'</div>'+body;if(!dialog.open)dialog.showModal()}
function closeDialog(){if(dialog.open)dialog.close()}
function stationPanel(){
  const rows=Object.entries(devices).map(([key,label])=>'<div class="device"><span>'+ic(key)+'<b>'+label+'</b></span><button data-act="switch" data-key="'+key+'" aria-pressed="'+!state.online[key]+'" aria-label="'+label+'，'+(state.online[key]?'已連線，模擬中斷':'已中斷，恢復連線')+'">'+(state.online[key]?'已連線':'已中斷')+'</button></div>').join('');
  showDialog('護理站連線狀態','<p>點選裝置可切換連線。</p><div class="device-list">'+rows+'</div>');
}
function demoPanel(){showDialog('示範設定','<p>預錄影像 · 模擬訊號</p>'+btn('護理站','devices','link','secondary')+btn('重設示範','reset','replay'))}
let noticeTimer;
function notice(text){$('#notice').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').textContent='',2200)}
function start(step,replay=null){
  if(!replay&&(!state.online.mat||!state.online.camera)){
    showDialog('訊號中斷，請先停手','<p>開始前請恢復感應墊和鏡頭的連線。</p>'+btn('查看護理站','devices','link'));return;
  }
  clearInterval(state.timer);
  const events=replay?replay.events.map(e=>({...e})):Care.sequence(step,8,step===2);
  state.live={step,replay,events,duration:replay?.duration??8,id:replay?.id??('run-'+Date.now()+'-'+Math.random().toString(36).slice(2,9)),at:Date.now(),second:0,start:performance.now(),rewardChecked:false,lastKey:'',video:false,cameraView:false};
  if(!replay){Care.select(step);state.openStep=step}
  page('live');
  const run=state.live;
  const video=$('#clip');
  if(video){video.addEventListener('error',()=>{video.hidden=true;run.video=false});video.play().then(()=>{if(state.live===run&&!video.error){run.video=true;video.hidden=false}}).catch(()=>{video.hidden=true});}
  state.timer=setInterval(tick,80);
  tick();
}
function defaultClip(r){return r.step===2&&r.events.some(e=>e.k==='retreat'&&e.t===6)&&r.duration===8&&!r.events.some(e=>e.k==='struggle')&&r.events.at(-1).k==='exit'}
function liveScreen(){
  const r=state.live;
  main.innerHTML='<div class="subhead">'+(r.replay?'重播 · ':'')+'第 '+(r.step+1)+' 步／共 4 步</div>'+
    '<div class="live-grid"><div class="camera-foot" id="signal" role="status"></div><section class="prompt" id="prompt"><div class="sign" id="sign"></div><h2 id="cue" aria-live="polite"></h2></section>'+
    '<div class="scene"><img id="still" src="'+photo('step-on')+'" alt="護理站預錄畫面">'+(defaultClip(r)?'<video id="clip" src="media/station.webm" muted playsinline preload="auto" hidden></video>':'')+
    '<img id="art" alt="糯米的動作"><span class="reward-receipt" id="receipt" role="status"></span><span class="clock" id="elapsed">00:00</span></div>'+
    '<button class="view-switch" data-act="camera-view">'+ic('camera')+'看鏡頭</button>'+
    '<div class="actions" id="live-actions"></div></div>';
  updateLive();
}
function updateLive(){
  const r=state.live; if(!r)return;
  const seen=r.events.filter(e=>e.t<=r.second);
  const movement=seen.filter(e=>!['reward','end','exit','lost'].includes(e.k)).at(-1)?.k||'enter';
  const caution=['retreat','struggle'].includes(movement);
  const image={enter:'step-on',chin:'chin',touch:'contact',wipe:'wipe',retreat:'retreat',struggle:'retreat'}[movement];
  $('#still').src=photo(image);
  const art=$('#art');
  art.src=photo(caution?'art-retreat':r.step===0&&movement==='enter'?'step-on':movement==='enter'||movement==='chin'?'art-chin':movement==='wipe'?'wipe':'art-touch');
  art.hidden=r.cameraView;
  const cues={enter:r.step===0?'讓糯米自行停留':'等糯米靠穩下巴',chin:['','等糯米停留','輕碰一下皮毛','輕輕模擬擦拭'][r.step],touch:'觀察糯米',wipe:'觀察糯米',retreat:'先移開手',struggle:'先移開手'};
  const readings={enter:[['mat','已上墊']],chin:[['camera','下巴靠穩'],['mat','停留中']],touch:[['camera','接觸皮毛']],wipe:[['camera','棉片接觸']],retreat:[['camera','頭部後移'],['mat','重心後移']],struggle:[['camera','軀幹扭動'],['mat','墊壓波動']]};
  $('#prompt').classList.toggle('warn',caution);
  $('#sign').innerHTML=ic(caution?'hand':'check');
  $('#cue').textContent=cues[movement];
  $('#signal').innerHTML=readings[movement].map(([source,label])=>'<span aria-label="'+devices[source]+'：'+label+'">'+ic(source)+label+'</span>').join('');
  const dispensed=seen.some(e=>e.k==='reward');
  $('#receipt').innerHTML=dispensed?ic('reward')+'獎勵已發放':'';
  $('#live-actions').innerHTML=btn(r.replay?'結束重播':'結束練習','finish','stop','stop-btn');
}
// In the demo the dispenser acknowledges the first matching sensor event.
function settleDispenser(run,second){
  if(run.replay||run.rewardChecked)return;
  const target=['enter','chin','touch','wipe'][run.step];
  const trigger=run.events.find(e=>e.k===target && e.t<=second);
  if(!trigger)return;
  run.rewardChecked=true;
  const stopped=run.events.some(e=>e.t<=trigger.t && ['retreat','struggle','lost','exit'].includes(e.k));
  if(stopped||!Object.values(state.online).every(Boolean))return;
  run.events.splice(run.events.indexOf(trigger)+1,0,Care.ev(trigger.t,'reward'));
}
function tick(){
  const r=state.live;if(!r)return;
  const elapsed=(performance.now()-r.start)/1000;
  const clip=$('#clip');
  if(r.video&&clip&&!clip.seeking&&Math.abs(clip.currentTime-elapsed)>.32&&elapsed<8){try{clip.currentTime=elapsed}catch{}}
  // While a decoder catches up at a cut, show the matching local still.
  if(r.video&&clip){
    const phase=t=>t>=7.75?4:t>=6?3:t>=5?2:t>=3?1:0;
    clip.hidden=phase(clip.currentTime)!==phase(elapsed);
    if(elapsed>=7.75)$('#still').src=photo('exit');
  }
  r.second=Math.min(r.duration,Math.floor(elapsed));$('#elapsed').textContent=clock(r.second);
  settleDispenser(r,r.second);
  if(r.second>=r.duration){finish();return}
  const key=r.events.filter(e=>e.t<=r.second).map(e=>e.k).join('/');
  if(r.lastKey!==key){r.lastKey=key;updateLive()}
}
function finish(reason){
  const r=state.live;if(!r)return;
  clearInterval(state.timer);state.live=null;closeDialog();
  if(r.replay){openDetail(r.replay.id);return}
  const time=reason?Math.min(r.duration,Math.floor((performance.now()-r.start)/1000)):r.duration;
  settleDispenser(r,time);
  const events=r.events.filter(e=>e.t<=time&&(!reason||e.k!=='exit'));
  if(reason)events.push(Care.ev(time,reason));
  Care.save({id:r.id,step:r.step,at:r.at,duration:time,events});openDetail(r.id);
  if(!reason)notice('糯米已離墊');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act, i=Number(b.dataset.i);
  if(a==='nav')page(b.dataset.page);
  if(a==='expand'){state.openStep=i;page('plan')}
  if(a==='toggle-step'){state.openStep=i;plan();main.querySelector('[data-i="'+i+'"]').focus({preventScroll:true})}
  if(a==='start')start(b.hasAttribute('data-i')?i:Care.selected());
  if(a==='detail')openDetail(b.dataset.id);
  if(a==='replay'){const r=findRecord(state.detail);if(r)start(r.step,r)}
  if(a==='adopt'){Care.select(i);state.openStep=i;page('home');notice('下次練習已更新')}
  if(a==='camera-view' && state.live){
    state.live.cameraView=!state.live.cameraView;
    $('#art').hidden=state.live.cameraView;
    b.innerHTML=ic('camera')+(state.live.cameraView?'看動作':'看鏡頭');
  }
  if(a==='finish')finish('end');
  if(a==='devices')stationPanel();
  if(a==='demo')demoPanel();
  if(a==='close')closeDialog();
  if(a==='switch'){
    const k=b.dataset.key;
    if(state.live)tick();
    state.online[k]=!state.online[k];
    if(state.live&&!state.live.replay&&!state.online[k]&&k!=='reward'){
      finish('lost');showDialog('訊號中斷，請先停手','<p>'+devices[k]+'已中斷。當次練習已停止並儲存。</p>'+btn('查看本次紀錄','close','check'));
    }else{header();if(state.live)updateLive();stationPanel()}
  }
  if(a==='reset'){clearInterval(state.timer);state.live=null;Care.reset();state.openStep=2;Object.keys(devices).forEach(k=>state.online[k]=true);closeDialog();page('home');notice('已還原 17 筆示範紀錄')}
});
dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeDialog()}});
window.addEventListener('storage',()=>{if(!state.live&&!dialog.open){if(state.page==='detail'&&!findRecord(state.detail))page('records');else page(state.page)}});
page('home');
if(!Care.durable)notice('本次示範紀錄會保留至關閉頁面');

