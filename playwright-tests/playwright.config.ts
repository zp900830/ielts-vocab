import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './journeys',
  timeout: 120000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8931',
    channel: 'chromium',
    headless: true,
  },
  webServer: process.env.E2E_NO_SERVER ? undefined : {
    command: 'python3 -m http.server 8931 --bind 127.0.0.1 --directory ../shadow',
    port: 8931,
    reuseExistingServer: true,
  },
});
