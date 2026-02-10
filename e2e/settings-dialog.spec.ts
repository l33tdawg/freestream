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

test('clicking gear button opens Settings dialog', async () => {
  // Settings button has a gear SVG icon (path starts with "M9.594") — no title attribute
  const settingsBtn = page.locator('button:has(path[d^="M9.594"])').first();
  await settingsBtn.click();

  const heading = page.locator('h2', { hasText: 'Settings' });
  await expect(heading).toBeVisible();
});

test('shows RTMP port field with default value 1935', async () => {
  // Settings dialog should be open from previous test
  const portInput = page.locator('input[type="number"]').first();
  await expect(portInput).toHaveValue('1935');
});

test('can close the dialog', async () => {
  const closeBtn = page.locator('button', { hasText: 'Close' });
  await closeBtn.click();

  const heading = page.locator('h2', { hasText: 'Settings' });
  await expect(heading).not.toBeVisible();
});
