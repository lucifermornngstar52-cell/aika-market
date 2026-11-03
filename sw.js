const CACHE = 'hikari-v4';
const SHELL = ['./', './index.html', './style.css', './app.js', './manifest.json', './assets/icons/hikari.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// сеть в приоритете: свежие файлы всегда выигрывают, кэш — только когда сети нет
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname === 'api.github.com' || e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
