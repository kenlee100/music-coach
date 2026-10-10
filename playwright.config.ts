import { defineConfig, devices } from '@playwright/test'

const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1'
const port = Number.parseInt(process.env.PLAYWRIGHT_PORT || '4190', 10)
const baseURL = `http://${host}:${Number.isFinite(port) ? port : 4190}`

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'pnpm dev',
    env: { ...process.env, NUXT_HOST: host, NUXT_PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } }
  ]
})
