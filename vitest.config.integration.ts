import path from 'node:path'
import { defineConfig } from 'vitest/config'

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

    // Environment variables for Test Supabase (port 54421)
    env: {
      SUPABASE_URL: 'http://127.0.0.1:54421',
      // Keys will be extracted from `bunx supabase --workdir supabase-test status`
      // by the globalSetup script
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
