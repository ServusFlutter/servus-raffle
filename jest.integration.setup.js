/**
 * Jest Integration Test Setup
 *
 * This setup file:
 * 1. Loads environment variables from .env.test
 * 2. Verifies connection to test Supabase instance
 * 3. Provides global test utilities
 */

const path = require('path')
const fs = require('fs')

// Load .env.test file
const envTestPath = path.resolve(process.cwd(), '.env.test')

if (fs.existsSync(envTestPath)) {
  const envContent = fs.readFileSync(envTestPath, 'utf-8')
  const lines = envContent.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue

    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=')
      process.env[key.trim()] = value.trim()
    }
  }

  console.log('✓ Loaded .env.test')
} else {
  console.error('✗ .env.test file not found!')
  console.error('  Create it from .env.test.example and configure test instance keys')
  process.exit(1)
}

// Verify required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const missing = requiredEnvVars.filter(key => !process.env[key])
if (missing.length > 0) {
  console.error('✗ Missing required environment variables in .env.test:')
  missing.forEach(key => console.error(`  - ${key}`))
  process.exit(1)
}

// Verify we're pointing to test instance (port 54421, not 54321)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl.includes('54421')) {
  console.warn('⚠ Warning: NEXT_PUBLIC_SUPABASE_URL does not use test port 54421')
  console.warn('  You may be pointing to the development instance!')
  console.warn(`  Current URL: ${supabaseUrl}`)
}

console.log('✓ Integration test environment configured')
console.log(`  Supabase URL: ${supabaseUrl}`)

// Global test utilities
global.TEST_ADMIN_EMAIL = 'test-admin@example.com'
global.TEST_USER_EMAIL = 'test-user@example.com'
global.TEST_PASSWORD = 'testpassword123'

// Known test UUIDs (matching seed.test.sql)
global.TEST_RAFFLE_ACTIVE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
global.TEST_RAFFLE_DRAFT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
global.TEST_RAFFLE_COMPLETED_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
