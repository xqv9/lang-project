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
const fmt = (at,opts)=>new Intl.DateTimeFormat('zh-HK',opts).format(new Date(at));
const dateShort=at=>fmt(at,{month:'numeric',day:'numeric'});
const stamp=at=>dateShort(at)+' · '+fmt(at,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const findRecord=id=>Care.records().find(r=>r.id===id);
function btn(label,action,icon='',cls='button',args=''){return '<button type="button" class="'+cls+'" data-act="'+action+'" '+args+'>'+(icon?ic(icon):'')+label+'</button>'}
function tag(label,icon=''){return '<span class="tag">'+(icon?ic(icon):'')+label+'</span>'}
const navs=[['home','今天'],['plan','練習計劃'],['records','紀錄']];
function header(){
  const focus=state.page==='live';
  const tab=navs.map(([key,name])=>btn(name,'nav',key,'tab'+(state.page===key||key==='records'&&state.page==='detail'?' active':''),'data-page="'+key+'" '+(state.page===key?'aria-current="page"':''))).join('');
  const online=Object.values(state.online).every(Boolean);
  $('#header').innerHTML='<div class="bar"><div class="brand"><span class="brand-mark">'+paw+'</span>PawChoice</div>'+(!focus?'<nav class="tabs" aria-label="主導覽">'+tab+'</nav>':'')+'<div class="bar-tools">'+btn('示範資料','demo','demo','mode','aria-label="示範資料與展示控制"')+btn('<i class="light '+(online?'':'off')+'"></i>護理站<span class="long">'+(online?'已連線':'訊號中斷')+'</span>','devices','','status','aria-label="查看護理站連線狀態"')+'</div></div>';
  $('#mobile-nav').innerHTML=focus?'':tab;
}
function page(name){
  state.page=name; header(); window.scrollTo(0,0);
  if(name==='home') home();
  if(name==='plan') plan();
  if(name==='records') records();
  if(name==='detail') detail();
  if(name==='live') liveScreen();
  main.focus({preventScroll:true});
}
function title(name,tail=''){return '<div class="title-row"><h1>'+name+'</h1>'+tail+'</div>'}
function home(){
  const current=Care.selected(), all=Care.records();
  const latest=all.slice(-2).reverse().map(r=>'<button class="entry" data-act="detail" data-id="'+r.id+'"><img src="'+photo(steps[r.step].photo)+'" alt=""><span><strong>'+steps[r.step].name+'</strong><span class="meta">'+stamp(r.at)+' · '+r.duration+' 秒'+(Care.flagged(r)?' · 疑似退縮':'')+'</span></span><span class="end-icon">'+ic('next')+'</span></button>').join('');
  const path=steps.map((s,i)=>'<button class="path-item '+(i===current?'active':'')+'" data-act="expand" data-i="'+i+'"><span class="circle">'+(i+1)+'</span>'+s.name+(i===current?'<span class="current">本次練習</span>':'')+'</button>').join('');
  main.innerHTML=title('糯米的今天','<span class="date">'+ic('calendar')+fmt(Date.now(),{month:'long',day:'numeric',weekday:'short'})+'</span>')+
    '<section class="hero"><div class="hero-copy"><div class="eyebrow">'+ic('plan')+'擦藥前練習</div><h2>'+steps[current].name+'</h2><div class="hero-step"><span class="steps-mini" aria-hidden="true">'+steps.map((_,i)=>'<i class="'+(i===current?'now':i<current?'past':'')+'"></i>').join('')+'</span>第 '+(current+1)+' 步，共 4 步</div>'+btn('開始練習','start','play')+'</div><div class="hero-photo"><img src="'+photo('step-on')+'" alt="糯米走近家中的感應護理墊和下巴引導座"><span class="tag photo-tag">'+ic('camera')+'糯米的護理站</span></div></section>'+
    '<div class="home-lower"><section class="box"><div class="section-line"><h2>最近紀錄</h2>'+btn('查看全部','nav','','nav-link','data-page="records"')+'</div>'+latest+'</section><section class="box"><div class="section-line"><h2>練習計劃</h2>'+btn('查看計劃','nav','','nav-link','data-page="plan"')+'</div><div class="path-list">'+path+'</div></section></div>';
}
function plan(){
  main.innerHTML=title('練習計劃',tag('擦藥前練習','plan'))+'<div class="plan-list">'+steps.map((s,i)=>{
    const open=i===state.openStep;
    return '<section class="plan-row"><button class="plan-head" data-act="toggle-step" data-i="'+i+'" aria-expanded="'+open+'"><img src="'+photo(s.photo)+'" alt=""><span class="num">0'+(i+1)+'</span><b>'+s.name+'</b>'+(i===Care.selected()?tag('本次'):'')+'<span class="end-icon">'+ic(open?'down':'next')+'</span></button>'+(open?'<div class="plan-body"><p>'+s.action+'</p><p>'+s.stop+'</p>'+btn('練習這一步','start','play','button','data-i="'+i+'"')+'</div>':'')+'</section>';
  }).join('')+'</div>';
}
function records(){
  const all=Care.records(), proposed=Care.nextStep(all), last=all.at(-1);
  const count=all.filter(r=>r.step===last.step).length, flagged=all.filter(r=>r.step===last.step&&Care.flagged(r)).length;
  main.innerHTML=title('各步反應',tag(all.length+' 次練習','records'))+'<div class="records-grid"><section><div class="legend"><span><i></i>未標記退縮</span><span><i class="flag">!</i>疑似退縮</span></div><div class="record-list">'+steps.map((s,i)=>{
    const group=all.filter(r=>r.step===i);
    return '<section class="record-row"><h3>'+s.name+'</h3>'+(group.length?'<div class="dots">'+group.map((r,j)=>'<button class="dot '+(Care.flagged(r)?'flag':'')+'" data-act="detail" data-id="'+r.id+'" aria-label="'+s.name+'，第 '+(j+1)+' 次，'+(Care.flagged(r)?'疑似退縮':'未標記退縮')+'"><i>'+ (Care.flagged(r)?'!':'')+'</i></button>').join('')+'</div><strong class="tally">'+group.filter(Care.flagged).length+'／'+group.length+'</strong>':'<span class="empty">尚未練習</span>')+'</section>';
  }).join('')+'</div></section><aside class="suggestion"><h2>下次先練</h2><h3>'+steps[proposed].name+'</h3><p>'+steps[last.step].name+'的 '+count+' 次練習中，'+flagged+' 次標記了疑似退縮。'+(proposed<last.step?'先回到較熟悉的動作，等糯米願意再次靠近。':last.review?.discomfort?'下次由自主上墊開始，讓糯米選擇是否靠近。':'下次先重溫這個動作，觀察糯米是否願意繼續。')+'</p>'+btn('採用下次練習','adopt','check','button','data-i="'+proposed+'"')+'</aside></div>';
}
function openDetail(id){state.detail=id;page('detail')}
function detail(){
  const r=findRecord(state.detail); if(!r){page('records');return}
  const last=r.events.at(-1).k, ended=last==='exit'?'糯米已離墊':last==='lost'?'護理站訊號中斷':'飼主已結束練習';
  const timeline=r.events.map(e=>{const [name,src,desc]=signals[e.k];return '<li class="'+(['retreat','struggle','lost'].includes(e.k)?'alert':'')+'"><time>'+clock(e.t)+'</time><div><b>'+name+'</b><span class="source">'+src+'</span><p>'+desc+'</p></div></li>'}).join('');
  const review=r.review ? '<p class="review-note">飼主覆核 · '+(Care.flagged(r)?'保留疑似退縮':'未見退縮')+(r.review.discomfort?' · 觀察到不適':'')+'</p>':'';
  main.innerHTML=title('本次紀錄',tag(steps[r.step].name))+'<div class="summary"><div><strong>'+ended+'</strong><div class="status-line saved">'+ic('check')+'本次練習已記錄</div></div><span class="time">'+r.duration+' 秒</span></div><div class="detail-grid"><section class="detail-box"><div class="section-line"><h2>事件時間線</h2><span class="meta">'+stamp(r.at)+'</span></div><ol class="timeline">'+timeline+'</ol></section><aside class="side-stack"><section class="detail-box"><h2>糯米的反應</h2><p class="review-note">'+(Care.flagged(r)?'本次已標記疑似退縮。':'本次未標記疑似退縮。')+'</p>'+review+btn('補記或更正觀察','review','edit','secondary')+'</section>'+btn('查看各步反應','nav','records','button','data-page="records"')+btn('重播本次紀錄','replay','replay','secondary')+'</aside></div>';
}
function showDialog(name,body){dialog.innerHTML='<div class="section-line"><h2 id="dialog-title">'+name+'</h2>'+btn('','close','close','close','aria-label="關閉視窗"')+'</div>'+body;if(!dialog.open)dialog.showModal()}
function closeDialog(){if(dialog.open)dialog.close()}
function stationPanel(){
  const rows=Object.entries(devices).map(([key,label])=>'<div class="device"><span>'+ic(key)+'<b>'+label+'</b></span><button data-act="switch" data-key="'+key+'" aria-pressed="'+!state.online[key]+'" aria-label="'+label+'，'+(state.online[key]?'已連線，模擬中斷':'已中斷，恢復連線')+'">'+(state.online[key]?'已連線':'已中斷')+'</button></div>').join('');
  showDialog('護理站連線狀態','<p>點選連線狀態可模擬訊號中斷。</p><div class="device-list">'+rows+'</div>');
}
function demoPanel(){showDialog('展示控制','<p>糯米的練習使用預錄影像與模擬訊號。重設後會回到 17 筆紀錄及「短暫接觸」。</p>'+btn('重設示範','reset','replay'))}
function reviewPanel(){
  const r=findRecord(state.detail); if(!r)return;
  showDialog('飼主觀察','<form class="review-form" id="review-form"><label><input name="retreat" type="checkbox" '+(Care.flagged(r)?'checked':'')+'>本次有疑似退縮</label><label><input name="discomfort" type="checkbox" '+(r.review?.discomfort?'checked':'')+'>我觀察到糯米不適</label><button class="button" type="submit">儲存觀察</button></form>');
}
let noticeTimer;
function notice(text){$('#notice').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').textContent='',2200)}
function start(step,replay=null){
  if(!replay&&(!state.online.mat||!state.online.camera)){
    showDialog('訊號中斷，請先停手','<p>開始前請恢復感應墊和鏡頭的連線。</p>'+btn('查看護理站','devices','link'));return;
  }
  clearInterval(state.timer);
  const events=replay?replay.events.map(e=>({...e})):Care.sequence(step,8,step===2);
  state.live={step,replay,events,duration:replay?.duration??8,id:replay?.id??('run-'+Date.now()+'-'+Math.random().toString(36).slice(2,9)),at:Date.now(),second:0,start:performance.now(),rewarded:false,lastKey:'',video:false};
  if(!replay)Care.select(step);
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
  main.innerHTML=title(r.replay?'紀錄重播':'練習中',tag(steps[r.step].name))+'<div class="live-grid"><section class="camera"><div class="scene"><img id="still" src="'+photo('step-on')+'" alt="糯米在護理站的示範畫面">'+(defaultClip(r)?'<video id="clip" src="media/station.webm" muted playsinline preload="auto" hidden aria-label="糯米的八秒預錄示範"></video>':'')+'<span class="cam-label">'+ic('camera')+'護理站鏡頭</span><span class="clock" id="elapsed">00:00</span></div><div class="camera-foot" id="signal"></div></section><section class="prompt" id="prompt"><div class="sign" id="sign"></div><h2 id="cue" aria-live="polite"></h2><p id="why"></p><div class="actions" id="live-actions"></div></section></div>';
  updateLive();
}
function updateLive(){
  const r=state.live; if(!r)return;
  const seen=r.events.filter(e=>e.t<=r.second);
  const movement=seen.filter(e=>!['reward','end','exit','lost'].includes(e.k)).at(-1)?.k||'enter';
  const caution=['retreat','struggle'].includes(movement);
  const image={enter:'step-on',chin:'chin',touch:'contact',wipe:'wipe',retreat:'retreat',struggle:'retreat'}[movement];
  $('#still').src=photo(image);
  const ready=r.step===0||r.step===1&&movement==='chin'||r.step===2&&movement==='touch'||r.step===3&&movement==='wipe';
  let headline='等糯米靠穩下巴',why='糯米已自主上墊。';
  if(r.step===0){headline='讓糯米自行停留';why='糯米已踏上感應墊。'}
  if(movement==='chin'){headline=['','讓糯米靠穩下巴','輕碰一下皮毛','輕輕模擬擦拭'][r.step];why=r.step===1?'糯米已靠穩，看看牠是否願意停留。':'牠仍願意停留時，才進行這個動作。';}
  if(movement==='touch'||movement==='wipe'){headline='觀察糯米的反應';why=movement==='touch'?'已短暫接觸皮毛。':'已完成一次模擬擦拭。';}
  if(caution){headline='先移開手';why=movement==='retreat'?'糯米正在退開':'糯米正在扭身';}
  $('#prompt').classList.toggle('warn',caution);$('#sign').innerHTML=ic(caution?'hand':'mat');
  $('#cue').textContent=headline;$('#why').textContent=why;
  $('#signal').innerHTML=ic(caution?'hand':'link')+'<span>'+({enter:'感應墊 · 墊面受壓',chin:'鏡頭 · 下巴靠穩　感應墊 · 持續受壓',touch:'鏡頭 · 手接觸皮毛',wipe:'鏡頭 · 棉片接觸皮毛',retreat:'鏡頭 · 頭部後移　感應墊 · 重心後移',struggle:'鏡頭 · 軀幹扭動　感應墊 · 墊壓波動'}[movement])+'</span>';
  const reward=!r.replay&&ready&&!caution?btn(r.rewarded?'已發放獎勵':state.online.reward?'確認並給獎勵':'獎勵器已中斷','reward','reward','button',r.rewarded||!state.online.reward?'disabled':''):'';
  $('#live-actions').innerHTML=reward+btn(r.replay?'結束重播':'結束練習','finish','stop','stop-btn');
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
  if(r.second>=r.duration){finish();return}
  const key=r.events.filter(e=>e.t<=r.second).map(e=>e.k).join('/')+r.rewarded;
  if(r.lastKey!==key){r.lastKey=key;updateLive()}
}
function finish(reason){
  const r=state.live;if(!r)return;
  clearInterval(state.timer);state.live=null;closeDialog();
  if(r.replay){openDetail(r.replay.id);return}
  const time=reason?Math.min(r.duration,Math.floor((performance.now()-r.start)/1000)):r.duration;
  const events=r.events.filter(e=>e.t<=time&&(!reason||e.k!=='exit'));
  if(reason)events.push(Care.ev(time,reason));
  Care.save({id:r.id,step:r.step,at:r.at,duration:time,events});openDetail(r.id);
}
function reward(){
  const r=state.live;if(!r||r.replay||r.rewarded||!state.online.reward)return;
  tick();if(!state.live)return;
  const control=$('[data-act="reward"]');if(!control||control.disabled)return;
  r.events.push(Care.ev(r.second,'reward'));r.events.sort((a,b)=>a.t-b.t);r.rewarded=true;updateLive();notice('獎勵器已發放一份零食');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act, i=Number(b.dataset.i);
  if(a==='nav')page(b.dataset.page);
  if(a==='expand'){state.openStep=i;page('plan')}
  if(a==='toggle-step'){state.openStep=state.openStep===i?-1:i;plan();main.querySelector('[data-i="'+i+'"]').focus({preventScroll:true})}
  if(a==='start')start(b.hasAttribute('data-i')?i:Care.selected());
  if(a==='detail')openDetail(b.dataset.id);
  if(a==='replay'){const r=findRecord(state.detail);if(r)start(r.step,r)}
  if(a==='adopt'){Care.select(i);state.openStep=i;page('home');notice('下次練習已更新')}
  if(a==='reward')reward();
  if(a==='finish')finish('end');
  if(a==='review')reviewPanel();
  if(a==='devices')stationPanel();
  if(a==='demo')demoPanel();
  if(a==='close')closeDialog();
  if(a==='switch'){
    const k=b.dataset.key;state.online[k]=!state.online[k];
    if(state.live&&!state.live.replay&&!state.online[k]&&k!=='reward'){
      finish('lost');showDialog('訊號中斷，請先停手','<p>'+devices[k]+'已中斷。當次練習已停止並儲存。</p>'+btn('查看本次紀錄','close','check'));
    }else{header();if(state.live)updateLive();stationPanel()}
  }
  if(a==='reset'){clearInterval(state.timer);state.live=null;Care.reset();state.openStep=2;Object.keys(devices).forEach(k=>state.online[k]=true);closeDialog();page('home');notice('已還原 17 筆示範紀錄')}
});
dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeDialog()}});
document.addEventListener('submit',e=>{
  if(e.target.id!=='review-form')return;
  e.preventDefault();const r=findRecord(state.detail);if(!r)return;
  r.review={retreat:e.target.elements.retreat.checked,discomfort:e.target.elements.discomfort.checked};Care.save(r);closeDialog();detail();notice('飼主觀察已儲存');
});
window.addEventListener('storage',()=>{if(!state.live&&!dialog.open){if(state.page==='detail'&&!findRecord(state.detail))page('records');else page(state.page)}});
page('home');
if(!Care.durable)notice('本次示範紀錄會保留至關閉頁面');

