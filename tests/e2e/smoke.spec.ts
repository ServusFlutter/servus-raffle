import { test, expect } from './fixtures/base'

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
    try {
      console.log('Supawright fixture received:', typeof supawright)
      console.log('Supawright methods:', Object.keys(supawright))

      // Create a test raffle
      const raffle = await supawright.create('raffles', {
        name: 'E2E Smoke Test Raffle',
        status: 'draft',
      })

      console.log('Created raffle:', raffle)

      // Verify it was created
      expect(raffle.id).toBeDefined()
      expect(raffle.name).toBe('E2E Smoke Test Raffle')
    } catch (error) {
      console.error('Error in test:', error)
      if (error instanceof AggregateError) {
        console.error('AggregateError errors:', error.errors)
        for (const e of error.errors) {
          console.error('  - Error:', e)
        }
      }
      throw error
    }

    // Supawright will automatically clean up after the test
  })
})
