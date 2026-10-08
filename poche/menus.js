/* =========================================================================
   MENUS — START, équipe, résumé, sac, Animédex, PC, boutique, options.
   ========================================================================= */
const ICONS={};
function icon(n){ if(ICONS[n]) return ICONS[n]; return ICONS[n]=charSprite(n).toDataURL(); }
function panel(cls,html){ const p=el('panel '+(cls||''),html); return p; }
async function waitAB(){ let k; do{ k=await nextKey(); }while(k!=='A'&&k!=='B'); return k; }
function hpBarHTML(m){ return `<span class="hpb">${bar(m.hp,m.maxhp)}</span>`; }

/* --- équipe ---------------------------------------------------------------- */
async function partyMenu(opt){ opt=opt||{}; UIBUSY++; const bg=panel('party-bg');
  try{ let start=0; for(;;){
    const items=GS.party.map(m=>`<img src="${icon(m.n)}"><span class="pn">${esc(monName(m))}</span><span class="pl">${m.st?ST_NAME[m.st]:'N'+m.lv}</span>${hpBarHTML(m)}<span class="ph">${m.hp}/${m.maxhp}</span>`);
    const hint=el('phint',opt.forced?'Qui envoyer au combat ?':opt.pick?esc(opt.pick):'Choisis un personnage.');
    if(opt.forced&&GS.party[start]&&GS.party[start].hp<=0) start=Math.max(0,GS.party.findIndex(m=>m.hp>0));
    const i=await choose(items,{cls:'party',start,noCancel:opt.forced}); hint.remove(); start=Math.max(0,i);
    if(i<0) return -1; if(opt.pick) return i;
    const m=GS.party[i];
    if(opt.battle){ const r=await choose(['ENVOYER','RÉSUMÉ','RETOUR'],{cls:'sub'}); if(r===1){ await summary(m); continue; } if(r!==0) continue;
      if(m.hp<=0){ await say(monName(m)+" est K.O. !"); continue; } if(B&&i===B.meIdx&&!opt.forced){ await say(monName(m)+" est déjà au combat !"); continue; } return i; }
    const r=await choose(['RÉSUMÉ','DÉPLACER','RETOUR'],{cls:'sub'});
    if(r===0) await summary(m);
    if(r===1&&GS.party.length>1){ const h=el('phint','Échanger avec qui ?'); const j=await choose(items,{cls:'party',start:i}); h.remove(); if(j>=0&&j!==i){ [GS.party[i],GS.party[j]]=[GS.party[j],GS.party[i]]; AU.ok(); } } }
  } finally{ bg.remove(); UIBUSY--; } }
async function summary(m){ UIBUSY++; const sp=SPECIES[m.n]; let page=0; const p=panel('summary');
  const draw=()=>{ const nx=m.lv>=100?0:xpFor(m.lv+1)-m.xp;
    p.innerHTML=`<img class="big" src="${icon(m.n)}"><div class="sh"><div>N°${String(m.n).padStart(3,'0')}</div><div>${esc(monName(m))}</div><div>:N${m.lv}</div><div class="ser">${esc(sp.serie)}</div>${sp.types.map(t=>`<b class="ty" style="background:${TCOL[t]}">${esc(t.toUpperCase())}</b>`).join('')}</div>`+
    (page===0?`<div class="sb"><div>PV ${m.hp}/${m.maxhp} ${bar(m.hp,m.maxhp)}</div>${STAT_NAMES.slice(1).map((n,j)=>`<div>${n}<span>${m.stats[j+1]}</span></div>`).join('')}<div>STATUT<span>${m.st?ST_NAME[m.st]:'OK'}</span></div><div>EXP.<span>${m.xp}</span></div><div>PROCH. NV<span>${nx}</span></div></div>`
    :`<div class="sb mv">${m.moves.map(x=>{ const mv=MOVES[x.id]; return `<div><b class="ty" style="background:${TCOL[mv.t]}">${esc(mv.t.slice(0,3).toUpperCase())}</b>${esc(mv.n)}<span>PP ${x.pp}/${mv.pp}</span><i>${mv.c==='t'?'Statut':(mv.c==='p'?'Physique':'Spécial')+' · Puis. '+mv.p}</i></div>`; }).join('')}</div>`)+
    `<div class="pg">${page?'◀':''} ${page+1}/2 ${page?'':'▶'}</div>`; };
  draw(); try{ for(;;){ const k=await nextKey(); if(k==='left'||k==='right'||k==='up'||k==='down'){ page^=1; draw(); AU.select(); } else if(k==='A'&&!page){ page=1; draw(); } else if(k==='A'||k==='B') return; } }
  finally{ p.remove(); UIBUSY--; } }

