/**
 * Validated environment variables for the application.
 * Import from here instead of using process.env directly.
 *
 * Throws at startup if required variables are missing.
 */

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Public (available in browser)
export const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
export const SUPABASE_ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Server-only (throws if accessed in browser)
export function getServiceRoleKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('Service role key cannot be accessed in browser')
  }
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY')
}
