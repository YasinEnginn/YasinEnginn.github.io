import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('ana harita akisi yuklenir ve arama calisir', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Akıllı Harita/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Yurt, BNL, cami/i)).toBeVisible();
  await expect(page.locator('#loadStatus')).toContainText(/nokta/);

  await page.getByPlaceholder(/Yurt, BNL, cami/i).fill('mensa');
  await expect(page.locator('#resultCount')).toContainText(/nokta/);
});

test('manifest ve core veri erisilebilir', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();

  const coreData = await request.get('/data/pois-core.json');
  expect(coreData.ok()).toBeTruthy();
  const body = await coreData.json();
  expect(body.pois.length).toBeGreaterThan(100);
  expect(body.fullStats.total).toBeGreaterThan(body.stats.total);
});

test('agir kategori paketi filtre secilince yuklenir', async ({ page }) => {
  await page.goto('/');

  const museumButton = page.getByRole('button', { name: /Müzeler, 63 nokta/i });
  await expect(museumButton).toHaveAttribute('data-loaded', 'false');
  await museumButton.click();

  await expect(museumButton).toHaveAttribute('data-loaded', 'true');
  await expect(page.locator('#resultCount')).toContainText(/nokta/);
});

test('niyet filtresi ve son arama chipleri calisir', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /Keşif/i }).click();
  await expect(page.getByRole('button', { name: /Keşif/i })).toHaveAttribute('aria-pressed', 'true');

  const search = page.getByPlaceholder(/Yurt, BNL, cami/i);
  await search.fill('eczane');
  await search.press('Enter');
  await expect(page.locator('.recent-chip', { hasText: 'eczane' })).toBeVisible();
});

test('ana sayfada kritik erisilebilirlik ihlali yok', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze();

  expect(results.violations).toEqual([]);
});
