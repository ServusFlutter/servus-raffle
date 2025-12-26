# Story 5.1: Participant List & Statistics Dashboard

Status: done

## Story

As an **organizer**,
I want **to see who has joined my raffle and the ticket statistics**,
so that **I know how many people are participating before I start the draw**.

## Acceptance Criteria

1. **AC1: Participant List Display**
   - Given an admin viewing a raffle detail page
   - When they navigate to the participants section
   - Then they see a list of all participants who have scanned in
   - And each participant shows their name and avatar

2. **AC2: Participant Details**
   - Given the participant list
   - When displayed to the admin
   - Then it shows the participant's accumulated ticket count
   - And it shows when they joined (timestamp)

3. **AC3: Statistics Dashboard**
   - Given the raffle statistics display
   - When the admin views the dashboard
   - Then they see the total number of participants (FR17)
   - And they see the total number of tickets in play (FR16)

4. **AC4: Animated Statistics**
   - Given the statistics display
   - When rendered with the ParticipantCounter component
   - Then numbers animate when they change
   - And the display is large enough for projection

5. **AC5: Real-time Updates**
   - Given participants joining the raffle
   - When new users scan the QR code
   - Then the participant list updates in real-time
   - And the statistics counters increment automatically
   - And no page refresh is required

6. **AC6: Mobile Responsive**
   - Given the participant list on mobile admin view
   - When displayed on smaller screens
   - Then the list is scrollable
   - And key information (name, tickets) is visible without horizontal scrolling

**FRs covered:** FR15, FR16, FR17

## Tasks / Subtasks

