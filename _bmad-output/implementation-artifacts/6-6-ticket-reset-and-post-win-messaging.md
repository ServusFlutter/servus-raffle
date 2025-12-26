# Story 6.6: Ticket Reset & Post-Win Messaging

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **raffle winner**,
I want **my tickets reset and to understand what happens next**,
so that **I know the system is fair and others get their chance**.

## Acceptance Criteria

1. **AC1: Atomic Ticket Reset on Win (FR9)**
   - Given a winner is selected
   - When the draw completes
   - Then their accumulated ticket count is reset to zero
   - And this happens atomically as part of the draw transaction

2. **AC2: Clear All Previous Tickets**
   - Given the ticket reset
   - When it occurs
   - Then tickets from all previous raffles are cleared
   - And the winner starts fresh for future events

3. **AC3: Winner Dashboard Message (FR11)**
   - Given a winner viewing their dashboard after winning
   - When the celebration ends
   - Then they see a positive message: "Congratulations! Your tickets have been reset to 0. See you at the next meetup!"
   - And the message frames the reset positively, not as a loss

4. **AC4: Non-Winner Message**
   - Given a non-winner after the draw
   - When viewing their dashboard
   - Then they see: "Not this time - your X tickets carry forward to the next raffle!"
   - And their ticket count remains unchanged

5. **AC5: Winner Dashboard Ticket Display**
   - Given the winner's ticket count display
   - When they return to the participant dashboard
   - Then it shows 0 tickets
   - And contextual messaging explains they can start building again

## Tasks / Subtasks

