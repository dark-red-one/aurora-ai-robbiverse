// Service Worker for Robbie Live PWA

const CACHE_NAME = 'robbie-live-v1';
const urlsToCache = [
  '/robbie-live/',
  '/robbie-live/index.html',
  '/robbie-live/styles.css',
  '/robbie-live/face-animation.js',
  '/robbie-live/node-router.js',
  '/robbie-live/chat.js',
  '/robbie-live/app.js',
  '/robbie-live/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, update in background
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          // Update cache in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {
            // Network fetch failed, cached version is fine
          });
          
          return response;
        }
        
        // Not in cache - fetch from network
        return fetch(event.request).then((networkResponse) => {
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return networkResponse;
        });
      })
      .catch(() => {
        // Both cache and network failed
        return new Response('Offline and no cached version available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});


