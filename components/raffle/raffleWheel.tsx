/**
 * RaffleWheel - Wheel-of-Fortune animation component
 *
 * Story 6.4: Wheel-of-Fortune Animation
 *
 * Features:
 * - Full-screen overlay with wheel animation (AC1)
 * - Participant names on wheel segments (AC2, FR28)
 * - 5-second spin duration with cubic-bezier easing (AC3, FR29)
 * - Synchronized animation via seed (AC4)
 * - Navy-to-sky-blue gradient with gold pointer (AC5)
 * - Reduced motion accessibility support (AC6)
 * - 60fps performance with GPU acceleration (AC7, NFR5)
 *
 * @module components/raffle/raffleWheel
 */

"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animation duration in milliseconds (FR29: exactly 5 seconds)
 */
export const ANIMATION_DURATION_MS = 5000;

/**
 * Animation easing curve - gradual deceleration for suspense
 * From UX spec: cubic-bezier(0.17, 0.67, 0.12, 0.99)
 */
const ANIMATION_EASING: [number, number, number, number] = [0.17, 0.67, 0.12, 0.99];

/**
 * Color palette for wheel segments
 */
const SEGMENT_COLORS = {
  navy: "#1E3A5F",
  skyBlue: "#54C5F8",
} as const;

/**
 * Gold color for pointer (projection mode uses brighter gold)
 */
const POINTER_COLOR = "#FFD700";

/**
 * Calculate wheel rotation from seed for synchronized animation (AC4)
 *
 * @param seed - Random seed from server (0-999999)
 * @param participantCount - Number of segments on wheel
 * @returns Total rotation in degrees (multiple full rotations + final position)
 *
 * Critical: The server (draw.ts) uses the same seed to determine the winner,
 * so the wheel animation result must match the actual winner.
 */
export function calculateWheelRotation(seed: number, participantCount: number): number {
  // Each segment spans 360/participantCount degrees
  const segmentAngle = 360 / participantCount;

  // Use seed to determine which segment the wheel stops on
  const winnerSegmentIndex = seed % participantCount;

  // Calculate the angle to the winner segment (pointer at top = 0 degrees)
  const finalAngle = winnerSegmentIndex * segmentAngle;

  // Add multiple full rotations for visual effect (5-8 rotations)
  // Use seed to vary number of rotations for variety
  const fullRotations = 5 + (seed % 4); // 5-8 rotations

  // Total rotation = full rotations + final position
  // Subtract finalAngle because wheel rotates clockwise
  const totalRotation = fullRotations * 360 + (360 - finalAngle);

  return totalRotation;
}

/**
 * Custom hook to detect reduced motion preference (AC6)
 */
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
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
 * Props interface for RaffleWheel component
 */
export interface RaffleWheelProps {
  /** List of participants to display on wheel segments */
  participants: Array<{ id: string; name: string }>;
  /** Random seed for deterministic animation (from WHEEL_SEED event) */
  seed: number | null;
  /** Whether the wheel should be visible and spinning */
  isSpinning: boolean;
  /** Callback when spin animation completes */
  onSpinComplete?: () => void;
  /** Optional CSS class for styling overrides */
  className?: string;
}

/**
 * Individual wheel segment component
 */
interface WheelSegmentProps {
  name: string;
  index: number;
  totalSegments: number;
  radius: number;
}

