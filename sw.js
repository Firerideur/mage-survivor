/* Mage Survivor — service worker
   index.html : réseau d'abord (tu reçois la dernière version dès qu'elle est en ligne),
   cache en repli si hors connexion. Le reste : cache d'abord.            */
const V = 'mage-survivor-041b41ad';
const ASSETS = ['./','./index.html','./manifest.webmanifest',
                './icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method!=='GET') return;
  const isDoc = req.mode==='navigate' || req.url.endsWith('index.html') || req.url.endsWith('/');
  if(isDoc){
    e.respondWith(
      fetch(req).then(r=>{ const cp=r.clone(); caches.open(V).then(c=>c.put(req,cp)); return r; })
                .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{
      const cp=res.clone(); caches.open(V).then(c=>c.put(req,cp)); return res; })));
  }
});
