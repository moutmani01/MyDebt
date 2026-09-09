// Simple Ledger service worker.
// Strategy: stale-while-revalidate for same-origin GETs (instant loads, cache
// refreshed in the background) + an explicit "check-update" message the page
// sends periodically, which re-fetches the shell and notifies open tabs when
// the deployed code actually changed so they can offer a one-tap reload.
const CACHE = 'simple-ledger-v4';
const SHELL = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icons/icon.svg'];
const FRESH_CHECK = ['./app.js', './index.html', './styles.css'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    const network = fetch(request)
      .then(res => { if (res && res.ok) cache.put(request, res.clone()); return res; })
      .catch(() => null);
    if (cached) { e.waitUntil(network); return cached; }
    return (await network) || (await cache.match('./index.html')) || Response.error();
  })());
});

self.addEventListener('message', e => {
  if (e.data !== 'check-update') return;
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let changed = false;
    for (const url of FRESH_CHECK) {
      try {
        const fresh = await fetch(url, { cache: 'no-store' });
        if (!fresh || !fresh.ok) continue;
        const freshText = await fresh.clone().text();
        const old = await cache.match(url);
        if (!old || (await old.text()) !== freshText) { await cache.put(url, fresh.clone()); changed = true; }
      } catch { /* offline: ignore */ }
    }
    if (changed) (await self.clients.matchAll()).forEach(c => c.postMessage('update-available'));
  })());
});
