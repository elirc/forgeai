import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
process.env.FORGE_E2E_SHUTDOWN_TOKEN ??= randomUUID();
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.cache/playwright');
export default defineConfig({
  testDir: './tests/e2e',
  globalTeardown: './tests/e2e/teardown.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node --import tsx scripts/e2e-server.ts',
    url: 'http://127.0.0.1:3001',
    timeout: 180_000,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
