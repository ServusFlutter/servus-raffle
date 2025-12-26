"use server";

/**
 * Server actions for raffle draw state recovery
 *
 * Story 6.2: Real-time Channel Setup & Synchronization
 * AC #5: Reconnection Handling - Fetch current state on reconnection
 *
 * This module provides server actions for fetching the current state of a
 * raffle draw, used when clients reconnect after a network interruption.
 *
 * @module lib/actions/raffleState
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Minimal raffle data for state recovery
 */
interface RaffleState {
  id: string;
  status: string;
  name: string;
}

/**
 * Prize state for recovery
 */
interface PrizeState {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  awarded_to: string | null;
  awarded_at: string | null;
  winner_name: string | null;
}

/**
 * Full draw state for reconnection recovery
 */
export interface RaffleDrawState {
  /** Current raffle information */
  raffle: RaffleState;
  /** All prizes with their current status */
  prizes: PrizeState[];
  /** Index of the current prize being drawn (or -1 if all awarded) */
  currentPrizeIndex: number;
  /** Number of prizes already awarded */
  awardedCount: number;
  /** Whether a draw is currently in progress */
  isDrawing: boolean;
  /** Timestamp of when state was fetched */
  timestamp: string;
}

/**
 * Result type for state fetch action
 */
export interface RaffleDrawStateResult {
  data: RaffleDrawState | null;
  error: string | null;
}

/**
 * Get the current draw state of a raffle
 *
 * Use this action when reconnecting to a broadcast channel to sync
 * the client with the current server state. This is especially important
 * if a draw occurred while the client was disconnected.
 *
 * @param raffleId - UUID of the raffle
 * @returns Current draw state or error
 *
 * @example
 * ```typescript
 * // In reconnection handler
 * const { data, error } = await getRaffleDrawState(raffleId);
 * if (data) {
 *   setCurrentPrizeIndex(data.currentPrizeIndex);
 *   setIsDrawing(data.isDrawing);
 *   // Sync other state...
 * }
 * ```
 */
export async function getRaffleDrawState(
  raffleId: string
): Promise<RaffleDrawStateResult> {
  try {
    const supabase = await createClient();

    // Fetch raffle data
    const { data: raffle, error: raffleError } = await supabase
      .from("raffles")
      .select("id, status, name")
      .eq("id", raffleId)
      .single();

    if (raffleError || !raffle) {
      console.error("[getRaffleDrawState] Raffle fetch error:", raffleError);
      return { data: null, error: "Failed to fetch raffle state" };
    }

    // Fetch prizes with winner information
    const { data: prizes, error: prizesError } = await supabase
      .from("prizes")
      .select(
        `
        id,
        name,
        description,
        sort_order,
        awarded_to,
        awarded_at,
        winner:users!awarded_to (
          name
        )
      `
      )
      .eq("raffle_id", raffleId)
      .order("sort_order", { ascending: true })
      .limit(100); // Reasonable limit for prizes

    if (prizesError) {
      console.error("[getRaffleDrawState] Prizes fetch error:", prizesError);
      return { data: null, error: "Failed to fetch raffle state" };
    }

    // Process prizes to add winner_name
    // Cast winner to typed object (from Supabase join)
    // Supabase returns the relation as an object when it's a to-one relation
    const processedPrizes: PrizeState[] = (prizes || []).map((prize) => {
      const winnerData = prize.winner as unknown as { name: string | null } | null;
      return {
        id: prize.id,
        name: prize.name,
        description: prize.description,
        sort_order: prize.sort_order,
        awarded_to: prize.awarded_to,
        awarded_at: prize.awarded_at,
        winner_name: winnerData?.name || null,
      };
    });

    // Calculate current prize index (first unawarded prize)
    const currentPrizeIndex = processedPrizes.findIndex(
      (p) => p.awarded_to === null
    );

    // Count awarded prizes
    const awardedCount = processedPrizes.filter(
      (p) => p.awarded_to !== null
    ).length;

    // Check if draw is in progress (raffle status is 'drawing')
    const isDrawing = raffle.status === "drawing";

    return {
      data: {
        raffle: {
          id: raffle.id,
          status: raffle.status,
          name: raffle.name,
        },
        prizes: processedPrizes,
        currentPrizeIndex,
        awardedCount,
        isDrawing,
        timestamp: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("[getRaffleDrawState] Unexpected error:", error);
    return { data: null, error: "Failed to fetch raffle state" };
  }
}
