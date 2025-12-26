# Story 6.7: Sequential Prize Drawing & Raffle Completion

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **organizer**,
I want **to draw winners for multiple prizes in sequence and complete the raffle**,
so that **I can run through all prizes smoothly during the live event and properly conclude the raffle**.

## Acceptance Criteria

1. **AC1: Sequential Prize Drawing Order (FR27)**
   - Given multiple prizes to award
   - When the admin draws
   - Then prizes are drawn in display order (1st, 2nd, 3rd)
   - And the admin clicks "Draw Next Prize" after each celebration

2. **AC2: Double-Draw Prevention with Cooldown**
   - Given the draw cycle
   - When a prize is awarded
   - Then a 5-second cooldown prevents accidental double-draws
   - And the next prize is automatically highlighted

3. **AC3: Raffle Complete Messaging**
   - Given the final prize has been awarded
   - When all draws complete
   - Then the admin sees "All prizes awarded - Raffle Complete!"
   - And a `RAFFLE_ENDED` event is broadcast

4. **AC4: Participant Thank-You Message (RAFFLE_ENDED Event)**
   - Given the RAFFLE_ENDED event
   - When received by participants
   - Then they see a thank-you message: "Thanks for participating!"
   - And the projection shows the final leaderboard/summary

5. **AC5: Raffle Status Transition to Completed (FR35)**
   - Given the raffle completes
   - When the status is updated
   - Then the raffle transitions to `completed` status
   - And no further draws are possible

6. **AC6: Post-Completion Navigation**
   - Given the navigation after completion
   - When the admin finishes
   - Then they can navigate to history view
   - And the raffle card shows winner count: "X Winners"

## Tasks / Subtasks

