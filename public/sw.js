// KDD — Customer PWA Service Worker
// Strategy: network-first for navigations, cache-first for static assets,
// stale-while-revalidate for images. Skips API/auth/realtime calls.

const VERSION = 'v1.0.0';
const STATIC_CACHE = `makani-static-${VERSION}`;
const RUNTIME_CACHE = `makani-runtime-${VERSION}`;
const IMAGE_CACHE = `makani-images-${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

const isImageRequest = (req) =>
  req.destination === 'image' || /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(req.url);

const isStaticAsset = (url) =>
  /\.(js|css|woff2?|ttf|otf|eot)(\?|$)/i.test(url) ||
  url.includes('/assets/');

const isApiOrRealtime = (url) =>
  url.includes('/rest/v1/') ||
  url.includes('/auth/v1/') ||
  url.includes('/realtime/v1/') ||
  url.includes('/functions/v1/') ||
  url.includes('/storage/v1/object/upload') ||
  url.startsWith('ws:') ||
  url.startsWith('wss:');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = req.url;

  // Bypass anything dynamic / auth / realtime
  if (isApiOrRealtime(url)) return;

  // Skip the admin panel & service worker controlled routes
  if (new URL(url).pathname.startsWith('/admin')) return;

  // Navigation requests → network-first, fallback to cached / offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // Images → stale-while-revalidate
  if (isImageRequest(req)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // JS/CSS/fonts → cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
      )
    );
    return;
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});