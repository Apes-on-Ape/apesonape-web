// AOA Service Worker — v1
// Strategy:
//   - App shell & static assets → Cache First (fast loads, offline capable)
//   - API routes              → Network First  (always fresh data)
//   - SoundCloud embeds       → Network Only   (cross-origin, can't cache)

const CACHE = 'aoa-v1';

const PRECACHE = [
  '/',
  '/music',
  '/music/',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/logo.png',
  '/favicon.png',
];

// ── Install — precache app shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(PRECACHE).catch(() => {
        // Some precache URLs may 404 in dev — ignore silently
      })
    )
  );
  self.skipWaiting();
});

// ── Activate — delete old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

// ── Fetch — routing strategy ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from our own origin
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Next.js internals / HMR — skip
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // API routes → Network First (with cache fallback for offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache successful API responses for offline fallback
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Next.js static chunks → Cache First (immutable, content-hashed filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((cache) => cache.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Images & other static assets → Cache First
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/artists/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|mp4|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((cache) => cache.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // HTML navigation → Network First, offline fallback to cached version
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request) || caches.match('/'))
    );
  }
});
