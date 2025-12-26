/**
 * Server-side broadcast utilities for raffle events
 *
 * Story 6.2: Real-time Channel Setup & Synchronization
 * AC #2: Event Broadcast Latency - Events sent within 500ms to all clients
 *
 * This module provides server-side functions for broadcasting raffle events
 * via Supabase Realtime. Uses the admin client (service role) to bypass RLS.
 *
 * IMPORTANT: Only use these functions in Server Actions or API routes.
 * Never import this module in client-side code.
 *
 * @module lib/supabase/broadcast
 */

import { createAdminClient } from "./admin";
import {
  RAFFLE_EVENTS,
  getBroadcastChannelName,
  type RaffleEventType,
  type BroadcastEvent,
  type DrawStartPayload,
  type WheelSeedPayload,
  type WinnerRevealedPayload,
  type RaffleEndedPayload,
} from "@/lib/constants/events";

/**
 * Broadcast a raffle event to all subscribed clients
 *
 * This is the core broadcast function. It:
 * 1. Creates a channel with the raffle:{id}:draw pattern
 * 2. Adds a timestamp for latency tracking (AC #2)
 * 3. Sends the event to all subscribed clients
 * 4. Logs the broadcast for monitoring
 *
 * @param raffleId - UUID of the raffle
 * @param eventType - Type of event (DRAW_START, WHEEL_SEED, etc.)
 * @param payload - Event-specific payload data
 * @returns Promise that resolves when the event is sent
 *
 * @example
 * ```typescript
 * await broadcastDrawEvent(
 *   raffleId,
 *   RAFFLE_EVENTS.DRAW_START,
 *   { raffleId, prizeId, prizeName }
 * );
 * ```
 */
/**
 * Result type for broadcast operations
 */
export interface BroadcastResult {
  success: boolean;
  error: string | null;
}

export async function broadcastDrawEvent<T>(
  raffleId: string,
  eventType: RaffleEventType,
  payload: T
): Promise<BroadcastResult> {
  const supabase = createAdminClient();
  const channelName = getBroadcastChannelName(raffleId);

  // Create broadcast event with timestamp for latency tracking
  const broadcastPayload: BroadcastEvent<T> = {
    type: eventType,
    payload,
    timestamp: new Date().toISOString(),
  };

  console.log(`[Broadcast] Sending ${eventType} to raffle: ${raffleId}`);

  const channel = supabase.channel(channelName);

  try {
    const result = await channel.send({
      type: "broadcast",
      event: eventType,
      payload: broadcastPayload,
    });

    // Supabase returns "ok" on success
    if (result === "ok") {
      return { success: true, error: null };
    }

    // Handle non-ok result
    console.error(`[Broadcast] Unexpected result: ${result}`);
    return { success: false, error: `Broadcast returned: ${result}` };
  } catch (error) {
    console.error(`[Broadcast] Error sending ${eventType}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown broadcast error",
    };
  } finally {
    // Clean up channel to prevent resource leaks
    await supabase.removeChannel(channel);
  }
}

/**
 * Broadcast DRAW_START event - Admin initiates draw for a prize
 *
 * Call this when the admin clicks "Draw Winner" to notify all
 * participants that a draw is starting.
 *
 * @param raffleId - UUID of the raffle
 * @param prizeId - UUID of the prize being drawn
 * @param prizeName - Display name of the prize
 * @returns Promise that resolves when the event is sent
 *
 * @example
 * ```typescript
 * // In drawWinner Server Action
 * await broadcastDrawStart(raffleId, prizeId, prize.name);
 * ```
 */
export async function broadcastDrawStart(
  raffleId: string,
  prizeId: string,
  prizeName: string
): Promise<BroadcastResult> {
  const payload: DrawStartPayload = {
    raffleId,
    prizeId,
    prizeName,
  };

  return broadcastDrawEvent(raffleId, RAFFLE_EVENTS.DRAW_START, payload);
}

/**
 * Broadcast WHEEL_SEED event - Random seed for synchronized wheel animation
 *
 * Call this immediately after DRAW_START to provide all clients with
 * the same random seed for identical wheel animations.
 *
 * @param raffleId - UUID of the raffle
 * @param prizeId - UUID of the prize being drawn
 * @param seed - Random seed for wheel animation (deterministic spin)
 * @returns Promise that resolves when the event is sent
 *
 * @example
 * ```typescript
 * // In drawWinner Server Action
 * const seed = Math.floor(Math.random() * 1000000);
 * await broadcastWheelSeed(raffleId, prizeId, seed);
 * ```
 */
export async function broadcastWheelSeed(
  raffleId: string,
  prizeId: string,
  seed: number
): Promise<BroadcastResult> {
  const payload: WheelSeedPayload = {
    raffleId,
    prizeId,
    seed,
  };

  return broadcastDrawEvent(raffleId, RAFFLE_EVENTS.WHEEL_SEED, payload);
}

/**
 * Broadcast WINNER_REVEALED event - Winner has been selected
 *
 * Call this after the wheel animation duration to reveal the winner
 * to all participants simultaneously.
 *
 * Story 6.5: Added ticketsAtWin and prizeName for celebration display
 *
 * @param raffleId - UUID of the raffle
 * @param prizeId - UUID of the prize that was awarded
 * @param winnerId - UUID of the winning user
 * @param winnerName - Display name of the winner
 * @param ticketsAtWin - Number of tickets the winner had at time of win
 * @param prizeName - Name of the prize being awarded
 * @returns Promise that resolves when the event is sent
 *
 * @example
 * ```typescript
 * // In drawWinner Server Action (after animation delay)
 * await broadcastWinnerRevealed(raffleId, prizeId, winner.id, winner.name, 8, "Grand Prize");
 * ```
 */
export async function broadcastWinnerRevealed(
  raffleId: string,
  prizeId: string,
  winnerId: string,
  winnerName: string,
  ticketsAtWin: number,
  prizeName: string
): Promise<BroadcastResult> {
  const payload: WinnerRevealedPayload = {
    raffleId,
    prizeId,
    winnerId,
    winnerName,
    ticketsAtWin,
    prizeName,
  };

  return broadcastDrawEvent(raffleId, RAFFLE_EVENTS.WINNER_REVEALED, payload);
}

/**
 * Broadcast RAFFLE_ENDED event - All prizes have been drawn
 *
 * Call this when the final prize is awarded to signal that
 * the raffle is complete.
 *
 * @param raffleId - UUID of the raffle
 * @param totalPrizesAwarded - Number of prizes that were awarded
 * @returns Promise that resolves when the event is sent
 *
 * @example
 * ```typescript
 * // In drawWinner Server Action (when all prizes awarded)
 * if (allPrizesAwarded) {
 *   await broadcastRaffleEnded(raffleId, totalPrizes);
 * }
 * ```
 */
export async function broadcastRaffleEnded(
  raffleId: string,
  totalPrizesAwarded: number
): Promise<BroadcastResult> {
  const payload: RaffleEndedPayload = {
    raffleId,
    totalPrizesAwarded,
  };

  return broadcastDrawEvent(raffleId, RAFFLE_EVENTS.RAFFLE_ENDED, payload);
}