function WheelSegment({ name, index, totalSegments, radius }: WheelSegmentProps) {
  const segmentAngle = 360 / totalSegments;
  const startAngle = index * segmentAngle;
  const endAngle = startAngle + segmentAngle;

  // Convert angles to radians for path calculation
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  // Calculate arc path points
  const x1 = radius + radius * Math.cos(startRad);
  const y1 = radius + radius * Math.sin(startRad);
  const x2 = radius + radius * Math.cos(endRad);
  const y2 = radius + radius * Math.sin(endRad);

  // Determine if arc is large (> 180 degrees)
  const largeArcFlag = segmentAngle > 180 ? 1 : 0;

  // SVG path for segment
  const pathD = [
    `M ${radius} ${radius}`, // Move to center
    `L ${x1} ${y1}`, // Line to start of arc
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Arc to end
    "Z", // Close path
  ].join(" ");

  // Alternating colors
  const fillColor = index % 2 === 0 ? SEGMENT_COLORS.navy : SEGMENT_COLORS.skyBlue;

  // Calculate text position (middle of segment)
  // For full-circle (single participant), center the text
  const isSingleParticipant = totalSegments === 1;
  const midAngle = ((startAngle + segmentAngle / 2 - 90) * Math.PI) / 180;
  const textRadius = isSingleParticipant ? 0 : radius * 0.65; // Center for single, 65% for multiple
  const textX = radius + textRadius * Math.cos(midAngle);
  const textY = radius + textRadius * Math.sin(midAngle);
  const textRotation = isSingleParticipant ? 0 : startAngle + segmentAngle / 2;

  // Truncate long names
  const displayName = name.length > 12 ? `${name.slice(0, 10)}...` : name;

  return (
    <g data-testid="wheel-segment">
      <path d={pathD} fill={fillColor} stroke="#FFFFFF" strokeWidth="1" />
      <text
        x={textX}
        y={textY}
        fill="#FFFFFF"
        fontSize={totalSegments > 10 ? "10" : "14"}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(${textRotation}, ${textX}, ${textY})`}
        className="select-none pointer-events-none"
      >
        {displayName}
      </text>
    </g>
  );
}

/**
 * Gold pointer indicator at top of wheel
 */
function WheelPointer() {
  return (
    <div
      data-testid="wheel-pointer"
      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
    >
      <svg width="40" height="50" viewBox="0 0 40 50" className="drop-shadow-lg">
        <polygon
          points="20,50 0,10 20,0 40,10"
          fill={POINTER_COLOR}
          stroke="#B8860B"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

/**
 * RaffleWheel - Main wheel-of-fortune animation component
 *
 * @example
 * ```tsx
 * <RaffleWheel
 *   participants={[{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]}
 *   seed={12345}
 *   isSpinning={true}
 *   onSpinComplete={() => console.log('Animation complete!')}
 * />
 * ```
 */
export function RaffleWheel({
  participants,
  seed,
  isSpinning,
  onSpinComplete,
  className,
}: RaffleWheelProps) {
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  const [hasSpun, setHasSpun] = useState(false);

  // Memoize participants to prevent re-renders during animation (AC7)
  const memoizedParticipants = useMemo(() => participants, [participants]);

  // Calculate wheel radius based on viewport with resize handling
  const [wheelRadius, setWheelRadius] = useState(200);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const calculateRadius = () => {
      // Projection mode: 80% of viewport height (max 400px for desktop)
      const viewportMin = Math.min(window.innerWidth, window.innerHeight);
      setWheelRadius(Math.min(viewportMin * 0.4, 200));
    };

    // Calculate initial radius
    calculateRadius();

    // Update on resize
    window.addEventListener("resize", calculateRadius);
    return () => window.removeEventListener("resize", calculateRadius);
  }, []);

  // Start spin animation when seed is provided
  const startSpin = useCallback(async (spinSeed: number) => {
    if (memoizedParticipants.length === 0) return;

    const totalRotation = calculateWheelRotation(spinSeed, memoizedParticipants.length);

    if (prefersReducedMotion) {
      // AC6: Skip animation, just show final position
      const finalRotation = totalRotation % 360;
      controls.set({ rotate: finalRotation });
      onSpinComplete?.();
      return;
    }

    // Animate the wheel (AC2, AC3)
    await controls.start({
      rotate: totalRotation,
      transition: {
        duration: ANIMATION_DURATION_MS / 1000, // Convert to seconds for Framer Motion
        ease: ANIMATION_EASING,
      },
    });

    setHasSpun(true);
    onSpinComplete?.();
  }, [memoizedParticipants, prefersReducedMotion, controls, onSpinComplete]);

  // Trigger animation when seed changes and isSpinning
  useEffect(() => {
    if (isSpinning && seed !== null && !hasSpun) {
      startSpin(seed);
    }
  }, [isSpinning, seed, hasSpun, startSpin]);

  // Reset hasSpun when seed changes
  useEffect(() => {
    setHasSpun(false);
    controls.set({ rotate: 0 });
  }, [seed, controls]);

  // Don't render overlay if not spinning and no seed
  if (!isSpinning && seed === null) {
    return null;
  }

  // Wheel diameter
  const wheelDiameter = wheelRadius * 2;

  return (
    <div
      data-testid="wheel-overlay"
      className={cn(
        // Full-screen overlay (AC1)
        "fixed inset-0 z-50",
        // Pure black background for projection mode (AC5)
        "bg-black",
        // Center content
        "flex items-center justify-center",
        // Smooth fade in
        "animate-in fade-in duration-300",
        className
      )}
    >
      {/* Wheel container with glow effect */}
      <div
        className="relative"
        style={{ width: wheelDiameter, height: wheelDiameter }}
      >
        {/* Gold pointer at top */}
        <WheelPointer />

        {/* Animated wheel */}
        <motion.div
          data-testid="raffle-wheel"
          role="img"
          aria-label={`Raffle wheel with ${memoizedParticipants.length} participants spinning`}
          className={cn(
            "relative rounded-full",
            // Glow effect for projection mode (AC5)
            "shadow-[0_0_60px_rgba(84,197,248,0.5)]"
          )}
          style={{
            width: wheelDiameter,
            height: wheelDiameter,
            // GPU acceleration (AC7)
            willChange: "transform",
            transform: "translateZ(0)",
          }}
          initial={{ rotate: 0 }}
          animate={controls}
        >
          {/* SVG wheel with segments */}
          <svg
            width={wheelDiameter}
            height={wheelDiameter}
            viewBox={`0 0 ${wheelDiameter} ${wheelDiameter}`}
            className="rounded-full overflow-hidden"
          >
            {/* Outer ring / border */}
            <circle
              cx={wheelRadius}
              cy={wheelRadius}
              r={wheelRadius - 2}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="4"
            />

            {/* Wheel segments with participant names */}
            {memoizedParticipants.map((participant, index) => (
              <WheelSegment
                key={participant.id}
                name={participant.name}
                index={index}
                totalSegments={memoizedParticipants.length}
                radius={wheelRadius}
              />
            ))}

            {/* Center circle */}
            <circle
              cx={wheelRadius}
              cy={wheelRadius}
              r={wheelRadius * 0.15}
              fill="#1E3A5F"
              stroke="#FFFFFF"
              strokeWidth="3"
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
