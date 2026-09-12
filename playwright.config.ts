import { defineConfig, devices } from '@playwright/test';

const PORT = 8787;
const BASE_URL = process.env.FOXWORDS_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'chromium-tablet',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 1024, height: 1366 },
      },
    },
  ],
  webServer: {
    command: './scripts/low-priority.sh wrangler dev --port 8787',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
