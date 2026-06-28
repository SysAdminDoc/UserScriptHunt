addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const ALLOWED_ORIGINS = ['https://sysadmindoc.github.io', 'http://localhost', 'http://127.0.0.1'];
const ALLOWED_TARGETS = ['openuserjs.org', 'www.userscript.zone', 'gist.github.com', 'gist.githubusercontent.com'];

async function handleRequest(request) {
  const url = new URL(request.url);
  const target = url.searchParams.get('url');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== 'GET') {
    return new Response('Only GET requests allowed', { status: 405 });
  }

  if (!target) {
    return new Response('Missing ?url= parameter', { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  if (!ALLOWED_TARGETS.some(d => targetUrl.hostname === d || targetUrl.hostname.endsWith('.' + d))) {
    return new Response('Target domain not allowed', { status: 403 });
  }

  const resp = await fetch(target, {
    headers: { 'User-Agent': 'ScriptHunt-CORS-Proxy/1.0' },
    redirect: 'follow',
  });

  const body = await resp.text();
  return new Response(JSON.stringify({ contents: body }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
