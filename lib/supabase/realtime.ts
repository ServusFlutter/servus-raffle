/**
 * Supabase Realtime Subscription Helpers
 *
 * This module provides helper functions for subscribing to real-time
 * database changes. These patterns are prepared for Epic 6 (Live Draw)
 * where real-time prize award updates will be needed.
 *
 * For Story 4-3, we document the pattern but don't implement full real-time.
 * The page uses polling (manual refresh) until Epic 6.
 *
 * @module lib/supabase/realtime
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "./client";
import type { Prize } from "@/lib/schemas/prize";

/**
 * Payload type for prize change events
 */
export type PrizeChangePayload = RealtimePostgresChangesPayload<{
  [key: string]: unknown;
}>;

/**
 * Callback type for prize update events
 */
export type PrizeUpdateCallback = (payload: PrizeChangePayload) => void;

/**
 * Subscribe to prize changes for a specific raffle.
 *
 * This creates a Postgres Changes subscription that will receive
 * real-time updates when prizes are created, updated, or deleted.
 *
 * NOTE: This pattern is prepared for Epic 6 (Live Draw). For Story 4-3,
 * the admin page uses manual refresh for status updates.
 *
 * @example
 * ```typescript
 * // In a React component
 * useEffect(() => {
 *   const channel = subscribeToPrizeChanges(raffleId, (payload) => {
 *     if (payload.eventType === 'UPDATE') {
 *       // Prize was updated (likely awarded)
 *       refreshPrizes();
 *     }
 *   });
 *
 *   return () => {
 *     channel.unsubscribe();
 *   };
 * }, [raffleId]);
 * ```
 *
 * @param raffleId - UUID of the raffle to monitor
 * @param onPrizeUpdate - Callback invoked when a prize changes
 * @returns RealtimeChannel that can be used to unsubscribe
 */
export function subscribeToPrizeChanges(
  raffleId: string,
  onPrizeUpdate: PrizeUpdateCallback
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`prizes:${raffleId}`)
    .on(
      "postgres_changes",
      {
        event: "*", // Listen to INSERT, UPDATE, DELETE
        schema: "public",
        table: "prizes",
        filter: `raffle_id=eq.${raffleId}`,
      },
      onPrizeUpdate
    )
    .subscribe();
}

/**
 * Subscribe specifically to prize award events.
 *
 * This is a specialized subscription that only fires when the
 * awarded_to field changes from null to a user ID.
 *
 * NOTE: Prepared for Epic 6. Uses UPDATE filter to catch awards.
 *
 * @example
 * ```typescript
 * const channel = subscribeToPrizeAwards(raffleId, (prize) => {
 *   showNotification(`${prize.name} was awarded!`);
 *   refreshPrizeList();
 * });
 * ```
 *
 * @param raffleId - UUID of the raffle to monitor
 * @param onPrizeAwarded - Callback invoked when a prize is awarded
 * @returns RealtimeChannel that can be used to unsubscribe
 */
export function subscribeToPrizeAwards(
  raffleId: string,
  onPrizeAwarded: (prize: Prize) => void
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`prize-awards:${raffleId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "prizes",
        filter: `raffle_id=eq.${raffleId}`,
      },
      (payload) => {
        const newRecord = payload.new as Record<string, unknown>;
        const oldRecord = payload.old as Record<string, unknown>;

        // Only trigger if awarded_to changed from null to a value
        if (oldRecord.awarded_to === null && newRecord.awarded_to !== null) {
          onPrizeAwarded(newRecord as unknown as Prize);
        }
      }
    )
    .subscribe();
}

/**
 * Hook pattern for prize subscriptions (Epic 6)
 *
 * This documents the pattern for a React hook that would be used
 * in Epic 6 for live draw functionality. Not implemented here
 * as it requires additional integration work.
 *
 * @example
 * ```typescript
 * // Epic 6 implementation pattern
 * function usePrizeSubscription(raffleId: string, onUpdate: () => void) {
 *   useEffect(() => {
 *     const channel = subscribeToPrizeChanges(raffleId, () => {
 *       onUpdate();
 *     });
 *
 *     return () => {
 *       channel.unsubscribe();
 *     };
 *   }, [raffleId, onUpdate]);
 * }
 * ```
 */

/**
 * Payload type for participant change events
 */
export type ParticipantChangePayload = RealtimePostgresChangesPayload<{
  [key: string]: unknown;
}>;

/**
 * Callback type for participant update events
 */
export type ParticipantUpdateCallback = (payload: ParticipantChangePayload) => void;

/**
 * Subscribe to participant changes for a specific raffle.
 *
 * This creates a Postgres Changes subscription that will receive
 * real-time updates when participants join the raffle.
 *
 * Used for Story 5-1: Participant List & Statistics Dashboard (FR37).
 *
 * @example
 * ```typescript
 * // In a React component
 * useEffect(() => {
 *   const channel = subscribeToParticipantChanges(raffleId, (payload) => {
 *     if (payload.eventType === 'INSERT') {
 *       // New participant joined
 *       refreshParticipants();
 *       refreshStatistics();
 *     }
 *   });
 *
 *   return () => {
 *     channel.unsubscribe();
 *   };
 * }, [raffleId]);
 * ```
 *
 * @param raffleId - UUID of the raffle to monitor
 * @param onParticipantChange - Callback invoked when participants change
 * @returns RealtimeChannel that can be used to unsubscribe
 */
export function subscribeToParticipantChanges(
  raffleId: string,
  onParticipantChange: ParticipantUpdateCallback
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`participants:${raffleId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT", // Only listen to new participants joining
        schema: "public",
        table: "participants",
        filter: `raffle_id=eq.${raffleId}`,
      },
      onParticipantChange
    )
    .subscribe();
}

/**
 * Clean up a realtime subscription
 *
 * @param channel - The RealtimeChannel to unsubscribe from
 * @returns Promise that resolves when unsubscribed
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await channel.unsubscribe();
}
