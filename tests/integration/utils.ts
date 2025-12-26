import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Test Supabase runs on port 54421 (offset +100 from dev)
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54421'

/**
 * Service role client - bypasses RLS for setup/teardown
 * Use this for creating test data and cleanup
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY not set. Run `bunx supabase --workdir supabase-test status` to get it.'
    )
  }

  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  })
}

/**
 * Anon client - respects RLS policies
 * Use this for testing actual user permissions
 */
export function createAnonClient(): SupabaseClient<Database> {
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!anonKey) {
    throw new Error(
      'SUPABASE_ANON_KEY not set. Run `bunx supabase --workdir supabase-test status` to get it.'
    )
  }

  return createClient<Database>(SUPABASE_URL, anonKey, {
    auth: { persistSession: false },
  })
}

/**
 * Known test IDs from seed.sql for assertions
 * These match the UUIDs inserted by the seed script
 */
export const TEST_IDS = {
  // Users
  ADMIN_USER: '11111111-1111-1111-1111-111111111111',
  USER_1: '22222222-2222-2222-2222-222222222222',
  USER_2: '33333333-3333-3333-3333-333333333333',

  // Raffles
  ACTIVE_RAFFLE: 'aaaa1111-1111-1111-1111-111111111111',
  DRAFT_RAFFLE: 'bbbb2222-2222-2222-2222-222222222222',
  COMPLETED_RAFFLE: 'cccc3333-3333-3333-3333-333333333333',

  // Prizes
  PRIZE_1: 'pppp1111-1111-1111-1111-111111111111',
  PRIZE_2: 'pppp2222-2222-2222-2222-222222222222',
} as const

type TableName = 'profiles' | 'raffles' | 'participants' | 'prizes' | 'winners'

/**
 * Helper to clean up test data between tests
 */
export async function cleanupTestData(tables: TableName[] = []) {
  const client = createServiceRoleClient()

  for (const table of tables) {
    await client.from(table).delete().neq('id', '')
  }
}

/**
 * Helper to reset participant ticket counts
 */
export async function resetTicketCounts(raffleId: string, ticketCount = 5) {
  const client = createServiceRoleClient()

  await client
    .from('participants')
    .update({ ticket_count: ticketCount })
    .eq('raffle_id', raffleId)
}
