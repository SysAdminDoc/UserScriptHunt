const { test, expect } = require('@playwright/test');
const fixtures = require('./fixtures/source-adapters');

test('source adapters normalize representative source payloads', async ({ page }) => {
  await page.goto('/');

  const normalized = await page.evaluate((data) => ({
    greasyfork: normGF(data.greasyForkApiItem, 'greasyfork'),
    github: normGH(data.githubRepoItem),
    openuserjs: parseOUJS(data.openUserJsHtml)[0],
    uszone: parseUSZ(data.userscriptZoneHtml)[0],
    scriptcat: normSC(data.scriptCatItem),
    gists: parseGists(data.gistHtml)[0],
  }), fixtures);

  expect(normalized.greasyfork).toMatchObject({
    id: 'greasyfork-210',
    source: 'greasyfork',
    name: 'Fixture Greasy Script',
    author: 'gf-author',
    installUrl: 'https://greasyfork.org/scripts/210-fixture/code/Fixture.user.js',
    totalInstalls: 456,
    license: 'MIT',
  });

  expect(normalized.github).toMatchObject({
    id: 'github-310',
    source: 'github',
    name: 'fixture-userscript',
    author: 'fixture',
    url: 'https://github.com/fixture/fixture-userscript',
    stars: 99,
    license: 'Apache-2.0',
  });

  expect(normalized.openuserjs).toMatchObject({
    source: 'openuserjs',
    name: 'Fixture OpenUserJS',
    author: 'ou-author',
    installUrl: 'https://openuserjs.org/install/ou-author/fixture-openuserjs.user.js',
    totalInstalls: 1234,
  });

  expect(normalized.uszone).toMatchObject({
    source: 'uszone',
    name: 'Fixture Zone Script',
    url: 'https://greasyfork.org/scripts/410-fixture/code/Fixture.user.js',
    installUrl: 'https://greasyfork.org/scripts/410-fixture/code/Fixture.user.js',
  });

  expect(normalized.scriptcat).toMatchObject({
    id: 'scriptcat-510',
    source: 'scriptcat',
    name: 'Fixture ScriptCat',
    author: 'sc-author',
    installUrl: 'https://scriptcat.org/scripts/code/510/Fixture-ScriptCat.user.js',
    totalInstalls: 789,
  });

  expect(normalized.gists).toMatchObject({
    source: 'gists',
    name: 'Fixture Gist Script',
    author: 'gist-author',
    installUrl: 'https://gist.githubusercontent.com/gist-author/abc123/raw/Fixture.user.js',
  });
});

test('source adapters ignore empty and malformed drift shapes', async ({ page }) => {
  await page.goto('/');

  const normalized = await page.evaluate((data) => ({
    apiRows: {
      greasyfork: sourceRows(data.malformedGreasyForkRows).map((row) => normGF(row, 'greasyfork')),
      github: sourceRows(data.malformedGitHubRows).map(normGH),
      scriptcat: sourceRows(data.malformedScriptCatRows).map(normSC),
    },
    emptyCounts: {
      openuserjs: parseOUJS(data.emptyHtml).length,
      uszone: parseUSZ(data.emptyHtml).length,
      gists: parseGists(data.emptyHtml).length,
    },
    driftHtml: {
      openuserjs: parseOUJS(data.malformedOpenUserJsHtml),
      uszone: parseUSZ(data.malformedUserscriptZoneHtml),
      gists: parseGists(data.malformedGistHtml),
    },
  }), fixtures);

  expect(normalized.apiRows.greasyfork).toHaveLength(1);
  expect(normalized.apiRows.greasyfork[0]).toMatchObject({ id: 'greasyfork-211', name: 'Minimal Greasy Row' });
  expect(normalized.apiRows.github).toHaveLength(1);
  expect(normalized.apiRows.github[0]).toMatchObject({ id: 'github-311', name: 'fixture/minimal-gh', author: 'Unknown' });
  expect(normalized.apiRows.scriptcat).toHaveLength(1);
  expect(normalized.apiRows.scriptcat[0]).toMatchObject({ id: 'scriptcat-511', name: 'Minimal ScriptCat Row' });

  expect(normalized.emptyCounts).toEqual({ openuserjs: 0, uszone: 0, gists: 0 });
  expect(normalized.driftHtml.openuserjs).toHaveLength(1);
  expect(normalized.driftHtml.openuserjs[0]).toMatchObject({ name: 'Drift Valid OpenUserJS', author: 'ou-author' });
  expect(normalized.driftHtml.uszone).toHaveLength(1);
  expect(normalized.driftHtml.uszone[0]).toMatchObject({ name: 'Drift Zone Script', installUrl: 'https://github.com/example/drift.user.js' });
  expect(normalized.driftHtml.gists).toHaveLength(1);
  expect(normalized.driftHtml.gists[0]).toMatchObject({ name: 'Drift.user.js', installUrl: 'https://gist.github.com/gist-author/def456/raw/Drift.user.js' });
});

