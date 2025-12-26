---
project_name: 'servus-raffle'
user_name: 'Ben'
date: '2025-12-26'
sections_completed: ['technology_stack', 'implementation_rules', 'project_structure', 'testing', 'integration_testing', 'error_handling', 'critical_rules', 'usage_guidelines']
status: 'complete'
rule_count: 27
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing servus-raffle. Read before writing any code._

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | Latest (App Router) | Framework |
| Supabase | Latest | Database + Auth + Realtime |
| TypeScript | Strict mode | Language |
| Tailwind CSS | Latest | Styling |
| shadcn/ui | Latest | UI Components |
| Framer Motion | ^11.x | Wheel animation |
| canvas-confetti | ^1.9.x | Winner celebration |
| qrcode.react | ^4.x | QR code generation |
| Zod | Latest | Validation |
| Sentry | Free tier | Error monitoring |

**Starter Command:**
```bash
npx create-next-app --example with-supabase servus-raffle
```

---

## Critical Implementation Rules

### Database (PostgreSQL/Supabase)

- **ALWAYS** use `snake_case` for tables, columns, foreign keys
- Tables: plural (`raffles`, `participants`, `prizes`)
- Foreign keys: `{table}_id` format (`user_id`, `raffle_id`)
- Timestamps: Use `timestamptz` type, store as UTC
- **NEVER** use camelCase in database identifiers

```sql
-- ✅ Correct
SELECT user_id, ticket_count, created_at FROM participants

-- ❌ Wrong
SELECT userId, ticketCount, createdAt FROM participants
```

### TypeScript/React

- Components: `PascalCase` (`RaffleWheel`, `TicketCircle`)
- Files: `camelCase.tsx` (`raffleWheel.tsx`, `ticketCircle.tsx`)
- Functions/variables: `camelCase` (`drawWinner`, `ticketCount`)
- Constants: `SCREAMING_SNAKE_CASE` (`RAFFLE_EVENTS`, `MAX_TICKETS`)
- Types/Interfaces: `PascalCase` (`Raffle`, `Participant`)

### Server Actions

**ALWAYS return `{ data, error }` tuple - NEVER throw errors:**

```typescript
// ✅ Correct
export async function drawWinner(raffleId: string): Promise<ActionResult<Winner>> {
  try {
    const winner = await selectWinner(raffleId)
    return { data: winner, error: null }
  } catch (e) {
    return { data: null, error: "Failed to draw winner" }
  }
}

// ❌ Wrong - throwing instead of returning error
export async function drawWinner(raffleId: string) {
  const winner = await selectWinner(raffleId)
  if (!winner) throw new Error("No winner")  // DON'T DO THIS
  return winner
}
```

### Real-time Events

- Event constants: `SCREAMING_SNAKE_CASE`
- Channel format: `raffle:${raffleId}:draw`
- Use Broadcast for ephemeral events (wheel sync)
- Use Postgres Changes for persistent state

```typescript
// Event naming
export const RAFFLE_EVENTS = {
  DRAW_START: 'DRAW_START',
  WHEEL_SEED: 'WHEEL_SEED',
  WINNER_REVEALED: 'WINNER_REVEALED',
} as const

// ❌ Wrong
channel.send({ event: 'draw-start' })  // Should be DRAW_START
```

### RLS Policies (Row-Level Security)

- **ONE policy per operation per role** - Combine conditions with OR, not separate policies
- **ALWAYS** wrap `auth.uid()` and `auth.role()` in `(SELECT ...)` for initplan optimization
- **NEVER** create recursive policies (policy querying same table without SECURITY DEFINER function)
- **AVOID** `USING (true)` - be explicit about access conditions

```sql
-- ✅ Correct - Single combined policy with initplan optimization
CREATE POLICY "Users can read participants" ON participants
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id  -- own records
    OR
    is_participant_in_raffle(raffle_id)  -- raffle participants
  );

-- ❌ Wrong - Multiple separate policies (lint 0006)
CREATE POLICY "Policy 1" ON table FOR SELECT USING (condition1);
CREATE POLICY "Policy 2" ON table FOR SELECT USING (condition2);

-- ❌ Wrong - No initplan optimization
USING (auth.uid() = user_id)  -- Should be (SELECT auth.uid())
```

Reference: https://supabase.com/docs/guides/database/database-advisors

### Validation

- **ALWAYS** use Zod for external data validation
- Schema naming: `{Entity}Schema` or `{Action}Schema`
- Validate at system boundaries (API input, form submission)

```typescript
export const CreateRaffleSchema = z.object({
  name: z.string().min(1),
  prizes: z.array(PrizeSchema),
})
```

---

## Project Structure

```
app/
  (auth)/          → OAuth login/callback
  (participant)/   → Mobile user experience
  (admin)/         → Organizer dashboard
components/
  ui/              → shadcn/ui primitives
  raffle/          → RaffleWheel, TicketCircle, WinnerCard
  admin/           → QRCodeDisplay, DrawControls
lib/
  supabase/        → Client utilities, realtime helpers
  actions/         → Server Actions (drawWinner, grantTicket)
  schemas/         → Zod validation schemas
```

---

## Testing Rules

- **Co-locate** tests with source: `raffleWheel.tsx` + `raffleWheel.test.tsx`
- Test utilities go in `/lib/test-utils.ts`
- Focus on critical paths: draw logic, ticket accumulation, real-time sync

---

## Integration Testing with Supabase

### Dual Instance Architecture

We run **two separate Supabase instances** to isolate development from testing:

| Instance | Ports | Purpose |
|----------|-------|---------|
| Dev | 54321-54327 | Manual testing, development |
| Test | 54421-54427 | Automated integration tests |

