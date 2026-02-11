import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchApp, closeApp, clearDestinations } from './helpers/launch';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  ({ app, page } = await launchApp());
  await clearDestinations(page);
});

test.afterAll(async () => {
  await closeApp(app);
});

test('sidebar "F" logo is visible', async () => {
  const logo = page.locator('div.w-9.h-9', { hasText: 'F' });
  await expect(logo).toBeVisible();
});

test('sidebar shows "OBS" label', async () => {
  const obsLabel = page.locator('span', { hasText: /^OBS$/ });
  await expect(obsLabel).toBeVisible();
});

test('sidebar shows destination count "0"', async () => {
  // The count is a span.text-lg.tabular-nums inside the sidebar, next to the "Dest" label
  const destSection = page.locator('div', { has: page.locator('span', { hasText: /^Dest$/ }) });
  const countEl = destSection.locator('span.tabular-nums').first();
  await expect(countEl).toHaveText('0');
});

test('"Ingest Server" card heading visible', async () => {
  const heading = page.locator('h3', { hasText: 'Ingest Server' });
  await expect(heading).toBeVisible();
});

test('disconnected state shows "See Settings for setup info"', async () => {
  const hint = page.locator('text=See Settings for setup info');
  await expect(hint).toBeVisible();
});

test('RTMP URL displayed in Settings dialog', async () => {
  const settingsBtn = page.locator('button:has(path[d^="M9.594"])').first();
  await settingsBtn.click();

  const heading = page.locator('h2', { hasText: 'Settings' });
  await expect(heading).toBeVisible();

  const urlCode = page.locator('code.font-mono');
  await expect(urlCode.first()).toContainText('rtmp://localhost');

  const closeBtn = page.locator('button', { hasText: 'Close' });
  await closeBtn.click();
  await expect(heading).not.toBeVisible();
});

test('"Start Restreaming" button exists and is disabled', async () => {
  const goLiveBtn = page.locator('button', { hasText: 'Start Restreaming' });
  await expect(goLiveBtn).toBeVisible();
  await expect(goLiveBtn).toBeDisabled();
});

test('empty state shows "No destinations yet"', async () => {
  const emptyState = page.locator('text=No destinations yet');
  await expect(emptyState).toBeVisible();
});
