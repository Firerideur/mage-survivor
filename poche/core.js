/* =========================================================================
   CŒUR — écran 160×144, entrées (clavier, croix, boutons), interface
   (boîtes de texte, choix, menus) en mode « script » asynchrone, son,
   sauvegarde. Les autres fichiers s'appuient sur ces outils.
   ========================================================================= */
'use strict';
const W=160, H=144, TS=16;
const cv=document.getElementById('cv'), ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);
const UI=$('ui');
const rnd=(a,b)=>a+Math.random()*(b-a), rint=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* --- entrées ------------------------------------------------------------ */
const held={up:0,down:0,left:0,right:0,A:0,B:0};
const KEYMAP={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',z:'up',s:'down',q:'left',d:'right',
  w:'A',' ':'A',Space:'A',x:'B',Shift:'B',Backspace:'B',Enter:'START',Escape:'START',Tab:'SELECT'};
let inputWaiters=[]; const pressedNow=new Set();
function press(k){ pressedNow.add(k); const w=inputWaiters; inputWaiters=[]; for(const f of w) f(k); if(typeof onPress==='function') onPress(k); }
function nextKey(){ return new Promise(r=>inputWaiters.push(r)); }
addEventListener('keydown',e=>{ const k=KEYMAP[e.key]||KEYMAP[e.code]||KEYMAP[e.key&&e.key.toLowerCase()]; if(!k) return; e.preventDefault(); AU.init();
  if(k in held) held[k]=1; if(!e.repeat||['up','down','left','right'].includes(k)) press(k); });
addEventListener('keyup',e=>{ const k=KEYMAP[e.key]||KEYMAP[e.code]||KEYMAP[e.key&&e.key.toLowerCase()]; if(k&&k in held) held[k]=0; });
const dp=$('dpad'); let dpId=null, dpRep=null;
function dpDir(e){ const r=dp.getBoundingClientRect(), x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2;
  const prev=['up','down','left','right'].find(k=>held[k]); for(const k of ['up','down','left','right']) held[k]=0; if(Math.hypot(x,y)<10) return;
  const k=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up'); held[k]=1; if(k!==prev) press(k); }
dp.addEventListener('pointerdown',e=>{ AU.init(); dpId=e.pointerId; dp.setPointerCapture(e.pointerId); dpDir(e);
  clearInterval(dpRep); dpRep=setInterval(()=>{ if(UIBUSY>0){ const k=['up','down','left','right'].find(k=>held[k]); if(k) press(k); } },180); });
dp.addEventListener('pointermove',e=>{ if(e.pointerId===dpId) dpDir(e); });
const dpEnd=e=>{ if(e.pointerId!==dpId) return; dpId=null; clearInterval(dpRep); for(const k of ['up','down','left','right']) held[k]=0; };
dp.addEventListener('pointerup',dpEnd); dp.addEventListener('pointercancel',dpEnd);
for(const [id,k] of [['bA','A'],['bB','B'],['bStart','START'],['bSel','SELECT']]){ const el=$(id);
  el.addEventListener('pointerdown',e=>{ AU.init(); el.setPointerCapture(e.pointerId); el.classList.add('on'); if(k in held) held[k]=1; press(k); });
  const up=()=>{ el.classList.remove('on'); if(k in held) held[k]=0; }; el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); }

/* --- son : bips et petites musiques ------------------------------------- */
const AU={ac:null,on:true,init(){ if(this.ac) return; try{ this.ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} },
  beep(f,d,type,vol,slide,delay){ if(!this.ac||!this.on) return; const o=this.ac.createOscillator(), g=this.ac.createGain(), t=this.ac.currentTime+(delay||0);
    o.type=type||'square'; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+d);
    g.gain.setValueAtTime(vol||.05,t); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g).connect(this.ac.destination); o.start(t); o.stop(t+d+.02); },
  noise(d,vol){ if(!this.ac||!this.on) return; const b=this.ac.createBuffer(1,this.ac.sampleRate*d,this.ac.sampleRate), x=b.getChannelData(0);
    for(let i=0;i<x.length;i++) x[i]=(Math.random()*2-1)*(1-i/x.length); const s=this.ac.createBufferSource(), g=this.ac.createGain(); g.gain.value=vol||.08; s.buffer=b; s.connect(g).connect(this.ac.destination); s.start(); },
  bump(){ this.beep(90,.12,'square',.06,60); }, ok(){ this.beep(1320,.05,'square',.04); }, door(){ this.beep(300,.25,'triangle',.08,900); },
  jump(){ this.beep(500,.2,'square',.04,1200); }, grass(){ this.beep(2400,.03,'triangle',.015,1800); },
  hit(){ this.noise(.15,.1); this.beep(160,.12,'square',.05,60); }, superHit(){ this.noise(.25,.14); this.beep(220,.2,'sawtooth',.06,50); },
  heal(){ [880,1100,1320,1760].forEach((f,i)=>this.beep(f,.12,'square',.035,0,i*.1)); }, faint(){ this.beep(600,.6,'square',.05,80); },
  catch_(){ [523,659,784,1046].forEach((f,i)=>this.beep(f,.15,'square',.04,0,i*.13)); }, lvl(){ [784,988,1175,1568].forEach((f,i)=>this.beep(f,.1,'square',.04,0,i*.09)); },
  shake(){ this.beep(300,.08,'square',.04,200); }, select(){ this.beep(1000,.04,'square',.03); }};
