# Story 3.4: Ticket Confirmation and Status Feedback

Status: done

## Story

As a **raffle participant**,
I want **to see confirmation that I'm registered and the current status**,
so that **I know I'm in the raffle and don't need to do anything else**.

## Acceptance Criteria

1. **AC1: Success Toast on Join**
   - Given a user who just joined a raffle
   - When they land on the participant dashboard
   - Then a success toast appears: "You're in! Good luck!"
   - And the toast auto-dismisses after 3 seconds

2. **AC2: StatusBar Visibility**
   - Given a registered participant
   - When they view the participant dashboard
   - Then a StatusBar is visible at the bottom of the screen
   - And it shows "Locked in - waiting for draw" with a pulsing green dot

3. **AC3: StatusBar Active State**
   - Given the StatusBar component
   - When the raffle status is 'active'
   - Then it displays the "Locked in" state
   - And the green dot pulses with a 2-second animation cycle

4. **AC4: Passive User Experience**
   - Given the participant dashboard
   - When a user is registered for an active raffle
   - Then they see no action buttons or decisions to make
   - And the interface clearly communicates "just wait and watch"

5. **AC5: Accessibility Screen Reader Support**
   - Given the confirmation flow
   - When a ticket is granted
   - Then screen reader users hear "You now have X tickets for the raffle"
   - And the announcement uses an ARIA live region

## Tasks / Subtasks

