---
paths:
  - "tests/integration/**/*"
  - "supabase/seed.sql"
---

# Integration Testing with Local Supabase

## Overview

Integration tests run against a **real local Supabase instance** with seeded data. They verify actual database operations, RLS policies, and realtime behavior.

## Prerequisites

Before running integration tests:

```bash
# Start local Supabase (includes Postgres, Auth, Realtime)
bunx supabase start

# Verify it's running
bunx supabase status

# Reset database with seed data
bunx supabase db reset
```

## Directory Structure

```
tests/
├── integration/
│   ├── setup.ts              # Global setup (called before all tests)
│   ├── teardown.ts           # Global teardown (called after all tests)
│   ├── utils.ts              # Test client factories
│   ├── auth.integration.test.ts
│   ├── raffles.integration.test.ts
│   ├── tickets.integration.test.ts
│   └── draw.integration.test.ts
```

## Seed Data

Test fixtures are defined in `/supabase/seed.sql`:

```sql
-- Test users with known IDs for assertions
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'user1@test.com'),
  ('33333333-3333-3333-3333-333333333333', 'user2@test.com');

-- Test raffles in various states
INSERT INTO public.raffles (id, name, status, created_by) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'Active Raffle', 'active', '11111111-1111-1111-1111-111111111111'),
  ('bbbb2222-2222-2222-2222-222222222222', 'Draft Raffle', 'draft', '11111111-1111-1111-1111-111111111111'),
  ('cccc3333-3333-3333-3333-333333333333', 'Completed Raffle', 'completed', '11111111-1111-1111-1111-111111111111');

-- Test participants with known ticket counts
INSERT INTO public.participants (raffle_id, user_id, ticket_count) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 5),
  ('aaaa1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 3);

-- Test prizes
INSERT INTO public.prizes (id, raffle_id, name, sort_order) VALUES
  ('pppp1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'First Prize', 1),
  ('pppp2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'Second Prize', 2);
```

## Test Utilities

```typescript
// tests/integration/utils.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'your-local-anon-key'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'your-local-service-key'

// Service role client - bypasses RLS for setup/teardown
export function createServiceRoleClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

// Anon client - tests actual user permissions
export function createAnonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  })
}

// Authenticated client - simulates logged-in user
export async function createAuthenticatedClient(userId: string) {
  const serviceClient = createServiceRoleClient()
  // Create session for test user
  // ...
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    // ... auth headers
  })
}

// Known test IDs for assertions
export const TEST_IDS = {
  ADMIN_USER: '11111111-1111-1111-1111-111111111111',
  USER_1: '22222222-2222-2222-2222-222222222222',
  USER_2: '33333333-3333-3333-3333-333333333333',
  ACTIVE_RAFFLE: 'aaaa1111-1111-1111-1111-111111111111',
  DRAFT_RAFFLE: 'bbbb2222-2222-2222-2222-222222222222',
  COMPLETED_RAFFLE: 'cccc3333-3333-3333-3333-333333333333',
}
```

## Test Structure

```typescript
// tests/integration/raffles.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createServiceRoleClient, createAnonClient, TEST_IDS } from './utils'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Raffle Integration', () => {
  let serviceClient: SupabaseClient
  let anonClient: SupabaseClient

  beforeAll(async () => {
    serviceClient = createServiceRoleClient()
    anonClient = createAnonClient()
  })

  describe('RLS Policies', () => {
    it('should allow anonymous users to read active raffles', async () => {
      const { data, error } = await anonClient
        .from('raffles')
        .select('*')
        .eq('status', 'active')

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data![0].id).toBe(TEST_IDS.ACTIVE_RAFFLE)
    })

    it('should prevent anonymous users from reading draft raffles', async () => {
      const { data, error } = await anonClient
        .from('raffles')
        .select('*')
        .eq('status', 'draft')

      expect(error).toBeNull()
      expect(data).toHaveLength(0) // RLS blocks access
    })

    it('should prevent anonymous users from creating raffles', async () => {
      const { data, error } = await anonClient
        .from('raffles')
        .insert({ name: 'Unauthorized Raffle', status: 'draft' })

      expect(error).not.toBeNull()
      expect(data).toBeNull()
    })
  })

  describe('Database Constraints', () => {
    it('should enforce unique participant per raffle', async () => {
      // Try to add same user to same raffle again
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
  })
})
```

