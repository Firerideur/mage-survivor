/* =========================================================================
   JEU — état de la partie, personnages (instances), PNJ, scénario,
   déplacements, rencontres et rendu du monde.
   ========================================================================= */
const GYMS=WORLD.gyms, ELITE=WORLD.elite;
const ITEMS={
  orbe:{nm:'Orbe',price:200,ball:1,d:"Capture un personnage sauvage."},
  superOrbe:{nm:'Super Orbe',price:600,ball:1.5,badges:2,d:"Meilleure chance de capture."},
  hyperOrbe:{nm:'Hyper Orbe',price:1200,ball:2,badges:5,d:"Très bonne chance de capture."},
  masterOrbe:{nm:'Master Orbe',price:0,ball:255,d:"Capture à coup sûr."},
  potion:{nm:'Potion',price:300,heal:20,d:"Rend 20 PV."},
  superPotion:{nm:'Super Potion',price:700,heal:50,badges:2,d:"Rend 50 PV."},
  hyperPotion:{nm:'Hyper Potion',price:1200,heal:200,badges:4,d:"Rend 200 PV."},
  rappel:{nm:'Rappel',price:1500,revive:1,badges:3,d:"Ranime un personnage K.O."},
  antidote:{nm:'Antidote',price:100,cure:['psn','tox'],d:"Soigne le poison."},
  antiPara:{nm:'Anti-Para',price:200,cure:['par'],d:"Soigne la paralysie."},
  reveil:{nm:'Réveil',price:250,cure:['slp'],d:"Réveille un personnage."},
  antiBrule:{nm:'Anti-Brûle',price:250,cure:['brn'],d:"Soigne une brûlure."},
  totalSoin:{nm:'Total Soin',price:600,cure:['psn','tox','par','slp','brn','frz'],badges:4,d:"Soigne tous les statuts."},
  repousse:{nm:'Repousse',price:350,repel:100,d:"Éloigne les sauvages pendant 100 pas."},
  superBonbon:{nm:'Super Bonbon',price:0,candy:1,d:"Monte d'un niveau."},
  pierreEau:{nm:'Pierre Eau',price:2100,stone:1,shop:'psyche',d:"Fait évoluer certains personnages."},
  pierreFoudre:{nm:'Pierre Foudre',price:2100,stone:1,shop:'psyche',d:"Fait évoluer certains personnages."},
  pierreFeu:{nm:'Pierre Feu',price:2100,stone:1,shop:'psyche',d:"Fait évoluer certains personnages."}};
const GROUND_ITEMS=['potion','orbe','superBonbon','antidote','superPotion','orbe','reveil','rappel','superBonbon','hyperPotion','superOrbe','pierreEau','totalSoin','superBonbon','hyperOrbe','pierreFeu','pierreFoudre','masterOrbe'];

/* --- état de la partie ------------------------------------------------- */
let GS=null;
function newGame(){ GS={name:'LOAN',rival:'KENJI',money:3000,badges:[],flags:{},party:[],box:[],bag:{potion:1},dex:{seen:{},caught:{}},
  lastCenter:{map:'maison',zone:'home',x:4,y:6},starter:0,time:0,repel:0,steps:0}; }
/* --- personnages (instances) ------------------------------------------- */
const STAT_NAMES=['PV','ATTAQUE','DÉFENSE','SPÉCIAL','VITESSE'];
function calcStats(m){ const b=SPECIES[m.n].st; const s=b.map((v,i)=>i===0?Math.floor((2*v+m.iv[i])*m.lv/100)+m.lv+10:Math.floor((2*v+m.iv[i])*m.lv/100)+5); m.stats=s; m.maxhp=s[0]; return m; }
function xpFor(lv){ return lv<=1?0:Math.floor(lv*lv*lv*.9); }
function makeMon(n,lv,opt){ opt=opt||{}; const m={n,lv,iv:[0,0,0,0,0].map(()=>rint(0,31)),xp:xpFor(lv),st:null,moves:[]};
  calcStats(m); m.hp=m.maxhp; const learn=SPECIES[n].learn.filter(([l])=>l<=lv).map(([,i])=>i); const uniq=[...new Set(learn)];
  m.moves=uniq.slice(-4).map(i=>({id:i,pp:MOVES[i].pp})); if(!m.moves.length) m.moves=[{id:0,pp:35}]; return m; }
const monName=m=>m.nick||SPECIES[m.n].name;
function healAll(){ for(const m of GS.party){ m.hp=m.maxhp; m.st=null; for(const mv of m.moves) mv.pp=MOVES[mv.id].pp; } }
function seen(n){ GS.dex.seen[n]=1; } function caught(n){ GS.dex.seen[n]=1; GS.dex.caught[n]=1; }
function addMon(m){ caught(m.n); if(GS.party.length<6){ GS.party.push(m); return 'party'; } GS.box.push(m); return 'box'; }
function giveItem(id,n){ GS.bag[id]=(GS.bag[id]||0)+(n||1); }