/* --- utilisation d'objets ---------------------------------------------- */
async function useItemOn(id,m){ const it=ITEMS[id];
  if(it.heal){ if(m.hp<=0||m.hp>=m.maxhp){ await say(m.hp<=0?"Ça n'aura aucun effet sur un personnage K.O.":"Ça n'aura aucun effet."); return false; }
    const h=Math.min(it.heal,m.maxhp-m.hp); m.hp+=h; AU.heal(); if(B&&m===B.me.m) await animHP(B.me,m.hp); await say(monName(m)+" récupère "+h+" PV !"); return true; }
  if(it.revive){ if(m.hp>0){ await say("Ça n'aura aucun effet."); return false; } m.hp=m.maxhp>>1; AU.heal(); await say(monName(m)+" reprend ses esprits !"); return true; }
  if(it.cure){ if(!m.st||!it.cure.includes(m.st)){ await say("Ça n'aura aucun effet."); return false; } m.st=null; AU.heal(); if(B) drawHP(); await say(monName(m)+" est soigné !"); return true; }
  if(it.candy){ if(m.lv>=100){ await say("Ça n'aura aucun effet."); return false; } m.xp=xpFor(m.lv+1); await levelUp(m,GS.party.indexOf(m)); const e=SPECIES[m.n].evo; if(e&&e.lvl&&m.lv>=e.lvl) await evolve(m,e.to); return true; }
  if(it.stone){ const e=SPECIES[m.n].evo; const to=e&&e.stones&&e.stones[id]; if(!to){ await say("Ça n'aura aucun effet."); return false; } await evolve(m,to); return true; }
  return false; }

/* --- sac --------------------------------------------------------------------- */
async function bagMenu(opt){ opt=opt||{}; UIBUSY++; const bg=panel('bag-bg'); let start=0;
  try{ for(;;){ const ids=Object.keys(GS.bag).filter(k=>GS.bag[k]>0&&ITEMS[k]);
    if(!ids.length){ await say("Le sac est vide."); return null; }
    const desc=el('bdesc'); const i=await choose(ids.map(k=>`${esc(ITEMS[k].nm)}<span>×${GS.bag[k]}</span>`),{cls:'bag',start,onMove:j=>{ desc.innerHTML=esc(ITEMS[ids[j]].d); }}); desc.remove();
    if(i<0) return null; start=i; const id=ids[i], it=ITEMS[id];
    if(opt.sell) return id;
    if(it.ball){ if(!opt.battle){ await say("Ce n'est pas le moment d'utiliser ça !"); continue; }
      if(GS.party.length>=6&&GS.box.length>=240){ await say("Le PC est plein !"); continue; }
      GS.bag[id]--; bg.style.display='none'; const ok=await throwBall(id); return ok?{end:'catch'}:true; }
    if(it.repel){ if(opt.battle){ await say("Ce n'est pas le moment d'utiliser ça !"); continue; } GS.repel=it.repel; GS.bag[id]--; AU.ok(); await say(GS.name+" utilise "+it.nm+" !"); continue; }
    if(opt.battle&&(it.candy||it.stone)){ await say("Ce n'est pas le moment d'utiliser ça !"); continue; }
    const j=await partyMenu({pick:'Utiliser sur qui ?'}); if(j<0) continue;
    const used=await useItemOn(id,GS.party[j]); if(used){ GS.bag[id]--; if(opt.battle) return true; } }
  } finally{ bg.remove(); UIBUSY--; } }

