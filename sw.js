var CACHE_NAME = 'scripthunt-v0.6.1';
var SHELL_ASSETS = [
  './',
  './index.html',
  './icon.png',
  './icon-32.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './assets/brand/scripthunt-mark.png',
  './manifest.json',
  './fonts/jetbrains-mono-latin.woff2',
  './fonts/jetbrains-mono-latin-ext.woff2',
  './fonts/outfit-latin.woff2',
  './fonts/outfit-latin-ext.woff2',
];

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
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
    clients.forEach(function(client) { client.postMessage(message); });
  });
}

async function responseBodyHash(response) {
  var bytes = await response.clone().arrayBuffer();
  var digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(function(byte) { return byte.toString(16).padStart(2, '0'); }).join('');
}

async function assetResponsesDiffer(cached, fresh) {
  if (!cached || !fresh) return false;
  var cachedEtag = cached.headers.get('etag');
  var freshEtag = fresh.headers.get('etag');
  if (cachedEtag && freshEtag) return cachedEtag !== freshEtag;
  var cachedModified = cached.headers.get('last-modified');
  var freshModified = fresh.headers.get('last-modified');
  var cachedLength = cached.headers.get('content-length');
  var freshLength = fresh.headers.get('content-length');
  if (cachedModified && freshModified && cachedLength && freshLength) {
    return cachedModified !== freshModified || cachedLength !== freshLength;
  }
  return (await responseBodyHash(cached)) !== (await responseBodyHash(fresh));
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
        if (!resp.ok) return resp;
        return assetResponsesDiffer(cached, resp).then(function(changed) {
          return caches.open(CACHE_NAME).then(function(c) {
            return c.put(e.request, resp.clone()).then(function() {
              if (cached && changed) return notifyClients({ type: 'ASSET_UPDATED', url: e.request.url }).then(function() { return resp; });
              return resp;
            });
          });
        });
      }).catch(function() {
        if (cached) notifyClients({ type: 'CACHE_FALLBACK', url: e.request.url });
        return cached;
      });
      return cached || fetched;
    })
  );
});
