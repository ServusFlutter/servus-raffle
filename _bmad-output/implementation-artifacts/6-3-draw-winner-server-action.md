# Story 6.3: Draw Winner Server Action

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **organizer**,
I want **to draw a winner fairly based on ticket counts**,
so that **participants with more tickets have proportionally higher chances**.

## Acceptance Criteria

1. **AC1: Atomic Transaction Execution**
   - Given the `drawWinner` Server Action
   - When called with a raffle ID and prize ID
   - Then it executes as an atomic transaction
   - And it returns `{ data: Winner, error: null }` on success

2. **AC2: Weighted Random Selection**
   - Given eligible participants
   - When selecting a winner
   - Then the selection is weighted by accumulated ticket count
   - And a participant with 5 tickets has 5x the chance of someone with 1 ticket

3. **AC3: Previous Winner Exclusion (FR25)**
   - Given a participant who already won in this raffle
   - When drawing for subsequent prizes
   - Then they are excluded from the eligible pool
   - And they cannot win multiple prizes in the same raffle

4. **AC4: Wheel Animation Seed Generation**
   - Given the winner selection
   - When a winner is chosen
   - Then a random seed is generated for the wheel animation
   - And the seed ensures identical animation on all devices

5. **AC5: Database Updates & Broadcast**
   - Given the Server Action execution
   - When the winner is determined
   - Then a record is created in the `winners` table
   - And the prize is marked as awarded (`awarded_to`, `awarded_at`)
   - And a `DRAW_START` event is broadcast with the wheel seed

6. **AC6: No Eligible Participants Handling**
   - Given no eligible participants
   - When the draw is attempted
   - Then it returns `{ data: null, error: "No eligible participants" }`
   - And an appropriate message is shown to the admin

## Tasks / Subtasks

