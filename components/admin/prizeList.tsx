"use client";

import { Pencil, Trash2, Trophy, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Prize } from "@/lib/schemas/prize";
import type { PrizeWithWinner } from "@/lib/actions/prizes";

// Re-export the type for convenience
export type { PrizeWithWinner };

interface PrizeListProps {
  /** List of prizes to display */
  prizes: PrizeWithWinner[];
  /** Callback when edit button is clicked */
  onEdit: (prize: PrizeWithWinner) => void;
  /** Callback when delete button is clicked */
  onDelete: (prize: PrizeWithWinner) => void;
  /** Callback when move up button is clicked */
  onMoveUp?: (prize: PrizeWithWinner) => void;
  /** Callback when move down button is clicked */
  onMoveDown?: (prize: PrizeWithWinner) => void;
  /** Whether any action is in progress */
  isLoading?: boolean;
  /** Whether to highlight the next prize to be drawn */
  highlightNextToDraw?: boolean;
}

/**
 * Displays a list of prizes for a raffle
 * Shows prize name, description, award status, and action buttons
 *
 * Visual states:
 * - Awarded prizes: reduced opacity (grayed out)
 * - Next prize to draw: highlighted with blue border (when highlightNextToDraw=true)
 * - Winner name displayed for awarded prizes
 */
export function PrizeList({
  prizes,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isLoading = false,
  highlightNextToDraw = false,
}: PrizeListProps) {
  // Find the index of the first non-awarded prize (next to be drawn)
  const nextToDrawIndex = prizes.findIndex((p) => !p.awarded_to);

  if (prizes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-muted-foreground">
            No prizes yet
          </CardTitle>
          <CardDescription className="text-center">
            Add prizes to this raffle using the button above.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {prizes.map((prize, index) => {
        const isAwarded = !!prize.awarded_to;
        const isNextToDraw = highlightNextToDraw && index === nextToDrawIndex;

        return (
        <Card
          key={prize.id}
          className={cn(
            // Awarded prizes: reduced opacity (grayed out)
            isAwarded && "opacity-60",
            // Next prize to draw: highlighted border
            isNextToDraw && "border-2 border-blue-500 shadow-md"
          )}
          data-testid={isNextToDraw ? "next-to-draw-prize" : undefined}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground font-mono">
                    #{index + 1}
                  </span>
                  <CardTitle className="text-lg truncate">{prize.name}</CardTitle>
                  <PrizeStatusBadge prize={prize} />
                </div>
                {prize.description && (
                  <CardDescription className="mt-1 line-clamp-2">
                    {prize.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onMoveUp && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMoveUp(prize)}
                    disabled={isLoading || index === 0 || !!prize.awarded_to}
                    aria-label={`Move ${prize.name} up`}
                    title={
                      prize.awarded_to
                        ? "Cannot move awarded prize"
                        : index === 0
                          ? "Already first"
                          : `Move ${prize.name} up`
                    }
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                )}
                {onMoveDown && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMoveDown(prize)}
                    disabled={isLoading || index === prizes.length - 1 || !!prize.awarded_to}
                    aria-label={`Move ${prize.name} down`}
                    title={
                      prize.awarded_to
                        ? "Cannot move awarded prize"
                        : index === prizes.length - 1
                          ? "Already last"
                          : `Move ${prize.name} down`
                    }
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(prize)}
                  disabled={isLoading || !!prize.awarded_to}
                  aria-label={`Edit ${prize.name}`}
                  title={
                    prize.awarded_to
                      ? "Cannot edit awarded prize"
                      : `Edit ${prize.name}`
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(prize)}
                  disabled={isLoading || !!prize.awarded_to}
                  aria-label={`Delete ${prize.name}`}
                  title={
                    prize.awarded_to
                      ? "Cannot delete awarded prize"
                      : `Delete ${prize.name}`
                  }
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {prize.awarded_to && (
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span>
                  Awarded to{" "}
                  <span className="font-medium" data-testid="winner-name">
                    {prize.winner_name || "Unknown"}
                  </span>
                </span>
                {prize.awarded_at && (
                  <span className="text-xs" data-testid="award-timestamp">
                    on{" "}
                    {new Date(prize.awarded_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </CardContent>
          )}
        </Card>
        );
      })}
    </div>
  );
}

/**
 * Badge showing the award status of a prize
 */
function PrizeStatusBadge({ prize }: { prize: PrizeWithWinner }) {
  if (prize.awarded_to) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        <Trophy className="mr-1 h-3 w-3" />
        Awarded
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Clock className="mr-1 h-3 w-3" />
      Pending
    </Badge>
  );
}
