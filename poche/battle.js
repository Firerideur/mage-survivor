/* =========================================================================
   COMBATS — sauvages et dresseurs : dégâts, types, statuts, capture,
   expérience, niveaux, nouvelles attaques, évolutions, IA.
   ========================================================================= */
const TYPES=['Normal','Feu','Eau','Plante','Électrique','Glace','Combat','Poison','Sol','Vol','Psy','Insecte','Roche','Spectre','Dragon','Ténèbres','Acier','Fée'];
const TCOL={Normal:'#a8a878',Feu:'#f08030',Eau:'#6890f0',Plante:'#78c850','Électrique':'#f8d030',Glace:'#98d8d8',Combat:'#c03028',Poison:'#a040a0',Sol:'#e0c068',Vol:'#a890f0',Psy:'#f85888',Insecte:'#a8b820',Roche:'#b8a038',Spectre:'#705898',Dragon:'#7038f8','Ténèbres':'#705848',Acier:'#b8b8d0','Fée':'#ee99ac'};
const CHART={Normal:{Roche:.5,Acier:.5,Spectre:0},
  Feu:{Feu:.5,Eau:.5,Plante:2,Glace:2,Insecte:2,Roche:.5,Dragon:.5,Acier:2},
  Eau:{Feu:2,Eau:.5,Plante:.5,Sol:2,Roche:2,Dragon:.5},
  'Électrique':{Eau:2,'Électrique':.5,Plante:.5,Sol:0,Vol:2,Dragon:.5},
  Plante:{Feu:.5,Eau:2,Plante:.5,Poison:.5,Sol:2,Vol:.5,Insecte:.5,Roche:2,Dragon:.5,Acier:.5},
  Glace:{Feu:.5,Eau:.5,Plante:2,Glace:.5,Sol:2,Vol:2,Dragon:2,Acier:.5},
  Combat:{Normal:2,Glace:2,Poison:.5,Vol:.5,Psy:.5,Insecte:.5,Roche:2,Spectre:0,'Ténèbres':2,Acier:2,'Fée':.5},
  Poison:{Plante:2,Poison:.5,Sol:.5,Roche:.5,Spectre:.5,Acier:0,'Fée':2},
  Sol:{Feu:2,'Électrique':2,Plante:.5,Poison:2,Vol:0,Insecte:.5,Roche:2,Acier:2},
  Vol:{'Électrique':.5,Plante:2,Combat:2,Insecte:2,Roche:.5,Acier:.5},
  Psy:{Combat:2,Poison:2,Psy:.5,'Ténèbres':0,Acier:.5},
  Insecte:{Feu:.5,Plante:2,Combat:.5,Poison:.5,Vol:.5,Psy:2,Spectre:.5,'Ténèbres':2,Acier:.5,'Fée':.5},
  Roche:{Feu:2,Glace:2,Combat:.5,Sol:.5,Vol:2,Insecte:2,Acier:.5},
  Spectre:{Normal:0,Psy:2,Spectre:2,'Ténèbres':.5},
  Dragon:{Dragon:2,Acier:.5,'Fée':0},
  'Ténèbres':{Combat:.5,Psy:2,Spectre:2,'Ténèbres':.5,'Fée':.5},
  Acier:{Feu:.5,Eau:.5,'Électrique':.5,Glace:2,Roche:2,Acier:.5,'Fée':2},
  'Fée':{Feu:.5,Combat:2,Poison:.5,Dragon:2,'Ténèbres':2,Acier:.5}};
const typeMul=(t,defTypes)=>defTypes.reduce((m,d)=>m*((CHART[t]||{})[d]??1),1);
const ST_NAME={brn:'BRÛ',par:'PAR',psn:'PSN',tox:'PSN',slp:'SOM',frz:'GEL'};
const ST_TXT={brn:'est brûlé',par:'est paralysé',psn:'est empoisonné',tox:'est gravement empoisonné',slp:"s'endort",frz:'est gelé'};
const STAT_FR={atk:"l'Attaque",def:'la Défense',spe:'le Spécial',vit:'la Vitesse',acc:'la Précision',eva:"l'Esquive"};
const SIDX={atk:1,def:2,spe:3,vit:4};
const stageMul=s=>s>=0?(2+s)/2:2/(2-s), accMul=s=>s>=0?(3+s)/3:3/(3-s);

let B=null; /* combat en cours */
const BA={foe:{x:0,y:0,vis:1,blink:0,drop:0,sc:1,sx:1,sy:1,flip:0},me:{x:0,y:0,vis:1,blink:0,drop:0,sc:1,sx:1,sy:1,flip:0},fx:null,flash:0,ball:null,trainer:null,player:0,shake:0};
async function tween(ms,f){ const t0=performance.now(); for(;;){ const k=Math.min(1,(performance.now()-t0)/ms); f(k); if(k>=1) return; await sleep(16); } }
const battler=m=>({m,stg:{atk:0,def:0,spe:0,vit:0,acc:0,eva:0},conf:0,flinch:0,seed:0,protect:0,lastProt:0,toxN:1,charge:0});
const nm=(s)=>(s===B.foe&&!B.trainer?(B.wild?'':'')+monName(s.m)+' sauvage':s===B.foe?monName(s.m)+' ennemi':monName(s.m));
const effStat=(s,k)=>{ let v=s.m.stats[SIDX[k]]*stageMul(s.stg[k]); if(k==='vit'&&s.m.st==='par') v/=2; return Math.max(1,v); };

/* --- interface du combat (cadres PV) ------------------------------------ */
let HPUI=null;
function hpBoxes(){ if(HPUI){ HPUI.f.remove(); HPUI.p.remove(); }
  HPUI={f:el('hp foe'),p:el('hp me'),df:B.foe.m.hp,dp:B.me.m.hp}; drawHP(); }
