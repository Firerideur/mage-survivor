/* =========================================================================
   MONDE — tuiles, thèmes, bâtiments, intérieurs, PNJ et déplacements.
   La région est une longue carte (du Bourg-Écume au sud jusqu'au Plateau
   des Héros au nord) ; les bâtiments mènent à des intérieurs.
   ========================================================================= */
const PAL={k:'#202028',g:'#70c850',G:'#3c9030',l:'#b0e878',d:'#e8d098',D:'#c8a868',w:'#4890f0',W:'#2860c0',x:'#b8e0ff',
  t:'#3c9a3c',T:'#21622a',L:'#6cc458',b:'#8b5a2b',B:'#5c3a1c',r:'#e05040',R:'#a02828',e:'#f8ecd0',E:'#c8b090',f:'#f8f8f8',
  y:'#f8d038',p:'#f87898',o:'#f09030',s:'#f8c8a0',S:'#d89870',c:'#30a0e0',C:'#1868a8',h:'#4a2c18',j:'#f08838',J:'#c06018',
  n:'#3858b0',N:'#203878',m:'#383838',z:'#b0b0b8',Z:'#70707c',u:'#5888e0',U:'#2f58a8',v:'#90d0f8',q:'#e8b070',Q:'#b88040',a:'#d03848',A:'#8a1c30'};
function art(rows,pal){ const c=document.createElement('canvas'); c.width=rows[0].length; c.height=rows.length; const g=c.getContext('2d');
  rows.forEach((r,y)=>{ for(let x=0;x<r.length;x++){ const k=r[x]; if(k==='.'||k===' ') continue; g.fillStyle=(pal||PAL)[k]||k; g.fillRect(x,y,1,1); } }); return c; }
function tile(fn){ const c=document.createElement('canvas'); c.width=c.height=TS; const g=c.getContext('2d'); fn(g,(x,y,col)=>{ g.fillStyle=PAL[col]||col; g.fillRect(x,y,1,1); }); return c; }
const flip=src=>{ const c=document.createElement('canvas'); c.width=src.width; c.height=src.height; const g=c.getContext('2d'); g.translate(src.width,0); g.scale(-1,1); g.drawImage(src,0,0); return c; };
let seed=1; const srnd=()=>(seed=(seed*16807)%2147483647)/2147483647;

/* --- thèmes de terrain ------------------------------------------------- */
const THEMES={grass:{g:'#70c850',G:'#3c9030',l:'#b0e878',tall:'#58b038',tallD:'#2c7a24',tree:['#6cc458','#3c9a3c','#21622a']},
  forest:{g:'#4ea83c',G:'#2a7024',l:'#88d060',tall:'#3c8c2c',tallD:'#1c5a18',tree:['#4ea040','#2a7a2a','#164a1c']},
  sand:{g:'#e8d8a0',G:'#c8b070',l:'#f8f0c8',tall:'#a8c860',tallD:'#6a8a30',tree:['#78c058','#409838','#286028']},
  ash:{g:'#a89888',G:'#806858',l:'#c8b8a8',tall:'#8a7a50',tallD:'#5a4a30',tree:['#a06848','#704028','#4a2818']},
  violet:{g:'#a8c870',G:'#6a9040',l:'#d0e8a0',tall:'#9070c0',tallD:'#5a3a90',tree:['#b080d0','#7a50a8','#4a2a70']},
  swamp:{g:'#7a9a68',G:'#4a6a40',l:'#a8c090',tall:'#5a7848',tallD:'#304a28',tree:['#6a8a58','#3e5a38','#22381e']},
  rock:{g:'#c0a888',G:'#907860',l:'#e0d0b0',tall:'#8a9a60',tallD:'#5a6a38',tree:['#78a058','#4a7038','#2a4a20']}};
