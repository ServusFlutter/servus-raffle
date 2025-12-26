import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    // Integration tests run against real Supabase - no jsdom needed
    environment: 'node',
    globals: true,

    // Only include integration tests
    include: ['tests/integration/**/*.integration.test.ts'],

    // Global setup/teardown for Supabase
    globalSetup: ['./tests/integration/setup.ts'],
    globalTeardown: ['./tests/integration/teardown.ts'],

    // Run tests sequentially to avoid database conflicts
    sequence: {
      hooks: 'stack',
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Longer timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,

    // Environment variables for local Supabase
    env: {
      SUPABASE_URL: 'http://127.0.0.1:54321',
      // These will be read from supabase status output
      // SUPABASE_ANON_KEY: '...',
      // SUPABASE_SERVICE_ROLE_KEY: '...',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
