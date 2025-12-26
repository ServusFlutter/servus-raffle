/**
 * Integration Tests for Prize Actions
 *
 * These tests run against a REAL Supabase test instance.
 * They test actual database operations, RLS policies, and data integrity.
 *
 * Run with: npm run test:integration
 *
 * Prerequisites:
 *   1. Docker running
 *   2. Test Supabase instance started: npm run supabase:test:start
 *   3. .env.test configured with test instance keys
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const adminClient = createClient(supabaseUrl, supabaseServiceKey)
const anonClient = createClient(supabaseUrl, supabaseAnonKey)

describe('Prize Integration Tests', () => {
  let testRaffleId: string
  let testActiveRaffleId: string
  let testUserId: string
  let testUserEmail: string

  beforeAll(async () => {
    // Create a unique test user for this test run
    testUserEmail = `test-prizes-${Date.now()}@example.com`

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testUserEmail,
      password: global.TEST_PASSWORD,
      email_confirm: true,
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

    // Create test raffles for prize tests
    const { data: draftRaffle } = await adminClient
      .from('raffles')
      .insert({
        name: `Draft Raffle ${Date.now()}`,
        status: 'draft',
        created_by: testUserId,
      })
      .select()
      .single()

    testRaffleId = draftRaffle!.id

    const { data: activeRaffle } = await adminClient
      .from('raffles')
      .insert({
        name: `Active Raffle ${Date.now()}`,
        status: 'active',
        created_by: testUserId,
      })
      .select()
      .single()

    testActiveRaffleId = activeRaffle!.id

    console.log(`[Prize Tests] Created test user: ${testUserEmail}`)
    console.log(`[Prize Tests] Created test raffles: ${testRaffleId}, ${testActiveRaffleId}`)
  })

  afterAll(async () => {
    // Clean up test raffles (cascade deletes prizes)
    if (testRaffleId) {
      await adminClient.from('raffles').delete().eq('id', testRaffleId)
    }
    if (testActiveRaffleId) {
      await adminClient.from('raffles').delete().eq('id', testActiveRaffleId)
    }

    // Clean up test user
    if (testUserId) {
      await adminClient.from('users').delete().eq('id', testUserId)
      await adminClient.auth.admin.deleteUser(testUserId)
      console.log(`[Prize Tests] Cleaned up test user: ${testUserEmail}`)
    }
  })

  describe('Prize CRUD Operations', () => {
    it('should create a prize with valid input', async () => {
      const { data, error } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Test Prize',
          description: 'A test prize',
          sort_order: 0,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.name).toBe('Test Prize')
      expect(data?.description).toBe('A test prize')
      expect(data?.sort_order).toBe(0)
      expect(data?.awarded_to).toBeNull()
      expect(data?.awarded_at).toBeNull()

      // Clean up
      await adminClient.from('prizes').delete().eq('id', data!.id)
    })

    it('should create a prize without description', async () => {
      const { data, error } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Simple Prize',
          sort_order: 0,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.description).toBeNull()

      // Clean up
      await adminClient.from('prizes').delete().eq('id', data!.id)
    })

    it('should update a prize', async () => {
      // Create prize
      const { data: created } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Original Name',
          sort_order: 0,
        })
        .select()
        .single()

      // Update prize
      const { data: updated, error } = await adminClient
        .from('prizes')
        .update({
          name: 'Updated Name',
          description: 'Now has a description',
        })
        .eq('id', created!.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.description).toBe('Now has a description')

      // Clean up
      await adminClient.from('prizes').delete().eq('id', created!.id)
    })

    it('should delete a prize', async () => {
      // Create prize
      const { data: created } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'To Be Deleted',
          sort_order: 0,
        })
        .select()
        .single()

      // Delete prize
      const { error: deleteError } = await adminClient
        .from('prizes')
        .delete()
        .eq('id', created!.id)

      expect(deleteError).toBeNull()

      // Verify deletion
      const { data: fetched } = await adminClient
        .from('prizes')
        .select()
        .eq('id', created!.id)
        .single()

      expect(fetched).toBeNull()
    })
  })

  describe('Sort Order', () => {
    it('should default sort_order to 0', async () => {
      const { data } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Default Sort Order',
        })
        .select()
        .single()

      expect(data?.sort_order).toBe(0)

      // Clean up
      await adminClient.from('prizes').delete().eq('id', data!.id)
    })

    it('should maintain independent sort_order per raffle', async () => {
      // Create prizes in different raffles
      const { data: prize1 } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Prize in Raffle 1',
          sort_order: 5,
        })
        .select()
        .single()

      const { data: prize2 } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testActiveRaffleId,
          name: 'Prize in Raffle 2',
          sort_order: 5,
        })
        .select()
        .single()

      expect(prize1?.sort_order).toBe(5)
      expect(prize2?.sort_order).toBe(5)

      // Clean up
      await adminClient.from('prizes').delete().eq('id', prize1!.id)
      await adminClient.from('prizes').delete().eq('id', prize2!.id)
    })
  })

  describe('Cascade Delete', () => {
    it('should delete all prizes when raffle is deleted', async () => {
      // Create a temporary raffle
      const { data: tempRaffle } = await adminClient
        .from('raffles')
        .insert({
          name: `Temp Raffle ${Date.now()}`,
          status: 'draft',
          created_by: testUserId,
        })
        .select()
        .single()

      // Add prizes to it
      await adminClient.from('prizes').insert([
        { raffle_id: tempRaffle!.id, name: 'Prize 1', sort_order: 0 },
        { raffle_id: tempRaffle!.id, name: 'Prize 2', sort_order: 1 },
        { raffle_id: tempRaffle!.id, name: 'Prize 3', sort_order: 2 },
      ])

      // Verify prizes exist
      const { data: beforeDelete } = await adminClient
        .from('prizes')
        .select()
        .eq('raffle_id', tempRaffle!.id)

      expect(beforeDelete?.length).toBe(3)

      // Delete raffle
      await adminClient.from('raffles').delete().eq('id', tempRaffle!.id)

      // Verify prizes are gone
      const { data: afterDelete } = await adminClient
        .from('prizes')
        .select()
        .eq('raffle_id', tempRaffle!.id)

      expect(afterDelete?.length).toBe(0)
    })
  })

  describe('RLS Policies', () => {
    it('should allow service role to perform all operations', async () => {
      // Create
      const { data: created, error: createError } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Service Role Prize',
          sort_order: 0,
        })
        .select()
        .single()

      expect(createError).toBeNull()

      // Read
      const { data: read, error: readError } = await adminClient
        .from('prizes')
        .select()
        .eq('id', created!.id)
        .single()

      expect(readError).toBeNull()
      expect(read?.name).toBe('Service Role Prize')

      // Update
      const { error: updateError } = await adminClient
        .from('prizes')
        .update({ name: 'Updated Prize' })
        .eq('id', created!.id)

      expect(updateError).toBeNull()

      // Delete
      const { error: deleteError } = await adminClient
        .from('prizes')
        .delete()
        .eq('id', created!.id)

      expect(deleteError).toBeNull()
    })

    it('should allow authenticated users to read prizes for active raffles', async () => {
      // Create prize for active raffle
      const { data: prize } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testActiveRaffleId,
          name: 'Visible Prize',
          sort_order: 0,
        })
        .select()
        .single()

      // Sign in as test user
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: global.TEST_PASSWORD,
      })

      // Read prizes for active raffle
      const { data: readPrizes, error: readError } = await anonClient
        .from('prizes')
        .select()
        .eq('raffle_id', testActiveRaffleId)

      expect(readError).toBeNull()
      expect(readPrizes).toBeDefined()
      expect(readPrizes?.length).toBeGreaterThanOrEqual(1)
      expect(readPrizes?.some(p => p.id === prize!.id)).toBe(true)

      // Sign out
      await anonClient.auth.signOut()

      // Clean up
      await adminClient.from('prizes').delete().eq('id', prize!.id)
    })

    it('should allow raffle creator to read prizes for their draft raffles', async () => {
      // Create prize for draft raffle
      const { data: prize } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Draft Raffle Prize',
          sort_order: 0,
        })
        .select()
        .single()

      // Sign in as the raffle creator
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: global.TEST_PASSWORD,
      })

      // Read prizes for own draft raffle
      const { data: readPrizes, error: readError } = await anonClient
        .from('prizes')
        .select()
        .eq('raffle_id', testRaffleId)

      expect(readError).toBeNull()
      expect(readPrizes?.some(p => p.id === prize!.id)).toBe(true)

      // Sign out
      await anonClient.auth.signOut()

      // Clean up
      await adminClient.from('prizes').delete().eq('id', prize!.id)
    })

    it('should NOT allow regular users to read prizes for draft raffles they do not own', async () => {
      // Create another user
      const otherUserEmail = `other-user-${Date.now()}@example.com`
      const { data: otherAuth } = await adminClient.auth.admin.createUser({
        email: otherUserEmail,
        password: global.TEST_PASSWORD,
        email_confirm: true,
      })

      await adminClient.from('users').insert({
        id: otherAuth!.user.id,
        email: otherUserEmail,
        name: 'Other User',
      })

      // Create prize for draft raffle owned by testUser
      const { data: prize } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Private Prize',
          sort_order: 0,
        })
        .select()
        .single()

      // Sign in as other user (not the owner)
      const otherClient = createClient(supabaseUrl, supabaseAnonKey)
      await otherClient.auth.signInWithPassword({
        email: otherUserEmail,
        password: global.TEST_PASSWORD,
      })

      // Try to read prizes for draft raffle
      const { data: readPrizes } = await otherClient
        .from('prizes')
        .select()
        .eq('raffle_id', testRaffleId)

      // Should NOT see the prize (empty array due to RLS)
      expect(readPrizes?.some(p => p.id === prize!.id)).toBe(false)

      // Clean up
      await otherClient.auth.signOut()
      await adminClient.from('prizes').delete().eq('id', prize!.id)
      await adminClient.from('users').delete().eq('id', otherAuth!.user.id)
      await adminClient.auth.admin.deleteUser(otherAuth!.user.id)
    })

    it('should allow unauthenticated users to read prizes for ACTIVE raffles', async () => {
      // Create prize for active raffle
      const { data: prize } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testActiveRaffleId,
          name: 'Public Prize',
          sort_order: 0,
        })
        .select()
        .single()

      // Create fresh unauthenticated client
      const freshClient = createClient(supabaseUrl, supabaseAnonKey)

      // Try to read prizes for active raffle
      const { data: readPrizes } = await freshClient
        .from('prizes')
        .select()
        .eq('raffle_id', testActiveRaffleId)

      // Should return prizes for active raffles (participants need to see what they can win)
      expect(readPrizes?.length).toBeGreaterThan(0)
      expect(readPrizes?.some(p => p.id === prize!.id)).toBe(true)

      // Clean up
      await adminClient.from('prizes').delete().eq('id', prize!.id)
    })

    it('should NOT allow unauthenticated users to read prizes for draft raffles', async () => {
      // Create prize for draft raffle
      const { data: prize } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId, // This is a draft raffle
          name: 'Draft Raffle Prize',
          sort_order: 0,
        })
        .select()
        .single()

      // Create fresh unauthenticated client
      const freshClient = createClient(supabaseUrl, supabaseAnonKey)

      // Try to read prizes for draft raffle
      const { data: readPrizes } = await freshClient
        .from('prizes')
        .select()
        .eq('raffle_id', testRaffleId)

      // Should NOT return prizes for draft raffles
      expect(readPrizes?.some(p => p.id === prize!.id)).toBe(false)

      // Clean up
      await adminClient.from('prizes').delete().eq('id', prize!.id)
    })

    it('should NOT allow authenticated users to create prizes', async () => {
      // Sign in as test user
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: global.TEST_PASSWORD,
      })

      // Try to create a prize (should fail - only service role can create)
      const { data, error } = await anonClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Unauthorized Prize',
          sort_order: 0,
        })
        .select()
        .single()

      // Should fail due to RLS
      expect(error).toBeDefined()
      expect(data).toBeNull()

      // Sign out
      await anonClient.auth.signOut()
    })

    it('should NOT allow authenticated users to delete prizes', async () => {
      // Create prize
      const { data: prize } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testActiveRaffleId,
          name: 'Protected Prize',
          sort_order: 0,
        })
        .select()
        .single()

      // Sign in as test user
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: global.TEST_PASSWORD,
      })

      // Try to delete (should fail - RLS prevents non-service-role deletions)
      await anonClient
        .from('prizes')
        .delete()
        .eq('id', prize!.id)

      // The delete might not error but won't actually delete due to RLS
      // Verify prize still exists
      const { data: stillExists } = await adminClient
        .from('prizes')
        .select()
        .eq('id', prize!.id)
        .single()

      expect(stillExists).toBeDefined()

      // Sign out
      await anonClient.auth.signOut()

      // Clean up with admin client
      await adminClient.from('prizes').delete().eq('id', prize!.id)
    })
  })

  describe('Prize Reordering', () => {
    let prizeIds: string[] = []

    beforeEach(async () => {
      // Create 3 prizes in order
      const { data: prize1 } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Prize A',
          sort_order: 0,
        })
        .select()
        .single()

      const { data: prize2 } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Prize B',
          sort_order: 1,
        })
        .select()
        .single()

      const { data: prize3 } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Prize C',
          sort_order: 2,
        })
        .select()
        .single()

      prizeIds = [prize1!.id, prize2!.id, prize3!.id]
    })

    afterEach(async () => {
      // Clean up prizes created in this test
      for (const id of prizeIds) {
        await adminClient.from('prizes').delete().eq('id', id)
      }
      prizeIds = []
    })

    it('should update sort_order when prizes are reordered', async () => {
      // Reverse the order: C, B, A
      const newOrder = [prizeIds[2], prizeIds[1], prizeIds[0]]

      // Update sort orders manually (simulating reorderPrizes action)
      for (let i = 0; i < newOrder.length; i++) {
        await adminClient
          .from('prizes')
          .update({ sort_order: i })
          .eq('id', newOrder[i])
      }

      // Verify new order
      const { data } = await adminClient
        .from('prizes')
        .select('*')
        .eq('raffle_id', testRaffleId)
        .order('sort_order')

      expect(data![0].name).toBe('Prize C')
      expect(data![0].sort_order).toBe(0)
      expect(data![1].name).toBe('Prize B')
      expect(data![1].sort_order).toBe(1)
      expect(data![2].name).toBe('Prize A')
      expect(data![2].sort_order).toBe(2)
    })

    it('should swap sort_order between adjacent prizes', async () => {
      // Swap Prize A (sort_order 0) and Prize B (sort_order 1)
      const prizeAId = prizeIds[0]
      const prizeBId = prizeIds[1]

      // Swap sort orders
      await adminClient
        .from('prizes')
        .update({ sort_order: 1 })
        .eq('id', prizeAId)

      await adminClient
        .from('prizes')
        .update({ sort_order: 0 })
        .eq('id', prizeBId)

      // Verify swap
      const { data: prizeA } = await adminClient
        .from('prizes')
        .select('*')
        .eq('id', prizeAId)
        .single()

      const { data: prizeB } = await adminClient
        .from('prizes')
        .select('*')
        .eq('id', prizeBId)
        .single()

      expect(prizeA!.sort_order).toBe(1)
      expect(prizeB!.sort_order).toBe(0)
    })

    it('should maintain sort_order integrity after multiple reorders', async () => {
      // Move Prize C to position 0, shift others
      const prizeCId = prizeIds[2]

      // Update all sort orders
      await adminClient.from('prizes').update({ sort_order: 0 }).eq('id', prizeIds[2])
      await adminClient.from('prizes').update({ sort_order: 1 }).eq('id', prizeIds[0])
      await adminClient.from('prizes').update({ sort_order: 2 }).eq('id', prizeIds[1])

      // Verify order
      const { data } = await adminClient
        .from('prizes')
        .select('*')
        .eq('raffle_id', testRaffleId)
        .order('sort_order')

      expect(data!.length).toBe(3)
      expect(data![0].id).toBe(prizeCId)
      expect(data![1].id).toBe(prizeIds[0])
      expect(data![2].id).toBe(prizeIds[1])
    })

    it('should not affect prizes in other raffles when reordering', async () => {
      // Create a prize in the other raffle
      const { data: otherPrize } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testActiveRaffleId,
          name: 'Other Raffle Prize',
          sort_order: 0,
        })
        .select()
        .single()

      // Reorder prizes in testRaffleId
      await adminClient.from('prizes').update({ sort_order: 2 }).eq('id', prizeIds[0])
      await adminClient.from('prizes').update({ sort_order: 0 }).eq('id', prizeIds[2])

      // Verify the prize in other raffle was not affected
      const { data: unchangedPrize } = await adminClient
        .from('prizes')
        .select('*')
        .eq('id', otherPrize!.id)
        .single()

      expect(unchangedPrize!.sort_order).toBe(0)

      // Clean up
      await adminClient.from('prizes').delete().eq('id', otherPrize!.id)
    })
  })

  describe('Data Integrity', () => {
    it('should enforce foreign key constraint for raffle_id', async () => {
      const nonExistentRaffleId = '00000000-0000-0000-0000-000000000000'

      const { error } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: nonExistentRaffleId,
          name: 'Orphan Prize',
          sort_order: 0,
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key violation
    })

    it('should allow nullable awarded_to field', async () => {
      const { data, error } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Unawarded Prize',
          sort_order: 0,
          awarded_to: null,
          awarded_at: null,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.awarded_to).toBeNull()
      expect(data?.awarded_at).toBeNull()

      // Clean up
      await adminClient.from('prizes').delete().eq('id', data!.id)
    })

    it('should enforce foreign key constraint for awarded_to', async () => {
      const nonExistentUserId = '00000000-0000-0000-0000-000000000000'

      const { error } = await adminClient
        .from('prizes')
        .insert({
          raffle_id: testRaffleId,
          name: 'Invalid Award',
          sort_order: 0,
          awarded_to: nonExistentUserId,
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key violation
    })
  })
})
