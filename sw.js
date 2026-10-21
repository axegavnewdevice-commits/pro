const CACHE_VERSION = 'arabic-scrabble-pwa-v1';
const APP_CACHE = `${CACHE_VERSION}-app`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
const EXTERNAL_BOOTSTRAP = 'https://cdn.tailwindcss.com';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await cache.addAll(APP_SHELL);

    // Tailwind is loaded from a CDN by the original game HTML. Store its
    // opaque classic-script response so styles can still initialize offline.
    try {
      const response = await fetch(EXTERNAL_BOOTSTRAP, { mode: 'no-cors', cache: 'reload' });
      if (response && (response.type === 'opaque' || response.ok)) {
        const runtime = await caches.open(RUNTIME_CACHE);
        await runtime.put(EXTERNAL_BOOTSTRAP, response.clone());
      }
    } catch (_) {
      // The PWA can still install; a network visit can fill the runtime cache.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('arabic-scrabble-pwa-') &&
      key !== APP_CACHE && key !== RUNTIME_CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (isSameOrigin && request.mode === 'navigate') {
    // Prefer the latest deployed HTML; show the cached game if offline.
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(APP_CACHE);
          await cache.put('./index.html', response.clone()).catch(() => {});
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) ||
          (await caches.match('./index.html')) ||
          (await caches.match('./'));
      }
    })());
    return;
  }

  if (isSameOrigin) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) {
        // Update in the background for future visits.
        fetch(request).then(async (response) => {
          if (response && response.ok) {
            const cache = await caches.open(APP_CACHE);
            await cache.put(request, response.clone());
          }
        }).catch(() => {});
        return cached;
      }
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(APP_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        return new Response('', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // CDN code and fonts are cached after a successful load and reused offline.
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw _;
    }
  })());
});
