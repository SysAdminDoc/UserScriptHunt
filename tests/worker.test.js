const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadWorker(fetchImpl) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'cors-proxy', 'worker.js'), 'utf8');
  const context = {
    addEventListener() {},
    fetch: fetchImpl,
    Request,
    Response,
    URL,
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

test('worker allows only configured proxied userscript hosts', async () => {
  const fetched = [];
  const handleRequest = loadWorker(async (target) => {
    fetched.push(target);
    return new Response('fixture body', { status: 200 });
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
});

test('worker rejects unconfigured target hosts', async () => {
  const handleRequest = loadWorker(async () => {
    throw new Error('fetch should not run for rejected hosts');
  });

  for (const target of ['https://example.com/script.user.js', 'https://greasyfork.org/en/scripts']) {
    const response = await handleRequest(proxyRequest(target));
    assert.equal(response.status, 403);
    assert.equal(await response.text(), 'Target domain not allowed');
  }
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
