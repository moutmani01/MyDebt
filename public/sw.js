const CACHE='simple-ledger-v2';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icons/icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',e=>{const{request}=e;if(request.method!=='GET'||new URL(request.url).origin!==location.origin)return;e.respondWith((async()=>{try{const fresh=await fetch(request);(await caches.open(CACHE)).put(request,fresh.clone());return fresh}catch{return(await caches.match(request))||caches.match('./index.html')}})())});
