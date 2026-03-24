/**
 * TITRATE PWA Service Worker
 * Handles offline caching for clinical protocols and laboratory tools.
 */

const CACHE_NAME = 'titrate-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/library',
  '/quiz',
  '/scheduler',
  '/focus',
  '/icon',
  '/apple-icon'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Don't cache if not a success or if it's a dynamic API call
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }
        
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return fetchResponse;
      }).catch(() => {
        // Fallback for offline mode if fetch fails
        return caches.match('/');
      });
    })
  );
});