const TH={};
function themeTiles(name){ if(TH[name]) return TH[name]; const t=THEMES[name]||THEMES.grass, P2=Object.assign({},PAL,{g:t.g,G:t.G,l:t.l});
  const grass=[0,1,2].map(v=>{ seed=7+v*13; return tile(g=>{ g.fillStyle=t.g; g.fillRect(0,0,16,16); for(let i=0;i<5+v*2;i++){ const x=Math.floor(srnd()*14)+1, y=Math.floor(srnd()*13)+2;
    g.fillStyle=t.G; g.fillRect(x,y,1,1); g.fillRect(x-1,y+1,1,1); g.fillRect(x+1,y+1,1,1); if(srnd()<.5){ g.fillStyle=t.l; g.fillRect(x,y-1,1,1); } } }); });
  const tuft=art(['...l....','..lGl...','.lGgGl.l','.GgGgGlG','lGgGgGGg','GgGgGgGg','gGgGgGgG','GGGGGGGG'],Object.assign({},PAL,{g:t.tall,G:t.tallD,l:t.l}));
  const tall=tile(g=>{ g.fillStyle=t.tall; g.fillRect(0,0,16,16); for(const [x,y] of [[0,0],[8,0],[-4,8],[4,8],[12,8]]) g.drawImage(tuft,x,y); });
  const tree=art(['....kkkkkkkk....','..kkLLLLLLttkk..','.kLLLLLLttttttk.','.kLLLLtttttttTk.','kLLLttttttttTTTk','kLLtttLLtttTTTTk','kLttttLLttTTTTTk','kttttttttTTTTTTk',
    'kttLLtttTTTLTTTk','.kttttttTTTTTTk.','.kTttttTTTTTTTk.','..kkTTTTTTTTkk..','....kkkbbkkk....','......kbbk......','......kBbk......','.......kk.......'],Object.assign({},PAL,{L:t.tree[0],t:t.tree[1],T:t.tree[2]}));
  const ledge=tile(g=>{ g.drawImage(grass[1],0,0); g.fillStyle=t.G; g.fillRect(0,9,16,5); g.fillStyle=t.l; g.fillRect(0,9,16,1); g.fillStyle=PAL.k; g.fillRect(0,14,16,1); });
  const flower=[0,1].map(f=>tile((g,px)=>{ g.drawImage(grass[0],0,0); for(const [cx,cy,col] of [[4,4,name==='violet'?'#c070f0':'p'],[12,11,'y']]){ px(cx,cy-1,col); px(cx-1,cy,col); px(cx+1,cy,col); px(cx,cy+1,col); px(cx,cy,f?'f':'o'); if(f){ px(cx-1,cy-1,col); px(cx+1,cy+1,col); } px(cx,cy+2,t.G); px(cx,cy+3,t.G); } }));
  return TH[name]={grass,tall,tree,ledge,flower}; }
const PATH=tile((g,px)=>{ g.fillStyle=PAL.d; g.fillRect(0,0,16,16); seed=99; for(let i=0;i<7;i++) px(Math.floor(srnd()*16),Math.floor(srnd()*16),'D'); });
const WATER=[0,1,2].map(f=>tile((g,px)=>{ g.fillStyle=PAL.w; g.fillRect(0,0,16,16); for(let y=2;y<16;y+=5) for(let x=0;x<16;x++){ const yy=y+Math.round(Math.sin((x+f*4)/16*Math.PI*2)*1.2); if((x+y+f*3)%8<3) px(x,yy,'x'); else if((x+y)%8===5) px(x,yy+1,'W'); } }));
const CLIFF=tile((g,px)=>{ g.fillStyle='#a08870'; g.fillRect(0,0,16,16); g.fillStyle='#c8b090'; g.fillRect(0,0,16,3); g.fillStyle='#705848'; for(const [x,y,w] of [[2,6,5],[9,9,5],[4,12,6],[11,4,3]]) g.fillRect(x,y,w,1); g.fillStyle='#584030'; g.fillRect(0,15,16,1); });
const FENCE=g0=>tile(g=>{ g.drawImage(g0,0,0); g.fillStyle=PAL.k; g.fillRect(0,5,16,1); g.fillRect(0,10,16,1); g.fillStyle=PAL.f; g.fillRect(0,6,16,1); g.fillRect(0,11,16,1); for(const x of [2,10]){ g.fillStyle=PAL.k; g.fillRect(x-1,2,5,12); g.fillStyle=PAL.f; g.fillRect(x,3,3,10); } });
const SIGNART=art(['.kkkkkkkkkkkkk..','kqqqqqqqqqqqqqk.','kqQQQQQQQQQQqqk.','kqqqqqqqqqqqqqk.','kqQQQQQQQQqqqqk.','kqqqqqqqqqqqqqk.','.kkkkkkkkkkkkk..','......kbbk......','......kbbk......','......kbbk......','.....kkkkkk.....']);
const MAILART=art(['..kkkkkkkkk.....','.kaaaaaaaaak....','kaaaaaaaaaaak.k.','kaAAAAAAAAAakkyk','kaaaaaaaaaaak.k.','kAAAAAAAAAAAk...','.kkkkkkkkkkk....','.....kbbk.......','.....kbbk.......','.....kbbk.......','....kkkkkk......']);
const ROCKART=art(['....kkkkkkk.....','..kkzzzzzzzkk...','.kzzffzzzzzzZk..','.kzfzzzzzzzZZk..','kzzzzzzzzzZZZZk.','kzzzzzzzzZZZZZk.','kZzzzzzzZZZZZZk.','kZZZZZZZZZZZZZk.','.kZZZZZZZZZZZk..','..kkkkkkkkkkk...']);
const BALLART=art(['....kkkkk...','..kkrrrrrkk.','.krrfrrrrrrk','.krrrrrrrrrk','kkkkkkkkkkkk','kffffkkffffk','.kfffkfkfffk','.kffffkffffk','..kkfffffkk.','....kkkkk...']);