- [x] Task 1: Create StatusBar Component (AC: #2, #3)
  - [x] 1.1: Create `/components/raffle/statusBar.tsx` with TypeScript interface
  - [x] 1.2: Implement "Locked in - waiting for draw" display with pulsing green dot
  - [x] 1.3: Add 2-second CSS animation cycle for the pulse effect
  - [x] 1.4: Add dark mode styling (use project conventions)
  - [x] 1.5: Create unit tests `/components/raffle/statusBar.test.tsx`
  - [x] 1.6: Add reduced motion support (respect `prefers-reduced-motion`)

- [x] Task 2: Integrate StatusBar into Participant Dashboard (AC: #2, #4)
  - [x] 2.1: Import StatusBar into `/app/participant/raffle/[id]/client.tsx`
  - [x] 2.2: Position StatusBar at bottom of screen (fixed or sticky)
  - [x] 2.3: Only show StatusBar when raffle status is 'active'
  - [x] 2.4: Ensure no action buttons or decisions are visible (passive UX)
  - [x] 2.5: Update integration tests

- [x] Task 3: Update Toast Timing (AC: #1)
  - [x] 3.1: Change toast duration from 5000ms to 3000ms in client.tsx
  - [x] 3.2: Verify toast auto-dismisses correctly
  - [x] 3.3: Update tests if duration was hardcoded in assertions

- [x] Task 4: Add Screen Reader ARIA Live Region (AC: #5)
  - [x] 4.1: Add hidden ARIA live region to client.tsx for ticket announcements
  - [x] 4.2: Announce "You now have X tickets for the raffle" on join
  - [x] 4.3: Use `aria-live="polite"` for non-disruptive announcements
  - [x] 4.4: Test with screen reader or accessibility audit tools
  - [x] 4.5: Add accessibility tests

## Dev Notes

### StatusBar Component Design

Create a new component that displays registration confirmation status:

```typescript
// /components/raffle/statusBar.tsx
interface StatusBarProps {
  status: 'active' | 'drawing' | 'completed';
  className?: string;
}

export function StatusBar({ status, className }: StatusBarProps) {
  // Only show "Locked in" state for active raffles
  if (status !== 'active') return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t",
      "flex items-center justify-center gap-3",
      className
    )}>
      {/* Pulsing green dot */}
      <span className={cn(
        "w-3 h-3 rounded-full bg-green-500",
        "animate-pulse motion-reduce:animate-none"
      )} />
      <span className="text-sm font-medium text-muted-foreground">
        Locked in - waiting for draw
      </span>
    </div>
  );
}
```

**Styling Requirements:**
- Background: Semi-transparent with backdrop blur for modern glass effect
- Border-top: Subtle separator from content
- Pulse animation: 2-second cycle using Tailwind's `animate-pulse` (default is 2s)
- Green dot: `bg-green-500` (visible in both light and dark modes)
- Text: `text-muted-foreground` for subtle but readable appearance

### Toast Duration Update

The current toast duration is 5000ms. Update to 3000ms per AC #1:

```typescript
// In /app/participant/raffle/[id]/client.tsx
toast.success("You're in! Good luck!", {
  description: "Your ticket has been registered for this raffle.",
  duration: 3000,  // Changed from 5000
});
```

**Note:** The "already registered" toast should remain at 3000ms (already correct).

### ARIA Live Region Implementation

Add a screen reader announcement for ticket confirmation:

```typescript
// Add to client.tsx
const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState<string>('');

// In useEffect when showing joined toast:
if (showJoinedToast === "true") {
  setScreenReaderAnnouncement(`You now have ${ticketCount} ticket${ticketCount !== 1 ? 's' : ''} for the raffle`);
  // ... existing toast code
}

// In JSX, add hidden live region:
<div
  role="status"
  aria-live="polite"
  className="sr-only"
>
  {screenReaderAnnouncement}
</div>
```

**Important:** The TicketCircle already has `role="status"` and `aria-live="polite"` with aria-label. Consider whether the additional live region is needed or if updating TicketCircle's announcement is sufficient.

### Existing Code Integration Points

**Files to Modify:**
- `/app/participant/raffle/[id]/client.tsx` - Add StatusBar, update toast, add ARIA live region
- `/app/participant/layout.tsx` - May need padding adjustment for fixed StatusBar

**Files to Create:**
- `/components/raffle/statusBar.tsx` - New StatusBar component
- `/components/raffle/statusBar.test.tsx` - Unit tests

**Dependencies on Prior Stories:**
- Story 3-1: Participant dashboard exists at `/app/participant/raffle/[id]/`
- Story 3-2: TicketCircle component exists with accessibility support
- Story 3-3: Accumulated tickets display is working

### Current Toast Implementation (Reference)

From `/app/participant/raffle/[id]/client.tsx`:
```typescript
useEffect(() => {
  if (showJoinedToast === "true") {
    toast.success("You're in! Good luck!", {
      description: "Your ticket has been registered for this raffle.",
      duration: 5000,  // UPDATE TO 3000
    });
    router.replace(`/participant/raffle/${raffleId}`, { scroll: false });
  } else if (showJoinedToast === "false") {
    toast.info("You're already registered!", {
      description: "You already have a ticket for this raffle.",
      duration: 3000,
    });
    router.replace(`/participant/raffle/${raffleId}`, { scroll: false });
  }
}, [showJoinedToast, raffleId, router]);
```

### Passive UX Verification (AC #4)

The current dashboard already follows passive UX principles:
- No buttons requiring action visible
- Status displayed via Badge component
- "Waiting for draw..." message shown for active status

Verify this is maintained when adding StatusBar. The StatusBar reinforces the passive experience by explicitly communicating the user just needs to wait.

### Testing Strategy

**Unit Tests for StatusBar:**
```typescript
describe('StatusBar', () => {
  it('renders "Locked in" state for active raffle', () => {
    render(<StatusBar status="active" />);
    expect(screen.getByText('Locked in - waiting for draw')).toBeInTheDocument();
  });

  it('shows pulsing green dot for active status', () => {
    render(<StatusBar status="active" />);
    const dot = screen.getByTestId('status-dot');
    expect(dot).toHaveClass('animate-pulse');
  });

  it('returns null for non-active status', () => {
    const { container } = render(<StatusBar status="completed" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('respects reduced motion preference', () => {
    // Test that motion-reduce:animate-none is applied
  });
});
```

**Integration Tests for Toast Timing:**
```typescript
it('auto-dismisses success toast after 3 seconds', async () => {
  // Use jest.useFakeTimers() to verify toast duration
});
```

**Accessibility Tests:**
```typescript
it('announces ticket count to screen readers', () => {
  render(<ParticipantRaffleClient ... showJoinedToast="true" />);
  const announcement = screen.getByRole('status');
  expect(announcement).toHaveTextContent(/You now have \d+ tickets? for the raffle/);
});
```

### Anti-Pattern Prevention

**DO NOT:**
- Add buttons or interactive elements to StatusBar (it's purely informational)
- Use absolute positioning that could overlap content on smaller screens
- Forget to handle the padding/margin at the bottom of the page for fixed StatusBar
- Skip reduced motion handling for the pulse animation
- Duplicate ARIA announcements (check TicketCircle already handles this)

**DO:**
- Follow ActionResult pattern if any server interaction needed (none expected)
- Use snake_case for any database columns, camelCase for TypeScript
- Co-locate tests with source files
- Use existing Tailwind animation classes (`animate-pulse`)
- Test on mobile viewport sizes

### Project Structure Notes

**Component Location:**
- New component: `/components/raffle/statusBar.tsx`
- Tests: `/components/raffle/statusBar.test.tsx`

**Layout Considerations:**
The StatusBar uses `fixed bottom-0`, so the participant dashboard content area may need bottom padding to prevent content from being hidden behind the StatusBar. Check if `/app/participant/raffle/[id]/client.tsx` needs a `pb-20` class or similar on the container.

### References

- [Source: epics.md#Story 3.4] - Original acceptance criteria
- [Source: architecture.md#Component Organization] - Component structure patterns
- [Source: architecture.md#Implementation Patterns] - Naming conventions
- [Source: project-context.md#TypeScript/React] - Component naming (PascalCase)
- [Source: Story 3-2 Dev Notes] - TicketCircle accessibility implementation
- [Source: Story 3-3] - Previous story patterns and learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implementation proceeded without issues.

### Completion Notes List

- Task 1: Created StatusBar component (`/components/raffle/statusBar.tsx`) with:
  - TypeScript interface for props (status, className)
  - Fixed positioning at bottom of screen
  - Pulsing green dot using Tailwind `animate-pulse` (2s cycle)
  - Semi-transparent backdrop blur styling
  - Dark mode support (works with existing Tailwind classes)
  - Reduced motion support via `motion-reduce:animate-none`
  - 13 unit tests covering all functionality

- Task 2: Integrated StatusBar into participant dashboard:
  - Imported and rendered StatusBar in client.tsx
  - Only renders for 'active' raffle status
  - Added `pb-20` bottom padding to prevent content overlap
  - Verified passive UX - no action buttons present
  - Added integration tests for StatusBar visibility

- Task 3: Updated toast timing:
  - Changed success toast duration from 5000ms to 3000ms
  - Both success and "already registered" toasts now use 3000ms
  - Added tests to verify toast duration configuration

- Task 4: Added ARIA live region for screen reader support:
  - Added hidden `sr-only` div with `role="status"` and `aria-live="polite"`
  - Announces "You now have X ticket(s) for the raffle" on join
  - Handles singular/plural correctly
  - Added accessibility tests for announcement content

All acceptance criteria satisfied:
- AC1: Toast auto-dismisses after 3 seconds
- AC2: StatusBar visible at bottom with "Locked in" message and pulsing green dot
- AC3: StatusBar only shows for active raffles, pulse animation is 2s cycle
- AC4: No action buttons visible, passive "just wait" experience
- AC5: Screen reader users hear ticket count announcement via ARIA live region

### File List

**New Files:**
- `components/raffle/statusBar.tsx` - StatusBar component
- `components/raffle/statusBar.test.tsx` - StatusBar unit tests (13 tests)

**Modified Files:**
- `app/participant/raffle/[id]/client.tsx` - Added StatusBar integration, ARIA live region, updated toast duration
- `app/participant/raffle/[id]/client.test.tsx` - Added tests for StatusBar, toast timing, and accessibility

## Senior Developer Review (AI)

**Reviewed by:** Claude Opus 4.5 | **Date:** 2025-12-26 | **Outcome:** APPROVED

### Findings Summary
- **HIGH:** 1 (fixed)
- **MEDIUM:** 2 (fixed)
- **LOW:** 3 (documented for future consideration)

### Fixed Issues

1. **[HIGH] Type Safety Issue - Unsafe Type Assertion**
   - **Location:** `app/participant/raffle/[id]/client.tsx:151`
   - **Issue:** `raffleStatus` was cast unsafely to StatusBar's union type using `as` assertion
   - **Fix:** Added `isValidRaffleStatus()` type guard function; StatusBar only renders for valid statuses

2. **[MEDIUM] Potential Duplicate Screen Reader Announcements**
   - **Location:** `app/participant/raffle/[id]/client.tsx`
   - **Issue:** Two ARIA live regions (TicketCircle + new announcement div) could cause duplicate announcements
   - **Fix:** Added `aria-atomic="true"` and documented the intentional separation (event vs state)

3. **[MEDIUM] Missing Test for Invalid Raffle Status**
   - **Location:** `app/participant/raffle/[id]/client.test.tsx`
   - **Issue:** No test coverage for invalid status edge case
   - **Fix:** Added 2 new tests for invalid/unknown status handling

### Low Severity Findings (Not Fixed - For Future Consideration)

1. **[LOW] StatusBar Animation Duration Not Explicitly Tested**
   - Test relies on Tailwind's default 2s animate-pulse without explicit verification
   - Recommendation: Add visual regression test if animation timing becomes critical

2. **[LOW] StatusBar Missing role="status" for Enhanced Semantics**
   - The container lacks explicit ARIA role (text content is descriptive though)
   - Recommendation: Consider adding role="status" for better screen reader context

3. **[LOW] No Integration Test for StatusBar Reduced Motion**
   - Unit test exists in statusBar.test.tsx, but not verified in integration context
   - Recommendation: Add integration test if accessibility compliance becomes stricter

### Tests
- All 395 tests pass (2 new tests added during review)
- Test coverage validated for all acceptance criteria

## Change Log

| Date | Change Description |
|------|-------------------|
| 2025-12-26 | **Code Review:** Fixed 3 issues (1 HIGH, 2 MEDIUM). Added type guard for status validation, documented ARIA live region intent, added 2 tests for edge cases. Status updated to done. |
| 2025-12-26 | Implemented Story 3.4: StatusBar component, toast timing update, ARIA live region for accessibility. All 4 tasks completed. Full test suite passes (393 tests). |

