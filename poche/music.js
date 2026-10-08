/* =========================================================================
   MUSIQUE — petit séquenceur « console portable » : mélodie (onde carrée
   50 %), arpèges (25 %), basse (triangle) et batterie (bruit), planifiés
   à l'avance sur l'horloge audio. Toutes les compositions sont originales.
   Notation : « NOTE:durée » en doubles-croches, « r » = silence.
   ========================================================================= */
const SONGS={
  title:{bpm:132,drums:'k...h...s...h.k.k...h...s...h...',bass:'oct',
    chords:'C:16 G:16 Am:16 Em:16 F:16 C:16 Dm:16 G:16',
    mel:'E5:4 G5:4 C6:6 B5:2 D6:4 B5:4 G5:6 A5:2 C6:4 A5:4 E5:4 A5:4 B5:6 G5:2 E5:8 A5:4 C6:4 F6:6 E6:2 E6:4 C6:4 G5:8 F5:4 A5:4 D6:4 F6:4 E6:2 D6:2 C6:2 B5:2 D6:8'},
  town:{bpm:100,drums:'k.......s.......',bass:'walk',
    chords:'G:16 Em:16 C:16 D:16 G:16 Em:16 Am:8 D:8 G:16',
    mel:'B4:4 D5:4 G5:6 F#5:2 E5:4 G5:4 B5:8 A5:4 G5:4 E5:4 C5:4 D5:6 E5:2 F#5:4 A5:4 G5:4 B5:4 D6:6 C6:2 B5:4 G5:4 E5:8 C6:4 A5:4 F#5:4 A5:4 G5:12 r:4'},
  city:{bpm:116,drums:'k...h.h.s...h.h.',bass:'walk',
    chords:'F:16 C:16 Dm:16 Bb:16 F:16 C:16 Bb:16 C:16',
    mel:'C5:4 F5:4 A5:6 G5:2 E5:4 G5:4 C6:8 D5:4 F5:4 A5:4 D6:4 C6:6 Bb5:2 F5:8 A5:4 C6:4 F6:6 E6:2 D6:4 C6:4 G5:8 F5:4 Bb5:4 D6:4 F6:4 E6:4 D6:4 C6:4 Bb5:4'},
  route:{bpm:144,drums:'k...h.k.s...h...',bass:'oct',
    chords:'D:16 A:16 Bm:16 G:16 D:16 A:16 G:16 A:16',
    mel:'F#5:2 A5:2 D6:4 C#6:2 B5:2 A5:4 E5:2 A5:2 C#6:4 B5:2 A5:2 E5:4 F#5:2 B5:2 D6:4 C#6:2 D6:2 F#6:4 E6:4 D6:2 B5:2 G5:8 A5:2 D6:2 F#6:4 E6:2 D6:2 A5:4 C#6:2 E6:2 A6:4 G6:2 F#6:2 E6:4 D6:2 B5:2 G5:2 B5:2 D6:4 G6:4 F#6:4 E6:4 C#6:4 A5:4'},
  forest:{bpm:112,drums:'k.......h...s...',bass:'walk',
    chords:'Em:16 C:16 G:16 D:16 Em:16 C:16 Am:16 B:16',
    mel:'B5:4 E6:4 G6:4 F#6:4 E6:8 C6:8 D6:4 B5:4 G5:4 B5:4 A5:8 F#5:8 G5:4 B5:4 E6:6 D6:2 C6:4 E6:4 G6:8 A6:4 G6:4 E6:4 C6:4 D#6:8 B5:8'},
  league:{bpm:112,drums:'k...h...s.k.h...',bass:'oct',
    chords:'Bb:16 F:16 Gm:16 Eb:16 Bb:16 F:16 Eb:16 F:16',
    mel:'D6:4 F6:4 Bb6:8 A6:4 F6:4 C6:8 Bb5:4 D6:4 G6:6 F6:2 Eb6:4 G6:4 Bb6:8 F6:2 G6:2 F6:2 D6:2 Bb5:8 C6:2 D6:2 Eb6:2 F6:2 A6:8 G6:4 Eb6:4 Bb5:4 G6:4 F6:8 A6:4 C7:4'},
  battle:{bpm:168,drums:'k.h.s.h.k.k.s.h.',bass:'drive',
    chords:'Am:16 F:16 G:16 E:16 Am:16 F:16 G:16 E:16',
    mel:'A5:2 A5:2 C6:2 A5:2 E6:4 D6:2 C6:2 A5:2 F5:2 A5:2 C6:2 F6:4 E6:2 C6:2 D6:2 B5:2 G5:2 B5:2 D6:2 G6:2 F6:2 D6:2 E6:4 B5:4 G#5:4 B5:4 C6:2 E6:2 A6:4 G6:2 E6:2 C6:4 F6:2 E6:2 C6:2 A5:2 C6:4 F6:4 G6:2 F6:2 D6:2 B5:2 G5:4 D6:4 E6:8 G#6:8'},
  trainer:{bpm:172,drums:'k.h.s.hkk.h.s.hs',bass:'drive',
    chords:'Em:16 C:16 D:16 B:16 Em:16 C:16 Am:16 B:16',
    mel:'E5:2 G5:2 B5:2 E6:2 D6:2 B5:2 G5:2 B5:2 C6:4 E6:4 G6:4 E6:4 F#6:2 D6:2 A5:2 D6:2 F#6:2 A6:2 G6:2 F#6:2 D#6:8 B5:4 F#5:4 G6:2 F#6:2 E6:2 B5:2 E6:4 G6:4 E6:2 C6:2 G5:2 C6:2 E6:4 G6:4 A6:4 G6:2 E6:2 C6:4 A5:4 B5:4 D#6:4 F#6:4 B6:4'},
  leader:{bpm:176,drums:'k.hsk.hsk.hsk.ss',bass:'drive',
    chords:'Dm:16 Bb:16 C:16 A:16 Dm:16 Bb:16 Gm:16 A:16',
    mel:'D6:2 F6:2 A6:4 G6:2 F6:2 E6:2 D6:2 F6:4 D6:4 Bb5:4 D6:4 E6:2 G6:2 C7:4 Bb6:2 A6:2 G6:4 A6:4 C#6:4 E6:4 A5:4 D6:2 D6:2 F6:2 D6:2 A6:4 F6:4 Bb6:4 A6:2 F6:2 D6:8 G6:2 A6:2 Bb6:4 A6:2 G6:2 D6:4 E6:4 G6:4 C#7:8'},
  legend:{bpm:160,drums:'k...s.k.k...s.ss',bass:'drive',
    chords:'Cm:16 Ab:16 Bb:16 G:16 Cm:16 Ab:16 Fm:16 G:16',
    mel:'C6:6 Eb6:2 G6:8 Ab6:6 G6:2 Eb6:8 F6:6 D6:2 Bb5:8 B5:4 D6:4 G6:8 G6:2 F6:2 Eb6:2 D6:2 C6:4 Eb6:4 C6:2 Eb6:2 Ab6:4 G6:4 Eb6:4 F6:4 Ab6:4 C7:4 Ab6:4 B6:8 G6:8'},
  victory:{bpm:140,drums:'k...h...s...h...',bass:'oct',
    chords:'C:16 F:16 G:16 C:16 Am:16 F:16 G:16 C:16',
    mel:'G5:2 G5:2 G5:2 C6:6 E6:4 F6:4 E6:2 D6:2 C6:4 A5:4 B5:4 D6:4 G6:4 F6:4 E6:8 C6:8 A5:4 C6:4 E6:4 A6:4 A6:2 G6:2 F6:4 C6:8 D6:4 G6:4 B6:4 D7:4 C7:12 r:4'},
  gym:{bpm:120,drums:'k...h.k.s...h...',bass:'oct',
    chords:'Gm:16 Eb:16 F:16 D:16',
    mel:'G5:4 Bb5:4 D6:4 G6:4 G6:4 F6:2 Eb6:2 Bb5:8 A5:4 C6:4 F6:4 A6:4 F#6:8 D6:8'},
  centre:{bpm:104,drums:'k.......h.......',bass:'walk',
    chords:'C:16 Am:16 F:16 G:16',
    mel:'E5:4 G5:4 C6:4 G5:4 A5:4 C6:4 E6:8 F6:4 E6:4 C6:4 A5:4 B5:4 D6:4 G5:8'},
  evo:{bpm:120,drums:'k...h...k...h...',bass:'oct',
    chords:'Am:16 E:16',
    mel:'A5:2 C6:2 E6:2 C6:2 A5:2 C6:2 E6:2 C6:2 G#5:2 B5:2 E6:2 B5:2 G#5:2 B5:2 E6:2 B5:2'},
  heal:{bpm:150,once:1,drums:'',bass:'none',chords:'C:8 G:4 C:8',mel:'C6:2 E6:2 G6:2 E6:2 D6:2 B5:2 C6:8'},
};
const NOTE_I={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
function midiOf(s){ const m=/^([A-G][#b]?)(\d)$/.exec(s); return m?12*(+m[2]+1)+NOTE_I[m[1]]:null; }
const hz=m=>440*Math.pow(2,(m-69)/12);
function chordNotes(name){ const m=/^([A-G][#b]?)(m?)/.exec(name), r=NOTE_I[m[1]], minor=m[2]==='m';
  return [r,r+(minor?3:4),r+7]; }
/* compile une chanson en pistes de pas (1 pas = double-croche) */
function compileSong(s){ if(s._c) return s._c; const mel=[], ch=[];
  for(const tk of s.mel.split(/\s+/)){ const [n,l]=tk.split(':'); mel.push({m:n==='r'?null:midiOf(n),len:+l||1}); }
  for(const tk of s.chords.split(/\s+/)){ const [n,l]=tk.split(':'); ch.push({c:chordNotes(n),len:+l}); }
  const L=Math.max(mel.reduce((a,x)=>a+x.len,0),ch.reduce((a,x)=>a+x.len,0));
  const melAt=new Array(L).fill(null), chAt=new Array(L);
  let t=0; for(const x of mel){ if(x.m!=null&&t<L) melAt[t]={m:x.m,len:x.len}; t+=x.len; }
  t=0; for(const x of ch){ for(let i=0;i<x.len&&t+i<L;i++) chAt[t+i]={c:x.c,start:i===0,i}; t+=x.len; }
  for(let i=0;i<L;i++) if(!chAt[i]) chAt[i]=chAt[i-1]||{c:[0,4,7],i:0};
  return s._c={L,melAt,chAt}; }

const MUS={song:null,name:'',on:true,vol:1,step:0,next:0,waves:null,out:null,noiseBuf:null,
  setup(){ const ac=AU.ac; if(!ac||this.out) return;
    const pulse=d=>{ const N=32, re=new Float32Array(N), im=new Float32Array(N); for(let n=1;n<N;n++) re[n]=2/(n*Math.PI)*Math.sin(n*Math.PI*d); return ac.createPeriodicWave(re,im); };
    this.waves={p50:pulse(.5),p25:pulse(.25),p12:pulse(.125)};
    this.out=ac.createGain(); this.out.gain.value=.9; this.out.connect(ac.destination);
    const b=ac.createBuffer(1,ac.sampleRate*.5,ac.sampleRate), x=b.getChannelData(0); for(let i=0;i<x.length;i++) x[i]=Math.random()*2-1; this.noiseBuf=b; },
  play(n){ if(this.name===n&&this.song) return; this.name=n; this.song=SONGS[n]||null; this.step=0; this.next=0; },
  stop(){ this.song=null; this.name=''; },
  tone(f,t,d,wave,vol){ const ac=AU.ac, o=ac.createOscillator(), g=ac.createGain();
    if(typeof wave==='string') o.type=wave; else o.setPeriodicWave(wave); o.frequency.setValueAtTime(f,t);
    if(d>.25&&wave===this.waves.p50){ const v=ac.createOscillator(), vg=ac.createGain(); v.frequency.value=5.5; vg.gain.setValueAtTime(0,t); vg.gain.linearRampToValueAtTime(f*.012,t+.25); v.connect(vg).connect(o.frequency); v.start(t); v.stop(t+d+.05); }
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.006); g.gain.setValueAtTime(vol,t+Math.max(.01,d*.6)); g.gain.linearRampToValueAtTime(vol*.6,t+d*.92); g.gain.linearRampToValueAtTime(0,t+d);
    o.connect(g).connect(this.out); o.start(t); o.stop(t+d+.02); },
  drum(k,t){ const ac=AU.ac;
    if(k==='k'){ const o=ac.createOscillator(), g=ac.createGain(); o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(40,t+.11); g.gain.setValueAtTime(.22,t); g.gain.exponentialRampToValueAtTime(.001,t+.13); o.connect(g).connect(this.out); o.start(t); o.stop(t+.15); return; }
    const s=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=this.noiseBuf; f.type='highpass'; f.frequency.value=k==='h'?7000:1800;
    const d=k==='h'?.035:.12, v=k==='h'?.035:.09; g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.001,t+d); s.connect(f).connect(g).connect(this.out); s.start(t); s.stop(t+d+.01); },
  tick(){ const ac=AU.ac; if(!ac||!this.song||!this.on||!AU.on) { if(ac) this.next=0; return; } this.setup();
    const s=this.song, C=compileSong(s), dt=60/s.bpm/4; if(!this.next||this.next<ac.currentTime-.2) this.next=ac.currentTime+.05;
    while(this.next<ac.currentTime+.12){ const i=this.step%C.L, t=this.next;
      if(s.once&&this.step>=C.L){ this.song=null; this.name=''; return; }
      const m=C.melAt[i]; if(m) this.tone(hz(m.m),t,m.len*dt,this.waves.p50,.055);
      const c=C.chAt[i], root=c.c[0];
      /* arpèges */
      if(s.bass!=='none'||1){ const arp=c.c[i%3]; this.tone(hz(60+arp+(i%6>2?12:0)),t,dt*.9,this.waves.p25,.018); }
      /* basse */
      if(s.bass==='oct'&&i%2===0) this.tone(hz(36+root+((i>>1)%2?12:0)),t,dt*1.8,'triangle',.16);
      else if(s.bass==='walk'&&i%4===0) this.tone(hz(36+[c.c[0],c.c[2],c.c[1]+12,c.c[2]][(i>>2)%4]),t,dt*3.6,'triangle',.16);
      else if(s.bass==='drive') this.tone(hz(36+root+(i%4===2?12:0)),t,dt*.85,'triangle',.15);
      else if(s.bass==='none'&&c.start) this.tone(hz(48+root),t,dt*c.c.length*2,'triangle',.12);
      const d=s.drums&&s.drums[i%s.drums.length]; if(d&&d!=='.') this.drum(d,t);
      this.step++; this.next+=dt; } } };
/* cris des personnages : 3 notes dont la hauteur dépend du numéro */
function cry(n,low){ const ac=AU.ac; if(!ac||!AU.on) return; const t=ac.currentTime+.02, h=(n*2654435761>>>0);
  const base=220+(h%500)*(low?.5:1), shape=['square','sawtooth','square','triangle'][h>>9&3];
  for(let i=0;i<3;i++){ const o=ac.createOscillator(), g=ac.createGain(), a=t+i*.09, f=base*(1+((h>>(i*4))&7)/10)*(i===1?1.25:1);
    o.type=shape; o.frequency.setValueAtTime(f,a); o.frequency.exponentialRampToValueAtTime(f*(i===2?(low?.4:.6):1.1),a+.12);
    g.gain.setValueAtTime(.045,a); g.gain.exponentialRampToValueAtTime(.001,a+.14); o.connect(g).connect(ac.destination); o.start(a); o.stop(a+.16); } }
