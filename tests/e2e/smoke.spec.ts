import { expect, test } from './fixtures/base'

/**
 * Smoke Tests
 *
 * Basic tests to verify E2E infrastructure is working.
 * Run these first to catch configuration issues.
 */

test.describe('Smoke Tests', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/')

    // Verify the page loads without errors
    await expect(page).toHaveTitle(/Servus Raffle/)
  })

  test('supawright can create and cleanup test data', async ({ supawright }) => {
    // Create a test raffle
    const raffle = await supawright.create('raffles', {
      name: 'E2E Smoke Test Raffle',
      status: 'draft',
    })

    // Verify it was created
    expect(raffle.id).toBeDefined()
    expect(raffle.name).toBe('E2E Smoke Test Raffle')

    // Supawright will automatically clean up after the test
  })
})
