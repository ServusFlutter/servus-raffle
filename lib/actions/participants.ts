"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/utils/admin";

/**
 * ActionResult type for consistent Server Action responses
 */
type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * UUID regex for validation
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Participant with user details for admin display
 */
export type ParticipantWithDetails = {
  id: string;
  user_id: string;
  ticket_count: number;
  joined_at: string;
  user_name: string | null;
  user_avatar_url: string | null;
};

/**
 * Raffle statistics for admin dashboard
 */
export type RaffleStatistics = {
  participantCount: number;
  totalTickets: number;
};

/**
 * Creates a Supabase client with service role for admin operations
 * This bypasses RLS and should only be used after admin validation
 */
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get the current authenticated user and verify admin status
 * @returns The user if admin, null otherwise
 */
async function getAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email || !isAdmin(user.email)) {
    return null;
  }

  return user;
}

/**
 * Get all participants for a raffle with user details
 *
 * Joins participants with users table to get name and avatar_url.
 * Returns participants sorted by joined_at descending (newest first).
 *
 * @param raffleId - UUID of the raffle to get participants for
 * @returns ActionResult with array of ParticipantWithDetails or error
 *
 * @example
 * ```typescript
 * const result = await getParticipantsWithDetails("123e4567-...")
 * if (result.data) {
 *   result.data.forEach(p => {
 *     console.log(`${p.user_name} has ${p.ticket_count} tickets`)
 *   })
 * }
 * ```
 */
export async function getParticipantsWithDetails(
  raffleId: string
): Promise<ActionResult<ParticipantWithDetails[]>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format for raffleId
    if (!UUID_REGEX.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Get service role client
    const serviceClient = createServiceRoleClient();

    // 4. Query participants with user join
    const { data, error } = await serviceClient
      .from("participants")
      .select(
        `
        id,
        user_id,
        ticket_count,
        joined_at,
        user:users!user_id (
          name,
          avatar_url
        )
      `
      )
      .eq("raffle_id", raffleId)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Database error fetching participants:", error);
      return { data: null, error: "Failed to fetch participants" };
    }

    // 5. Transform to flatten user fields
    const participantsWithDetails: ParticipantWithDetails[] = (data || []).map(
      (participant) => {
        // User data comes as a single object from the join (not an array)
        const userData = participant.user as unknown as { name: string | null; avatar_url: string | null } | null;
        return {
          id: participant.id,
          user_id: participant.user_id,
          ticket_count: participant.ticket_count,
          joined_at: participant.joined_at,
          user_name: userData?.name || null,
          user_avatar_url: userData?.avatar_url || null,
        };
      }
    );

    return { data: participantsWithDetails, error: null };
  } catch (e) {
    console.error("Unexpected error fetching participants:", e);
    return { data: null, error: "Failed to fetch participants" };
  }
}

/**
 * Get raffle statistics (participant count and total tickets)
 *
 * @param raffleId - UUID of the raffle to get statistics for
 * @returns ActionResult with RaffleStatistics or error
 *
 * @example
 * ```typescript
 * const result = await getRaffleStatistics("123e4567-...")
 * if (result.data) {
 *   console.log(`${result.data.participantCount} participants`)
 *   console.log(`${result.data.totalTickets} total tickets`)
 * }
 * ```
 */
export async function getRaffleStatistics(
  raffleId: string
): Promise<ActionResult<RaffleStatistics>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format for raffleId
    if (!UUID_REGEX.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Get service role client
    const serviceClient = createServiceRoleClient();

    // 4. Query participants for this raffle
    const { data, error } = await serviceClient
      .from("participants")
      .select("ticket_count")
      .eq("raffle_id", raffleId);

    if (error) {
      console.error("Database error fetching statistics:", error);
      return { data: null, error: "Failed to fetch statistics" };
    }

    // 5. Calculate statistics
    const participantCount = data?.length || 0;
    const totalTickets = data?.reduce((sum, p) => sum + (p.ticket_count || 0), 0) || 0;

    return {
      data: {
        participantCount,
        totalTickets,
      },
      error: null,
    };
  } catch (e) {
    console.error("Unexpected error fetching statistics:", e);
    return { data: null, error: "Failed to fetch statistics" };
  }
}