/* musiques originales en boucle (une note de mélodie + une basse) */
const SONGS={
  town:{tempo:.19,mel:[[72,1],[76,1],[79,2],[77,1],[76,1],[74,2],[72,1],[74,1],[76,1],[72,1],[69,2],[71,2],[72,1],[76,1],[79,2],[81,1],[79,1],[77,2],[76,1],[74,1],[72,1],[74,1],[72,4]],bass:[48,48,55,55,53,53,55,55,48,48,55,55,53,55,48,48]},
  route:{tempo:.16,mel:[[67,1],[72,1],[74,1],[76,2],[74,1],[72,1],[74,2],[67,2],[69,1],[71,1],[72,2],[74,1],[76,1],[77,2],[76,1],[74,1],[72,4]],bass:[48,55,52,55,50,57,53,57,48,55,52,55,43,50,47,50]},
  battle:{tempo:.12,mel:[[64,1],[64,1],[67,1],[64,1],[69,1],[67,1],[64,2],[62,1],[62,1],[65,1],[62,1],[67,1],[65,1],[62,2],[64,1],[67,1],[71,1],[72,2],[71,1],[69,1],[67,1],[64,1],[65,1],[62,1],[64,4]],bass:[40,40,47,40,38,38,45,38,40,47,43,47,38,45,40,40]},
  gym:{tempo:.13,mel:[[69,1],[72,1],[76,1],[72,1],[69,1],[76,1],[74,2],[67,1],[71,1],[74,1],[71,1],[67,1],[74,1],[72,2],[69,1],[72,1],[77,1],[76,1],[74,1],[72,1],[71,1],[69,4]],bass:[45,45,52,52,43,43,50,50,41,41,48,48,40,40,47,47]},
  victory:{tempo:.14,mel:[[72,1],[72,1],[72,1],[72,3],[68,3],[70,3],[72,2],[70,1],[72,6]],bass:[48,48,44,46,48,48],once:1}};
const MUS={song:null,t:0,i:0,on:true,play(n){ if(this.song===SONGS[n]) return; this.song=SONGS[n]||null; this.i=0; this.t=0; },
  tick(dt){ if(!AU.ac||!this.on||!AU.on||!this.song) return; this.t-=dt; if(this.t>0) return; const s=this.song;
    if(s.once&&this.i>=s.mel.length){ this.song=null; return; }
    const [n,len]=s.mel[this.i%s.mel.length], f=440*Math.pow(2,(n-69)/12);
    AU.beep(f,len*s.tempo*.9,'square',.016); if(this.i%2===0){ const b=s.bass[(this.i>>1)%s.bass.length]; AU.beep(440*Math.pow(2,(b-69)/12),s.tempo*1.8,'triangle',.028); }
    this.t=len*s.tempo; this.i++; }};

/* --- interface : boîte de texte, choix, menus ---------------------------- */
let UIBUSY=0;
function el(cls,html,css){ const d=document.createElement('div'); d.className=cls; if(html!=null) d.innerHTML=html; if(css) d.style.cssText=css; UI.appendChild(d); return d; }
/* coupe en lignes de 18 caractères */
function wrapText(text,w){ w=w||20; const out=[]; for(const para of String(text).split('\n')){ let line=''; for(const word of para.split(' ')){ if((line+' '+word).trim().length>w&&line){ out.push(line); line=word; } else line=(line+' '+word).trim(); } out.push(line); } return out; }
let TEXT_SPEED=1;
async function say(text,opt){ opt=opt||{}; UIBUSY++; const box=el('box'); const lines=wrapText(text);
  try{ for(let i=0;i<lines.length;i+=2){ const pg=lines.slice(i,i+2).join('\n'), last=i+2>=lines.length;
      let k=null; const waiter=nextKey().then(x=>{ k=x; }); let shown=0;
      while(shown<pg.length&&k===null){ shown+=TEXT_SPEED>1?3:1; box.innerHTML=esc(pg.slice(0,shown)); await sleep(16); }
      box.innerHTML=esc(pg)+(opt.noWait&&last?'':'<span class="more">▼</span>');
      if(opt.noWait&&last) break;
      if(k!==null) k=null; else await waiter;
      while(k!=='A'&&k!=='B') k=await nextKey(); AU.ok(); }
  } finally { if(!opt.keep) box.remove(); else opt.keep.box=box; UIBUSY--; } }
