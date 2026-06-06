import { defineConfig, devices } from '@playwright/test';
import { AppConfig } from './utils/AppConfig';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: AppConfig.IS_CI,
  retries: AppConfig.RETRY_COUNT,
  workers: AppConfig.WORKER_COUNT,
  timeout: 60_000,
  expect: { timeout: AppConfig.DEFAULT_TIMEOUT },

  reporter: [
    ['html', { outputFolder: AppConfig.REPORT_DIR, open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: AppConfig.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: AppConfig.HEADLESS,
    viewport: { width: AppConfig.VIEWPORT_WIDTH, height: AppConfig.VIEWPORT_HEIGHT },
    actionTimeout: AppConfig.ACTION_TIMEOUT,
    navigationTimeout: AppConfig.NAVIGATION_TIMEOUT,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
