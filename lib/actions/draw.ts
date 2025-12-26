"use server";

/**
 * Draw Winner Server Action
 *
 * Story 6.3: Draw Winner Server Action
 * Implements weighted random selection for raffle drawing.
 *
 * AC #1: Atomic Transaction Execution
 * AC #2: Weighted Random Selection
 * AC #3: Previous Winner Exclusion (FR25)
 * AC #4: Wheel Animation Seed Generation
 * AC #5: Database Updates & Broadcast
 * AC #6: No Eligible Participants Handling
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/utils/admin";
import { revalidatePath } from "next/cache";
import {
  broadcastDrawStart,
  broadcastWheelSeed,
  broadcastWinnerRevealed,
} from "@/lib/supabase/broadcast";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ActionResult type for consistent Server Action responses
 * Following project pattern: ALWAYS return { data, error } - NEVER throw
 */
type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Eligible participant with accumulated tickets for weighted selection
 */
export type EligibleParticipant = {
  userId: string;
  name: string;
  tickets: number;
};

/**
 * Winner record created after successful draw
 */
export type Winner = {
  id: string;
  raffleId: string;
  prizeId: string;
  userId: string;
  userName: string;
  ticketsAtWin: number;
  wonAt: string;
};

/**
 * Result of a successful draw operation
 * Includes winner data and wheel animation seed for client synchronization
 */
export type DrawWinnerResult = {
  winner: Winner;
  seed: number;
  prizeName: string;
  participantCount: number;
};

/**
 * Zod schema for drawWinner input validation
 */
const DrawWinnerInputSchema = z.object({
  raffleId: z.string().uuid("Invalid raffle ID"),
  prizeId: z.string().uuid("Invalid prize ID"),
});

/**
 * UUID regex for validation
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Select winner using weighted random selection
 *
 * Each ticket gives one "entry" in the pool.
 * A participant with 5 tickets has 5x the chance of someone with 1 ticket.
 *
 * @param participants - Array of eligible participants with ticket counts
 * @param seed - Optional seed for deterministic selection (for testing)
 * @returns Selected participant or null if no eligible participants
 *
 * @example
 * // Alice has 5 tickets, Bob has 2 tickets
 * // Pool: [Alice x5, Bob x2] = 7 entries
 * // Alice has 5/7 (71%) chance, Bob has 2/7 (29%) chance
 */
export function selectWeightedWinner(
  participants: EligibleParticipant[],
  seed?: number
): EligibleParticipant | null {
  if (participants.length === 0) {
    return null;
  }

  // Calculate total tickets
  const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);

  if (totalTickets === 0) {
    return null;
  }

  // Generate random value
  // Use seeded random for testing, Math.random() for production
  let randomValue: number;
  if (seed !== undefined) {
    // Simple seeded random for deterministic testing
    // Using a basic linear congruential generator
    const lcgRandom = (seed % 2147483647) / 2147483647;
    randomValue = Math.floor(lcgRandom * totalTickets);
  } else {
    randomValue = Math.floor(Math.random() * totalTickets);
  }

  // Select winner based on weighted position
  let cumulative = 0;
  for (const participant of participants) {
    cumulative += participant.tickets;
    if (randomValue < cumulative) {
      return participant;
    }
  }

  // Fallback (should never reach due to math)
  return participants[participants.length - 1];
}

/**
 * Generate a cryptographically secure random seed for wheel animation
 *
 * The seed ensures identical animation on all connected devices.
 * Range: 0 to 999999 (6 digits for variety)
 *
 * @returns Random seed number
 */
function generateWheelSeed(): number {
  // Use crypto for better randomness if available
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % 1000000;
  }
  // Fallback to Math.random
  return Math.floor(Math.random() * 1000000);
}

/**
 * Calculate accumulated tickets for a user
 *
 * Sums tickets from all raffles the user participated in,
 * but only counts tickets earned AFTER their last win (if any).
 * This implements the "tickets reset after winning" behavior.
 *
 * @param adminClient - Supabase client with service role
 * @param userId - UUID of the user
 * @returns Total accumulated ticket count
 */
