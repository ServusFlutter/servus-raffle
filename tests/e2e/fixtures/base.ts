import {
  SUPABASE_DB_HOST,
  SUPABASE_DB_NAME,
  SUPABASE_DB_PASSWORD,
  SUPABASE_DB_PORT,
  SUPABASE_DB_USER,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from '@/tests/env'
import type { Database } from '@/types/database'
import { withSupawright } from 'supawright'

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
    supabaseUrl: SUPABASE_URL,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  },
  // Direct Postgres connection for schema introspection
  database: {
    host: SUPABASE_DB_HOST,
    port: SUPABASE_DB_PORT,
    user: SUPABASE_DB_USER,
    password: SUPABASE_DB_PASSWORD,
    database: SUPABASE_DB_NAME,
  },
})

export { expect } from '@playwright/test'
