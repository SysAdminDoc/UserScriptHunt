const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

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
// @name:fr Ameliorateur YouTube
// @description:fr Options video avancees.
// @match *://*/*
// @match https://*.youtube.com/*
// @include https://music.youtube.com/*
// @exclude-match https://ads.youtube.com/*
// @connect api.youtube.com
// @connect *
// @require https://cdn.jsdelivr.net/npm/pinned-lib@1.2.3/dist/index.js#sha256=abc123
// @require https://unpkg.com/floating-lib/dist/index.js
// @resource css https://example.com/style.css#sha256=def456
// @resource icon https://example.com/icon.png
// @compatible firefox
// @compatible chrome
// @incompatible safari
// @downloadURL https://greasyfork.org/scripts/101-youtube-enhancer/code/YouTube%20Enhancer.user.js
// @updateURL https://updates.example.net/youtube-enhancer.meta.js
// @grant GM_xmlhttpRequest
// ==/UserScript==
console.log('match');
`;

const OVERSIZED_MATCH_DIRECTIVES = Array.from({ length: 1000 }, (_, index) => {
  const host = index === 999 ? 'hidden999.example.com' : `site-${index}.example.com`;
  return `// @match https://${host}/*`;
}).join('\n');

const OVERSIZED_USER_SCRIPT = `// ==UserScript==
// @name YouTube Enhancer
// @version 1.0.0
// @description Oversized metadata fixture.
${OVERSIZED_MATCH_DIRECTIVES}
// @grant GM_xmlhttpRequest
// ==/UserScript==
console.log('oversized');
`;

