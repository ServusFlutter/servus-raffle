import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface TicketCircleProps {
  count: number;
  size?: "default" | "large" | "projection";
  className?: string;
  /**
   * Story 6.6 AC #5: Indicates if the user recently won (within 24 hours)
   * Used to differentiate "new user with 0 tickets" from "winner with 0 tickets"
   */
  recentlyWon?: boolean;
}

/**
 * Returns contextual messaging based on ticket count
 *
 * Story 6.6 AC #5: Winner Dashboard Ticket Display
 * When recentlyWon is true and count is 0, shows winner-specific messaging
 * instead of the default "Join a raffle" message for new users.
 *
 * @param count - The number of tickets
 * @param recentlyWon - Whether the user recently won (within 24 hours)
 * @returns Encouraging message string
 */
export function getTicketMessage(count: number, recentlyWon: boolean = false): string {
  if (count === 0) {
    // Story 6.6 AC #5: Winner with 0 tickets sees different message
    if (recentlyWon) {
      return "Start fresh! Every meetup is a new chance to win.";
    }
    return "Join a raffle to get started!";
  }
  if (count === 1) {
    return "You're in! Good luck!";
  }
  if (count <= 3) {
    return "Building momentum!";
  }
  if (count <= 5) {
    return "Looking strong!";
  }
  return "Your best odds yet!";
}

/**
 * TicketCircle - Hero component displaying participant ticket count
 *
 * Features:
 * - Blue gradient with frosted glass effect (light mode)
 * - Glowing number effect on deep navy (dark mode)
 * - Responsive sizing for mobile, desktop, and projection modes
 * - Full accessibility support with ARIA live regions
 * - Respects prefers-reduced-motion for animations
 *
 * @param count - Number of tickets to display
 * @param size - Size variant: 'default' (200px), 'large' (300px), 'projection' (400px)
 * @param className - Additional CSS classes
 * @param recentlyWon - Story 6.6: Whether user recently won (passed to parent for messaging)
 */
export function TicketCircle({
  count,
  size = "default",
  className,
  // Note: recentlyWon prop is accepted for interface consistency but messaging
  // is handled externally via getTicketMessage(). This prop may be used in future for styling.
  recentlyWon = false,
}: TicketCircleProps) {
  // Suppress unused variable warning - prop is part of the interface
  void recentlyWon;
  // Track previous count to detect changes for animation
  const prevCountRef = useRef(count);
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when count changes
  useEffect(() => {
    if (prevCountRef.current !== count) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      prevCountRef.current = count;
      return () => clearTimeout(timer);
    }
  }, [count]);

  // Size classes based on variant
  // default: 200px mobile, 300px desktop
  // large: 300px always (for explicit large display)
  // projection: 400px always (for projection/live draw)
  const sizeClasses = {
    default: "w-[200px] h-[200px] md:w-[300px] md:h-[300px]",
    large: "w-[300px] h-[300px]",
    projection: "w-[400px] h-[400px]",
  };

  // Font size classes based on variant
  // default: 72px mobile, 96px desktop
  // large: 96px always (matches desktop default)
  // projection: 144px always
  const fontSizeClasses = {
    default: "text-[72px] md:text-[96px]",
    large: "text-[96px]",
    projection: "text-[144px]",
  };

  // Generate proper aria-label with singular/plural handling
  const ariaLabel = `You have ${count} ticket${count !== 1 ? "s" : ""}`;

  return (
    <div
      data-testid="ticket-circle-wrapper"
      className={cn("flex flex-col items-center", className)}
    >
      {/* Main circle container with gradient and glow effects */}
      <div
        data-testid="ticket-circle"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={ariaLabel}
        className={cn(
          // Base styles
          "relative rounded-full flex items-center justify-center",
          // Light mode: Blue gradient
          "bg-gradient-to-br from-primary to-sky-400",
          // Shadow for depth
          "shadow-xl",
          // Dark mode: Deep navy gradient with glow
          "dark:from-slate-900 dark:to-slate-800",
          "dark:shadow-[0_0_60px_-15px_rgba(2,125,253,0.5)]",
          // Size variant
          sizeClasses[size]
        )}
      >
        {/* Frosted glass overlay (light mode) */}
        <div
          data-testid="frosted-overlay"
          className={cn(
            "absolute inset-4 rounded-full",
            // Frosted glass effect (light mode)
            "bg-white/70 backdrop-blur-md",
            // Dark mode: transparent with subtle overlay
            "dark:bg-slate-900/50 dark:backdrop-blur-sm",
            // Center content
            "flex items-center justify-center"
          )}
        >
          {/* Ticket count number */}
          <span
            data-testid="ticket-number"
            className={cn(
              // Base typography
              "font-bold",
              // Light mode text color
              "text-primary",
              // Dark mode: lighter text with glow effect
              "dark:text-slate-50",
              "dark:drop-shadow-[0_0_15px_rgba(2,125,253,0.8)]",
              // Animation on count change - scale up slightly then return
              "transition-transform duration-300 ease-out",
              // Apply scale when animating
              isAnimating && "scale-105",
              // Respect reduced motion preference
              "motion-reduce:transition-none motion-reduce:transform-none",
              // Font size variant
              fontSizeClasses[size]
            )}
          >
            {count}
          </span>
        </div>
      </div>
    </div>
  );
}
