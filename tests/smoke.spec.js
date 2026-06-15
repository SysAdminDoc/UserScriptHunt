const { test, expect } = require('@playwright/test');

test('page loads with search input and source toggles', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#searchInput')).toBeVisible();
  await expect(page.locator('.source-toggle')).toHaveCount({ minimum: 6 });
  await expect(page.locator('.version')).toContainText('v0.3.0');
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