/* --- Animédex ----------------------------------------------------------------- */
function dexText(n){ const s=SPECIES[n], st=s.st, best=['PV','ATTAQUE','DÉFENSE','SPÉCIAL','VITESSE'][st.indexOf(Math.max(...st))];
  const evo=s.evo&&s.evo.lvl?" Évolue au niveau "+s.evo.lvl+".":s.evo&&s.evo.stones?" Évolue avec une Clé céleste.":s.leg?" Un être légendaire.":"";
  return "Venu du monde de « "+s.serie+" ». Son point fort : "+best.toLowerCase()+"."+evo; }
async function dexEntry(n){ UIBUSY++; const s=SPECIES[n], c=GS.dex.caught[n];
  const p=panel('dexe',`<img class="big" src="${icon(n)}"><div class="sh"><div>N°${String(n).padStart(3,'0')}</div><div>${esc(s.name)}</div>${s.types.map(t=>`<b class="ty" style="background:${TCOL[t]}">${esc(t.toUpperCase())}</b>`).join('')}</div><div class="dt">${c?esc(dexText(n)):'Pas encore capturé.'}</div>`);
  try{ await waitAB(); } finally{ p.remove(); UIBUSY--; } }
async function dexMenu(){ UIBUSY++; const bg=panel('dex-bg'); const ns=Object.keys(GS.dex.seen).length, nc=Object.keys(GS.dex.caught).length;
  const head=el('dexh',`VUS ${ns} · PRIS ${nc}/151`); let start=0;
  try{ for(;;){ const items=[]; for(let n=1;n<=151;n++) items.push(`${GS.dex.caught[n]?'<b class="cg">●</b>':'<b></b>'}${String(n).padStart(3,'0')} ${GS.dex.seen[n]?esc(SPECIES[n].name):'----------'}`);
      const i=await choose(items,{cls:'dex',start}); if(i<0) return; start=i; if(GS.dex.seen[i+1]) await dexEntry(i+1); } }
  finally{ head.remove(); bg.remove(); UIBUSY--; } }

/* --- carte du joueur -------------------------------------------------------- */
async function trainerCard(){ UIBUSY++; const t=Math.floor(GS.time), h=Math.floor(t/3600), mn=Math.floor(t/60)%60;
  const badges=GYMS.map(g=>`<i title="${esc(g.badge)}" style="background:${GS.badges.includes(g.zone)?g.col:'#c8c8d0'}"></i>`).join('');
  const p=panel('card',`<div>NOM : ${esc(GS.name)}</div><div>BERRYS : ${GS.money}</div><div>ANIMÉDEX : ${Object.keys(GS.dex.caught).length}</div><div>TEMPS : ${h}:${String(mn).padStart(2,'0')}</div><div class="bd">BADGES ${GS.badges.length}/8</div><div class="badges">${badges}</div>${GS.flags.champion?'<div class="ch">★ MAÎTRE DE LA LIGUE ★</div>':''}`);
  try{ await waitAB(); } finally{ p.remove(); UIBUSY--; } }

/* --- menu START ----------------------------------------------------------- */
let START_I=0;
async function startMenu(){ const opts=[]; if(GS.flags.dex) opts.push(['ANIMÉDEX',dexMenu]); if(GS.party.length) opts.push(['ÉQUIPE',partyMenu]);
  opts.push(['SAC',bagMenu],[GS.name,trainerCard],['SAUVER',async()=>{ if(await yesNo("Sauvegarder la partie ?")){ saveGame(); AU.catch_(); await say(GS.name+" a sauvegardé la partie !"); } }],
    ['OPTIONS',optionsMenu],['RETOUR',null]);
  for(;;){ const i=await choose(opts.map(o=>o[0]),{cls:'start',start:Math.min(START_I,opts.length-1)}); if(i<0||!opts[i][1]) return; START_I=i; await opts[i][1](); } }
async function optionsMenu(){ for(;;){ const i=await choose(['TEXTE : '+(TEXT_SPEED>1?'RAPIDE':'NORMAL'),'SON : '+(AU.on?'OUI':'NON'),'RETOUR'],{cls:'start'});
  if(i===0) TEXT_SPEED=TEXT_SPEED>1?1:2; else if(i===1){ AU.on=!AU.on; } else return; try{ localStorage.setItem('aventure_poche_opt',JSON.stringify({ts:TEXT_SPEED,snd:AU.on})); }catch(e){} } }

