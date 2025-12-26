import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client with service role key
 *
 * IMPORTANT: This client bypasses Row Level Security (RLS).
 * Only use for server-side operations that require elevated privileges:
 * - Inserting/updating records on behalf of users
 * - Admin operations
 * - Background jobs
 *
 * NEVER expose this client to the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
