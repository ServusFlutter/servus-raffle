import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/tests/env'
import type { Database } from '@/types/database'
import { type SupabaseClient, createClient } from '@supabase/supabase-js'

/**
 * Service role client - bypasses RLS for setup/teardown
 * Use this for creating test data and cleanup
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

/**
 * Anon client - respects RLS policies
 * Use this for testing actual user permissions
 */
export function createAnonClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

  // Prizes (using valid hex - 'dddd' instead of 'pppp')
  PRIZE_1: 'dddd1111-1111-1111-1111-111111111111',
  PRIZE_2: 'dddd2222-2222-2222-2222-222222222222',
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

  await client.from('participants').update({ ticket_count: ticketCount }).eq('raffle_id', raffleId)
}
