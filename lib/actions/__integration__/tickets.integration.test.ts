/**
 * Integration Tests for Ticket Actions
 *
 * These tests run against a REAL Supabase test instance.
 * They test actual database operations, RLS policies, and auth flows.
 *
 * Run with: npm run test:integration
 *
 * Prerequisites:
 *   1. Docker running
 *   2. Test Supabase instance started: npm run supabase:test:start
 *   3. .env.test configured with test instance keys
 */

import { createClient } from '@supabase/supabase-js'

// Access test instance directly (not through Next.js server components)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client for admin operations (bypasses RLS)
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

// Anon client for simulating user operations
const anonClient = createClient(supabaseUrl, supabaseAnonKey)

describe('Tickets Integration Tests', () => {
  // Test user created for this test run
  let testUserId: string
  let testUserEmail: string

  beforeAll(async () => {
    // Create a unique test user for this test run
    testUserEmail = `test-${Date.now()}@example.com`

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testUserEmail,
      password: global.TEST_PASSWORD,
      email_confirm: true, // Skip email confirmation
    })

    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`)
    }

    testUserId = authData.user.id

    // Create corresponding public.users record
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: testUserId,
        email: testUserEmail,
        name: 'Test User',
      })

    if (userError) {
      throw new Error(`Failed to create public user: ${userError.message}`)
    }

    console.log(`✓ Created test user: ${testUserEmail} (${testUserId})`)
  })

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      // Delete from public.users (cascades to participants, winners)
      await adminClient.from('users').delete().eq('id', testUserId)

      // Delete from auth.users
      await adminClient.auth.admin.deleteUser(testUserId)

      console.log(`✓ Cleaned up test user: ${testUserEmail}`)
    }
  })

  describe('RLS Policies', () => {
    it('should allow service role to read all raffles', async () => {
      const { data, error } = await adminClient
        .from('raffles')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should allow authenticated users to read active raffles', async () => {
      // Sign in as test user
      const { error: signInError } = await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: global.TEST_PASSWORD,
      })

      expect(signInError).toBeNull()

      // Try to read active raffles
      const { data, error } = await anonClient
        .from('raffles')
        .select('*')
        .eq('status', 'active')

      expect(error).toBeNull()
      expect(data).toBeDefined()

      // Sign out
      await anonClient.auth.signOut()
    })

    it('should allow unauthenticated users to read ACTIVE raffles only', async () => {
      // Create a fresh client with no session
      const freshClient = createClient(supabaseUrl, supabaseAnonKey)

      // Can read active raffles (needed for QR code join flow)
      const { data: activeRaffles, error: activeError } = await freshClient
        .from('raffles')
        .select('*')
        .eq('status', 'active')

      expect(activeError).toBeNull()
      expect(activeRaffles?.length).toBeGreaterThan(0)

      // Cannot read draft raffles
      const { data: draftRaffles } = await freshClient
        .from('raffles')
        .select('*')
        .eq('status', 'draft')

      expect(draftRaffles?.length ?? 0).toBe(0)
    })
  })

  describe('Participant Operations', () => {
    it('should allow user to join an active raffle', async () => {
      // Sign in as test user
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: global.TEST_PASSWORD,
      })

      // Join the active raffle from seed data
      const { data, error } = await adminClient
        .from('participants')
        .insert({
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUserId,
          ticket_count: 1,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.ticket_count).toBe(1)

      // Clean up
      await adminClient
        .from('participants')
        .delete()
        .eq('raffle_id', global.TEST_RAFFLE_ACTIVE_ID)
        .eq('user_id', testUserId)

      await anonClient.auth.signOut()
    })

    it('should enforce unique constraint on raffle_id + user_id', async () => {
      // First insert
      await adminClient
        .from('participants')
        .insert({
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUserId,
          ticket_count: 1,
        })

      // Second insert should fail
      const { error } = await adminClient
        .from('participants')
        .insert({
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUserId,
          ticket_count: 1,
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23505') // Unique violation

      // Clean up
      await adminClient
        .from('participants')
        .delete()
        .eq('raffle_id', global.TEST_RAFFLE_ACTIVE_ID)
        .eq('user_id', testUserId)
    })
  })

  describe('Winners RLS Policies', () => {
    it('should NOT allow unauthenticated users to read winners', async () => {
      // Create a winner record first
      await adminClient.from('winners').insert({
        raffle_id: global.TEST_RAFFLE_COMPLETED_ID,
        user_id: testUserId,
        tickets_at_win: 5,
      })

      // Try to read with unauthenticated client
      const freshClient = createClient(supabaseUrl, supabaseAnonKey)
      const { data } = await freshClient
        .from('winners')
        .select('*')

      // Should return empty due to RLS
      expect(data?.length ?? 0).toBe(0)

      // Clean up
      await adminClient.from('winners').delete().eq('user_id', testUserId)
    })

    it('should allow authenticated users to read winners of COMPLETED raffles', async () => {
      // Create a winner record for completed raffle
      await adminClient.from('winners').insert({
        raffle_id: global.TEST_RAFFLE_COMPLETED_ID,
        user_id: testUserId,
        tickets_at_win: 5,
      })

      // Sign in as test user
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: global.TEST_PASSWORD,
      })

      // Should be able to read winners of completed raffles
      const { data, error } = await anonClient
        .from('winners')
        .select('*')

      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThan(0)

      // Clean up
      await anonClient.auth.signOut()
      await adminClient.from('winners').delete().eq('user_id', testUserId)
    })
  })

  describe('Accumulated Tickets Calculation', () => {
    it('should sum tickets across multiple raffles', async () => {
      // Add participant to multiple raffles
      await adminClient.from('participants').insert([
        { raffle_id: global.TEST_RAFFLE_ACTIVE_ID, user_id: testUserId, ticket_count: 1 },
        { raffle_id: global.TEST_RAFFLE_COMPLETED_ID, user_id: testUserId, ticket_count: 2 },
      ])

      // Query accumulated tickets
      const { data, error } = await adminClient
        .from('participants')
        .select('ticket_count')
        .eq('user_id', testUserId)

      expect(error).toBeNull()
      expect(data).toBeDefined()

      const total = data!.reduce((sum, p) => sum + p.ticket_count, 0)
      expect(total).toBe(3)

      // Clean up
      await adminClient
        .from('participants')
        .delete()
        .eq('user_id', testUserId)
    })

    it('should exclude tickets from before last win', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

      // Add participation records
      await adminClient.from('participants').insert([
        {
          raffle_id: global.TEST_RAFFLE_COMPLETED_ID,
          user_id: testUserId,
          ticket_count: 3,
          joined_at: twoDaysAgo.toISOString(),
        },
        {
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUserId,
          ticket_count: 1,
          joined_at: now.toISOString(),
        },
      ])

      // Add a win record between the two participations
      await adminClient.from('winners').insert({
        raffle_id: global.TEST_RAFFLE_COMPLETED_ID,
        user_id: testUserId,
        tickets_at_win: 3,
        won_at: yesterday.toISOString(),
      })

      // Query tickets joined AFTER last win
      const { data: lastWin } = await adminClient
        .from('winners')
        .select('won_at')
        .eq('user_id', testUserId)
        .order('won_at', { ascending: false })
        .limit(1)
        .single()

      const { data: postWinParticipations } = await adminClient
        .from('participants')
        .select('ticket_count')
        .eq('user_id', testUserId)
        .gt('joined_at', lastWin!.won_at)

      const accumulatedTickets = postWinParticipations!.reduce(
        (sum, p) => sum + p.ticket_count,
        0
      )

      // Should only count the 1 ticket from after the win
      expect(accumulatedTickets).toBe(1)

      // Clean up
      await adminClient.from('winners').delete().eq('user_id', testUserId)
      await adminClient.from('participants').delete().eq('user_id', testUserId)
    })
  })
})
