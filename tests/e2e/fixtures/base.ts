import { withSupawright } from 'supawright'
import type { Database } from '@/types/database'

/**
 * E2E Test Fixtures
 *
 * Extends Playwright's test with Supawright for automatic
 * test data creation and cleanup.
 *
 * Configuration is loaded from environment variables:
 * - SUPABASE_URL: Supabase API URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin operations
 * - SUPABASE_DB_*: Direct Postgres connection for schema introspection
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '@/tests/e2e/fixtures/base'
 *
 * test('my test', async ({ page, supawright }) => {
 *   const raffle = await supawright.create('raffles', { name: 'Test' })
 *   await page.goto(`/raffle/${raffle.id}`)
 * })
 * ```
 */

export const test = withSupawright<Database, 'public'>(['public'], {
  supabase: {
    supabaseUrl: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  // Direct Postgres connection for schema introspection
  database: {
    host: process.env.SUPABASE_DB_HOST!,
    port: parseInt(process.env.SUPABASE_DB_PORT!, 10),
    user: process.env.SUPABASE_DB_USER!,
    password: process.env.SUPABASE_DB_PASSWORD!,
    database: process.env.SUPABASE_DB_NAME!,
  },
})

export { expect } from '@playwright/test'
