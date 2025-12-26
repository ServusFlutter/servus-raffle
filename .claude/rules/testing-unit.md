---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "lib/**/*.ts"
  - "components/**/*.tsx"
---

# Unit Testing with Vitest

## Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('functionName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle the happy path', () => {
    // Arrange
    const input = { raffleId: '123', userId: 'user-1' }

    // Act
    const result = functionName(input)

    // Assert
    expect(result).toEqual({ data: expected, error: null })
  })

  it('should handle error case', () => {
    // Arrange
    const invalidInput = { raffleId: '' }

    // Act
    const result = functionName(invalidInput)

    // Assert
    expect(result).toEqual({ data: null, error: 'Invalid raffle ID' })
  })
})
```

## Component Testing

Use `@testing-library/react` for component tests:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TicketCircle } from './ticket-circle'

describe('TicketCircle', () => {
  it('displays the ticket count', () => {
    render(<TicketCircle count={5} />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<TicketCircle count={3} className="custom-class" />)

    expect(screen.getByTestId('ticket-circle')).toHaveClass('custom-class')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    render(<TicketCircle count={5} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

## Async Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { drawWinner } from './draw'

describe('drawWinner', () => {
  it('should return winner after async operation', async () => {
    const result = await drawWinner('raffle-123')

    expect(result.data).toBeDefined()
    expect(result.error).toBeNull()
  })
})
```

## Mocking Patterns

### Mock Supabase Client

```typescript
import { vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: '123', name: 'Test Raffle' },
      error: null,
    }),
  })),
}))
```

### Mock Server Actions

```typescript
import { vi } from 'vitest'
import * as actions from '@/lib/actions/raffles'

vi.spyOn(actions, 'createRaffle').mockResolvedValue({
  data: { id: 'new-raffle', name: 'Test' },
  error: null,
})
```

### Mock External Modules

```typescript
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))
```

## Testing Zod Schemas

```typescript
import { describe, it, expect } from 'vitest'
import { CreateRaffleSchema } from './raffle'

describe('CreateRaffleSchema', () => {
  it('should validate valid input', () => {
    const input = { name: 'Flutter Munich Raffle' }
    const result = CreateRaffleSchema.safeParse(input)

    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const input = { name: '' }
    const result = CreateRaffleSchema.safeParse(input)

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Name is required')
  })

  it('should reject name exceeding max length', () => {
    const input = { name: 'a'.repeat(256) }
    const result = CreateRaffleSchema.safeParse(input)

    expect(result.success).toBe(false)
  })
})
```

## Testing Server Actions

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRaffle } from './raffles'
import { createServerClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')

describe('createRaffle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create raffle and return data', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: '123', name: 'New Raffle' },
        error: null,
      }),
    }
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any)

    const result = await createRaffle('New Raffle')

    expect(result.data).toEqual({ id: '123', name: 'New Raffle' })
    expect(result.error).toBeNull()
  })

  it('should return error on database failure', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }
    vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any)

    const result = await createRaffle('New Raffle')

    expect(result.data).toBeNull()
    expect(result.error).toBe('Database error')
  })
})
```

## Running Tests

```bash
# Run all unit tests
bun run test

# Run specific file
bun run test lib/actions/draw.test.ts

# Run tests matching pattern
bun run test --grep "createRaffle"

# Watch mode
bun run test:watch

# With coverage
bun run test:coverage

# Update snapshots
bun run test --update
```

## Coverage Requirements

| Code Type | Target |
|-----------|--------|
| Server Actions | 100% |
| Zod Schemas | 100% |
| Business logic utilities | 80%+ |
| Components with logic | 70%+ |

## Anti-Patterns

```typescript
// WRONG: Testing implementation details
expect(component.state.isLoading).toBe(true)

// CORRECT: Test behavior/output
expect(screen.getByRole('progressbar')).toBeInTheDocument()

// WRONG: Overly specific assertions
expect(result).toEqual({
  id: '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2025-12-25T19:00:00.000Z',
  // ...every field
})

// CORRECT: Assert on what matters
expect(result).toMatchObject({
  id: expect.any(String),
  name: 'Test Raffle',
})
```