/* --- joueur ------------------------------------------------------------ */
const P={map:'maison',zone:'home',x:4,y:6,dir:'down',mv:null,foot:0,turnT:0,bumpT:0,ret:null};
let lock=0, fade=null, title=true, rustle=0, inBattle=false, emote=null;

/* --- PNJ ---------------------------------------------------------------- */
const LOOKS=[{cap:'#e04848',top:'#4870d0'},{girl:1,hair:'#a04020',top:'#f070a0',pants:'#4050a0'},{nocap:1,hair:'#202020',top:'#40a060'},{girl:1,hair:'#f0d050',top:'#5090e0'},
  {cap:'#40a040',top:'#f0c040'},{nocap:1,hair:'#806040',top:'#a050c0',pants:'#303030'},{girl:1,hair:'#202020',top:'#e04040',pants:'#202020'},{cap:'#303030',top:'#808080'}];
let NPCS=[];
function npcFlag(n){ return GS.flags[n.flag||n.id]; }
function buildNPCs(){ NPCS=[];
  /* dresseurs des routes */
  WORLD.npcs.forEach((t,i)=>{ if(t.kind!=='trainer') return; NPCS.push({id:t.id,map:'world',x:t.x,y:t.y,dir:t.x<11?'right':'left',look:LOOKS[i%LOOKS.length],trainer:t,sight:4}); });
  /* gardes : bloquent la sortie nord tant que le badge manque */
  for(const z of WORLD.zones){ const gym=GYMS.find(g=>g.zone===z.id); if(!gym&&z.id!=='home') continue;
    const need=z.id==='home'?'starter':'badge_'+z.id;
    NPCS.push({id:'garde_'+z.id,map:'world',x:11,y:z.y0+1,dir:'down',look:{cap:'#303060',top:'#303060',pants:'#202040'},gate:need,
      text:z.id==='home'?"Les hautes herbes sont dangereuses sans compagnon ! Va voir le Prof. Érable au labo.":"Halte ! Il faut le "+gym.badge.toUpperCase()+" de "+z.name+" pour passer."});
    NPCS.push({id:'barriere_'+z.id,map:'world',x:12,y:z.y0+1,barrier:1,gate:need}); }
  /* rivale sur les routes */
  const rz=id=>WORLD.zones.find(z=>z.id===id);
  NPCS.push({id:'rival1',map:'world',x:12,y:rz('r3').y0+14,dir:'down',look:{nocap:1,hair:'#c03030',top:'#303848',pants:'#202020'},rival:2,flag:'rival2'});
  NPCS.push({id:'rival2',map:'world',x:12,y:rz('r6').y0+11,dir:'down',look:{nocap:1,hair:'#c03030',top:'#303848',pants:'#202020'},rival:3,flag:'rival3'});
  NPCS.push({id:'rival3',map:'world',x:12,y:rz('victoire').y0+18,dir:'down',look:{nocap:1,hair:'#c03030',top:'#303848',pants:'#202020'},rival:4,flag:'rival4'});
  /* légendaires */
  for(const s of WORLD.static){ const z=rz(s.zone); NPCS.push({id:s.flag,map:'world',x:s.x,y:z.y0+s.y,dir:'down',legend:s}); }
  /* objets au sol */
  WORLD.items.forEach((it,i)=>NPCS.push({id:'item'+i,map:'world',x:it.x,y:it.y,ball:GROUND_ITEMS[i%GROUND_ITEMS.length]}));
  /* intérieurs */
  NPCS.push({id:'maman',map:'maison',zone:'home',x:6,y:4,dir:'left',look:{girl:1,hair:'#603020',top:'#e06080',pants:'#504060'},script:'maman'});
  NPCS.push({id:'soeur',map:'maison',zone:'rival',x:3,y:4,dir:'down',look:{girl:1,hair:'#c03030',top:'#f0d060'},text:"Mon frère KENJI est parti voir le Prof. Érable. Il veut devenir le meilleur dresseur du monde !"});
  NPCS.push({id:'prof',map:'labo',zone:'home',x:4,y:3,dir:'down',look:{nocap:1,hair:'#d0d0d0',top:'#f8f8f8',pants:'#806040'},script:'prof'});
  NPCS.push({id:'rivalLabo',map:'labo',zone:'home',x:6,y:5,dir:'up',look:{nocap:1,hair:'#c03030',top:'#303848',pants:'#202020'},script:'rivalLabo',flag:'rival1'});
  for(const z of WORLD.zones){ /* centres, boutiques, maisons, arènes de chaque ville */
    if(z.id==='home') continue;
    NPCS.push({id:'inf_'+z.id,map:'centre',zone:z.id,x:4,y:1,dir:'down',look:{girl:1,hair:'#f080b0',top:'#f8f8f8',pants:'#f8f8f8'},script:'infirmiere'});
    NPCS.push({id:'pcx_'+z.id,map:'centre',zone:z.id,x:1,y:4,dir:'right',look:LOOKS[(z.y0/3|0)%LOOKS.length],text:pick(["Le PC à droite sert à ranger tes personnages en trop.","Au-delà de 6 personnages, les nouvelles captures vont directement dans le PC.","Soigne-toi souvent ! Les champions d'arène ne font pas de cadeau."])});
    NPCS.push({id:'vend_'+z.id,map:'boutique',zone:z.id,x:1,y:1,dir:'down',look:{cap:'#4070d0',top:'#4070d0',pants:'#303030'},script:'vendeur'});
    NPCS.push({id:'hab_'+z.id,map:'maison',zone:z.id,x:5,y:4,dir:'down',look:LOOKS[(z.y0/7|0)%LOOKS.length],text:pick(["Le type Eau bat le Feu, le Feu bat la Plante, la Plante bat l'Eau. La base !","Les personnages évoluent en gagnant des niveaux. Certains ont besoin d'une pierre !","Le Spectre ne craint pas les attaques Normal ni Combat.","On dit qu'un être très puissant attendrait au nord du Plateau des Héros…","Les attaques du même type que le personnage font 50 % de dégâts en plus !","Les Super Bonbons font gagner un niveau d'un coup."])});
    const gym=GYMS.find(g=>g.zone===z.id); if(!gym) continue;
    NPCS.push({id:'champ_'+z.id,map:'arene',zone:z.id,x:4,y:2,dir:'down',look:{nocap:1,hair:shade(gym.col,.6),top:gym.col,pants:'#303030',girl:['MARINA','FLORA','TOXA','VOLTA'].includes(gym.leader)?1:0},gymLeader:gym,flag:'badge_'+z.id});
    gym.trainers.forEach((team,i)=>NPCS.push({id:'gt_'+z.id+i,map:'arene',zone:z.id,x:i?7:2,y:i?5:8,dir:i?'left':'right',sight:4,look:{nocap:1,hair:'#303030',top:gym.col,pants:'#303030',girl:i},
      trainer:{id:'gt_'+z.id+i,name:'Élève '+pick(['Ryo','Mai','Kaito','Hana','Sora','Ren']),team,money:team[0][1]*25,before:"Le champion "+gym.leader+" est trop fort pour toi !",after:"Notre champion va te remettre à ta place."}})); }
  /* Ligue */
  NPCS.push({id:'ligueGarde',map:'ligue',zone:'hall',x:4,y:2,dir:'down',look:{cap:'#d8b040',top:'#202848'},script:'ligueGarde'});
  ELITE.forEach((e,i)=>NPCS.push({id:'elite'+i,map:'arene',zone:'e'+i,x:4,y:2,dir:'down',look:{nocap:1,hair:shade(e.col,.5),top:e.col,pants:'#202020',girl:i%2===0?1:0},elite:i}));
  NPCS.push({id:'champion',map:'arene',zone:'champ',x:4,y:2,dir:'down',look:{nocap:1,hair:'#c03030',top:'#303848',pants:'#202020'},script:'champion'});
}
function npcVisible(n){ if(n.map!==P.map) return false; if(n.zone&&n.zone!==P.zone) return false;
  if(n.gate) return !gateOpen(n.gate); if(n.ball) return !GS.flags[n.id]; if(n.legend){ if(n.legend.after&&!GS.flags[n.legend.after]) return false; return !GS.flags[n.id]; }
  if(n.rival) return !GS.flags[n.flag]&&GS.starter>0; if(n.id==='rivalLabo') return !GS.flags.rival1; return true; }