test('built-in sources return versioned provenance envelopes and preserve partial GitHub results', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async (data) => {
    const originalFetch = window.fetch;
    const originalToken = _ghToken;
    _cache.clear();
    try {
      _ghToken = 'ghp_fixture';
      window.fetch = async (url) => {
        const target = String(url);
        if (target.includes('api.greasyfork.org')) {
          return new Response(JSON.stringify([data.greasyForkApiItem]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (target.includes('/search/repositories')) {
          return new Response(JSON.stringify({
            total_count: 1501,
            incomplete_results: true,
            items: [data.githubRepoItem],
          }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        if (target.includes('/search/code')) {
          return new Response(JSON.stringify({ message: 'code unavailable' }), {
            status: 502,
            headers: { 'content-type': 'application/json' },
          });
        }
        throw new Error(`unexpected fetch ${target}`);
      };

      return {
        greasyfork: await SOURCES.greasyfork.search('fixture', 1, '', 'en'),
        github: await SOURCES.github.search('fixture', 1),
      };
    } finally {
      window.fetch = originalFetch;
      _ghToken = originalToken;
    }
  }, fixtures);

  expect(result.greasyfork).toMatchObject({
    schema: 'scripthunt-source-results',
    schemaVersion: 1,
    source: 'greasyfork',
    total: null,
    hasMore: false,
    partial: false,
    route: 'direct',
    httpStatus: 200,
    errorClass: '',
  });
  expect(result.greasyfork.items).toHaveLength(1);
  expect(result.greasyfork.latencyMs).toBeGreaterThanOrEqual(0);

  expect(result.github).toMatchObject({
    schemaVersion: 1,
    source: 'github',
    total: 1501,
    hasMore: true,
    partial: true,
    mode: 'repository + authenticated code',
  });
  expect(result.github.items).toHaveLength(1);
  expect(result.github.partialReason).toContain('incomplete results');
  expect(result.github.partialReason).toContain('1,000-result ceiling');
  expect(result.github.partialReason).toContain('Code search failed');
  expect(result.github.query).toContain('extension:user.js');
});

test('security scans reject invalid responses and cache only verified userscripts', async ({ page }) => {
  await page.goto('/');

  const outcomes = await page.evaluate(async () => {
    const originalFetch = window.fetch;
    const validCode = `// ==UserScript==
// @name Verified fixture
// @version 1.0.0
// @match https://example.com/*
// ==/UserScript==
console.log('verified');
`;
    const cases = {
      'non-2xx': new Response('<h1>Not found</h1>', {
        status: 404,
        headers: { 'content-type': 'text/html' },
      }),
      'invalid-content': new Response('<html>login</html>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
      empty: new Response('', {
        status: 200,
        headers: { 'content-type': 'text/javascript' },
      }),
      'not-userscript': new Response('console.log("ordinary script")', {
        status: 200,
        headers: { 'content-type': 'application/javascript' },
      }),
      oversized: new Response('small body', {
        status: 200,
        headers: {
          'content-type': 'text/javascript',
          'content-length': String(5 * 1024 * 1024 + 1),
        },
      }),
      verified: new Response(validCode, {
        status: 200,
        headers: { 'content-type': 'application/javascript; charset=utf-8' },
      }),
    };
    const makeItem = (name) => ({
      id: `scan-${name}`,
      source: 'greasyfork',
      name,
      version: '1.0.0',
      installUrl: `https://scan-fixture.invalid/${name}.user.js`,
    });

    try {
      try { await idbStoreClear('scans'); } catch (err) {}
      localStorage.removeItem('sh_scan_cache');
      window.fetch = async (url) => {
        const key = new URL(String(url)).pathname.slice(1, -'.user.js'.length);
        return cases[key];
      };

      const results = {};
      for (const key of ['non-2xx', 'invalid-content', 'empty', 'not-userscript', 'oversized', 'verified']) {
        results[key] = await fetchAndScan(makeItem(key));
      }
      let stored = [];
      try { stored = await idbScanEntries(); }
      catch (err) { stored = JSON.parse(localStorage.getItem('sh_scan_cache') || '[]'); }

      const cached = await fetchAndScan(makeItem('verified'));
      return {
        results,
        storedCount: stored.length,
        cached,
      };
    } finally {
      window.fetch = originalFetch;
    }
  });

  for (const key of ['non-2xx', 'invalid-content', 'empty', 'not-userscript', 'oversized']) {
    expect(outcomes.results[key]).toMatchObject({
      unavailable: true,
      status: 'unknown',
    });
  }
  expect(outcomes.results['non-2xx'].reason).toContain('HTTP 404');
  expect(outcomes.results['invalid-content'].reason).toContain('invalid content type');
  expect(outcomes.results.empty.reason).toContain('empty response');
  expect(outcomes.results['not-userscript'].reason).toContain('not a userscript');
  expect(outcomes.results.oversized.reason).toContain('script too large');
  expect(outcomes.storedCount).toBe(1);

  expect(outcomes.results.verified).toMatchObject({
    status: 'verified',
    sourceUrl: 'https://scan-fixture.invalid/verified.user.js',
    httpStatus: 200,
    contentType: 'application/javascript',
    cacheAgeMs: 0,
  });
  expect(outcomes.results.verified.fetchedAt).toBeGreaterThan(0);
  expect(outcomes.results.verified.codeHash).toMatch(/^[0-9a-f]{8}$/);
  expect(outcomes.cached).toMatchObject({
    status: 'verified',
    cached: true,
    sourceUrl: 'https://scan-fixture.invalid/verified.user.js',
    httpStatus: 200,
  });
  expect(outcomes.cached.cacheAgeMs).toBeGreaterThanOrEqual(0);
});

test('dependency checks are bounded and distinguish provenance and integrity states', async ({ page }) => {
  await page.goto('/');

  const outcomes = await page.evaluate(async () => {
    const originalFetch = window.fetch;
    const content = new TextEncoder().encode('verified dependency');
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', content));
    const expected = bytesToBase64(digest);
    let active = 0;
    let maxActive = 0;
    window.fetch = async (url) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      const target = String(url);
      if (target.includes('/redirect')) return new Response(null, { status: 302, headers: { location: 'https://elsewhere.invalid/file.js' } });
      if (target.includes('/missing')) return new Response('missing', { status: 404 });
      if (target.includes('/large')) return new Response('small', { status: 200, headers: { 'content-length': String(1024 * 1024 + 1) } });
      return new Response(content, { status: 200, headers: { 'content-type': 'application/javascript' } });
    };
    try {
      const commit = '0123456789abcdef0123456789abcdef01234567';
      const meta = {
        require: [
          'https://deps.invalid/pkg@1.2.3/index.js',
          `https://deps.invalid/${commit}/verified.js#sha256=${expected}`,
          'https://deps.invalid/mismatch.js#sha256=not-the-hash',
          'https://deps.invalid/redirect.js',
          'https://deps.invalid/missing.js',
          'https://deps.invalid/large.js',
        ],
        resource: 'styles https://deps.invalid/resource.css',
      };
      const results = await verifyDependencies(meta, []);
      const changed = await verifyDependency(dependencySpec('https://deps.invalid/pkg@1.2.3/index.js', 'require'), { contentHash: 'sha256-old' });
      try { await idbStoreClear('scans'); } catch (err) {}
      localStorage.removeItem('sh_scan_cache');
      const parentItem = {
        id: 'dependency-parent',
        source: 'greasyfork',
        name: 'Dependency parent',
        version: '1.0.0',
        installUrl: 'https://deps.invalid/parent.user.js',
      };
      await saveCachedScan(parentItem, {
        status: 'verified',
        score: 100,
        findings: [],
        meta,
        codeSize: 100,
        codeHash: '12345678',
        sourceUrl: parentItem.installUrl,
        fetchedAt: Date.now(),
        httpStatus: 200,
        contentType: 'application/javascript',
        dependencies: results,
        dependenciesCheckedAt: Date.now(),
      });
      const cached = await getCachedScan({ ...parentItem });
      return {
        results,
        maxActive,
        cachedDependencyCount: cached.dependencies.length,
        cachedCheckedAt: cached.dependenciesCheckedAt,
        changed,
      };
    } finally {
      window.fetch = originalFetch;
    }
  });

  expect(outcomes.maxActive).toBeLessThanOrEqual(3);
  expect(outcomes.results).toHaveLength(7);
  expect(outcomes.results.find((dep) => dep.url.includes('pkg@1.2.3'))).toMatchObject({
    pinned: true,
    declaredIntegrity: false,
    status: 'fetched',
  });
  expect(outcomes.results.find((dep) => dep.url.includes('/0123456789abcdef'))).toMatchObject({
    pinned: true,
    declaredIntegrity: true,
    status: 'verified',
  });
  expect(outcomes.results.find((dep) => dep.url.includes('/mismatch'))).toMatchObject({
    status: 'mismatch',
    failureReason: 'declared integrity does not match fetched content',
  });
  expect(outcomes.results.find((dep) => dep.url.includes('/redirect'))?.failureReason).toContain('redirect rejected');
  expect(outcomes.results.find((dep) => dep.url.includes('/missing'))?.failureReason).toContain('HTTP 404');
  expect(outcomes.results.find((dep) => dep.url.includes('/large'))?.failureReason).toContain('1 MB limit');
  expect(outcomes.results.find((dep) => dep.type === 'resource')).toMatchObject({
    host: 'deps.invalid',
    status: 'fetched',
  });
  expect(outcomes.cachedDependencyCount).toBe(7);
  expect(outcomes.cachedCheckedAt).toBeGreaterThan(0);
  expect(outcomes.changed.changed).toBe(true);
});

test('source fetchers surface invalid JSON, rate limits, and proxy wrapper failures', async ({ page }) => {
  await page.goto('/');

  const failures = await page.evaluate(async (data) => {
    const originalFetch = window.fetch;
    const makeResponse = (body, options = {}) => new Response(body, {
      status: options.status || 200,
      headers: options.headers || {},
    });
    const capture = async (fn) => {
      try {
        return { ok: true, value: await fn() };
      } catch (err) {
        return { ok: false, message: err && err.message ? err.message : String(err) };
      }
    };
    const resetState = () => {
      _cache.clear();
      _ghCooldown = 0;
      _proxyHealth.lastUsed = '';
      _proxyHealth.failures = {};
      _proxyHealth.lastUsedBySource = {};
      _proxyHealth.errorsBySource = {};
    };

    try {
      resetState();
      const resetAt = String(Math.floor(Date.now() / 1000) + 60);
      window.fetch = async (url) => {
        const target = String(url);
        if (target.includes('api.greasyfork.org')) return makeResponse('{not-json');
        if (target.includes('api.github.com/search/repositories')) {
          return makeResponse(JSON.stringify({ message: 'rate limited' }), {
            status: 429,
            headers: {
              'x-ratelimit-limit': '10',
              'x-ratelimit-remaining': '0',
              'x-ratelimit-reset': resetAt,
              'x-ratelimit-resource': 'search',
            },
          });
        }
        if (target.includes('scriptcat.org/api')) return makeResponse(JSON.stringify({ code: 500, msg: 'drifted shape' }));
        throw new Error('unexpected fetch ' + target);
      };
      const apiFailures = {
        greasyfork: await capture(() => srcGF('bad-json', 1, 'greasyfork.org')),
        github: await capture(() => srcGH('rate-limit', 1)),
        scriptcat: await capture(() => srcSC('bad-shape', 1)),
      };

      resetState();
      window.fetch = async (url) => {
        const target = String(url);
        if (target.includes('api.allorigins.win')) return makeResponse(JSON.stringify({ status: 'ok' }));
        if (target.includes('api.codetabs.com')) return makeResponse(data.openUserJsHtml);
        if (target.includes('everyorigin')) throw new Error('everyorigin should not be reached after codetabs success');
        throw new Error('unexpected proxy fetch ' + target);
      };
      const proxyFallback = await capture(() => srcOUJS('proxy-fallback', 1));
      const proxyFallbackHealth = {
        lastUsed: _proxyHealth.lastUsedBySource.openuserjs,
        alloriginsFailures: _proxyHealth.failures.allorigins || 0,
        count: proxyFallback.ok ? proxyFallback.value.length : 0,
      };

      resetState();
      window.fetch = async (url) => {
        const target = String(url);
        if (target.includes('api.allorigins.win')) return makeResponse(JSON.stringify({ status: 'missing contents' }));
        if (target.includes('api.codetabs.com')) return makeResponse('bad gateway', { status: 502 });
        if (target.includes('everyorigin')) return makeResponse(JSON.stringify({ contents: 42 }));
        throw new Error('unexpected proxy fetch ' + target);
      };
      const proxyFailure = await capture(() => srcGists('proxy-failure', 1));
      const proxyFailureHealth = {
        errors: (_proxyHealth.errorsBySource.gists || []).slice(),
        alloriginsFailures: _proxyHealth.failures.allorigins || 0,
        codetabsFailures: _proxyHealth.failures.codetabs || 0,
        everyoriginFailures: _proxyHealth.failures.everyorigin || 0,
      };

      return { apiFailures, proxyFallback, proxyFallbackHealth, proxyFailure, proxyFailureHealth };
    } finally {
      window.fetch = originalFetch;
    }
  }, fixtures);

  expect(failures.apiFailures.greasyfork).toMatchObject({ ok: false, message: 'greasyfork.org invalid JSON' });
  expect(failures.apiFailures.github.ok).toBe(false);
  expect(failures.apiFailures.github.message).toContain('Rate limited');
  expect(failures.apiFailures.scriptcat).toMatchObject({ ok: false, message: 'ScriptCat: drifted shape' });

  expect(failures.proxyFallback).toMatchObject({ ok: true });
  expect(failures.proxyFallbackHealth).toMatchObject({ lastUsed: 'codetabs', alloriginsFailures: 1, count: 1 });

  expect(failures.proxyFailure.ok).toBe(false);
  expect(failures.proxyFailure.message).toContain('all proxies failed');
  expect(failures.proxyFailure.message).toContain('allorigins: invalid proxy response shape');
  expect(failures.proxyFailure.message).toContain('codetabs: HTTP 502');
  expect(failures.proxyFailure.message).toContain('everyorigin: invalid proxy response shape');
  expect(failures.proxyFailureHealth.errors).toEqual([
    'allorigins: invalid proxy response shape',
    'codetabs: HTTP 502',
    'everyorigin: invalid proxy response shape',
  ]);
  expect(failures.proxyFailureHealth).toMatchObject({ alloriginsFailures: 1, codetabsFailures: 1, everyoriginFailures: 1 });
});