/* --- intérieur --------------------------------------------------------- */
const FLOOR=tile((g,px)=>{ g.fillStyle=PAL.q; g.fillRect(0,0,16,16); g.fillStyle=PAL.Q; for(let y=3;y<16;y+=4) g.fillRect(0,y,16,1); for(let y=0;y<16;y+=4) px((y*5)%16,y+1,'Q'); });
const TILEFLOOR=tile(g=>{ g.fillStyle='#e8e8f0'; g.fillRect(0,0,16,16); g.fillStyle='#c8c8d8'; g.fillRect(0,0,16,1); g.fillRect(0,8,16,1); g.fillRect(0,0,1,16); g.fillRect(8,0,1,16); });
const WALL=tile(g=>{ g.fillStyle='#f0e0c8'; g.fillRect(0,0,16,16); g.fillStyle='#d8c0a0'; for(let x=1;x<16;x+=4) g.fillRect(x,0,1,13); g.fillStyle='#a07850'; g.fillRect(0,13,16,3); });
const WALLTOP=tile(g=>{ g.fillStyle='#f0e0c8'; g.fillRect(0,0,16,16); g.fillStyle='#d8c0a0'; for(let x=1;x<16;x+=4) g.fillRect(x,0,1,16); });
const WINDOW=tile(g=>{ g.drawImage(WALL,0,0); g.drawImage(art(['kkkkkkkkkk','kvvvvkvvvk','kvfvvkvvvk','kvvvvkvvvk','kkkkkkkkkk','kvvvvkvvvk','kvvvvkvvvk','kkkkkkkkkk']),3,2); });
const MAT=tile(g=>{ g.fillStyle=PAL.a; g.fillRect(1,3,14,10); g.fillStyle=PAL.A; g.fillRect(1,3,14,1); g.fillRect(1,12,14,1); g.fillStyle=PAL.y; for(let x=3;x<14;x+=3) g.fillRect(x,7,1,2); });
const COUNTER=tile(g=>{ g.fillStyle='#c88848'; g.fillRect(0,2,16,14); g.fillStyle='#e8a868'; g.fillRect(0,2,16,3); g.fillStyle='#202028'; g.fillRect(0,1,16,1); g.fillRect(0,15,16,1); });
const PCART=art(['kkkkkkkkkkkkkkkk','kZZZZZZZZZZZZZZk','kZkkkkkkkkkkkkZk','kZkvvvvvvvvvvkZk','kZkvfvvvvvvvvkZk','kZkvvvvvvvvvvkZk','kZkkkkkkkkkkkkZk','kZZZZZZZZZZZZZZk','kkkkkkkkkkkkkkkk','.kzzzzzzzzzzzzk.','.kzZZZZZZZZZZzk.','.kzzzzzzzzzzzzk.','.kzzzzzzyzzzzzk.','.kzzzzzzzzzzzzk.','.kkkkkkkkkkkkkk.','................']);
const SHELF=art(['kkkkkkkkkkkkkkkk','kBBBBBBBBBBBBBBk','kBrrCCyypprrjjBk','kBrrCCyypprrjjBk','kBBBBBBBBBBBBBBk','kBnnyyrrCCppjjBk','kBnnyyrrCCppjjBk','kBBBBBBBBBBBBBBk','kBbbbbbbbbbbbbBk','kBbbbbbbbbbbbbBk','kBBBBBBBBBBBBBBk','kBbbbbbbbbbbbbBk','kBbbbbbbbbbbbbBk','kBBBBBBBBBBBBBBk','kkkkkkkkkkkkkkkk','................']);
const TV=art(['................','..kkkkkkkkkkkk..','.kZZZZZZZZZZZZk.','.kZkkkkkkkkkkZk.','.kZkvvvvvvvvkZk.','.kZkvfvvvvvvkZk.','.kZkvvvvvvvvkZk.','.kZkkkkkkkkkkZk.','.kZZZZZZZZZyZZk.','.kkkkkkkkkkkkkk.','.kBBBBBBBBBBBBk.','.kBbbbbbbbbbbBk.','.kBkkkkkkkkkkBk.','.kBk........kBk.','.kkk........kkk.','................']);
const PLANT=art(['......tLt.......','...tLttLttLt....','..tLLtTLtLLtt...','...tTtLLtTtLt...','..tLttTttLtTt...','...ttLtTtLtt....','....tTtLttT.....','.....kkkkkk.....','....kaaaaaak....','....kAaaaaAk....','....kAaaaaAk....','.....kAaaAk.....','.....kAAAAk.....','......kkkk......','................','................']);
const BED=art(['kkkkkkkkkkkkkkkk','kBBBBBBBBBBBBBBk','kBffffffffffffBk','kBfzzzzzzzzzzfBk','kBffffffffffffBk','kBccccccccccccBk','kBcCccccccCcccBk','kBccccCccccccCBk','kBcccccccCccccBk','kBccCccccccccCBk','kBccccccCcccccBk','kBcCcccccccCccBk','kBBBBBBBBBBBBBBk','kbbbbbbbbbbbbbbk','kBk..........kBk','kkk..........kkk']);
const TABLE=art(['................','.kkkkkkkkkkkkkk.','kqqqqqqqqqqqqqqk','kqfffqqqqqqfffqk','kqfvfqqqqqqfyfqk','kqfffqqqqqqfffqk','kqqqqqqqqqqqqqqk','kQQQQQQQQQQQQQQk','kkkkkkkkkkkkkkkk','.kBk........kBk.','.kBk........kBk.','.kBk........kBk.','.kBk........kBk.','.kkk........kkk.','................','................']);
const STATUE=art(['......kkkk......','.....kzzzzk.....','....kzzffzzk....','....kzzzzzzk....','.....kzzzzk.....','....kkzzzzkk....','...kzzzzzzzzk...','...kzZzzzzZzk...','...kzzzzzzzzk...','....kzzzzzzk....','...kkkkkkkkkk...','..kZZZZZZZZZZk..','..kzzzzzzzzzzk..','..kZZZZZZZZZZk..','..kkkkkkkkkkkk..','................']);

