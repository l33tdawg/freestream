import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  workers: 1, // RTMP server binds port 1935 — can't parallelize
  retries: 0,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  // Give afterAll hooks enough time to force-kill Electron
  globalTimeout: 300_000,
});
