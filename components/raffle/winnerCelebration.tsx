/**
 * WinnerCelebration - Container Component for Winner Announcement
 *
 * Story 6.5: Winner Celebration & Announcement
 *
 * This component orchestrates the winner celebration experience:
 * 1. 500ms suspense pause with "And the winner is..." (AC #1)
 * 2. WinnerCard reveal with scale + fade animation (AC #2, #3)
 * 3. Confetti burst on winner reveal (AC #4)
 * 4. Non-winner message after celebration ends (AC #6)
 *
 * Features:
 * - Suspense pause before reveal (500ms)
 * - Synchronized display via broadcast events
 * - Current user detection for personalized messaging
 * - Projection mode support for large displays
 *
 * @module components/raffle/winnerCelebration
 */

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WinnerCard } from "./winnerCard";
import { ConfettiOverlay } from "./confettiOverlay";

/**
 * Suspense pause duration in milliseconds (AC #1)
 * Brief pause after wheel stops to build anticipation
 */
export const SUSPENSE_PAUSE_MS = 500;

/**
 * Default celebration duration in milliseconds
 * How long the winner card and confetti are displayed
 */
const DEFAULT_CELEBRATION_DURATION_MS = 3000;

/**
 * Props interface for WinnerCelebration component
 */
export interface WinnerCelebrationProps {
  /** ID of the winner */
  winnerId: string;
  /** Name of the winner to display */
  winnerName: string;
  /** Number of tickets the winner had */
  ticketsAtWin: number;
  /** Name of the prize being awarded */
  prizeName?: string;
  /** Whether to show the celebration */
  showCelebration: boolean;
  /** Current user's ID (to determine if they won) */
  currentUserId: string;
  /** Current user's ticket count (for non-winner message) */
  currentUserTicketCount?: number;
  /** Whether this is displayed in projection mode (larger typography) */
  isProjectionMode?: boolean;
  /** Callback when celebration is complete */
  onCelebrationComplete?: () => void;
  /** Optional CSS class for styling overrides */
  className?: string;
}

/**
 * Celebration state machine phases
 */
type CelebrationPhase = "idle" | "suspense" | "reveal" | "post-celebration";

/**
 * WinnerCelebration - Orchestrates the winner announcement experience
 *
 * Flow:
 * 1. showCelebration becomes true
 * 2. Enter "suspense" phase (500ms) - show "And the winner is..."
 * 3. Enter "reveal" phase - show WinnerCard + fire confetti
 * 4. After celebration duration, enter "post-celebration" phase
 * 5. Non-winners see carry-forward message
 *
 * @example
 * ```tsx
 * <WinnerCelebration
 *   winnerId="user-123"
 *   winnerName="Lisa"
 *   ticketsAtWin={8}
 *   prizeName="Grand Prize"
 *   showCelebration={true}
 *   currentUserId="user-456"
 *   currentUserTicketCount={5}
 *   onCelebrationComplete={() => setShowCelebration(false)}
 * />
 * ```
 */
export function WinnerCelebration({
  winnerId,
  winnerName,
  ticketsAtWin,
  prizeName,
  showCelebration,
  currentUserId,
  currentUserTicketCount = 0,
  isProjectionMode = false,
  onCelebrationComplete,
  className,
}: WinnerCelebrationProps) {
  const [phase, setPhase] = useState<CelebrationPhase>("idle");
  const [showConfetti, setShowConfetti] = useState(false);

  // Determine if current user is the winner
  const isCurrentUserWinner = currentUserId === winnerId;

  // Handle phase transitions
  useEffect(() => {
    if (!showCelebration) {
      setPhase("idle");
      setShowConfetti(false);
      return;
    }

    // Start suspense phase
    setPhase("suspense");

    // After suspense pause, enter reveal phase
    const suspenseTimer = setTimeout(() => {
      setPhase("reveal");
      setShowConfetti(true);
    }, SUSPENSE_PAUSE_MS);

    // After suspense + celebration duration, enter post-celebration phase
    const celebrationTimer = setTimeout(() => {
      setPhase("post-celebration");
      setShowConfetti(false);
      onCelebrationComplete?.();
    }, SUSPENSE_PAUSE_MS + DEFAULT_CELEBRATION_DURATION_MS);

    return () => {
      clearTimeout(suspenseTimer);
      clearTimeout(celebrationTimer);
    };
  }, [showCelebration, onCelebrationComplete]);

  // Don't render anything when not celebrating
  if (!showCelebration && phase === "idle") {
    return null;
  }

  return (
    <div
      data-testid="winner-celebration"
      className={cn(
        // Full-screen overlay
        "fixed inset-0 z-50",
        // Pure black background for projection
        "bg-black/95",
        // Center content
        "flex items-center justify-center",
        // Padding for smaller screens
        "p-4",
        className
      )}
    >
      {/* Suspense Phase - "And the winner is..." */}
      {phase === "suspense" && (
        <div
          data-testid="suspense-indicator"
          className={cn(
            "text-white text-center",
            "animate-pulse"
          )}
        >
          <p
            className={cn(
              "font-bold tracking-wider",
              isProjectionMode ? "text-6xl" : "text-3xl"
            )}
          >
            And the winner is...
          </p>
        </div>
      )}

      {/* Reveal Phase - WinnerCard + Confetti */}
      {phase === "reveal" && (
        <>
          <WinnerCard
            winnerName={winnerName}
            ticketCount={ticketsAtWin}
            isCurrentUser={isCurrentUserWinner}
            prizeName={prizeName}
            isProjectionMode={isProjectionMode}
          />
          <ConfettiOverlay
            active={showConfetti}
            duration={DEFAULT_CELEBRATION_DURATION_MS}
          />
        </>
      )}

      {/* Post-Celebration Phase - Non-winner message */}
      {phase === "post-celebration" && !isCurrentUserWinner && (
        <div
          data-testid="non-winner-message"
          className={cn(
            "text-white text-center",
            "max-w-md mx-auto",
            "p-6 rounded-lg",
            "bg-white/10"
          )}
        >
          {/* Winner announcement recap */}
          <p
            className={cn(
              "text-white/70 mb-4",
              isProjectionMode ? "text-2xl" : "text-lg"
            )}
          >
            Congratulations to <span className="font-bold text-[#F7DC6F]">{winnerName}</span>!
          </p>

          {/* Non-winner encouragement message (AC #6) */}
          <p
            className={cn(
              "font-semibold",
              isProjectionMode ? "text-3xl" : "text-xl"
            )}
          >
            Not this time - your {currentUserTicketCount} {currentUserTicketCount === 1 ? "ticket carries" : "tickets carry"} forward!
          </p>
        </div>
      )}

      {/* Post-Celebration Phase - Winner sees different message */}
      {phase === "post-celebration" && isCurrentUserWinner && (
        <div
          data-testid="winner-post-message"
          className={cn(
            "text-white text-center",
            "max-w-md mx-auto",
            "p-6 rounded-lg",
            "bg-[#F7DC6F]/10"
          )}
        >
          <p
            className={cn(
              "font-bold text-[#F7DC6F]",
              isProjectionMode ? "text-4xl" : "text-2xl"
            )}
          >
            You won {prizeName || "the prize"}!
          </p>
          <p
            className={cn(
              "text-white/80 mt-2",
              isProjectionMode ? "text-xl" : "text-base"
            )}
          >
            Your tickets have been reset
          </p>
        </div>
      )}
    </div>
  );
}
