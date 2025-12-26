"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/utils/admin";
import type {
  RaffleHistoryItem,
  WinnerDetail,
  MultiWinnerStat,
} from "@/lib/schemas/history";

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
 * Get raffle history with aggregated statistics
 *
 * Returns all raffles sorted by created_at descending (newest first).
 * Includes participant count, prizes awarded, and total prizes for each raffle.
 *
 * @returns ActionResult with array of RaffleHistoryItem or error
 *
 * @example
 * ```typescript
 * const result = await getRaffleHistory()
 * if (result.data) {
 *   result.data.forEach(raffle => {
 *     console.log(`${raffle.name}: ${raffle.prizes_awarded}/${raffle.total_prizes} prizes`)
 *   })
 * }
 * ```
 */
export async function getRaffleHistory(): Promise<
  ActionResult<RaffleHistoryItem[]>
> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Get service role client
    const serviceClient = createServiceRoleClient();

    // 3. Query raffles with aggregated counts
    const { data: raffles, error: rafflesError } = await serviceClient
      .from("raffles")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false });

    if (rafflesError) {
      console.error("Database error fetching raffles:", rafflesError);
      return { data: null, error: "Failed to fetch raffle history" };
    }

    if (!raffles || raffles.length === 0) {
      return { data: [], error: null };
    }

    // 4. Get participant counts for all raffles
    const raffleIds = raffles.map((r) => r.id);

    const { data: participants, error: participantsError } = await serviceClient
      .from("participants")
      .select("raffle_id")
      .in("raffle_id", raffleIds);

    if (participantsError) {
      console.error("Database error fetching participants:", participantsError);
      return { data: null, error: "Failed to fetch raffle history" };
    }

    // 5. Get prize counts for all raffles
    const { data: prizes, error: prizesError } = await serviceClient
      .from("prizes")
      .select("raffle_id, awarded_to")
      .in("raffle_id", raffleIds);

    if (prizesError) {
      console.error("Database error fetching prizes:", prizesError);
      return { data: null, error: "Failed to fetch raffle history" };
    }

    // 6. Aggregate counts per raffle
    const participantCounts = new Map<string, number>();
    const prizeStats = new Map<string, { awarded: number; total: number }>();

    // Count participants per raffle
    for (const p of participants || []) {
      participantCounts.set(
        p.raffle_id,
        (participantCounts.get(p.raffle_id) || 0) + 1
      );
    }

    // Count prizes per raffle
    for (const prize of prizes || []) {
      const stats = prizeStats.get(prize.raffle_id) || { awarded: 0, total: 0 };
      stats.total += 1;
      if (prize.awarded_to) {
        stats.awarded += 1;
      }
      prizeStats.set(prize.raffle_id, stats);
    }

    // 7. Transform raffles to history items
    const historyItems: RaffleHistoryItem[] = raffles.map((raffle) => {
      const stats = prizeStats.get(raffle.id) || { awarded: 0, total: 0 };
      return {
        id: raffle.id,
        name: raffle.name,
        status: raffle.status,
        created_at: raffle.created_at,
        participant_count: participantCounts.get(raffle.id) || 0,
        prizes_awarded: stats.awarded,
        total_prizes: stats.total,
      };
    });

    return { data: historyItems, error: null };
  } catch (e) {
    console.error("Unexpected error fetching raffle history:", e);
    return { data: null, error: "Failed to fetch raffle history" };
  }
}

/**
 * Get winners for a specific raffle
 *
 * Returns all winners for a raffle with user and prize details.
 * Sorted by won_at ascending (draw order).
 *
 * @param raffleId - UUID of the raffle to get winners for
 * @returns ActionResult with array of WinnerDetail or error
 *
 * @example
 * ```typescript
 * const result = await getRaffleWinners("123e4567-...")
 * if (result.data) {
 *   result.data.forEach(winner => {
 *     console.log(`${winner.user_name} won ${winner.prize_name}`)
 *   })
 * }
 * ```
 */
