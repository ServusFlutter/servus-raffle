/**
 * Draw utility functions
 *
 * Pure utility functions for weighted random selection and ticket calculation.
 * These are separated from the Server Action file to avoid "use server" directive issues.
 *
 * Story 6.3: Draw Winner Server Action
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Eligible participant with accumulated tickets for weighted selection
 */
export type EligibleParticipant = {
  userId: string;
  name: string;
  tickets: number;
};

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
 * Calculate accumulated tickets for a user
 *
 * Sums tickets from all raffles the user participated in,
 * but only counts tickets earned AFTER their last win (if any).
 * This implements the "tickets reset after winning" behavior.
 *
 * **Story 6.6: Implicit Ticket Reset Mechanism**
 * The ticket reset is NOT done by physically deleting or modifying participant records.
 * Instead, it works implicitly through timestamp comparison:
 * 1. drawWinner() creates a `winners` table record with `won_at` timestamp
 * 2. This function queries: tickets WHERE joined_at > last_win_timestamp
 * 3. Since the winner record has a `won_at` time, all participations BEFORE that time
 *    are automatically excluded from the accumulated count
 *
 * This approach ensures:
 * - AC #1 (FR9): Atomic ticket reset as part of draw transaction
 * - AC #2: All previous tickets are cleared (excluded from count)
 * - No data loss - historical participation records are preserved
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