- [x] Task 1: Create Draw Server Action File (AC: #1, #6)
  - [x] 1.1: Create `/lib/actions/draw.ts` with proper Server Action setup
  - [x] 1.2: Implement admin authentication check using existing `isAdmin()` utility
  - [x] 1.3: Add Zod validation schema for `drawWinner` inputs (raffleId, prizeId)
  - [x] 1.4: Implement proper error response format `{ data: null, error: string }`

- [x] Task 2: Implement Eligible Participant Query (AC: #2, #3)
  - [x] 2.1: Query participants who joined this raffle
  - [x] 2.2: Calculate accumulated tickets (sum across all raffles since last win)
  - [x] 2.3: Exclude users who already won in THIS raffle (check `winners` table)
  - [x] 2.4: Return list with user_id, name, and accumulated_tickets

- [x] Task 3: Implement Weighted Random Selection (AC: #2)
  - [x] 3.1: Build weighted pool array based on ticket counts
  - [x] 3.2: Select random winner from weighted pool
  - [x] 3.3: Ensure deterministic selection when same seed is used (for testing)

- [x] Task 4: Generate Wheel Animation Seed (AC: #4)
  - [x] 4.1: Generate cryptographically secure random seed
  - [x] 4.2: Calculate wheel segment index based on winner position and seed
  - [x] 4.3: Include seed in broadcast payload for client-side animation sync

- [x] Task 5: Implement Atomic Database Transaction (AC: #1, #5)
  - [x] 5.1: Use Supabase transaction or service role client
  - [x] 5.2: Insert record into `winners` table with `tickets_at_win`
  - [x] 5.3: Update `prizes` table: set `awarded_to` and `awarded_at`
  - [x] 5.4: Handle transaction rollback on any failure

- [x] Task 6: Implement Broadcast Events (AC: #5)
  - [x] 6.1: Use existing `broadcastDrawStart()` from `/lib/supabase/broadcast.ts`
  - [x] 6.2: Broadcast `DRAW_START` with prizeId, prizeName, seed, winnerId, winnerName
  - [x] 6.3: Log broadcast success/failure for debugging

- [x] Task 7: Create Winner Type Definitions
  - [x] 7.1: Define `Winner` type for return value
  - [x] 7.2: Define `DrawWinnerResult` with winner data and wheel seed
  - [x] 7.3: Export types from `/lib/actions/draw.ts` (inline with implementation)

- [x] Task 8: Create Unit Tests
  - [x] 8.1: Test weighted selection algorithm (verify 5x tickets = 5x chance)
  - [x] 8.2: Test winner exclusion from subsequent draws
  - [x] 8.3: Test "no eligible participants" error case
  - [x] 8.4: Test admin authorization (non-admin should fail)
  - [x] 8.5: Test atomic transaction (rollback on partial failure)

- [x] Task 9: Create Integration Tests
  - [x] 9.1: Create `__integration__/draw.integration.test.ts`
  - [x] 9.2: Test real database transaction with test data
  - [x] 9.3: Verify `winners` record created correctly
  - [x] 9.4: Verify `prizes.awarded_to` updated correctly
  - [x] 9.5: Test second draw excludes first winner

- [x] Task 10: Final Verification
  - [x] 10.1: Run `npm run test` - all 807 tests pass
  - [x] 10.2: Run `npm run build` - TypeScript compiles without errors
  - [x] 10.3: Run `npm run supabase:security` - no new issues (no database changes in this story)
  - [x] 10.4: Verify Supabase Dashboard lint - no new issues (no database changes in this story)

## Dev Notes

### Story Context

This is Story 6.3 of Epic 6 (Live Draw Experience). It implements the core draw logic that:
1. Selects a winner using weighted random selection based on accumulated tickets
2. Records the win in the database atomically
3. Broadcasts events for the synchronized wheel animation (Stories 6.4, 6.5)

**Dependencies:**
- Story 6.1: Admin Live Draw Mode (provides UI that calls this action) - DONE
- Story 6.2: Real-time Channel Setup (provides broadcast utilities) - DONE

**Used by:**
- Story 6.4: Wheel Animation (receives seed from DRAW_START broadcast)
- Story 6.5: Winner Celebration (receives winner info from broadcast)
- Story 6.7: Sequential Prize Drawing (calls this action for each prize)

### Critical Architecture Patterns

**Server Action Response Format (MANDATORY):**
```typescript
// ALWAYS return { data, error } - NEVER throw
export async function drawWinner(
  raffleId: string,
  prizeId: string
): Promise<ActionResult<DrawWinnerResult>> {
  try {
    // ... logic
    return { data: result, error: null };
  } catch (e) {
    console.error("Unexpected error:", e);
    return { data: null, error: "Failed to draw winner" };
  }
}
```

**Database Naming (snake_case ONLY):**
```typescript
// CORRECT
.from("winners").insert({
  raffle_id: raffleId,
  prize_id: prizeId,
  user_id: winner.id,
  tickets_at_win: accumulatedTickets,
});

// WRONG - will cause errors
.from("winners").insert({
  raffleId: raffleId,  // WRONG - use raffle_id
  prizeId: prizeId,    // WRONG - use prize_id
});
```

### Existing Code to Reuse

**DO NOT reinvent - use these existing utilities:**

1. **Admin Client** - `/lib/supabase/admin.ts`:
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
const adminClient = createAdminClient();
```

2. **Admin Check** - `/lib/utils/admin.ts`:
```typescript
import { isAdmin } from "@/lib/utils/admin";
if (!user?.email || !isAdmin(user.email)) {
  return { data: null, error: "Unauthorized" };
}
```

3. **Broadcast Utilities** - `/lib/supabase/broadcast.ts`:
```typescript
import { broadcastDrawStart, broadcastWheelSeed } from "@/lib/supabase/broadcast";

// Already implemented - just call them:
await broadcastDrawStart(raffleId, prizeId, prizeName);
await broadcastWheelSeed(raffleId, prizeId, seed);
```

4. **Event Constants** - `/lib/constants/events.ts`:
```typescript
import { RAFFLE_EVENTS, getBroadcastChannelName } from "@/lib/constants/events";
```

5. **Ticket Accumulation Query Pattern** - from `/lib/actions/tickets.ts`:
```typescript
// Step 1: Find user's last win timestamp
const { data: lastWin } = await supabase
  .from("winners")
  .select("won_at")
  .eq("user_id", userId)
  .order("won_at", { ascending: false })
  .limit(1)
  .single();

// Step 2: Only count tickets after last win
let query = supabase
  .from("participants")
  .select("ticket_count")
  .eq("user_id", userId);

if (lastWin?.won_at) {
  query = query.gt("joined_at", lastWin.won_at);
}
```

### Weighted Random Selection Algorithm

```typescript
/**
 * Select winner using weighted random selection
 * Each ticket gives one "entry" in the pool
 *
 * Example: If Alice has 5 tickets and Bob has 2 tickets:
 * - Pool has 7 entries: [Alice, Alice, Alice, Alice, Alice, Bob, Bob]
 * - Random number 0-6 selects winner
 * - Alice has 5/7 (71%) chance, Bob has 2/7 (29%) chance
 */
function selectWeightedWinner(
  participants: Array<{ userId: string; name: string; tickets: number }>
): { userId: string; name: string; tickets: number } | null {
  // Build weighted pool
  const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);
  if (totalTickets === 0) return null;

  // Select random entry
  const randomValue = Math.floor(Math.random() * totalTickets);

  let cumulative = 0;
  for (const participant of participants) {
    cumulative += participant.tickets;
    if (randomValue < cumulative) {
      return participant;
    }
  }

  // Fallback (should never reach)
  return participants[participants.length - 1];
}
```

### Database Schema Reference

**winners table** (from migration 00005):
```sql
CREATE TABLE winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id),
  prize_id uuid,  -- Now has prizes table
  user_id uuid NOT NULL REFERENCES users(id),
  tickets_at_win int NOT NULL,
  won_at timestamptz DEFAULT now() NOT NULL
);
```

**prizes table** (from migration 00011):
```sql
CREATE TABLE prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id),
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  awarded_to uuid REFERENCES users(id),
  awarded_at timestamptz
);
```

**participants table** (from migration 00004):
```sql
CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id),
  user_id uuid NOT NULL REFERENCES users(id),
  ticket_count int DEFAULT 1 NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(raffle_id, user_id)
);
```

### Query: Get Eligible Participants with Accumulated Tickets

```typescript
/**
 * Get participants eligible to win this prize
 * Excludes: Users who already won in THIS raffle
 * Includes: Accumulated tickets (sum since their last win in ANY raffle)
 */