function bar(h,max){ const k=clamp(h/max,0,1), c=k>.5?'#30c050':k>.2?'#e8b828':'#e03030'; return `<div class="bar"><i style="width:${k*100}%;background:${c}"></i></div>`; }
function drawHP(){ if(!HPUI) return; const f=B.foe.m, p=B.me.m;
  HPUI.f.innerHTML=`<div class="nm">${esc(monName(f))}${GS.dex.caught[f.n]&&!B.trainer?' <b class="cg">●</b>':''}</div><div class="lv">${f.st?'<b class="st">'+ST_NAME[f.st]+'</b>':':N'+f.lv}</div><div class="pv">PV${bar(HPUI.df,f.maxhp)}</div>`;
  const xk=p.lv>=100?1:clamp((p.xp-xpFor(p.lv))/(xpFor(p.lv+1)-xpFor(p.lv)),0,1);
  HPUI.p.innerHTML=`<div class="nm">${esc(monName(p))}</div><div class="lv">${p.st?'<b class="st">'+ST_NAME[p.st]+'</b>':':N'+p.lv}</div><div class="pv">PV${bar(HPUI.dp,p.maxhp)}</div><div class="num">${Math.ceil(HPUI.dp)}/ ${p.maxhp}</div><div class="xp"><i style="width:${xk*100}%"></i></div>`;
  HPUI.f.style.display=BA.foe.vis&&!BA.trainer?'':'none'; HPUI.p.style.display=BA.me.vis&&!BA.player?'':'none'; }
async function animHP(side,to){ const k=side===B.foe?'df':'dp', from=HPUI[k]; const ms=Math.min(900,Math.abs(from-to)/side.m.maxhp*1400+120);
  await tween(ms,t=>{ HPUI[k]=from+(to-from)*t; drawHP(); }); HPUI[k]=to; drawHP(); }

/* --- effets visuels des attaques ----------------------------------------- */
async function moveFX(user,target,mv){ const toFoe=target===B.foe, col=TCOL[mv.t]||'#fff', u=toFoe?BA.me:BA.foe, tg=toFoe?BA.foe:BA.me;
  if(mv.c!=='s'||mv.c==='p'){ await tween(140,k=>{ u.x=(toFoe?1:-1)*Math.sin(k*Math.PI)*10; }); u.x=0; }
  if(mv.c==='t'&&!/foe/.test(mv.e)){ BA.fx={kind:'buff',col,on:user===B.foe?'foe':'me',t:0}; await tween(500,k=>{ BA.fx.t=k; }); BA.fx=null; return; }
  BA.fx={kind:mv.t,col,on:toFoe?'foe':'me',t:0,cat:mv.c}; await tween(mv.c==='s'?520:380,k=>{ BA.fx.t=k; }); BA.fx=null; }
async function hitFX(target,eff){ const s=target===B.foe?BA.foe:BA.me; eff>1?AU.superHit():AU.hit(); if(eff>1){ BA.shake=1; }
  for(let i=0;i<4;i++){ s.blink=1; await sleep(70); s.blink=0; await sleep(70); } BA.shake=0; }

/* --- démarrage ----------------------------------------------------------- */
async function startBattle(opt){ inBattle=true; const prevSong=MUS.song; lock++;
  B={wild:!!opt.wild,trainer:opt.trainer||null,legend:opt.legend,noLose:opt.noLose,run:0,part:new Set(),turn:0,potions:opt.trainer&&opt.trainer.leader?2:0};
  B.foeTeam=B.trainer?B.trainer.team:[opt.wild]; B.foeIdx=0; B.foe=battler(B.foeTeam[0]);
  const first=GS.party.findIndex(m=>m.hp>0); B.meIdx=first; B.me=battler(GS.party[first]); B.part.add(first);
  Object.assign(BA.foe,{x:0,y:0,vis:1,blink:0,drop:0,sc:1,sx:1,sy:1,flip:0}); Object.assign(BA.me,{x:0,y:0,vis:1,blink:0,drop:0,sc:1,sx:1,sy:1,flip:0}); BA.fx=null; BA.ball=null;
  BA.trainer=B.trainer?npcSprites(B.trainer.look||{}).down:null; BA.player=1;
  MUS.play(B.legend?'legend':B.trainer&&B.trainer.leader?'leader':B.trainer?'trainer':'battle');
  /* transition */
  AU.beep(200,.5,'square',.04,800); for(let i=0;i<3;i++){ BA.flash=1; await sleep(80); BA.flash=0; await sleep(80); }
  B.intro=1; BA.foe.x=-120; BA.me.x=120; await tween(600,k=>{ BA.foe.x=-120*(1-k); BA.me.x=120*(1-k); }); B.intro=0;
  let result;
  try{
    if(B.trainer){ await say(B.trainer.name+" veut se battre !"); await tween(300,k=>{ BA.foe.x=k*80; }); BA.trainer=null; BA.foe.x=0;
      seen(B.foe.m.n); hpBoxes(); await say(B.trainer.name+" envoie "+monName(B.foe.m)+" !"); await sendOut(B.foe); }
    else { seen(B.foe.m.n); hpBoxes(); entryAnim(B.foe); await say("Un "+monName(B.foe.m)+" sauvage apparaît !"); }
    await tween(250,k=>{ BA.me.x=-k*70; }); BA.player=0; BA.me.x=0; drawHP(); await say("Vas-y, "+monName(B.me.m)+" !"); await sendOut(B.me);
    result=await battleLoop();
  } finally {
    if(HPUI){ HPUI.f.remove(); HPUI.p.remove(); HPUI=null; }
    for(const m of GS.party) if(m.st==='tox') m.st='psn';
    if(result==='lose'&&!B.noLose) await blackout();
    else if(result==='lose') healAll();
    const evos=[]; if(result!=='lose') for(const i of B.leveled||[]){ const m=GS.party[i]; const e=m&&SPECIES[m.n].evo; if(e&&e.lvl&&m.lv>=e.lvl) evos.push(m); }
    inBattle=false; B=null; MUS.play(zoneMusic());
    for(const m of evos) await evolve(m,SPECIES[m.n].evo.to);
    lock--; saveGame(); }
  return result; }