/* --- bâtiments ----------------------------------------------------------- */
function building(w,h,roof,roof2,doorCol,opt){ opt=opt||{}; const c=document.createElement('canvas'); c.width=w*16; c.height=h*16; const g=c.getContext('2d'), Wd=c.width, Hh=c.height, roofH=opt.roofH||34;
  g.fillStyle=PAL.k; g.fillRect(2,0,Wd-4,roofH+2); g.fillStyle=roof; g.fillRect(3,1,Wd-6,roofH);
  g.fillStyle=roof2; for(let y=6;y<roofH;y+=6){ g.fillRect(3,y,Wd-6,1); for(let x=3+((y/6)%2)*4;x<Wd-3;x+=8) g.fillRect(x,y-5,1,5); }
  g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(3,1,Wd-6,2); g.fillStyle=PAL.k; g.fillRect(0,roofH-1,Wd,3); g.fillStyle=roof2; g.fillRect(1,roofH,Wd-2,1);
  if(opt.chimney){ g.fillStyle=PAL.k; g.fillRect(Wd-22,0,10,12); g.fillStyle=PAL.Z; g.fillRect(Wd-21,1,8,10); }
  g.fillStyle=PAL.k; g.fillRect(2,roofH+2,Wd-4,Hh-roofH-2); g.fillStyle=opt.wall||PAL.e; g.fillRect(3,roofH+2,Wd-6,Hh-roofH-3); g.fillStyle=opt.wall2||PAL.E; g.fillRect(3,Hh-4,Wd-6,3);
  const win=x=>{ g.fillStyle=PAL.k; g.fillRect(x,roofH+6,14,11); g.fillStyle=PAL.v; g.fillRect(x+1,roofH+7,12,9); g.fillStyle=PAL.f; g.fillRect(x+2,roofH+8,3,2); g.fillStyle=PAL.k; g.fillRect(x+7,roofH+7,1,9); g.fillRect(x+1,roofH+11,12,1); };
  for(let i=0;i<w;i++){ if(i===doorCol) continue; if(opt.allWin||i===0||i===w-1) win(i*16+1); }
  const dx=doorCol*16+2; g.fillStyle=PAL.k; g.fillRect(dx,Hh-19,12,18); g.fillStyle=opt.door||PAL.b; g.fillRect(dx+1,Hh-18,10,17); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(dx+1,Hh-18,10,2); g.fillRect(dx+5,Hh-16,1,15);
  g.fillStyle=PAL.y; g.fillRect(dx+8,Hh-10,1,2);
  if(opt.label){ const lw=opt.label.length*4+6, lx=Math.round(Wd/2-lw/2), ly=roofH-12; g.fillStyle=PAL.k; g.fillRect(lx-1,ly-1,lw+2,9); g.fillStyle=opt.labelBg||'#f8f8f8'; g.fillRect(lx,ly,lw,7); pixText(g,opt.label,lx+3,ly+1,opt.labelFg||'#202028'); }
  if(opt.emblem){ g.fillStyle=PAL.k; g.beginPath(); g.arc(Wd/2,roofH/2-2,8,0,Math.PI*2); g.fill(); g.fillStyle=opt.emblem; g.beginPath(); g.arc(Wd/2,roofH/2-2,7,0,Math.PI*2); g.fill(); g.fillStyle='#f8f8f8'; g.fillRect(Wd/2-1,roofH/2-7,2,10); g.fillRect(Wd/2-5,roofH/2-3,10,2); }
  return c; }
