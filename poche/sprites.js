/* =========================================================================
   SPRITES — chaque personnage est dessiné d'après sa fiche (coiffure,
   couleurs, tenue, accessoires) avec des formes simples, puis converti en
   vrai pixel art : bords nets et contour sombre d'un pixel.
   ========================================================================= */
const SPR_SIZE=56;
function hex2(c){ const n=parseInt(c.slice(1),16); return [n>>16&255,n>>8&255,n&255]; }
function shade(c,f){ const [r,g,b]=hex2(c), k=v=>Math.max(0,Math.min(255,Math.round(f<1?v*f:v+(255-v)*(f-1)))); return '#'+[k(r),k(g),k(b)].map(v=>v.toString(16).padStart(2,'0')).join(''); }
function acc(sp,name){ for(const a of sp.a||[]){ const [k,v]=a.split(':'); if(k===name) return v||true; } return null; }
function accs(sp,name){ return (sp.a||[]).filter(a=>a.split(':')[0]===name).map(a=>a.split(':')[1]||true); }
/* convertit le dessin en pixels nets + contour */
function pixelize(c,outline){ const g=c.getContext('2d'), d=g.getImageData(0,0,c.width,c.height), p=d.data, W=c.width, H=c.height, op=new Uint8Array(W*H);
  for(let i=0;i<W*H;i++){ if(p[i*4+3]>=110){ p[i*4+3]=255; op[i]=1; } else p[i*4+3]=0; }
  const [or,og,ob]=hex2(outline||'#181820');
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const i=y*W+x; if(op[i]) continue;
    if((x>0&&op[i-1])||(x<W-1&&op[i+1])||(y>0&&op[i-W])||(y<H-1&&op[i+W])){ p[i*4]=or; p[i*4+1]=og; p[i*4+2]=ob; p[i*4+3]=255; } }
  g.putImageData(d,0,0); return c; }
function mk(w,h){ const c=document.createElement('canvas'); c.width=w||SPR_SIZE; c.height=h||SPR_SIZE; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; return [c,g]; }
function E(g,x,y,rx,ry,col,a0,a1){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y,rx,ry,0,a0||0,a1||Math.PI*2); g.fill(); }
function R(g,x,y,w,h,col){ g.fillStyle=col; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
function Pg(g,pts,col){ g.fillStyle=col; g.beginPath(); g.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) g.lineTo(pts[i],pts[i+1]); g.closePath(); g.fill(); }
function RR(g,x,y,w,h,r,col){ g.fillStyle=col; g.beginPath(); g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h); g.fill(); }

/* --- aura (derrière le personnage) ------------------------------------ */
function aura(g,col,cx,top,bottom,w){ /* flamme d'énergie autour du corps */
  const cy=(top+bottom)/2+2, rx=w*.82, ry=(bottom-top)/2, pts=[], n=16;
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, up=Math.max(0,-Math.sin(a)), r=(i%2?1:.86)+up*(i%2?.28:.08);
    pts.push(cx+Math.cos(a)*rx*r, cy+Math.sin(a)*ry*r*(Math.sin(a)>0?.92:1)); }
  Pg(g,pts,col); const p2=pts.map((v,i)=>i%2?cy+(v-cy)*.82:cx+(v-cx)*.8); Pg(g,p2,shade(col,1.4)); }