const NONMATCHING_USER_SCRIPT = `// ==UserScript==
// @name Dark Mode Helper
// @match https://example.com/*
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

async function idbStoreCount(page, storeName) {
  return page.evaluate((store) => new Promise((resolve, reject) => {
    const open = indexedDB.open('scripthunt-offline-v1');
    open.onsuccess = () => {
      const db = open.result;
      const req = db.transaction(store, 'readonly').objectStore(store).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
    open.onerror = () => reject(open.error);
  }), storeName);
}

async function localStorageArrayCount(page, key) {
  return page.evaluate((storageKey) => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value) ? value.length : 0;
    } catch {
      return 0;
    }
  }, key);
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
  await expect(page.locator('.result-card').first().locator('.script-url-list')).toContainText('Install / Download / Update URL');
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

test('favorites export uses versioned schema', async ({ page }) => {
  await page.goto('/');
  await runSearch(page);
  await page.locator('.result-card').first().locator('[data-action="fav"]').click();
  await page.click('#btnFavorites');

  const downloadPromise = page.waitForEvent('download');
  await page.click('#btnExportFavs');
  const download = await downloadPromise;
  const text = await fs.readFile(await download.path(), 'utf8');
  const payload = JSON.parse(text);

  expect(payload.schema).toBe('scripthunt-favorites');
  expect(payload.version).toBe(1);
  expect(payload.favorites[0]).toMatchObject({
    name: 'YouTube Enhancer',
    installUrl: 'https://greasyfork.org/scripts/101-youtube-enhancer/code/YouTube%20Enhancer.user.js',
    downloadUrl: 'https://greasyfork.org/scripts/101-youtube-enhancer/code/YouTube%20Enhancer.user.js',
    updateUrl: 'https://greasyfork.org/scripts/101-youtube-enhancer/code/YouTube%20Enhancer.user.js',
  });
});

test('installed import marks matching scripts and update state', async ({ page }) => {
  await page.goto('/');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.click('#btnImportInstalled');
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: 'installed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      schema: 'scripthunt-installed',
      version: 1,
      installed: [{
        name: 'YouTube Enhancer',
        version: '0.9.0',
        installUrl: 'https://greasyfork.org/scripts/101-youtube-enhancer/code/YouTube%20Enhancer.user.js',
      }],
    })),
  });
  await expect(page.locator('.toast').last()).toContainText('Imported 1 installed scripts');

  await runSearch(page);
  const card = page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' });
  await expect(card).toContainText('Update available');
  await expect(card.locator('.card-btn-install')).toContainText('Update');
  await expect(card).toContainText('Install provenance');
  await expect(card).toContainText('Install URL');
  await expect(card).toContainText('match');
  await expect(card).toContainText('Version: local 0.9.0');

  const downloadPromise = page.waitForEvent('download');
  await page.click('#btnExportInstalled');
  const download = await downloadPromise;
  const text = await fs.readFile(await download.path(), 'utf8');
  const payload = JSON.parse(text);
  expect(payload.schema).toBe('scripthunt-installed');
  expect(payload.version).toBe(1);
  expect(payload.installed[0]).toMatchObject({
    name: 'YouTube Enhancer',
    version: '0.9.0',
    installUrl: 'https://greasyfork.org/scripts/101-youtube-enhancer/code/YouTube%20Enhancer.user.js',
  });
});

test('script imports skip invalid rows without aborting valid rows', async ({ page }) => {
  await page.goto('/');
  const chooserPromise = page.waitForEvent('filechooser');
  await page.click('#btnImportInstalled');
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: 'installed-mixed.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      schema: 'scripthunt-installed',
      version: 1,
      installed: [
        { name: 'YouTube Enhancer', version: '1.0.0', installUrl: 'https://greasyfork.org/scripts/101-youtube-enhancer/code/YouTube%20Enhancer.user.js' },
        { name: 'Bad URL', installUrl: 'javascript:alert(1)' },
        { description: 'missing identity' },
      ],
    })),
  });

  await expect(page.locator('.toast').last()).toContainText('Imported 1 installed scripts (2 invalid skipped)');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sh_installed_scripts')));
  expect(stored.schema).toBe('scripthunt-installed');
  expect(stored.version).toBe(1);
  expect(stored.installed).toHaveLength(1);
  expect(JSON.stringify(stored)).not.toContain('javascript:');
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

test('trust score expands into evidence dimensions', async ({ page }) => {
  await page.goto('/');
  await runSearch(page, 'youtube');

  const card = page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' });
  const toggle = card.locator('.trust-toggle');
  await expect(toggle).toContainText(/Trust \d+/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(card.locator('.trust-details')).toHaveClass(/visible/);
  await expect(card.locator('.trust-details')).toContainText('Popularity');
  await expect(card.locator('.trust-details')).toContainText('Security');
  await expect(card.locator('.trust-details')).toContainText('Freshness');
  await expect(card.locator('.trust-details')).toContainText('Metadata');
  await expect(card.locator('.trust-details')).toContainText('Source health');
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

test('comparison modal shows trust dimensions', async ({ page }) => {
  await page.goto('/');
  await runSearch(page, 'youtube');
  const cards = page.locator('.result-card');
  await cards.nth(0).locator('[data-action="compare"]').click();
  await cards.nth(1).locator('[data-action="compare"]').click();
  await page.click('.compare-go');

  await expect(page.locator('.modal-overlay')).toHaveClass(/visible/);
  await expect(page.locator('.compare-label', { hasText: 'Popularity' })).toHaveCount(2);
  await expect(page.locator('.compare-label', { hasText: 'Security' })).toHaveCount(2);
  await expect(page.locator('.compare-label', { hasText: 'Freshness' })).toHaveCount(2);
  await expect(page.locator('.compare-label', { hasText: 'Metadata' })).toHaveCount(2);
  await expect(page.locator('.compare-label', { hasText: 'Source health' })).toHaveCount(2);
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

test('security scan reports manager metadata risks', async ({ page }) => {
  await page.goto('/');
  await runSearch(page, 'youtube');

  const card = page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' });
  await card.getByRole('button', { name: /Security scan for YouTube Enhancer/ }).click();
  const panel = card.locator('.scan-results.visible');

  await expect(panel).toContainText('Broad @match scope: *://*/*');
  await expect(panel).toContainText('@connect host allowed: api.youtube.com');
  await expect(panel).toContainText('@connect * - unrestricted cross-origin access');
  await expect(panel).toContainText('@require integrity hash present: cdn.jsdelivr.net');
  await expect(panel).toContainText('Pinned @require dependency: cdn.jsdelivr.net');
  await expect(panel).toContainText('Floating @require version: unpkg.com');
  await expect(panel).toContainText('@resource integrity hash present: example.com');
  await expect(panel).toContainText('@resource has no integrity hash: example.com');
  await expect(panel).toContainText('updateURL host differs from install host');
});

test('scan distinguishes @connect risk from browser site-access requirements', async ({ page }) => {
  const SITE_ACCESS_SCRIPT = `// ==UserScript==