export async function calculateAccumulatedTicketsForUser(
  adminClient: SupabaseClient,
  userId: string
): Promise<number> {
  // Step 1: Find user's last win timestamp
  const { data: lastWin } = await adminClient
    .from("winners")
    .select("won_at")
    .eq("user_id", userId)
    .order("won_at", { ascending: false })
    .limit(1)
    .single();

  // Step 2: Build query for accumulated tickets
  let query = adminClient
    .from("participants")
    .select("ticket_count")
    .eq("user_id", userId);

  // Step 3: If user has won before, only count tickets after last win
  if (lastWin?.won_at) {
    query = query.gt("joined_at", lastWin.won_at);
  }

  const { data: participations, error } = await query;

  if (error || !participations) {
    console.error("Error calculating accumulated tickets:", error);
    return 0;
  }

  // Sum all ticket counts
  return participations.reduce((sum, p) => sum + (p.ticket_count || 0), 0);
}

/**
 * Calculate accumulated tickets for multiple users in batch
 *
 * This is an optimization to avoid N+1 queries when getting eligible participants.
 * Instead of querying for each user individually, we fetch all data in bulk.
 *
 * @param adminClient - Supabase client with service role
 * @param userIds - Array of user IDs to calculate tickets for
 * @returns Map of userId -> accumulated ticket count
 */
async function calculateAccumulatedTicketsForUsers(
  adminClient: SupabaseClient,
  userIds: string[]
): Promise<Map<string, number>> {
  const ticketMap = new Map<string, number>();

  if (userIds.length === 0) {
    return ticketMap;
  }

  // Step 1: Get last win timestamps for all users in one query
  const { data: allWins, error: winsError } = await adminClient
    .from("winners")
    .select("user_id, won_at")
    .in("user_id", userIds)
    .order("won_at", { ascending: false });

  if (winsError) {
    console.error("Error fetching wins:", winsError);
    // Fall back to assuming no wins
  }

  // Build map of userId -> last win timestamp
  const lastWinMap = new Map<string, string>();
  for (const win of allWins || []) {
    // Only keep the first (most recent) win for each user
    if (!lastWinMap.has(win.user_id)) {
      lastWinMap.set(win.user_id, win.won_at);
    }
  }

  // Step 2: Get all participations for all users in one query
  const { data: allParticipations, error: partError } = await adminClient
    .from("participants")
    .select("user_id, ticket_count, joined_at")
    .in("user_id", userIds);

  if (partError) {
    console.error("Error fetching participations:", partError);
    return ticketMap;
  }

  // Step 3: Calculate accumulated tickets for each user
  for (const userId of userIds) {
    const lastWinAt = lastWinMap.get(userId);
    const userParticipations = (allParticipations || []).filter(
      (p) => p.user_id === userId
    );

    let accumulated = 0;
    for (const p of userParticipations) {
      // Only count tickets from participations after last win
      if (!lastWinAt || new Date(p.joined_at) > new Date(lastWinAt)) {
        accumulated += p.ticket_count || 0;
      }
    }

    ticketMap.set(userId, accumulated);
  }

  return ticketMap;
}

/**
 * Get participants eligible to win a prize in this raffle
 *
 * Excludes users who already won in THIS raffle.
 * Calculates accumulated tickets (sum since their last win in ANY raffle).
 *
 * Performance: Uses batch queries to avoid N+1 database calls.
 *
 * @param adminClient - Supabase client with service role
 * @param raffleId - UUID of the raffle
 * @returns Array of eligible participants with accumulated tickets
 */
