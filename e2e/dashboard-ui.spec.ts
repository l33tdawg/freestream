import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { launchApp, closeApp } from './helpers/launch';

let app: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  ({ app, page } = await launchApp());
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

test('RTMP URL displayed (contains rtmp://localhost)', async () => {
  const urlCode = page.locator('code.font-mono');
  await expect(urlCode.first()).toContainText('rtmp://localhost');
});

test('"Go Live" button exists and is disabled', async () => {
  const goLiveBtn = page.locator('button', { hasText: 'Go Live' });
  await expect(goLiveBtn).toBeVisible();
  await expect(goLiveBtn).toBeDisabled();
});

test('empty state shows "No destinations yet"', async () => {
  const emptyState = page.locator('text=No destinations yet');
  await expect(emptyState).toBeVisible();
});
