---
project_name: 'servus-raffle'
user_name: 'Ben'
date: '2025-12-25'
sections_completed: ['technology_stack', 'implementation_rules', 'project_structure', 'testing', 'error_handling', 'critical_rules', 'usage_guidelines']
status: 'complete'
rule_count: 25
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing servus-raffle. Read before writing any code._

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | Latest (App Router) | Framework |
| Supabase | Latest | Database + Auth + Realtime |
| TypeScript | Strict mode | Language |
| Tailwind CSS | Latest | Styling |
| shadcn/ui | Latest | UI Components |
| Framer Motion | ^11.x | Wheel animation |
| canvas-confetti | ^1.9.x | Winner celebration |
| qrcode.react | ^4.x | QR code generation |
| Zod | Latest | Validation |
| Sentry | Free tier | Error monitoring |

**Starter Command:**
```bash
npx create-next-app --example with-supabase servus-raffle
```

---

## Critical Implementation Rules

### Database (PostgreSQL/Supabase)

- **ALWAYS** use `snake_case` for tables, columns, foreign keys
- Tables: plural (`raffles`, `participants`, `prizes`)
- Foreign keys: `{table}_id` format (`user_id`, `raffle_id`)
- Timestamps: Use `timestamptz` type, store as UTC
- **NEVER** use camelCase in database identifiers

```sql
-- ✅ Correct
SELECT user_id, ticket_count, created_at FROM participants

-- ❌ Wrong
SELECT userId, ticketCount, createdAt FROM participants
```

### TypeScript/React

- Components: `PascalCase` (`RaffleWheel`, `TicketCircle`)
- Files: `camelCase.tsx` (`raffleWheel.tsx`, `ticketCircle.tsx`)
- Functions/variables: `camelCase` (`drawWinner`, `ticketCount`)
- Constants: `SCREAMING_SNAKE_CASE` (`RAFFLE_EVENTS`, `MAX_TICKETS`)
- Types/Interfaces: `PascalCase` (`Raffle`, `Participant`)

### Server Actions

**ALWAYS return `{ data, error }` tuple - NEVER throw errors:**

```typescript
// ✅ Correct
export async function drawWinner(raffleId: string): Promise<ActionResult<Winner>> {
  try {
    const winner = await selectWinner(raffleId)
    return { data: winner, error: null }
  } catch (e) {
    return { data: null, error: "Failed to draw winner" }
  }
}

// ❌ Wrong - throwing instead of returning error
export async function drawWinner(raffleId: string) {
  const winner = await selectWinner(raffleId)
  if (!winner) throw new Error("No winner")  // DON'T DO THIS
  return winner
}
```

### Real-time Events

- Event constants: `SCREAMING_SNAKE_CASE`
- Channel format: `raffle:${raffleId}:draw`
- Use Broadcast for ephemeral events (wheel sync)
- Use Postgres Changes for persistent state

```typescript
// Event naming
export const RAFFLE_EVENTS = {
  DRAW_START: 'DRAW_START',
  WHEEL_SEED: 'WHEEL_SEED',
  WINNER_REVEALED: 'WINNER_REVEALED',
} as const

// ❌ Wrong
channel.send({ event: 'draw-start' })  // Should be DRAW_START
```

### Validation

- **ALWAYS** use Zod for external data validation
- Schema naming: `{Entity}Schema` or `{Action}Schema`
- Validate at system boundaries (API input, form submission)

```typescript
export const CreateRaffleSchema = z.object({
  name: z.string().min(1),
  prizes: z.array(PrizeSchema),
})
```

---

## Project Structure

```
app/
  (auth)/          → OAuth login/callback
  (participant)/   → Mobile user experience
  (admin)/         → Organizer dashboard
components/
  ui/              → shadcn/ui primitives
  raffle/          → RaffleWheel, TicketCircle, WinnerCard
  admin/           → QRCodeDisplay, DrawControls
lib/
  supabase/        → Client utilities, realtime helpers
  actions/         → Server Actions (drawWinner, grantTicket)
  schemas/         → Zod validation schemas
```

---

## Testing Rules

- **Co-locate** tests with source: `raffleWheel.tsx` + `raffleWheel.test.tsx`
- Test utilities go in `/lib/test-utils.ts`
- Focus on critical paths: draw logic, ticket accumulation, real-time sync

---

## Error Handling

| Error Type | Handling |
|------------|----------|
| Validation | Inline form errors |
| Business logic | Toast notification |
| Network | Toast + retry option |
| Unexpected | Error boundary → Sentry |

```typescript
// Expected errors → toast
toast.error("No participants to draw from")

// Unexpected errors → caught by error boundary at layout level
```

---

## Critical Don't-Miss Rules

### Anti-Patterns to Avoid

1. **NEVER** throw from Server Actions - always return `{ data, error }`
2. **NEVER** use camelCase in database queries
3. **NEVER** mix event naming conventions (always SCREAMING_SNAKE_CASE)
4. **NEVER** access Supabase service role key from client
5. **NEVER** store secrets in NEXT_PUBLIC_* variables

### Security Rules

- Admin check via environment allowlist (`ADMIN_EMAILS`)
- RLS policies enforce data access at database level
- Sensitive mutations (drawWinner) use Server Actions with service role
- OAuth tokens managed by Supabase Auth (never manual)

### Real-time Sync Critical Path

The wheel animation MUST be synchronized across all devices:
1. Admin triggers `drawWinner()` Server Action
2. Server Action broadcasts `DRAW_START` + `WHEEL_SEED` via Supabase Broadcast
3. ALL clients receive same seed and animate identically
4. Server Action broadcasts `WINNER_REVEALED` after animation duration
5. **NEVER** let clients independently calculate winner

---

## Quick Reference

| What | Convention |
|------|------------|
| DB tables | `snake_case` plural |
| DB columns | `snake_case` |
| Components | `PascalCase` |
| Files | `camelCase.tsx` |
| Server Actions | Return `{ data, error }` |
| Events | `SCREAMING_SNAKE_CASE` |
| Validation | Zod schemas |
| Tests | Co-located |

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Refer to `architecture.md` for detailed rationale

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

---

_Last Updated: 2025-12-25_
