// sw.js — cache leve para acelerar seu site
const VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${VERSION}`;

const toCache = [
  '/',            // GitHub Pages/Netlify servem "/" -> index.html
  '/index.html',
  '/iara.jpg',
  '/manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(toCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Network-first para HTML (pega atualizações do site quando houver)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put('/index.html', copy));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first para estáticos (imagem + manifest)
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      // Cacheia só GET e respostas 200 básicas
      if (req.method === 'GET' && res && res.status === 200) {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
