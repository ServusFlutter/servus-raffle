# Story 3.3: Ticket Accumulation Across Events

Status: done

## Story

As a **loyal meetup attendee**,
I want **my tickets to accumulate across multiple events**,
so that **my continued attendance improves my chances of winning**.

## Acceptance Criteria

1. **AC1: Display Accumulated Ticket Count**
   - Given a user who has participated in multiple raffles
   - When they view their ticket count
   - Then it shows the sum of tickets from all raffles where they haven't won

2. **AC2: Exclude Won Raffle Tickets**
   - Given the ticket calculation
   - When querying accumulated tickets
   - Then tickets from raffles where the user won a prize are excluded
   - And tickets from all other raffles are summed

3. **AC3: Accumulation Display for Multi-Event Users**
   - Given a user attending their 5th event
   - When they join the current raffle
   - Then they see their accumulated count (e.g., 5 tickets if they never won)
   - And the display reflects tickets from all 5 events

4. **AC4: Post-Win Ticket Reset in Display**
   - Given a user who won in a previous raffle
   - When they view their ticket count
   - Then only tickets earned after their last win are counted
   - And pre-win tickets are not included

5. **AC5: Query Performance**
   - Given the database query
   - When calculating accumulated tickets
   - Then it efficiently joins participants and winners tables
   - And returns results within acceptable performance limits

## Tasks / Subtasks

