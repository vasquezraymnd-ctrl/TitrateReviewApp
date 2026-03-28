/**
 * TITRATE Laboratory Service Worker
 * Strategy: Stale-While-Revalidate for App Shell & External Dependencies
 */

const CACHE_NAME = 'titrate-lab-v1';
const OFFLINE_URL = '/';

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/library',
  '/quiz',
  '/scheduler',
  '/focus',
  '/instrumentation',
  '/manifest.json',
  '/icon',
  '/apple-icon'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Navigation strategy: Try network, fallback to cached root index
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Asset strategy: Cache-First for static/external dependencies
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache external clinical dependencies (PDF Worker, Fonts)
        if (
          event.request.url.includes('unpkg.com') ||
          event.request.url.includes('fonts.googleapis.com') ||
          event.request.url.includes('fonts.gstatic.com') ||
          event.request.url.includes('picsum.photos') ||
          event.request.url.includes('unsplash.com')
        ) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      });
    })
  );
});