async function sendOut(s){ const a=s===B.foe?BA.foe:BA.me; AU.beep(800,.15,'square',.04,300); a.sc=0; await tween(260,k=>{ a.sc=k; }); a.sc=1; drawHP(); await entryAnim(s); }
/* animation d'entrée propre à chaque personnage (selon son type), avec son cri */
const ENTRY={Combat:'hop',Normal:'hop',Sol:'hop','Électrique':'shake',Insecte:'shake',Feu:'stretch',Eau:'stretch',Poison:'stretch',Psy:'float','Fée':'float',Spectre:'float',
  Dragon:'grow',Roche:'grow',Acier:'grow',Glace:'grow','Ténèbres':'spin',Vol:'spin',Plante:'spin'};
async function entryAnim(s){ const a=s===B.foe?BA.foe:BA.me, kind=ENTRY[SPECIES[s.m.n].types[0]]||'hop'; cry(s.m.n);
  await tween(650,k=>{ const S=Math.sin(k*Math.PI), S2=Math.sin(k*Math.PI*2);
    if(kind==='hop') a.y=-Math.abs(Math.sin(k*Math.PI*2))*8;
    else if(kind==='shake') a.x=Math.sin(k*Math.PI*8)*3*(1-k);
    else if(kind==='stretch'){ a.sy=1+S2*.14; a.sx=1-S2*.08; }
    else if(kind==='float') a.y=-S*10;
    else if(kind==='grow'){ a.sx=a.sy=1+S*.14; }
    else if(kind==='spin') a.flip=(k>.2&&k<.4)||(k>.6&&k<.8)?1:0; });
  Object.assign(a,{x:0,y:0,sx:1,sy:1,flip:0}); }

/* --- boucle de tour -------------------------------------------------------- */
async function battleLoop(){ B.leveled=new Set();
  for(;;){ B.menu=0; B.turn++; B.me.protect=0; B.foe.protect=0; B.me.flinch=0; B.foe.flinch=0;
    const act=await playerAction(); B.menu=0; if(act==='run') return 'run'; if(act&&act.end) return act.end;
    const foeAct=foeChoose();
    /* ordre */
    let order;
    if(act.kind!=='move') order=[[B.me,act],[B.foe,foeAct]];
    else { const pa=MOVES[act.mv.id], pf=foeAct.kind==='move'?MOVES[foeAct.mv.id]:null; const prA=/prio/.test(pa.e)?1:0, prF=foeAct.kind!=='move'?2:/prio/.test(pf.e)?1:0;
      const meFirst=prA!==prF?prA>prF:effStat(B.me,'vit')!==effStat(B.foe,'vit')?effStat(B.me,'vit')>effStat(B.foe,'vit'):Math.random()<.5;
      order=meFirst?[[B.me,act],[B.foe,foeAct]]:[[B.foe,foeAct],[B.me,act]]; }
    for(let i=0;i<2;i++){ const [s,a]=order[i]; const t=s===B.me?B.foe:B.me; if(s.m.hp<=0||t.m.hp<=0&&a.kind==='move') continue;
      if(a.kind==='move') await doMove(s,t,a.mv,i===0);
      else if(a.kind==='potion'){ const it=ITEMS[a.item]; s.m.hp=Math.min(s.m.maxhp,s.m.hp+it.heal); AU.heal(); await say(B.trainer.name+" utilise "+it.nm+" !"); await animHP(s,s.m.hp); }
      const r=await checkFaints(); if(r) return r; }
    for(const s of [B.me,B.foe]){ if(s.m.hp<=0) continue; await endTurn(s); const r=await checkFaints(); if(r) return r; } } }

/* --- choix du joueur ------------------------------------------------------- */
async function playerAction(){
  for(;;){ B.menu=1; const c=await choose(['ATTAQUE','ÉQUIPE','SAC','FUITE'],{cls:'bmenu',noCancel:1,cols:2,start:B.lastCmd||0}); B.lastCmd=c;
    if(c===0){ const m=B.me.m; if(m.moves.every(x=>x.pp<=0)) return {kind:'move',mv:{id:-1}};
      const info=el('minfo'); B.menu=1; const r=await choose(m.moves.map(x=>esc(MOVES[x.id].n)),{cls:'mmenu',start:B.lastMv||0,onMove:i=>{ const mv=MOVES[m.moves[i].id]; info.innerHTML=`TYPE/<br>${esc(mv.t.toUpperCase())}<br>PP ${m.moves[i].pp}/${mv.pp}`; }});
      info.remove(); if(r<0) continue; if(m.moves[r].pp<=0){ await say("Plus de PP pour cette attaque !"); continue; } B.lastMv=r; return {kind:'move',mv:m.moves[r]}; }
    if(c===1){ const i=await partyMenu({battle:1}); if(i<0||i===B.meIdx) continue; await switchTo(i,true); return {kind:'switch'}; }
    if(c===2){ const r=await bagMenu({battle:1}); if(!r) continue; if(r.end) return r; return {kind:'item'}; }
    if(c===3){ if(B.trainer){ await say("Impossible de fuir un combat de dresseur !"); continue; }
      B.run++; const a=effStat(B.me,'vit'), b=effStat(B.foe,'vit'); const f=(a*128/b+30*B.run)%256;
      if(a>=b||Math.random()*255<f){ AU.door(); await say("Vous prenez la fuite !"); return 'run'; } await say("Impossible de fuir !"); return {kind:'none'}; } } }
async function switchTo(i,voluntary){ if(voluntary){ await say(monName(B.me.m)+", reviens !"); }
  await tween(220,k=>{ BA.me.sc=1-k; }); BA.me.sc=0; B.meIdx=i; B.me=battler(GS.party[i]); B.part.add(i); HPUI.dp=B.me.m.hp; drawHP();
  await say("Vas-y, "+monName(B.me.m)+" !"); await sendOut(B.me); }