- [x] Task 1: Create Winners Table (AC: #2, #4)
  - [x] 1.1: Create migration `00005_create_winners.sql` with table definition
  - [x] 1.2: Add columns: `id`, `raffle_id`, `prize_id`, `user_id`, `tickets_at_win`, `won_at`
  - [x] 1.3: Add foreign key references and indexes
  - [x] 1.4: Create RLS policies for winners table
  - [x] 1.5: Verify migration runs successfully

- [x] Task 2: Create getAccumulatedTickets Server Action (AC: #1, #2, #4, #5)
  - [x] 2.1: Create `getAccumulatedTickets` function in `/lib/actions/tickets.ts`
  - [x] 2.2: Implement query to sum tickets across all user's participation records
  - [x] 2.3: Implement logic to find user's last win timestamp
  - [x] 2.4: Exclude tickets from before the user's last win
  - [x] 2.5: Return accumulated count following ActionResult pattern
  - [x] 2.6: Add comprehensive unit tests

- [x] Task 3: Update Participant Dashboard (AC: #1, #3)
  - [x] 3.1: Update `/app/participant/raffle/[id]/page.tsx` to fetch accumulated tickets
  - [x] 3.2: Pass accumulated count to client component
  - [x] 3.3: Update TicketCircle to display accumulated count (not per-raffle count)
  - [x] 3.4: Update contextual messaging to reflect accumulated nature

- [x] Task 4: Integration Testing (All ACs)
  - [x] 4.1: Test single raffle scenario (returns 1 ticket)
  - [x] 4.2: Test multi-raffle accumulation (sums correctly)
  - [x] 4.3: Test post-win reset (excludes pre-win tickets)
  - [x] 4.4: Test performance with multiple records
  - [x] 4.5: Test edge cases (no participation, user with only wins)

## Dev Notes

### Database Schema for Winners Table

The `winners` table must be created to track wins for exclusion in accumulation calculation:

```sql
-- supabase/migrations/00005_create_winners.sql
CREATE TABLE IF NOT EXISTS winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  prize_id uuid NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tickets_at_win int NOT NULL,
  won_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_winners_raffle_id ON winners(raffle_id);
CREATE INDEX idx_winners_user_won_at ON winners(user_id, won_at DESC);

-- RLS Policies
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON winners
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own wins" ON winners
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read winner announcements" ON winners
  FOR SELECT
  USING (true);
```

**Security Note:** The "Public can read winner announcements" policy allows all authenticated users to read winner records. This is intentional for public winner displays and raffle history features (Epic 5). The policy does not expose sensitive data - only user_id (which maps to public profiles), raffle_id, and win timestamp.

**Note:** The `prizes` table does not exist yet - it will be created in Epic 4. For now, create the winners table with the `prize_id` column as nullable or defer this migration until Epic 4 if strictly necessary. However, since Story 6.3 (Draw Winner) will need both tables, create the structure now with nullable prize_id:

```sql
prize_id uuid REFERENCES prizes(id) ON DELETE SET NULL,  -- Nullable until Epic 4
```

### Accumulation Query Logic

The core query must:
1. Sum `ticket_count` from all `participants` records for the user
2. Find the user's most recent win timestamp from `winners` table
3. Exclude participation records with `joined_at` before the last win

```typescript
// /lib/actions/tickets.ts - getAccumulatedTickets implementation

export async function getAccumulatedTickets(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: "Not authenticated" };
    }

    // Step 1: Find user's last win timestamp
    const { data: lastWin } = await supabase
      .from('winners')
      .select('won_at')
      .eq('user_id', user.id)
      .order('won_at', { ascending: false })
      .limit(1)
      .single();

    // Step 2: Build query for accumulated tickets
    let query = supabase
      .from('participants')
      .select('ticket_count')
      .eq('user_id', user.id);

    // Step 3: If user has won before, only count tickets after last win
    if (lastWin?.won_at) {
      query = query.gt('joined_at', lastWin.won_at);
    }

    const { data: participations, error } = await query;

    if (error) {
      console.error('Failed to get accumulated tickets:', error);
      return { data: null, error: "Failed to get ticket count" };
    }

    // Sum all ticket counts
    const total = participations?.reduce((sum, p) => sum + (p.ticket_count || 0), 0) || 0;

    return { data: total, error: null };
  } catch (e) {
    console.error('Unexpected error getting accumulated tickets:', e);
    return { data: null, error: "Failed to get ticket count" };
  }
}
```

### Existing Code to Modify

**Current TicketCircle Display:**
The participant dashboard at `/app/participant/raffle/[id]/page.tsx` currently displays the per-raffle ticket count. Update it to:
1. Call `getAccumulatedTickets()` to get the accumulated total
2. Pass accumulated count to TicketCircle component
3. Keep per-raffle count available for comparison if needed

**Files to Modify:**
- `/app/participant/raffle/[id]/page.tsx` - Add accumulated tickets fetch
- `/app/participant/raffle/[id]/client.tsx` - Accept accumulated tickets prop
- `/lib/actions/tickets.ts` - Add `getAccumulatedTickets` function
- `/components/raffle/ticketCircle.tsx` - No changes needed (already accepts count prop)

### Integration with Existing Components

The TicketCircle component already supports displaying any count:
```typescript
interface TicketCircleProps {
  count: number;
  size?: 'default' | 'large' | 'projection';
  className?: string;
}
```

The contextual messaging in `getTicketMessage()` already handles various count ranges:
- 0: "Join a raffle to get started!"
- 1: "You're in! Good luck!"
- 2-3: "Building momentum!"
- 4-5: "Looking strong!"
- 6+: "Your best odds yet!"

This messaging naturally supports accumulated counts without modification.

### Testing Strategy

**Unit Tests for getAccumulatedTickets:**
```typescript
describe('getAccumulatedTickets', () => {
  it('returns 0 for user with no participation', async () => {
    // ...
  });

  it('returns ticket_count for single raffle participation', async () => {
    // ...
  });

  it('sums tickets across multiple raffles', async () => {
    // User joined 3 raffles with 1 ticket each = 3 total
  });

  it('excludes tickets from before last win', async () => {
    // User won on Day 3, only count tickets from Day 4+
  });

  it('returns 0 immediately after winning', async () => {
    // User just won with 5 tickets, now has 0
  });

  it('accumulates new tickets after winning', async () => {
    // User won, then joined 2 more raffles = 2 total
  });
});
```

**Integration Tests:**
- End-to-end test: User joins multiple raffles, sees accumulated count
- Dashboard displays accumulated vs per-raffle correctly

### Performance Considerations (AC #5)

1. **Index Usage:** The query uses indexes on `user_id` and `joined_at`
2. **Single Query Pattern:** The implementation uses two queries (last win + sum) but could be optimized with a single SQL function if performance becomes an issue
3. **Caching:** Consider caching accumulated count on the participants table or using React Query/SWR on the client for repeat views

**Alternative: Single SQL Query via RPC (if needed for performance):**
```sql
CREATE OR REPLACE FUNCTION get_accumulated_tickets(p_user_id uuid)
RETURNS int AS $$
DECLARE
  last_win_at timestamptz;
  total_tickets int;
BEGIN
  -- Get last win timestamp
  SELECT won_at INTO last_win_at
  FROM winners
  WHERE user_id = p_user_id
  ORDER BY won_at DESC
  LIMIT 1;

  -- Sum tickets after last win (or all if never won)
  SELECT COALESCE(SUM(ticket_count), 0) INTO total_tickets
  FROM participants
  WHERE user_id = p_user_id
    AND (last_win_at IS NULL OR joined_at > last_win_at);

  RETURN total_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Anti-Pattern Prevention

**DO NOT:**
- Store accumulated count in a separate column (compute on read for accuracy)
- Use client-side calculation (security risk, could be manipulated)
- Forget to handle the "no wins" case (should sum all tickets)
- Use multiple database round trips where one would suffice
- Cache aggressively without invalidation strategy

**DO:**
- Follow ActionResult pattern `{ data, error }`
- Use snake_case for database columns (`ticket_count`, `won_at`)
- Use camelCase for TypeScript (`getAccumulatedTickets`, `lastWin`)
- Co-locate tests with source files
- Handle all error cases gracefully

### Project Structure Notes

**File Locations:**
- Migration: `/supabase/migrations/00005_create_winners.sql`
- Server Action: `/lib/actions/tickets.ts` (extend existing file)
- Tests: `/lib/actions/tickets.test.ts` (extend existing file)

**Dependencies on Prior Stories:**
- Story 3-1: `participants` table exists
- Story 3-2: TicketCircle component exists

**Forward Compatibility:**
- Winners table structure matches Epic 6 requirements for draw winner
- `tickets_at_win` column preserved for historical display
- `prize_id` nullable until Epic 4 creates prizes table

### References

- [Source: epics.md#Story 3.3] - Original acceptance criteria
- [Source: epics.md#Story 5.2] - Winners table schema reference (raffle history)
- [Source: architecture.md#Database Schema] - Database naming conventions
- [Source: project-context.md#Server Actions] - ActionResult pattern
- [Source: Story 3-1 Dev Notes] - Participants table structure
- [Source: Story 3-2 Dev Notes] - TicketCircle component interface

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debugging issues encountered during implementation.

### Completion Notes List

1. Created `winners` table migration with nullable `prize_id` (deferred until Epic 4 creates prizes table)
2. Implemented `getAccumulatedTickets()` server action following ActionResult pattern
3. Added 8 unit tests for getAccumulatedTickets covering all ACs:
   - Authentication check
   - No participation returns 0
   - Single raffle returns 1
   - Multi-raffle accumulation sums correctly
   - Post-win reset excludes pre-win tickets
   - Immediate post-win returns 0
   - New tickets after winning accumulate
   - Database error handling
4. Updated participant dashboard to fetch and display accumulated tickets
5. Added "Tickets accumulated across events" message for multi-event users
6. All 369 tests pass with no regressions

### File List

**New Files:**
- `supabase/migrations/00005_create_winners.sql` - Winners table migration with RLS policies

**Modified Files:**
- `lib/actions/tickets.ts` - Added `getAccumulatedTickets()` server action
- `lib/actions/tickets.test.ts` - Added 8 unit tests for getAccumulatedTickets
- `app/participant/raffle/[id]/page.tsx` - Fetches accumulated tickets and passes to client
- `app/participant/raffle/[id]/client.tsx` - Accepts perRaffleTicketCount prop, displays accumulation message
- `app/participant/raffle/[id]/client.test.tsx` - Added tests for accumulated tickets display
- `app/participant/raffle/[id]/page.test.tsx` - Added mock for getAccumulatedTickets

### Change Log

- 2025-12-25: Implemented Story 3.3 Ticket Accumulation Across Events
  - Created winners table migration for tracking wins
  - Added getAccumulatedTickets server action with post-win reset logic
  - Updated participant dashboard to show accumulated ticket count
  - Added contextual messaging for multi-event users
  - All acceptance criteria satisfied with comprehensive test coverage

- 2025-12-25: Code Review - Fixes Applied (Claude Opus 4.5)
  - Fixed unused `perRaffleTicketCount` prop - now used to calculate `isMultiEventUser` flag
  - Updated accumulation message logic: shows when ticketCount > perRaffleTicketCount (more accurate)
  - Fixed documentation inconsistency: index name `idx_winners_user_won_at` now matches migration
  - Added security documentation for public winner announcements RLS policy

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5
**Date:** 2025-12-25
**Outcome:** APPROVED

### Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| HIGH | 1 | Fixed |
| MEDIUM | 2 | Fixed |
| LOW | 3 | Documented |

### HIGH Issues (Fixed)
1. **Unused prop causing TypeScript/ESLint warnings** - `perRaffleTicketCount` was passed but unused in client.tsx. Fixed by using it to calculate `isMultiEventUser` flag for more accurate accumulation display.

### MEDIUM Issues (Fixed)
1. **Documentation inconsistency** - Story Dev Notes referenced `idx_winners_won_at` but migration uses `idx_winners_user_won_at`. Fixed documentation to match implementation.
2. **RLS policy security consideration** - Added security documentation explaining the intentional public read access for winner announcements (required for future Epic 5 winner display features).

### LOW Issues (Documented - No Fix Required)
1. **perRaffleTicketCount could enable enhanced UX** - Future enhancement could show "5 total (1 from this event)" style messaging.
2. **Accumulated message edge case** - Users with exactly ticketCount == perRaffleTicketCount won't see message, which is correct behavior.
3. **Pre-existing TypeScript errors in test files** - Mock typing issues exist in other test files (not introduced by this story).

### Verification
- All 24 client.test.tsx tests pass
- All 24 tickets.test.ts tests pass
- All page.test.tsx tests pass
- Git status shows expected modified files

