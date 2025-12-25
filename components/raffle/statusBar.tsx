import { cn } from "@/lib/utils";

export interface StatusBarProps {
  status: "active" | "drawing" | "completed";
  className?: string;
}

/**
 * StatusBar - Fixed bottom bar showing registration confirmation status
 *
 * Features:
 * - Displays "Locked in - waiting for draw" for active raffles
 * - Pulsing green dot with 2-second animation cycle
 * - Semi-transparent backdrop with blur effect
 * - Respects prefers-reduced-motion for accessibility
 * - Dark mode compatible
 *
 * @param status - Current raffle status
 * @param className - Additional CSS classes
 */
export function StatusBar({ status, className }: StatusBarProps) {
  // Only show "Locked in" state for active raffles
  if (status !== "active") return null;

  return (
    <div
      data-testid="status-bar"
      className={cn(
        // Position fixed at bottom
        "fixed bottom-0 left-0 right-0",
        // Padding
        "p-4",
        // Semi-transparent background with backdrop blur
        "bg-background/95 backdrop-blur-sm",
        // Border top for separator
        "border-t",
        // Flex layout to center content
        "flex items-center justify-center gap-3",
        // Custom className
        className
      )}
    >
      {/* Pulsing green dot */}
      <span
        data-testid="status-dot"
        className={cn(
          "w-3 h-3 rounded-full bg-green-500",
          "animate-pulse motion-reduce:animate-none"
        )}
        aria-hidden="true"
      />
      {/* Status text */}
      <span className="text-sm font-medium text-muted-foreground">
        Locked in - waiting for draw
      </span>
    </div>
  );
}
