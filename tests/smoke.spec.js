const { test, expect } = require('@playwright/test');

const SOURCE_PREFS = {
  greasyfork: true,
  sleazyfork: false,
  github: false,
  openuserjs: false,
  uszone: false,
  scriptcat: false,
  gists: false,
};

const GREASY_FORK_RESULTS = [
  {
    id: 101,
    name: 'YouTube Enhancer',
    description: 'Adds player controls and quality-of-life options.',
    users: [{ name: 'tester' }],
    url: 'https://greasyfork.org/en/scripts/101-youtube-enhancer',
    code_url: 'https://greasyfork.org/scripts/101-youtube-enhancer/code/YouTube%20Enhancer.user.js',
    version: '1.0.0',
    daily_installs: 12,
    total_installs: 1200,
    good_ratings: 42,
    bad_ratings: 1,
    created_at: '2025-01-01T00:00:00Z',
    code_updated_at: '2026-01-01T00:00:00Z',
    license: 'Apache-2.0',
  },
  {
    id: 102,
    name: 'Dark Mode Helper',
    description: 'Applies dark mode tweaks to common websites.',
    users: [{ name: 'tester' }],
    url: 'https://greasyfork.org/en/scripts/102-dark-mode-helper',
    code_url: 'https://greasyfork.org/scripts/102-dark-mode-helper/code/Dark%20Mode%20Helper.user.js',
    version: '1.1.0',
    daily_installs: 7,
    total_installs: 850,
    good_ratings: 25,
    bad_ratings: 0,
    created_at: '2025-02-01T00:00:00Z',
    code_updated_at: '2026-02-01T00:00:00Z',
    license: 'MIT',
  },
  {
    id: 103,
    name: 'Metadata Unavailable Script',
    description: 'Represents a source result without fetchable metadata.',
    users: [{ name: 'tester' }],
    url: 'https://greasyfork.org/en/scripts/103-metadata-unavailable-script',
    code_url: '',
    version: '1.0.0',
    daily_installs: 1,
    total_installs: 100,
    good_ratings: 5,
    bad_ratings: 0,
    created_at: '2025-03-01T00:00:00Z',
    code_updated_at: '2026-03-01T00:00:00Z',
    license: 'MIT',
  },
];

const MATCHING_USER_SCRIPT = `// ==UserScript==
// @name YouTube Enhancer
// @grant GM_xmlhttpRequest
// ==/UserScript==
console.log('match');
`;

const NONMATCHING_USER_SCRIPT = `// ==UserScript==
// @name Dark Mode Helper
// @grant GM_setValue
// ==/UserScript==
console.log('no match');
`;

const SCRIPT_CAT_USER_SCRIPT = `// ==UserScript==
// @name ScriptCat Helper
// @grant GM_setValue
// ==/UserScript==
console.log('scriptcat');
`;

const GIST_SEARCH_HTML = `
<div class="gist-snippet">
  <a href="/tester/abc123">Gist Helper</a>
  <a href="/tester/abc123/raw/file.user.js">file.user.js</a>
  <span class="author">tester</span>
  <div class="f6">A gist-hosted userscript.</div>
</div>`;

const GIST_USER_SCRIPT = `// ==UserScript==
// @name Gist Helper
// @grant GM_xmlhttpRequest
// ==/UserScript==
console.log('gist');
`;

test.beforeEach(async ({ page }) => {
  await page.addInitScript((sourcePrefs) => {
    if (!localStorage.getItem('sh_pref_sources')) {
      localStorage.setItem('sh_pref_sources', JSON.stringify(sourcePrefs));
    }
  }, SOURCE_PREFS);

  await page.route('https://api.greasyfork.org/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(GREASY_FORK_RESULTS),
    });
  });
  await page.route(/https:\/\/greasyfork\.org\/scripts\/101-.*/, async (route) => {
    await route.fulfill({ contentType: 'text/javascript', body: MATCHING_USER_SCRIPT });
  });
  await page.route(/https:\/\/greasyfork\.org\/scripts\/102-.*/, async (route) => {
    await route.fulfill({ contentType: 'text/javascript', body: NONMATCHING_USER_SCRIPT });
  });
});

