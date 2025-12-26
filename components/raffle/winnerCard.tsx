/**
 * WinnerCard - Winner Celebration Card Component
 *
 * Story 6.5: Winner Celebration & Announcement
 *
 * Features:
 * - Celebration gold (#F7DC6F) background (AC #2)
 * - Scale + fade entrance animation with Framer Motion (AC #2)
 * - Winner name display: 48px mobile, 96px projection (AC #3, FR31)
 * - Ticket count display with "X tickets - WINNER!" format (AC #3, FR32)
 * - ARIA live region for screen reader accessibility (AC #7)
 * - Optional callback when celebration ends
 *
 * @module components/raffle/winnerCard
 */

"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

/**
 * Default celebration duration in milliseconds
 */
const DEFAULT_CELEBRATION_DURATION_MS = 3000;

/**
 * Animation variants for scale + fade entrance (AC #2)
 */
const winnerCardVariants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeIn" as const,
    },
  },
};

/**
 * Props interface for WinnerCard component
 */
export interface WinnerCardProps {
  /** Name of the winner to display */
  winnerName: string;
  /** Number of tickets the winner had */
  ticketCount: number;
  /** Whether the current user is the winner */
  isCurrentUser: boolean;
  /** Prize name being awarded */
  prizeName?: string;
  /** Duration in ms before onCelebrationEnd is called (default 3000) */
  celebrationDuration?: number;
  /** Callback when celebration should end */
  onCelebrationEnd?: () => void;
  /** Whether this is displayed in projection mode (larger typography) */
  isProjectionMode?: boolean;
  /** Optional CSS class for styling overrides */
  className?: string;
}

/**
 * WinnerCard - Displays winner announcement with celebration styling
 *
 * @example
 * ```tsx
 * <WinnerCard
 *   winnerName="Lisa"
 *   ticketCount={8}
 *   isCurrentUser={false}
 *   prizeName="Grand Prize"
 *   onCelebrationEnd={() => setShowWinner(false)}
 * />
 * ```
 */
export function WinnerCard({
  winnerName,
  ticketCount,
  isCurrentUser,
  prizeName,
  celebrationDuration = DEFAULT_CELEBRATION_DURATION_MS,
  onCelebrationEnd,
  isProjectionMode = false,
  className,
}: WinnerCardProps) {
  // Trigger onCelebrationEnd after duration
  useEffect(() => {
    if (onCelebrationEnd) {
      const timer = setTimeout(() => {
        onCelebrationEnd();
      }, celebrationDuration);

      return () => clearTimeout(timer);
    }
  }, [onCelebrationEnd, celebrationDuration]);

  return (
    <AnimatePresence>
      <motion.div
        data-testid="winner-card"
        role="region"
        aria-label={`Winner announcement: ${winnerName} with ${ticketCount} tickets`}
        className={cn(
          // Celebration gold background (AC #2)
          "bg-[#F7DC6F]",
          // Card styling
          "rounded-2xl",
          "p-8 md:p-12",
          "text-center",
          // Shadow and glow for emphasis
          "shadow-2xl",
          "shadow-[#F7DC6F]/50",
          // Min width for readability
          "min-w-[300px]",
          "max-w-[600px]",
          // GPU acceleration
          "will-change-transform",
          className
        )}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={winnerCardVariants}
      >
        {/* ARIA live region for screen reader announcement (AC #7) */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {winnerName} is the winner with {ticketCount} tickets
        </div>

        {/* Trophy icon */}
        <div className="flex justify-center mb-4">
          <Trophy
            className={cn(
              "text-amber-800",
              isProjectionMode ? "h-16 w-16" : "h-12 w-12"
            )}
            aria-hidden="true"
          />
        </div>

        {/* Prize name (if provided) */}
        {prizeName && (
          <p
            className={cn(
              "text-amber-800/80 font-medium mb-2",
              isProjectionMode ? "text-2xl" : "text-lg"
            )}
          >
            {prizeName}
          </p>
        )}

        {/* Congratulations message for current user */}
        {isCurrentUser && (
          <p
            className={cn(
              "text-amber-800 font-bold mb-2 uppercase tracking-wide",
              isProjectionMode ? "text-3xl" : "text-xl"
            )}
          >
            Congratulations!
          </p>
        )}

        {/* Winner name - Hero element (AC #3, FR31) */}
        <h2
          data-testid="winner-name"
          className={cn(
            // Typography: 48px mobile (text-5xl = 3rem = 48px)
            "text-5xl",
            // Typography: 96px projection (text-8xl = 6rem = 96px)
            "projection:text-8xl",
            "font-bold",
            "text-gray-900",
            "mb-4",
            // Projection mode override
            isProjectionMode && "text-8xl"
          )}
        >
          {winnerName}
        </h2>

        {/* Ticket count and WINNER text (AC #3, FR32) */}
        <p
          className={cn(
            // Typography: 20px mobile (text-xl)
            "text-xl",
            // Typography: 40px projection
            isProjectionMode && "text-4xl",
            "font-semibold",
            "text-amber-800"
          )}
        >
          {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"}
        </p>

        {/* WINNER badge (AC #3) */}
        <div
          className={cn(
            "mt-4",
            "inline-block",
            "px-6 py-2",
            "bg-amber-800",
            "text-[#F7DC6F]",
            "rounded-full",
            // Typography: 28px mobile (text-2xl = 1.5rem = 24px, text-3xl = 30px)
            "text-2xl",
            // Typography: 56px projection
            isProjectionMode && "text-5xl px-10 py-4",
            "font-bold",
            "tracking-wider"
          )}
        >
          WINNER!
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
