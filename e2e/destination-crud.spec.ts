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

test('clicking "Add" opens the Add Destination dialog', async () => {
  // Use exact role match to avoid matching "Add Your First Destination"
  const addBtn = page.getByRole('button', { name: 'Add', exact: true });
  await addBtn.click();

  const dialogHeading = page.locator('h2', { hasText: 'Add Destination' });
  await expect(dialogHeading).toBeVisible();
});

test('can fill form and submit — destination appears in list', async () => {
  // Dialog should already be open from previous test
  // Platform defaults to Twitch which auto-fills name and URL

  // Fill the stream key (password input inside the dialog)
  const streamKeyInput = page.locator('input[type="password"]');
  await streamKeyInput.fill('test-stream-key-123');

  // Submit the form
  const submitBtn = page.locator('button[type="submit"]', { hasText: 'Add Destination' });
  await submitBtn.click();

  // Dialog should close and destination should appear — empty state should be gone
  await expect(page.locator('text=No destinations yet')).not.toBeVisible({ timeout: 5_000 });
});

test('can remove the destination — empty state returns', async () => {
  // Handle the confirm dialog that fires on remove
  page.on('dialog', (dialog) => dialog.accept());

  // Click the remove button — identified by the trash icon SVG path (d starts with "M14.74")
  const removeBtn = page.locator('button:has(path[d^="M14.74"])');
  await removeBtn.click();

  // Wait for empty state to reappear
  await expect(page.locator('text=No destinations yet')).toBeVisible({ timeout: 5_000 });
});
