# Story 6.1: Admin Live Draw Mode & Projection UI

Status: done

## Story

As an **organizer**,
I want **to enter a live draw mode optimized for projection**,
so that **the audience can clearly see the raffle on the big screen**.

## Acceptance Criteria

1. **AC1: Start Live Draw Button**
   - Given an admin on the raffle detail page
   - When they click "Start Live Draw"
   - Then the interface transitions to projection mode
   - And the URL changes to `/admin/raffles/{id}/live`

2. **AC2: Projection Mode Visual Design**
   - Given projection mode is active
   - When the page renders
   - Then the background is pure black (#000000)
   - And all text is 2x normal size
   - And navigation and chrome are hidden

3. **AC3: Projection Readability**
   - Given the live draw interface
   - When displayed on a projector
   - Then text is readable from the back of a room
   - And the "Draw Winner" button is prominently displayed
   - And participant count and prize info are visible

4. **AC4: Exit Live Draw**
   - Given the live draw mode
   - When the admin wants to exit
   - Then an "Exit Live Draw" option is available
   - And they return to the normal admin interface

5. **AC5: Current Prize Display**
   - Given the projection display
   - When showing the current prize
   - Then the prize name is displayed in large text
   - And it's clear which prize is being drawn

## Tasks / Subtasks

- [x] Task 1: Create Live Draw Page Route (AC: #1)
  - [x] 1.1: Create `/app/admin/raffles/[id]/live/page.tsx` (Server Component)
  - [x] 1.2: Add admin authorization check (redirect non-admins)
  - [x] 1.3: Fetch raffle with prizes using service role client
  - [x] 1.4: Create client component wrapper for interactive functionality

- [x] Task 2: Create LiveDrawClient Component (AC: #2, #3, #4, #5)
  - [x] 2.1: Create `/app/admin/raffles/[id]/live/client.tsx`
  - [x] 2.2: Implement projection mode styles (black bg, 2x text)
  - [x] 2.3: Add large "Draw Winner" button (prominently displayed)
  - [x] 2.4: Display participant count (large, projection-optimized)
  - [x] 2.5: Display current prize info with large text
  - [x] 2.6: Add "Exit Live Draw" button (discrete, top-right)
  - [x] 2.7: Hide navigation and admin chrome

- [x] Task 3: Add Prize Progress Display (AC: #5)
  - [x] 3.1: Show prize sequence (e.g., "Prize 2 of 5")
  - [x] 3.2: Highlight current prize being drawn
  - [x] 3.3: Show awarded status for completed prizes
  - [x] 3.4: Show "Next Prize" for queued prizes (shown in prize summary bar)

- [x] Task 4: Add Start Live Draw Button to Raffle Detail (AC: #1)
  - [x] 4.1: Update `/app/admin/raffles/[id]/page.tsx`
  - [x] 4.2: Add "Start Live Draw" button (prominent CTA)
  - [x] 4.3: Link navigates to `/admin/raffles/{id}/live`
  - [x] 4.4: Only show for active raffles with prizes

- [x] Task 5: Create Event Constants (AC: #3)
  - [x] 5.1: Create `/lib/constants/events.ts`
  - [x] 5.2: Define RAFFLE_EVENTS: DRAW_START, WHEEL_SEED, WINNER_REVEALED, RAFFLE_ENDED
  - [x] 5.3: Export BroadcastEvent type

- [x] Task 6: Create Unit Tests
  - [x] 6.1: Create `/app/admin/raffles/[id]/live/client.test.tsx`
  - [x] 6.2: Test projection mode rendering
  - [x] 6.3: Test exit button navigation
  - [x] 6.4: Test prize display
  - [x] 6.5: Test participant count display

- [x] Task 7: Final Verification
  - [x] 7.1: Run `npm run test` - all tests pass (738 tests)
  - [x] 7.2: Run `npm run build` - TypeScript build succeeds
  - [x] 7.3: Run `npm run lint` - no errors (0 errors, 4 unrelated warnings)

## Dev Notes

### Story Context

This is the FIRST story of Epic 6 (Live Draw Experience). It sets up the projection-optimized UI that will host the wheel animation (Story 6.4), winner celebration (Story 6.5), and sequential drawing flow (Story 6.7). The focus here is on the visual container and admin controls - NOT the actual drawing logic (Story 6.3) or real-time sync (Story 6.2).

### Architecture Compliance

**Route Structure (from architecture.md):**
```
/app/(admin)/raffles/[id]/live/page.tsx    # Live draw (projection mode)
```

**But actual project uses:**
```
/app/admin/raffles/[id]/live/page.tsx      # Follow existing pattern without route groups
```

**Component Location:**
```
/components/admin/    # Admin-specific components
```

### Design Requirements (from UX spec & architecture)

**Projection Mode:**
- Background: Pure black (#000000)
- Text size: 2x normal (base ~32px, headers ~64-96px)
- Hidden: Navigation, admin header, sidebar, chrome
- Focus: Content fills screen for projector readability

**Visual Hierarchy:**
1. Current prize name (largest text, hero element)
2. Draw Winner button (prominent, centered)
3. Participant count (visible but secondary)
4. Prize progress indicator
5. Exit button (discrete, top-right corner)

### Technical Patterns

**Server Component + Client Component Pattern:**
```typescript
// page.tsx (Server Component)
export default async function LiveDrawPage({ params }) {
  const { id } = await params;
  // Validate admin, fetch data
  return <LiveDrawClient raffle={...} prizes={...} />
}

// client.tsx (Client Component)
"use client";
export function LiveDrawClient({ raffle, prizes }) {
  // Interactive functionality, state management
}
```

**Projection Mode Classes:**
```typescript
// Use Tailwind for projection-optimized styling
<div className="min-h-screen bg-black text-white">
  <h1 className="text-6xl md:text-8xl font-bold">  {/* 2x size */}
  <button className="text-3xl px-12 py-6">        {/* Large touch target */}
```

### File Structure

```
app/admin/raffles/[id]/live/
  page.tsx           # Server component, auth, data fetch
  client.tsx         # Client component, interactive UI
  client.test.tsx    # Unit tests

lib/constants/
  events.ts          # RAFFLE_EVENTS constants (new file)
```

### Previous Story Learnings (from 5-3)

1. **Real-time subscriptions:** Use `router.refresh()` on change events for simplicity
2. **State management:** Keep state minimal, let server components fetch data
3. **Testing:** Mock Supabase client and subscriptions
4. **Accessibility:** Add role="status", aria-labels for screen readers

### Integration Points (Prepare for Later Stories)

This story creates the container. Later stories will add:
- **Story 6.2:** Real-time channel subscription (DRAW_START, etc.)
- **Story 6.3:** drawWinner Server Action call on button click
- **Story 6.4:** RaffleWheel component embedded in this page
- **Story 6.5:** WinnerCard component for celebration
- **Story 6.7:** "Next Prize" button flow

**Prepare placeholders:**
```typescript
// Draw button - will call drawWinner() in Story 6.3
<Button disabled>Draw Winner</Button>  // Disabled until 6.3

// Wheel placeholder - will be RaffleWheel in Story 6.4
{/* RaffleWheel component will go here */}

// Winner placeholder - will be WinnerCard in Story 6.5
{/* WinnerCard component will go here */}
```

### ActionResult Pattern

```typescript
type ActionResult<T> = {
  data: T | null;
  error: string | null;
};
```

### Event Constants Pattern

```typescript
// /lib/constants/events.ts
export const RAFFLE_EVENTS = {
  DRAW_START: 'DRAW_START',
  WHEEL_SEED: 'WHEEL_SEED',
  WINNER_REVEALED: 'WINNER_REVEALED',
  RAFFLE_ENDED: 'RAFFLE_ENDED',
} as const;

export type RaffleEventType = keyof typeof RAFFLE_EVENTS;

export type BroadcastEvent<T> = {
  type: RaffleEventType;
  payload: T;
  timestamp: string;  // ISO 8601
};
```

### Project Structure Notes

- Alignment with existing `/app/admin/raffles/[id]/*` pattern
- No route groups used in current project (use `/app/admin/` not `/app/(admin)/`)
- Tests co-located with source files

### References

- [Source: _bmad-output/architecture.md#Live Raffle Experience (FR27-35)]
- [Source: _bmad-output/architecture.md#Communication Patterns]
- [Source: _bmad-output/architecture.md#Project Structure]
- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 6.1]
- [Source: app/admin/raffles/[id]/page.tsx] - Existing raffle detail page
- [Source: lib/supabase/realtime.ts] - Existing realtime patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A

### Completion Notes List

- All 5 ACs implemented and verified
- 738 tests passing (including 30 new tests for LiveDrawClient)
- TypeScript build succeeds
- Projection mode optimized for large screens (black bg, 2x text)
- Draw button disabled as placeholder (actual logic in Story 6.3)
- Prepared event constants for subsequent stories

### File List

**New Files:**
- `app/admin/raffles/[id]/live/page.tsx` - Live draw page (Server Component)
- `app/admin/raffles/[id]/live/client.tsx` - Live draw client (projection UI)
- `app/admin/raffles/[id]/live/client.test.tsx` - Unit tests (30 tests)
- `lib/constants/events.ts` - RAFFLE_EVENTS constants

**Modified Files:**
- `app/admin/raffles/[id]/page.tsx` - Added "Start Live Draw" button

## Senior Developer Review

### Review Date
2025-12-26

### Reviewer
Claude Code (Adversarial Review)

### Issues Found

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | MEDIUM | `_raffleStatus` unused prop - intentional placeholder for Story 6.3 | DOCUMENTED |
| 2 | LOW | Story tasks unchecked after implementation | FIXED |

### Verification Results

- **Tests:** 738 passing
- **Build:** Succeeds
- **Lint:** 0 errors
- **ACs:** All 5 implemented

### Final Status

✅ APPROVED - Story complete and ready for commit
