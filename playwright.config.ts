import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load test environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') })

/**
 * Playwright E2E Test Configuration
 *
 * Uses test Supabase instance (port 54421) to avoid conflicts with dev.
 * Environment variables are loaded from .env.test.local.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3004',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'bun run dev --port 3004',
    url: 'http://localhost:3004',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Pass test Supabase config to Next.js dev server
      NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
  },
})
