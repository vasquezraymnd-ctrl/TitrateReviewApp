
const CACHE_NAME = 'titrate-lab-cache-v1';
const OFFLINE_URL = '/';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/icon',
  '/apple-icon',
  'https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Inter:wght@400;500;600;700&display=swap'
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
  if (event.request.method !== 'GET') return;

  // Prioritize PDF Worker and static assets for offline use
  const isExternalAsset = event.request.url.includes('unpkg.com') || event.request.url.includes('fonts.gstatic.com');

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        // Cache successful requests dynamically
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Avoid caching large binary blobs like raw PDFs unless requested, 
          // but cache the UI and scripts
          if (!event.request.url.includes('blob:')) {
            cache.put(event.request, responseToCache);
          }
        });

        return response;
      }).catch(() => {
        // Offline Fallback
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        return null;
      });
    })
  );
});