/* --- IA ------------------------------------------------------------------- */
function foeChoose(){ const s=B.foe, m=s.m; const usable=m.moves.filter(x=>x.pp>0); if(!usable.length) return {kind:'move',mv:{id:-1}};
  if(B.trainer&&B.potions>0&&m.hp<m.maxhp/4&&Math.random()<.7){ B.potions--; return {kind:'potion',item:'hyperPotion'}; }
  if(!B.trainer) return {kind:'move',mv:pick(usable)};
  let best=null, bs=-1; for(const x of usable){ const mv=MOVES[x.id]; let sc;
    if(mv.c==='t'){ sc=/^(slp|par|tox|psn|brn)/.test(mv.e)&&!B.me.m.st?55:/self/.test(mv.e)&&s.stg.atk<2&&s.stg.spe<2?40:/heal/.test(mv.e)?(m.hp<m.maxhp/2?90:0):15; }
    else { sc=(mv.p||40)*typeMul(mv.t,SPECIES[B.me.m.n].types)*(SPECIES[m.n].types.includes(mv.t)?1.5:1)*(mv.a||100)/100; }
    sc*=rnd(.75,1.25); if(sc>bs){ bs=sc; best=x; } }
  return {kind:'move',mv:best}; }

/* --- exécution d'une attaque --------------------------------------------- */
function parseEff(e){ const out=[]; let tgt=null; for(const part of (e||'').split(',')){ if(!part) continue; const a=part.split(':');
    if(a[0]==='self'||a[0]==='foe'){ tgt=a[0]; out.push({k:'stat',tgt,stat:a[1],n:+a[2]}); }
    else if(tgt&&SIDX[a[0]]||tgt&&(a[0]==='acc'||a[0]==='eva')) out.push({k:'stat',tgt,stat:a[0],n:+a[1]});
    else out.push({k:a[0],n:a[1]!=null?+a[1]:null}); } return out; }
async function doMove(s,t,slot,first){ const m=s.m;
  /* empêchements */
  if(m.st==='slp'){ m.slpT=(m.slpT||1)-1; if(m.slpT>0){ await say(nm(s)+" dort profondément."); return; } m.st=null; drawHP(); await say(nm(s)+" se réveille !"); }
  if(m.st==='frz'){ if(Math.random()<.2){ m.st=null; drawHP(); await say(nm(s)+" n'est plus gelé !"); } else { await say(nm(s)+" est gelé !"); return; } }
  if(s.flinch){ await say(nm(s)+" a peur ! Il ne peut pas attaquer."); return; }
  if(s.conf>0){ s.conf--; if(!s.conf) await say(nm(s)+" n'est plus confus !"); else { await say(nm(s)+" est confus…");
      if(Math.random()<1/3){ const d=Math.max(1,Math.floor((Math.floor(2*m.lv/5+2)*40*effStat(s,'atk')/effStat(s,'def'))/50)+2); await say("Il se blesse dans sa confusion !"); await hitFX(s,1); m.hp=Math.max(0,m.hp-d); await animHP(s,m.hp); return; } } }
  if(m.st==='par'&&Math.random()<.25){ await say(nm(s)+" est paralysé ! Il ne peut pas attaquer !"); return; }
  const mv=slot.id<0?{n:'Lutte',t:'Normal',c:'p',p:50,a:0,pp:1,e:'recoil'}:MOVES[slot.id]; if(slot.id>=0) slot.pp=Math.max(0,slot.pp-1);
  await say(nm(s)+" utilise\n"+mv.n.toUpperCase()+" !");
  const E=parseEff(mv.e), has=k=>E.find(x=>x.k===k);
  if(t.protect&&(mv.c!=='t'||E.some(x=>x.tgt==='foe'||ST_TXT[x.k]))){ await say(nm(t)+" se protège !"); return; }
  if(has('protect')){ if(s.lastProt===B.turn-1&&Math.random()<.5){ s.lastProt=0; await say("Mais cela échoue !"); return; } s.protect=1; s.lastProt=B.turn; await moveFX(s,t,mv); await say(nm(s)+" se protège !"); return; }
  /* précision */
  if(mv.a&&!has('ohko')){ const p=mv.a*accMul(clamp(s.stg.acc-t.stg.eva,-6,6)); if(Math.random()*100>=p){ await say("Mais "+nm(s)+" rate son attaque !"); return; } }
  if(mv.c==='t'){ await moveFX(s,t,mv); await applySecondary(s,t,mv,E,true,0); return; }
  /* attaque offensive */
  const tm=typeMul(mv.t,SPECIES[t.m.n].types);
  if(tm===0){ await say("Ça n'affecte pas "+nm(t)+"…"); return; }
  if(has('ohko')){ if(m.lv<t.m.lv||Math.random()>.3){ await say("Mais cela échoue !"); return; } await moveFX(s,t,mv); await hitFX(t,2); t.m.hp=0; await animHP(t,0); await say("K.O. en un coup !"); return; }
  let hits=has('multi2')?2:has('multi5')?pick([2,2,2,3,3,3,4,5]):1, total=0, n=0, crit=false;
  for(;n<hits&&t.m.hp>0;n++){ let dmg; crit=false;
    if(has('fixed')) dmg=has('fixed').n; else if(has('level')) dmg=m.lv;
    else { crit=Math.random()<(has('crit')?1/4:1/16); const phys=mv.c==='p';
      let A=crit?m.stats[phys?1:3]*Math.max(1,stageMul(s.stg[phys?'atk':'spe'])):effStat(s,phys?'atk':'spe'), D=crit?t.m.stats[phys?2:3]*Math.min(1,stageMul(t.stg[phys?'def':'spe'])):effStat(t,phys?'def':'spe');
      if(phys&&m.st==='brn') A/=2;
      dmg=Math.floor(Math.floor(Math.floor(2*m.lv/5+2)*mv.p*A/D)/50)+2;
      dmg=Math.floor(dmg*(SPECIES[m.n].types.includes(mv.t)?1.5:1)*tm*(crit?1.5:1)*rnd(.85,1)); dmg=Math.max(1,dmg); }
    if(n===0) await moveFX(s,t,mv); await hitFX(t,has('fixed')||has('level')?1:tm);
    dmg=Math.min(dmg,t.m.hp); t.m.hp-=dmg; total+=dmg; await animHP(t,t.m.hp);
    if(crit) await say("Coup critique !"); }
  if(!has('fixed')&&!has('level')){ if(tm>1) await say("C'est super efficace !"); else if(tm<1) await say("Ce n'est pas très efficace…"); }
  if(hits>1) await say("Touché "+n+" fois !");
  if(has('drain')&&m.hp<m.maxhp&&total>0){ m.hp=Math.min(m.maxhp,m.hp+Math.max(1,total>>1)); await animHP(s,m.hp); await say(nm(t)+" a perdu de l'énergie !"); }
  if(has('recoil')&&total>0){ m.hp=Math.max(0,m.hp-Math.max(1,total>>2)); await animHP(s,m.hp); await say(nm(s)+" subit le contrecoup !"); }
  if(t.m.hp>0) await applySecondary(s,t,mv,E,false,first);
  else await applySecondary(s,t,mv,E.filter(x=>x.tgt==='self'||x.k==='conf_self'),false,first); }