async function runSearch(page, query = 'youtube') {
  await page.fill('#searchInput', query);
  await page.press('#searchInput', 'Enter');
  await expect(page.locator('.result-card').first()).toBeVisible({ timeout: 5000 });
}

async function waitForOfflineCache(page, query = 'youtube') {
  await page.waitForFunction(async (rawQuery) => {
    function request(req) {
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    try {
      const db = await new Promise((resolve, reject) => {
        const open = indexedDB.open('scripthunt-offline-v1', 1);
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error);
      });
      const rows = await request(db.transaction('searches', 'readonly').objectStore('searches').getAll());
      if (rows.some((entry) => entry.rawQuery === rawQuery && entry.results?.length)) return true;
    } catch (err) {
      const rows = JSON.parse(localStorage.getItem('sh_offline_searches') || '[]');
      return rows.some((entry) => entry.rawQuery === rawQuery && entry.results?.length);
    }
    return false;
  }, query);
}

test('page loads with search input and source toggles', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#searchInput')).toBeVisible();
  expect(await page.locator('.source-toggle').count()).toBeGreaterThanOrEqual(6);
  await expect(page.locator('.version')).toContainText('v0.');
});

test('search returns results from at least one source', async ({ page }) => {
  await page.goto('/');
  await runSearch(page);
  const count = await page.locator('.result-card').count();
  expect(count).toBeGreaterThan(0);
});

test('source toggles are keyboard accessible', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('.source-toggle').first();
  await expect(toggle).toHaveAttribute('role', 'checkbox');
  await expect(toggle).toHaveAttribute('tabindex', '0');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
});

test('theme toggle cycles through modes', async ({ page }) => {
  await page.goto('/');
  const btn = page.locator('#themeToggle');
  await expect(btn).toContainText('Auto');
  await btn.click();
  await expect(btn).toContainText('Dark');
  await btn.click();
  await expect(btn).toContainText('Light');
  await expect(page.locator('html')).toHaveClass(/theme-light/);
  await btn.click();
  await expect(btn).toContainText('OLED');
  await expect(page.locator('html')).toHaveClass(/theme-oled/);
});

test('favorites: add, verify badge, remove with undo', async ({ page }) => {
  await page.goto('/');
  await runSearch(page);
  const favBtn = page.locator('.result-card').first().locator('[data-action="fav"]');
  await favBtn.click();
  await expect(favBtn).toHaveClass(/fav-active/);
  await expect(page.locator('.toast')).toBeVisible();
  await favBtn.click();
  await expect(favBtn).not.toHaveClass(/fav-active/);
  const undo = page.locator('.toast button:text("Undo")');
  if (await undo.isVisible()) {
    await undo.click();
    await expect(favBtn).toHaveClass(/fav-active/);
  }
});

test('favorites view shows saved scripts', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sh_favs', JSON.stringify([
      { id: 'test-1', name: 'Test Script', url: 'https://example.com', source: 'greasyfork', author: 'tester' }
    ]));
  });
  await page.reload();
  await page.click('#btnFavorites');
  await expect(page.locator('.result-card')).toHaveCount(1);
  await expect(page.locator('.card-title')).toContainText('Test Script');
});

test('result icon buttons have accessible names', async ({ page }) => {
  await page.goto('/');
  await runSearch(page);
  const card = page.locator('.result-card').first();
  await expect(card.getByRole('button', { name: /Security scan for YouTube Enhancer/ })).toBeVisible();
  await expect(card.getByRole('button', { name: /Metadata for YouTube Enhancer/ })).toBeVisible();
  await expect(card.getByRole('button', { name: /Add favorite YouTube Enhancer/ })).toBeVisible();
  await expect(card.getByRole('button', { name: /Compare YouTube Enhancer/ })).toBeVisible();
});

test('comparison modal opens with 2+ selected scripts', async ({ page }) => {
  await page.goto('/');
  await runSearch(page, 'dark mode');
  const cards = page.locator('.result-card');
  if (await cards.count() >= 2) {
    await cards.nth(0).locator('[data-action="compare"]').click();
    await cards.nth(1).locator('[data-action="compare"]').click();
    await expect(page.locator('.compare-bar')).toHaveClass(/visible/);
    await page.click('.compare-go');
    await expect(page.locator('.modal-overlay')).toHaveClass(/visible/);
    await expect(page.getByRole('button', { name: 'Close comparison' })).toBeFocused();
    await expect(page.locator('.compare-col')).toHaveCount(2);
    await page.click('.modal-close');
    await expect(page.locator('.modal-overlay')).not.toHaveClass(/visible/);
    await expect(page.locator('.compare-go')).toBeFocused();
  }
});

