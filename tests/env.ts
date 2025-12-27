/**
 * Validated environment variables for tests.
 * Import from here instead of using process.env directly.
 *
 * Throws if required variables are missing.
 */

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required test environment variable: ${name}. Check your .env.test.local file.`
    )
  }
  return value
}

// Supabase API
export const SUPABASE_URL = requireEnv('SUPABASE_URL')
export const SUPABASE_ANON_KEY = requireEnv('SUPABASE_ANON_KEY')
export const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

// Database connection
export const SUPABASE_DB_HOST = requireEnv('SUPABASE_DB_HOST')
export const SUPABASE_DB_PORT = Number.parseInt(requireEnv('SUPABASE_DB_PORT'), 10)
export const SUPABASE_DB_USER = requireEnv('SUPABASE_DB_USER')
export const SUPABASE_DB_PASSWORD = requireEnv('SUPABASE_DB_PASSWORD')
export const SUPABASE_DB_NAME = requireEnv('SUPABASE_DB_NAME')
