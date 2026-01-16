const CACHE_NAME = 'offline-map-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // chỉ xử lý GET
  if (req.method !== 'GET') return;

  // Cache-first cho tiles (png/jpg/pbf) và app assets
  const isTile = url.pathname.includes('/tiles/') &&
    (url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.pbf'));

  if (isTile || APP_SHELL.some(p => url.pathname.endsWith(p.replace('./','/')))) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      // chỉ cache response ok
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })());
  }
});
