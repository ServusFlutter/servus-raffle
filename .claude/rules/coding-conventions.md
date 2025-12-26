# Coding Conventions

## Naming Patterns

### Database (PostgreSQL/Supabase)

| Element | Convention | Example |
|---------|------------|---------|
| Tables | `snake_case` plural | `raffles`, `participants`, `prizes` |
| Columns | `snake_case` | `created_at`, `ticket_count`, `raffle_id` |
| Foreign keys | `{table}_id` | `user_id`, `raffle_id`, `prize_id` |
| Indexes | `idx_{table}_{column}` | `idx_participants_user_id` |

### TypeScript/React

| Element | Convention | Example |
|---------|------------|---------|
| Components | `PascalCase` | `RaffleWheel`, `TicketCircle`, `WinnerCard` |
| Component files | `kebab-case.tsx` | `raffle-wheel.tsx`, `ticket-circle.tsx` |
| Functions | `camelCase` | `drawWinner`, `getTicketCount`, `handleClick` |
| Variables | `camelCase` | `currentRaffle`, `ticketCount`, `isLoading` |
| Types/Interfaces | `PascalCase` | `Raffle`, `Participant`, `DrawResult` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_TICKETS`, `WHEEL_DURATION` |
| Test files | `*.test.ts(x)` | `raffle-wheel.test.tsx` |

### Routes & API

| Element | Convention | Example |
|---------|------------|---------|
| Routes | kebab-case | `/api/draw-winner`, `/raffle/[id]` |
| Query params | camelCase | `?raffleId=123` |

## Server Action Response Format

All Server Actions MUST return this shape - **never throw errors**:

```typescript
type ActionResult<T> = {
  data: T | null
  error: string | null
}

// Success example
export async function createRaffle(name: string): Promise<ActionResult<Raffle>> {
  // ... logic
  return { data: raffle, error: null }
}

// Error example
export async function drawWinner(raffleId: string): Promise<ActionResult<Winner>> {
  // ... validation fails
  return { data: null, error: "No eligible participants" }
}
```

## Event Constants

```typescript
// lib/constants/events.ts
export const RAFFLE_EVENTS = {
  DRAW_START: 'DRAW_START',
  WHEEL_SEED: 'WHEEL_SEED',
  WINNER_REVEALED: 'WINNER_REVEALED',
  RAFFLE_ENDED: 'RAFFLE_ENDED',
} as const

export type RaffleEventType = keyof typeof RAFFLE_EVENTS
```

## Zod Schema Naming

```typescript
// Schemas follow {Entity}Schema or {Action}Schema pattern
export const RaffleSchema = z.object({ ... })
export const CreateRaffleSchema = z.object({ ... })
export const DrawWinnerSchema = z.object({ ... })
```

## Date/Time Handling

| Context | Format |
|---------|--------|
| Database | PostgreSQL `timestamptz` (stored as UTC) |
| API/JSON | ISO 8601 strings: `"2025-12-25T19:00:00Z"` |
| Display | Format locally using `Intl.DateTimeFormat` |

## Good Examples

```typescript
// Database query with snake_case
const { data } = await supabase
  .from('participants')
  .select('user_id, ticket_count')
  .eq('raffle_id', raffleId)

// Server Action with result wrapper
export async function drawWinner(raffleId: string): Promise<ActionResult<Winner>> {
  const winner = await selectWinner(raffleId)
  return { data: winner, error: null }
}

// Event broadcast
channel.send({
  type: 'broadcast',
  event: RAFFLE_EVENTS.DRAW_START,
  payload: { raffleId, timestamp: new Date().toISOString() }
})

// Component with props interface
interface TicketCircleProps {
  count: number
  className?: string
}

export function TicketCircle({ count, className }: TicketCircleProps) {
  return <div className={cn('...', className)}>{count}</div>
}
```

## Anti-Patterns

```typescript
// WRONG: camelCase in database
.from('participants').select('userId, ticketCount')

// WRONG: Throwing instead of returning error
throw new Error("No participants")

// WRONG: Inconsistent event naming
channel.send({ event: 'draw-start' })

// WRONG: No props interface
export function TicketCircle({ count }) { ... }

// WRONG: Inline styles instead of Tailwind
<div style={{ display: 'flex' }}>
```
