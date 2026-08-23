/* ==================================================================
   BERMITO — THE DESCENT (driver)
   Owns: loader, scroll → progress, story beat overlays, the circle
   wipe at the set cut, the roast gauge, and every fallback path.
   ================================================================== */

const C = window.BERMITO_CONTENT;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const $ = (s, r) => (r || document).querySelector(s);
const clamp = (v,a,b)=>v<a?a:v>b?b:v;
const ramp = (x,a,b)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

/* ---------------------------------------------------------------
   link wiring (same contract as the classic page)
---------------------------------------------------------------- */
for (const a of document.querySelectorAll('[data-link]')){
  const url = (C.links||{})[a.getAttribute('data-link')];
  if (url){ a.href=url; a.target='_blank'; a.rel='noopener'; }
  else if (a.hasAttribute('data-optional')) a.remove();
}

/* ---------------------------------------------------------------
   story beats — the film's voice-over, built from brandStory.js
   Each beat: [start, end, placement, eyebrow, title, body lines]
---------------------------------------------------------------- */
const ch = C.chapters;
const BEATS = [
  [0.008,0.125,'low beat--title','BERMITO — KOZHIKODE, KERALA',
    'FROM THE MARK\nTO THE CUP', ['One object. The whole journey of a coffee.']],
  [0.155,0.27,'left',  'CHAPTER 01', ch[0].title, ch[0].body],
  [0.315,0.435,'right','CHAPTER 02 — AT ORIGIN', ch[2].title, ch[2].body],
  [0.49,0.565,'left',  'CHAPTER 03 — 11.2588° N, 75.7804° E', ch[1].title, ch[1].body],
  [0.585,0.645,'right','CHAPTER 04', ch[3].title, ch[3].body],
  [0.658,0.682,'center beat--title','204 °C','FIRST\nCRACK',[]],
  [0.845,0.975,'right','CHAPTER 05', ch[4].title, ch[4].body],
];

const beatsRoot = $('#beats');
const beatEls = BEATS.map(([a,b,place,eyebrow,title,body])=>{
  const el=document.createElement('article');
  el.className='beat '+place.split(' ').map(p=>p.startsWith('beat--')?p:'beat--'+p).join(' ');
  el.innerHTML =
    `<p class="beat__eyebrow">${eyebrow}</p><h2>${title}</h2>`+
    body.map(p=>`<p>${p}</p>`).join('');
  beatsRoot.appendChild(el);
  return {a,b,el};
});

/* ---------------------------------------------------------------
   HUD stages
---------------------------------------------------------------- */
const STAGES=[
  [0.00,'THE MARK','/ 01','KOZHIKODE · 11.2588° N 75.7804° E'],
  [0.20,'THE BEAN','/ 02','GREEN · UNROASTED'],
  [0.47,'THE ROAST','/ 03','204 °C AND CLIMBING'],
  [0.655,'FIRST CRACK','/ 04',''],
  [0.74,'THE CUP','/ 05','LIVE THROUGH COFFEE'],
];

/* ---------------------------------------------------------------
   boot with fallbacks
---------------------------------------------------------------- */
function supportsWebGL(){
  try{ const c=document.createElement('canvas');
    return !!(c.getContext('webgl2')||c.getContext('webgl')); }
  catch(e){ return false; }
}

function bail(){
  // No WebGL or reduced motion: no film. Offer the classic story,
  // keep this page's finale + footer usable.
  document.body.classList.add('no-descent');
  document.body.classList.remove('is-loading');
  const note=document.createElement('p');
  note.className='finale__fallbacknote';
  note.style.cssText='order:-1;opacity:.75;font-size:.9rem;max-width:44ch';
  note.innerHTML='The full animated descent is switched off here — '+
    (reduced.matches?'your system asks for reduced motion':'this browser can’t run it')+
    '. <a href="classic.html" style="color:var(--yellow)">Read the full story instead →</a>';
  $('.finale').prepend(note);
}

if (reduced.matches || !supportsWebGL()){
  bail();
} else {
  start();
}

async function start(){
  const canvas=$('#gl');
  let exp;
  try{
    const mod=await import('./experience.js');
    exp=mod.createExperience({canvas});
  }catch(err){
    console.error('descent failed to build:', err);
    bail(); return;
  }

  /* --- loader: real readiness, capped wait ----------------------- */
  const pctEl=$('#loaderPct'), marks=[...document.querySelectorAll('.loader__mark i')];
  const loader=$('#loader');
  let ready=false;
  const jobs=[document.fonts?.ready||Promise.resolve()];
  Promise.all(jobs).then(()=>{ready=true;});

  const t0=performance.now();
  const MIN=reduced.matches?0:1600, MAX=5200;
  let shown=0, ended=false;

  await new Promise(res=>{
    (function tick(){
      const el=performance.now()-t0;
      const target=Math.max(ready?1:0, Math.min(el/MIN,.92));
      shown+=(target-shown)*.1;
      if(el>MAX) shown=1;
      pctEl.textContent=Math.round(shown*100);
      marks.forEach((m,i)=>m.classList.toggle('is-on', shown*4>i));
      if((shown>=.995&&ready&&el>=MIN)||el>MAX+300) return res();
      requestAnimationFrame(tick);
    })();
    $('#skipIntro').addEventListener('click', res, {once:true});
  });
  loader.classList.add('is-done');
  document.body.classList.remove('is-loading');
  setTimeout(()=>loader.remove(), 900);

  /* --- scroll rig ------------------------------------------------ */
  const track=$('#track');
  const hudStage=$('#hudStage'), hudIndex=$('#hudIndex'), hudCoord=$('#hudCoord');
  const hint=$('#hudHint');
  const gauge=[...document.querySelectorAll('#gauge li')];
  const descentEl=$('#descent');
  let target=0, eased=0, last=performance.now();

  function readScroll(){
    const travel=track.offsetHeight-innerHeight;
    target=clamp(scrollY/travel,0,1);
  }
  addEventListener('scroll', readScroll, {passive:true});

  function frame(now){
    const dt=Math.min((now-last)/1000,.05); last=now;
    eased+=(target-eased)*Math.min(1,dt*4.5);
    const p=eased;

    exp.update(p, dt);

    /* beats */
    for(const b of beatEls) b.el.classList.toggle('is-on', p>=b.a&&p<=b.b);

    /* HUD + ink: dark text on the light acts, light on the brown act */
    descentEl.dataset.ink = (p>.72 || (p>.63&&p<.7)) ? 'paper' : 'brown';
    let st=STAGES[0];
    for(const s of STAGES){ if(p>=s[0]) st=s; }
    if(hudStage.textContent!==st[1]){ hudStage.textContent=st[1]; hudIndex.textContent=st[2]; hudCoord.textContent=st[3]; }
    hint.classList.toggle('is-hidden', p>.03);

    /* roast gauge — the five-circle roast-level indicator */
    gauge.forEach((g,i)=>g.classList.toggle('is-on', p*5>i+.35));

    requestAnimationFrame(frame);
  }

  function resize(){
    exp.resize(innerWidth, innerHeight);
    readScroll();
  }
  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(t=>{last=t; frame(t);});

  /* replay */
  $('#replay')?.addEventListener('click', ()=>{
    scrollTo({top:0, behavior:'auto'});
    target=0; eased=0;
  });

  /* test hook: snap progress directly (harmless in production) */
  window.__setP = v => { target=eased=clamp(v,0,1); };
}