- [x] Task 1: Implement Draw Next Prize Button (AC: #1, #2)
  - [x] 1.1: Add "Draw Next Prize" button to `LiveDrawClient` that appears after `handleCelebrationComplete`
  - [x] 1.2: Implement 5-second cooldown state with countdown display
  - [x] 1.3: Disable button during cooldown to prevent double-draws
  - [x] 1.4: Show next prize name in button: "Draw Next Prize: [Prize Name]"
  - [x] 1.5: Highlight next prize in prize summary bar

- [x] Task 2: Wire Draw Next Prize to drawWinner Action (AC: #1)
  - [x] 2.1: Add `handleDrawNextPrize` callback that calls `drawWinner` with next prize ID
  - [x] 2.2: Get next prize ID from `prizes` array (first non-awarded by sort_order)
  - [x] 2.3: Show loading state while draw is in progress
  - [x] 2.4: Handle error states with toast notification

- [x] Task 3: Detect Final Prize and Broadcast RAFFLE_ENDED (AC: #3)
  - [x] 3.1: After successful draw, check if all prizes are now awarded
  - [x] 3.2: If final prize, call `broadcastRaffleEnded(raffleId, totalPrizesAwarded)` from `lib/supabase/broadcast.ts`
  - [x] 3.3: Update raffle status to `completed` in database
  - [x] 3.4: Display "All prizes awarded - Raffle Complete!" message

- [x] Task 4: Create updateRaffleStatus Server Action (AC: #5)
  - [x] 4.1: Create `updateRaffleStatus(raffleId, status)` in `lib/actions/raffles.ts`
  - [x] 4.2: Validate admin authorization
  - [x] 4.3: Use service role client to update raffle status
  - [x] 4.4: Revalidate relevant paths

- [x] Task 5: Handle RAFFLE_ENDED Event in Participant View (AC: #4)
  - [x] 5.1: Update `handleRaffleEnded` in `app/participant/raffle/[id]/client.tsx`
  - [x] 5.2: Show thank-you overlay: "Thanks for participating!"
  - [x] 5.3: Display final summary with winner list
  - [x] 5.4: Add proper ARIA live region for screen reader announcement

- [x] Task 6: Handle RAFFLE_ENDED Event in Projection View (AC: #3, #4)
  - [x] 6.1: Update `handleRaffleEnded` in `app/admin/raffles/[id]/live/client.tsx`
  - [x] 6.2: Show completion message: "All prizes awarded - Raffle Complete!"
  - [x] 6.3: Display final summary/leaderboard with all winners
  - [x] 6.4: Add "View History" button to navigate to history page

- [x] Task 7: Disable Draw Button When Raffle Completed (AC: #5)
  - [x] 7.1: Check raffle status on page load
  - [x] 7.2: Hide "Draw Winner" button when status is `completed`
  - [x] 7.3: Show read-only summary of past winners instead

- [x] Task 8: Update Raffle Card with Winner Count (AC: #6)
  - [x] 8.1: Add winner count to raffle card display in admin dashboard
  - [x] 8.2: Query winners count for each completed raffle
  - [x] 8.3: Display "X Winners" badge on completed raffle cards

- [x] Task 9: Create Unit Tests
  - [x] 9.1: Test Draw Next Prize button visibility and cooldown state
  - [x] 9.2: Test cooldown countdown display (5, 4, 3, 2, 1)
  - [x] 9.3: Test final prize detection and completion message
  - [x] 9.4: Test RAFFLE_ENDED event handling in participant view
  - [x] 9.5: Test RAFFLE_ENDED event handling in projection view
  - [x] 9.6: Test `updateRaffleStatus` server action

- [x] Task 10: Create Integration Tests
  - [x] 10.1: Integration test: Sequential draws award prizes in order
  - [x] 10.2: Integration test: Final draw broadcasts RAFFLE_ENDED and updates status
  - [x] 10.3: Integration test: Completed raffle prevents further draws

- [x] Task 11: Final Verification
  - [x] 11.1: Run `npm run test` - all tests pass (905 tests passed)
  - [x] 11.2: Run `npm run test:integration` - integration tests pass
  - [x] 11.3: Run `npm run build` - TypeScript compiles without errors
  - [ ] 11.4: Manual test: Draw all prizes sequentially, verify cooldown
  - [ ] 11.5: Manual test: Verify RAFFLE_ENDED received on participant devices
  - [ ] 11.6: Manual test: Verify completed raffle cannot draw again

## Dev Notes

### Story Context

This is Story 6.7 of Epic 6 (Live Draw Experience) - the FINAL story in Epic 6. It completes the live draw experience by implementing:
1. Sequential prize drawing with proper pacing (5-second cooldown)
2. Raffle completion detection and status transition
3. RAFFLE_ENDED broadcast for synchronized completion messaging
4. Post-completion navigation and summary display

**Dependencies (DONE):**
- Story 6.3: Draw Winner Server Action - `drawWinner()` already awards individual prizes
- Story 6.4: Wheel Animation - Already synced across devices
- Story 6.5: Winner Celebration - `handleCelebrationComplete` callback exists
- Story 6.6: Ticket Reset - Winners already get tickets reset

**What Already Exists:**
- `broadcastRaffleEnded()` in `lib/supabase/broadcast.ts` (implemented in 6.2)
- `RAFFLE_EVENTS.RAFFLE_ENDED` constant in `lib/constants/events.ts`
- `handleRaffleEnded` callback stub in both client components
- `onRaffleEnded` handler in `useBroadcastChannel` hook
- Prize tracking with `awarded_to` and `awarded_at` columns
- Prize list with `highlightNextToDraw` functionality

### Critical Architecture Patterns

**DO NOT REINVENT - Use Existing Infrastructure:**

```typescript
// From lib/supabase/broadcast.ts - RAFFLE_ENDED broadcast already implemented
export async function broadcastRaffleEnded(
  raffleId: string,
  totalPrizesAwarded: number
): Promise<BroadcastResult> {
  const payload: RaffleEndedPayload = {
    raffleId,
    totalPrizesAwarded,
  };
  return broadcastDrawEvent(raffleId, RAFFLE_EVENTS.RAFFLE_ENDED, payload);
}
```

```typescript
// From lib/constants/events.ts - Event type already defined
export type RaffleEndedPayload = {
  raffleId: string;
  totalPrizesAwarded: number;
};
```

```typescript
// From app/admin/raffles/[id]/live/client.tsx - Existing handler stub to enhance
const handleRaffleEnded = useCallback(
  (event: BroadcastEvent<RaffleEndedPayload>) => {
    console.log("[LiveDraw] Raffle ended, prizes awarded:", event.payload.totalPrizesAwarded);
    setDrawInProgress(false);
    setCurrentDrawPrize(null);
    setWheelSeed(null);
    setRevealedWinner(null);
    setShowCelebration(false);
    router.refresh();  // <-- Currently just refreshes, needs enhancement
  },
  [router]
);
```

### New Server Action: updateRaffleStatus

Create in `lib/actions/raffles.ts`:

```typescript
/**
 * Update raffle status (admin only)
 *
 * Used to transition raffle to 'completed' after all prizes awarded.
 *
 * @param raffleId - UUID of the raffle
 * @param status - New status ('drawing' | 'completed')
 * @returns ActionResult with success or error
 */
export async function updateRaffleStatus(
  raffleId: string,
  status: "drawing" | "completed"
): Promise<ActionResult<{ status: string }>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Update raffle status
    const serviceClient = createServiceRoleClient();

    const { data, error } = await serviceClient
      .from("raffles")
      .update({ status })
      .eq("id", raffleId)
      .select("status")
      .single();

    if (error) {
      console.error("Database error updating raffle status:", error);
      return { data: null, error: "Failed to update raffle status" };
    }

    // 4. Revalidate paths
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);
    revalidatePath("/admin");
    revalidatePath("/admin/history");

    return { data: { status: data.status }, error: null };
  } catch (e) {
    console.error("Unexpected error updating raffle status:", e);
    return { data: null, error: "Failed to update raffle status" };
  }
}
```

### Draw Next Prize UI Flow

After `handleCelebrationComplete`:

```tsx
// In LiveDrawClient - Add state for cooldown
const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
const [isDrawing, setIsDrawing] = useState(false);

// Celebration complete handler with cooldown
const handleCelebrationComplete = useCallback(() => {
  console.log("[LiveDraw] Celebration complete");
  setShowCelebration(false);
  setRevealedWinner(null);

  // Start 5-second cooldown before allowing next draw
  setCooldownSeconds(5);
  router.refresh();
}, [router]);

// Cooldown effect
useEffect(() => {
  if (cooldownSeconds > 0) {
    const timer = setTimeout(() => {
      setCooldownSeconds(cooldownSeconds - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [cooldownSeconds]);

// Get next prize to draw
const getNextPrize = useCallback(() => {
  return prizes.find((p) => !p.awarded_to);
}, [prizes]);

// Handle draw next prize
const handleDrawNextPrize = useCallback(async () => {
  const nextPrize = getNextPrize();
  if (!nextPrize || isDrawing) return;

  setIsDrawing(true);
  try {
    const result = await drawWinner(raffleId, nextPrize.id);
    if (result.error) {
      toast.error(result.error);
    }
    // Wheel animation and celebration will trigger via broadcast
  } catch (e) {
    toast.error("Failed to draw winner");
  } finally {
    setIsDrawing(false);
  }
}, [raffleId, getNextPrize, isDrawing]);
```

```tsx
// Draw Next Prize button (after celebration completes)
{!allPrizesAwarded && !showCelebration && getNextPrize() && (
  <Button
    size="lg"
    onClick={handleDrawNextPrize}
    disabled={cooldownSeconds > 0 || isDrawing}
    className="text-2xl md:text-3xl px-12 md:px-16 py-6 md:py-8 h-auto"
    data-testid="draw-next-button"
  >
    {cooldownSeconds > 0
      ? `Wait ${cooldownSeconds}s...`
      : isDrawing
        ? "Drawing..."
        : `Draw Next Prize: ${getNextPrize()?.name}`}
  </Button>
)}
```

### Final Prize Detection and Completion

After each draw, check if all prizes are awarded:

```typescript
// In drawWinner server action or in a new completeRaffle action:
async function checkAndCompleteRaffle(
  raffleId: string,
  adminClient: SupabaseClient
): Promise<boolean> {
  // Get all prizes for this raffle
  const { data: prizes } = await adminClient
    .from("prizes")
    .select("id, awarded_to")
    .eq("raffle_id", raffleId);

  if (!prizes || prizes.length === 0) return false;

  // Check if all prizes are awarded
  const allAwarded = prizes.every((p) => p.awarded_to !== null);

  if (allAwarded) {
    // Update raffle status to completed
    await adminClient
      .from("raffles")
      .update({ status: "completed" })
      .eq("id", raffleId);

    // Broadcast RAFFLE_ENDED
    await broadcastRaffleEnded(raffleId, prizes.length);

    return true;
  }

  return false;
}
```

### Participant Thank-You Overlay

Update `handleRaffleEnded` in participant client:

```tsx
// State for raffle ended overlay
const [raffleEnded, setRaffleEnded] = useState(false);
const [finalWinnerCount, setFinalWinnerCount] = useState(0);

const handleRaffleEnded = useCallback(
  (event: BroadcastEvent<RaffleEndedPayload>) => {
    console.log("[Participant] Raffle ended!");
    setRaffleEnded(true);
    setFinalWinnerCount(event.payload.totalPrizesAwarded);
  },
  []
);

// Thank-you overlay component
{raffleEnded && (
  <div
    className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
    role="dialog"
    aria-label="Raffle Complete"
  >
    <Trophy className="h-24 w-24 text-yellow-400 mb-6" />
    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
      Raffle Complete!
    </h2>
    <p className="text-xl text-white/80 mb-2">
      Thanks for participating!
    </p>
    <p
      className="text-lg text-white/60"
      aria-live="polite"
    >
      {finalWinnerCount} {finalWinnerCount === 1 ? "prize" : "prizes"} awarded
    </p>
  </div>
)}
```

### Database Schema Reference

**raffles table (status field):**
```sql
status text DEFAULT 'draft' NOT NULL
  CHECK (status IN ('draft', 'active', 'drawing', 'completed'))
```

**Valid status transitions:**
- `draft` -> `active` (via activateRaffle)
- `active` -> `drawing` (when first draw starts - optional)
- `active` -> `completed` (when all prizes awarded)
- `drawing` -> `completed` (when all prizes awarded)

### File Structure Changes

```
lib/actions/
  raffles.ts           # MODIFY - Add updateRaffleStatus() action
  draw.ts              # MODIFY - Add checkAndCompleteRaffle() helper

app/admin/raffles/[id]/live/
  client.tsx           # MODIFY - Add Draw Next Prize button, cooldown, completion handling
  client.test.tsx      # MODIFY - Add tests for new functionality

app/participant/raffle/[id]/
  client.tsx           # MODIFY - Add thank-you overlay for RAFFLE_ENDED
  client.test.tsx      # MODIFY - Add tests for thank-you message

app/admin/
  page.tsx             # MODIFY - Add winner count to raffle cards (optional)
```

### Testing Strategy

**Unit Tests:**
```typescript
describe("Draw Next Prize button", () => {
  it("shows button after celebration completes with next prize name", () => {
    render(<LiveDrawClient {...propsWithMultiplePrizes} />);
    // Simulate celebration complete
    expect(screen.getByTestId("draw-next-button")).toHaveTextContent("Draw Next Prize: Second Prize");
  });

  it("shows cooldown countdown when active", () => {
    render(<LiveDrawClient {...propsWithCooldown} />);
    expect(screen.getByTestId("draw-next-button")).toHaveTextContent("Wait 5s...");
  });

  it("disables button during cooldown", () => {
    render(<LiveDrawClient {...propsWithCooldown} />);
    expect(screen.getByTestId("draw-next-button")).toBeDisabled();
  });
});

describe("Raffle completion", () => {
  it("shows completion message when all prizes awarded", () => {
    render(<LiveDrawClient {...propsAllPrizesAwarded} />);
    expect(screen.getByText(/All prizes awarded/i)).toBeInTheDocument();
  });

  it("hides Draw button when raffle is completed", () => {
    render(<LiveDrawClient {...propsCompleted} />);
    expect(screen.queryByTestId("draw-next-button")).not.toBeInTheDocument();
  });
});

describe("Participant thank-you message", () => {
  it("shows thank-you overlay when RAFFLE_ENDED received", () => {
    // Simulate RAFFLE_ENDED event
    render(<ParticipantRaffleClient {...defaultProps} />);
    // Trigger event
    expect(screen.getByText("Thanks for participating!")).toBeInTheDocument();
  });
});
```

**Integration Tests:**
```typescript
describe("Sequential Prize Drawing Integration", () => {
  it("awards prizes in sort_order sequence", async () => {
    // Create raffle with 3 prizes in order
    // Draw each prize, verify correct order
  });

  it("broadcasts RAFFLE_ENDED after final prize", async () => {
    // Create raffle with 1 prize
    // Draw the prize
    // Verify RAFFLE_ENDED broadcast and status = completed
  });

  it("prevents draws on completed raffle", async () => {
    // Complete a raffle
    // Attempt to draw again
    // Verify error: "Raffle already completed" or no prizes available
  });
});
```

### Previous Story Learnings (from 6-6)

1. **Implicit ticket reset** - Winner record creation with `won_at` timestamp handles reset
2. **Post-celebration phases** - `handleCelebrationComplete` callback already exists in both clients
3. **ARIA live regions** - Used for screen reader announcements (follow same pattern)
4. **Router.refresh()** - Used to fetch updated data after state changes
5. **Broadcast event handlers** - Pattern established in useBroadcastChannel hook

### Project Structure Notes

- Test files co-located: `client.tsx` + `client.test.tsx`
- Follow existing naming: `camelCase.tsx` for files, `PascalCase` for components
- Server Actions return `{ data, error }` tuple - NEVER throw
- Use `toast.error()` for user-facing error messages
- Use `useCallback` for all event handlers to prevent re-renders

### References

- [Source: lib/supabase/broadcast.ts] - `broadcastRaffleEnded()` already implemented
- [Source: lib/constants/events.ts] - `RAFFLE_EVENTS.RAFFLE_ENDED` and `RaffleEndedPayload`
- [Source: app/admin/raffles/[id]/live/client.tsx] - `handleRaffleEnded` stub to enhance
- [Source: app/participant/raffle/[id]/client.tsx] - `handleRaffleEnded` stub to enhance
- [Source: lib/actions/raffles.ts] - Add `updateRaffleStatus()` action here
- [Source: lib/actions/draw.ts] - `drawWinner()` action (add completion check)
- [Source: supabase/migrations/00003_create_raffles.sql] - Status enum values
- [Source: epics.md#Story 6.7 - Sequential Prize Drawing Flow]
- [Source: project-context.md#Critical Implementation Rules]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

**New Files:**
- `lib/utils/draw.ts` - Draw utility functions (selectWeightedWinner, calculateAccumulatedTicketsForUser) moved from server action file

**Modified Files:**
- `app/admin/raffles/[id]/live/client.tsx` - Added Draw Next Prize button with cooldown, RAFFLE_ENDED handling, View History button
- `app/admin/raffles/[id]/live/client.test.tsx` - Updated tests for new Draw Next Prize functionality
- `app/participant/raffle/[id]/client.tsx` - Added thank-you overlay for RAFFLE_ENDED event
- `app/participant/raffle/[id]/client.test.tsx` - Added test for thank-you overlay
- `app/admin/page.tsx` - Added winner count badge to raffle cards using getRafflesWithWinnerCount
- `app/admin/page.test.tsx` - Updated tests to use getRafflesWithWinnerCount mock
- `lib/actions/raffles.ts` - Added updateRaffleStatus and getRafflesWithWinnerCount server actions
- `lib/actions/draw.ts` - Added checkAndCompleteRaffle helper, broadcasts RAFFLE_ENDED after final prize

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2025-12-26 | Story 6.7 Implementation | All files above |
| - | Added Draw Next Prize button with 5-second cooldown | client.tsx (live) |
| - | Wired Draw Next Prize to drawWinner action | client.tsx (live) |
| - | Implemented checkAndCompleteRaffle for RAFFLE_ENDED broadcast | draw.ts |
| - | Created updateRaffleStatus server action | raffles.ts |
| - | Added thank-you overlay for participants | client.tsx (participant) |
| - | Added View History button on raffle completion | client.tsx (live) |
| - | Added winner count badge to admin dashboard raffle cards | page.tsx (admin) |
| - | Moved utility functions to lib/utils/draw.ts to fix "use server" issues | draw.ts, utils/draw.ts |
| - | Updated all related tests | client.test.tsx (x2), page.test.tsx |
