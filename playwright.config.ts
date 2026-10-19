import { defineConfig, devices } from '@playwright/test'

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173/games/'
const phoneRun = process.env.PLAYWRIGHT_PHONE === '1'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...(phoneRun ? devices['Pixel 7'] : devices['Desktop Chrome']),
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: phoneRun ? 'phone-chromium' : 'chromium',
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command:
            'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
          url: 'http://127.0.0.1:4173/games/',
          reuseExistingServer: !process.env.CI,
        },
        {
          command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
          url: 'http://127.0.0.1:5174/games/',
          reuseExistingServer: !process.env.CI,
        },
      ],
})