test('empty state shows when no results', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.state-empty')).toBeVisible();
  await expect(page.locator('.state-empty h3')).toContainText('Search userscripts');
});

test('sort select persists preference', async ({ page }) => {
  await page.goto('/');
  await runSearch(page);
  await page.selectOption('#sortSelect', 'installs');
  await page.reload();
  await expect(page.locator('#sortSelect')).toHaveValue('installs');
});

test('visible filters narrow results by license and installs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('License filter')).toBeVisible();
  await expect(page.getByLabel('Minimum installs filter')).toBeVisible();
  await expect(page.getByLabel('Updated date filter')).toBeVisible();
  await page.fill('#licenseFilter', 'Apache');
  await page.fill('#minInstallsFilter', '1000');
  await runSearch(page, 'youtube');

  await expect(page.locator('.result-card')).toHaveCount(1);
  await expect(page.locator('.card-title')).toContainText('YouTube Enhancer');
});

test('visible grant filter uses metadata without query operators', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Grant filter')).toBeVisible();
  await page.fill('#grantFilterInput', 'GM_xmlhttpRequest');
  await runSearch(page, 'youtube');

  await expect(page.locator('.result-card')).toHaveCount(2);
  await expect(page.locator('.card-title')).toContainText(['YouTube Enhancer', 'Metadata Unavailable Script']);
  await expect(page.locator('.card-title', { hasText: 'Dark Mode Helper' })).toHaveCount(0);
});

test('visible risk filter keeps matching and unverified results', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Risk filter')).toBeVisible();
  await page.selectOption('#riskFilter', 'danger');
  await runSearch(page, 'youtube');

  await expect(page.locator('.result-card')).toHaveCount(2);
  await expect(page.locator('.card-title')).toContainText(['YouTube Enhancer', 'Metadata Unavailable Script']);
  await expect(page.locator('.card-title', { hasText: 'Dark Mode Helper' })).toHaveCount(0);
  await expect(page.locator('.card-source-badge', { hasText: 'Risk unverified' })).toBeVisible();
});

test('URL restores complete search state', async ({ page }) => {
  await page.goto('/?q=youtube&sources=greasyfork&site=youtube.com&sort=installs&license=Apache&min_installs=1000&updated=365&grant=GM_xmlhttpRequest&risk=danger');

  await expect(page.locator('#searchInput')).toHaveValue('youtube');
  await expect(page.getByLabel('Greasy Fork source')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel('GitHub source')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('#siteFilter')).toHaveValue('youtube.com');
  await expect(page.locator('#sortSelect')).toHaveValue('installs');
  await expect(page.locator('#licenseFilter')).toHaveValue('Apache');
  await expect(page.locator('#minInstallsFilter')).toHaveValue('1000');
  await expect(page.locator('#updatedFilter')).toHaveValue('365');
  await expect(page.locator('#grantFilterInput')).toHaveValue('GM_xmlhttpRequest');
  await expect(page.locator('#riskFilter')).toHaveValue('danger');
  await expect(page.locator('.result-card')).toHaveCount(1);
  await expect(page.locator('.card-title')).toContainText('YouTube Enhancer');
});

test('search controls write complete state to URL', async ({ page }) => {
  await page.goto('/');
  await page.fill('#siteFilter', 'youtube.com');
  await page.fill('#licenseFilter', 'Apache');
  await page.fill('#minInstallsFilter', '1000');
  await page.selectOption('#updatedFilter', '365');
  await page.fill('#grantFilterInput', 'GM_xmlhttpRequest');
  await page.selectOption('#riskFilter', 'danger');
  await runSearch(page, 'youtube');
  await page.selectOption('#sortSelect', 'installs');

  const params = new URL(page.url()).searchParams;
  expect(params.get('q')).toBe('youtube');
  expect(params.get('sources')).toBe('greasyfork');
  expect(params.get('site')).toBe('youtube.com');
  expect(params.get('sort')).toBe('installs');
  expect(params.get('license')).toBe('Apache');
  expect(params.get('min_installs')).toBe('1000');
  expect(params.get('updated')).toBe('365');
  expect(params.get('grant')).toBe('GM_xmlhttpRequest');
  expect(params.get('risk')).toBe('danger');
});