```
servus-raffle/
├── supabase/                    # DEV instance config
│   ├── config.toml
│   ├── migrations/              # SINGLE SOURCE OF TRUTH
│   └── seed.sql
│
└── supabase-test/               # TEST instance config
    └── supabase/
        ├── config.toml
        ├── migrations -> ../../supabase/migrations  # SYMLINK
        └── seed.sql             # Test-specific seed data
```

**Note:** Test instance uses a symlink to share migrations with dev. New migrations automatically apply to both instances.

### Commands

```bash
# Unit tests (mocked, fast)
npm run test

# Integration tests (real Supabase, slower)
npm run test:integration

# Dev instance management
npm run supabase:start
npm run supabase:stop
npm run supabase:reset
npm run supabase:status
npm run supabase:lint        # Postgres type/syntax check
npm run supabase:security    # Security Advisor checks (search_path, RLS, etc.)

# Test instance management
npm run supabase:test:start
npm run supabase:test:stop
npm run supabase:test:reset
```

### Writing Integration Tests

**Location:** Place integration tests in `__integration__` folders:
```
lib/actions/__integration__/tickets.integration.test.ts
```

**Test file naming:** `*.integration.test.ts`

**Template:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

describe('Feature Integration Tests', () => {
  let testUserId: string

  beforeAll(async () => {
    // Create test user via Supabase Auth Admin API
    const { data } = await adminClient.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true,
    })
    testUserId = data.user!.id

    // Create public.users record
    await adminClient.from('users').insert({
      id: testUserId,
      email: data.user!.email,
      name: 'Test User',
    })
  })

  afterAll(async () => {
    // Clean up test data
    await adminClient.from('users').delete().eq('id', testUserId)
    await adminClient.auth.admin.deleteUser(testUserId)
  })

  it('should test RLS policies with real database', async () => {
    // Test against real Supabase instance
  })
})
```

### CRITICAL: Integration Test Requirements for New Features

**When implementing any story that touches:**

1. **Database schema changes** → Add migration to `supabase/migrations/` (symlinked to test instance)
2. **RLS policies** → Add integration test verifying policy works correctly
3. **Server Actions with DB operations** → Add integration test for the action
4. **Authentication flows** → Add integration test with real auth

**Checklist for each story:**
- [ ] Unit tests (mocked) for component logic
- [ ] Integration tests for database operations
- [ ] Both test suites pass: `npm run test` AND `npm run test:integration`
- [ ] Security check passes: `npm run supabase:security` (0 issues)
- [ ] **Supabase Dashboard Lint Check**: Open Supabase Dashboard → Database → Linting → Verify 0 issues
  - Pay attention to: `0006_multiple_permissive_policies`, `0001_unindexed_foreign_keys`, `0002_auth_*`
  - Reference: https://supabase.com/docs/guides/database/database-advisors

### Test Data (Known UUIDs)

Test seed data uses predictable UUIDs for assertions:
```typescript
// From supabase-test/supabase/seed.sql
global.TEST_RAFFLE_ACTIVE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
global.TEST_RAFFLE_DRAFT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
global.TEST_RAFFLE_COMPLETED_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
```

### Prerequisites

- Docker Desktop running
- Both instances started: `npm run supabase:start && npm run supabase:test:start`
- `.env.test` configured (copy from `.env.test.example`)

---

## Error Handling

| Error Type | Handling |
|------------|----------|
| Validation | Inline form errors |
| Business logic | Toast notification |
| Network | Toast + retry option |
| Unexpected | Error boundary → Sentry |

```typescript
// Expected errors → toast
toast.error("No participants to draw from")

// Unexpected errors → caught by error boundary at layout level
```

---

## Critical Don't-Miss Rules

### Anti-Patterns to Avoid

1. **NEVER** throw from Server Actions - always return `{ data, error }`
2. **NEVER** use camelCase in database queries
3. **NEVER** mix event naming conventions (always SCREAMING_SNAKE_CASE)
4. **NEVER** access Supabase service role key from client
5. **NEVER** store secrets in NEXT_PUBLIC_* variables
6. **NEVER** skip integration tests for database/RLS changes
7. **NEVER** break the migrations symlink in `supabase-test/supabase/migrations`
8. **NEVER** create multiple permissive RLS policies for same operation/role (lint 0006)
9. **NEVER** skip Supabase Dashboard lint check before marking story complete

### Security Rules

- Admin check via environment allowlist (`ADMIN_EMAILS`)
- RLS policies enforce data access at database level
- Sensitive mutations (drawWinner) use Server Actions with service role
- OAuth tokens managed by Supabase Auth (never manual)

### Real-time Sync Critical Path

The wheel animation MUST be synchronized across all devices:
1. Admin triggers `drawWinner()` Server Action
2. Server Action broadcasts `DRAW_START` + `WHEEL_SEED` via Supabase Broadcast
3. ALL clients receive same seed and animate identically
4. Server Action broadcasts `WINNER_REVEALED` after animation duration
5. **NEVER** let clients independently calculate winner

---

## Quick Reference

| What | Convention |
|------|------------|
| DB tables | `snake_case` plural |
| DB columns | `snake_case` |
| Components | `PascalCase` |
| Files | `camelCase.tsx` |
| Server Actions | Return `{ data, error }` |
| Events | `SCREAMING_SNAKE_CASE` |
| Validation | Zod schemas |
| Unit tests | Co-located `*.test.tsx` |
| Integration tests | `__integration__/*.integration.test.ts` |
| Migrations | `supabase/migrations/` (symlinked to test) |

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Refer to `architecture.md` for detailed rationale

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

---

_Last Updated: 2025-12-26_
