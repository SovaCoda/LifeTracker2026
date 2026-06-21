/*
 * Hand-written service worker (kept ES5-safe on purpose: files in /public are
 * shipped as-is and NOT transpiled, so this must run on Safari 12 directly).
 *
 * Strategy: stale-while-revalidate for same-origin GETs. After the first online
 * load the app works fully offline; whenever online, the cache is refreshed in
 * the background. Hashed Vite bundle names are handled automatically because we
 * cache by request rather than from a fixed precache list.
 */
var CACHE = 'lifetracker-v1';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE) return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(function (cached) {
      var network = fetch(request).then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        return cached;
      });

      return cached || network;
    })
  );
});
