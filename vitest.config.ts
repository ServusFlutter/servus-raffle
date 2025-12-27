import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/integration/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules',
        '.next',
        'tests',
        'types',
        'components/ui/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
      ],
      thresholds: {
        // Enforce coverage thresholds
        'lib/actions/**': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'lib/schemas/**': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