## Testing Server Actions

```typescript
// tests/integration/draw.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createServiceRoleClient, TEST_IDS } from './utils'
import { drawWinner } from '@/lib/actions/draw'

describe('drawWinner Integration', () => {
  let serviceClient: ReturnType<typeof createServiceRoleClient>

  beforeEach(async () => {
    serviceClient = createServiceRoleClient()

    // Reset participant ticket counts before each test
    await serviceClient
      .from('participants')
      .update({ ticket_count: 5 })
      .eq('raffle_id', TEST_IDS.ACTIVE_RAFFLE)
  })

  it('should select a winner from participants', async () => {
    const result = await drawWinner(TEST_IDS.ACTIVE_RAFFLE)

    expect(result.error).toBeNull()
    expect(result.data).toMatchObject({
      userId: expect.any(String),
      ticketsAtWin: expect.any(Number),
    })

    // Verify winner is in the participants list
    expect([TEST_IDS.USER_1, TEST_IDS.USER_2]).toContain(result.data!.userId)
  })

  it('should reset winner ticket count to zero', async () => {
    const result = await drawWinner(TEST_IDS.ACTIVE_RAFFLE)
    const winnerId = result.data!.userId

    // Check ticket count was reset
    const { data } = await serviceClient
      .from('participants')
      .select('ticket_count')
      .eq('raffle_id', TEST_IDS.ACTIVE_RAFFLE)
      .eq('user_id', winnerId)
      .single()

    expect(data!.ticket_count).toBe(0)
  })

  it('should create winner record', async () => {
    const result = await drawWinner(TEST_IDS.ACTIVE_RAFFLE)

    const { data } = await serviceClient
      .from('winners')
      .select('*')
      .eq('raffle_id', TEST_IDS.ACTIVE_RAFFLE)
      .order('won_at', { ascending: false })
      .limit(1)
      .single()

    expect(data).toMatchObject({
      user_id: result.data!.userId,
      tickets_at_win: result.data!.ticketsAtWin,
    })
  })
})
```

## Running Integration Tests

```bash
# Ensure Supabase is running
bunx supabase status

# Reset database before running tests
bunx supabase db reset

# Run integration tests
bun run test:integration

# Run specific integration test
bun run test:integration tests/integration/raffles.integration.test.ts

# Watch mode (re-runs on changes)
bun run test:integration --watch
```

## Test Isolation

- Tests run **sequentially** (not parallel) to avoid conflicts
- Each test suite can reset specific tables in `beforeEach`
- Use service role client for setup/teardown
- Use anon or authenticated client for assertions

```typescript
beforeEach(async () => {
  // Clean up test data created by previous test
  await serviceClient
    .from('winners')
    .delete()
    .eq('raffle_id', TEST_IDS.ACTIVE_RAFFLE)
})

afterAll(async () => {
  // Final cleanup
  await serviceClient.from('winners').delete().neq('id', '')
})
```

## What Integration Tests Cover

| Concern | Tests |
|---------|-------|
| RLS policy enforcement | User can/cannot access data |
| Database constraints | Unique, foreign keys, not null |
| Server Action DB operations | Insert, update, select work correctly |
| Realtime subscriptions | Events are received |
| Cross-table relationships | Joins and references work |
| Transactions | Atomic operations succeed or rollback |

## Anti-Patterns

```typescript
// WRONG: Running integration tests against production
const client = createClient(PRODUCTION_URL, PRODUCTION_KEY)

// WRONG: Hardcoding credentials
const SERVICE_KEY = 'eyJhbGciOi...'

// WRONG: Not resetting data between tests
// Tests will interfere with each other

// WRONG: Using mocks in integration tests
vi.mock('@/lib/supabase/server') // Defeats the purpose!

// CORRECT: Use real Supabase, reset data, use env vars
```