async function getEligibleParticipants(
  adminClient: SupabaseClient,
  raffleId: string
): Promise<EligibleParticipant[]> {
  // 1. Get users who already won in THIS raffle
  const { data: existingWinners } = await adminClient
    .from("winners")
    .select("user_id")
    .eq("raffle_id", raffleId);

  const winnerUserIds = new Set(existingWinners?.map(w => w.user_id) || []);

  // 2. Get all participants in this raffle
  const { data: participants } = await adminClient
    .from("participants")
    .select(`
      user_id,
      users!inner (
        id,
        name
      )
    `)
    .eq("raffle_id", raffleId);

  // 3. For each participant, calculate accumulated tickets
  const eligible: EligibleParticipant[] = [];

  for (const p of participants || []) {
    // Skip if already won in THIS raffle
    if (winnerUserIds.has(p.user_id)) continue;

    // Get accumulated tickets (using pattern from tickets.ts)
    const accumulated = await calculateAccumulatedTickets(adminClient, p.user_id);

    if (accumulated > 0) {
      eligible.push({
        userId: p.user_id,
        name: p.users?.name || "Unknown",
        tickets: accumulated,
      });
    }
  }

  return eligible;
}
```

### Broadcast Payload Structure

The DRAW_START event should include everything needed for synchronized animation:

```typescript
// Combine DRAW_START and WHEEL_SEED into single broadcast
// (reduces latency vs two separate broadcasts)
const drawPayload = {
  raffleId,
  prizeId,
  prizeName: prize.name,
  winnerId: winner.userId,
  winnerName: winner.name,
  seed: generateSecureRandomSeed(), // 0-999999
  participantCount: eligibleParticipants.length,
};

await broadcastDrawStart(raffleId, prizeId, prize.name);
await broadcastWheelSeed(raffleId, prizeId, drawPayload.seed);
```

### Project Structure Notes

**File Location:**
```
lib/
  actions/
    draw.ts                 # NEW - Main drawWinner Server Action
    draw.test.ts            # NEW - Unit tests
  schemas/
    draw.ts                 # NEW - Zod schemas and types (optional, can use inline)
  actions/__integration__/
    draw.integration.test.ts  # NEW - Integration tests
