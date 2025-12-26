/**
 * ConfettiOverlay - Winner Celebration Confetti Effect
 *
 * Story 6.5: Winner Celebration & Announcement
 *
 * Features:
 * - 150 particles with spread of 70 (AC #4)
 * - Colors: Gold (#F7DC6F), Coral (#FF6B6B), Flutter Blue (#0553B1), Sky Blue (#54C5F8)
 * - 3 second animation duration (AC #4)
 * - Respects reduced motion preference (accessibility)
 * - Cleanup on unmount
 *
 * @module components/raffle/confettiOverlay
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import confetti from "canvas-confetti";

/**
 * Default confetti duration in milliseconds
 */
const DEFAULT_DURATION_MS = 3000;

/**
 * Confetti color palette
 * - Gold (#F7DC6F): Celebration gold
 * - Coral (#FF6B6B): Accent color
 * - Flutter Blue (#0553B1): Brand color
 * - Sky Blue (#54C5F8): Accent color
 */
const CONFETTI_COLORS = ["#F7DC6F", "#FF6B6B", "#0553B1", "#54C5F8"];

/**
 * Props interface for ConfettiOverlay component
 */
export interface ConfettiOverlayProps {
  /** Whether confetti should fire */
  active: boolean;
  /** Duration in ms before onComplete is called (default 3000) */
  duration?: number;
  /** Callback when confetti animation completes */
  onComplete?: () => void;
}

/**
 * Get the initial reduced motion preference (synchronous)
 */
function getInitialReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Custom hook to detect reduced motion preference
 */
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialReducedMotion);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Sync in case it changed between SSR and hydration
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * ConfettiOverlay - Fires confetti burst for winner celebration
 *
 * Uses canvas-confetti library to create a celebratory confetti effect.
 * Respects user's reduced motion preferences for accessibility.
 *
 * @example
 * ```tsx
 * <ConfettiOverlay
 *   active={showCelebration}
 *   duration={3000}
 *   onComplete={() => setShowCelebration(false)}
 * />
 * ```
 */
export function ConfettiOverlay({
  active,
  duration = DEFAULT_DURATION_MS,
  onComplete,
}: ConfettiOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFiredRef = useRef(false);
  const wasActiveRef = useRef(false);

  // Fire confetti burst
  const fireConfetti = useCallback(() => {
    if (prefersReducedMotion) {
      // Skip confetti for users who prefer reduced motion
      return;
    }

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
  }, [prefersReducedMotion]);

  // Handle active state changes
  useEffect(() => {
    // Detect transition from inactive to active
    if (active && !wasActiveRef.current) {
      // Fire confetti on becoming active (respects reduced motion)
      fireConfetti();
      hasFiredRef.current = true;

      // Set up completion timeout (always fires, even with reduced motion)
      timeoutRef.current = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, duration);
    } else if (!active && wasActiveRef.current) {
      // Reset when becoming inactive
      hasFiredRef.current = false;
      // Clear timeout when becoming inactive
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Update wasActive ref
    wasActiveRef.current = active;

    return () => {
      // Cleanup timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [active, duration, fireConfetti, onComplete]);

  // This component doesn't render any visible elements
  // The confetti is rendered directly to a canvas by the library
  return null;
}
