/**
 * useBroadcastChannel - React hook for Supabase Broadcast channel subscription
 *
 * Story 6.2: Real-time Channel Setup & Synchronization
 * AC #1: Broadcast Channel Subscription - Subscribe to raffle:{id}:draw channel
 * AC #5: Reconnection Handling - Handle disconnection and state recovery
 *
 * This hook provides:
 * - Channel subscription with raffle:{id}:draw pattern
 * - Connection state tracking (connected/connecting/disconnected)
 * - Event callbacks for all raffle events
 * - Reconnection with state recovery
 * - Latency monitoring and logging
 * - Automatic cleanup on unmount
 *
 * @module lib/supabase/useBroadcastChannel
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "./client";
import {
  RAFFLE_EVENTS,
  getBroadcastChannelName,
  type BroadcastEvent,
  type DrawStartPayload,
  type WheelSeedPayload,
  type WinnerRevealedPayload,
  type RaffleEndedPayload,
} from "@/lib/constants/events";

/**
 * Connection state types
 */
export type ConnectionState = "connecting" | "connected" | "disconnected";

/**
 * Callback options for broadcast events
 */
export interface BroadcastChannelCallbacks {
  /** Called when DRAW_START event is received */
  onDrawStart?: (event: BroadcastEvent<DrawStartPayload>) => void;
  /** Called when WHEEL_SEED event is received */
  onWheelSeed?: (event: BroadcastEvent<WheelSeedPayload>) => void;
  /** Called when WINNER_REVEALED event is received */
  onWinnerRevealed?: (event: BroadcastEvent<WinnerRevealedPayload>) => void;
  /** Called when RAFFLE_ENDED event is received */
  onRaffleEnded?: (event: BroadcastEvent<RaffleEndedPayload>) => void;
  /** Called after successful reconnection */
  onReconnect?: () => void;
  /** Called on any connection state change */
  onConnectionStateChange?: (state: ConnectionState) => void;
}

/**
 * Return type for useBroadcastChannel hook
 */
export interface UseBroadcastChannelReturn {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Convenience boolean for connected state */
  isConnected: boolean;
  /** Manually trigger reconnection */
  reconnect: () => void;
}

/**
 * Latency threshold for warning (FR40: 500ms)
 */
const LATENCY_THRESHOLD_MS = 500;

/**
 * Reconnection backoff configuration
 * Initial delay: 1 second, max delay: 30 seconds, multiplier: 2x
 */
const RECONNECT_CONFIG = {
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  multiplier: 2,
} as const;

/**
 * Log event latency and warn if above threshold
 */
function logLatency(eventType: string, timestamp: string): void {
  const eventTimestamp = new Date(timestamp).getTime();
  const receivedTimestamp = Date.now();
  const latencyMs = receivedTimestamp - eventTimestamp;

  console.log(`[Broadcast] Event: ${eventType}, Latency: ${latencyMs}ms`);

  if (latencyMs > LATENCY_THRESHOLD_MS) {
    console.warn(
      `[Broadcast] Latency exceeded 500ms threshold: ${latencyMs}ms`
    );
  }
}

/**
 * React hook for subscribing to Supabase Broadcast channels for raffle events
 *
 * @param raffleId - UUID of the raffle to subscribe to
 * @param callbacks - Optional callbacks for each event type
 * @returns Connection state and reconnect function
 *
 * @example
 * ```tsx
 * const { connectionState, isConnected, reconnect } = useBroadcastChannel(
 *   raffleId,
 *   {
 *     onDrawStart: (event) => console.log("Draw started:", event),
 *     onWheelSeed: (event) => setWheelSeed(event.payload.seed),
 *     onWinnerRevealed: (event) => showWinner(event.payload),
 *     onRaffleEnded: (event) => setRaffleComplete(true),
 *     onReconnect: () => fetchCurrentState(),
 *   }
 * );
 * ```
 */
export function useBroadcastChannel(
  raffleId: string,
  callbacks?: BroadcastChannelCallbacks
): UseBroadcastChannelReturn {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef(callbacks);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep callbacks ref updated to avoid stale closures
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Update connection state and notify callback
  const updateConnectionState = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    callbacksRef.current?.onConnectionStateChange?.(state);
  }, []);

  // Subscribe to channel
  const subscribe = useCallback(() => {
    const supabase = createClient();
    const channelName = getBroadcastChannelName(raffleId);

    // Create channel with event handlers
    const channel = supabase
      .channel(channelName)
      .on(
        "broadcast",
        { event: RAFFLE_EVENTS.DRAW_START },
        (payload: { payload: BroadcastEvent<DrawStartPayload> }) => {
          logLatency(RAFFLE_EVENTS.DRAW_START, payload.payload.timestamp);
          callbacksRef.current?.onDrawStart?.(payload.payload);
        }
      )
      .on(
        "broadcast",
        { event: RAFFLE_EVENTS.WHEEL_SEED },
        (payload: { payload: BroadcastEvent<WheelSeedPayload> }) => {
          logLatency(RAFFLE_EVENTS.WHEEL_SEED, payload.payload.timestamp);
          callbacksRef.current?.onWheelSeed?.(payload.payload);
        }
      )
      .on(
        "broadcast",
        { event: RAFFLE_EVENTS.WINNER_REVEALED },
        (payload: { payload: BroadcastEvent<WinnerRevealedPayload> }) => {
          logLatency(RAFFLE_EVENTS.WINNER_REVEALED, payload.payload.timestamp);
          callbacksRef.current?.onWinnerRevealed?.(payload.payload);
        }
      )
      .on(
        "broadcast",
        { event: RAFFLE_EVENTS.RAFFLE_ENDED },
        (payload: { payload: BroadcastEvent<RaffleEndedPayload> }) => {
          logLatency(RAFFLE_EVENTS.RAFFLE_ENDED, payload.payload.timestamp);
          callbacksRef.current?.onRaffleEnded?.(payload.payload);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          updateConnectionState("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          updateConnectionState("disconnected");
        }
      });

    channelRef.current = channel;
  }, [raffleId, updateConnectionState]);

  // Unsubscribe from channel
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);

  // Calculate delay for next reconnection attempt using exponential backoff
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      RECONNECT_CONFIG.initialDelayMs *
        Math.pow(RECONNECT_CONFIG.multiplier, reconnectAttemptRef.current),
      RECONNECT_CONFIG.maxDelayMs
    );
    return delay;
  }, []);

  // Reconnect function with exponential backoff (AC #5)
  const reconnect = useCallback(() => {
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    unsubscribe();
    updateConnectionState("connecting");

    const delay = getReconnectDelay();
    reconnectAttemptRef.current += 1;

    // Schedule reconnection with backoff delay
    reconnectTimeoutRef.current = setTimeout(() => {
      subscribe();
      // Reset attempt counter on successful reconnection trigger
      // Actual success is determined by subscription callback
      callbacksRef.current?.onReconnect?.();
    }, delay);
  }, [subscribe, unsubscribe, updateConnectionState, getReconnectDelay]);

  // Effect to manage subscription lifecycle
  useEffect(() => {
    // Reset reconnect attempt counter on mount/raffleId change
    reconnectAttemptRef.current = 0;
    subscribe();

    return () => {
      // Clean up pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    connectionState,
    isConnected: connectionState === "connected",
    reconnect,
  };
}