```

**Follow patterns from existing actions:**
- See `/lib/actions/prizes.ts` for admin auth + service role client pattern
- See `/lib/actions/tickets.ts` for accumulated ticket calculation
- See `/lib/supabase/broadcast.ts` for broadcast implementation

### Testing Strategy

**Unit Tests (mocked Supabase):**
1. Weighted selection algorithm correctness
2. Winner exclusion from subsequent draws
3. Empty pool handling ("no eligible participants")
4. Admin authorization enforcement
5. Error response format compliance

**Integration Tests (real Supabase test instance):**
1. Full draw flow with real database
2. Verify `winners` record created with correct `tickets_at_win`
3. Verify `prizes.awarded_to` and `awarded_at` set
4. Second draw correctly excludes first winner
5. Transaction atomicity (both updates succeed or neither)

### Error Cases to Handle

| Scenario | Error Response |
|----------|---------------|
| Not authenticated | `{ data: null, error: "Not authenticated" }` |
| Not admin | `{ data: null, error: "Unauthorized: Admin access required" }` |
| Invalid raffle ID | `{ data: null, error: "Invalid raffle ID" }` |
| Invalid prize ID | `{ data: null, error: "Invalid prize ID" }` |
| Raffle not found | `{ data: null, error: "Raffle not found" }` |
| Prize not found | `{ data: null, error: "Prize not found" }` |
| Prize already awarded | `{ data: null, error: "Prize already awarded" }` |
| No eligible participants | `{ data: null, error: "No eligible participants" }` |
| Database error | `{ data: null, error: "Failed to draw winner" }` |

### Previous Story Learnings (from 6-2)

1. **Broadcast functions work** - Use `broadcastDrawStart()` and `broadcastWheelSeed()` from Story 6.2
2. **Connection indicator exists** - Live draw UI already shows connection status
3. **Event handlers ready** - Client components already have DRAW_START, WHEEL_SEED handlers
4. **State prepared** - `drawState` in client components ready to receive broadcast

### References

- [Source: architecture.md#API & Communication Patterns]
- [Source: architecture.md#Server Actions Required - drawWinner()]
- [Source: project-context.md#Server Actions - ALWAYS return { data, error }]
- [Source: lib/supabase/broadcast.ts] - Broadcast utilities
- [Source: lib/constants/events.ts] - Event constants
- [Source: lib/actions/tickets.ts] - Accumulated ticket calculation pattern
- [Source: lib/actions/prizes.ts] - Admin action pattern
- [Source: supabase/migrations/00005_create_winners.sql] - Winners table schema
- [Source: supabase/migrations/00011_create_prizes.sql] - Prizes table schema

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation completed without blocking issues.

### Completion Notes List

1. **Weighted Random Selection Algorithm**: Implemented using cumulative probability approach. Each participant gets entries proportional to their ticket count. Verified with statistical test (10,000 iterations) that 5 tickets gives ~5x the probability of 1 ticket.

2. **Winner Exclusion**: Users who have already won in the current raffle are excluded from subsequent draws. The `getEligibleParticipants` function queries the `winners` table first and filters them out.

3. **Accumulated Tickets**: Uses the pattern from `tickets.ts` - finds user's last win timestamp and only counts tickets from participations after that date. This implements the "tickets reset after winning" behavior.

4. **Broadcast Events**: Uses existing `broadcastDrawStart`, `broadcastWheelSeed`, and `broadcastWinnerRevealed` functions from Story 6.2. Broadcast failures are logged but don't fail the draw operation.

5. **Atomic Updates**: Winner record is created first, then prize is updated. If prize update fails, the winner record is deleted (rollback). Using service role client for all operations.

6. **Wheel Animation Seed**: Generated using `crypto.getRandomValues()` for cryptographic security, falling back to `Math.random()`. Range is 0-999999 for sufficient variety.

7. **Types**: All types (`Winner`, `DrawWinnerResult`, `EligibleParticipant`, `ActionResult`) are defined inline in `draw.ts` for co-location with implementation.

8. **Test Coverage**: 24 unit tests covering authorization, validation, weighted selection, winner exclusion, and error cases. 10 integration tests for database operations.

### File List

**New Files:**
- `lib/actions/draw.ts` - Main drawWinner Server Action with weighted selection
- `lib/actions/draw.test.ts` - Unit tests (24 tests)
- `lib/actions/__integration__/draw.integration.test.ts` - Integration tests (10 tests)

**Modified Files:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Status updated to review
- `_bmad-output/implementation-artifacts/6-3-draw-winner-server-action.md` - Story file updated

### Change Log

| Date | Change | Details |
|------|--------|---------|
| 2025-12-26 | Story implemented | Created drawWinner Server Action with weighted random selection, winner exclusion, atomic transactions, and broadcast events. All 807 tests pass, build succeeds. |