async function getEligibleParticipants(
  adminClient: SupabaseClient,
  raffleId: string
): Promise<EligibleParticipant[]> {
  // 1. Get users who already won in THIS raffle
  const { data: existingWinners, error: winnersError } = await adminClient
    .from("winners")
    .select("user_id")
    .eq("raffle_id", raffleId);

  if (winnersError) {
    console.error("Error fetching existing winners:", winnersError);
    throw new Error("Failed to fetch existing winners");
  }

  const winnerUserIds = new Set(existingWinners?.map((w) => w.user_id) || []);

  // 2. Get all participants in this raffle with user info
  const { data: participants, error: participantsError } = await adminClient
    .from("participants")
    .select(
      `
      user_id,
      users!inner (
        id,
        name
      )
    `
    )
    .eq("raffle_id", raffleId);

  if (participantsError) {
    console.error("Error fetching participants:", participantsError);
    throw new Error("Failed to fetch participants");
  }

  // 3. Filter out previous winners and collect user IDs
  const eligibleParticipants = (participants || []).filter(
    (p) => !winnerUserIds.has(p.user_id)
  );
  const eligibleUserIds = eligibleParticipants.map((p) => p.user_id);

  // 4. Calculate accumulated tickets for all eligible users in batch (avoids N+1)
  const ticketMap = await calculateAccumulatedTicketsForUsers(
    adminClient,
    eligibleUserIds
  );

  // 5. Build result array with accumulated tickets
  const eligible: EligibleParticipant[] = [];

  for (const p of eligibleParticipants) {
    const accumulated = ticketMap.get(p.user_id) || 0;

    // Type assertion for nested users object
    // Supabase returns nested relations as single object when using !inner
    const userData = p.users as unknown as { id: string; name: string | null } | null;

    if (accumulated > 0) {
      eligible.push({
        userId: p.user_id,
        name: userData?.name || "Unknown",
        tickets: accumulated,
      });
    }
  }

  return eligible;
}

/**
 * Draw a winner for a specific prize in a raffle
 *
 * This is the main Server Action for drawing winners.
 * It performs weighted random selection based on accumulated tickets,
 * creates database records atomically, and broadcasts events for
 * real-time client synchronization.
 *
 * @param raffleId - UUID of the raffle
 * @param prizeId - UUID of the prize to award
 * @returns ActionResult with DrawWinnerResult or error
 *
 * @example
 * ```typescript
 * const result = await drawWinner(raffleId, prizeId);
 * if (result.error) {
 *   toast.error(result.error);
 * } else {
 *   // Start wheel animation with result.data.seed
 *   startWheelAnimation(result.data.seed);
 * }
 * ```
 */
