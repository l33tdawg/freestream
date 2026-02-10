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

test('getStreamStatus returns object with expected shape', async () => {
  const status = await page.evaluate(() => (window as any).freestream.getStreamStatus());
  expect(status).toHaveProperty('ingest');
  expect(status).toHaveProperty('destinations');
  expect(status).toHaveProperty('isLive');
});

test('getDestinations returns an array', async () => {
  const dests = await page.evaluate(() => (window as any).freestream.getDestinations());
  expect(Array.isArray(dests)).toBe(true);
});

test('getIngestUrl returns string containing rtmp://localhost', async () => {
  const url = await page.evaluate(() => (window as any).freestream.getIngestUrl());
  expect(typeof url).toBe('string');
  expect(url).toContain('rtmp://localhost');
});
