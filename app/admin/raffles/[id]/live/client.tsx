"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Users, Ticket, Trophy, Gift, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBroadcastChannel } from "@/lib/supabase/useBroadcastChannel";
import { subscribeToParticipantChanges } from "@/lib/supabase/realtime";
import type { PrizeWithWinner } from "@/lib/actions/prizes";
import type {
  BroadcastEvent,
  DrawStartPayload,
  WheelSeedPayload,
  WinnerRevealedPayload,
  RaffleEndedPayload,
} from "@/lib/constants/events";

interface LiveDrawClientProps {
  raffleId: string;
  raffleName: string;
  raffleStatus: string;
  currentPrize: PrizeWithWinner | null;
  currentPrizeIndex: number;
  totalPrizes: number;
  awardedCount: number;
  participantCount: number;
  totalTickets: number;
  prizes: PrizeWithWinner[];
}

/**
 * LiveDrawClient - Projection-Optimized Live Draw Interface
 *
 * This component provides a full-screen, projection-optimized UI for
 * conducting live raffle draws at events. Features:
 * - Pure black (#000000) background for projector visibility
 * - 2x text size for readability from the back of the room
 * - Hidden navigation/chrome for clean presentation
 * - Large "Draw Winner" button (placeholder until Story 6.3)
 * - Participant count and prize progress display
 * - Discrete exit button in top-right corner
 * - Real-time broadcast subscription for synchronized draws (Story 6.2)
 * - Real-time participant count updates (Story 6.2 AC #4)
 *
 * Story 6.1: Admin Live Draw Mode & Projection UI
 * Story 6.2: Real-time Channel Setup & Synchronization
 */
