# Story 5.2: Raffle History View

Status: ready-for-dev

## Story

As an **organizer**,
I want **to view past raffles and their winners**,
so that **I can track prize distribution over time and ensure fairness**.

## Acceptance Criteria

1. **AC1: History Navigation**
   - Given an admin on the admin dashboard
   - When they navigate to "History" or "Past Raffles"
   - Then they see a list of completed raffles sorted by date (newest first)

2. **AC2: Raffle Summary Display**
   - Given the raffle history list
   - When displayed
   - Then each raffle shows: name, date, participant count, and number of prizes awarded

3. **AC3: Raffle Detail with Winners**
   - Given an admin clicking on a past raffle
   - When the detail view opens
   - Then they see the complete list of winners for that raffle
   - And each winner shows: name, prize won, and ticket count at time of win

4. **AC4: Winners Table Schema Verification**
   - Given the winners table
   - When the `winners` table is created
   - Then it exists with columns: `id` (uuid), `raffle_id` (uuid references raffles), `prize_id` (uuid references prizes), `user_id` (uuid references users), `tickets_at_win` (int), `won_at` (timestamptz)
   - NOTE: This table already exists from Story 3-3 (00005_create_winners.sql)

5. **AC5: Multi-Win Visibility**
   - Given the history view
   - When analyzing prize distribution
   - Then admins can see if the same person has won multiple times across events
   - And this helps verify the fairness system is working

6. **AC6: In-Progress Distinction**
   - Given a raffle with no winners yet
   - When viewed in history
   - Then it shows as "In Progress" or "Active"
   - And is clearly distinguished from completed raffles

**FRs covered:** FR20 (View raffle history - past raffles and winners)

## Tasks / Subtasks

