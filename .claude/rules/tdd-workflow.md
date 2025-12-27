# Test-Driven Development Workflow

## TDD is MANDATORY

This project follows **strict TDD**. You MUST write tests BEFORE implementation code.

## The TDD Cycle

### Step 1: Write Failing Tests First

Before writing ANY implementation code:

1. Create the test file alongside the source file
2. Write test cases covering the expected behavior
3. Write test cases for edge cases and error conditions
4. Include at least one "happy path" and one "error path" test

```typescript
// lib/actions/draw.test.ts
import { describe, it, expect } from 'vitest'
import { drawWinner } from './draw'

describe('drawWinner', () => {
  it('should return a winner when participants exist', async () => {
    const result = await drawWinner('raffle-123')

    expect(result.error).toBeNull()
    expect(result.data).toMatchObject({
      userId: expect.any(String),
      ticketsAtWin: expect.any(Number),
    })
  })

  it('should return error when no participants', async () => {
    const result = await drawWinner('empty-raffle')

    expect(result.data).toBeNull()
    expect(result.error).toBe('No eligible participants')
  })
})
```

### Step 2: Verify Tests Fail

Run the tests to confirm they fail for the RIGHT reason:

```bash
bun run test lib/actions/draw.test.ts
```

Expected: Tests should fail because the function doesn't exist or returns wrong values.

**CRITICAL**: If tests pass before implementation, your tests are not testing anything meaningful.

### Step 3: Implement Minimal Code

Write the **simplest code** that makes tests pass:

- No extra features
- No premature optimization
- Just enough to satisfy the tests

```typescript
// lib/actions/draw.ts
'use server'

export async function drawWinner(raffleId: string): Promise<ActionResult<Winner>> {
  const participants = await getParticipants(raffleId)

  if (participants.length === 0) {
    return { data: null, error: 'No eligible participants' }
  }

  const winner = selectRandomWinner(participants)
  return { data: winner, error: null }
}
```

### Step 4: Run Tests Until Green

```bash
bun run test lib/actions/draw.test.ts
```

Iterate until all tests pass.

### Step 5: Refactor (Red-Green-Refactor)

With green tests, refactor for clarity:

- Extract helper functions
- Improve naming
- Remove duplication
- **Run tests after each change**

## Test Type Decision Guide

Before writing tests, determine which type to use:

| Scenario | Test Type | Location | Why |
|----------|-----------|----------|-----|
| Zod schema validation | Unit | `*.test.ts` | Fast, isolated logic |
| Server Action logic | Unit | `*.test.ts` | Mock DB, test business logic |
| Server Action + real DB | Integration | `tests/integration/` | Verify DB operations |
| RLS policies | Integration | `tests/integration/` | Test real permissions |
| Database constraints | Integration | `tests/integration/` | Test real constraints |
| UI component renders | Unit | `*.test.tsx` | Fast feedback |
| User clicks through flow | E2E | `tests/e2e/` | Real browser, full stack |
| Realtime sync | E2E | `tests/e2e/` | Requires browser + Supabase |
| Cross-page navigation | E2E | `tests/e2e/` | Full user journey |

### TDD Applies to ALL Test Types

The TDD cycle (Red → Green → Refactor) applies whether you're writing:

1. **Unit test** → Write failing test → Implement function → Test passes
2. **Integration test** → Write failing test → Implement with DB → Test passes
3. **E2E test** → Write failing test → Implement UI + backend → Test passes

### Test Layer Separation

```
┌─────────────────────────────────────┐
│  E2E (Playwright + Supawright)      │  Browser-based, slow, thorough
├─────────────────────────────────────┤
│  Integration (Vitest + real DB)     │  Real Supabase, fast, focused
├─────────────────────────────────────┤
│  Unit (Vitest + mocks)              │  Fastest, isolated, comprehensive
└─────────────────────────────────────┘
```

---

## What to Test

### REQUIRED - Full Coverage

| Code Type | Location | Coverage Target |
|-----------|----------|-----------------|
| Server Actions | `lib/actions/*.ts` | 100% |
| Zod Schemas | `lib/schemas/*.ts` | 100% |
| Business Logic | `lib/utils/*.ts` | 80%+ |

### REQUIRED - Logic Coverage

| Code Type | Location | Coverage Target |
|-----------|----------|-----------------|
| Components with state | `components/**/*.tsx` | 70%+ |
| Components with conditionals | `components/**/*.tsx` | 70%+ |
| Custom hooks | `lib/hooks/*.ts` | 80%+ |

### SKIP - No Tests Needed

- Pure presentational components (just props → JSX)
- Direct shadcn/ui wrappers with no added logic
- Type definition files
- Configuration files

## Test File Organization

Tests are **co-located** with source files:

```
lib/actions/
├── draw.ts
├── draw.test.ts
├── raffles.ts
└── raffles.test.ts

components/raffle/
├── raffle-wheel.tsx
├── raffle-wheel.test.tsx
├── ticket-circle.tsx
└── ticket-circle.test.tsx
```

## Anti-Patterns

### NEVER Do This

```typescript
// WRONG: Implementation first, then "verify" with tests
export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}
// Then writing tests after - this is NOT TDD

// WRONG: Tests that don't actually test behavior
it('should work', () => {
  expect(true).toBe(true)
})

// WRONG: Skipping the failure verification step
// If you don't see your test fail first, you don't know if it tests anything
```

### ALWAYS Do This

```typescript
// CORRECT: Test first, see it fail, then implement
describe('calculateTotal', () => {
  it('should sum prices of all items', () => {
    const items = [{ price: 10 }, { price: 20 }]
    expect(calculateTotal(items)).toBe(30)
  })

  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0)
  })
})
// Run tests → see failures → write calculateTotal → tests pass
```

## Commands

```bash
# Unit tests
bun run test                    # Run all unit tests
bun run test path/to/file.test.ts  # Run specific file
bun run test --grep "drawWinner"   # Match pattern
bun run test:watch              # Watch mode
bun run test:coverage           # With coverage report

# Integration tests (requires test Supabase running)
bun run supabase:test           # Start test Supabase
bun run supabase:test:reset     # Reset with seed data
bun run test:integration        # Run integration tests

# E2E tests (requires test Supabase running)
bun run test:e2e                # Run all E2E tests (headless)
bun run test:e2e:ui             # Interactive UI mode
bun run test:e2e:headed         # With visible browser
bun run test:e2e:debug          # Debug mode
```
