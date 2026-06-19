import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WEATHER_FIXTURE = {
  current: {
    time: '2026-06-18T12:00',
    temperature_2m: 27.4,
    apparent_temperature: 28.1,
    precipitation: 0,
    weather_code: 1,
    wind_speed_10m: 9,
  },
  daily: {
    time: ['2026-06-18', '2026-06-19', '2026-06-20'],
    temperature_2m_max: [31, 32, 30],
    temperature_2m_min: [21, 22, 20],
    precipitation_probability_max: [10, 20, 35],
    weather_code: [1, 2, 61],
  },
};

async function stubWeather(page) {
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: WEATHER_FIXTURE }));
}

async function openMobileFilters(page) {
  if ((page.viewportSize()?.width || 0) <= 960) {
    await page.getByRole('button', { name: 'Filtre', exact: true }).click();
  }
}

test('ana harita akisi yuklenir ve arama calisir', async ({ page }) => {
  await stubWeather(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Harita/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Yurt, BNL, cami/i)).toBeVisible();
  await expect(page.locator('#loadStatus')).toContainText(/nokta/);
  await expect(page.locator('#localRadar')).toContainText('Torino Radar');
  await expect(page.locator('#weatherNow')).toContainText('27 C');

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
  await stubWeather(page);
  await page.goto('/');
  await openMobileFilters(page);

  const museumButton = page.locator('[data-category="museum"]');
  await expect(museumButton).toHaveAttribute('data-loaded', 'false');
  await museumButton.click();

  await expect(museumButton).toHaveAttribute('data-loaded', 'true');
  await expect(page.locator('#resultCount')).toContainText(/nokta/);
});

test('niyet filtresi ve son arama chipleri calisir', async ({ page }) => {
  await stubWeather(page);
  await page.goto('/');
  await openMobileFilters(page);

  const discoverButton = page.locator('[data-intent-id="discover"]');
  await discoverButton.click();
  await expect(discoverButton).toHaveAttribute('aria-pressed', 'true');

  const search = page.getByPlaceholder(/Yurt, BNL, cami/i);
  await search.fill('eczane');
  await search.press('Enter');
  await expect(page.locator('.recent-chip', { hasText: 'eczane' })).toBeVisible();
});

test('Genova rehberi ayri yuklenir ve filtrelenir', async ({ page }) => {
  await stubWeather(page);
  await page.goto('/');

  await expect(page.locator('#categoryList')).not.toContainText('Genova');

  if ((page.viewportSize()?.width || 0) <= 960) {
    await page.locator('#genovaPanel > summary').click();
    await page.locator('#genovaPanel [data-genova-open]').first().click();
  } else {
    await page.locator('#genovaBtn').click();
  }
  await expect(page.locator('#genovaPanel')).toHaveAttribute('open', '');
  await expect(page.locator('#genovaContent')).toContainText('Torino');
  await expect(page.locator('#categoryList')).toContainText('Genova');

  await page.locator('[data-genova-filter-id="genova-budget"]').first().click();
  await expect(page.locator('[data-genova-filter-id="genova-budget"]').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#resultCount')).toContainText(/nokta/);

  await page.locator('[data-genova-route="genova-overland"]').click();
  await expect(page.locator('#transitInfo')).toContainText(/Genova/);
});

test('ana sayfada kritik erisilebilirlik ihlali yok', async ({ page }) => {
  await stubWeather(page);
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze();

  expect(results.violations).toEqual([]);
});