export function LiveDrawClient({
  raffleId,
  raffleName,
  raffleStatus: _raffleStatus, // Will be used in Story 6.3 for status-dependent UI
  currentPrize,
  currentPrizeIndex,
  totalPrizes,
  awardedCount,
  participantCount: initialParticipantCount,
  totalTickets: initialTotalTickets,
  prizes,
}: LiveDrawClientProps) {
  const router = useRouter();

  // Real-time participant count state (Story 6.2 AC #4)
  const [liveParticipantCount, setLiveParticipantCount] = useState(initialParticipantCount);
  const [liveTotalTickets, setLiveTotalTickets] = useState(initialTotalTickets);

  // State for draw events (Story 6.2)
  // TODO(Story 6.3): Use drawInProgress to toggle draw button state
  // TODO(Story 6.4): Use currentDrawPrize and wheelSeed for wheel animation
  // TODO(Story 6.5): Use revealedWinner for winner celebration display
  // These states are intentionally set but not yet rendered - they will be used in upcoming stories
  const [drawInProgress, setDrawInProgress] = useState(false);
  const [currentDrawPrize, setCurrentDrawPrize] = useState<string | null>(null);
  const [wheelSeed, setWheelSeed] = useState<number | null>(null);
  const [revealedWinner, setRevealedWinner] = useState<{
    winnerId: string;
    winnerName: string;
  } | null>(null);

  // Suppress unused variable warnings - these are intentional placeholders for Story 6.3/6.4/6.5
  void drawInProgress;
  void currentDrawPrize;
  void wheelSeed;
  void revealedWinner;

  // Broadcast event handlers (Story 6.2)
  const handleDrawStart = useCallback(
    (event: BroadcastEvent<DrawStartPayload>) => {
      console.log("[LiveDraw] Draw started for prize:", event.payload.prizeName);
      setDrawInProgress(true);
      setCurrentDrawPrize(event.payload.prizeName);
      setWheelSeed(null);
      setRevealedWinner(null);
    },
    []
  );

  const handleWheelSeed = useCallback(
    (event: BroadcastEvent<WheelSeedPayload>) => {
      console.log("[LiveDraw] Wheel seed received:", event.payload.seed);
      setWheelSeed(event.payload.seed);
    },
    []
  );

  const handleWinnerRevealed = useCallback(
    (event: BroadcastEvent<WinnerRevealedPayload>) => {
      console.log("[LiveDraw] Winner revealed:", event.payload.winnerName);
      setRevealedWinner({
        winnerId: event.payload.winnerId,
        winnerName: event.payload.winnerName,
      });
      setDrawInProgress(false);
      // Refresh to get updated prize data
      router.refresh();
    },
    [router]
  );

  const handleRaffleEnded = useCallback(
    (event: BroadcastEvent<RaffleEndedPayload>) => {
      console.log("[LiveDraw] Raffle ended, prizes awarded:", event.payload.totalPrizesAwarded);
      setDrawInProgress(false);
      setCurrentDrawPrize(null);
      setWheelSeed(null);
      setRevealedWinner(null);
      // Refresh to get final raffle state
      router.refresh();
    },
    [router]
  );

  const handleReconnect = useCallback(() => {
    console.log("[LiveDraw] Reconnecting - fetching current state");
    // On reconnect, refresh to get current state (Story 6.2 AC #5)
    router.refresh();
  }, [router]);

  // Subscribe to broadcast channel for draw events (Story 6.2 AC #1, #2)
  const { connectionState, isConnected, reconnect } = useBroadcastChannel(raffleId, {
    onDrawStart: handleDrawStart,
    onWheelSeed: handleWheelSeed,
    onWinnerRevealed: handleWinnerRevealed,
    onRaffleEnded: handleRaffleEnded,
    onReconnect: handleReconnect,
  });

  // Subscribe to participant changes for real-time count (Story 6.2 AC #4)
  useEffect(() => {
    const channel = subscribeToParticipantChanges(raffleId, () => {
      console.log("[LiveDraw] Participant change detected, refreshing data");
      // Refresh to get updated participant count
      router.refresh();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [raffleId, router]);

  // Update local state when props change (from router.refresh())
  useEffect(() => {
    setLiveParticipantCount(initialParticipantCount);
    setLiveTotalTickets(initialTotalTickets);
  }, [initialParticipantCount, initialTotalTickets]);

  // Log connection state for debugging
  useEffect(() => {
    console.log(`[LiveDraw] Broadcast connection state: ${connectionState}`);
  }, [connectionState]);

  // _raffleStatus is available for Story 6.3 when we implement:
  // - Different button states based on status (drawing vs active)
  // - Status transition handling
  void _raffleStatus;
  const allPrizesAwarded = awardedCount === totalPrizes && totalPrizes > 0;
  const noPrizes = totalPrizes === 0;

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col"
      data-testid="live-draw-container"
    >
      {/* Exit Button - Discrete, top-right (AC #4) */}
      <div className="absolute top-4 right-4 z-50">
        <Link href={`/admin/raffles/${raffleId}`}>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white hover:bg-white/10"
            aria-label="Exit Live Draw"
            data-testid="exit-button"
          >
            <X className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* Connection Status Indicator - Subtle, top-left (Story 6.2) */}
      <div
        className="absolute top-4 left-4 z-50 flex items-center gap-2"
        data-testid="connection-indicator"
      >
        {isConnected ? (
          <Wifi
            className="h-5 w-5 text-green-500/60"
            aria-label="Real-time connection active"
          />
        ) : (
          <button
            onClick={reconnect}
            className="flex items-center gap-2 text-yellow-500/80 hover:text-yellow-400 transition-colors"
            aria-label="Reconnect to real-time channel"
          >
            <WifiOff className="h-5 w-5" />
            <span className="text-sm">Reconnect</span>
          </button>
        )}
      </div>

      {/* Main Content - Centered for projection */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        {/* Raffle Name (AC #3) */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-8 text-white/90"
          data-testid="raffle-name"
        >
          {raffleName}
        </h1>

        {/* Prize Progress Display (AC #5) */}
        {totalPrizes > 0 && (
          <div
            className="text-2xl md:text-3xl text-white/70 mb-12"
            data-testid="prize-progress"
            role="status"
            aria-label={`Prize ${awardedCount + 1} of ${totalPrizes}`}
          >
            {allPrizesAwarded ? (
              <span className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-400" />
                All prizes awarded!
              </span>
            ) : (
              `Prize ${currentPrizeIndex + 1} of ${totalPrizes}`
            )}
          </div>
        )}

        {/* Current Prize Display - Hero Element (AC #5) */}
        {currentPrize && !allPrizesAwarded && (
          <div
            className="text-center mb-16"
            data-testid="current-prize-display"
          >
            <div className="text-xl md:text-2xl text-white/50 mb-4 uppercase tracking-wider">
              Now Drawing
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Gift className="h-12 w-12 md:h-16 md:w-16 text-primary" />
              <h2
                className="text-5xl md:text-7xl lg:text-8xl font-bold text-white"
                data-testid="current-prize-name"
              >
                {currentPrize.name}
              </h2>
            </div>
            {currentPrize.description && (
              <p
                className="text-2xl md:text-3xl text-white/60 max-w-2xl mx-auto"
                data-testid="current-prize-description"
              >
                {currentPrize.description}
              </p>
            )}
          </div>
        )}

        {/* No Prizes State */}
        {noPrizes && (
          <div
            className="text-center mb-16 text-white/50"
            data-testid="no-prizes-message"
          >
            <Gift className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-2xl md:text-3xl">No prizes configured</p>
            <p className="text-lg md:text-xl mt-2">
              Add prizes to the raffle before starting the draw
            </p>
          </div>
        )}

        {/* All Prizes Awarded State */}
        {allPrizesAwarded && (
          <div
            className="text-center mb-16"
            data-testid="all-prizes-awarded"
          >
            <Trophy className="h-24 w-24 mx-auto mb-6 text-yellow-400" />
            <p className="text-3xl md:text-4xl font-bold">
              Raffle Complete!
            </p>
            <p className="text-xl md:text-2xl text-white/60 mt-4">
              All {totalPrizes} prizes have been awarded
            </p>
          </div>
        )}

        {/* Draw Winner Button - Large, prominent (AC #3) */}
        {/* Disabled until Story 6.3 implements actual drawing logic */}
        {!allPrizesAwarded && !noPrizes && (
          <Button
            size="lg"
            disabled
            className="text-2xl md:text-3xl px-12 md:px-16 py-6 md:py-8 h-auto bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="draw-button"
            aria-label="Draw Winner button - available in future update"
          >
            Draw Winner
          </Button>
        )}

        {/* Participant Stats - Visible but secondary (AC #3) */}
        <div
          className="mt-16 flex items-center gap-12 text-white/60"
          data-testid="participant-stats"
          role="status"
          aria-label={`${liveParticipantCount} participants with ${liveTotalTickets} total tickets`}
        >
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 md:h-10 md:w-10" />
            <span
              className="text-3xl md:text-4xl font-semibold"
              data-testid="participant-count"
            >
              {liveParticipantCount}
            </span>
            <span className="text-xl md:text-2xl">
              {liveParticipantCount === 1 ? "Participant" : "Participants"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Ticket className="h-8 w-8 md:h-10 md:w-10" />
            <span
              className="text-3xl md:text-4xl font-semibold"
              data-testid="ticket-count"
            >
              {liveTotalTickets}
            </span>
            <span className="text-xl md:text-2xl">
              {liveTotalTickets === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
        </div>
      </div>

      {/* Prize List Summary - Bottom of screen (subtle) */}
      {prizes.length > 0 && (
        <div
          className="px-8 py-6 border-t border-white/10"
          data-testid="prize-summary"
        >
          <div className="flex justify-center gap-4 flex-wrap">
            {prizes.map((prize, index) => (
              <div
                key={prize.id}
                className={`px-4 py-2 rounded-lg text-sm md:text-base ${
                  prize.awarded_to
                    ? "bg-green-900/30 text-green-400"
                    : index === currentPrizeIndex
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-white/5 text-white/40"
                }`}
                data-testid={`prize-item-${index}`}
              >
                {prize.awarded_to ? (
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    {prize.name}
                    {prize.winner_name && (
                      <span className="text-white/60">
                        - {prize.winner_name}
                      </span>
                    )}
                  </span>
                ) : (
                  <span>{prize.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
