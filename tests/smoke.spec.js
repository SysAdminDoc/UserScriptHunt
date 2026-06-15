const { test, expect } = require('@playwright/test');

test('page loads with search input and source toggles', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#searchInput')).toBeVisible();
  await expect(page.locator('.source-toggle')).toHaveCount({ minimum: 6 });
  await expect(page.locator('.version')).toContainText('v0.');
});

test('search returns results from at least one source', async ({ page }) => {
  await page.goto('/');
  await page.fill('#searchInput', 'youtube');
  await page.press('#searchInput', 'Enter');
  await expect(page.locator('.result-card').first()).toBeVisible({ timeout: 15000 });
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
  await page.fill('#searchInput', 'youtube');
  await page.press('#searchInput', 'Enter');
  await expect(page.locator('.result-card').first()).toBeVisible({ timeout: 15000 });
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
  await page.fill('#searchInput', 'dark mode');
  await page.press('#searchInput', 'Enter');
  await expect(page.locator('.result-card').first()).toBeVisible({ timeout: 15000 });
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
  await page.selectOption('#sortSelect', 'installs');
  await page.reload();
  await expect(page.locator('#sortSelect')).toHaveValue('installs');
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
  await expect(page.locator('.result-card').first()).toBeVisible({ timeout: 15000 });
});

test('escape key closes modal', async ({ page }) => {
  await page.goto('/');
  await page.fill('#searchInput', 'dark');
  await page.press('#searchInput', 'Enter');
  await expect(page.locator('.result-card').first()).toBeVisible({ timeout: 15000 });
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
