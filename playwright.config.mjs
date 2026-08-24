import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const localServerCommand = process.platform === 'win32'
  ? 'python -m http.server 4173 --directory viewer'
  : 'python3 -m http.server 4173 --directory viewer';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-results/task-010',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 120_000,
  expect: { timeout: 12_000 },
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report/task-010', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report/task-010', open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    actionTimeout: 12_000,
    navigationTimeout: 20_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: localServerCommand,
    url: `${baseURL}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { viewport: { width: 1600, height: 1000 } },
    },
    {
      name: 'chromium-tablet',
      use: { viewport: { width: 1024, height: 768 }, hasTouch: true },
    },
    {
      name: 'chromium-mobile',
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'chromium-reduced-motion',
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        reducedMotion: 'reduce',
      },
    },
  ],
});
