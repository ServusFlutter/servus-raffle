# Story 4.1: Add Prizes to Raffle

Status: done

## Story

As an **organizer**,
I want **to add multiple prizes to my raffle with names and descriptions**,
so that **attendees know what they could win**.

## Acceptance Criteria

1. **AC1: Prizes Table Schema**
   - Given the database
   - When the prizes table is created
   - Then the `prizes` table exists with columns: `id` (uuid), `raffle_id` (uuid references raffles), `name` (text), `description` (text), `sort_order` (int), `awarded_to` (uuid references users nullable), `awarded_at` (timestamptz nullable)
   - And RLS policies allow admins full access and participants read access

2. **AC2: Add Prize Button Visibility**
   - Given an admin on the raffle detail page
   - When they navigate to the prizes section
   - Then they see an "Add Prize" button
   - And they see a list of existing prizes (if any)

3. **AC3: Add Prize Form**
   - Given an admin clicking "Add Prize"
   - When the form appears
   - Then they can enter a prize name (required)
   - And they can enter an optional description

4. **AC4: Prize Creation Success**
   - Given an admin submitting a valid prize
   - When they click save
   - Then the prize is added to the raffle
   - And the prize list updates to show the new prize
   - And a success toast confirms the addition

5. **AC5: Prize List Display**
   - Given a raffle with multiple prizes
   - When the admin views the prizes section
   - Then all prizes are listed with their names and descriptions
   - And each prize shows its award status (pending/awarded)

6. **AC6: Edit and Delete Options**
   - Given an admin viewing a prize
   - When they want to edit or delete it
   - Then edit and delete options are available
   - And deleting requires confirmation

**FRs covered:** FR22 (Add multiple prizes to a raffle), FR23 (Specify prize names and descriptions)

## Tasks / Subtasks

