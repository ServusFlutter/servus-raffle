---
paths:
  - "supabase/**/*"
  - "lib/supabase/**/*"
  - "lib/actions/**/*"
---

# Supabase Development Rules

## Local Development Commands

```bash
# Start local Supabase (Postgres, Auth, Realtime, Storage)
bunx supabase start

# Stop Supabase
bunx supabase stop

# View status and local URLs
bunx supabase status

# Reset database (runs all migrations + seed.sql)
bunx supabase db reset

# Generate TypeScript types from schema
bunx supabase gen types typescript --local > types/database.ts

# Create a new migration
bunx supabase migration new create_raffles_table

# Push migrations to remote (staging/production)
bunx supabase db push
```

## Migration File Naming

Format: `YYYYMMDDHHMMSS_description.sql`

```bash
# Creates: supabase/migrations/20241225190000_create_raffles_table.sql
bunx supabase migration new create_raffles_table
```

## SQL Style Guide

All database identifiers use **snake_case**:

```sql
-- CORRECT: snake_case everywhere
CREATE TABLE raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'drawing', 'completed')),
  qr_code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffles_created_by ON raffles(created_by);

-- WRONG: camelCase or PascalCase
CREATE TABLE Raffles (
  Id UUID,
  createdAt TIMESTAMP,
  createdBy UUID
);
```

## RLS Policies

Every table MUST have Row Level Security enabled:

```sql
-- Enable RLS (required for every table)
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;

-- Example policies

-- Anyone can view active raffles
CREATE POLICY "Public can view active raffles"
  ON raffles FOR SELECT
  USING (status = 'active');

-- Authenticated users can view their participation
CREATE POLICY "Users can view own participation"
  ON participants FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can do everything (using helper function)
CREATE POLICY "Admins have full access to raffles"
  ON raffles FOR ALL
  USING (is_admin(auth.uid()));

-- Helper function for admin check
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Supabase Client Utilities

### Server Client (for Server Components and Server Actions)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// Service role client for admin operations (Server Actions only)
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

### Browser Client (for Client Components)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Server Action Database Pattern

```typescript
// lib/actions/raffles.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CreateRaffleSchema } from '@/lib/schemas/raffle'
import type { ActionResult } from '@/types/actions'
import type { Raffle } from '@/types/raffle'

export async function createRaffle(
  name: string
): Promise<ActionResult<Raffle>> {
  // 1. Validate input
  const parsed = CreateRaffleSchema.safeParse({ name })
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message }
  }

  // 2. Get authenticated client
  const supabase = await createServerSupabaseClient()

  // 3. Perform database operation
  const { data, error } = await supabase
    .from('raffles')
    .insert({ name: parsed.data.name })
    .select()
    .single()

  // 4. Handle result
  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
```

## Query Patterns

```typescript
// Single record
const { data, error } = await supabase
  .from('raffles')
  .select('*')
  .eq('id', raffleId)
  .single()

// Multiple records with filter
const { data, error } = await supabase
  .from('participants')
  .select('user_id, ticket_count')
  .eq('raffle_id', raffleId)
  .gt('ticket_count', 0)

// Join with related table
const { data, error } = await supabase
  .from('raffles')
  .select(`
    *,
    prizes (*),
    participants (user_id, ticket_count)
  `)
  .eq('id', raffleId)
  .single()

// Insert and return
const { data, error } = await supabase
  .from('raffles')
  .insert({ name })
  .select()
  .single()

// Update
const { error } = await supabase
  .from('raffles')
  .update({ status: 'active' })
  .eq('id', raffleId)

// Upsert (insert or update)
const { data, error } = await supabase
  .from('participants')
  .upsert(
    { raffle_id: raffleId, user_id: userId, ticket_count: 1 },
    { onConflict: 'raffle_id,user_id' }
  )
  .select()
  .single()
```

## Type Generation

After schema changes, regenerate types:

```bash
bunx supabase gen types typescript --local > types/database.ts
```

Use generated types:

```typescript
import type { Database } from '@/types/database'

type Raffle = Database['public']['Tables']['raffles']['Row']
type InsertRaffle = Database['public']['Tables']['raffles']['Insert']
type UpdateRaffle = Database['public']['Tables']['raffles']['Update']
```

## Anti-Patterns

```typescript
// WRONG: Using service role key in client-side code
const client = createClient(url, SUPABASE_SERVICE_ROLE_KEY)

// WRONG: Raw SQL in Server Actions (prefer query builder)
await supabase.rpc('raw_query', { sql: 'SELECT * FROM raffles' })

// WRONG: Skipping RLS policies
// Every table needs policies or data is inaccessible

// WRONG: camelCase in database queries
.from('participants').select('userId, ticketCount')

// WRONG: Not handling errors
const { data } = await supabase.from('raffles').select()
// What if there's an error?

// CORRECT: Always handle both data and error
const { data, error } = await supabase.from('raffles').select()
if (error) {
  return { data: null, error: error.message }
}
```
