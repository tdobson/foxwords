import { defineConfig, devices } from '@playwright/test';

const PORT = 8787;
const rawBaseUrl = process.env.FOXWORDS_BASE_URL || `http://localhost:${PORT}`;

let parsedUrl: URL;
try {
  parsedUrl = new URL(rawBaseUrl);
} catch {
  throw new Error(`Invalid FOXWORDS_BASE_URL: ${rawBaseUrl}`);
}

const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', 'foxwords-dev.tdobson.net']);
if (!allowedHosts.has(parsedUrl.hostname)) {
  throw new Error(
    `FOXWORDS_BASE_URL hostname "${parsedUrl.hostname}" is not allowed for Playwright tests. Only localhost and test environments are permitted.`
  );
}

const BASE_URL = rawBaseUrl;

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
    command:
      './scripts/low-priority.sh opennextjs-cloudflare build && ./scripts/low-priority.sh wrangler dev --port 8787',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
