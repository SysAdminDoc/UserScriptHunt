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
    license: 'MIT',
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
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript((sourcePrefs) => {
    localStorage.setItem('sh_pref_sources', JSON.stringify(sourcePrefs));
  }, SOURCE_PREFS);

  await page.route('https://api.greasyfork.org/**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(GREASY_FORK_RESULTS),
    });
  });
});

async function runSearch(page, query = 'youtube') {
  await page.fill('#searchInput', query);
  await page.press('#searchInput', 'Enter');
  await expect(page.locator('.result-card').first()).toBeVisible({ timeout: 5000 });
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
    await expect(page.locator('.compare-col')).toHaveCount(2);
    await page.click('.modal-close');
    await expect(page.locator('.modal-overlay')).not.toHaveClass(/visible/);
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
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal-overlay')).not.toHaveClass(/visible/);
  }
});