function gateOpen(need){ return need==='starter'?GS.starter>0:GS.badges.includes(need.replace('badge_','')); }
function npcAt(x,y){ return NPCS.find(n=>npcVisible(n)&&n.x===x&&n.y===y); }

/* --- déplacements ------------------------------------------------------- */
const DIRV={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const heldDir=()=>['up','down','left','right'].find(k=>held[k]);
function blocked(x,y){ return solidTile(P.map,x,y)||!!npcAt(x,y); }
function tryMove(d){ const [dx,dy]=DIRV[d], tx=P.x+dx, ty=P.y+dy, t=tileAt(P.map,tx,ty), run=held.B;
  if(!MAPS[P.map].outdoor&&tileAt(P.map,P.x,P.y)==='m'&&d==='down'){ exitInterior(); return; }
  if(P.map==='world'&&t==='D'&&d==='up'){ enterBuilding(tx,ty); return; }
  if(P.map==='world'&&t==='v'&&d==='down'&&!blocked(tx,ty+1)){ P.mv={fx:P.x,fy:P.y,tx,ty:ty+1,t:0,dur:.42,jump:1}; AU.jump(); return; }
  if(blocked(tx,ty)){ if(P.bumpT<=0){ AU.bump(); P.bumpT=.26; P.foot^=1; } return; }
  P.mv={fx:P.x,fy:P.y,tx,ty,t:0,dur:run?.13:.26}; }
async function arrive(){ const m=P.mv; P.x=m.tx; P.y=m.ty; P.mv=null; P.foot^=1; GS.steps++;
  if(GS.repel>0){ GS.repel--; if(GS.repel===0){ lock++; await say("L'effet du Repousse s'est dissipé."); lock--; } }
  if(P.map==='world'){ const z=zoneAt(P.y); if(z.id!==P.zone){ P.zone=z.id; showZone(z.name); MUS.play(GYMS.find(g=>g.zone===z.id)||z.id==='home'||z.id==='plateau'?'town':'route'); } }
  if(await checkSight()) return;
  if(P.map==='world'&&tileAt('world',P.x,P.y)===':'){ AU.grass(); rustle=.3; if(GS.repel<=0&&Math.random()<1/9) await wildEncounter(); }
  if(GS.steps%20===0) saveGame(); }
let zoneBanner=null; function showZone(name){ zoneBanner={name,t:2.2}; }

/* --- regard des dresseurs ----------------------------------------------- */
async function checkSight(){ for(const n of NPCS){ if(!npcVisible(n)||!(n.trainer||n.rival||n.gymLeader)||!n.sight&&!n.rival) continue; if(GS.flags[n.trainer?n.trainer.id:n.flag]) continue;
    const sight=n.sight||4; const [dx,dy]=DIRV[n.dir];
    for(let i=1;i<=sight;i++){ const x=n.x+dx*i, y=n.y+dy*i; if(x===P.x&&y===P.y){ lock++; try{ await trainerSpotted(n,i); } finally{ lock--; } return true; } if(solidTile(P.map,x,y)||npcAt(x,y)) break; } }
  return false; }
async function trainerSpotted(n,dist){ AU.beep(1200,.15,'square',.05); emote={n,t:.7}; await sleep(700);
  const [dx,dy]=DIRV[n.dir]; for(let i=1;i<dist;i++){ n.x+=dx; n.y+=dy; await sleep(200); }
  P.dir={up:'down',down:'up',left:'right',right:'left'}[n.dir];
  await talkTo(n); }

/* --- interactions ------------------------------------------------------- */
async function interact(){ const [dx,dy]=DIRV[P.dir]; let x=P.x+dx, y=P.y+dy; let n=npcAt(x,y);
  if(!n&&['N'].includes(tileAt(P.map,x,y))) n=npcAt(x+dx,y+dy);
  if(n){ n.dir={up:'down',down:'up',left:'right',right:'left'}[P.dir]; return talkTo(n); }
  const t=tileAt(P.map,x,y);
  if(P.map==='world'){ if(t==='S'){ const z=zoneAt(y); const gym=GYMS.find(g=>g.zone===z.id);
      return say(z.id==='home'?(y>z.y0+20?"BOURG-ÉCUME\nUn village qui sent bon l'iode.":"ROUTE 1\nVers Ville-Céleste au nord."):(gym?z.name.toUpperCase()+"\nArène de type "+gym.type.toUpperCase()+" — Champion "+gym.leader+".":z.name.toUpperCase())); }
    if(t==='M') return say("C'est la boîte aux lettres. Elle est vide.");
    if(t==='r') return say("Un gros rocher."); }
  else { if(t==='Q') return pcMenu(); if(t==='t') return say("Une émission parle de créatures venues d'autres mondes…"); if(t==='K') return say("Plein de livres et de mangas !");
    if(t==='O'){ const gym=GYMS.find(g=>g.zone===P.zone); return say(gym?"ARÈNE DE "+zoneAt(WORLD.zones.find(z=>z.id===gym.zone).y0).name.toUpperCase()+"\nChampion : "+gym.leader+" ("+gym.type+")"+(GS.badges.includes(P.zone)?"\nVainqueur : "+GS.name:""):"LIGUE DES HÉROS"); }
    if(t==='B') return say("Un lit bien moelleux."); if(t==='c'&&P.map==='labo') return; }
}
async function talkTo(n){
  if(n.ball){ GS.flags[n.id]=1; giveItem(n.ball); AU.catch_(); return say(GS.name+" trouve : "+ITEMS[n.ball].nm+" !"); }
  if(n.barrier) return;
  if(n.gate) return say(n.text);
  if(n.legend){ const s=n.legend; await say(SPECIES[s.n].name.toUpperCase()+" te fixe intensément…"); const r=await startBattle({wild:makeMon(s.n,s.lv),legend:1}); if(r!=='lose') GS.flags[n.id]=1; return; }
  if(n.script) return SCRIPTS[n.script](n);
  if(n.rival) return rivalBattle(n.rival,n);
  if(n.gymLeader) return gymBattle(n);
  if(n.elite!=null) return eliteBattle(n);
  if(n.trainer){ const t=n.trainer; if(GS.flags[t.id]) return say(t.after); await say(t.name+" : "+t.before);
    const r=await startBattle({trainer:{name:t.name,team:t.team.map(([s,l])=>makeMon(s,l)),money:t.money,look:n.look}}); if(r==='win'){ GS.flags[t.id]=1; } return; }
  if(n.text) return say(n.text);
}
async function rivalBattle(stage,n){ const st=GS.flags.rivalStarter, lvl={2:16,3:31,4:44}[stage];
  const evo=s=>{ let x=s; const L=lvl; while(SPECIES[x].evo&&SPECIES[x].evo.lvl&&SPECIES[x].evo.lvl<=L) x=SPECIES[x].evo.to; return x; };
  const extra={2:[[21,lvl-2]],3:[[37,lvl-2],[56,lvl-1],[84,lvl-1]],4:[[38,lvl],[57,lvl-1],[85,lvl],[62,lvl]]}[stage];
  await say(GS.rival+" : Hé, "+GS.name+" ! On voit enfin qui est le plus fort ?");
  const r=await startBattle({trainer:{name:GS.rival,rival:1,team:extra.map(([s,l])=>makeMon(s,l)).concat([makeMon(evo(st),lvl+1)]),money:lvl*40,look:n.look}});
  if(r==='win'){ GS.flags[n.flag]=1; await say(GS.rival+" : Grr… Je vais m'entraîner encore plus dur ! On se reverra !"); } }
async function gymBattle(n){ const g=n.gymLeader, z=g.zone;
  if(GS.badges.includes(z)) return say(g.leader+" : Tu as mon "+g.badge+". Continue ton voyage, et deviens Maître !");
  await say(g.leader+" : Bienvenue dans mon arène ! Je suis "+g.leader+", maître du type "+g.type.toUpperCase()+". Prépare-toi !");
  MUS.play('gym'); const r=await startBattle({trainer:{name:(['MARINA','FLORA','TOXA','VOLTA'].includes(g.leader)?'Championne ':'Champion ')+g.leader,team:g.team.map(([s,l])=>makeMon(s,l)),money:g.team[g.team.length-1][1]*100,leader:1,look:n.look}});
  if(r!=='win') return; GS.badges.push(z); GS.flags['badge_'+z]=1; AU.catch_();
  await say(g.leader+" : Incroyable… Tu as mérité le "+g.badge.toUpperCase()+" !"); await say(GS.name+" reçoit le "+g.badge+" !");
  if(GS.badges.length===8) await say(g.leader+" : Avec 8 badges, la Route Victoire t'est ouverte. La Ligue t'attend tout au nord !"); saveGame(); }
async function eliteBattle(n){ const e=ELITE[n.elite]; if(GS.flags['elite'+n.elite]) return say(e.name+" : Avance. La suite t'attend.");
  await say(e.name+" : Bienvenue à la Ligue. Je suis "+e.name+" du Conseil des 4, spécialiste du type "+e.type.toUpperCase()+".");
  const r=await startBattle({trainer:{name:'Conseil '+e.name,team:e.team.map(([s,l])=>makeMon(s,l)),money:e.team[e.team.length-1][1]*120,leader:1,look:n.look}});
  if(r!=='win') return; GS.flags['elite'+n.elite]=1; await say(e.name+" : Tu es fort… La porte suivante est ouverte."); }
const SCRIPTS={
  async maman(){ await say("MAMAN : Tu pars à l'aventure ? Repose-toi un peu d'abord !"); if(GS.party.length){ healAll(); AU.heal(); await say("Ton équipe est en pleine forme !"); } },
  async infirmiere(){ if(!await yesNo("Bienvenue au Centre de Soin ! Veux-tu soigner ton équipe ?")) return say("À bientôt !");
    healAll(); AU.heal(); GS.lastCenter={map:'centre',zone:P.zone,x:4,y:4}; await sleep(600); await say("Ton équipe est en pleine forme ! À bientôt !"); saveGame(); },
  async vendeur(){ await shopMenu(); },
  async prof(){ if(GS.starter){ if(GS.flags.champion&&!GS.flags.cadeauStarters){ GS.flags.cadeauStarters=1; await say("PROF. ÉRABLE : Champion ! Tiens, prends les deux autres compagnons du début. Ils seront mieux avec toi.");
        for(const s of [1,4,7]) if(s!==GS.starter){ const w=addMon(makeMon(s,30)); await say(GS.name+" reçoit "+SPECIES[s].name+" !"+(w==='box'?" (envoyé au PC)":"")); } return; }
      const c=Object.keys(GS.dex.caught).length; return say("PROF. ÉRABLE : Ton Animédex compte "+c+" personnage"+(c>1?'s':'')+" capturé"+(c>1?'s':'')+" sur 151. Continue !"); }
    await say("PROF. ÉRABLE : Bonjour "+GS.name+" ! Des personnages d'autres mondes sont apparus dans notre région…");
    await say("On peut s'en faire des alliés, les entraîner et les faire évoluer. Choisis ton premier compagnon sur la table !"); },
  async rivalLabo(){ if(!GS.starter) return say(GS.rival+" : Vas-y, choisis en premier. Je prendrai celui qui te bat !"); },
  async ligueGarde(){ if(GS.badges.length<8) return say("GARDE : Seuls les dresseurs avec 8 badges peuvent défier la Ligue.");
    await say("GARDE : 8 badges ! Le Conseil des 4 t'attend derrière cette porte. Bonne chance !"); },
  async champion(n){ if(GS.flags.champion) return say(GS.rival+" : Tu es le Maître… et mon meilleur rival.");
    await say(GS.rival+" : Te voilà enfin ! C'est moi le Maître de la Ligue ! Montre-moi tout ce que tu as appris !");
    const st=GS.flags.rivalStarter, fin=st===1?3:st===4?6:9;
    const r=await startBattle({trainer:{name:'Maître '+GS.rival,team:[[31,60],[62,60],[18,61],[38,60],[150===0?1:149,61],[fin,63]].map(([s,l])=>makeMon(s,l)),money:10000,leader:1,rival:1,look:n.look}});
    if(r!=='win') return; GS.flags.champion=1; MUS.play('victory');
    await say(GS.rival+" : J'ai perdu… Tu es le nouveau MAÎTRE de la Ligue !");
    await say("Félicitations, "+GS.name+" ! Ton nom entre au Panthéon des Héros avec ton équipe : "+GS.party.map(monName).join(', ')+".");
    await say("FIN… ou presque ! Des êtres légendaires sont apparus dans la région, et le Prof. Érable a un cadeau pour toi."); saveGame(); }
};
/* choix du starter : les 3 orbes sur la table du labo */
async function labTable(x){ if(GS.starter) return say("La table est vide."); const opts=[1,4,7], i=x-3; if(i<0||i>2) return; const n=opts[i];
  lock++; try{ PREVIEW={n,t:0}; const ok=await yesNo("C'est "+SPECIES[n].name+" ("+SPECIES[n].types.join('/')+"). Tu le choisis ?"); PREVIEW=null; if(!ok) return;
    GS.starter=n; const m=makeMon(n,5); addMon(m); AU.catch_(); await say(GS.name+" reçoit "+SPECIES[n].name+" !");
    const rs={1:4,4:7,7:1}[n]; GS.flags.rivalStarter=rs; await say(GS.rival+" : Alors moi je prends "+SPECIES[rs].name+" ! Allez, combat !");
    const r=await startBattle({trainer:{name:GS.rival,rival:1,team:[makeMon(rs,5)],money:200,look:{nocap:1,hair:'#c03030',top:'#303848',pants:'#202020'}},noLose:1});
    GS.flags.rival1=1; if(r==='win') await say(GS.rival+" : Quoi ?! Bon, j'irai m'entraîner sur la route !"); else await say(GS.rival+" : Ha ! Je suis le meilleur ! On se reverra !");
    healAll(); await say("PROF. ÉRABLE : Prends aussi ces 5 Orbes pour capturer des personnages. Et ton Animédex !"); giveItem('orbe',5); GS.flags.dex=1; saveGame(); } finally{ lock--; } }
let PREVIEW=null;

/* --- entrées / sorties des bâtiments ----------------------------------- */
function enterBuilding(x,y){ const b=WORLD.build.find(b=>b.door[0]===x&&b.door[1]===y); if(!b) return;
  const map={centre:'centre',boutique:'boutique',arene:'arene',maison:'maison',maisonJoueur:'maison',maisonRival:'maison',labo:'labo',ligue:'ligue'}[b.kind];
  const zone=b.kind==='maisonRival'?'rival':b.kind==='ligue'?'hall':b.zone;
  const M0=MAPS[map]; warp(map,zone,4,M0.h-1,'up',{x,y:y+1}); if(b.kind==='arene') MUS.play('gym'); }
function exitInterior(){ if(P.map==='arene'&&P.zone&&P.zone[0]==='e'||P.zone==='champ'){ warp('ligue','hall',4,7,'down',P.ret); return; }
  const r=P.ret||{x:6,y:WORLD.zones.find(z=>z.id==='home').y0+22}; warp('world',zoneAt(r.y).id,r.x,r.y,'down',null); }
function warp(map,zone,x,y,dir,ret){ AU.door(); lock++; fade={t:0,d:.5,then:()=>{ P.map=map; P.zone=zone; P.x=x; P.y=y; P.dir=dir; P.mv=null; if(ret!==undefined) P.ret=ret||P.ret;
  if(map==='world') MUS.play(GYMS.find(g=>g.zone===zone)||zone==='home'?'town':'route'); saveGame(); },done:()=>lock--}; }
/* portes de la Ligue : la porte du haut mène à la salle suivante */
function leaguePortal(){ if(P.map==='ligue'&&P.zone==='hall'&&P.y===2&&(P.x===4||P.x===5)){ if(GS.badges.length<8) return false; warp('arene','e0',4,10,'up',P.ret); return true; }
  if(P.map==='arene'&&P.zone[0]==='e'&&P.y===2&&(P.x===4||P.x===5)){ const i=+P.zone[1]; if(!GS.flags['elite'+i]) return false; warp('arene',i<3?'e'+(i+1):'champ',4,10,'up',P.ret); return true; } return false; }

/* --- rencontres sauvages ------------------------------------------------ */
async function wildEncounter(){ const z=zoneAt(P.y), tab=WORLD.enc[z.id]; if(!tab) return; let tot=0; for(const e of tab) tot+=e[3]; let r=Math.random()*tot, e=tab[0];
  for(const x of tab){ r-=x[3]; if(r<=0){ e=x; break; } } lock++; try{ await startBattle({wild:makeMon(e[0],rint(e[1],e[2]))}); } finally{ lock--; } }

/* --- mise à jour ------------------------------------------------------- */
function update(dt){
  GS&&(GS.time+=dt);
  if(fade){ fade.t+=dt; if(fade.t>=fade.d/2&&fade.then){ fade.then(); fade.then=null; } if(fade.t>=fade.d){ const d=fade.done; fade=null; d&&d(); } return; }
  if(zoneBanner){ zoneBanner.t-=dt; if(zoneBanner.t<=0) zoneBanner=null; }
  if(emote){ emote.t-=dt; if(emote.t<=0) emote=null; }
  if(title||inBattle||lock>0||UIBUSY>0) return;
  if(P.bumpT>0) P.bumpT-=dt; if(rustle>0) rustle-=dt;
  if(P.mv){ P.mv.t+=dt; if(P.mv.t>=P.mv.dur){ lock++; arrive().finally(()=>{ lock--; if(leaguePortal()); }); } return; }
  const d=heldDir();
  if(!d) P.turnT=0;
  else if(d!==P.dir){ P.dir=d; P.turnT=.09; }
  else if(P.turnT>0) P.turnT-=dt;
  else tryMove(d);
}
/* touches d'action (A, START) dans le monde */
const worldKeys=k=>{ if(title||inBattle||lock>0||UIBUSY>0||fade||P.mv) return;
  if(k==='A'){ const [dx,dy]=DIRV[P.dir]; if(P.map==='labo'&&tileAt('labo',P.x+dx,P.y+dy)==='c'){ labTable(P.x+dx); return; }
    lock++; interact().finally(()=>lock--); }
  if(k==='START'){ lock++; startMenu().finally(()=>lock--); } };

/* --- rendu du monde ----------------------------------------------------- */
let T=0;
function drawTile(m,t,x,y,sx,sy){ const M=MAPS[m];
  if(M.outdoor){ const z=zoneAt(Math.max(0,Math.min(y,M.h-1))), th=themeTiles(z.theme), base=th.grass[((x*7+y*13)%5+5)%5%3];
    switch(t){
      case '=': ctx.drawImage(PATH,sx,sy); break; case ':': ctx.drawImage(th.tall,sx,sy); break;
      case 'f': ctx.drawImage(th.flower[Math.floor(T*2.2+x)%2],sx,sy); break;
      case '~': ctx.drawImage(WATER[Math.floor(T*2.5)%3],sx,sy); if(tileAt(m,x,y-1)!=='~'){ ctx.fillStyle=PAL.d; ctx.fillRect(sx,sy,16,2); } break;
      case 'T': ctx.drawImage(base,sx,sy); ctx.drawImage(th.tree,sx,sy); break;
      case 'X': ctx.drawImage(CLIFF,sx,sy); break;
      case 'v': ctx.drawImage(th.ledge,sx,sy); break; case '#': ctx.drawImage(FENCE(base),sx,sy); break;
      case 'S': ctx.drawImage(base,sx,sy); ctx.drawImage(SIGNART,sx+1,sy+3); break; case 'M': ctx.drawImage(base,sx,sy); ctx.drawImage(MAILART,sx+2,sy+3); break;
      case 'r': ctx.drawImage(base,sx,sy); ctx.drawImage(ROCKART,sx+1,sy+4); break; case 'B': case 'D': ctx.drawImage(PATH,sx,sy); break;
      default: ctx.drawImage(base,sx,sy); }
    if(t==='='){ ctx.fillStyle=PAL.D; for(const [dx,dy,rx,ry,rw,rh] of [[0,-1,0,0,16,1],[0,1,0,15,16,1],[-1,0,0,0,1,16],[1,0,15,0,1,16]]){ const n=tileAt(m,x+dx,y+dy); if(n!=='='&&n!=='B'&&n!=='D') ctx.fillRect(sx+rx,sy+ry,rw,rh); } }
  } else { const gym=m==='arene'&&(GYMS.find(g=>g.zone===P.zone)||ELITE[+P.zone[1]]);
    switch(t){ case 'w': ctx.drawImage(y===0?WALLTOP:(x%4===1?WINDOW:WALL),sx,sy); break; case 'm': ctx.drawImage(FLOOR,sx,sy); ctx.drawImage(MAT,sx,sy); break;
      case ' ': ctx.fillStyle='#000'; ctx.fillRect(sx,sy,16,16); break; case 'N': ctx.drawImage(TILEFLOOR,sx,sy); ctx.drawImage(COUNTER,sx,sy); break;
      default: ctx.drawImage(m==='centre'||m==='boutique'||m==='ligue'?TILEFLOOR:FLOOR,sx,sy); if(gym){ ctx.fillStyle=gym.col; ctx.globalAlpha=.25; ctx.fillRect(sx,sy,16,16); ctx.globalAlpha=1; } }
    if(t==='Q') ctx.drawImage(PCART,sx,sy); if(t==='K') ctx.drawImage(SHELF,sx,sy); if(t==='t') ctx.drawImage(TV,sx,sy); if(t==='v') ctx.drawImage(PLANT,sx,sy);
    if(t==='B'&&tileAt(m,x-1,y)!=='B') ctx.drawImage(BED,sx,sy); if(t==='c') ctx.drawImage(TABLE,sx,sy); if(t==='O') ctx.drawImage(STATUE,sx,sy);
    if(m==='labo'&&t==='c'&&!GS.starter){ ctx.drawImage(BALLART,sx+2,sy+1); }
    if(m==='arene'&&y<=1&&(x===4||x===5)&&P.zone&&(P.zone[0]==='e'||P.zone==='champ')){ ctx.fillStyle=P.zone!=='champ'&&GS.flags['elite'+P.zone[1]]?'#303040':'#806040'; ctx.fillRect(sx+1,sy+2,14,14); }
    if(m==='ligue'&&y<=1&&(x===4||x===5)){ ctx.fillStyle='#303040'; ctx.fillRect(sx+1,sy+2,14,14); } }
}
function playerPos(){ if(!P.mv) return [P.x*16,P.y*16,0]; const m=P.mv, k=Math.min(1,m.t/m.dur); return [(m.fx+(m.tx-m.fx)*k)*16,(m.fy+(m.ty-m.fy)*k)*16,m.jump?Math.sin(k*Math.PI)*10:0]; }
function spriteFor(S,d,walking,foot){ if(!walking) return S[d]; if(d==='down') return foot?S.downW2:S.downW; if(d==='up') return foot?S.upW2:S.upW; return S[d+'W']; }
function renderWorld(){
  const M=MAPS[P.map], [px,py,jz]=playerPos(); let cx=Math.round(px-64), cy=Math.round(py-64);
  if(!M.outdoor){ cx=M.w*16<=W?Math.round((M.w*16-W)/2):clamp(cx,0,M.w*16-W); cy=M.h*16<=H?Math.round((M.h*16-H)/2):clamp(cy,-8,M.h*16-H+8); }
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  const x0=Math.floor(cx/16), y0=Math.floor(cy/16);
  for(let ty=y0;ty<=y0+9;ty++) for(let tx=x0;tx<=x0+10;tx++) drawTile(P.map,tileAt(P.map,tx,ty),tx,ty,tx*16-cx,ty*16-cy);
  for(const b of M.build) if(b.y*16-cy<H&&(b.y+b.h)*16-cy>0) ctx.drawImage(b.img,b.x*16-cx,b.y*16-cy);
  /* PNJ */
  for(const n of NPCS){ if(!npcVisible(n)) continue; const sx=n.x*16-cx, sy=n.y*16-cy-4; if(sx<-16||sx>W||sy<-20||sy>H) continue;
    if(n.ball){ ctx.drawImage(BALLART,sx+2,sy+8); continue; }
    if(n.barrier){ ctx.fillStyle=PAL.k; ctx.fillRect(sx+3,sy+8,10,10); ctx.fillStyle='#e8e8f0'; ctx.fillRect(sx+4,sy+9,8,8); ctx.fillStyle='#e04040'; ctx.fillRect(sx+4,sy+11,8,2); continue; }
    if(n.legend){ const s=charSprite(n.legend.n); ctx.drawImage(s,sx-8,sy-14+Math.sin(T*3)*1.5,32,32); continue; }
    ctx.drawImage(npcSprites(n.look)[n.dir],sx,sy);
    if(emote&&emote.n===n){ ctx.fillStyle='#f8f8f8'; ctx.fillRect(sx+4,sy-12,8,10); ctx.fillStyle=PAL.k; ctx.strokeStyle=PAL.k; ctx.strokeRect(sx+4.5,sy-11.5,7,9); ctx.fillRect(sx+7,sy-10,2,4); ctx.fillRect(sx+7,sy-5,2,1); } }
  /* joueur */
  const sx=Math.round(px-cx), sy=Math.round(py-cy)-4;
  if(jz){ ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx+8,sy+18,6,2,0,0,Math.PI*2); ctx.fill(); }
  const walking=P.mv&&!P.mv.jump?(P.mv.t/P.mv.dur)<.5:P.bumpT>.13;
  ctx.drawImage(spriteFor(PS,P.dir,walking,P.foot),sx,Math.round(sy-jz));
  const gx=Math.round(px/16), gy=Math.round(py/16);
  if(M.outdoor&&tileAt(P.map,gx,gy)===':'&&!jz){ const th=themeTiles(zoneAt(gy).theme); ctx.drawImage(th.tall,0,8,16,8,gx*16-cx,gy*16-cy+8,16,8); }
  if(zoneBanner){ const k=Math.min(1,zoneBanner.t*3,(2.2-zoneBanner.t)*6); ctx.fillStyle='rgba(248,248,248,.95)'; ctx.fillRect(4,Math.round(-20+24*k),Math.max(60,zoneBanner.name.length*4+12),14);
    ctx.fillStyle=PAL.k; ctx.fillRect(4,Math.round(-20+24*k)+13,Math.max(60,zoneBanner.name.length*4+12),1); pixText(ctx,zoneBanner.name,10,Math.round(-20+24*k)+5,'#202028'); }
  if(PREVIEW){ const s=charSprite(PREVIEW.n); ctx.fillStyle='rgba(248,248,248,.92)'; ctx.fillRect(48,16,64,64); ctx.strokeStyle=PAL.k; ctx.strokeRect(48.5,16.5,63,63); ctx.drawImage(s,52,20); }
}