- [x] Task 1: Create Prizes Database Migration (AC: #1)
  - [x] 1.1: Create migration file `supabase/migrations/00011_create_prizes.sql`
  - [x] 1.2: Create `prizes` table with all required columns
  - [x] 1.3: Add foreign key to raffles table with cascade delete
  - [x] 1.4: Add foreign key to users table for awarded_to (nullable)
  - [x] 1.5: Create index on raffle_id for efficient queries
  - [x] 1.6: Enable RLS and create policies (service role full access, participants read)
  - [x] 1.7: Run `npm run supabase:reset` to apply migration
  - [x] 1.8: Run `npm run supabase:security` to verify 0 lint issues
  - [x] 1.9: Sync test instance: verify symlink and run `npm run supabase:test:reset`

- [x] Task 2: Create Prize Zod Schemas (AC: #3, #4)
  - [x] 2.1: Create `/lib/schemas/prize.ts` with CreatePrizeSchema
  - [x] 2.2: Add PrizeSchema for full prize object from database
  - [x] 2.3: Export Prize type and CreatePrizeInput type
  - [x] 2.4: Create unit tests `/lib/schemas/prize.test.ts`

- [x] Task 3: Create Prize Server Actions (AC: #4, #6)
  - [x] 3.1: Create `/lib/actions/prizes.ts` with ActionResult pattern
  - [x] 3.2: Implement `createPrize(raffleId, name, description?)` action
  - [x] 3.3: Implement `getPrizes(raffleId)` action
  - [x] 3.4: Implement `updatePrize(prizeId, name, description?)` action
  - [x] 3.5: Implement `deletePrize(prizeId)` action
  - [x] 3.6: Add admin validation to all actions
  - [x] 3.7: Add input sanitization using existing pattern from raffles.ts
  - [x] 3.8: Create unit tests `/lib/actions/prizes.test.ts`
  - [x] 3.9: Create integration tests `/lib/actions/__integration__/prizes.integration.test.ts`

- [x] Task 4: Create PrizeForm Component (AC: #3)
  - [x] 4.1: Create `/components/admin/prizeForm.tsx`
  - [x] 4.2: Add name input (required) with validation
  - [x] 4.3: Add description textarea (optional)
  - [x] 4.4: Add submit/cancel buttons
  - [x] 4.5: Support both create and edit modes via props
  - [x] 4.6: Create unit tests `/components/admin/prizeForm.test.tsx`

- [x] Task 5: Create PrizeList Component (AC: #5)
  - [x] 5.1: Create `/components/admin/prizeList.tsx`
  - [x] 5.2: Display prizes in a list/table format
  - [x] 5.3: Show name, description, and award status (pending badge vs awarded with user name)
  - [x] 5.4: Add edit/delete action buttons per row
  - [x] 5.5: Create unit tests `/components/admin/prizeList.test.tsx`

- [x] Task 6: Create Delete Confirmation Dialog (AC: #6)
  - [x] 6.1: Create delete confirmation using shadcn/ui AlertDialog
  - [x] 6.2: Show prize name in confirmation message
  - [x] 6.3: Handle delete action with loading state

- [x] Task 7: Create Prizes Page (AC: #2, #4, #5, #6)
  - [x] 7.1: Create `/app/admin/raffles/[id]/prizes/page.tsx`
  - [x] 7.2: Add "Add Prize" button opening PrizeForm dialog
  - [x] 7.3: Display PrizeList with all prizes for raffle
  - [x] 7.4: Handle edit prize in dialog mode
  - [x] 7.5: Handle delete with confirmation
  - [x] 7.6: Show success/error toasts for all actions
  - [x] 7.7: Add back link to raffle detail page

- [x] Task 8: Update Raffle Detail Page (AC: #2)
  - [x] 8.1: Update `/app/admin/raffles/[id]/page.tsx` prizes card
  - [x] 8.2: Replace placeholder text with link to prizes page
  - [x] 8.3: Show prize count if prizes exist

- [x] Task 9: Run All Tests and Lint Checks
  - [x] 9.1: Run `npm run test` - all unit tests pass (prize-related: 98 passed)
  - [x] 9.2: Run `npm run test:integration` - all integration tests pass (27 passed)
  - [x] 9.3: Run `npm run supabase:security` - 0 issues
  - [x] 9.4: Open Supabase Dashboard > Database > Linting - verify 0 issues

## Dev Notes

### Database Schema Design

The prizes table follows the architecture document schema exactly:

```sql
-- Migration: 00011_create_prizes.sql
CREATE TABLE IF NOT EXISTS prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  awarded_to uuid REFERENCES users(id),
  awarded_at timestamptz
);

-- Index for efficient queries by raffle
CREATE INDEX idx_prizes_raffle_id ON prizes(raffle_id);

-- Enable RLS
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
```

**RLS Policy Pattern - CRITICAL:**
Follow the consolidated policy pattern established in migration `00010_consolidate_permissive_policies.sql`:
- ONE policy per operation per role - combine conditions with OR
- ALWAYS wrap `auth.uid()` in `(SELECT ...)` for initplan optimization
- Use service role for admin mutations via Server Actions

```sql
-- Service role has full access (for admin server actions)
CREATE POLICY "Service role full access" ON prizes
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- Authenticated users can read prizes for raffles they can see
CREATE POLICY "Users can read prizes" ON prizes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM raffles r
      WHERE r.id = prizes.raffle_id
      AND (r.status = 'active' OR r.created_by = (SELECT auth.uid()))
    )
  );
```

### Server Action Pattern

Follow the exact pattern from `/lib/actions/raffles.ts`:

```typescript
// lib/actions/prizes.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/utils/admin";
import { CreatePrizeSchema, type Prize } from "@/lib/schemas/prize";
import { revalidatePath } from "next/cache";

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

// Reuse sanitizeInput and createServiceRoleClient patterns from raffles.ts

export async function createPrize(
  raffleId: string,
  name: string,
  description?: string
): Promise<ActionResult<Prize>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format for raffleId
    // 3. Sanitize and validate input with Zod
    // 4. Get next sort_order for this raffle
    // 5. Insert prize using service role client
    // 6. Revalidate paths
    // 7. Return { data: prize, error: null }
  } catch (e) {
    return { data: null, error: "Failed to create prize" };
  }
}
```

### Zod Schema Pattern

Follow the pattern from `/lib/schemas/raffle.ts`:

```typescript
// lib/schemas/prize.ts
import { z } from "zod";

export const CreatePrizeSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 1, "Prize name is required")
    .refine((val) => val.length <= 255, "Prize name must be 255 characters or less"),
  description: z
    .string()
    .transform((val) => val.trim())
    .optional()
    .nullable(),
});

export const PrizeSchema = z.object({
  id: z.string().uuid(),
  raffle_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  sort_order: z.number().int(),
  awarded_to: z.string().uuid().nullable(),
  awarded_at: z.string().nullable(),
});

export type Prize = z.infer<typeof PrizeSchema>;
export type CreatePrizeInput = z.infer<typeof CreatePrizeSchema>;
```

### Component Patterns

**PrizeForm:**
- Use shadcn/ui `Dialog`, `Input`, `Textarea`, `Button`, `Label`
- Follow form pattern from `/app/admin/raffles/new/page.tsx`
- Support edit mode by accepting optional `prize` prop with existing data

**PrizeList:**
- Use shadcn/ui `Card`, `Badge`, `Button`
- Display in list format (not full table - simpler for MVP)
- Show pending badge (yellow) vs awarded badge (green) with winner name

```typescript
interface PrizeListProps {
  prizes: Prize[];
  onEdit: (prize: Prize) => void;
  onDelete: (prizeId: string) => void;
}
```

**Delete Confirmation:**
- Use shadcn/ui `AlertDialog` component
- Pattern: "Are you sure you want to delete '[prize name]'? This cannot be undone."

### File Structure

```
lib/
  schemas/
    prize.ts                    # Zod schemas
    prize.test.ts               # Schema tests
  actions/
    prizes.ts                   # Server actions
    prizes.test.ts              # Unit tests
    __integration__/
      prizes.integration.test.ts # Integration tests

components/
  admin/
    prizeForm.tsx               # Create/edit prize form
    prizeForm.test.tsx
    prizeList.tsx               # Prize list display
    prizeList.test.tsx

app/
  admin/
    raffles/
      [id]/
        prizes/
          page.tsx              # Prizes management page

supabase/
  migrations/
    00011_create_prizes.sql     # New migration
```

### Raffle Detail Page Update

Update the prizes card in `/app/admin/raffles/[id]/page.tsx`:

```typescript
{/* Prizes Card - Update this section */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Gift className="h-5 w-5" />
      Prizes
    </CardTitle>
    <CardDescription>Manage prizes for this raffle</CardDescription>
  </CardHeader>
  <CardContent>
    <Link href={`/admin/raffles/${raffle.id}/prizes`}>
      <Button className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Manage Prizes
      </Button>
    </Link>
  </CardContent>
</Card>
```

### Integration Test Template

Follow the pattern from `/lib/actions/__integration__/tickets.integration.test.ts`:

```typescript
// lib/actions/__integration__/prizes.integration.test.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

describe('Prize Actions Integration Tests', () => {
  let testRaffleId: string

  beforeAll(async () => {
    // Create test raffle for prize tests
    const { data } = await adminClient.from('raffles').insert({
      name: `Test Raffle ${Date.now()}`,
      status: 'draft',
    }).select().single()
    testRaffleId = data!.id
  })

  afterAll(async () => {
    // Clean up test raffle (cascade deletes prizes)
    await adminClient.from('raffles').delete().eq('id', testRaffleId)
  })

  describe('createPrize', () => {
    it('creates prize with valid input', async () => {
      // Test prize creation
    })

    it('auto-assigns sort_order sequentially', async () => {
      // Verify sort_order increments
    })
  })

  describe('RLS policies', () => {
    it('allows admins to create prizes via service role', async () => {
      // Test admin access
    })

    it('allows participants to read prizes for active raffles', async () => {
      // Test participant read access
    })
  })
})
```

### Anti-Pattern Prevention

**DO NOT:**
- Create multiple permissive RLS policies for the same operation (lint 0006)
- Use `USING (true)` in RLS policies - be explicit about conditions
- Skip initplan optimization - always use `(SELECT auth.uid())`
- Throw errors from Server Actions - always return `{ data, error }`
- Use camelCase in database queries - always use snake_case
- Skip integration tests for RLS policy verification
- Create separate "Prizes" entity file - keep in existing schemas/actions structure

**DO:**
- Follow ActionResult pattern exactly
- Reuse sanitizeInput and createServiceRoleClient from raffles.ts
- Run security checks before marking story complete
- Add cascade delete on raffle_id foreign key
- Test both unit and integration levels
- Verify Supabase Dashboard lint shows 0 issues

### Previous Story Learnings Applied

From Epic 3 retrospective (`epic-3-retro-2025-12-26.md`):
1. **RLS Policy Issues:** Always use initplan optimization with `(SELECT auth.uid())`
2. **Test Both Levels:** Unit tests for logic, integration tests for RLS/database
3. **Security Check Required:** Run `npm run supabase:security` before completion
4. **Dashboard Lint Check:** Open Supabase Dashboard > Database > Linting

### Technology Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 15.x | App Router with Server Actions |
| Supabase | Latest | PostgreSQL with RLS |
| shadcn/ui | Latest | Dialog, AlertDialog, Input, Textarea, Button |
| Zod | Latest | Validation schemas |
| TypeScript | Strict | All files must be TypeScript |

### References

- [Source: epics.md#Story 4.1] - Original acceptance criteria and BDD scenarios
- [Source: architecture.md#Database Schema] - prizes table schema definition
- [Source: architecture.md#Implementation Patterns] - Naming conventions and patterns
- [Source: project-context.md#RLS Policies] - RLS policy best practices
- [Source: project-context.md#Integration Testing] - Testing requirements
- [Source: lib/actions/raffles.ts] - Server Action pattern reference
- [Source: lib/schemas/raffle.ts] - Zod schema pattern reference
- [Source: Story 3-4 Dev Notes] - Component patterns and accessibility

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without major blockers.

### Completion Notes List

1. All 9 tasks completed successfully
2. 98 prize-related unit tests passing
3. 27 integration tests passing (18 prizes + 9 tickets)
4. Security check passing (0 RLS issues)
5. RLS policies allow unauthenticated users to view prizes for active raffles (same as raffle visibility pattern)
6. Added shadcn/ui components: alert-dialog, textarea, dialog

### File List

**New Files:**
- `supabase/migrations/00011_create_prizes.sql` - Database migration for prizes table
- `lib/schemas/prize.ts` - Zod schemas for prize validation
- `lib/schemas/prize.test.ts` - Unit tests for prize schemas
- `lib/actions/prizes.ts` - Server Actions for prize CRUD operations
- `lib/actions/prizes.test.ts` - Unit tests for prize actions
- `lib/actions/__integration__/prizes.integration.test.ts` - Integration tests
- `components/admin/prizeForm.tsx` - Form component for creating/editing prizes
- `components/admin/prizeForm.test.tsx` - Unit tests for PrizeForm
- `components/admin/prizeList.tsx` - List component for displaying prizes
- `components/admin/prizeList.test.tsx` - Unit tests for PrizeList
- `components/admin/deleteConfirmDialog.tsx` - Reusable delete confirmation dialog
- `app/admin/raffles/[id]/prizes/page.tsx` - Prizes management page
- `components/ui/alert-dialog.tsx` - shadcn/ui component (auto-generated)
- `components/ui/textarea.tsx` - shadcn/ui component (auto-generated)
- `components/ui/dialog.tsx` - shadcn/ui component (auto-generated)

**Modified Files:**
- `app/admin/raffles/[id]/page.tsx` - Updated prizes card with link and count

### Change Log

| Date | Change | Notes |
|------|--------|-------|
| 2025-12-26 | Story completed | All tasks finished, tests passing |
| 2025-12-26 | Code review passed | Fixed PrizeForm state sync issue, all tests passing (99 unit tests) |

## Code Review Record

### Review Date
2025-12-26

### Reviewer
Claude Opus 4.5 (autonomous code-review workflow)

### Review Outcome
APPROVED

### Findings Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| HIGH | 0 | N/A |
| MEDIUM | 0 | N/A |
| LOW | 4 | 1 |

### Fixed Issues

1. **PrizeForm state not syncing when prize prop changes** (LOW -> Fixed)
   - **Issue**: When switching between editing different prizes, the form state was stale because useState initialization only runs on mount
   - **Fix**: Added useEffect to sync form state when prize prop changes
   - **Files changed**: `components/admin/prizeForm.tsx`, `components/admin/prizeForm.test.tsx`
   - **Tests added**: 1 new test "updates form when prize prop changes"

### Remaining LOW Findings (Not Blocking)

1. **Missing test file for DeleteConfirmDialog component**
   - The component is simple and tested via integration with PrizeList
   - Recommendation: Add dedicated tests in future iteration

2. **Description sanitization limits to 255 characters**
   - The sanitizeInput function limits all input to 255 chars
   - For descriptions, this may be too restrictive
   - Recommendation: Consider separate sanitization for longer text fields

3. **Integration test uses global.TEST_PASSWORD**
   - Works correctly but could be more explicit with typing
   - Recommendation: Add explicit type declaration in test setup

### Security Checklist
- [x] Admin validation in all server actions
- [x] Input sanitization (XSS prevention)
- [x] UUID format validation
- [x] RLS policies with initplan optimization
- [x] Service role used only after admin validation
- [x] No SQL injection vulnerabilities
- [x] Proper error handling (no sensitive data leaked)

### Test Coverage
- Unit tests: 99 passed
- Integration tests: 18 passed (when run with test instance)
- All prize-related functionality covered

