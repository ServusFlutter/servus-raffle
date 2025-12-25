/**
 * Shared raffle utility functions
 *
 * Used by admin pages to ensure consistent formatting and display logic
 */

import type { RaffleStatusType } from "@/lib/schemas/raffle";

/**
 * Format date string for display
 *
 * @param dateString - ISO date string
 * @param options - "short" for compact format, "long" for detailed format with time
 * @returns Formatted date string
 *
 * @example
 * formatDate("2024-12-25T10:00:00Z", "short") // "Dec 25, 2024"
 * formatDate("2024-12-25T10:00:00Z", "long")  // "December 25, 2024, 10:00 AM"
 */
export function formatDate(
  dateString: string,
  format: "short" | "long" = "short"
): string {
  const options: Intl.DateTimeFormatOptions =
    format === "long"
      ? {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : {
          year: "numeric",
          month: "short",
          day: "numeric",
        };

  return new Date(dateString).toLocaleDateString("en-US", options);
}

/**
 * Get badge variant based on raffle status
 *
 * @param status - Raffle status
 * @returns Badge variant for shadcn/ui Badge component
 */
export function getStatusVariant(
  status: RaffleStatusType
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "drawing":
      return "destructive";
    case "completed":
      return "secondary";
    case "draft":
    default:
      return "outline";
  }
}

/**
 * Get status description for display
 *
 * @param status - Raffle status
 * @returns Human-readable description of the status
 */
export function getStatusDescription(status: RaffleStatusType): string {
  switch (status) {
    case "draft":
      return "This raffle is still being set up. Add prizes and activate when ready.";
    case "active":
      return "Participants can join this raffle via QR code.";
    case "drawing":
      return "Drawing in progress. The wheel is spinning!";
    case "completed":
      return "All prizes have been drawn.";
    default:
      return "";
  }
}