test('grant query filters by metadata and labels unknown metadata', async ({ page }) => {
  await page.goto('/');
  await runSearch(page, 'grant:GM_xmlhttpRequest youtube');

  await expect(page.locator('.result-card')).toHaveCount(2);
  await expect(page.locator('.card-title')).toContainText(['YouTube Enhancer', 'Metadata Unavailable Script']);
  await expect(page.locator('.card-title', { hasText: 'Dark Mode Helper' })).toHaveCount(0);
  await expect(page.locator('.card-source-badge', { hasText: 'Grant match' })).toBeVisible();
  await expect(page.locator('.card-source-badge', { hasText: 'Grant unverified' })).toBeVisible();
});

test('metadata scans are cached across repeated filter passes', async ({ page }) => {
  const counts = { matching: 0, nonmatching: 0 };
  await page.unroute(/https:\/\/greasyfork\.org\/scripts\/101-.*/);
  await page.unroute(/https:\/\/greasyfork\.org\/scripts\/102-.*/);
  await page.route(/https:\/\/greasyfork\.org\/scripts\/101-.*/, async (route) => {
    counts.matching++;
    await route.fulfill({ contentType: 'text/javascript', body: MATCHING_USER_SCRIPT });
  });
  await page.route(/https:\/\/greasyfork\.org\/scripts\/102-.*/, async (route) => {
    counts.nonmatching++;
    await route.fulfill({ contentType: 'text/javascript', body: NONMATCHING_USER_SCRIPT });
  });

  await page.goto('/');
  await page.fill('#grantFilterInput', 'GM_xmlhttpRequest');
  await runSearch(page, 'youtube');
  await expect(page.locator('.result-card')).toHaveCount(2);
  expect(counts).toEqual({ matching: 1, nonmatching: 1 });

  await page.reload();
  await page.fill('#grantFilterInput', 'GM_xmlhttpRequest');
  await runSearch(page, 'youtube');
  await expect(page.locator('.result-card')).toHaveCount(2);
  expect(counts).toEqual({ matching: 1, nonmatching: 1 });
});

test('ScriptCat raw install URLs expose scan and metadata panels', async ({ page }) => {
  await page.route('https://scriptcat.org/api/v2/scripts**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        data: {
          total: 1,
          list: [{
            id: 555,
            name: 'ScriptCat Helper',
            description: 'ScriptCat fixture result.',
            username: 'tester',
            script: { version: '1.0.0' },
            today_install: 2,
            total_install: 50,
            score: 4,
            createtime: 1735689600,
            updatetime: 1767225600,
          }],
        },
      }),
    });
  });
  await page.route('https://scriptcat.org/scripts/code/555/**', async (route) => {
    await route.fulfill({ contentType: 'text/javascript', body: SCRIPT_CAT_USER_SCRIPT });
  });

  await page.goto('/');
  await page.getByLabel('Greasy Fork source').click();
  await page.getByLabel('ScriptCat source').click();
  await runSearch(page, 'scriptcat');

  const card = page.locator('.result-card').filter({ hasText: 'ScriptCat Helper' });
  await card.locator('[data-action="scan"]').click();
  await expect(card.locator('.scan-results')).toContainText('No dangerous patterns detected');
  await card.locator('[data-action="meta"]').click();
  await expect(card.locator('.card-metadata')).toContainText('@grant');
});

test('GitHub repository results explain missing raw script scans', async ({ page }) => {
  await page.route('https://api.github.com/search/repositories**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        total_count: 1,
        items: [{
          id: 77,
          name: 'repo-userscript',
          full_name: 'tester/repo-userscript',
          description: 'Repository fixture without a raw userscript URL.',
          owner: { login: 'tester' },
          html_url: 'https://github.com/tester/repo-userscript',
          stargazers_count: 3,
          forks_count: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          license: { spdx_id: 'MIT' },
        }],
      }),
    });
  });

  await page.goto('/');
  await page.getByLabel('Greasy Fork source').click();
  await page.getByLabel('GitHub source').click();
  await runSearch(page, 'github');

  const card = page.locator('.result-card').filter({ hasText: 'repo-userscript' });
  await card.locator('[data-action="scan"]').click();
  await expect(card.locator('.scan-results')).toContainText('no raw .user.js URL is available');
});