/* petite police 3×5 */
const FONT={A:'111101111101101',B:'110101110101110',C:'111100100100111',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'111100101101111',H:'101101111101101',I:'111010010010111',
  J:'001001001101111',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'111101101101101',O:'111101101101111',P:'111101111100100',Q:'111101101111001',R:'111101110101101',
  S:'111100111001111',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111',É:'111100110100111',È:'111100110100111',
  '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001001001001','8':'111101111101111','9':'111101111001111',
  ' ':'000000000000000','(':'010100100100010',')':'010001001001010','.':'000000000000010','-':'000000111000000','!':'010010010000010','+':'000010111010000'};
function pixText(g,s,x,y,col,sc){ sc=sc||1; let xx=x; for(const ch of s.toUpperCase()){ const f=FONT[ch]||FONT[' ']; g.fillStyle=col; for(let i=0;i<15;i++) if(f[i]==='1') g.fillRect(xx+(i%3)*sc,y+Math.floor(i/3)*sc,sc,sc); xx+=4*sc; } }
const BIMG={};
function buildingImg(b){ const key=b.kind+(b.zone||''); if(BIMG[key]) return BIMG[key]; let img;
  switch(b.kind){
    case 'centre': img=building(b.w,b.h,'#e04858','#a02838',2,{label:'SOIN',labelBg:'#f8f8f8',labelFg:'#e04858',door:'#c8e8f8'}); break;
    case 'boutique': img=building(b.w,b.h,'#4878d8','#2850a0',2,{label:'SHOP',labelFg:'#2850a0',door:'#c8e8f8'}); break;
    case 'arene': { const gy=GYMS.find(x=>x.zone===b.zone); img=building(b.w,b.h,'#9098a8','#606878',3,{roofH:44,emblem:gy?gy.col:'#c0c0c0',allWin:1,wall:'#e0e0e8',wall2:'#b0b0c0',door:'#505868'}); break; }
    case 'ligue': img=building(b.w,b.h,'#d8b040','#a07820',3,{roofH:40,label:'LIGUE',labelBg:'#202848',labelFg:'#f8d040',allWin:1,wall:'#f8f0e0'}); break;
    case 'labo': img=building(b.w,b.h,PAL.u,PAL.U,3,{allWin:1,wall:'#f8f8f8',wall2:'#d8d8e8'}); break;
    case 'maisonRival': img=building(b.w,b.h,'#58b0a0','#2f7a6a',2,{chimney:1}); break;
    case 'maisonJoueur': img=building(b.w,b.h,PAL.r,PAL.R,2,{chimney:1}); break;
    default: img=building(b.w,b.h,['#e09040','#8060c0','#50a050','#c05070'][(b.x+b.y)%4],'#704828',2,{chimney:1});
  }
  return BIMG[key]=img; }

