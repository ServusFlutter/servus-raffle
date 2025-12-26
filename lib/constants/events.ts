/**
 * Raffle event constants for real-time broadcasting
 *
 * Used in Story 6.1+ for live draw experience.
 * These events are broadcast via Supabase Realtime channels.
 */

/**
 * Raffle event types for broadcast channels
 *
 * - DRAW_START: Admin initiates draw for a prize
 * - WHEEL_SEED: Random seed for wheel animation synchronization
 * - WINNER_REVEALED: Winner has been selected and revealed
 * - RAFFLE_ENDED: All prizes have been drawn
 */
export const RAFFLE_EVENTS = {
  DRAW_START: "DRAW_START",
  WHEEL_SEED: "WHEEL_SEED",
  WINNER_REVEALED: "WINNER_REVEALED",
  RAFFLE_ENDED: "RAFFLE_ENDED",
} as const;

/**
 * Type for raffle event names
 */
export type RaffleEventType = (typeof RAFFLE_EVENTS)[keyof typeof RAFFLE_EVENTS];

/**
 * Generic broadcast event structure for real-time communication
 *
 * @template T - The payload type for this event
 */
export type BroadcastEvent<T = unknown> = {
  /** The type of event being broadcast */
  type: RaffleEventType;
  /** Event-specific payload data */
  payload: T;
  /** ISO 8601 timestamp when the event was created */
  timestamp: string;
};

/**
 * Payload for DRAW_START event
 */
export type DrawStartPayload = {
  raffleId: string;
  prizeId: string;
  prizeName: string;
};

/**
 * Payload for WHEEL_SEED event
 */
export type WheelSeedPayload = {
  raffleId: string;
  prizeId: string;
  seed: number;
};

/**
 * Payload for WINNER_REVEALED event
 *
 * Story 6.5: Added ticketsAtWin and prizeName for celebration display
 */
export type WinnerRevealedPayload = {
  raffleId: string;
  prizeId: string;
  winnerId: string;
  winnerName: string;
  /** Number of tickets the winner had at time of win (Story 6.5) */
  ticketsAtWin: number;
  /** Name of the prize awarded (Story 6.5) */
  prizeName: string;
};

/**
 * Payload for RAFFLE_ENDED event
 */
export type RaffleEndedPayload = {
  raffleId: string;
  totalPrizesAwarded: number;
};

/**
 * Generate the broadcast channel name for a raffle
 *
 * Pattern: raffle:{id}:draw
 *
 * @param raffleId - UUID of the raffle
 * @returns Channel name string
 *
 * @example
 * ```typescript
 * const channelName = getBroadcastChannelName("abc-123");
 * // Returns: "raffle:abc-123:draw"
 * ```
 */
export function getBroadcastChannelName(raffleId: string): string {
  return `raffle:${raffleId}:draw`;
}
