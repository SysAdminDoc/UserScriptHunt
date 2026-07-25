const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

function loadWorker(fetchImpl) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'cors-proxy', 'worker.js'), 'utf8');
  const context = {
    addEventListener() {},
    fetch: fetchImpl,
    Request,
    Response,
    URL,
    AbortSignal,
    TextDecoder,
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.handleRequest;
}

function proxyRequest(target, init = {}) {
  return new Request('https://proxy.example/?url=' + encodeURIComponent(target), {
    headers: { Origin: 'https://sysadmindoc.github.io' },
    ...init,
  });
}

function loadServiceWorker() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  const context = {
    self: {
      addEventListener() {},
      clients: { matchAll: async () => [], claim() {} },
      skipWaiting() {},
    },
    caches: {},
    fetch: async () => new Response(''),
    crypto: webcrypto,
    Request,
    Response,
    URL,
    Uint8Array,
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context;
}

test('worker allows only configured proxied userscript hosts', async () => {
  const fetched = [];
  const fetchOptions = [];
  const handleRequest = loadWorker(async (target, options) => {
    fetched.push(target);
    fetchOptions.push(options);
    return new Response('fixture body', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  });

  const allowedTargets = [
    'https://openuserjs.org/scripts?q=dark',
    'https://www.userscript.zone/search?l=en&q=dark',
    'https://gist.github.com/search?q=user.js',
    'https://gist.githubusercontent.com/user/gist/raw/file.user.js',
  ];

  for (const target of allowedTargets) {
    const response = await handleRequest(proxyRequest(target));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { contents: 'fixture body' });
  }

  assert.deepEqual(fetched, allowedTargets);
  assert.ok(fetchOptions.every((options) => options.redirect === 'manual'));
  assert.ok(fetchOptions.every((options) => options.signal instanceof AbortSignal));
});

test('worker rejects unconfigured target hosts', async () => {
  const handleRequest = loadWorker(async () => {
    throw new Error('fetch should not run for rejected hosts');
  });

  for (const target of [
    'https://example.com/script.user.js',
    'https://greasyfork.org/en/scripts',
    'https://subdomain.openuserjs.org/scripts',
  ]) {
    const response = await handleRequest(proxyRequest(target));
    assert.equal(response.status, 403);
    assert.equal(await response.text(), 'Target domain not allowed');
  }
});

test('worker requires HTTPS and rejects URL credentials or custom ports', async () => {
  const handleRequest = loadWorker(async () => {
    throw new Error('fetch should not run for rejected targets');
  });

  const cases = [
    ['http://openuserjs.org/scripts', 'Target URL must use HTTPS'],
    ['https://user:pass@openuserjs.org/scripts', 'Target URL credentials or custom ports are not allowed'],
    ['https://openuserjs.org:8443/scripts', 'Target URL credentials or custom ports are not allowed'],
  ];

  for (const [target, message] of cases) {
    const response = await handleRequest(proxyRequest(target));
    assert.equal(response.status, 403);
    assert.equal(await response.text(), message);
  }
});

test('worker rejects upstream redirects instead of following a new target', async () => {
  const handleRequest = loadWorker(async () => {
    return new Response(null, {
      status: 302,
      headers: { Location: 'https://example.com/private' },
    });
  });

  const response = await handleRequest(proxyRequest('https://openuserjs.org/scripts'));
  assert.equal(response.status, 502);
  assert.equal(await response.text(), 'Upstream redirects are not allowed');
});

test('worker caps declared and streamed upstream response bodies', async () => {
  const declared = loadWorker(async () => {
    return new Response('small', {
      status: 200,
      headers: { 'Content-Length': String(5 * 1024 * 1024 + 1) },
    });
  });
  let response = await declared(proxyRequest('https://openuserjs.org/scripts'));
  assert.equal(response.status, 413);
  assert.equal(await response.text(), 'Upstream response exceeds 5 MB limit');

  const streamed = loadWorker(async () => {
    return new Response(new Uint8Array(5 * 1024 * 1024 + 1), { status: 200 });
  });
  response = await streamed(proxyRequest('https://openuserjs.org/scripts'));
  assert.equal(response.status, 413);
  assert.equal(await response.text(), 'Upstream response exceeds 5 MB limit');
});

test('worker preserves upstream status and content type evidence', async () => {
  const handleRequest = loadWorker(async () => {
    return new Response('not found', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  });

  const response = await handleRequest(proxyRequest('https://openuserjs.org/missing'));
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-upstream-content-type'), 'text/html; charset=utf-8');
  assert.deepEqual(await response.json(), { contents: 'not found' });
});

test('worker returns bounded timeout and upstream failure errors', async () => {
  const timeoutWorker = loadWorker(async () => {
    throw new DOMException('timed out', 'TimeoutError');
  });
  let response = await timeoutWorker(proxyRequest('https://openuserjs.org/scripts'));
  assert.equal(response.status, 504);
  assert.equal(await response.text(), 'Upstream request timed out');

  const failedWorker = loadWorker(async () => {
    throw new Error('sensitive upstream details');
  });
  response = await failedWorker(proxyRequest('https://openuserjs.org/scripts'));
  assert.equal(response.status, 502);
  assert.equal(await response.text(), 'Upstream request failed');
});

test('worker rejects origin confusion attacks from subdomain impersonation', async () => {
  const handleRequest = loadWorker(async () => {
    return new Response('fixture body', { status: 200 });
  });

  const evilRequest = new Request('https://proxy.example/?url=' + encodeURIComponent('https://openuserjs.org/scripts'), {
    headers: { Origin: 'http://localhost.evil.com' },
  });
  const response = await handleRequest(evilRequest);
  const origin = response.headers.get('Access-Control-Allow-Origin');
  assert.notEqual(origin, 'http://localhost.evil.com', 'Should not reflect attacker origin');
  assert.equal(origin, 'https://sysadmindoc.github.io');
});

test('worker rejects non-GET proxied requests', async () => {
  const handleRequest = loadWorker(async () => {
    throw new Error('fetch should not run for rejected methods');
  });

  const response = await handleRequest(proxyRequest('https://openuserjs.org/scripts', { method: 'POST' }));
  assert.equal(response.status, 405);
  assert.equal(await response.text(), 'Only GET requests allowed');
});

test('service worker detects changed assets without false update notifications', async () => {
  const sw = loadServiceWorker();

  assert.equal(
    await sw.assetResponsesDiffer(
      new Response('cached', { headers: { ETag: '"v1"' } }),
      new Response('different body', { headers: { ETag: '"v1"' } })
    ),
    false,
    'matching strong validators should suppress an update'
  );
  assert.equal(
    await sw.assetResponsesDiffer(
      new Response('cached', { headers: { ETag: '"v1"' } }),
      new Response('cached', { headers: { ETag: '"v2"' } })
    ),
    true,
    'changed ETags should announce an update'
  );
  assert.equal(
    await sw.assetResponsesDiffer(new Response('same body'), new Response('same body')),
    false,
    'matching body fingerprints should suppress an update'
  );
  assert.equal(
    await sw.assetResponsesDiffer(new Response('old body'), new Response('new body')),
    true,
    'changed body fingerprints should announce an update'
  );
  assert.equal(await sw.assetResponsesDiffer(null, new Response('first cache fill')), false);
});
