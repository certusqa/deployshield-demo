import { defineConfig, devices } from '@playwright/test';

/**
 * Default target is the hermetic demo SUT (fixtures/sut).
 * Live Sauce Demo is a separate soft canary (SKIP_WEBSERVER=1 + BASE_URL).
 * A claim about our gate must not be falsifiable by a third party's uptime.
 */
const HERMETIC_BASE_URL = 'http://127.0.0.1:4173';

if (process.env.CI && !process.env.BASE_URL) {
  throw new Error('BASE_URL must be set in CI');
}

const baseURL = process.env.BASE_URL ?? HERMETIC_BASE_URL;
const skipWebServer = process.env.SKIP_WEBSERVER === '1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL,
    // Sauce Demo / demo SUT expose data-test= (not data-testid=)
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: 'node fixtures/sut/server.js',
        url: HERMETIC_BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
