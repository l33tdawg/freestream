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

test('default tab is Ingest with server URL visible', async () => {
  // Settings dialog should be open from previous test
  const ingestTab = page.locator('button', { hasText: 'Ingest' });
  await expect(ingestTab).toBeVisible();

  const urlCode = page.locator('code.font-mono');
  await expect(urlCode.first()).toContainText('rtmp://localhost');
});

test('Ingest tab shows RTMP port field with default value 1935', async () => {
  // Ingest tab (default) should be active
  const portInput = page.locator('input[type="number"]').first();
  await expect(portInput).toHaveValue('1935');
});

test('clicking Streaming tab shows buffer duration slider with default 0.0s', async () => {
  const streamingTab = page.locator('button', { hasText: 'Streaming' });
  await streamingTab.click();
  const slider = page.locator('input[type="range"]');
  await expect(slider).toBeVisible();
  await expect(slider).toHaveValue('0');

  const label = page.locator('text=Buffer Duration');
  await expect(label).toBeVisible();

  const hint = page.locator('text=No buffer');
  await expect(hint).toBeVisible();
});

test('clicking About tab shows app info', async () => {
  const aboutTab = page.locator('button', { hasText: 'About' });
  await aboutTab.click();

  await expect(page.locator('text=FreEstream')).toBeVisible();
  await expect(page.locator('text=v1.0.0')).toBeVisible();
  await expect(page.locator('text=Free multi-streaming for everyone')).toBeVisible();
  await expect(page.locator('text=Made with love for the streaming community')).toBeVisible();
});

test('About tab hides Save Settings button', async () => {
  // About tab should be active from previous test
  const saveBtn = page.locator('button', { hasText: 'Save Settings' });
  await expect(saveBtn).not.toBeVisible();
});

test('can close the dialog', async () => {
  const closeBtn = page.locator('button', { hasText: 'Close' });
  await closeBtn.click();

  const heading = page.locator('h2', { hasText: 'Settings' });
  await expect(heading).not.toBeVisible();
});