async function applySecondary(s,t,mv,E,isStatus,first){
  for(const x of E){
    if(ST_TXT[x.k]){ const ch=isStatus?100:x.n||100; if(Math.random()*100>=ch) continue; await inflict(t,x.k,isStatus); }
    else if(x.k==='conf'){ if(!isStatus&&Math.random()*100>=x.n) continue; if(t.conf){ if(isStatus) await say(nm(t)+" est déjà confus !"); continue; } t.conf=rint(2,5); await say(nm(t)+" devient confus !"); }
    else if(x.k==='conf_self'){ if(!s.conf&&Math.random()<.5){ s.conf=rint(2,3); await say(nm(s)+" est épuisé et devient confus !"); } }
    else if(x.k==='flinch'){ if(first&&Math.random()*100<x.n) t.flinch=1; }
    else if(x.k==='stat'){ const who=x.tgt==='self'?s:t; if(!isStatus&&x.tgt==='foe'&&Math.random()>.3) continue; await changeStage(who,x.stat,x.n); }
    else if(x.k==='heal'){ if(s.m.hp>=s.m.maxhp){ await say("Mais "+nm(s)+" a déjà tous ses PV !"); continue; } s.m.hp=Math.min(s.m.maxhp,s.m.hp+Math.floor(s.m.maxhp/2)); AU.heal(); await animHP(s,s.m.hp); await say(nm(s)+" récupère des PV !"); }
    else if(x.k==='rest'){ if(s.m.hp>=s.m.maxhp){ await say("Mais cela échoue !"); continue; } s.m.st='slp'; s.m.slpT=3; s.m.hp=s.m.maxhp; AU.heal(); await animHP(s,s.m.hp); await say(nm(s)+" s'endort et récupère tous ses PV !"); }
    else if(x.k==='seed'){ if(t.seed||SPECIES[t.m.n].types.includes('Plante')){ await say("Mais cela échoue !"); continue; } t.seed=1; await say(nm(t)+" est infecté par des graines !"); } } }
async function inflict(t,st,loud){ const ty=SPECIES[t.m.n].types;
  const immune=t.m.st||(st==='brn'&&ty.includes('Feu'))||(st==='frz'&&ty.includes('Glace'))||((st==='psn'||st==='tox')&&(ty.includes('Poison')||ty.includes('Acier')))||(st==='par'&&ty.includes('Électrique'));
  if(immune){ if(loud) await say("Mais cela n'a aucun effet sur "+nm(t)+" !"); return; }
  t.m.st=st; if(st==='slp') t.m.slpT=rint(2,4); if(st==='tox') t.toxN=1; drawHP(); AU.beep(400,.2,'square',.04,200); await say(nm(t)+" "+ST_TXT[st]+" !"); }
async function changeStage(s,stat,n){ const v=s.stg[stat]; if(n>0&&v>=6||n<0&&v<=-6){ await say((n>0?"":"")+STAT_FR[stat].replace(/^./,c=>c.toUpperCase())+" de "+nm(s)+" ne peut plus "+(n>0?"monter":"baisser")+" !"); return; }
  s.stg[stat]=clamp(v+n,-6,6); const a=s===B.foe?BA.foe:BA.me; AU.beep(n>0?600:500,.25,'square',.04,n>0?1200:200);
  await tween(300,k=>{ a.y=(n>0?-1:1)*Math.sin(k*Math.PI*2)*3; }); a.y=0;
  await say(STAT_FR[stat].replace(/^./,c=>c.toUpperCase())+" de "+nm(s)+(Math.abs(n)>1?(n>0?" augmente beaucoup !":" baisse beaucoup !"):(n>0?" augmente !":" baisse !"))); }
async function endTurn(s){ const m=s.m;
  if(m.st==='brn'||m.st==='psn'||m.st==='tox'){ const d=Math.max(1,m.st==='tox'?Math.floor(m.maxhp*s.toxN++/16):Math.floor(m.maxhp/(m.st==='brn'?16:8)));
    await say(nm(s)+(m.st==='brn'?" souffre de sa brûlure !":" souffre du poison !")); await hitFX(s,1); m.hp=Math.max(0,m.hp-d); await animHP(s,m.hp); }
  if(s.seed&&m.hp>0){ const o=s===B.me?B.foe:B.me; const d=Math.max(1,Math.floor(m.maxhp/8)); m.hp=Math.max(0,m.hp-d); await animHP(s,m.hp);
    if(o.m.hp>0){ o.m.hp=Math.min(o.m.maxhp,o.m.hp+d); await animHP(o,o.m.hp); } await say("Les graines drainent l'énergie de "+nm(s)+" !"); } }

/* --- K.O., expérience ------------------------------------------------------ */
async function checkFaints(){
  if(B.foe.m.hp<=0){ cry(B.foe.m.n,1); AU.faint(); await tween(400,k=>{ BA.foe.drop=k; }); BA.foe.vis=0; BA.foe.drop=0; drawHP(); await say(nm(B.foe)+" est K.O. !");
    if(!B.trainer||B.foeIdx+1>=B.foeTeam.length) MUS.play('victory');
    await giveXP(B.foe.m);
    B.foeIdx++; if(B.trainer&&B.foeIdx<B.foeTeam.length){ B.foe=battler(B.foeTeam[B.foeIdx]); seen(B.foe.m.n); B.part=new Set(GS.party[B.meIdx].hp>0?[B.meIdx]:[]); HPUI.df=B.foe.m.hp; BA.foe.vis=1;
      if(B.me.m.hp<=0){ const r=await meFainted(); if(r) return r; }
      await say(B.trainer.name+" envoie "+monName(B.foe.m)+" !"); await sendOut(B.foe); return null; }
    if(B.trainer){ MUS.play('victory'); BA.trainer=npcSprites(B.trainer.look||{}).down; BA.foe.vis=1; BA.foe.x=60; await tween(400,k=>{ BA.foe.x=60*(1-k); });
      await say(GS.name+" a battu "+B.trainer.name+" !"); GS.money+=B.trainer.money; await say(GS.name+" remporte "+B.trainer.money+" Berrys !"); }
    return 'win'; }
  if(B.me.m.hp<=0) return meFainted();
  return null; }
