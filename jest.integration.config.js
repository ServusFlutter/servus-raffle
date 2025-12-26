/**
 * Jest configuration for INTEGRATION TESTS
 *
 * These tests run against a real Supabase instance (test config)
 * Run with: npm run test:integration
 *
 * Prerequisites:
 *   1. Docker running
 *   2. Test Supabase instance: npm run supabase:test:start
 *   3. .env.test file configured with test instance keys
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  // Use integration-specific setup that loads .env.test
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.js'],

  // Use node environment for server-side integration tests
  testEnvironment: 'node',

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Only run tests in __integration__ folders
  testMatch: [
    '**/__integration__/**/*.[jt]s?(x)',
    '**/*.integration.test.[jt]s?(x)',
  ],

  // Longer timeout for real database operations
  testTimeout: 30000,

  // Run tests serially to avoid database conflicts
  maxWorkers: 1,

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output for debugging
  verbose: true,
}

module.exports = createJestConfig(customJestConfig)