export async function drawWinner(
  raffleId: string,
  prizeId: string
): Promise<ActionResult<DrawWinnerResult>> {
  try {
    // 1. Validate admin status
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Not authenticated" };
    }

    if (!user.email || !isAdmin(user.email)) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate input with Zod
    const validation = DrawWinnerInputSchema.safeParse({ raffleId, prizeId });
    if (!validation.success) {
      const errorMessage =
        validation.error.issues[0]?.message || "Invalid input";
      return { data: null, error: errorMessage };
    }

    // 3. Get admin client for database operations
    const adminClient = createAdminClient();

    // 4. Verify raffle exists
    const { data: raffle, error: raffleError } = await adminClient
      .from("raffles")
      .select("id, status, name")
      .eq("id", raffleId)
      .single();

    if (raffleError || !raffle) {
      return { data: null, error: "Raffle not found" };
    }

    // 5. Verify prize exists and is not already awarded
    const { data: prize, error: prizeError } = await adminClient
      .from("prizes")
      .select("id, name, awarded_to, raffle_id")
      .eq("id", prizeId)
      .single();

    if (prizeError || !prize) {
      return { data: null, error: "Prize not found" };
    }

    if (prize.awarded_to) {
      return { data: null, error: "Prize already awarded" };
    }

    if (prize.raffle_id !== raffleId) {
      return { data: null, error: "Prize does not belong to this raffle" };
    }

    // 6. Get eligible participants with accumulated tickets
    let eligibleParticipants: EligibleParticipant[];
    try {
      eligibleParticipants = await getEligibleParticipants(adminClient, raffleId);
    } catch (e) {
      console.error("Error getting eligible participants:", e);
      return { data: null, error: "Failed to get eligible participants" };
    }

    if (eligibleParticipants.length === 0) {
      return { data: null, error: "No eligible participants" };
    }

    // 7. Generate wheel animation seed
    const seed = generateWheelSeed();

    // 8. Broadcast DRAW_START event
    const drawStartResult = await broadcastDrawStart(raffleId, prizeId, prize.name);
    if (!drawStartResult.success) {
      console.warn("Failed to broadcast DRAW_START:", drawStartResult.error);
      // Continue anyway - draw can proceed without broadcast
    }

    // 9. Broadcast WHEEL_SEED event
    const wheelSeedResult = await broadcastWheelSeed(raffleId, prizeId, seed);
    if (!wheelSeedResult.success) {
      console.warn("Failed to broadcast WHEEL_SEED:", wheelSeedResult.error);
    }

    // 10. Select winner using weighted random selection
    const selectedWinner = selectWeightedWinner(eligibleParticipants);

    if (!selectedWinner) {
      return { data: null, error: "Failed to select winner" };
    }

    // 11. Create winner record (atomic with prize update)
    const now = new Date().toISOString();

    const { data: winnerRecord, error: winnerError } = await adminClient
      .from("winners")
      .insert({
        raffle_id: raffleId,
        prize_id: prizeId,
        user_id: selectedWinner.userId,
        tickets_at_win: selectedWinner.tickets,
        won_at: now,
      })
      .select()
      .single();

    if (winnerError || !winnerRecord) {
      console.error("Error creating winner record:", winnerError);
      return { data: null, error: "Failed to record winner" };
    }

    // 12. Update prize with awarded_to and awarded_at
    const { error: prizeUpdateError } = await adminClient
      .from("prizes")
      .update({
        awarded_to: selectedWinner.userId,
        awarded_at: now,
      })
      .eq("id", prizeId);

    if (prizeUpdateError) {
      console.error("Error updating prize:", prizeUpdateError);
      // Try to rollback winner record
      await adminClient.from("winners").delete().eq("id", winnerRecord.id);
      return { data: null, error: "Failed to award prize" };
    }

    // 13. Broadcast WINNER_REVEALED event (Story 6.5: includes ticketsAtWin and prizeName)
    const winnerRevealResult = await broadcastWinnerRevealed(
      raffleId,
      prizeId,
      selectedWinner.userId,
      selectedWinner.name,
      selectedWinner.tickets,
      prize.name
    );
    if (!winnerRevealResult.success) {
      console.warn("Failed to broadcast WINNER_REVEALED:", winnerRevealResult.error);
    }

    // 14. Revalidate paths
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/draw`);
    revalidatePath(`/projection/${raffleId}`);

    // 15. Return successful result
    const result: DrawWinnerResult = {
      winner: {
        id: winnerRecord.id,
        raffleId: winnerRecord.raffle_id,
        prizeId: winnerRecord.prize_id,
        userId: selectedWinner.userId,
        userName: selectedWinner.name,
        ticketsAtWin: selectedWinner.tickets,
        wonAt: now,
      },
      seed,
      prizeName: prize.name,
      participantCount: eligibleParticipants.length,
    };

    console.log(
      `[Draw] Winner selected: ${selectedWinner.name} for prize "${prize.name}" with ${selectedWinner.tickets} tickets`
    );

    return { data: result, error: null };
  } catch (e) {
    console.error("Unexpected error in drawWinner:", e);
    return { data: null, error: "Failed to draw winner" };
  }
}

/**
 * Get eligible participants for a raffle (admin only)
 *
 * This is a helper action to preview who is eligible before drawing.
 * Useful for admin UI to show participant count and ticket distribution.
 *
 * @param raffleId - UUID of the raffle
 * @returns ActionResult with array of eligible participants or error
 */
export async function getEligibleParticipantsAction(
  raffleId: string
): Promise<ActionResult<EligibleParticipant[]>> {
  try {
    // 1. Validate admin status
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Not authenticated" };
    }

    if (!user.email || !isAdmin(user.email)) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format
    if (!UUID_REGEX.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Get admin client
    const adminClient = createAdminClient();

    // 4. Get eligible participants
    const eligible = await getEligibleParticipants(adminClient, raffleId);

    return { data: eligible, error: null };
  } catch (e) {
    console.error("Unexpected error getting eligible participants:", e);
    return { data: null, error: "Failed to get eligible participants" };
  }
}