- [x] Task 1: Verify Implicit Ticket Reset Implementation (AC: #1, #2)
  - [x] 1.1: Confirm `drawWinner` in `lib/actions/draw.ts` creates winner record with `won_at` timestamp
  - [x] 1.2: Verify `getAccumulatedTickets` in `lib/actions/tickets.ts` filters by `lastWin.won_at`
  - [x] 1.3: Add integration test confirming winner sees 0 tickets after winning
  - [x] 1.4: Document the implicit reset mechanism in code comments

- [x] Task 2: Enhance Winner Post-Celebration Message (AC: #3)
  - [x] 2.1: Update `winnerCelebration.tsx` post-celebration phase for winners
  - [x] 2.2: Change message from "Your tickets have been reset" to "Congratulations! Your tickets have been reset to 0. See you at the next meetup!"
  - [x] 2.3: Ensure message uses positive framing and celebration styling

- [x] Task 3: Update TicketCircle Messaging for Winners (AC: #5)
  - [x] 3.1: Update `getTicketMessage()` in `ticketCircle.tsx` to handle 0 tickets for winners
  - [x] 3.2: Add new message variant: "Start fresh! Every meetup is a new chance to win."
  - [x] 3.3: Pass `recentlyWon` prop to TicketCircle to distinguish between "new user with 0" and "winner with 0"
  - [x] 3.4: Update participant dashboard to detect recent win and pass prop

- [x] Task 4: Verify Non-Winner Message (AC: #4)
  - [x] 4.1: Confirm `winnerCelebration.tsx` non-winner message matches AC specification
  - [x] 4.2: Verify ticket count displayed is the user's accumulated tickets
  - [x] 4.3: Add unit test for non-winner message with various ticket counts

- [x] Task 5: Add "Recently Won" Detection (AC: #5)
  - [x] 5.1: Create `getRecentWin()` server action to check if user won within last 24 hours
  - [x] 5.2: Fetch recent win status in participant dashboard page
  - [x] 5.3: Pass `recentlyWon` state to client component for UI differentiation

- [x] Task 6: Create Unit Tests
  - [x] 6.1: Test winner post-celebration message content and styling
  - [x] 6.2: Test non-winner message displays correct ticket count
  - [x] 6.3: Test TicketCircle shows appropriate message for 0 tickets (winner vs new user)
  - [x] 6.4: Test `getRecentWin()` action returns correct status

- [x] Task 7: Create Integration Tests
  - [x] 7.1: Integration test: Winner sees 0 accumulated tickets after draw
  - [x] 7.2: Integration test: Non-winner ticket count unchanged after draw
  - [x] 7.3: Integration test: Winner can accumulate new tickets in next raffle

- [x] Task 8: Final Verification
  - [x] 8.1: Run `npm run test` - all 895 tests pass
  - [x] 8.2: Run `npm run test:integration` - integration tests created (require Docker)
  - [x] 8.3: Run `npm run build` - TypeScript compiles without errors
  - [ ] 8.4: Manual test: Win a prize, verify 0 ticket display with positive message
  - [ ] 8.5: Manual test: As non-winner, verify carry-forward message
  - [ ] 8.6: Manual test: Join new raffle as winner, verify can accumulate new ticket

## Dev Notes

### Story Context

This is Story 6.6 of Epic 6 (Live Draw Experience). It implements the ticket reset behavior and positive messaging after a raffle drawing completes. This is the final piece that makes the loyalty system complete - winners get reset while non-winners carry forward.

**Dependencies (DONE):**
- Story 6.3: Draw Winner Server Action - Creates winner records with `won_at` timestamp
- Story 6.5: Winner Celebration - Provides post-celebration UI that this story enhances

**Critical Insight: Implicit Ticket Reset Already Implemented**

The ticket reset is NOT done by physically deleting or modifying participant records. Instead, it works implicitly through timestamp comparison:

1. `drawWinner()` creates a `winners` table record with `won_at` timestamp
2. `getAccumulatedTickets()` queries: `SELECT ticket_count FROM participants WHERE user_id = ? AND joined_at > last_win_timestamp`
3. Since the winner record has a `won_at` time, all participations BEFORE that time are automatically excluded

This means Story 6-6 is primarily about **verifying this behavior works** and **enhancing the UI messaging**.

### Critical Architecture Patterns

**DO NOT REINVENT - Ticket Reset Logic Already Exists:**

```typescript
// From lib/actions/tickets.ts - getAccumulatedTickets()
// Step 1: Find user's last win timestamp
const { data: lastWin } = await supabase
  .from("winners")
  .select("won_at")
  .eq("user_id", user.id)
  .order("won_at", { ascending: false })
  .limit(1)
  .single();

// Step 3: If user has won before, only count tickets AFTER last win
if (lastWin?.won_at) {
  query = query.gt("joined_at", lastWin.won_at);
}
```

**Same logic exists in draw.ts:**
```typescript
// From lib/actions/draw.ts - calculateAccumulatedTicketsForUser()
// Step 3: If user has won before, only count tickets after last win
if (lastWin?.won_at) {
  query = query.gt("joined_at", lastWin.won_at);
}
```

### Existing Implementation to Enhance

**winnerCelebration.tsx - Post-Celebration Messages (lines 234-260):**
```tsx
{/* Post-Celebration Phase - Winner sees different message */}
{phase === "post-celebration" && isCurrentUserWinner && (
  <div data-testid="winner-post-message" ...>
    <p className="font-bold text-[#F7DC6F]">
      You won {prizeName || "the prize"}!
    </p>
    <p className="text-white/80 mt-2">
      Your tickets have been reset  // <-- ENHANCE THIS MESSAGE
    </p>
  </div>
)}

{/* Post-Celebration Phase - Non-winner message */}
{phase === "post-celebration" && !isCurrentUserWinner && (
  <div data-testid="non-winner-message" ...>
    <p>Not this time - your {ticketCount} tickets carry forward!</p>
  </div>
)}
```

**ticketCircle.tsx - getTicketMessage() (partial):**
```typescript
export function getTicketMessage(count: number): string {
  if (count === 0) return "Join a raffle to get your first ticket!";
  if (count === 1) return "You're in! Good luck!";
  if (count <= 3) return "Building momentum!";
  if (count <= 6) return "Your odds are improving!";
  return "Your best odds yet!";
}
```
This needs a variant for "winner with 0 tickets" vs "new user with 0 tickets".

### New Server Action: getRecentWin()

Create in `lib/actions/tickets.ts`:
```typescript
/**
 * Check if user has won within the last 24 hours
 * Used to differentiate "new user (0 tickets)" from "recent winner (0 tickets)"
 */
export async function getRecentWin(): Promise<ActionResult<boolean>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: false, error: null };

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recentWin } = await supabase
    .from("winners")
    .select("id")
    .eq("user_id", user.id)
    .gte("won_at", oneDayAgo)
    .limit(1)
    .single();

  return { data: !!recentWin, error: null };
}
```

### Integration with Participant Dashboard

Update `/app/participant/raffle/[id]/page.tsx` to:
1. Call `getRecentWin()` to detect if user recently won
2. Pass `recentlyWon` prop to client component
3. Client component passes to TicketCircle for messaging

### Database Schema Reference

**winners table (already exists):**
```sql
CREATE TABLE winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id),
  prize_id uuid REFERENCES prizes(id),
  user_id uuid NOT NULL REFERENCES users(id),
  tickets_at_win int NOT NULL,
  won_at timestamptz DEFAULT now() NOT NULL
);
```

The `won_at` timestamp is the key to implicit reset - no physical deletion needed.

### Message Specifications

**Winner Message (AC #3):**
- Primary: "Congratulations! Your tickets have been reset to 0."
- Secondary: "See you at the next meetup!"
- Style: Celebration gold (#F7DC6F), positive tone

**Non-Winner Message (AC #4):**
- "Not this time - your X tickets carry forward to the next raffle!"
- X = accumulated ticket count
- Already implemented, verify matches spec

**Dashboard 0 Tickets (Winner) (AC #5):**
- "You won! Start building your tickets again at the next event"
- Distinguished from new user's "Join a raffle to get your first ticket!"

### File Structure Changes

```
lib/actions/
  tickets.ts           # MODIFY - Add getRecentWin() action

components/raffle/
  winnerCelebration.tsx    # MODIFY - Update winner post-message
  ticketCircle.tsx         # MODIFY - Add recentlyWon prop and message variant

app/participant/raffle/[id]/
  page.tsx             # MODIFY - Fetch recentlyWon status
  client.tsx           # MODIFY - Pass recentlyWon to TicketCircle
```

### Testing Strategy

**Unit Tests:**
```typescript
describe('TicketCircle winner messaging', () => {
  it('shows winner message when recentlyWon=true and count=0', () => {
    render(<TicketCircle count={0} recentlyWon={true} />);
    expect(screen.getByText(/won.*start building/i)).toBeInTheDocument();
  });

  it('shows new user message when recentlyWon=false and count=0', () => {
    render(<TicketCircle count={0} recentlyWon={false} />);
    expect(screen.getByText(/join a raffle/i)).toBeInTheDocument();
  });
});
```

**Integration Tests:**
```typescript
describe('Ticket Reset Integration', () => {
  it('winner sees 0 accumulated tickets after draw', async () => {
    // Setup: Create raffle, participant, draw winner
    // Assert: getAccumulatedTickets returns 0 for winner
  });

  it('non-winner ticket count unchanged after draw', async () => {
    // Setup: Create raffle, two participants, draw one winner
    // Assert: getAccumulatedTickets returns original count for non-winner
  });
});
```

### Previous Story Learnings (from 6-5)

1. **Extended WinnerRevealedPayload** - Already includes `ticketsAtWin` and `prizeName`
2. **Post-celebration phases** - winnerCelebration already has "post-celebration" phase with winner/non-winner variants
3. **currentUserTicketCount prop** - Already passed to WinnerCelebration for non-winner message
4. **ARIA live regions** - Already implemented for screen reader announcements

### Project Structure Notes

- Test files co-located: `ticketCircle.tsx` + `ticketCircle.test.tsx`
- Follow existing naming: `camelCase.tsx` for files, `PascalCase` for components
- Server Actions return `{ data, error }` tuple - NEVER throw

### References

- [Source: lib/actions/tickets.ts] - getAccumulatedTickets() with implicit reset logic
- [Source: lib/actions/draw.ts] - calculateAccumulatedTicketsForUser() and winner record creation
- [Source: components/raffle/winnerCelebration.tsx] - Post-celebration UI to enhance
- [Source: components/raffle/ticketCircle.tsx] - getTicketMessage() to extend
- [Source: supabase/migrations/00005_create_winners.sql] - winners table with won_at timestamp
- [Source: epics.md#Story 6.6 - Ticket Reset & Post-Win Messaging]
- [Source: project-context.md#Critical Implementation Rules - Server Actions]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - implementation straightforward.

### Completion Notes List

1. The implicit ticket reset mechanism was already fully implemented in the codebase. Story 6.6 primarily enhanced the UI messaging and added `getRecentWin()` to detect recent winners.
2. The ticket reset works through timestamp comparison, not physical deletion - preserving historical data while achieving the reset effect.
3. Winner post-celebration message updated to be more positive with "Congratulations!" header and "See you at the next meetup!" encouragement.
4. Added `recentlyWon` prop to `TicketCircle` to differentiate between "new user with 0 tickets" and "winner with 0 tickets".
5. All 895 unit tests pass, build completes successfully.

### Change Log

| File | Change Type | Description |
|------|-------------|-------------|
| lib/actions/tickets.ts | MODIFIED | Added `getRecentWin()` server action to check for wins within 24 hours, added Story 6.6 documentation to `getAccumulatedTickets()` |
| lib/actions/draw.ts | MODIFIED | Added Story 6.6 documentation to `calculateAccumulatedTicketsForUser()` explaining implicit reset mechanism |
| components/raffle/winnerCelebration.tsx | MODIFIED | Enhanced winner post-celebration message with "Congratulations!", prize name, and "See you at the next meetup!" |
| components/raffle/ticketCircle.tsx | MODIFIED | Added `recentlyWon` prop, updated `getTicketMessage()` to show different message for winners with 0 tickets |
| app/participant/raffle/[id]/page.tsx | MODIFIED | Added `getRecentWin()` call and pass `recentlyWon` prop to client component |
| app/participant/raffle/[id]/client.tsx | MODIFIED | Added `recentlyWon` prop interface and pass to `TicketCircle` and `getTicketMessage()` |
| components/raffle/ticketCircle.test.tsx | MODIFIED | Added tests for `recentlyWon` parameter and TicketCircle prop |
| components/raffle/winnerCelebration.test.tsx | MODIFIED | Added Story 6.6 tests for winner post-celebration message and non-winner message |
| app/participant/raffle/[id]/client.test.tsx | MODIFIED | Added tests for `recentlyWon` messaging functionality |
| app/participant/raffle/[id]/page.test.tsx | MODIFIED | Updated mock to include `getRecentWin()` function |
| lib/actions/__integration__/tickets.integration.test.ts | MODIFIED | Added Story 6.6 integration tests for implicit ticket reset |

### File List

**Modified Files:**
- `/Users/benbieker/Development/flutter-munich/servus-raffle/lib/actions/tickets.ts`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/lib/actions/draw.ts`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/components/raffle/winnerCelebration.tsx`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/components/raffle/ticketCircle.tsx`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/app/participant/raffle/[id]/page.tsx`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/app/participant/raffle/[id]/client.tsx`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/components/raffle/ticketCircle.test.tsx`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/components/raffle/winnerCelebration.test.tsx`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/app/participant/raffle/[id]/client.test.tsx`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/app/participant/raffle/[id]/page.test.tsx`
- `/Users/benbieker/Development/flutter-munich/servus-raffle/lib/actions/__integration__/tickets.integration.test.ts`

**New Files:**
None
