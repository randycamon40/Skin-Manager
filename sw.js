const CACHE_NAME = 'skin-manager-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400..800&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Bypass cache untuk API AI (OpenAI, Anthropic, Gemini) dan request non-GET
  if (
    e.request.method !== 'GET' ||
    url.hostname.includes('openai.com') ||
    url.hostname.includes('anthropic.com') ||
    (url.hostname.includes('googleapis.com') && !url.pathname.includes('fonts'))
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});