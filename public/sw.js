/**
 * TITRATE PWA Service Worker
 * Ensures offline clinical assay availability and fast loading.
 */

const CACHE_NAME = 'titrate-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/library',
  '/quiz',
  '/scheduler',
  '/focus',
  '/globals.css',
  '/icon'
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
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Check if the request is for an asset we've cached or a page navigation
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found, otherwise fetch from network
      return response || fetch(event.request).catch(() => {
        // If both fail (offline and not in cache), return the offline fallback if it's a navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
