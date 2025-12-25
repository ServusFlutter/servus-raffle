# Story 2.3: Generate QR Code with Expiration

Status: done

## Story

As an **organizer**,
I want **to generate a QR code for my raffle with an expiration time**,
so that **attendees can scan it to join, but only during the event**.

## Acceptance Criteria

1. **AC1: Draft Raffle Shows QR Options**
   - Given an admin viewing a raffle detail page
   - When the raffle is in 'draft' status
   - Then they see an option to set QR code expiration time
   - And they see a "Generate QR Code" button

2. **AC2: Set Expiration and Activate Raffle**
   - Given an admin setting the expiration time
   - When they select a duration (e.g., 3 hours from now)
   - Then the `qr_code_expires_at` timestamp is calculated and saved
   - And the raffle status changes to 'active'

3. **AC3: Display QR Code with Metadata**
   - Given an active raffle
   - When the admin views the QR code page
   - Then a QR code is displayed encoding the join URL (`/join/{raffle-id}`)
   - And the QR code is large and high-contrast for projection
   - And the expiration time is displayed below the QR code

4. **AC4: Projection-Optimized QR Display**
   - Given the QR code display
   - When viewed in projection context
   - Then the QR code fills most of the screen
   - And text is readable from the back of a room
   - And there's a download button for the QR image

5. **AC5: Handle Expired QR Codes**
   - Given a raffle whose QR has expired
   - When the admin views the raffle
   - Then the status shows 'expired' or allows regeneration
   - And participants scanning the old QR see an expiration message

## Tasks / Subtasks