/* --- coiffures --------------------------------------------------------- */
function hairBack(g,sp,hx,hy){ const hc=sp.hc||'#202020', hs=sp.hs;
  if(hs==='long'||hs==='wild'||hs==='longspiky'){ R(g,hx-12,hy-2,24,hs==='long'?22:18,hc); E(g,hx,hy+18,12,5,hc); }
  if(hs==='twin'){ R(g,hx-17,hy-2,6,30,hc); R(g,hx+11,hy-2,6,30,hc); }
  if(hs==='side'){ Pg(g,[hx+9,hy-6,hx+18,hy-2,hx+16,hy+18,hx+10,hy+8],hc); }
  if(hs==='braid'){ R(g,hx-2,hy+8,4,16,hc); }
  if(hs==='bob'){ E(g,hx,hy+3,13,11,hc); }
}
function hair(g,sp,hx,hy,back){ const hc=sp.hc||'#202020', hs=sp.hs, dk=shade(hc,.75);
  const cap=()=>E(g,hx,hy-3,12.5,9,hc,Math.PI,Math.PI*2);
  const spikes=(pts)=>{ for(const [x,y,w] of pts) Pg(g,[hx+x-w,hy-4,hx+x,hy+y,hx+x+w,hy-4],hc); };
  switch(hs){
    case 'bald': E(g,hx-4,hy-6,3,2,'#ffffff'); return;
    case 'antenna': Pg(g,[hx-2,hy-9,hx+3,hy-9,hx+8,hy-18,hx+5,hy-19],sp.sk||'#f8a8c8'); return;
    case 'saw': R(g,hx-3,hy-24,6,18,'#a0a0a8'); for(let y=hy-24;y<hy-7;y+=3){ R(g,hx-6,y,3,2,'#e8e8f0'); R(g,hx+3,y+1,3,2,'#e8e8f0'); } return;
    case 'dome': E(g,hx,hy-5,10,8,sp.hc,Math.PI,Math.PI*2); E(g,hx,hy-6,7,4,shade(sp.hc,1.3),Math.PI,Math.PI*2); return;
    case 'turban': E(g,hx,hy-4,12.5,9.5,'#f8f8f8',Math.PI,Math.PI*2); R(g,hx-12,hy-6,25,4,'#e8e8e8'); E(g,hx,hy-7,2,2,'#8040c0'); return;
    case 'crest': Pg(g,[hx-12,hy-2,hx-10,hy-14,hx-4,hy-9,hx,hy-18,hx+4,hy-9,hx+10,hy-14,hx+12,hy-2],'#202820'); return;
    case 'cap': cap(); E(g,hx,hy-7,13,6,'#202838'); R(g,hx-13,hy-5,26,3,'#202838'); R(g,hx+2,hy-9,4,3,'#f8d040'); Pg(g,[hx+10,hy-6,hx+18,hy+2,hx+12,hy+1],hc); return;
  }
  if(back){ E(g,hx,hy,12.5,11,hc); }
  else cap();
  if(hs==='spiky'||hs==='longspiky'||hs==='duck') spikes([[-11,-12,4],[-6,-17,4],[0,-19,4],[6,-17,4],[11,-12,4],[-13,-4,3],[13,-4,3]]);
  if(hs==='spikyUp') spikes([[-10,-18,4],[-5,-24,4],[0,-27,4],[5,-24,4],[10,-18,4],[-13,-8,3],[13,-8,3]]);
  if(hs==='flame') Pg(g,[hx-12,hy-2,hx-9,hy-16,hx-4,hy-14,hx,hy-28,hx+4,hy-14,hx+9,hy-16,hx+12,hy-2],hc);
  if(hs==='cloud'){ for(const [x,y,r] of [[-10,-8,6],[-4,-13,7],[4,-13,7],[10,-8,6],[0,-6,8],[-13,-1,5],[13,-1,5]]) E(g,hx+x,hy+y,r,r,hc); }
  if(hs==='messy') spikes([[-9,-12,3],[-3,-14,3],[3,-14,3],[9,-12,3]]);
  if(hs==='wild') spikes([[-12,-14,4],[-6,-19,4],[0,-21,4],[6,-19,4],[12,-14,4],[-14,-6,3],[14,-6,3]]);
  if(hs==='slant') Pg(g,[hx-12,hy-2,hx-8,hy-12,hx+4,hy-16,hx+20,hy-12,hx+12,hy-2],hc);
  if(hs==='pompadour'){ E(g,hx+2,hy-12,11,6,hc); E(g,hx+10,hy-10,5,4,hc); }
  if(hs==='bangs'){ Pg(g,[hx-3,hy-6,hx-12,hy-22,hx-8,hy-22,hx,hy-8],hc); Pg(g,[hx+3,hy-6,hx+12,hy-22,hx+8,hy-22,hx,hy-8],hc); }
  if(hs==='twin'){ E(g,hx-11,hy-10,5,5,hc); E(g,hx+11,hy-10,5,5,hc); }
  if(hs==='braid'){ Pg(g,[hx-1,hy-10,hx+3,hy-20,hx+4,hy-10],hc); }
  if(hs==='split'){ g.save(); g.beginPath(); g.rect(hx,hy-30,20,40); g.clip(); cap(); E(g,hx,hy-3,12.5,9,sp.hc2||'#e03030',Math.PI,Math.PI*2); g.restore(); }
  if(back) return;
  /* mèches devant le front */
  if(hs==='bowl'){ R(g,hx-12,hy-5,24,5,hc); }
  else if(hs==='cover'){ Pg(g,[hx-12,hy-4,hx+2,hy-6,hx-2,hy+6,hx-12,hy+4],hc); R(g,hx+2,hy-6,10,3,hc); }
  else if(hs==='undercut'){ R(g,hx-12,hy-5,10,3,hc); R(g,hx+2,hy-5,10,3,hc); }
  else if(hs!=='bangs'&&hs!=='flame'){ for(let i=-2;i<=2;i++) Pg(g,[hx+i*5-3,hy-6,hx+i*5+3,hy-6,hx+i*5+(i<0?-1:1),hy-1+(i%2?0:1)],hc); }
  if(hs==='long'||hs==='wild'){ R(g,hx-13,hy-4,4,18,hc); R(g,hx+9,hy-4,4,18,hc); }
  if(hs==='bob'){ R(g,hx-13,hy-4,4,12,hc); R(g,hx+9,hy-4,4,12,hc); }
  if(hs==='side'){ R(g,hx-13,hy-4,4,10,hc); }
  if(hs==='spikyUp'||hs==='spiky'||hs==='duck'){ R(g,hx-13,hy-4,3,9,hc); R(g,hx+10,hy-4,3,9,hc); }
  const tips=acc(sp,'tips'); if(tips&&(hs==='long'||hs==='bob')){ R(g,hx-13,hy+10,4,3,tips); R(g,hx+9,hy+10,4,3,tips); }
  E(g,hx-6,hy-8,3,1.2,shade(hc,1.4));
}
/* --- humains (et créatures humanoïdes) --------------------------------- */
function human(sp,back){
  const [c,g]=mk(); const sk=sp.sk||'#f8d0b0', c1=sp.c1||'#3050c0', c2=sp.c2||'#202020', o=sp.o||'shirt', fat=sp.fat, titan=sp.k==='titan';
  const hx=28, hy=19;
  /* derrière : aura, ailes, cape, armes dans le dos */
  for(const au of accs(sp,'aura').concat(accs(sp,'aura2'))) aura(g,au,28,8,54,20);
  const wings=acc(sp,'wings'); if(wings){ Pg(g,[22,32,4,18,2,36,14,40],wings); Pg(g,[34,32,52,18,54,36,42,40],wings); }
  const cape=acc(sp,'cape'); if(cape) Pg(g,[18,29,38,29,44,52,12,52],cape);
  if(acc(sp,'bigsword')){ g.save(); g.translate(40,30); g.rotate(-.6); R(g,-3,-22,7,34,'#c8c8d0'); R(g,-1,-22,2,34,'#f0f0f8'); R(g,-2,12,5,7,'#303030'); g.restore(); }
  const sword=acc(sp,'sword'); if(sword&&!back){ g.save(); g.translate(40,36); g.rotate(-.7); R(g,-1,-24,3,26,'#d8d8e0'); R(g,-3,1,7,2,sword); R(g,-1,3,3,6,sword); g.restore(); }
  const sw2=acc(sp,'sword2'); if(sw2){ g.save(); g.translate(16,36); g.rotate(.7); R(g,-1,-24,3,26,sw2); R(g,-1,3,3,6,'#202020'); g.restore(); }
  if(acc(sp,'swords3')){ for(const [x,r,col] of [[38,-.6,'#f8f8f8'],[42,-.4,'#202020'],[14,.6,'#c03030']]){ g.save(); g.translate(x,36); g.rotate(r); R(g,-1,-20,3,22,'#d8d8e0'); R(g,-1,2,3,6,col); g.restore(); } }
  const tail=acc(sp,'tail'); if(tail){ g.strokeStyle=tail; g.lineWidth=3; g.beginPath(); g.moveTo(34,44); g.quadraticCurveTo(48,46,46,34); g.stroke(); }
  if(acc(sp,'gourd')){ E(g,38,30,6,8,'#c8a070'); E(g,38,22,4,4,'#c8a070'); }
  if(acc(sp,'steam')) for(const [x,y] of [[10,12],[46,10],[8,30],[48,28]]) E(g,x,y,5,4,'#e8e8e8');
  hairBack(g,sp,hx,hy);
  /* jambes */
  const legC=['suit','robot'].includes(o)?c1:(['gi','jacket','uniform','kimono'].includes(o)?c1:c2);
  R(g,21,41,6,9,legC); R(g,29,41,6,9,legC); R(g,21,41,1,9,shade(legC,.8)); R(g,29,41,1,9,shade(legC,.8));
  const shoe=o==='suit'?c2:'#303030'; R(g,20,48,7,3,shoe); R(g,29,48,7,3,shoe);
  if(o==='dress'||o==='maid') Pg(g,[19,36,37,36,41,48,15,48],c1);
  if(o==='sailor') Pg(g,[19,37,37,37,40,45,16,45],c2);
  if(o==='coat'||o==='robe') Pg(g,[18,30,38,30,40,49,16,49],c1);
  if(o==='kimono'||o==='haori') Pg(g,[19,36,37,36,38,48,18,48],c2);
  /* torse et bras */
  const tw=fat?24:16, tx=28-tw/2, torsoC=o==='none'?sk:c1;
  if(fat) E(g,28,37,13,9,o==='none'?sk:c1); RR(g,tx,29,tw,12,3,torsoC);
  const armC=['vest','none'].includes(o)?sk:c1;
  RR(g,tx-5,30,6,11,2,armC); RR(g,tx+tw-1,30,6,11,2,armC);
  E(g,tx-2,41,2.5,2.5,acc(sp,'gloves')||(o==='robot'?c2:sk)); E(g,tx+tw+2,41,2.5,2.5,acc(sp,'gloves')||(o==='robot'?c2:sk));
  if(acc(sp,'arm')){ RR(g,tx+tw-1,30,6,11,2,'#b8b8c8'); E(g,tx+tw+2,41,2.5,2.5,'#b8b8c8'); }
  switch(o){
    case 'gi': Pg(g,[24,29,32,29,28,35],c2); R(g,tx,37,tw,2,c2); R(g,tx-5,38,6,2,c2); R(g,tx+tw-1,38,6,2,c2); break;
    case 'vest': R(g,26,29,4,12,sk); R(g,tx,39,tw,2,c2); break;
    case 'jacket': R(g,tx,29,tw,3,c2); R(g,27,32,2,9,shade(c1,.8)); break;
    case 'coat': R(g,27,29,2,12,c2); R(g,tx,29,3,12,shade(c1,.85)); break;
    case 'robe': Pg(g,[24,29,32,29,28,36],c2); R(g,tx,37,tw,2,c2); break;
    case 'kimono': Pg(g,[24,29,32,29,28,36],'#f0f0f0'); R(g,tx,37,tw,2,c2); break;
    case 'haori': for(let y=29;y<41;y+=3) for(let x=tx;x<tx+tw;x+=3) if(((x-tx)/3+(y-29)/3)%2<1) R(g,x,y,3,3,shade(c1,.65)); R(g,26,29,4,12,c2); break;
    case 'suit': R(g,tx,37,tw,2,c2); E(g,28,32,3,2,c2); break;
    case 'uniform': R(g,tx,29,tw,2,shade(c1,.8)); for(let y=31;y<41;y+=3) R(g,27,y,2,1,'#f8d040'); break;
    case 'armor': R(g,tx,29,tw,8,c1); R(g,tx,37,tw,4,c2); E(g,tx-2,30,4,3,c1); E(g,tx+tw+2,30,4,3,c1); R(g,tx+3,31,tw-6,2,shade(c1,1.2)); break;
    case 'dress': R(g,tx,33,tw,2,c2); E(g,28,30,3,2,c2); break;
    case 'sailor': Pg(g,[tx,29,tx+tw,29,28,35],c2); E(g,28,34,3,2,'#e03040'); break;
    case 'maid': R(g,24,32,8,9,c2); R(g,tx,29,tw,2,c2); break;
    case 'robot': R(g,tx+3,32,tw-6,4,c2); R(g,tx-5,34,6,1,shade(c1,1.4)); R(g,tx+tw-1,34,6,1,shade(c1,1.4)); break;
    case 'none': R(g,24,33,8,1,shade(sk,.85)); R(g,27,30,2,7,shade(sk,.9)); R(g,tx,40,tw,2,c2); break;
    case 'shirt': R(g,tx,29,tw,2,shade(c1,.85)); break;
  }
  if(acc(sp,'plates')){ for(const [x,y] of [[20,30],[30,30],[22,36],[30,36]]) R(g,x,y,6,5,acc(sp,'plates')); }
  if(acc(sp,'bones')){ for(let y=30;y<40;y+=3) R(g,22,y,12,1,'#f0e8e0'); }
  if(acc(sp,'spots')) for(const [x,y] of [[22,32],[33,35],[26,38]]) E(g,x,y,1.5,1.5,'#203020');
  const scales=acc(sp,'scales'); if(scales){ R(g,tx-5,31,6,3,scales); R(g,tx+tw-1,31,6,3,scales); }
  const scarf=acc(sp,'scarf'); if(scarf){ R(g,21,27,14,4,scarf); R(g,30,29,4,9,scarf); }
  if(acc(sp,'tie')) Pg(g,[27,29,29,29,30,37,28,39,26,37],'#202020');
  if(acc(sp,'chain')) R(g,22,31,12,1,'#f8d040');
  if(acc(sp,'keys')) for(let i=0;i<4;i++) R(g,30+i*2,38,1,3,'#f8d040');
  if(acc(sp,'book')) RR(g,35,36,7,8,1,'#202020');
  if(acc(sp,'apple')) E(g,40,40,3,3,'#e02020');
  if(acc(sp,'blades')){ R(g,13,38,2,10,'#c8c8d0'); R(g,41,38,2,10,'#c8c8d0'); }
  if(acc(sp,'swan')){ E(g,28,30,4,3,'#f8f8f8'); Pg(g,[30,29,34,22,35,23,32,30],'#f8f8f8'); }
  if(acc(sp,'blood')) for(const [x,y] of [[22,33],[33,31],[26,38]]) E(g,x,y,1.5,1,'#c02020');
  /* tête */
  if(titan){ E(g,hx,hy+1,11,10.5,sk); }
  else { E(g,hx,hy,11,10,sk); E(g,hx-11,hy+1,2,3,sk); E(g,hx+11,hy+1,2,3,sk); }
  E(g,hx+3,hy+5,7,3,shade(sk,.93),0,Math.PI);
  const ears=acc(sp,'ears'); if(ears){ Pg(g,[hx-11,hy-6,hx-9,hy-16,hx-4,hy-9],ears); Pg(g,[hx+11,hy-6,hx+9,hy-16,hx+4,hy-9],ears); }
  const horns=acc(sp,'horns'); if(horns){ Pg(g,[hx-8,hy-7,hx-12,hy-18,hx-5,hy-9],horns); Pg(g,[hx+8,hy-7,hx+12,hy-18,hx+5,hy-9],horns); }
  if(!back){ /* visage */
    const ey=sp.ey||'#203050';
    const eye=(x)=>{ R(g,x,hy,3,4,'#202028'); R(g,x+1,hy+1,2,3,ey); R(g,x+1,hy,1,1,'#ffffff'); };
    if(!acc(sp,'blindfold')){ eye(hx-6); eye(hx+3); }
    if(titan){ R(g,hx-5,hy+6,10,3,'#f0f0f0'); for(let x=hx-5;x<hx+5;x+=2) R(g,x,hy+7,1,1,'#202020'); }
    else if(!acc(sp,'mask')&&!acc(sp,'muzzle')) R(g,hx-1,hy+7,3,1,shade(sk,.55));
    if(acc(sp,'whiskers')) for(const dy of [4,6]){ R(g,hx-10,hy+dy,4,1,'#604020'); R(g,hx+7,hy+dy,4,1,'#604020'); }
    if(acc(sp,'freckles')) for(const x of [hx-7,hx-5,hx+5,hx+7]) R(g,x,hy+5,1,1,'#b06040');
    if(acc(sp,'scar')) R(g,hx-7,hy+5,4,1,'#c06060');
    if(acc(sp,'mark')) Pg(g,[hx-2,hy-5,hx+2,hy-5,hx+1,hy-9],'#c02020');
    if(acc(sp,'lines')){ R(g,hx-8,hy+3,4,1,'#202020'); R(g,hx+5,hy+3,4,1,'#202020'); R(g,hx-2,hy-6,4,1,'#202020'); }
    const mask=acc(sp,'mask'); if(mask) R(g,hx-10,hy+4,20,6,mask);
    if(acc(sp,'muzzle')){ R(g,hx-6,hy+6,12,3,'#7a9a40'); R(g,hx-6,hy+7,12,1,'#4a6a20'); }
    if(acc(sp,'eyepatch')) R(g,hx-7,hy-1,5,5,'#202020');
    const eyeband=acc(sp,'eyeband'); if(eyeband){ R(g,hx-12,hy-5,24,3,eyeband); R(g,hx+1,hy-2,7,5,eyeband); }
    if(acc(sp,'blindfold')) R(g,hx-11,hy-1,22,5,'#202020');
    if(acc(sp,'shades')){ R(g,hx-8,hy-1,7,4,'#202030'); R(g,hx+1,hy-1,7,4,'#202030'); }
    if(acc(sp,'cig')) R(g,hx+2,hy+7,5,1,'#f8f8f8');
    if(acc(sp,'hand')){ E(g,hx,hy+3,6,5,'#b8b0c0'); for(let i=-2;i<=2;i++) R(g,hx+i*2.5-1,hy-4,2,6,'#b8b0c0'); }
    if(acc(sp,'hmask')){ E(g,hx-4,hy+2,7,8,'#f8f8f8',Math.PI/2,Math.PI*1.5); R(g,hx-9,hy-3,8,1,'#c02020'); R(g,hx-9,hy+5,8,1,'#c02020'); }
  }
  /* cheveux */
  hair(g,sp,hx,hy,back);
  const hb=acc(sp,'headband'); if(hb&&!back){ R(g,hx-12,hy-6,24,3,'#203050'); R(g,hx-4,hy-6,8,3,hb); R(g,hx-3,hy-5,6,1,'#e0e8f0'); }
  if(acc(sp,'bandana')) R(g,hx-12,hy-7,24,3,'#202020');
  if(acc(sp,'straw')){ E(g,hx,hy-7,18,4,'#f0d070'); E(g,hx,hy-10,10,6,'#f0d070',Math.PI,Math.PI*2); R(g,hx-10,hy-10,20,2,'#d02020'); }
  if(acc(sp,'cowboy')){ E(g,hx,hy-7,17,3.5,'#e08030'); E(g,hx,hy-10,9,6,'#e08030',Math.PI,Math.PI*2); R(g,hx-9,hy-10,18,1,'#202020'); }
  const crown=acc(sp,'crown'); if(crown) Pg(g,[hx-9,hy-8,hx-6,hy-14,hx-2,hy-9,hx,hy-15,hx+2,hy-9,hx+6,hy-14,hx+9,hy-8],crown);
  if(acc(sp,'tiara')&&!back){ Pg(g,[hx-6,hy-7,hx+6,hy-7,hx,hy-10],'#f8d040'); E(g,hx,hy-8,1,1,'#e02020'); }
  if(acc(sp,'cones')){ Pg(g,[hx-12,hy-6,hx-10,hy-14,hx-7,hy-8],'#202020'); Pg(g,[hx+12,hy-6,hx+10,hy-14,hx+7,hy-8],'#202020'); }
  const pins=acc(sp,'pins'); if(pins&&!back){ E(g,hx-9,hy-5,2,2,pins); E(g,hx+9,hy-5,2,2,pins); }
  if(acc(sp,'moon')&&!back) E(g,hx,hy-7,3,2,'#f8d040',Math.PI*.1,Math.PI*.9);
  if(acc(sp,'star')) Pg(g,[40,8,42,12,46,12,43,15,44,19,40,16,36,19,37,15,34,12,38,12],'#f8d040');
  if(acc(sp,'antennae')){ R(g,hx-4,hy-14,1,5,'#78c060'); R(g,hx+3,hy-14,1,5,'#78c060'); }
  for(const sp2 of accs(sp,'sparks')) for(const [x,y] of [[8,20],[46,16],[10,44],[47,40]]){ R(g,x,y,1,5,sp2); R(g,x-2,y+2,5,1,sp2); }
  return c;
}
/* --- créatures --------------------------------------------------------- */
function creature(sp){ const [c,g]=mk(); const c1=sp.c1||'#808080', c2=sp.c2||'#f0f0f0', ey=sp.ey||'#202028', big=sp.big;
  const eyes=(x1,x2,y,s)=>{ for(const x of [x1,x2]){ E(g,x,y,s||2,(s||2)*1.2,'#202028'); E(g,x-.5,y-.8,.8,.8,'#ffffff'); } };
  switch(sp.k){
    case 'dog': E(g,28,36,15,12,c1); E(g,20,48,4,3,c1); E(g,36,48,4,3,c1); R(g,25,10,6,20,'#a0a0a8'); for(let y=10;y<28;y+=3){ R(g,22,y,3,2,'#e8e8f0'); R(g,31,y+1,3,2,'#e8e8f0'); }
      eyes(22,34,34,2.2); E(g,28,40,3,2,'#f8f0e0'); Pg(g,[43,38,52,32,49,40],c1); break;
    case 'bug': for(let i=0;i<4;i++) E(g,16+i*7,38-i*2,7,6,i%2?c1:shade(c1,.85)); E(g,44,28,8,7,c1); eyes(42,47,27,1.5); for(let i=0;i<4;i++) E(g,16+i*7,36-i*2,1.5,1.5,c2); Pg(g,[8,40,2,46,10,44],c2); break;
    case 'cat': E(g,28,40,12,10,c1); E(g,28,24,12,10,c1); Pg(g,[17,20,18,8,24,16],c1); Pg(g,[39,20,38,8,32,16],c1);
      E(g,28,42,7,7,sp.c1==='#282838'?'#383848':'#f8f8f8'); eyes(24,32,24,2.4); E(g,28,28,1.5,1,'#f08080');
      if(acc(sp,'moon')) E(g,28,17,3,2,'#f8d040',Math.PI*.1,Math.PI*.9); Pg(g,[39,46,50,40,48,46],c1);
      const w=acc(sp,'wings'); if(w){ Pg(g,[18,34,4,24,8,40],w); Pg(g,[38,34,52,24,48,40],w); } break;
    case 'fox': { const n=big?9:3; for(let i=0;i<n;i++){ const a=-Math.PI*.9+i/(n-1||1)*Math.PI*.8; Pg(g,[30,40,30+Math.cos(a)*26,30+Math.sin(a)*22,34+Math.cos(a+.15)*22,32+Math.sin(a+.15)*18],i%2?c1:shade(c1,1.15)); }
      E(g,26,40,12,9,c1); E(g,22,26,11,9,c1); Pg(g,[12,22,12,8,20,18],c1); Pg(g,[30,20,32,8,24,16],c1); E(g,14,30,6,4,c2); eyes(18,26,24,1.8);
      if(sp.ey) { R(g,17,23,2,2,sp.ey); R(g,25,23,2,2,sp.ey); } R(g,18,46,4,5,c1); R(g,28,46,4,5,c1); break; }
    case 'snake': g.strokeStyle=c1; g.lineWidth=12; g.beginPath(); g.moveTo(10,48); g.quadraticCurveTo(46,52,40,34); g.quadraticCurveTo(34,22,24,20); g.stroke();
      E(g,20,18,10,7,c1); eyes(17,23,16,1.6); R(g,14,16,2,2,'#e0c040'); R(g,22,16,2,2,'#e0c040'); Pg(g,[10,20,4,22,10,22],'#e02020'); break;
    case 'shini': if(acc(sp,'apple')) E(g,44,38,4,4,'#e02020'); Pg(g,[20,26,4,14,8,36],'#303040'); Pg(g,[36,26,52,14,48,36],'#303040');
      RR(g,20,24,16,24,4,c1); R(g,21,46,5,6,c1); R(g,30,46,5,6,c1); E(g,28,17,10,10,'#e8e0f0');
      for(const [x,y] of [[-10,-6],[-6,-12],[0,-14],[6,-12],[10,-6]]) Pg(g,[28+x-3,15,28+x,15+y,28+x+3,15],'#202028');
      E(g,24,17,2.5,2.5,'#f8f040'); E(g,32,17,2.5,2.5,'#f8f040'); R(g,23,16,2,2,ey); R(g,31,16,2,2,ey); R(g,22,22,12,2,'#202028'); for(let x=23;x<34;x+=2) R(g,x,22,1,1,'#f8f8f8'); break;
    case 'kodama': { const s=big||acc(sp,'moss')?1.2:1; E(g,28,26,10*s,11*s,c1); E(g,28,42,7*s,8*s,c1); R(g,22,48,3,4,c1); R(g,31,48,3,4,c1);
      E(g,24,24,1.6,2.2,'#202020'); E(g,32,23,1.6,2.2,'#202020'); E(g,28,30,1.2,1.6,'#202020'); if(acc(sp,'moss')) E(g,28,16,8,3,'#78a040'); break; }
    case 'deer': { const hat=acc(sp,'hat');
      if(hat){ E(g,28,40,11,9,c1); E(g,28,24,11,9,shade(c1,1.1)); E(g,28,28,4,3,'#4060c0'); eyes(24,32,23,2.2); E(g,28,14,13,4,c2); E(g,28,11,9,6,c2,Math.PI,Math.PI*2); R(g,26,8,4,2,'#f8f8f8'); R(g,27,7,2,4,'#f8f8f8');
        g.strokeStyle='#c09060'; g.lineWidth=2; for(const s of [-1,1]){ g.beginPath(); g.moveTo(28+s*8,12); g.lineTo(28+s*16,4); g.moveTo(28+s*13,8); g.lineTo(28+s*14,2); g.stroke(); }
        if(big){ RR(g,18,30,20,16,4,c1); } R(g,22,47,5,5,'#604020'); R(g,30,47,5,5,'#604020'); }
      else { E(g,30,36,14,8,c1); for(const x of [20,26,34,40]) R(g,x,40,3,11,c1); E(g,16,24,7,6,c2); E(g,18,30,4,6,c1); eyes(14,19,23,1.4);
        g.strokeStyle='#e8d8b0'; g.lineWidth=2; for(const [x,s] of [[14,-1],[20,1]]){ g.beginPath(); g.moveTo(x,18); g.lineTo(x+s*6,4); g.moveTo(x+s*3,10); g.lineTo(x+s*10,8); g.moveTo(x+s*5,6); g.lineTo(x+s*2,0); g.stroke(); } }
      break; }
    case 'totoro': { const s=big?1.25:.85; E(g,28,34,16*s,17*s,c1); E(g,28,38,11*s,12*s,c2); Pg(g,[28-9*s,34-14*s,28-7*s,34-26*s,28-3*s,34-15*s],c1); Pg(g,[28+9*s,34-14*s,28+7*s,34-26*s,28+3*s,34-15*s],c1);
      eyes(28-6*s,28+6*s,34-9*s,2*s); E(g,28,34-6*s,2*s,1.2*s,'#202020'); for(let i=-1;i<=1;i++) Pg(g,[28+i*5*s-2,34+i*0,28+i*5*s+2,34,28+i*5*s,34+3*s],c1);
      R(g,28-14*s,34-2*s,5,1,'#202020'); R(g,28+10*s,34-2*s,5,1,'#202020'); break; }
    case 'flame': { const c3=shade(c1,1.4); Pg(g,[28,4,36,18,46,14,42,30,48,40,36,50,20,50,8,40,14,30,10,14,20,18],c1); Pg(g,[28,14,34,24,38,36,30,46,22,46,18,36,22,24],c2);
      E(g,23,32,3,4,'#f8f8f8'); E(g,33,32,3,4,'#f8f8f8'); R(g,22,32,2,3,'#202020'); R(g,32,32,2,3,'#202020'); R(g,24,40,8,2,'#a03010'); break; }
    case 'ghost': Pg(g,[14,50,12,26,20,14,36,14,44,26,42,50,36,44,30,50,26,44,20,50],c1); E(g,28,24,11,10,c2); R(g,22,21,4,4,'#202020'); R(g,30,21,4,4,'#202020');
      R(g,22,28,12,4,'#202020'); for(let x=22;x<34;x+=2) R(g,x,28,1,4,c2); E(g,28,40,4,4,'#101010'); Pg(g,[18,16,20,10,23,15],c2); Pg(g,[38,16,36,10,33,15],c2); break;
    case 'dragon': case 'dragonling': { const s=sp.k==='dragonling'?.75:1;
      g.strokeStyle=c1; g.lineWidth=11*s; g.lineCap='round'; g.beginPath(); g.moveTo(8,50); g.bezierCurveTo(50,52,52,28,36,24); g.stroke();
      if(sp.k==='dragonling'||acc(sp,'wings')||sp.c1==='#98c050'){ Pg(g,[30,34,50,16,52,34],shade(c1,.8)); }
      E(g,24,20,12*s,10*s,c1); E(g,14,24,7*s,5*s,c1); E(g,24,28,10*s,4*s,c2,0,Math.PI);
      Pg(g,[26,12,32,0,32,12],c2); Pg(g,[20,12,22,1,26,11],c2); eyes(20,28,18,1.8*s);
      if(sp.k!=='dragonling'){ g.strokeStyle=c2; g.lineWidth=1.5; g.beginPath(); g.moveTo(10,24); g.quadraticCurveTo(2,30,4,40); g.stroke(); }
      for(let i=0;i<5;i++) R(g,30+i*4,42-i*3,3,2,c2); break; }
    case 'phoenix': Pg(g,[28,20,4,6,10,26,2,34,20,34],c1); Pg(g,[28,20,52,6,46,26,54,34,36,34],c1); Pg(g,[22,38,28,54,34,38],c2); Pg(g,[24,40,20,54,28,46,36,54,32,40],c1);
      E(g,28,28,7,10,c1); E(g,28,16,6,6,c1); Pg(g,[33,15,40,17,33,19],c2); eyes(26,30,15,1.2); Pg(g,[24,10,26,2,28,10,30,2,32,10],c2); break;
  }
  return c;
}
/* --- sprite final (face/dos), mis en cache ----------------------------- */
const SPRITE_CACHE={};
function charSprite(n,back){ const key=n+(back?'b':'f'); if(SPRITE_CACHE[key]) return SPRITE_CACHE[key];
  const sp=SPECIES[n].sp; let c=(!sp.k||sp.k==='h'||sp.k==='titan')?human(sp,back):creature(sp);
  if(sp.k==='titan'&&!sp.sk) {}
  /* taille selon le stade */
  if(sp.sm||sp.big){ const [c2,g2]=mk(); const s=sp.sm?.86:1.08; g2.translate(28,54); g2.scale(s,s); g2.drawImage(c,-28,-54); c=c2; }
  c=pixelize(c);
  if(back&&sp.k&&sp.k!=='h'&&sp.k!=='titan'){ const [c2,g2]=mk(); g2.translate(SPR_SIZE,0); g2.scale(-1,1); g2.drawImage(c,0,0); g2.setTransform(1,0,0,1,0,0); g2.globalCompositeOperation='source-atop'; g2.fillStyle='rgba(0,0,0,.18)'; g2.fillRect(0,0,SPR_SIZE,SPR_SIZE); c=c2; }
  return SPRITE_CACHE[key]=c; }
/* les titans ont la peau de leur couleur */
function prepSpecies(){ for(let n=1;n<SPECIES.length;n++){ const sp=SPECIES[n].sp; if(sp.k==='titan'){ sp.sk=sp.c1; sp.hs=sp.hs||'long'; sp.o='none'; sp.c2=sp.c2||shade(sp.c1,.7); sp.c1=shade(sp.c1,.9); }
  if(sp.k==='bugman'){ sp.k='h'; sp.hs='crest'; sp.sk='#78c060'; sp.o='armor'; sp.c1='#58b048'; sp.c2='#202820'; sp.a=(sp.a||[]).concat(['spots','wings:#409040']); } } }
