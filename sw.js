var CACHE_NAME = 'scripthunt-v0.3.0';
var STATIC_ASSETS = ['/', '/index.html', '/icon.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(STATIC_ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(names) {
    return Promise.all(names.filter(function(n) { return n !== CACHE_NAME; }).map(function(n) { return caches.delete(n); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(function(cached) {
      var fetched = fetch(e.request).then(function(resp) {
        if (resp.ok) { var clone = resp.clone(); caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); }); }
        return resp;
      }).catch(function() { return cached; });
      return cached || fetched;
    }));
  }
});