/* menu de choix : renvoie l'index (ou -1 si B) */
async function choose(items,opt){ opt=opt||{}; UIBUSY++; const m=el('menu '+(opt.cls||''),'',opt.css||''); let i=opt.start||0;
  const draw=()=>{ m.innerHTML=items.map((t,j)=>`<div class="${j===i?'sel':''}${opt.dis&&opt.dis[j]?' dis':''}">${t}</div>`).join(''); if(opt.onMove) opt.onMove(i); const s=m.children[i]; if(s){ if(s.offsetTop<m.scrollTop) m.scrollTop=s.offsetTop; else if(s.offsetTop+s.offsetHeight>m.scrollTop+m.clientHeight) m.scrollTop=s.offsetTop+s.offsetHeight-m.clientHeight; } };
  draw(); m.addEventListener('pointerdown',e=>{ let d=e.target; while(d&&d.parentNode!==m) d=d.parentNode; if(!d) return; const j=[...m.children].indexOf(d); if(j>=0){ i=j; draw(); press('A'); } });
  try{ for(;;){ const k=await nextKey();
      if(k==='up'){ i=(i+items.length-1)%items.length; draw(); AU.select(); }
      else if(k==='down'){ i=(i+1)%items.length; draw(); AU.select(); }
      else if(k==='left'&&opt.cols){ i=Math.max(0,i-opt.cols); draw(); } else if(k==='right'&&opt.cols){ i=Math.min(items.length-1,i+opt.cols); draw(); }
      else if(k==='A'){ AU.ok(); return i; } else if(k==='B'&&!opt.noCancel){ return -1; } } }
  finally { m.remove(); UIBUSY--; } }
async function yesNo(q){ const keep={}; await say(q,{noWait:1,keep}); const r=await choose(['OUI','NON'],{cls:'yn'}); keep.box&&keep.box.remove(); return r===0; }
async function sayKeep(text){ const keep={}; await say(text,{noWait:1,keep}); return keep.box; }

/* --- sauvegarde ---------------------------------------------------------- */
const SAVE_KEY='aventure_poche_v2';
function saveGame(){ try{ const s=Object.assign({},GS,{pos:{map:P.map,x:P.x,y:P.y,dir:P.dir},t:Date.now()}); localStorage.setItem(SAVE_KEY,JSON.stringify(s)); localStorage.setItem(SAVE_KEY+'_bak',JSON.stringify(s)); }catch(e){} }
function loadGame(){ try{ return JSON.parse(localStorage.getItem(SAVE_KEY)||localStorage.getItem(SAVE_KEY+'_bak')||'null'); }catch(e){ return null; } }

/* --- dimensions de l'écran ----------------------------------------------- */
const LAND=matchMedia('(orientation:landscape) and (max-height:600px)');
function fit(){ const land=LAND.matches, aw=land?innerWidth-330:Math.min(innerWidth-48,900), ah=land?innerHeight-40:innerHeight-320; let s=Math.min(aw/W,ah/H); s=s>=2?Math.floor(s):Math.max(1,s);
  cv.style.width=W*s+'px'; cv.style.height=H*s+'px'; UI.style.transform='scale('+s+')'; }
addEventListener('resize',fit); addEventListener('orientationchange',()=>setTimeout(fit,200));
/* pas de zoom au double appui / pincement */
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
let lastTouch=0; document.addEventListener('touchend',e=>{ const t=Date.now(); if(t-lastTouch<400) e.preventDefault(); lastTouch=t; },{passive:false});
document.addEventListener('touchmove',e=>{ if(e.touches.length>1) e.preventDefault(); },{passive:false});
for(const g of ['gesturestart','gesturechange','gestureend']) document.addEventListener(g,e=>e.preventDefault(),{passive:false});