async function meFainted(){ cry(B.me.m.n,1); AU.faint(); await tween(400,k=>{ BA.me.drop=k; }); BA.me.vis=0; BA.me.drop=0; drawHP(); await say(monName(B.me.m)+" est K.O. !"); B.part.delete(B.meIdx);
  if(!GS.party.some(m=>m.hp>0)){ return 'lose'; }
  let i; do{ i=await partyMenu({battle:1,forced:1}); } while(i<0||GS.party[i].hp<=0);
  BA.me.vis=1; await switchTo(i,false); return null; }
async function giveXP(foe){ const parts=[...B.part].filter(i=>GS.party[i]&&GS.party[i].hp>0); if(!parts.length) return;
  const base=Math.floor(SPECIES[foe.n].xp*foe.lv/7*(B.trainer?1.5:1)/parts.length);
  for(const i of parts){ const m=GS.party[i]; if(m.lv>=100) continue; m.xp+=Math.max(1,base); await say(monName(m)+" gagne "+Math.max(1,base)+" points d'EXP. !");
    if(i===B.meIdx){ const from=HPUI.dp; drawHP(); }
    while(m.lv<100&&m.xp>=xpFor(m.lv+1)) await levelUp(m,i); } }
async function levelUp(m,i){ const oldMax=m.maxhp, old=m.stats.slice(); m.lv++; calcStats(m); m.hp+=m.maxhp-oldMax; AU.lvl(); (B&&B.leveled||new Set()).add(i);
  if(B&&i===B.meIdx){ HPUI.dp=m.hp; drawHP(); }
  await say(monName(m)+" monte au niveau "+m.lv+" !");
  const box=el('lvbox',STAT_NAMES.map((n,j)=>`<div>${n}<span>+${m.stats[j]-old[j]}</span></div>`).join('')); let k; do{ k=await nextKey(); }while(k!=='A'&&k!=='B'); box.remove();
  for(const [l,id] of SPECIES[m.n].learn) if(l===m.lv) await learnMove(m,id); }
async function learnMove(m,id){ if(m.moves.some(x=>x.id===id)) return; const mv=MOVES[id];
  if(m.moves.length<4){ m.moves.push({id,pp:mv.pp}); AU.lvl(); await say(monName(m)+" apprend "+mv.n.toUpperCase()+" !"); return; }
  for(;;){ await say(monName(m)+" veut apprendre "+mv.n.toUpperCase()+"…"); await say("Mais "+monName(m)+" connaît déjà 4 attaques.");
    if(await yesNo("Oublier une attaque pour "+mv.n.toUpperCase()+" ?")){ await say("Quelle attaque doit être oubliée ?",{});
      const r=await choose(m.moves.map(x=>esc(MOVES[x.id].n)),{cls:'mmenu forget'}); if(r<0) continue;
      const old=MOVES[m.moves[r].id].n; m.moves[r]={id,pp:mv.pp}; await say("1, 2 et… Tadaa !"); await say(monName(m)+" oublie "+old.toUpperCase()+" et apprend "+mv.n.toUpperCase()+" !"); return; }
    if(await yesNo("Abandonner l'apprentissage de "+mv.n.toUpperCase()+" ?")){ await say(monName(m)+" n'a pas appris "+mv.n.toUpperCase()+"."); return; } } }

/* --- évolution ----------------------------------------------------------- */
let EVO=null;
async function evolve(m,to){ const from=m.n; lock++; EVO={from,to,k:0,show:from,white:0};
  MUS.play('evo'); cry(from); try{ await say("Quoi ?\n"+monName(m)+" évolue !");
    let cancelled=false; const watch=(async()=>{ for(;;){ const k=await nextKey(); if(k==='B'||!EVO) { cancelled=k==='B'; return; } } })();
    for(let i=0;i<24&&!cancelled;i++){ EVO.show=i%2?to:from; EVO.white=1; AU.beep(400+i*40,.08,'square',.03); await sleep(Math.max(60,260-i*9)); }
    if(cancelled){ EVO.show=from; EVO.white=0; await say("Hein ? "+monName(m)+" n'évolue plus !"); return; }
    EVO.show=to; EVO.white=0; const oldName=monName(m); m.n=to; const oldMax=m.maxhp; calcStats(m); m.hp+=m.maxhp-oldMax; caught(to); MUS.play('victory'); cry(to);
    await say("Félicitations ! "+oldName+" a évolué en "+SPECIES[to].name+" !");
    for(const [l,id] of SPECIES[to].learn) if(l===m.lv) await learnMove(m,id);
  } finally{ EVO=null; lock--; if(!inBattle) MUS.play(zoneMusic()); saveGame(); } }

/* --- défaite --------------------------------------------------------------- */
async function blackout(){ await say(GS.name+" n'a plus de personnage en forme !"); const lost=Math.floor(GS.money/2); GS.money-=lost;
  await say(GS.name+" panique et perd "+lost+" Berrys…"); await say("… … …"); healAll();
  if(!GS.flags.champion) for(let i=0;i<4;i++) delete GS.flags['elite'+i];
  const c=GS.lastCenter; P.map=c.map; P.zone=c.zone; P.x=c.x; P.y=c.y; P.dir='up'; P.mv=null;
  if(c.map==='centre'){ const b=WORLD.build.find(b=>b.kind==='centre'&&b.zone===c.zone); if(b) P.ret={x:b.door[0],y:b.door[1]+1}; }
  else P.ret={x:6,y:WORLD.zones.find(z=>z.id==='home').y0+22}; }