- [ ] Task 1: Create getRaffleHistory Server Action (AC: #1, #2, #6)
  - [ ] 1.1: Create `getRaffleHistory()` in `/lib/actions/history.ts`
  - [ ] 1.2: Return all raffles with aggregated statistics (participant_count, prizes_awarded, total_prizes)
  - [ ] 1.3: Sort by created_at descending (newest first)
  - [ ] 1.4: Distinguish between completed and active/draft raffles with status field
  - [ ] 1.5: Create unit tests `/lib/actions/history.test.ts`

- [ ] Task 2: Create getRaffleWinners Server Action (AC: #3)
  - [ ] 2.1: Add `getRaffleWinners(raffleId)` to `/lib/actions/history.ts`
  - [ ] 2.2: Join winners with users and prizes tables
  - [ ] 2.3: Return winner name, prize name, tickets_at_win, won_at
  - [ ] 2.4: Sort by won_at (draw order)
  - [ ] 2.5: Create unit tests for winners action

- [ ] Task 3: Create getMultiWinnerStats Server Action (AC: #5)
  - [ ] 3.1: Add `getMultiWinnerStats()` to `/lib/actions/history.ts`
  - [ ] 3.2: Query winners table grouped by user_id, count wins
  - [ ] 3.3: Return users who have won multiple times with their win counts
  - [ ] 3.4: Include in history page for fairness verification

- [ ] Task 4: Create History Types and Schemas (All ACs)
  - [ ] 4.1: Create `/lib/schemas/history.ts` with RaffleHistoryItem type
  - [ ] 4.2: Add WinnerDetail type for winner display
  - [ ] 4.3: Add MultiWinnerStat type for fairness tracking
  - [ ] 4.4: Export all types for component use

- [ ] Task 5: Create RaffleHistoryList Component (AC: #1, #2, #6)
  - [ ] 5.1: Create `/components/admin/raffleHistoryList.tsx`
  - [ ] 5.2: Display raffle name, date, participant count, prizes awarded
  - [ ] 5.3: Show status badge differentiating completed vs active/draft
  - [ ] 5.4: Make each item clickable to open detail modal or navigate
  - [ ] 5.5: Create unit tests `/components/admin/raffleHistoryList.test.tsx`

- [ ] Task 6: Create WinnerList Component (AC: #3)
  - [ ] 6.1: Create `/components/admin/winnerList.tsx`
  - [ ] 6.2: Display winner name, prize won, tickets at win, timestamp
  - [ ] 6.3: Use Avatar component for winner display
  - [ ] 6.4: Show empty state when no winners yet
  - [ ] 6.5: Create unit tests `/components/admin/winnerList.test.tsx`

- [ ] Task 7: Create MultiWinnerAlert Component (AC: #5)
  - [ ] 7.1: Create `/components/admin/multiWinnerAlert.tsx`
  - [ ] 7.2: Show alert if any user has won 2+ times
  - [ ] 7.3: Display user names and win counts
  - [ ] 7.4: Style as informational (not error - this is expected for fairness tracking)
  - [ ] 7.5: Create unit tests

- [ ] Task 8: Create History Page (AC: #1, #2, #3, #5, #6)
  - [ ] 8.1: Create `/app/admin/history/page.tsx`
  - [ ] 8.2: Display RaffleHistoryList with all raffles
  - [ ] 8.3: Display MultiWinnerAlert section at top
  - [ ] 8.4: Add loading states with skeletons
  - [ ] 8.5: Create integration tests

- [ ] Task 9: Create History Detail Modal/Page (AC: #3)
  - [ ] 9.1: Create modal or detail view for single raffle history
  - [ ] 9.2: Show complete winner list using WinnerList component
  - [ ] 9.3: Show raffle summary at top (name, date, stats)
  - [ ] 9.4: Add back navigation

- [ ] Task 10: Add History Navigation Link (AC: #1)
  - [ ] 10.1: Add "History" link to admin navigation/layout
  - [ ] 10.2: Update admin dashboard to link to history page
  - [ ] 10.3: Consider adding quick stats card for history

- [ ] Task 11: Run All Tests and Verify
  - [ ] 11.1: Run `npm run test` - all unit tests pass
  - [ ] 11.2: Run `npm run test:integration` - integration tests pass
  - [ ] 11.3: Run `npm run supabase:security` - no security issues
  - [ ] 11.4: Run `npm run build` - TypeScript build succeeds
  - [ ] 11.5: Visual verification of history page functionality

## Dev Notes

### Story Context

This story implements the second part of Epic 5 (Admin Dashboard & Participant Visibility). It provides organizers with historical visibility into past raffles and their outcomes. The history view enables tracking prize distribution over time and verifying the fairness system works correctly by showing if users have won multiple times.

### Database Schema - ALREADY EXISTS

The `winners` table already exists from Story 3-3 (00005_create_winners.sql):

```sql
-- FROM: supabase/migrations/00005_create_winners.sql
CREATE TABLE IF NOT EXISTS winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  prize_id uuid,  -- Nullable until Epic 4 creates prizes table (now exists)
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tickets_at_win int NOT NULL,
  won_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes exist:
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_winners_raffle_id ON winners(raffle_id);
CREATE INDEX idx_winners_user_won_at ON winners(user_id, won_at DESC);
```

**DO NOT create a new migration for the winners table - it already has the correct schema.**

However, you may need to add a foreign key constraint for prize_id now that prizes table exists. Check if this is needed:
```sql
-- Only if needed (check first):
ALTER TABLE winners
  ADD CONSTRAINT fk_winners_prize_id
  FOREIGN KEY (prize_id) REFERENCES prizes(id);
```

### Key Files from Previous Stories

**From Story 3-3 (Ticket Accumulation):**
- `supabase/migrations/00005_create_winners.sql` - winners table with all required columns
- `lib/actions/tickets.ts` - `getAccumulatedTickets` queries winners table for last win

**From Story 5-1 (Just Completed):**
- `lib/actions/participants.ts` - ActionResult pattern, admin validation, service role client
- `components/admin/participantTable.tsx` - Table pattern with avatar and user join
- `components/admin/participantCounter.tsx` - Statistics display pattern

**From Story 4-1 (Prize Management):**
- `supabase/migrations/00011_create_prizes.sql` - prizes table with awarded_to, awarded_at
- `lib/actions/prizes.ts` - Server Action patterns for prize operations

### Server Action Patterns

Follow the exact patterns from `lib/actions/participants.ts`:

**getRaffleHistory:**
```typescript
// lib/actions/history.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/utils/admin";

type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

export type RaffleHistoryItem = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  participant_count: number;
  prizes_awarded: number;
  total_prizes: number;
};

export async function getRaffleHistory(): Promise<ActionResult<RaffleHistoryItem[]>> {
  // 1. Validate admin status using getAdminUser() pattern
  // 2. Query raffles with aggregated counts:
  //    - Count participants via subquery or join
  //    - Count prizes where awarded_to IS NOT NULL (prizes_awarded)
  //    - Count total prizes
  // 3. Sort by created_at DESC
  // 4. Transform and return
}
```

**getRaffleWinners:**
```typescript
export type WinnerDetail = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_avatar_url: string | null;
  prize_name: string;
  prize_id: string;
  tickets_at_win: number;
  won_at: string;
};

export async function getRaffleWinners(
  raffleId: string
): Promise<ActionResult<WinnerDetail[]>> {
  // 1. Validate admin
  // 2. Validate UUID format with UUID_REGEX
  // 3. Query with joins:
  //    .from("winners")
  //    .select(`
  //      id, user_id, tickets_at_win, won_at, prize_id,
  //      user:users!user_id (name, avatar_url),
  //      prize:prizes!prize_id (name)
  //    `)
  //    .eq("raffle_id", raffleId)
  //    .order("won_at", { ascending: true })
  // 4. Transform to flatten joins
}
```

**getMultiWinnerStats:**
```typescript
export type MultiWinnerStat = {
  user_id: string;
  user_name: string | null;
  win_count: number;
  last_win_at: string;
};

export async function getMultiWinnerStats(): Promise<ActionResult<MultiWinnerStat[]>> {
  // 1. Validate admin
  // 2. Raw query or aggregate:
  //    SELECT user_id, COUNT(*) as win_count, MAX(won_at) as last_win_at
  //    FROM winners
  //    GROUP BY user_id
  //    HAVING COUNT(*) > 1
  //    ORDER BY win_count DESC
  // 3. Join with users table for names
  // 4. Return users with 2+ wins
}
```

### Component Patterns

**RaffleHistoryList:**
```typescript
// components/admin/raffleHistoryList.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RaffleHistoryItem } from "@/lib/actions/history";

interface RaffleHistoryListProps {
  raffles: RaffleHistoryItem[];
  onRaffleClick: (raffleId: string) => void;
}

export function RaffleHistoryList({ raffles, onRaffleClick }: RaffleHistoryListProps) {
  if (raffles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No raffle history yet. Create and run your first raffle!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {raffles.map((raffle) => (
        <Card
          key={raffle.id}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onRaffleClick(raffle.id)}
        >
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{raffle.name}</CardTitle>
                <Badge variant={getStatusVariant(raffle.status)}>
                  {raffle.status === "completed" ? "Completed" :
                   raffle.status === "active" ? "Active" : "Draft"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(raffle.created_at)}
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>{raffle.participant_count} participants</span>
              <span>{raffle.prizes_awarded} of {raffle.total_prizes} prizes awarded</span>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
```

**WinnerList:**
```typescript
// components/admin/winnerList.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WinnerDetail } from "@/lib/actions/history";

interface WinnerListProps {
  winners: WinnerDetail[];
}

export function WinnerList({ winners }: WinnerListProps) {
  if (winners.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No winners yet. This raffle is still in progress.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Winner</TableHead>
          <TableHead>Prize</TableHead>
          <TableHead className="text-right">Tickets</TableHead>
          <TableHead className="text-right hidden sm:table-cell">Won At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {winners.map((winner) => (
          <TableRow key={winner.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={winner.user_avatar_url || undefined} />
                  <AvatarFallback>
                    {(winner.user_name || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{winner.user_name || "Anonymous"}</span>
              </div>
            </TableCell>
            <TableCell>{winner.prize_name}</TableCell>
            <TableCell className="text-right font-mono">{winner.tickets_at_win}</TableCell>
            <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
              {formatWonAt(winner.won_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Page Structure

**History Page:**
```typescript
// app/admin/history/page.tsx
import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { getRaffleHistory, getMultiWinnerStats } from "@/lib/actions/history";
import { RaffleHistoryList } from "@/components/admin/raffleHistoryList";
import { MultiWinnerAlert } from "@/components/admin/multiWinnerAlert";

export default async function HistoryPage() {
  const [historyResult, multiWinnerResult] = await Promise.all([
    getRaffleHistory(),
    getMultiWinnerStats(),
  ]);

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <History className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Raffle History</h1>
      </div>

      {/* Multi-Winner Fairness Check */}
      {multiWinnerResult.data && multiWinnerResult.data.length > 0 && (
        <MultiWinnerAlert multiWinners={multiWinnerResult.data} />
      )}

      {/* Raffle History List */}
      {historyResult.error ? (
        <div className="text-destructive">{historyResult.error}</div>
      ) : (
        <RaffleHistoryList raffles={historyResult.data || []} />
      )}
    </div>
  );
}
```

### Testing Patterns

**Unit Tests:**
```typescript
// lib/actions/history.test.ts
describe("getRaffleHistory", () => {
  it("returns raffles sorted by date descending", async () => { ... });
  it("returns empty array when no raffles exist", async () => { ... });
  it("calculates correct participant counts", async () => { ... });
  it("calculates correct prizes awarded counts", async () => { ... });
  it("returns error for non-admin users", async () => { ... });
});

describe("getRaffleWinners", () => {
  it("returns winners with user and prize details", async () => { ... });
  it("returns empty array for raffle with no winners", async () => { ... });
  it("validates raffle ID format", async () => { ... });
});

describe("getMultiWinnerStats", () => {
  it("returns users who won multiple times", async () => { ... });
  it("excludes users with only one win", async () => { ... });
  it("returns empty array when no multi-winners exist", async () => { ... });
});
```

**Integration Tests:**
```typescript
// lib/actions/__integration__/history.integration.test.ts
describe("History Integration Tests", () => {
  it("correctly aggregates participant counts from database", async () => { ... });
  it("correctly counts awarded prizes vs total prizes", async () => { ... });
  it("joins winners with users and prizes correctly", async () => { ... });
});
```

### Anti-Pattern Prevention

**DO NOT:**
- Create a new winners table migration - it already exists (00005_create_winners.sql)
- Skip admin authorization on any Server Action
- Use raw SQL for simple queries - use Supabase client with joins
- Forget to handle null prize_id (some winners may not have prize linked)
- Skip the multi-winner fairness check - this is a key feature for organizers
- Use polling for updates - history is static, no real-time needed

**DO:**
- Follow ActionResult pattern exactly as in `participants.ts`
- Use service role client for database operations after admin validation
- Join tables properly (winners -> users, winners -> prizes)
- Handle empty states gracefully in components
- Add skeleton loading states for better UX
- Distinguish completed vs active raffles clearly with badges

### File Structure Updates

```
components/
  admin/
    raffleHistoryList.tsx       # NEW: History list component
    raffleHistoryList.test.tsx  # NEW: List tests
    winnerList.tsx              # NEW: Winner display table
    winnerList.test.tsx         # NEW: Winner list tests
    multiWinnerAlert.tsx        # NEW: Fairness tracking alert
    multiWinnerAlert.test.tsx   # NEW: Alert tests

lib/
  actions/
    history.ts                  # NEW: History server actions
    history.test.ts             # NEW: Action unit tests
    __integration__/
      history.integration.test.ts # NEW: Integration tests

  schemas/
    history.ts                  # NEW: History types

app/
  admin/
    history/
      page.tsx                  # NEW: History page
      loading.tsx               # NEW: Loading state
    page.tsx                    # UPDATE: Add History link/card
    layout.tsx                  # UPDATE: Add History nav link
```

### Technology Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 15.x | App Router with Server Actions |
| Supabase | Latest | Service role for admin queries |
| shadcn/ui | Latest | Table, Badge, Card, Avatar components |
| lucide-react | Latest | History, ArrowLeft icons |

### Previous Story Learnings Applied

From Story 5-1 (Participant List):
1. Use exact ActionResult pattern with proper error handling
2. Use service role client after admin validation
3. Join with users table to get display names and avatars
4. Use Table component from shadcn/ui for consistent styling

From Epic 3 retrospective:
1. Run `npm run supabase:security` before completion
2. Check for proper RLS policy compliance
3. Use type guards for runtime validation

From Story 4-3:
1. Badge component for status indicators
2. Consistent date formatting patterns

### References

- [Source: epics.md#Story 5.2] - Original acceptance criteria
- [Source: architecture.md#Database Schema] - winners, raffles, prizes tables
- [Source: architecture.md#Implementation Patterns] - ActionResult pattern
- [Source: project-context.md] - Critical implementation rules
- [Source: 5-1-participant-list-and-statistics-dashboard.md] - Table and action patterns
- [Source: supabase/migrations/00005_create_winners.sql] - Existing winners table
- [Source: lib/actions/participants.ts] - Server Action patterns

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