/* --- boutique ---------------------------------------------------------- */
async function qtyPicker(price,max){ UIBUSY++; let q=1; const b=el('qty'); const draw=()=>{ b.innerHTML=`×${String(q).padStart(2,'0')}<span>${q*price}${CUR}</span>`; }; draw();
  try{ for(;;){ const k=await nextKey(); if(k==='up') q=q>=max?1:q+1; else if(k==='down') q=q<=1?max:q-1; else if(k==='right') q=Math.min(max,q+10); else if(k==='left') q=Math.max(1,q-10); else if(k==='A') return q; else if(k==='B') return 0; draw(); AU.select(); } }
  finally{ b.remove(); UIBUSY--; } }
async function shopMenu(){ const money=el('money'); const upd=()=>money.innerHTML='BERRYS<br>'+GS.money+CUR; upd();
  try{ await say("Bonjour ! Que puis-je faire pour toi ?",{});
  for(;;){ const c=await choose(['ACHETER','VENDRE','AU REVOIR'],{cls:'start'}); if(c<0||c===2) break;
    if(c===0){ const ids=Object.keys(ITEMS).filter(k=>ITEMS[k].price>0&&(ITEMS[k].badges||0)<=GS.badges.length&&(!ITEMS[k].shop||ITEMS[k].shop===P.zone));
      let start=0; for(;;){ const desc=el('bdesc'); const i=await choose(ids.map(k=>`${esc(ITEMS[k].nm)}<span>${ITEMS[k].price}${CUR}</span>`),{cls:'bag',start,onMove:j=>{ desc.innerHTML=esc(ITEMS[ids[j]].d); }}); desc.remove(); if(i<0) break; start=i;
        const it=ITEMS[ids[i]], max=Math.min(99,Math.floor(GS.money/it.price)); if(max<1){ await say("Tu n'as pas assez d'argent."); continue; }
        const q=await qtyPicker(it.price,max); if(!q) continue; if(!await yesNo(it.nm+" ×"+q+" pour "+(q*it.price)+" Berrys. D'accord ?")) continue;
        GS.money-=q*it.price; giveItem(ids[i],q); upd(); AU.catch_(); await say("Voilà ! Merci !"); if(ids[i]==='orbe'&&q>=10){ giveItem('superOrbe'); await say("En cadeau : une Carte Greed Island !"); } } }
    if(c===1){ for(;;){ const id=await bagMenu({sell:1}); if(!id) break; const it=ITEMS[id]; if(!it.price){ await say("Je ne peux pas acheter ça."); continue; }
        const half=it.price>>1, q=await qtyPicker(half,GS.bag[id]); if(!q) continue; if(!await yesNo("Je t'en donne "+(q*half)+" Berrys. D'accord ?")) continue;
        GS.bag[id]-=q; GS.money+=q*half; upd(); AU.catch_(); } } }
  await say("Merci ! À bientôt !"); } finally{ money.remove(); saveGame(); } }

/* --- PC ----------------------------------------------------------------- */
async function pcMenu(){ AU.ok(); await say(GS.name+" allume le PC.");
  for(;;){ const c=await choose(['RETIRER','DÉPOSER','ÉTEINDRE'],{cls:'start'}); if(c<0||c===2) return;
    if(c===0){ if(!GS.box.length){ await say("Il n'y a aucun personnage dans le PC."); continue; } if(GS.party.length>=6){ await say("Ton équipe est complète !"); continue; }
      const bg=panel('party-bg'); const i=await choose(GS.box.map(m=>`<img src="${icon(m.n)}"><span class="pn">${esc(monName(m))}</span><span class="pl">N${m.lv}</span>`),{cls:'party box'}); bg.remove();
      if(i<0) continue; const m=GS.box.splice(i,1)[0]; m.hp=m.maxhp; m.st=null; GS.party.push(m); AU.ok(); await say(monName(m)+" rejoint l'équipe !"); }
    if(c===1){ if(GS.party.length<=1){ await say("Tu ne peux pas déposer ton dernier personnage !"); continue; }
      const i=await partyMenu({pick:'Déposer qui ?'}); if(i<0) continue; const m=GS.party.splice(i,1)[0]; GS.box.push(m); AU.ok(); await say(monName(m)+" est rangé dans le PC."); }
    saveGame(); } }
