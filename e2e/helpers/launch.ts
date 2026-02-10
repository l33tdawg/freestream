import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');
const MAIN_ENTRY = path.join(ROOT, 'dist', 'main', 'main', 'index.js');

export async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [MAIN_ENTRY],
    env: { ...process.env, NODE_ENV: 'production' },
  });

  const page = await app.firstWindow();

  // Wait for the Dashboard title to appear — signals the React app has rendered
  await page.waitForSelector('text=FreEstream', { timeout: 15_000 });

  return { app, page };
}

export async function closeApp(app: ElectronApplication): Promise<void> {
  try {
    // Attempt graceful close first
    await Promise.race([
      app.close(),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
  } catch {
    // ignore
  }

  // Force-kill the process if it's still alive (node-media-server keeps it open)
  try {
    const proc = app.process();
    if (proc && !proc.killed) {
      proc.kill('SIGKILL');
    }
  } catch {
    // ignore
  }
}