test('Gist raw userscript URLs scan through the proxy chain', async ({ page }) => {
  await page.route('https://api.allorigins.win/**', async (route) => {
    const target = new URL(route.request().url()).searchParams.get('url') || '';
    const decoded = decodeURIComponent(target);
    const contents = decoded.includes('gist.githubusercontent.com') ? GIST_USER_SCRIPT : GIST_SEARCH_HTML;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ contents }) });
  });

  await page.goto('/');
  await page.getByLabel('Greasy Fork source').click();
  await page.getByLabel('GitHub Gists source').click();
  await runSearch(page, 'gist');

  const card = page.locator('.result-card').filter({ hasText: 'Gist Helper' });
  await card.locator('[data-action="scan"]').click();
  await expect(card.locator('.scan-results')).toContainText('Cross-origin requests');
  await card.locator('[data-action="meta"]').click();
  await expect(card.locator('.card-metadata')).toContainText('@grant');
});

test('proxy failures show per-proxy reasons and retry control', async ({ page }) => {
  await page.route('https://api.allorigins.win/**', async (route) => {
    await route.fulfill({ status: 502, body: 'allorigins down' });
  });
  await page.route('https://api.codetabs.com/**', async (route) => {
    await route.fulfill({ status: 502, body: 'codetabs down' });
  });
  await page.route('https://everyorigin.jwvbremen.nl/**', async (route) => {
    await route.fulfill({ status: 502, body: 'everyorigin down' });
  });

  await page.goto('/');
  await page.getByLabel('Greasy Fork source').click();
  await page.getByLabel('OpenUserJS source').click();
  await page.fill('#searchInput', 'dark');
  await page.press('#searchInput', 'Enter');

  const chip = page.locator('.source-chip.error').filter({ hasText: 'OpenUserJS' });
  await expect(chip).toContainText('allorigins: HTTP 502');
  await expect(chip).toContainText('codetabs: HTTP 502');
  await expect(chip).toContainText('everyorigin: HTTP 502');
  await expect(chip.getByRole('button', { name: 'Retry OpenUserJS' })).toBeVisible();
});

test('source health cooldown persists across reloads', async ({ page }) => {
  await page.route('https://api.allorigins.win/**', async (route) => {
    await route.fulfill({ status: 502, body: 'allorigins down' });
  });
  await page.route('https://api.codetabs.com/**', async (route) => {
    await route.fulfill({ status: 502, body: 'codetabs down' });
  });
  await page.route('https://everyorigin.jwvbremen.nl/**', async (route) => {
    await route.fulfill({ status: 502, body: 'everyorigin down' });
  });

  await page.goto('/');
  await page.getByLabel('Greasy Fork source').click();
  await page.getByLabel('OpenUserJS source').click();
  for (const query of ['dark-one', 'dark-two', 'dark-three']) {
    await page.fill('#searchInput', query);
    await page.press('#searchInput', 'Enter');
    await expect(page.locator('.source-chip.error').filter({ hasText: 'OpenUserJS' })).toBeVisible();
  }

  const storedHealth = await page.evaluate(() => JSON.parse(localStorage.getItem('sh_pref_sourceHealth')));
  expect(storedHealth.openuserjs.fails).toBeGreaterThanOrEqual(3);
  expect(storedHealth.openuserjs.until).toBeGreaterThan(Date.now());

  await page.reload();
  await page.fill('#searchInput', 'dark-four');
  await page.press('#searchInput', 'Enter');
  await expect(page.locator('.source-chip.suspended').filter({ hasText: 'OpenUserJS' })).toContainText('Paused');
});

test('diagnostics export includes health and excludes secrets', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sh_pref_ghtoken', JSON.stringify('ghp_secret_should_not_export'));
    localStorage.setItem('sh_pref_proxy', JSON.stringify('https://secret-proxy.example'));
  });
  await page.click('#btnDiagnostics');
  await expect(page.locator('#diagnosticsOutput')).toHaveValue(/ScriptHunt/);
  const payloadText = await page.locator('#diagnosticsOutput').inputValue();
  const payload = JSON.parse(payloadText);

  expect(payload.app).toBe('ScriptHunt');
  expect(payload.sources.length).toBeGreaterThan(0);
  expect(payload.proxyHealth).toBeTruthy();
  expect(payloadText).not.toContain('ghp_secret_should_not_export');
  expect(payloadText).not.toContain('secret-proxy.example');
  expect(payload.customProxyConfigured).toBe(false);
});