export async function getRaffleWinners(
  raffleId: string
): Promise<ActionResult<WinnerDetail[]>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format
    if (!UUID_REGEX.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Get service role client
    const serviceClient = createServiceRoleClient();

    // 4. Query winners with joins to users and prizes
    const { data, error } = await serviceClient
      .from("winners")
      .select(
        `
        id,
        user_id,
        tickets_at_win,
        won_at,
        prize_id,
        user:users!user_id (
          name,
          avatar_url
        ),
        prize:prizes!prize_id (
          name
        )
      `
      )
      .eq("raffle_id", raffleId)
      .order("won_at", { ascending: true });

    if (error) {
      console.error("Database error fetching winners:", error);
      return { data: null, error: "Failed to fetch winners" };
    }

    // 5. Transform to flatten joins
    const winners: WinnerDetail[] = (data || []).map((winner) => {
      // User and prize data come as objects from the join
      const userData = winner.user as unknown as {
        name: string | null;
        avatar_url: string | null;
      } | null;
      const prizeData = winner.prize as unknown as {
        name: string;
      } | null;

      return {
        id: winner.id,
        user_id: winner.user_id,
        user_name: userData?.name || null,
        user_avatar_url: userData?.avatar_url || null,
        prize_name: prizeData?.name || "Unknown Prize",
        prize_id: winner.prize_id || "",
        tickets_at_win: winner.tickets_at_win,
        won_at: winner.won_at,
      };
    });

    return { data: winners, error: null };
  } catch (e) {
    console.error("Unexpected error fetching winners:", e);
    return { data: null, error: "Failed to fetch winners" };
  }
}

/**
 * Get multi-winner statistics for fairness tracking
 *
 * Returns users who have won multiple times across all raffles.
 * Useful for admins to verify the fairness system is working.
 *
 * @returns ActionResult with array of MultiWinnerStat or error
 *
 * @example
 * ```typescript
 * const result = await getMultiWinnerStats()
 * if (result.data) {
 *   result.data.forEach(stat => {
 *     console.log(`${stat.user_name} has won ${stat.win_count} times`)
 *   })
 * }
 * ```
 */
export async function getMultiWinnerStats(): Promise<
  ActionResult<MultiWinnerStat[]>
> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Get service role client
    const serviceClient = createServiceRoleClient();

    // 3. Get all winners with user details
    const { data: winners, error: winnersError } = await serviceClient
      .from("winners")
      .select(
        `
        user_id,
        won_at,
        user:users!user_id (
          name,
          avatar_url
        )
      `
      )
      .order("won_at", { ascending: false });

    if (winnersError) {
      console.error("Database error fetching multi-winner stats:", winnersError);
      return { data: null, error: "Failed to fetch multi-winner stats" };
    }

    if (!winners || winners.length === 0) {
      return { data: [], error: null };
    }

    // 4. Group by user_id and count wins
    const userWins = new Map<
      string,
      {
        user_name: string | null;
        user_avatar_url: string | null;
        win_count: number;
        last_win_at: string;
      }
    >();

    for (const winner of winners) {
      const userData = winner.user as unknown as {
        name: string | null;
        avatar_url: string | null;
      } | null;

      const existing = userWins.get(winner.user_id);
      if (existing) {
        existing.win_count += 1;
        // Keep the most recent win (winners are sorted desc by won_at)
        if (!existing.last_win_at || winner.won_at > existing.last_win_at) {
          existing.last_win_at = winner.won_at;
        }
      } else {
        userWins.set(winner.user_id, {
          user_name: userData?.name || null,
          user_avatar_url: userData?.avatar_url || null,
          win_count: 1,
          last_win_at: winner.won_at,
        });
      }
    }

    // 5. Filter to only users with 2+ wins and format result
    const multiWinners: MultiWinnerStat[] = [];
    for (const [userId, stats] of userWins.entries()) {
      if (stats.win_count >= 2) {
        multiWinners.push({
          user_id: userId,
          user_name: stats.user_name,
          user_avatar_url: stats.user_avatar_url,
          win_count: stats.win_count,
          last_win_at: stats.last_win_at,
        });
      }
    }

    // 6. Sort by win_count descending
    multiWinners.sort((a, b) => b.win_count - a.win_count);

    return { data: multiWinners, error: null };
  } catch (e) {
    console.error("Unexpected error fetching multi-winner stats:", e);
    return { data: null, error: "Failed to fetch multi-winner stats" };
  }
}
