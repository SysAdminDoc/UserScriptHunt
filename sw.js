var CACHE_NAME = 'scripthunt-v0.4.2';
var SHELL_ASSETS = ['./', './index.html', './icon.png', './manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_ASSETS);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(names) {
    return Promise.all(names.filter(function(n) { return n !== CACHE_NAME; }).map(function(n) { return caches.delete(n); }));
  }));
  self.clients.claim();
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function notifyClients(message) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
    clients.forEach(function(client) { client.postMessage(message); });
  });
}

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        if (resp.ok) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        }
        return resp;
      }).catch(function() {
        return caches.match(e.request).then(function(cached) {
          if (cached) {
            notifyClients({ type: 'CACHE_FALLBACK', url: e.request.url });
            return cached;
          }
          return caches.match('./index.html').then(function(shell) {
            if (shell) {
              notifyClients({ type: 'CACHE_FALLBACK', url: './index.html' });
              return shell;
            }
            return new Response('ScriptHunt offline shell unavailable.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
          });
        });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetched = fetch(e.request).then(function(resp) {
        if (resp.ok) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        }
        return resp;
      }).catch(function() {
        if (cached) notifyClients({ type: 'CACHE_FALLBACK', url: e.request.url });
        return cached;
      });
      return cached || fetched;
    })
  );
});