test('custom proxy settings validate, self-test, and stay redacted', async ({ page }) => {
  await page.goto('/');
  await page.click('#btnDiagnostics');
  await page.fill('#customProxyInput', 'http://proxy.example');
  await page.click('#btnSaveProxy');
  await expect(page.locator('#proxySettingsStatus')).toContainText('must use HTTPS');
  expect(await page.evaluate(() => localStorage.getItem('sh_pref_proxy'))).toBeNull();

  await page.evaluate(() => localStorage.setItem('sh_pref_proxy', JSON.stringify('https://proxy.example')));
  await page.route('https://proxy.example/**', async (route) => {
    const target = new URL(route.request().url()).searchParams.get('url') || '';
    const headers = { 'Access-Control-Allow-Origin': '*' };
    if (decodeURIComponent(target).includes('example.com')) {
      await route.fulfill({ status: 403, headers, body: 'Target domain not allowed' });
      return;
    }
    await route.fulfill({ contentType: 'application/json', headers, body: JSON.stringify({ contents: 'proxy ok' }) });
  });
  await page.reload();
  await page.click('#btnDiagnostics');
  await expect(page.locator('#customProxyInput')).toHaveValue('https://proxy.example');
  await page.click('#btnTestProxy');
  await expect(page.locator('#proxySettingsStatus')).toContainText('Proxy self-test passed');

  const payloadText = await page.locator('#diagnosticsOutput').inputValue();
  const payload = JSON.parse(payloadText);
  expect(payload.customProxyConfigured).toBe(true);
  expect(payloadText).not.toContain('proxy.example');

  await page.click('#btnRemoveProxy');
  await expect(page.locator('#proxySettingsStatus')).toContainText('Custom proxy removed');
  expect(await page.evaluate(() => localStorage.getItem('sh_pref_proxy'))).toBeNull();
});

test('offline cache restores recent successful search', async ({ page, context }) => {
  await page.goto('/');
  await runSearch(page, 'youtube');
  await waitForOfflineCache(page, 'youtube');

  await context.setOffline(true);
  await page.click('#clearBtn');
  await expect(page.locator('#offlineCachePanel')).toContainText('Offline recent searches');
  await page.fill('#searchInput', 'youtube');
  await page.press('#searchInput', 'Enter');

  await expect(page.locator('#offlineCachePanel')).toContainText('Offline cached results');
  await expect(page.locator('#statsText')).toContainText('offline cache');
  await expect(page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Waiting for connection' })).toBeDisabled();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('button', { name: 'Revalidate now' })).toBeVisible();
});

test('clear button resets search state', async ({ page }) => {
  await page.goto('/');
  await page.fill('#searchInput', 'test');
  await expect(page.locator('#clearBtn')).toBeVisible();
  await page.click('#clearBtn');
  await expect(page.locator('#searchInput')).toHaveValue('');
  await expect(page.locator('.state-empty')).toBeVisible();
});

test('URL parameter ?q= triggers search on load', async ({ page }) => {
  await page.goto('/?q=youtube');
  await expect(page.locator('#searchInput')).toHaveValue('youtube');
  await expect(page.locator('.result-card').first()).toBeVisible({ timeout: 5000 });
});

test('escape key closes modal', async ({ page }) => {
  await page.goto('/');
  await runSearch(page, 'dark');
  const cards = page.locator('.result-card');
  if (await cards.count() >= 2) {
    await cards.nth(0).locator('[data-action="compare"]').click();
    await cards.nth(1).locator('[data-action="compare"]').click();
    await page.click('.compare-go');
    await expect(page.locator('.modal-overlay')).toHaveClass(/visible/);
    await expect(page.getByRole('button', { name: 'Close comparison' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Close comparison' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal-overlay')).not.toHaveClass(/visible/);
    await expect(page.locator('.compare-go')).toBeFocused();
  }
});
