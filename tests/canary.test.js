const assert = require('node:assert/strict');
const test = require('node:test');

const TIMEOUT = 15000;

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function fetchViaProxy(url, proxy) {
  const res = await fetch(`${proxy}?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status} from ${proxy}`);
  const data = await res.json();
  return data.contents || data;
}

test('canary: Greasy Fork API returns array for a simple query', async () => {
  const data = await fetchJson('https://api.greasyfork.org/en/scripts.json?q=dark+mode&page=1');
  assert.ok(Array.isArray(data), 'Greasy Fork should return an array');
  assert.ok(data.length > 0, 'Should find at least one result');
  assert.ok(data[0].name, 'First result should have a name');
  assert.ok(data[0].code_url !== undefined, 'First result should have code_url field');
  console.log(`  Greasy Fork: ${data.length} results, first: "${data[0].name}"`);
});

test('canary: ScriptCat API returns structured response', async () => {
  const data = await fetchJson('https://scriptcat.org/api/v2/scripts?keyword=dark+mode&page=1&count=10');
  assert.ok(data && typeof data === 'object', 'ScriptCat should return an object');
  assert.ok(data.data && data.data.list, 'Response should have data.list');
  console.log(`  ScriptCat: ${data.data.list.length} results, total: ${data.data.total}`);
});

test('canary: GitHub Search API returns repositories', async () => {
  const data = await fetchJson('https://api.github.com/search/repositories?q=userscript+dark+mode&per_page=5&page=1');
  assert.ok(data && data.items, 'GitHub should return items array');
  assert.ok(data.items.length > 0, 'Should find at least one repo');
  assert.ok(data.items[0].full_name, 'First item should have full_name');
  console.log(`  GitHub repos: ${data.items.length} results, total: ${data.total_count}`);
});

test('canary: allorigins proxy wraps response in contents field', async () => {
  const html = await fetchViaProxy('https://openuserjs.org/scripts/search?q=dark+mode', 'https://api.allorigins.win/get');
  assert.ok(typeof html === 'string', 'Proxy should return contents as string');
  assert.ok(html.length > 100, 'HTML should be non-trivial');
  console.log(`  allorigins proxy: ${html.length} chars returned`);
});
