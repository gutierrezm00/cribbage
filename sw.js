// Keeps the game on the phone so it opens in airplane mode. Network first (so updates arrive), cache as fallback.
const CACHE = 'crib-v2';
const FILES = ['./', './index.html', './mqtt.min.js', './jsQR.js', './qrcode.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const cached = () => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'));
  const net = fetch(e.request).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  });
  // a captive or dead plane connection can hang: give the network 3.5s, then use the saved copy
  const timeout = new Promise((_, no) => setTimeout(() => no(new Error('slow')), 3500));
  e.respondWith(Promise.race([net, timeout]).catch(() => cached()));
});