/* --- sprites du monde (dresseur + PNJ) --------------------------------- */
const BASE={
down:['.....kkkkkk.....','....kcccccck....','...kccccccccck..','...kCCCCCCCCCk..','...khssssssshk..','...ksskssskssk..','...ksssSSssssk..','....kkssssskk...','...kjjjjjjjjjk..','..ksjjjjjjjjjsk.','..ksJjjjjjjjJsk.','...kJJJJJJJJJk..','...knnnnknnnnk..','...knnnk.knnnk..','...kmmmk.kmmmk..','....kkk...kkk...'],
downW:['.....kkkkkk.....','....kcccccck....','...kccccccccck..','...kCCCCCCCCCk..','...khssssssshk..','...ksskssskssk..','...ksssSSssssk..','....kkssssskk...','...kjjjjjjjjjk..','..ksjjjjjjjjjsk.','..ksJjjjjjjjJsk.','...kJJJJJJJJJk..','...knnnnknnnnk..','...knnnk.kmmmk..','...kmmmk..kkk...','....kkk.........'],
up:['.....kkkkkk.....','....kcccccck....','...kccccccccck..','...kccccccccck..','...khhhhhhhhhk..','...khhhhhhhhhk..','...khhhhhhhhhk..','....kkhhhhhkk...','...kjjjjjjjjjk..','..ksjyyyyyyjjsk.','..ksJyyyyyyJJsk.','...kJJJJJJJJJk..','...knnnnknnnnk..','...knnnk.knnnk..','...kmmmk.kmmmk..','....kkk...kkk...'],
upW:['.....kkkkkk.....','....kcccccck....','...kccccccccck..','...kccccccccck..','...khhhhhhhhhk..','...khhhhhhhhhk..','...khhhhhhhhhk..','....kkhhhhhkk...','...kjjjjjjjjjk..','..ksjyyyyyyjjsk.','..ksJyyyyyyJJsk.','...kJJJJJJJJJk..','...knnnnknnnnk..','...knnnk.kmmmk..','...kmmmk..kkk...','....kkk.........'],
left:['......kkkkk.....','.....kccccck....','...kkcccccccck..','..kCCCCCcccccck.','....kssshhhhk...','...kskssshhhk...','...ksssssshhk...','....kkssssk.....','....kjjjjjjk....','....kjjsjjyk....','....kJjsjJyk....','....kJJJJJJk....','....knnnnnk.....','....knnnnnk.....','....kmmmmmk.....','.....kkkkk......'],
leftW:['......kkkkk.....','.....kccccck....','...kkcccccccck..','..kCCCCCcccccck.','....kssshhhhk...','...kskssshhhk...','...ksssssshhk...','....kkssssk.....','....kjjjjjjk....','....kjjsjjyk....','....kJjsjJyk....','....kJJJJJJk....','....knnnnnnk....','...knnk.knnk....','...kmmk..kmmk...','....kk....kk....']};
/* variante fille : pas de casquette, cheveux longs */
function girlify(rows,dir){ return rows.map((r,y)=>{ let s=r.replace(/[cC]/g,'h'); if(y>=4&&y<=10&&dir!=='left'){ const a=s.split(''); if(a[2]==='.') a[2]='h'; if(a[13]==='.') a[13]='h'; if(dir==='up') for(let x=4;x<13;x++) if(a[x]==='j'||a[x]==='y') a[x]=y<10?'h':a[x]; s=a.join(''); }
  if(y>=4&&y<=9&&dir==='left'){ const a=s.split(''); for(let x=9;x<13;x++) if(a[x]==='.'||a[x]==='k') a[x]=x===12?'k':'h'; s=a.join(''); } return s; }); }
