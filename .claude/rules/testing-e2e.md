---
paths:
  - "tests/e2e/**/*"
  - "playwright.config.ts"
---

# E2E Testing with Playwright

## Overview

E2E tests run in a real browser against the full application stack (Next.js + Supabase). They verify complete user flows from the UI to the database.

## When to Write E2E Tests

Write E2E tests when you need to verify:

| Scenario | Example |
|----------|---------|
| User clicks through a flow | Join raffle → see ticket count |
| Cross-page navigation | Admin creates raffle → participant sees it |
| Realtime synchronization | Wheel spins on all connected devices |
| Auth-protected flows | Login → access dashboard |
| Visual interactions | Wheel animation completes, confetti shows |

## When NOT to Write E2E Tests

Use unit or integration tests instead for:

- Zod schema validation → Unit test
- Server Action logic → Unit test (mocked DB)
- RLS policy enforcement → Integration test
- Database constraints → Integration test
- Component rendering → Unit test with Testing Library

## Directory Structure

```
tests/e2e/
├── fixtures/
│   └── base.ts           # Supawright + Playwright fixtures
├── smoke.spec.ts         # Verify setup works
├── join-raffle.spec.ts   # Join raffle flow
├── draw-winner.spec.ts   # Draw winner flow
└── participant-view.spec.ts
```

## Using Supawright Fixtures

```typescript
import { test, expect } from './fixtures/base'

test('participant can join raffle', async ({ page, supawright }) => {
  // Arrange: Create test data (auto-cleaned up after test)
  const raffle = await supawright.create('raffles', {
    name: 'Test Raffle',
    status: 'active',
  })

  // Act: Navigate and interact
  await page.goto(`/join/${raffle.qr_code}`)
  await page.getByRole('button', { name: 'Join Raffle' }).click()

  // Assert: Verify UI state
  await expect(page.getByTestId('ticket-circle')).toContainText('1')
})
```

## Selector Best Practices

```typescript
// CORRECT: Use data-testid for reliable selectors
await page.getByTestId('ticket-circle')
await page.getByTestId('draw-button')

// CORRECT: Use accessible roles and text
await page.getByRole('button', { name: 'Draw Winner' })
await page.getByText('You won!')

// WRONG: Fragile CSS selectors
await page.locator('.btn-primary')
await page.locator('div > span.text-lg')

// WRONG: Implementation-dependent selectors
await page.locator('[class*="motion"]')
```

## Waiting for Async Operations

```typescript
// Playwright auto-waits, but be explicit for clarity
await page.goto('/raffle/123')

// Wait for specific element
await expect(page.getByTestId('participant-count')).toBeVisible()

// Wait for network idle (after realtime subscription)
await page.waitForLoadState('networkidle')

// Wait for animation (use sparingly)
await page.waitForTimeout(500)
```

## Testing Realtime

```typescript
test('wheel syncs across clients', async ({ page, context, supawright }) => {
  const raffle = await supawright.create('raffles', { status: 'active' })

  // Open two pages (simulating two participants)
  const page2 = await context.newPage()

  await page.goto(`/raffle/${raffle.id}`)
  await page2.goto(`/raffle/${raffle.id}`)

  // Trigger draw on admin page
  // ... trigger draw ...

  // Both pages should show spinning wheel
  await expect(page.getByTestId('wheel')).toHaveAttribute('data-spinning', 'true')
  await expect(page2.getByTestId('wheel')).toHaveAttribute('data-spinning', 'true')
})
```

## Commands

```bash
# Run all E2E tests (headless)
bun run test:e2e

# Run with UI (interactive debugging)
bun run test:e2e:ui

# Run with visible browser
bun run test:e2e:headed

# Run specific test file
bun run test:e2e tests/e2e/join-raffle.spec.ts

# Debug mode (step through tests)
bun run test:e2e:debug
```

## Prerequisites

Before running E2E tests:

```bash
# Start test Supabase (port 54421)
bun run supabase:test

# Reset test database with seed data
bun run supabase:test:reset
```

## Anti-Patterns

```typescript
// WRONG: Testing implementation details
await expect(page.locator('[data-state="loading"]')).toBeVisible()

// CORRECT: Test user-visible behavior
await expect(page.getByRole('progressbar')).toBeVisible()

// WRONG: Hardcoded waits
await page.waitForTimeout(3000)

// CORRECT: Wait for specific conditions
await expect(page.getByTestId('winner-card')).toBeVisible()

// WRONG: Testing things better suited for unit tests
test('validates email format', async ({ page }) => {
  // This should be a unit test for the Zod schema
})

// CORRECT: Test the full flow
test('shows error for invalid email', async ({ page }) => {
  await page.goto('/register')
  await page.fill('[name="email"]', 'invalid')
  await page.click('button[type="submit"]')
  await expect(page.getByText('Invalid email')).toBeVisible()
})
```

## Coverage Requirements

E2E tests focus on critical happy paths:

| Priority | Flow |
|----------|------|
| High | Join raffle via QR code |
| High | Draw winner (wheel spin + reveal) |
| High | Participant sees ticket count |
| Medium | Admin creates raffle |
| Medium | Realtime sync between devices |
