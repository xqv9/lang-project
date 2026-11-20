/* Shared demonstration scenarios, observations, and on-device records. */
const Care = (() => {
  const steps = [
    {name:'自主上墊', photo:'step-on', action:'讓糯米自己走上護理墊。', stop:'牠轉身離開時，留出空間讓牠走。'},
    {name:'靠穩下巴', photo:'chin', action:'把引導座放在糯米面前，等牠自己把下巴靠上去。', stop:'牠抬頭時，讓牠離開引導座。'},
    {name:'短暫接觸', photo:'contact', action:'糯米靠穩、仍願意停留時，輕碰一下皮毛。', stop:'牠縮身或後移時，立即移開手。'},
    {name:'模擬擦拭', photo:'wipe', action:'糯米接受短暫接觸後，用乾棉片輕輕模擬一次擦拭。', stop:'牠一退開便收起棉片，結束這次練習。'}
  ];
  const signals = {
    enter:['自主上墊','感應墊','墊面受壓，開始計時。'],
    chin:['下巴靠穩','鏡頭・感應墊','下巴靠近引導座，墊面持續受壓。'],
    touch:['短暫接觸','鏡頭','飼主的手輕碰皮毛。'],
    wipe:['模擬擦拭','鏡頭','棉片短暫接觸皮毛。'],
    retreat:['疑似退縮','鏡頭・感應墊','鏡頭錄到頭部後移，感應墊錄到重心後移。'],
    struggle:['疑似掙扎','鏡頭・感應墊','軀幹反覆扭動，墊壓來回波動。'],
    exit:['自行離墊','感應墊','墊壓回落，停留計時結束。'],
    reward:['已發放獎勵','飼主・獎勵器','飼主按鍵確認，獎勵器回報已發放一份零食。'],
    end:['飼主結束練習','飼主','已儲存截至停手時收到的訊號。'],
    lost:['訊號中斷','護理站','已暫停動作建議並結束記錄。']
  };
  const ev = (t,k) => ({t,k});
  function sequence(step, duration, retreat, struggle = false) {
    const events = [ev(0,'enter')];
    if (step >= 1) events.push(ev(3,'chin'));
    if (step >= 2) events.push(ev(5,step === 2 ? 'touch' : 'wipe'));
    if (retreat) events.push(ev(duration-2,'retreat'));
    if (struggle) events.push(ev(duration-1,'struggle'));
    events.push(ev(duration,'exit'));
    return events;
  }
  function seed() {
    const result = [];
    [6,6,5].forEach((count,step) => {
      for (let i=0; i<count; i++) {
        const retreat = step === 1 && i === 2 || step === 2 && [0,2,3].includes(i);
        const duration = [10,12,9,8,11,13][i];
        const events = sequence(step,duration,retreat,step === 2 && [0,3].includes(i));
        if (!retreat) events.splice(-1,0,ev(duration-1,'reward'));
        const date = new Date(2026,10,5 + result.length - Math.floor(result.length/5),18,30);
        result.push({id:'seed-'+(result.length+1),step,at:date.getTime(),duration,events});
      }
    });
    return result;
  }
  const prefix = 'pawchoice-care-v1/';
  const memory = new Map();
  let store;
  try { store=window.localStorage; store.setItem(prefix+'check','1'); store.removeItem(prefix+'check'); }
  catch { store=null; }
  const data = {
    keys() { return store ? Object.keys(store) : [...memory.keys()]; },
    get(key) { const raw=store ? store.getItem(prefix+key) : memory.get(prefix+key); return raw ? JSON.parse(raw) : null; },
    set(key,value) { const raw=JSON.stringify(value); if(store) store.setItem(prefix+key,raw); else memory.set(prefix+key,raw); },
    remove(key) { if(store) store.removeItem(prefix+key); else memory.delete(prefix+key); }
  };
  function records() {
    const all=new Map(seed().map(r=>[r.id,r]));
    for (const key of data.keys()) if(key.startsWith(prefix+'log/')) {
      const r=data.get(key.slice(prefix.length));
      if(r && steps[r.step] && Array.isArray(r.events)) all.set(r.id,r);
    }
    return [...all.values()].sort((a,b)=>a.at-b.at || a.id.localeCompare(b.id));
  }
  function reset() {
    for(const key of data.keys()) if(key.startsWith(prefix)) data.remove(key.slice(prefix.length));
  }
  const flagged = r => r.review?.retreat ?? r.events.some(e=>e.k==='retreat');
  function nextStep(all) {
    const latest=all.at(-1);
    if(!latest) return 0;
    const step=latest.step, group=all.filter(r=>r.step===step), count=group.filter(flagged).length;
    return (latest.review?.discomfort || flagged(latest) || count > group.length/2) ? Math.max(0,step-1) : step;
  }
  return {steps,signals,ev,sequence,records,flagged,nextStep,reset,
    save:r=>data.set('log/'+r.id,r), selected:()=>data.get('selected') ?? 2,
    select:i=>data.set('selected',i), durable:!!store};
})();