- [x] Task 1: Create QR Code Server Action (AC: #2, #5)
  - [x] 1.1: Implement `activateRaffle` Server Action in `/lib/actions/raffles.ts`
  - [x] 1.2: Calculate `qr_code_expires_at` from duration selection
  - [x] 1.3: Update raffle status to 'active' atomically
  - [x] 1.4: Implement `regenerateQrCode` action for expired raffles
  - [x] 1.5: Add Zod schema `ActivateRaffleSchema` in `/lib/schemas/raffle.ts`

- [x] Task 2: Build QRCodeDisplay Component (AC: #3, #4)
  - [x] 2.1: Create `/components/admin/qrCodeDisplay.tsx` using qrcode.react
  - [x] 2.2: Implement responsive sizing (standard vs projection mode)
  - [x] 2.3: Add expiration time display with countdown formatting
  - [x] 2.4: Implement QR download as PNG functionality
  - [x] 2.5: Add high-contrast styling for projection readability

- [x] Task 3: Create QR Code Admin Page (AC: #1, #3)
  - [x] 3.1: Create `/app/admin/raffles/[id]/qr/page.tsx`
  - [x] 3.2: Implement expiration duration selector component
  - [x] 3.3: Add "Generate QR Code" button with loading state
  - [x] 3.4: Display generated QR code after activation
  - [x] 3.5: Add navigation back to raffle detail

- [x] Task 4: Handle Expiration States (AC: #5)
  - [x] 4.1: Create utility function to check QR expiration status
  - [x] 4.2: Update raffle detail page to show expiration status
  - [x] 4.3: Implement regeneration UI for expired raffles
  - [x] 4.4: Create `/app/join/[id]/expired/page.tsx` for expired QR scans

- [x] Task 5: Testing (All ACs)
  - [x] 5.1: Write tests for `activateRaffle` Server Action
  - [x] 5.2: Write tests for QRCodeDisplay component
  - [x] 5.3: Test expiration calculation and status transitions

## Dev Notes

### Dependencies on Prior Stories

This story requires **Story 2-1 (Admin Role Authorization)** and **Story 2-2 (Create New Raffle)** to be completed first:
- 2-1 provides: `isAdmin()` utility, admin middleware, `/app/(admin)/` route group
- 2-2 provides: `raffles` table, `createRaffle` Server Action, raffle detail page at `/app/(admin)/raffles/[id]/page.tsx`

### Technical Stack Requirements

**Required Libraries (already installed from Story 1-1):**
- `qrcode.react` ^4.x - Client-side QR code generation
- `framer-motion` ^11.x - Not needed for this story but available

**QR Code Implementation:**
```typescript
// Use QRCodeSVG from qrcode.react (NOT QRCodeCanvas) for:
// - Better scaling for projection
// - Smaller bundle size
// - Easier styling with CSS
import { QRCodeSVG } from 'qrcode.react';
```

### Database Schema Reference

The `raffles` table already includes required columns (from Story 2-2):
```sql
raffles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  status text DEFAULT 'draft',      -- Values: 'draft', 'active', 'expired', 'completed'
  qr_code_expires_at timestamptz,   -- NULL for draft, set when activated
  created_at timestamptz,
  created_by uuid REFERENCES users(id)
)
```

**Status Transitions:**
- `draft` -> `active`: When admin generates QR with expiration
- `active` -> `expired`: When `qr_code_expires_at` < NOW() (computed, not stored)
- `active` -> `completed`: When all prizes awarded (Story 6-7)

### File Structure

```
app/
  (admin)/
    raffles/
      [id]/
        qr/
          page.tsx              # QR code generation and display page

components/
  admin/
    qrCodeDisplay.tsx           # QRCodeSVG wrapper with projection support
    qrCodeDisplay.test.tsx
    expirationSelector.tsx      # Duration picker (1h, 2h, 3h, custom)

lib/
  actions/
    raffles.ts                  # Add activateRaffle, regenerateQrCode
  schemas/
    raffle.ts                   # Add ActivateRaffleSchema
  utils/
    dates.ts                    # Add formatCountdown, isExpired helpers
```

### Server Action Implementation

```typescript
// lib/actions/raffles.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { ActivateRaffleSchema } from "@/lib/schemas/raffle";
import { revalidatePath } from "next/cache";

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

export async function activateRaffle(
  raffleId: string,
  durationMinutes: number
): Promise<ActionResult<{ qr_code_expires_at: string }>> {
  try {
    // Validate input
    const parsed = ActivateRaffleSchema.safeParse({ raffleId, durationMinutes });
    if (!parsed.success) {
      return { data: null, error: "Invalid input" };
    }

    const supabase = await createClient();

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const { data, error } = await supabase
      .from('raffles')
      .update({
        status: 'active',
        qr_code_expires_at: expiresAt.toISOString()
      })
      .eq('id', raffleId)
      .eq('status', 'draft')  // Only activate draft raffles
      .select('qr_code_expires_at')
      .single();

    if (error) {
      console.error('Failed to activate raffle:', error);
      return { data: null, error: "Failed to activate raffle" };
    }

    revalidatePath(`/admin/raffles/${raffleId}`);
    return { data, error: null };
  } catch (e) {
    console.error('Unexpected error:', e);
    return { data: null, error: "Failed to activate raffle" };
  }
}
```

### QRCodeDisplay Component Specification

```typescript
// components/admin/qrCodeDisplay.tsx
interface QRCodeDisplayProps {
  value: string;           // The URL to encode (e.g., "/join/{raffle-id}")
  expiresAt: string;       // ISO timestamp
  raffleName: string;      // Display above QR
  projectionMode?: boolean; // Enable 2x sizing
}

// Key implementation details:
// 1. Use QRCodeSVG with size based on projection mode
// 2. Apply pure black background (#000000) in projection mode
// 3. Include countdown timer showing time remaining
// 4. Download button uses canvas API to convert SVG to PNG
```

**Projection Mode Sizing:**
- Standard: 256x256px QR code
- Projection: 512x512px QR code (fills ~80% of viewport width)
- Font sizes: 2x in projection mode per UX spec

### Expiration Duration Options

Per UX research (meetup context), provide sensible defaults:
```typescript
const DURATION_OPTIONS = [
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
  { label: '4 hours', minutes: 240 },
  { label: 'Custom', minutes: null },  // Shows time picker
];
```

### QR Code URL Format

```
{baseUrl}/join/{raffleId}

Example: https://servus-raffle.vercel.app/join/123e4567-e89b-12d3-a456-426614174000
```

The `/join/[id]` route will be implemented in Story 3-1 (Participant Joining).

### Styling Requirements

**From UX Spec - Projection Mode:**
- Background: Pure black (#000000)
- Text: Pure white (#FFFFFF)
- QR code: White on black for maximum contrast
- Typography: 2x base sizes (48px for headers, 32px for body)
- Minimal UI elements - QR code is the hero

**QR Download Feature:**
```typescript
// Convert SVG to PNG for download
const handleDownload = () => {
  const svg = document.querySelector('#qr-code svg');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size for high-res output
  canvas.width = 1024;
  canvas.height = 1024;

  // ... convert and download
};
```

### Testing Strategy

**Unit Tests:**
- `activateRaffle` Server Action: Valid activation, already active error, expired handling
- Date utilities: `isExpired()`, `formatCountdown()`

**Component Tests:**
- QRCodeDisplay: Renders correct URL, shows expiration, download works
- ExpirationSelector: Duration options, custom time picker

**Integration Tests (Manual):**
- Generate QR, scan with phone, verify URL
- Projection mode on actual projector/TV
- Expiration countdown accuracy

### Error Handling

| Scenario | User Message | Action |
|----------|--------------|--------|
| Raffle not draft | "Raffle already active" | Redirect to QR page |
| Database error | "Failed to activate. Try again." | Show retry button |
| Invalid duration | "Select a valid duration" | Inline validation |

### Accessibility Requirements

- QR code has `aria-label="QR code to join {raffle name}"`
- Countdown uses `aria-live="polite"` for screen reader updates
- Download button has clear focus state
- High contrast colors meet WCAG AA in all modes

### Anti-Pattern Prevention

**DO NOT:**
- Generate QR codes server-side (unnecessary complexity)
- Store QR images in database (generate client-side from URL)
- Use QRCodeCanvas (QRCodeSVG is better for this use case)
- Allow expiration in the past
- Skip validation of raffle ownership before activation

**DO:**
- Reuse existing Supabase client patterns from `/lib/supabase/`
- Follow ActionResult pattern for all Server Actions
- Use snake_case for database columns (`qr_code_expires_at`)
- Use camelCase for TypeScript (`expiresAt`, `durationMinutes`)

### Project Structure Notes

- Admin routes use `(admin)` route group - verify layout exists from Story 2-1
- QR page nested under raffle detail: `/raffles/[id]/qr/`
- Component files use camelCase: `qrCodeDisplay.tsx`
- Tests co-located: `qrCodeDisplay.test.tsx`

### References

- [Source: architecture.md#Database Schema] - raffles table definition
- [Source: architecture.md#Implementation Patterns] - Server Action response format
- [Source: ux-design-specification.md#Projection Mode] - Visual requirements
- [Source: ux-design-specification.md#QRCodeDisplay] - Component specification
- [Source: project-context.md#Server Actions] - ActionResult pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Implemented `activateRaffle` and `regenerateQrCode` Server Actions following the ActionResult pattern with proper admin authorization
- Created `ActivateRaffleSchema` with validation for UUID raffleId and duration (15-1440 minutes)
- Built QRCodeDisplay component with real-time countdown timer, projection mode toggle, and PNG download functionality
- Created ExpirationSelector component with preset duration options (1h, 2h, 3h, 4h) plus custom duration
- Implemented QR code admin page at `/app/admin/raffles/[id]/qr/page.tsx` with different UI states for draft, active, and expired raffles
- Updated raffle detail page to show QR code status with appropriate actions (Generate/View/Regenerate)
- Created participant-facing expired page at `/app/join/[id]/expired/page.tsx`
- Added date utility functions: `isExpired`, `getTimeRemaining`, `formatCountdown`, `formatExpirationTime`
- All 228 tests pass including new tests for activateRaffle, regenerateQrCode, QRCodeDisplay, dates utilities, and ActivateRaffleSchema

### File List

**New Files:**
- `lib/utils/dates.ts` - Date utility functions for expiration handling
- `lib/utils/dates.test.ts` - Tests for date utilities
- `components/admin/qrCodeDisplay.tsx` - QR code display with projection mode
- `components/admin/qrCodeDisplay.test.tsx` - Tests for QRCodeDisplay component
- `components/admin/expirationSelector.tsx` - Duration picker for QR expiration
- `components/admin/expirationSelector.test.tsx` - Tests for ExpirationSelector component (added during code review)
- `app/admin/raffles/[id]/qr/page.tsx` - QR code admin page
- `app/join/[id]/page.tsx` - Participant join page (placeholder for Story 3-1)
- `app/join/[id]/expired/page.tsx` - Expired QR code page for participants

**Modified Files:**
- `lib/schemas/raffle.ts` - Added ActivateRaffleSchema
- `lib/schemas/raffle.test.ts` - Added tests for ActivateRaffleSchema
- `lib/actions/raffles.ts` - Added activateRaffle and regenerateQrCode Server Actions
- `lib/actions/raffles.test.ts` - Added tests for new Server Actions
- `app/admin/raffles/[id]/page.tsx` - Updated QR code card with status-aware UI

### Change Log

- 2025-12-25: Implemented Story 2-3: Generate QR Code with Expiration (all tasks completed)
- 2025-12-25: Code Review - Fixed race condition in QRCodeDisplay onExpired callback, added error handling for download, added ExpirationSelector tests (22 new tests)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5 (code-review workflow)
**Date:** 2025-12-25
**Outcome:** APPROVED

### Issues Found and Resolved

| Severity | Issue | Resolution |
|----------|-------|------------|
| HIGH | Missing ExpirationSelector tests | Added 22 comprehensive tests covering presets, custom duration, validation, loading/disabled states, accessibility |
| MEDIUM | Race condition in onExpired callback - called repeatedly after expiration | Added ref flag to ensure callback fires only once per expiration |
| MEDIUM | Missing error handling in handleDownload | Added onerror handler for Image and console.error for debugging |
| MEDIUM | Potential memory leak if image fails to load | URL.revokeObjectURL now called in both onload and onerror handlers |

### Low Severity Issues (Not Fixed - For Future Consideration)

1. Story Dev Notes reference `/app/(admin)/` but implementation uses `/app/admin/` - documentation mismatch only
2. `formatExpirationTime` hardcodes "en-US" locale - consider browser default for i18n
3. ExpirationSelector lacks data-testid attributes - consider adding for e2e testing

### Verification

- All 250 tests passing (228 original + 22 new ExpirationSelector tests)
- All Acceptance Criteria verified as implemented
- All Tasks marked [x] verified as complete
- Code follows project-context.md patterns (ActionResult, snake_case DB, etc.)

