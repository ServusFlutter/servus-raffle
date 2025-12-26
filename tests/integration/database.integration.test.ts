import { describe, it, expect, beforeAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createServiceRoleClient,
  createAnonClient,
  TEST_IDS,
} from './utils'

describe('Database Setup Integration', () => {
  let serviceClient: SupabaseClient
  let anonClient: SupabaseClient

  beforeAll(() => {
    serviceClient = createServiceRoleClient()
    anonClient = createAnonClient()
  })

  describe('Connection', () => {
    it('should connect to test Supabase with service role', async () => {
      const { data, error } = await serviceClient
        .from('raffles')
        .select('count')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should connect to test Supabase with anon key', async () => {
      const { error } = await anonClient
        .from('raffles')
        .select('count')
        .limit(1)

      // May return empty due to RLS, but should not error on connection
      expect(error).toBeNull()
    })
  })

  describe('Seed Data', () => {
    it('should have test raffles seeded', async () => {
      const { data, error } = await serviceClient
        .from('raffles')
        .select('*')
        .order('created_at')

      expect(error).toBeNull()
      expect(data).toHaveLength(3)

      const ids = data!.map((r) => r.id)
      expect(ids).toContain(TEST_IDS.ACTIVE_RAFFLE)
      expect(ids).toContain(TEST_IDS.DRAFT_RAFFLE)
      expect(ids).toContain(TEST_IDS.COMPLETED_RAFFLE)
    })

    it('should have test profiles seeded', async () => {
      const { data, error } = await serviceClient
        .from('profiles')
        .select('*')
        .order('created_at')

      expect(error).toBeNull()
      expect(data).toHaveLength(3)

      const ids = data!.map((p) => p.id)
      expect(ids).toContain(TEST_IDS.ADMIN_USER)
      expect(ids).toContain(TEST_IDS.USER_1)
      expect(ids).toContain(TEST_IDS.USER_2)
    })

    it('should have test participants seeded', async () => {
      const { data, error } = await serviceClient
        .from('participants')
        .select('*')
        .eq('raffle_id', TEST_IDS.ACTIVE_RAFFLE)

      expect(error).toBeNull()
      expect(data).toHaveLength(2)

      const user1 = data!.find((p) => p.user_id === TEST_IDS.USER_1)
      const user2 = data!.find((p) => p.user_id === TEST_IDS.USER_2)

      expect(user1?.ticket_count).toBe(5)
      expect(user2?.ticket_count).toBe(3)
    })

    it('should have test prizes seeded', async () => {
      const { data, error } = await serviceClient
        .from('prizes')
        .select('*')
        .eq('raffle_id', TEST_IDS.ACTIVE_RAFFLE)
        .order('sort_order')

      expect(error).toBeNull()
      expect(data).toHaveLength(2)
      expect(data![0].id).toBe(TEST_IDS.PRIZE_1)
      expect(data![1].id).toBe(TEST_IDS.PRIZE_2)
    })
  })

  describe('RLS Policies', () => {
    it('should allow anon to read active raffles', async () => {
      const { data, error } = await anonClient
        .from('raffles')
        .select('*')
        .eq('status', 'active')

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data![0].id).toBe(TEST_IDS.ACTIVE_RAFFLE)
    })

    it('should prevent anon from reading draft raffles', async () => {
      const { data, error } = await anonClient
        .from('raffles')
        .select('*')
        .eq('status', 'draft')

      expect(error).toBeNull()
      expect(data).toHaveLength(0) // RLS blocks access
    })

    it('should prevent anon from creating raffles', async () => {
      const { data, error } = await anonClient
        .from('raffles')
        .insert({ name: 'Unauthorized Raffle', status: 'draft' })

      expect(error).not.toBeNull()
      expect(data).toBeNull()
    })

    it('should prevent anon from reading profiles', async () => {
      const { data, error } = await anonClient
        .from('profiles')
        .select('*')

      expect(error).toBeNull()
      expect(data).toHaveLength(0) // RLS blocks access without auth
    })
  })

  describe('Database Constraints', () => {
    it('should enforce unique participant per raffle', async () => {
      const { error } = await serviceClient
        .from('participants')
        .insert({
          raffle_id: TEST_IDS.ACTIVE_RAFFLE,
          user_id: TEST_IDS.USER_1,
          ticket_count: 1,
        })

      expect(error).not.toBeNull()
      expect(error!.code).toBe('23505') // unique_violation
    })

    it('should enforce raffle status check constraint', async () => {
      const { error } = await serviceClient
        .from('raffles')
        .insert({ name: 'Invalid Status', status: 'invalid_status' })

      expect(error).not.toBeNull()
      expect(error!.code).toBe('23514') // check_violation
    })

    it('should enforce non-negative ticket count', async () => {
      const { error } = await serviceClient
        .from('participants')
        .update({ ticket_count: -1 })
        .eq('raffle_id', TEST_IDS.ACTIVE_RAFFLE)
        .eq('user_id', TEST_IDS.USER_1)

      expect(error).not.toBeNull()
      expect(error!.code).toBe('23514') // check_violation
    })
  })
})