/* --- capture ------------------------------------------------------------- */
async function throwBall(id){ const it=ITEMS[id], m=B.foe.m; await say(GS.name+" utilise : "+it.nm+" !");
  if(B.trainer){ BA.ball={t:0}; await tween(500,k=>{ BA.ball.t=k; }); BA.ball=null; await say("Le dresseur brise le sceau !"); await say("Voler, c'est mal !"); return false; }
  BA.ball={t:0,col:id==='masterOrbe'?'#a040c0':id==='hyperOrbe'?'#f0c020':id==='superOrbe'?'#3070e0':'#e03030'}; AU.jump(); await tween(550,k=>{ BA.ball.t=k; });
  await tween(250,k=>{ BA.foe.sc=1-k; }); BA.foe.sc=0; BA.ball.t=1;
  let shakes=0; const rate=SPECIES[m.n].catch, stb=m.st==='slp'||m.st==='frz'?2:m.st?1.5:1;
  const a=((3*m.maxhp-2*m.hp)*rate*it.ball)/(3*m.maxhp)*stb;
  if(it.ball>=255||a>=255) shakes=4; else { const b=1048560/Math.sqrt(Math.sqrt(16711680/a)); while(shakes<4&&Math.random()*65536<b) shakes++; }
  for(let i=0;i<Math.min(3,shakes);i++){ await sleep(350); AU.shake(); BA.ball.wob=1; await sleep(200); BA.ball.wob=0; }
  if(shakes>=4){ await sleep(300); AU.catch_(); BA.ball.done=1; await say("Scellé !\n"+SPECIES[m.n].name+" est capturé !"); const isNew=!GS.dex.caught[m.n];
    if(isNew){ caught(m.n); await say("Les données de "+SPECIES[m.n].name+" sont ajoutées à l'Animédex !"); await dexEntry(m.n); }
    m.st=m.st==='tox'?'psn':m.st; const w=addMon(m); if(w==='box') await say(SPECIES[m.n].name+" est envoyé dans le PC.");
    return true; }
  await sleep(250); BA.ball=null; await tween(200,k=>{ BA.foe.sc=k; }); BA.foe.sc=1;
  await say(["Oh non ! Il s'est libéré !","Raah ! Ça y était presque !","Mince ! Presque !","Argh ! Si près du but !"][shakes]); return false; }

/* --- rendu du combat ----------------------------------------------------- */
const BG_THEME={grass:['#f8f8e0','#c8e8a0','#a8d080'],forest:['#e8f0d8','#98c880','#78a860'],sand:['#f8f0d0','#f0d898','#d8b870'],ash:['#e8e0e0','#c0b0a8','#a09088'],
  violet:['#f0e8f8','#d0b8e8','#b098d0'],swamp:['#e0e8d8','#a0b888','#809870'],rock:['#f0ece0','#d0c8b0','#b0a890']};
