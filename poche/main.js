/* =========================================================================
   DÉMARRAGE — écran titre, nouvelle partie / continuer, boucle principale.
   ========================================================================= */
let onPress=null;
function restore(s){ GS=s; const p=s.pos||{}; delete GS.pos; delete GS.t;
  for(const m of GS.party.concat(GS.box)){ calcStats(m); m.hp=Math.min(m.hp,m.maxhp);
    if(!GS.ver){ const ids=[...new Set(SPECIES[m.n].learn.filter(([l])=>l<=m.lv).map(([,i])=>i))].slice(-4); m.moves=ids.map(i=>({id:i,pp:MOVES[i].pp})); } }
  GS.ver=2;
  P.map=p.map||'maison'; P.x=p.x??4; P.y=p.y??6; P.dir=p.dir||'down'; P.zone=s.zoneNow||(P.map==='world'?zoneAt(P.y).id:'home'); P.ret=s.retNow||null; }
const _save=saveGame; saveGame=function(){ if(!GS||title) return; GS.zoneNow=P.zone; GS.retNow=P.ret; _save(); };
function renderTitle(){ ctx.fillStyle='#283878'; ctx.fillRect(0,0,W,H); const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#f8a040'); g.addColorStop(.55,'#d04870'); g.addColorStop(1,'#302060'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  for(let i=0;i<20;i++){ ctx.fillStyle='rgba(255,255,255,.6)'; ctx.fillRect((i*37+T*6)%W,(i*23)%60,1,1); }
  const show=[25,1,4,7,94,150][Math.floor(T/2.2)%6]; const s=charSprite(show); ctx.drawImage(s,52,46+Math.sin(T*2)*2);
  pixText(ctx,'AVENTURE DE POCHE',13,10,'#fff8d0'); pixText(ctx,'151 HEROS D ANIME',13,20,'#ffe080');
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(0,106,W,38); }
async function titleScreen(){ title=true; MUS.play('town');
  const save=loadGame();
  for(;;){ const opts=save?['CONTINUER','NOUVELLE PARTIE']:['NOUVELLE PARTIE'];
    const i=await choose(opts,{cls:'title',noCancel:1});
    if(save&&i===0){ restore(save); break; }
    if(save&&!await yesNo("Effacer l'ancienne partie et recommencer ?")) continue;
    newGame(); await intro(); break; }
  title=false; buildNPCs(); MUS.play(P.map==='world'?'route':'town'); if(P.map==='world') showZone(zoneAt(P.y).name); saveGame(); }
async function intro(){ INTRO=1;
  await say("Bonjour ! Bienvenue dans le monde des HÉROS D'ANIME !"); await say("Je suis le Prof. ÉRABLE. Depuis peu, des personnages venus d'autres mondes apparaissent dans notre région.");
  await say("Il y en a 151 ! Certains se battent à nos côtés, deviennent plus forts… et évoluent !"); await say("Mais d'abord, dis-moi : comment t'appelles-tu ?");
  const names=['LOAN','RED','SACHA','YUKI']; const i=await choose(names,{cls:'start',noCancel:1}); GS.name=names[i];
  await say("Et voici mon petit-fils. Il est ton rival depuis toujours. Son nom est KENJI !"); await say(GS.name+" ! Ta propre aventure va commencer ! Viens me voir au labo, au sud du bourg !");
  INTRO=0; P.map='maison'; P.zone='home'; P.x=4; P.y=5; P.dir='up'; P.ret={x:6,y:WORLD.zones.find(z=>z.id==='home').y0+22}; }
let INTRO=0;
function renderIntro(){ ctx.fillStyle='#f8f8f8'; ctx.fillRect(0,0,W,H); ctx.drawImage(npcSprites({nocap:1,hair:'#d0d0d0',top:'#f8f8f8',pants:'#806040'}).down,56,24,48,48); }
onPress=k=>{ worldKeys(k); };

/* --- boucle ------------------------------------------------------------------- */
let last=performance.now();
function frame(now){ const dt=Math.max(0,Math.min(.05,(now-last)/1000)); last=now; T+=dt; MUS.tick(dt);
  try{ if(!title) update(dt);
    if(EVO) renderEvo(); else if(inBattle) renderBattle(); else if(title&&INTRO) renderIntro(); else if(title) renderTitle(); else renderWorld();
    if(fade){ ctx.fillStyle='rgba(0,0,0,'+Math.min(1,1-Math.abs(fade.t/fade.d*2-1))+')'; ctx.fillRect(0,0,W,H); }
  }catch(e){ console.error(e); }
  requestAnimationFrame(frame); }
(function boot(){ try{ const o=JSON.parse(localStorage.getItem('aventure_poche_opt')||'{}'); if(o.ts) TEXT_SPEED=o.ts; if(o.snd===false) AU.on=false; }catch(e){}
  prepSpecies(); initWorld(); fit(); requestAnimationFrame(frame); titleScreen();
  addEventListener('visibilitychange',()=>{ if(document.hidden) saveGame(); }); addEventListener('pagehide',()=>saveGame()); })();
