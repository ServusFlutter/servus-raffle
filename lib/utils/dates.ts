/**
 * Date and time utility functions for QR code expiration handling
 *
 * Provides helpers for checking expiration status and formatting countdown displays
 */

/**
 * Check if a timestamp is expired
 *
 * @param expiresAt - ISO timestamp string or null
 * @returns true if expired or null, false if still valid
 *
 * @example
 * isExpired("2024-12-25T12:00:00Z") // true if current time is past this
 * isExpired(null) // true (no expiration set means expired/invalid)
 */
export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return true;
  }

  const expirationDate = new Date(expiresAt);
  return expirationDate.getTime() <= Date.now();
}

/**
 * Calculate time remaining until expiration
 *
 * @param expiresAt - ISO timestamp string
 * @returns Object with remaining time units, all will be 0 if expired
 */
export function getTimeRemaining(expiresAt: string): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
} {
  const expirationDate = new Date(expiresAt);
  const now = Date.now();
  const diffMs = expirationDate.getTime() - now;

  if (diffMs <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
    isExpired: false,
  };
}

/**
 * Format time remaining as a human-readable countdown string
 *
 * @param expiresAt - ISO timestamp string
 * @returns Formatted countdown string (e.g., "2h 30m", "45m 30s", "Expired")
 *
 * @example
 * formatCountdown("2024-12-25T15:30:00Z") // "2h 30m" (if ~2.5 hours remain)
 * formatCountdown("2024-12-25T10:00:00Z") // "Expired" (if past)
 */
export function formatCountdown(expiresAt: string): string {
  const remaining = getTimeRemaining(expiresAt);

  if (remaining.isExpired) {
    return "Expired";
  }

  const parts: string[] = [];

  if (remaining.hours > 0) {
    parts.push(`${remaining.hours}h`);
  }

  if (remaining.minutes > 0 || remaining.hours > 0) {
    parts.push(`${remaining.minutes}m`);
  }

  // Only show seconds if less than 5 minutes remaining
  if (remaining.hours === 0 && remaining.minutes < 5) {
    parts.push(`${remaining.seconds}s`);
  }

  return parts.join(" ");
}

/**
 * Format an expiration timestamp for display
 *
 * @param expiresAt - ISO timestamp string
 * @returns Human-readable expiration time (e.g., "3:30 PM")
 */
export function formatExpirationTime(expiresAt: string): string {
  const date = new Date(expiresAt);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Duration options for QR code expiration
 * Based on typical meetup event durations
 */
export const DURATION_OPTIONS = [
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "3 hours", minutes: 180 },
  { label: "4 hours", minutes: 240 },
] as const;

/**
 * Default duration for QR code expiration (3 hours)
 * Most meetup events are 2-3 hours, so 3 hours is a safe default
 */
export const DEFAULT_DURATION_MINUTES = 180;
