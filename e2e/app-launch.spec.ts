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

test('window opens with correct title', async () => {
  const title = await page.title();
  expect(title).toBe('FreEstream');
});

test('window has expected minimum dimensions', async () => {
  // Use Electron's BrowserWindow API to get actual window size
  const size = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    const [width, height] = win.getSize();
    return { width, height };
  });
  expect(size.width).toBeGreaterThanOrEqual(940);
  expect(size.height).toBeGreaterThanOrEqual(640);
});

test('#root has non-trivial content (not blank screen)', async () => {
  const rootHtml = await page.$eval('#root', (el) => el.innerHTML);
  expect(rootHtml.length).toBeGreaterThan(100);
});

test('window.freestream bridge is exposed', async () => {
  const hasBridge = await page.evaluate(() => typeof (window as any).freestream === 'object');
  expect(hasBridge).toBe(true);
});
