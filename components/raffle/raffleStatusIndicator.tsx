"use client";

/**
 * RaffleStatusIndicator Component
 *
 * Shows the current raffle status to participants with visual indicators.
 * Complements the StatusBar component which shows "Locked in" status.
 * This component shows the raffle-level status (Active/Drawing/Completed).
 *
 * Status indicators:
 * - Active: Green pulsing dot + "Raffle Open - Waiting for draw to begin"
 * - Drawing: Animated spinner + "Draw in Progress! - The wheel is spinning!"
 * - Completed: Checkmark + "Raffle Complete - All prizes have been awarded"
 * - Draft: Clock + "Not Started - Raffle is being set up"
 *
 * Used for Story 5-3: Participant Prize & Status View (FR34).
 */

import { cn } from "@/lib/utils";
import { Clock, Loader2, CheckCircle2 } from "lucide-react";

export type RaffleStatus = "active" | "drawing" | "completed" | "draft";

interface RaffleStatusIndicatorProps {
  status: RaffleStatus;
  className?: string;
}

const statusConfig = {
  active: {
    icon: Clock,
    label: "Raffle Open",
    sublabel: "Waiting for draw to begin",
    iconClass: "text-green-500",
    dotClass: "bg-green-500 animate-pulse motion-reduce:animate-none",
    showDot: true,
  },
  drawing: {
    icon: Loader2,
    label: "Draw in Progress",
    sublabel: "The wheel is spinning!",
    iconClass: "text-amber-500 animate-spin motion-reduce:animate-none",
    dotClass: "bg-amber-500",
    showDot: false,
  },
  completed: {
    icon: CheckCircle2,
    label: "Raffle Complete",
    sublabel: "All prizes have been awarded",
    iconClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
    showDot: false,
  },
  draft: {
    icon: Clock,
    label: "Not Started",
    sublabel: "Raffle is being set up",
    iconClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
    showDot: false,
  },
};

export function RaffleStatusIndicator({
  status,
  className,
}: RaffleStatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig.draft;
  const { icon: Icon, label, sublabel, iconClass, dotClass, showDot } = config;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
        className
      )}
      data-testid="raffle-status-indicator"
      role="status"
      aria-label={`${label}: ${sublabel}`}
    >
      <div className="relative">
        <Icon
          className={cn("h-5 w-5", iconClass)}
          aria-hidden="true"
          data-testid="status-icon"
        />
        {showDot && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
              dotClass
            )}
            data-testid="status-dot"
            aria-hidden="true"
          />
        )}
      </div>
      <div>
        <p className="font-medium text-sm" data-testid="status-label">
          {label}
        </p>
        <p
          className="text-xs text-muted-foreground"
          data-testid="status-sublabel"
        >
          {sublabel}
        </p>
      </div>
    </div>
  );
}
