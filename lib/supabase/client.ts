import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env'
import type { Database } from '@/types/database'
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
