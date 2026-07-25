addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const ALLOWED_ORIGINS = ['https://sysadmindoc.github.io', 'http://localhost', 'http://127.0.0.1'];
const ALLOWED_TARGETS = ['openuserjs.org', 'www.userscript.zone', 'gist.github.com', 'gist.githubusercontent.com'];
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 15000;

async function handleRequest(request) {
  const url = new URL(request.url);
  const target = url.searchParams.get('url');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== 'GET') {
    return errorResponse(request, 'Only GET requests allowed', 405);
  }

  if (!target) {
    return errorResponse(request, 'Missing ?url= parameter', 400);
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return errorResponse(request, 'Invalid URL', 400);
  }

  if (targetUrl.protocol !== 'https:') {
    return errorResponse(request, 'Target URL must use HTTPS', 403);
  }

  if (targetUrl.username || targetUrl.password || (targetUrl.port && targetUrl.port !== '443')) {
    return errorResponse(request, 'Target URL credentials or custom ports are not allowed', 403);
  }

  if (!ALLOWED_TARGETS.includes(targetUrl.hostname.toLowerCase())) {
    return errorResponse(request, 'Target domain not allowed', 403);
  }

  let resp;
  try {
    resp = await fetch(targetUrl.toString(), {
      headers: { 'User-Agent': 'ScriptHunt-CORS-Proxy/1.0' },
      redirect: 'manual',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return errorResponse(request, timedOut ? 'Upstream request timed out' : 'Upstream request failed', timedOut ? 504 : 502);
  }

  if (resp.status >= 300 && resp.status < 400) {
    return errorResponse(request, 'Upstream redirects are not allowed', 502);
  }

  let body;
  try {
    body = await readBodyWithLimit(resp);
  } catch (error) {
    if (error && error.code === 'BODY_TOO_LARGE') {
      return errorResponse(request, 'Upstream response exceeds 5 MB limit', 413);
    }
    return errorResponse(request, 'Upstream response could not be read', 502);
  }

  const upstreamContentType = resp.headers.get('content-type') || 'application/octet-stream';
  return new Response(JSON.stringify({ contents: body }), {
    status: resp.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Upstream-Content-Type': upstreamContentType,
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(request),
    },
  });
}

async function readBodyWithLimit(response) {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) throw bodyTooLargeError();
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let body = '';

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw bodyTooLargeError();
    }
    body += decoder.decode(chunk.value, { stream: true });
  }

  return body + decoder.decode();
}

function bodyTooLargeError() {
  const error = new Error('Upstream response too large');
  error.code = 'BODY_TOO_LARGE';
  return error;
}

function errorResponse(request, message, status) {
  return new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(request),
    },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + ':') || origin.startsWith(o + '/'));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