const SPRC={};
function npcSprites(look){ look=look||{}; const key=JSON.stringify(look); if(SPRC[key]) return SPRC[key];
  const pal=Object.assign({},PAL,{c:look.cap||PAL.c,C:shade(look.cap||PAL.c,.7),h:look.hair||PAL.h,j:look.top||PAL.j,J:shade(look.top||PAL.j,.75),n:look.pants||PAL.n,N:shade(look.pants||PAL.n,.7),s:look.skin||PAL.s,S:shade(look.skin||PAL.s,.85),y:look.pack||PAL.y});
  const o={}; for(const k in BASE){ const dir=k.replace('W',''); o[k]=art(look.girl?girlify(BASE[k],dir):(look.nocap?BASE[k].map(r=>r.replace(/[cC]/g,'h')):BASE[k]),pal); }
  o.right=flip(o.left); o.rightW=flip(o.leftW); o.downW2=flip(o.downW); o.upW2=flip(o.upW); return SPRC[key]=o; }
const PS=npcSprites({});

/* --- cartes ------------------------------------------------------------- */
const MAPS={};
function zoneAt(y){ for(const z of WORLD.zones) if(y>=z.y0&&y<=z.y1) return z; return WORLD.zones[WORLD.zones.length-1]; }
function initWorld(){
  MAPS.world={w:24,h:WORLD.rows.length,rows:WORLD.rows,fill:'T',build:WORLD.build,outdoor:1};
  for(const b of WORLD.build) b.img=buildingImg(b);
  /* intérieurs */
  const R=(rows)=>({w:rows[0].length,h:rows.length,rows,fill:' ',build:[]});
  MAPS.maison=R(['wwwwwwwwww','wwwwwwwwww','KK..tv..BB','..........','..........','...cc.....','..........','....mm....']);
  MAPS.labo=R(['wwwwwwwwww','wwwwwwwwww','KKKK..KKKK','..........','...ccc....','..........','..........','..........','....mm....']);
  MAPS.centre=R(['wwwwwwwwww','wwwwwwwwww','..NNNNN.Q.','..........','..........','v........v','....mm....']);
  MAPS.boutique=R(['wwwwwwwwww','wwwwwwwwww','NN..KKKKKK','N.........','N.........','..........','....mm....']);
  MAPS.arene=R(['wwwwwwwwww','wwwwwwwwww','..........','..........','..........','..........','..........','..........','..........','..........','.O......O.','....mm....']);
  MAPS.ligue=R(['wwwwwwwwww','wwwwwwwwww','..........','..........','..........','..........','..........','.O......O.','....mm....']);
}
const SOLID_OUT=new Set(['T','~','#','S','B','M','r','X','v']);
const SOLID_IN=new Set(['w','K','t','v','B','c','N','Q','O',' ']);
function tileAt(m,x,y){ const M=MAPS[m]; if(!M||x<0||y<0||x>=M.w||y>=M.h) return M?M.fill:' '; return M.rows[y][x]; }
function solidTile(m,x,y){ const t=tileAt(m,x,y); return MAPS[m].outdoor?SOLID_OUT.has(t)&&t!=='D':SOLID_IN.has(t); }