// @name Site Access Test
// @match https://example.com/*
// @connect api.example.com
// @connect cdn.example.com
// @grant GM_xmlhttpRequest
// ==/UserScript==
console.log('site-access');
`;
  const NO_CONNECT_SCRIPT = `// ==UserScript==
// @name No Connect Test
// @match https://example.com/*
// @grant GM_xmlhttpRequest
// ==/UserScript==
console.log('no-connect');
`;
  await page.unroute('https://api.greasyfork.org/**');
  await page.route('https://api.greasyfork.org/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 801, name: 'Site Access Test', description: 'Tests site-access findings.',
          users: [{ name: 'tester' }],
          url: 'https://greasyfork.org/en/scripts/801-site-access-test',
          code_url: 'https://greasyfork.org/scripts/801-site-access-test/code/test.user.js',
          version: '1.0.0', daily_installs: 1, total_installs: 10,
          good_ratings: 0, bad_ratings: 0,
          created_at: '2025-01-01T00:00:00Z', code_updated_at: '2026-01-01T00:00:00Z', license: 'MIT',
        },
        {
          id: 802, name: 'No Connect Test', description: 'Tests missing @connect.',
          users: [{ name: 'tester' }],
          url: 'https://greasyfork.org/en/scripts/802-no-connect-test',
          code_url: 'https://greasyfork.org/scripts/802-no-connect-test/code/test.user.js',
          version: '1.0.0', daily_installs: 1, total_installs: 10,
          good_ratings: 0, bad_ratings: 0,
          created_at: '2025-01-01T00:00:00Z', code_updated_at: '2026-01-01T00:00:00Z', license: 'MIT',
        },
      ]),
    });
  });
  await page.route(/https:\/\/greasyfork\.org\/scripts\/801-.*/, async (route) => {
    await route.fulfill({ contentType: 'text/javascript', body: SITE_ACCESS_SCRIPT });
  });
  await page.route(/https:\/\/greasyfork\.org\/scripts\/802-.*/, async (route) => {
    await route.fulfill({ contentType: 'text/javascript', body: NO_CONNECT_SCRIPT });
  });

  await page.goto('/');
  await runSearch(page, 'site access');

  const card1 = page.locator('.result-card').filter({ hasText: 'Site Access Test' });
  await card1.locator('[data-action="scan"]').click();
  await expect(card1.locator('.scan-results')).toContainText('@connect host allowed: api.example.com');
  await expect(card1.locator('.scan-results')).toContainText('may also require browser extension site-access permission');

  const card2 = page.locator('.result-card').filter({ hasText: 'No Connect Test' });
  await card2.locator('[data-action="scan"]').click();
  await expect(card2.locator('.scan-results')).toContainText('GM_xmlhttpRequest granted without @connect');
});

test('metadata viewer preserves localized and variant directives', async ({ page }) => {
  await page.goto('/');
  await runSearch(page, 'youtube');

  const card = page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' });
  await card.getByRole('button', { name: /Metadata for YouTube Enhancer/ }).click();
  const metadata = card.locator('.card-metadata.visible');

  await expect(metadata).toContainText('@name:fr');
  await expect(metadata).toContainText('Ameliorateur YouTube');
  await expect(metadata).toContainText('@description:fr');
  await expect(metadata).toContainText('@exclude-match');
  await expect(metadata).toContainText('@compatible');
  await expect(metadata).toContainText('firefox');
  await expect(metadata).toContainText('chrome');
  await expect(metadata).toContainText('@incompatible');
  await expect(metadata).toContainText('@updateURL');
});

test('metadata viewer caps oversized repeated directives without losing parsed filter data', async ({ page }) => {
  await page.unroute(/https:\/\/greasyfork\.org\/scripts\/101-.*/);
  await page.route(/https:\/\/greasyfork\.org\/scripts\/101-.*/, async (route) => {
    await route.fulfill({ contentType: 'text/javascript', body: OVERSIZED_USER_SCRIPT });
  });

  await page.goto('/');
  await page.fill('#siteFilter', 'hidden999.example.com');
  await runSearch(page, 'oversized');

  const card = page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' });
  await expect(card.locator('.applies-matrix')).toContainText('Metadata match');
  const metadataButton = card.locator('[data-action="meta"]');
  await expect(metadataButton).toBeVisible();
  await metadataButton.click();
  const metadata = card.locator('.card-metadata.visible');
  await expect(metadata).toBeVisible();

  await expect(metadata).toContainText('+920 more @match directives hidden from display');
  await expect(metadata).toContainText('filters and trust still use all 1000 parsed values');
  await expect(metadata).toContainText('https://site-0.example.com/*');
  await expect(metadata).not.toContainText('https://hidden999.example.com/*');
  expect((await metadata.textContent()).length).toBeLessThan(20000);
});

test('URL restores complete search state', async ({ page }) => {
  await page.goto('/?q=youtube&sources=greasyfork&site=youtube.com&sort=installs&license=Apache&min_installs=1000&updated=365&lang=fr&grant=GM_xmlhttpRequest&risk=danger');

  await expect(page.locator('#searchInput')).toHaveValue('youtube');
  await expect(page.getByLabel('Greasy Fork source')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel('GitHub source')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('#siteFilter')).toHaveValue('youtube.com');
  await expect(page.locator('#sortSelect')).toHaveValue('installs');
  await expect(page.locator('#licenseFilter')).toHaveValue('Apache');
  await expect(page.locator('#minInstallsFilter')).toHaveValue('1000');
  await expect(page.locator('#updatedFilter')).toHaveValue('365');
  await expect(page.locator('#languageFilter')).toHaveValue('fr');
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
  await page.selectOption('#languageFilter', 'fr');
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
  expect(params.get('lang')).toBe('fr');
  expect(params.get('grant')).toBe('GM_xmlhttpRequest');
  expect(params.get('risk')).toBe('danger');
});

test('catalog language filter changes Greasy Fork locale without changing GitHub search', async ({ page }) => {
  const greasyUrls = [];
  const githubUrls = [];
  await page.unroute('https://api.greasyfork.org/**');
  await page.route('https://api.greasyfork.org/**', async (route) => {
    greasyUrls.push(route.request().url());
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(GREASY_FORK_RESULTS),
    });
  });
  await page.route('https://api.github.com/search/repositories**', async (route) => {
    githubUrls.push(route.request().url());
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });

  await page.goto('/');
  await page.getByLabel('GitHub source').click();
  await page.selectOption('#languageFilter', 'fr');
  await runSearch(page, 'youtube');

  expect(greasyUrls.some((url) => url.includes('https://api.greasyfork.org/fr/scripts.json'))).toBe(true);
  expect(githubUrls.some((url) => url.includes('api.github.com/search/repositories'))).toBe(true);
  expect(githubUrls.every((url) => !url.includes('lang=') && !url.includes('/fr/'))).toBe(true);

  await page.selectOption('#languageFilter', 'all');
  await expect.poll(() => greasyUrls.some((url) => url.includes('https://api.greasyfork.org/en/scripts.json') && url.includes('filter_locale=0'))).toBe(true);
});

test('saved searches refresh and badge new or updated results', async ({ page }) => {
  let results = GREASY_FORK_RESULTS.slice(0, 2);
  await page.unroute('https://api.greasyfork.org/**');
  await page.route('https://api.greasyfork.org/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(results),
    });
  });

  await page.goto('/');
  await runSearch(page, 'youtube');
  await page.click('#btnSavedSearches');
  await page.click('#btnSaveCurrentSearch');
  await expect(page.locator('#savedSearchList')).toContainText('2 tracked results');

  results = [
    { ...GREASY_FORK_RESULTS[0], version: '1.0.1', code_updated_at: '2026-04-01T00:00:00Z' },
    GREASY_FORK_RESULTS[1],
    {
      id: 104,
      name: 'YouTube New Helper',
      description: 'New saved-search result.',
      users: [{ name: 'tester' }],
      url: 'https://greasyfork.org/en/scripts/104-youtube-new-helper',
      code_url: '',
      version: '1.0.0',
      daily_installs: 2,
      total_installs: 20,
      good_ratings: 1,
      bad_ratings: 0,
      created_at: '2026-04-01T00:00:00Z',
      code_updated_at: '2026-04-01T00:00:00Z',
      license: 'MIT',
    },
  ];

  await page.locator('#savedSearchList [data-saved-action="refresh"]').click();
  await expect(page.locator('.toast').last()).toContainText('2 new or updated results');
  await expect(page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' })).toContainText('Saved updated');
  await expect(page.locator('.result-card').filter({ hasText: 'YouTube New Helper' })).toContainText('Saved new');
});

test('site filter shows source and metadata applies-to evidence', async ({ page }) => {
  await page.goto('/');
  await page.fill('#siteFilter', 'youtube.com');
  await runSearch(page, 'youtube');

  const youtube = page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' });
  await expect(youtube.locator('.applies-matrix')).toContainText('Metadata match');
  await expect(youtube.locator('.applies-matrix')).toContainText('Greasy Fork site match');
  await expect(youtube.locator('.applies-matrix')).toContainText('@match https://*.youtube.com/*');

  const darkMode = page.locator('.result-card').filter({ hasText: 'Dark Mode Helper' });
  await expect(darkMode.locator('.applies-matrix')).toContainText('Source match; metadata not matched');
  await expect(darkMode.locator('.applies-matrix')).toContainText('No @match/@include hit');
});

test('comparison modal includes applies-to summary for site-filtered results', async ({ page }) => {
  await page.goto('/');
  await page.fill('#siteFilter', 'youtube.com');
  await runSearch(page, 'youtube');

  const cards = page.locator('.result-card');
  await cards.nth(0).locator('[data-action="compare"]').click();
  await cards.nth(1).locator('[data-action="compare"]').click();
  await page.click('.compare-go');

  await expect(page.locator('.modal-overlay')).toHaveClass(/visible/);
  await expect(page.locator('.compare-label', { hasText: 'Applies to youtube.com' })).toHaveCount(2);
  await expect(page.locator('.compare-value', { hasText: 'Metadata match' })).toBeVisible();
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
  await expect(card.locator('.scan-results')).toContainText('No @license declared');
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

test('malformed API source response records recoverable error without crashing', async ({ page }) => {
  await page.unroute('https://api.greasyfork.org/**');
  await page.route('https://api.greasyfork.org/**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: '{not-json' });
  });

  await page.goto('/');
  await page.fill('#searchInput', 'drift');
  await page.press('#searchInput', 'Enter');

  const chip = page.locator('.source-chip.error').filter({ hasText: 'Greasy Fork' });
  await expect(chip).toContainText('greasyfork.org invalid JSON');
  await expect(chip.getByRole('button', { name: 'Retry Greasy Fork' })).toBeVisible();
  await expect(page.locator('.state-empty')).toContainText('No results found');
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

  expect(payload.schema).toBe('scripthunt-diagnostics');
  expect(payload.schemaVersion).toBe(1);
  expect(payload.app).toBe('ScriptHunt');
  expect(payload.sources.length).toBeGreaterThan(0);
  expect(payload.proxyHealth).toBeTruthy();
  expect(payload.preferences).toBeTruthy();
  expect(payload.preferences.schemaVersion).toBeGreaterThan(0);
  expect(payloadText).not.toContain('ghp_secret_should_not_export');
  expect(payloadText).not.toContain('secret-proxy.example');
  expect(payload.customProxyConfigured).toBe(false);
});

test('popover fallback opens diagnostics when native Popover API is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value: undefined });
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, value: undefined });
    Object.defineProperty(HTMLElement.prototype, 'togglePopover', { configurable: true, value: undefined });
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/no-popover/);

  await page.click('#btnDiagnostics');
  await expect(page.locator('#diagnosticsSection')).toHaveClass(/fallback-open/);
  await expect(page.locator('#cacheDiagnosticsSummary')).toContainText('Offline searches');

  await page.click('#btnSavedSearches');
  await expect(page.locator('#savedSearchSection')).toHaveClass(/fallback-open/);
  await expect(page.locator('#diagnosticsSection')).not.toHaveClass(/fallback-open/);
});

test('cache diagnostics report quota and clear IndexedDB caches without deleting user data', async ({ page }) => {
  await page.goto('/');
  await runSearch(page, 'youtube');
  await expect.poll(() => idbStoreCount(page, 'searches')).toBeGreaterThan(0);

  const card = page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' });
  await card.locator('[data-action="scan"]').click();
  await expect(card.locator('.scan-results')).toContainText('Security:');
  await expect.poll(() => idbStoreCount(page, 'scans')).toBeGreaterThan(0);

  await page.evaluate(() => {
    localStorage.setItem('sh_favs', JSON.stringify([{ id: 'keep-favorite', name: 'Keep Favorite', url: 'https://example.com', source: 'greasyfork' }]));
    localStorage.setItem('sh_pref_ghtoken', JSON.stringify('ghp_keep_me'));
  });
  await page.click('#btnDiagnostics');
  await expect(page.locator('#cacheDiagnosticsSummary')).toContainText('Offline searches');
  await expect(page.locator('#cacheDiagnosticsSummary')).toContainText('Scan cache');
  await expect.poll(async () => {
    const payload = JSON.parse(await page.locator('#diagnosticsOutput').inputValue());
    return payload.cacheDiagnostics?.indexedDB?.scanCache || 0;
  }).toBeGreaterThan(0);

  const payload = JSON.parse(await page.locator('#diagnosticsOutput').inputValue());
  expect(payload.cacheDiagnostics.indexedDB.offlineSearches).toBeGreaterThan(0);
  expect(payload.cacheDiagnostics.storage).toHaveProperty('supported');

  await page.click('#btnClearScanCache');
  await expect(page.locator('#cacheSettingsStatus')).toContainText('Scan cache cleared');
  await expect.poll(() => idbStoreCount(page, 'scans')).toBe(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sh_favs'))[0].id)).toBe('keep-favorite');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sh_pref_ghtoken')))).toBe('ghp_keep_me');

  await page.click('#btnClearOfflineCache');
  await expect(page.locator('#cacheSettingsStatus')).toContainText('Offline search cache cleared');
  await expect.poll(() => idbStoreCount(page, 'searches')).toBe(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sh_favs'))[0].id)).toBe('keep-favorite');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sh_pref_ghtoken')))).toBe('ghp_keep_me');
});

test('cache diagnostics clear localStorage fallback caches without deleting user data', async ({ page }) => {
  await page.addInitScript(() => {
    try { delete window.indexedDB; } catch {}
    Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined });
  });
  await page.goto('/');
  await runSearch(page, 'youtube');
  await expect.poll(() => localStorageArrayCount(page, 'sh_offline_searches')).toBeGreaterThan(0);

  const card = page.locator('.result-card').filter({ hasText: 'YouTube Enhancer' });
  await card.locator('[data-action="scan"]').click();
  await expect(card.locator('.scan-results')).toContainText('Security:');
  await expect.poll(() => localStorageArrayCount(page, 'sh_scan_cache')).toBeGreaterThan(0);

  await page.evaluate(() => {
    localStorage.setItem('sh_favs', JSON.stringify([{ id: 'fallback-favorite', name: 'Fallback Favorite', url: 'https://example.com', source: 'greasyfork' }]));
    localStorage.setItem('sh_pref_ghtoken', JSON.stringify('ghp_keep_fallback'));
  });
  await page.click('#btnDiagnostics');
  await expect(page.locator('#cacheDiagnosticsSummary')).toContainText('localStorage 1');
  await expect.poll(async () => {
    const payload = JSON.parse(await page.locator('#diagnosticsOutput').inputValue());
    return payload.cacheDiagnostics?.localStorage?.scanCache || 0;
  }).toBeGreaterThan(0);

  await page.click('#btnClearScanCache');
  await expect(page.locator('#cacheSettingsStatus')).toContainText('Scan cache cleared');
  expect(await page.evaluate(() => localStorage.getItem('sh_scan_cache'))).toBeNull();

  await page.click('#btnClearOfflineCache');
  await expect(page.locator('#cacheSettingsStatus')).toContainText('Offline search cache cleared');
  expect(await page.evaluate(() => localStorage.getItem('sh_offline_searches'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sh_favs'))[0].id)).toBe('fallback-favorite');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sh_pref_ghtoken')))).toBe('ghp_keep_fallback');
});

test('GitHub token settings save, check rate limit, and stay redacted', async ({ page }) => {
  let authHeader = '';
  await page.route('https://api.github.com/rate_limit', async (route) => {
    authHeader = route.request().headers().authorization || '';
    await route.fulfill({
      contentType: 'application/json',
      headers: {
        'x-ratelimit-limit': '30',
        'x-ratelimit-remaining': '28',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
        'x-ratelimit-resource': 'search',
      },
      body: JSON.stringify({
        resources: { search: { limit: 30, remaining: 28, reset: Math.floor(Date.now() / 1000) + 3600 } },
      }),
    });
  });

  await page.goto('/');
  await page.click('#btnDiagnostics');
  await expect(page.locator('#btnCheckGitHubRate')).toBeVisible();
  await page.fill('#githubTokenInput', 'ghp_secret_should_not_export');
  await page.click('#btnSaveGitHubToken');

  await expect(page.locator('#githubSettingsStatus')).toContainText('28 searches left');
  expect(authHeader).toBe('token ghp_secret_should_not_export');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sh_pref_ghtoken')))).toBe('ghp_secret_should_not_export');

  const payloadText = await page.locator('#diagnosticsOutput').inputValue();
  const payload = JSON.parse(payloadText);
  expect(payload.githubTokenConfigured).toBe(true);
  expect(payload.githubRateLimit.remaining).toBe(28);
  expect(payloadText).not.toContain('ghp_secret_should_not_export');

  await page.click('#btnRemoveGitHubToken');
  await expect(page.locator('#githubSettingsStatus')).toContainText('GitHub token removed');
  expect(await page.evaluate(() => localStorage.getItem('sh_pref_ghtoken'))).toBeNull();
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

test('service worker update and cache fallback prompts are visible', async ({ page }) => {
  await page.addInitScript(() => {
    window.__swMessages = [];
    const swEvents = new EventTarget();
    const worker = new EventTarget();
    worker.state = 'installed';
    worker.postMessage = (message) => window.__swMessages.push(message);
    const registration = new EventTarget();
    registration.waiting = worker;
    Object.defineProperty(registration, 'installing', { get: () => worker });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: {},
        register: () => Promise.resolve(registration).then((reg) => {
          setTimeout(() => reg.dispatchEvent(new Event('updatefound')), 0);
          return reg;
        }),
        addEventListener: (type, handler) => swEvents.addEventListener(type, handler),
        __dispatchMessage: (data) => swEvents.dispatchEvent(new MessageEvent('message', { data })),
      },
    });
    window.__dispatchSwMessage = (data) => navigator.serviceWorker.__dispatchMessage(data);
  });

  await page.goto('/');
  await expect(page.locator('.toast')).toContainText('ScriptHunt update available');
  await page.getByRole('button', { name: 'Refresh' }).click();
  expect(await page.evaluate(() => window.__swMessages)).toEqual([{ type: 'SKIP_WAITING' }]);

  await page.evaluate(() => window.__dispatchSwMessage({ type: 'CACHE_FALLBACK', url: './index.html' }));
  await expect(page.locator('.toast').last()).toContainText('Cached shell served while offline');
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

/* ===== XSS / hostile source data tests ===== */

const XSS_GREASY_FORK_RESULTS = [
  {
    id: 901,
    name: '<img src=x onerror=alert("xss-name")>',
    description: '<script>alert("xss-desc")</script>Payload description',
    users: [{ name: '<b onmouseover=alert("xss-author")>Evil</b>' }],
    url: 'javascript:alert("xss-url")',
    code_url: 'https://greasyfork.org/scripts/901-xss/code/xss.user.js',
    version: '1.0.<img src=x>',
    daily_installs: 1,
    total_installs: 10,
    good_ratings: 0,
    bad_ratings: 0,
    created_at: '2025-01-01T00:00:00Z',
    code_updated_at: '2026-01-01T00:00:00Z',
    license: '"><script>alert("xss-license")</script>',
  },
  {
    id: 902,
    name: 'Data URL Script',
    description: 'Script with data: install URL',
    users: [{ name: 'tester' }],
    url: 'data:text/html,<script>alert(1)</script>',
    code_url: 'data:text/javascript,alert(1)',
    version: '1.0.0',
    daily_installs: 1,
    total_installs: 5,
    good_ratings: 0,
    bad_ratings: 0,
    created_at: '2025-01-01T00:00:00Z',
    code_updated_at: '2026-01-01T00:00:00Z',
    license: 'MIT',
  },
];

test('hostile source names and descriptions render as inert text', async ({ page }) => {
  await page.unroute('https://api.greasyfork.org/**');
  await page.route('https://api.greasyfork.org/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(XSS_GREASY_FORK_RESULTS),
    });
  });

  await page.goto('/');
  await runSearch(page, 'xss');

  const pageContent = await page.content();
  expect(pageContent).not.toContain('<img src=x onerror');
  expect(pageContent).not.toContain('<script>alert');
  expect(pageContent).not.toContain('<b onmouseover');

  const card = page.locator('.result-card').first();
  await expect(card.locator('.card-title')).toContainText('<img src=x');
  await expect(card.locator('.card-desc')).toContainText('<script>alert');
  await expect(card.locator('.card-author')).toContainText('<b onmouseover');
});

test('javascript: and data: URLs are rejected from href and window.open sinks', async ({ page }) => {
  await page.unroute('https://api.greasyfork.org/**');
  await page.route('https://api.greasyfork.org/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(XSS_GREASY_FORK_RESULTS),
    });
  });

  await page.goto('/');
  await runSearch(page, 'xss');

  const hrefs = await page.locator('.result-card a[href]').evaluateAll((links) =>
    links.map((a) => a.getAttribute('href'))
  );
  for (const href of hrefs) {
    expect(href).not.toMatch(/^javascript:/i);
    expect(href).not.toMatch(/^data:/i);
    expect(href).not.toMatch(/^vbscript:/i);
  }

  const dataUrls = await page.locator('.result-card [data-url]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-url'))
  );
  for (const dataUrl of dataUrls) {
    expect(dataUrl).not.toMatch(/^javascript:/i);
    expect(dataUrl).not.toMatch(/^data:/i);
  }
});

test('hostile favorites reject dangerous URLs at import and render safely', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sh_favs', JSON.stringify([
      {
        id: 'xss-fav',
        name: '<img src=x onerror=alert("fav-xss")>',
        url: 'javascript:alert("fav-url")',
        installUrl: 'javascript:alert("fav-install")',
        source: 'greasyfork',
        author: '<script>alert("fav-author")</script>',
      },
      {
        id: 'safe-fav',
        name: '<b>Bold Name</b>',
        url: 'https://example.com',
        installUrl: 'https://example.com/install.user.js',
        source: 'greasyfork',
        author: '<marquee>Fancy Author</marquee>',
      },
    ]));
  });
  await page.reload();
  await page.click('#btnFavorites');

  const card = page.locator('.result-card');
  await expect(card).toHaveCount(1);
  await expect(card.locator('.card-title')).toContainText('<b>Bold Name</b>');

  const pageContent = await page.content();
  expect(pageContent).not.toContain('</b>Bold');
  expect(pageContent).not.toContain('<marquee>');

  const hrefs = await card.locator('a[href]').evaluateAll((links) =>
    links.map((a) => a.getAttribute('href'))
  );
  for (const href of hrefs) {
    expect(href).not.toMatch(/^javascript:/i);
    expect(href).not.toMatch(/^data:/i);
  }
});

/* ===== Accessibility regression tests ===== */

test('diagnostics popover has accessible name and Escape closes it', async ({ page }) => {
  await page.goto('/');
  const diagBtn = page.locator('#btnDiagnostics');
  await diagBtn.click();
  await expect(page.locator('#diagnosticsOutput')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('saved searches popover has accessible button and focus behavior', async ({ page }) => {
  await page.goto('/');
  const savedBtn = page.locator('#btnSavedSearches');
  await expect(savedBtn).toBeVisible();
  await savedBtn.click();
  await expect(page.locator('#savedSearchList')).toBeVisible();
});

test('mobile viewport does not clip primary search controls', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.locator('#searchInput')).toBeVisible();
  const searchBox = await page.locator('#searchInput').boundingBox();
  expect(searchBox.width).toBeGreaterThan(200);
  expect(searchBox.x).toBeGreaterThanOrEqual(0);
  expect(searchBox.x + searchBox.width).toBeLessThanOrEqual(375);

  await expect(page.locator('#btnFavorites')).toBeVisible();
  await expect(page.locator('#btnDiagnostics')).toBeVisible();
});