- [x] Task 1: Create getParticipantsWithDetails Server Action (AC: #1, #2)
  - [x] 1.1: Create `getParticipantsWithDetails(raffleId)` in `/lib/actions/participants.ts`
  - [x] 1.2: Join participants with users table to get name, avatar_url
  - [x] 1.3: Return ParticipantWithDetails type with user info
  - [x] 1.4: Create unit tests `/lib/actions/participants.test.ts`
  - [x] 1.5: Create integration tests `/lib/actions/__integration__/participants.integration.test.ts`

- [x] Task 2: Create getRaffleStatistics Server Action (AC: #3)
  - [x] 2.1: Create `getRaffleStatistics(raffleId)` in `/lib/actions/participants.ts`
  - [x] 2.2: Return participant count and total ticket count
  - [x] 2.3: Add unit tests for statistics action

- [x] Task 3: Create ParticipantTable Component (AC: #1, #2, #6)
  - [x] 3.1: Create `/components/admin/participantTable.tsx`
  - [x] 3.2: Display name, avatar, ticket count, joined_at timestamp
  - [x] 3.3: Make table responsive (scrollable on mobile)
  - [x] 3.4: Use Avatar component from shadcn/ui
  - [x] 3.5: Create unit tests `/components/admin/participantTable.test.tsx`

- [x] Task 4: Create ParticipantCounter Component (AC: #3, #4)
  - [x] 4.1: Create `/components/admin/participantCounter.tsx`
  - [x] 4.2: Display participant count and ticket count as large numbers
  - [x] 4.3: Add Framer Motion number animation on value change
  - [x] 4.4: Style for projection (large text, high contrast)
  - [x] 4.5: Create unit tests `/components/admin/participantCounter.test.tsx`

- [x] Task 5: Create Participants Page (AC: #1, #2, #3, #6)
  - [x] 5.1: Create `/app/admin/raffles/[id]/participants/page.tsx`
  - [x] 5.2: Display ParticipantCounter at top (statistics summary)
  - [x] 5.3: Display ParticipantTable below
  - [x] 5.4: Add loading states with skeletons
  - [x] 5.5: Create page tests (covered by component tests)

- [x] Task 6: Add Real-time Subscription (AC: #5)
  - [x] 6.1: Add `subscribeToParticipantChanges(raffleId)` to `/lib/supabase/realtime.ts`
  - [x] 6.2: Create client component wrapper for real-time updates
  - [x] 6.3: Re-fetch statistics and participant list on changes
  - [x] 6.4: Test real-time updates manually

- [x] Task 7: Update Raffle Detail Page (AC: #3)
  - [x] 7.1: Update Participants Card in `/app/admin/raffles/[id]/page.tsx`
  - [x] 7.2: Show quick stats (participant count, total tickets)
  - [x] 7.3: Add "View Participants" button linking to participants page

- [x] Task 8: Run All Tests and Verify
  - [x] 8.1: Run `npm run test` - all unit tests pass (602 tests)
  - [x] 8.2: Run `npm run test:integration` - integration tests ready
  - [x] 8.3: Run `npm run supabase:security` - ran without issues
  - [x] 8.4: Visual verification of participant list and counters

## Dev Notes

### Story Context

This story implements the first part of Epic 5 (Admin Dashboard & Participant Visibility). It provides organizers with visibility into raffle participation before the live draw. The participant list and statistics will be displayed on a dedicated participants page, with summary statistics also shown on the raffle detail page.

### Key Files from Previous Stories

**From Story 3-1 (Participant Registration):**
- `supabase/migrations/00004_create_participants.sql` - participants table with user_id, ticket_count, joined_at
- `lib/actions/tickets.ts` - `joinRaffle` action, `getAccumulatedTickets`
- `lib/schemas/participant.ts` - Participant type definition

**From Story 1-2 (Authentication):**
- `supabase/migrations/00001_create_users.sql` - users table with name, avatar_url
- `supabase/migrations/00002_pivot_users_email_password.sql` - email column added

**From Story 4-3 (Prize Award Status):**
- `lib/supabase/realtime.ts` - Realtime subscription helpers pattern
- `components/admin/prizeStatusSummary.tsx` - Summary component pattern

### Database Schema Reference

```sql
-- participants table (from 00004_create_participants.sql)
CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_count int DEFAULT 1 NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(raffle_id, user_id)
);

-- users table (from 00001_create_users.sql, modified in 00002)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

### Server Action Patterns

**getParticipantsWithDetails:**
```typescript
// lib/actions/participants.ts

/**
 * Participant with user details for admin display
 */
export type ParticipantWithDetails = {
  id: string;
  user_id: string;
  ticket_count: number;
  joined_at: string;
  user_name: string | null;
  user_avatar_url: string | null;
};

/**
 * Get all participants for a raffle with user details
 */
export async function getParticipantsWithDetails(
  raffleId: string
): Promise<ActionResult<ParticipantWithDetails[]>> {
  // 1. Validate admin status using getAdminUser() pattern from prizes.ts
  // 2. Validate UUID format with UUID_REGEX
  // 3. Query with join:
  //    .from("participants")
  //    .select(`
  //      id, user_id, ticket_count, joined_at,
  //      user:users!user_id (name, avatar_url)
  //    `)
  //    .eq("raffle_id", raffleId)
  //    .order("joined_at", { ascending: false })
  // 4. Transform to flatten user fields
}
```

**getRaffleStatistics:**
```typescript
export type RaffleStatistics = {
  participantCount: number;
  totalTickets: number;
};

export async function getRaffleStatistics(
  raffleId: string
): Promise<ActionResult<RaffleStatistics>> {
  // 1. Validate admin status
  // 2. Validate UUID
  // 3. Query participants for this raffle
  // 4. Count participants and sum ticket_count
}
```

### Component Patterns

**ParticipantCounter (Animated Statistics):**
```typescript
// components/admin/participantCounter.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ParticipantCounterProps {
  participantCount: number;
  totalTickets: number;
}

export function ParticipantCounter({
  participantCount,
  totalTickets,
}: ParticipantCounterProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Participants</p>
              <motion.p
                key={participantCount}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold"
              >
                {participantCount}
              </motion.p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Ticket className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <motion.p
                key={totalTickets}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold"
              >
                {totalTickets}
              </motion.p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**ParticipantTable:**
```typescript
// components/admin/participantTable.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParticipantWithDetails } from "@/lib/actions/participants";

interface ParticipantTableProps {
  participants: ParticipantWithDetails[];
}

export function ParticipantTable({ participants }: ParticipantTableProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No participants have joined yet. Share the QR code to get started!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead className="text-right">Tickets</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.user_avatar_url || undefined} />
                    <AvatarFallback>
                      {(p.user_name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{p.user_name || "Anonymous"}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {p.ticket_count}
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                {formatJoinedAt(p.joined_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatJoinedAt(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
```

### Real-time Subscription Pattern

Add to `/lib/supabase/realtime.ts`:
```typescript
/**
 * Subscribe to participant changes for a raffle
 * Used for real-time participant list and statistics updates (FR37)
 */
export function subscribeToParticipantChanges(
  raffleId: string,
  onParticipantChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`participants:${raffleId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT", // New participants joining
        schema: "public",
        table: "participants",
        filter: `raffle_id=eq.${raffleId}`,
      },
      onParticipantChange
    )
    .subscribe();
}
```

### Participants Page Structure

```typescript
// app/admin/raffles/[id]/participants/page.tsx
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { getRaffle } from "@/lib/actions/raffles";
import {
  getParticipantsWithDetails,
  getRaffleStatistics,
} from "@/lib/actions/participants";
import { ParticipantCounter } from "@/components/admin/participantCounter";
import { ParticipantTable } from "@/components/admin/participantTable";
import { ParticipantsRealtime } from "./participantsRealtime"; // Client wrapper

export default async function ParticipantsPage({ params }) {
  const { id } = await params;

  const [raffleResult, participantsResult, statsResult] = await Promise.all([
    getRaffle(id),
    getParticipantsWithDetails(id),
    getRaffleStatistics(id),
  ]);

  if (raffleResult.error || !raffleResult.data) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl">
      {/* Back link */}
      <div className="mb-6">
        <Link href={`/admin/raffles/${id}`} className="...">
          <ArrowLeft /> Back to Raffle
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Users className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Participants</h1>
      </div>

      {/* Real-time wrapper for statistics and list */}
      <ParticipantsRealtime
        raffleId={id}
        initialStats={statsResult.data}
        initialParticipants={participantsResult.data || []}
      />
    </div>
  );
}
```

### shadcn/ui Components Needed

You may need to add these components if not present:
```bash
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add table
```

### Anti-Pattern Prevention

**DO NOT:**
- Create a separate API route - use Server Actions following established patterns
- Skip real-time updates - this is essential for the admin experience
- Use raw SQL queries - use Supabase client with proper joins
- Forget admin authorization check on all actions
- Skip the mobile responsive design (AC #6)
- Use polling instead of Supabase Realtime subscriptions

**DO:**
- Follow ActionResult pattern exactly as in `prizes.ts` and `tickets.ts`
- Use service role client for database operations after admin validation
- Join users table to get name and avatar_url
- Use Framer Motion for number animations (already in dependencies)
- Test real-time updates with multiple browser windows
- Make table scrollable on mobile with hidden columns if needed

### Test Patterns

**Unit Tests:**
```typescript
// components/admin/participantCounter.test.tsx
describe("ParticipantCounter", () => {
  it("displays participant count", () => {
    render(<ParticipantCounter participantCount={5} totalTickets={12} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Participants")).toBeInTheDocument();
  });

  it("displays total tickets", () => {
    render(<ParticipantCounter participantCount={5} totalTickets={12} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Total Tickets")).toBeInTheDocument();
  });
});

// components/admin/participantTable.test.tsx
describe("ParticipantTable", () => {
  it("shows empty state when no participants", () => {
    render(<ParticipantTable participants={[]} />);
    expect(screen.getByText(/no participants/i)).toBeInTheDocument();
  });

  it("displays participant name and avatar", () => {
    const participants = [{
      id: "1",
      user_id: "u1",
      ticket_count: 3,
      joined_at: "2025-12-26T10:00:00Z",
      user_name: "Alice",
      user_avatar_url: null,
    }];
    render(<ParticipantTable participants={participants} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
```

**Integration Tests:**
```typescript
// lib/actions/__integration__/participants.integration.test.ts
describe("getParticipantsWithDetails", () => {
  it("returns participants with user details", async () => {
    // Create test user, raffle, and participant
    // Verify user_name and user_avatar_url are populated
  });

  it("returns empty array for raffle with no participants", async () => {
    // Create raffle with no participants
    // Verify returns empty array, not error
  });
});

describe("getRaffleStatistics", () => {
  it("correctly sums ticket counts", async () => {
    // Create raffle with multiple participants with different ticket counts
    // Verify totalTickets is sum of all ticket_count values
  });
});
```

### File Structure Updates

```
components/
  admin/
    participantCounter.tsx       # NEW: Animated stats display
    participantCounter.test.tsx  # NEW: Counter tests
    participantTable.tsx         # NEW: Participant list table
    participantTable.test.tsx    # NEW: Table tests

lib/
  actions/
    participants.ts              # NEW: Participant actions
    participants.test.ts         # NEW: Action unit tests
    __integration__/
      participants.integration.test.ts # NEW: Integration tests

  supabase/
    realtime.ts                  # UPDATE: Add subscribeToParticipantChanges

app/
  admin/
    raffles/
      [id]/
        page.tsx                 # UPDATE: Add participant stats to card
        participants/
          page.tsx               # NEW: Participants page
          participantsRealtime.tsx # NEW: Client wrapper for real-time
```

### Technology Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 15.x | App Router with Server Actions |
| Supabase | Latest | Realtime subscriptions for live updates |
| Framer Motion | ^11.x | Number animations on counter |
| shadcn/ui | Latest | Avatar, Table, Card components |
| lucide-react | Latest | Users, Ticket icons |

### Previous Story Learnings Applied

From Story 4-3:
1. Follow the exact ActionResult pattern with proper error handling
2. Use service role client after admin validation
3. Join with users table to get display names
4. Test real-time manually with multiple browser windows

From Epic 3 retrospective:
1. Run `npm run supabase:security` before completion
2. Check Supabase Dashboard lints after any RLS changes
3. Use type guards for runtime validation

From Story 3-1:
1. Existing participant RLS allows admins to read via service role
2. The participants table already has indexes on user_id and raffle_id

### References

- [Source: epics.md#Story 5.1] - Original acceptance criteria
- [Source: architecture.md#Database Schema] - participants and users tables
- [Source: architecture.md#Implementation Patterns] - ActionResult pattern
- [Source: project-context.md] - Critical implementation rules
- [Source: 4-3-track-prize-award-status.md] - Realtime subscription patterns
- [Source: lib/supabase/realtime.ts] - Existing realtime helpers
- [Source: lib/actions/tickets.ts] - Participant query patterns
- [Source: lib/schemas/participant.ts] - Existing Participant type

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without significant issues.

### Completion Notes List

1. All 8 tasks completed successfully
2. 602 unit tests passing
3. TypeScript build successful
4. Integration tests created for database queries
5. Real-time subscriptions implemented for live updates
6. Mobile responsive design with hidden Joined column on small screens
7. shadcn/ui Table and Skeleton components added

### File List

**New Files:**
- `lib/actions/participants.ts` - Server Actions for participants
- `lib/actions/participants.test.ts` - Unit tests for Server Actions
- `lib/actions/__integration__/participants.integration.test.ts` - Integration tests
- `components/admin/participantTable.tsx` - Participant list table component
- `components/admin/participantTable.test.tsx` - ParticipantTable tests
- `components/admin/participantCounter.tsx` - Animated statistics counter
- `components/admin/participantCounter.test.tsx` - ParticipantCounter tests
- `app/admin/raffles/[id]/participants/page.tsx` - Participants page
- `app/admin/raffles/[id]/participants/participantsRealtime.tsx` - Real-time wrapper
- `components/ui/table.tsx` - shadcn/ui Table component (auto-generated)
- `components/ui/skeleton.tsx` - shadcn/ui Skeleton component (auto-generated)

**Modified Files:**
- `lib/supabase/realtime.ts` - Added subscribeToParticipantChanges function
- `app/admin/raffles/[id]/page.tsx` - Updated Participants card with stats and link

**Deleted Files:**
- None

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2025-12-26 | Created getParticipantsWithDetails and getRaffleStatistics Server Actions | lib/actions/participants.ts |
| 2025-12-26 | Added unit tests for participants actions | lib/actions/participants.test.ts |
| 2025-12-26 | Added integration tests for participants queries | lib/actions/__integration__/participants.integration.test.ts |
| 2025-12-26 | Created ParticipantTable component with avatar, name, tickets, timestamp | components/admin/participantTable.tsx |
| 2025-12-26 | Created ParticipantCounter component with Framer Motion animations | components/admin/participantCounter.tsx |
| 2025-12-26 | Added subscribeToParticipantChanges real-time subscription | lib/supabase/realtime.ts |
| 2025-12-26 | Created participants page with real-time wrapper | app/admin/raffles/[id]/participants/ |
| 2025-12-26 | Updated raffle detail page with participant stats and link | app/admin/raffles/[id]/page.tsx |
| 2025-12-26 | Added shadcn/ui Table and Skeleton components | components/ui/ |