function renderBattle(){ const th=BG_THEME[(P.map==='world'?zoneAt(P.y).theme:'rock')]||BG_THEME.grass; const sh=BA.shake?Math.round(Math.sin(T*90)*2):0;
  ctx.fillStyle=th[0]; ctx.fillRect(0,0,W,H);
  ctx.fillStyle=th[1]; ctx.beginPath(); ctx.ellipse(120,58,36,9,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=th[2]; ctx.beginPath(); ctx.ellipse(120,60,30,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=th[1]; ctx.beginPath(); ctx.ellipse(40,94,42,10,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=th[2]; ctx.beginPath(); ctx.ellipse(40,96,34,7,0,0,Math.PI*2); ctx.fill();
  if(!B){ return; }
  const drawMon=(img,a,cx,by,size,breath)=>{ if(!a.vis||a.blink||a.sc<=0) return; const s=size*a.sc, dh=a.drop*s;
    const w=Math.round(s*a.sx), h=Math.round(s*a.sy-breath); ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,by+1); ctx.clip();
    const x=Math.round(cx-w/2+a.x+sh), y=Math.round(by-h+a.y+dh);
    if(a.flip){ ctx.translate(x+w,y); ctx.scale(-1,1); ctx.drawImage(img,0,0,w,h); } else ctx.drawImage(img,x,y,w,h); ctx.restore(); };
  const idle=!B.intro&&!BA.fx;
  const fb=idle&&BA.foe.drop===0?Math.floor(T*2.2)%2:0, mb=idle&&B.menu?Math.floor(T*3.2)%2*2:0;
  if(BA.trainer) ctx.drawImage(BA.trainer,Math.round(96+BA.foe.x),8,48,48); else drawMon(charSprite(B.foe.m.n),BA.foe,120,62,56,fb);
  if(BA.player) ctx.drawImage(PS.up,Math.round(16+BA.me.x),48,48,48); else if(!B.intro||1) { BA.me.y+=mb; drawMon(charSprite(B.me.m.n,true),BA.me,40,98,56,0); BA.me.y-=mb; }
  if(B.intro&&!BA.player){}
  if(BA.ball&&!BA.ball.done||BA.ball&&BA.ball.done){ const k=BA.ball.t, x=40+(116-40)*k, y=80-(Math.sin(k*Math.PI)*50)+(k>=1?-26:0)*0+(k*-26)+ (k>=1?0:0); const wob=BA.ball.wob?Math.sin(T*40)*2:0;
    drawBall(Math.round(x+wob),Math.round(k>=1?54:y),BA.ball.col||'#e03030'); if(BA.ball.done){ for(let i=0;i<3;i++){ ctx.fillStyle='#f8e040'; ctx.fillRect(116+Math.cos(T*4+i*2)*10,48+Math.sin(T*4+i*2)*6,2,2); } } }
  if(BA.fx) drawFX(BA.fx);
  if(BA.flash){ ctx.fillStyle='#f8f8f8'; ctx.fillRect(0,0,W,H); } }
function drawBall(x,y,col){ /* parchemin / carte de capture */ ctx.fillStyle='#202028'; ctx.fillRect(x-5,y-4,10,8); ctx.fillStyle='#f0e0b0'; ctx.fillRect(x-4,y-3,8,6); ctx.fillStyle=col; ctx.fillRect(x-4,y-1,8,2); ctx.fillStyle='#806040'; ctx.fillRect(x-5,y-4,1,8); ctx.fillRect(x+4,y-4,1,8); }
function drawFX(f){ const on=f.on==='foe', cx=on?120:40, cy=on?36:72, k=f.t, col=f.col; ctx.save();
  const parts=(n,fn)=>{ for(let i=0;i<n;i++) fn(i,i/n); };
  if(f.kind==='buff'){ ctx.globalAlpha=1-k; ctx.strokeStyle=col; ctx.lineWidth=2; parts(3,(i)=>{ ctx.beginPath(); ctx.ellipse(cx,cy+20-k*40+i*10,18,4,0,0,Math.PI*2); ctx.stroke(); }); ctx.restore(); return; }
  const fromX=on?40:120, fromY=on?72:36, px=fromX+(cx-fromX)*Math.min(1,k*1.6), py=fromY+(cy-fromY)*Math.min(1,k*1.6), hit=k>.6;
  switch(f.kind){
    case 'Feu': parts(10,(i,u)=>{ const a=u*6.28+k*8, r=hit?6+(k-.6)*50:4; ctx.fillStyle=i%2?'#f8d030':'#f05020'; const x=(hit?cx:px)+Math.cos(a)*r, y=(hit?cy:py)+Math.sin(a)*r*.7-(hit?(k-.6)*20:0); ctx.fillRect(x-2,y-2,4,4); }); break;
    case 'Eau': case 'Glace': parts(12,(i,u)=>{ const x=(hit?cx:px)+Math.cos(u*6.28)*(hit?(k-.5)*40:3), y=(hit?cy:py)+Math.sin(u*6.28)*(hit?(k-.5)*30:3); ctx.fillStyle=i%3?col:'#f8f8f8'; ctx.fillRect(x-1,y-2,f.kind==='Glace'?3:2,f.kind==='Glace'?3:4); }); break;
    case 'Électrique': if(hit){ ctx.strokeStyle='#f8e040'; ctx.lineWidth=2; parts(4,(i)=>{ ctx.beginPath(); let x=cx-20+i*13, y=cy-30; ctx.moveTo(x,y); for(let j=0;j<5;j++){ x+=rnd(-6,6); y+=12; ctx.lineTo(x,y); } ctx.stroke(); }); ctx.globalAlpha=.25; ctx.fillStyle='#f8f080'; ctx.fillRect(0,0,W,H); } else { ctx.fillStyle='#f8e040'; ctx.fillRect(px-2,py-2,5,5); } break;
    case 'Plante': parts(8,(i,u)=>{ const a=u*6.28+k*10, r=hit?18*(1-k)+4:2; const x=(hit?cx:px)+Math.cos(a)*r, y=(hit?cy:py)+Math.sin(a)*r; ctx.fillStyle=i%2?'#58a830':'#90e060'; ctx.fillRect(x-2,y-1,4,2); }); break;
    case 'Psy': case 'Fée': ctx.strokeStyle=col; ctx.lineWidth=2; parts(3,(i)=>{ const r=((k*3+i/3)%1)*30; ctx.globalAlpha=1-r/30; ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.7,0,0,Math.PI*2); ctx.stroke(); }); break;
    case 'Spectre': case 'Ténèbres': ctx.globalAlpha=.5*Math.sin(k*Math.PI); ctx.fillStyle=f.kind==='Spectre'?'#403060':'#201820'; ctx.fillRect(0,0,W,96); ctx.globalAlpha=1; parts(6,(i,u)=>{ ctx.fillStyle=col; ctx.fillRect(cx+Math.cos(u*6.28+k*6)*16-2,cy+Math.sin(u*6.28+k*6)*12-2,4,4); }); break;
    case 'Dragon': parts(14,(i,u)=>{ const x=px+Math.cos(u*6.28+k*12)*(6+u*10), y=py+Math.sin(u*6.28+k*12)*(6+u*8); ctx.fillStyle=i%2?'#7038f8':'#f05050'; ctx.fillRect(x-2,y-2,4,4); }); break;
    case 'Sol': case 'Roche': parts(8,(i,u)=>{ const x=cx-24+u*48, y=hit?cy+20-Math.abs(Math.sin(k*12+i))*14:cy+40; ctx.fillStyle=i%2?col:shade(col,.6); ctx.fillRect(x,y,5,5); }); break;
    case 'Poison': parts(8,(i,u)=>{ const x=(hit?cx:px)+Math.cos(u*6.28)*(hit?14:3), y=(hit?cy-(k-.6)*30:py)+Math.sin(u*6.28)*(hit?10:3); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,2.5,0,6.3); ctx.fill(); }); break;
    case 'Vol': ctx.strokeStyle='#f8f8f8'; ctx.lineWidth=2; parts(4,(i)=>{ ctx.beginPath(); ctx.arc(cx-30+k*60,cy-12+i*8,10,-.6,.6); ctx.stroke(); }); break;
    default: /* coups physiques : étoiles d'impact */
      if(hit){ const r=4+(k-.6)*30; ctx.fillStyle=col==='#a8a878'?'#f8f8f8':col; parts(6,(i,u)=>{ ctx.fillRect(cx+Math.cos(u*6.28)*r-2,cy+Math.sin(u*6.28)*r-2,4,4); }); ctx.fillStyle='#f8f8f8'; ctx.fillRect(cx-4,cy-4,8,8); } }
  ctx.restore(); }
function renderEvo(){ ctx.fillStyle='#f8f8f8'; ctx.fillRect(0,0,W,H); const img=charSprite(EVO.show);
  if(EVO.white){ const [c,g]=mk(); g.drawImage(img,0,0); g.globalCompositeOperation='source-atop'; g.fillStyle=Math.floor(T*8)%2?'#f8f8f8':'#a0a0b0'; g.fillRect(0,0,56,56); ctx.drawImage(c,52,24); }
  else ctx.drawImage(img,52,24); }
