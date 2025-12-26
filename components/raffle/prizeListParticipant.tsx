"use client";

/**
 * PrizeListParticipant Component
 *
 * Displays prizes for participants in a raffle with limited information.
 * Shows prize names, descriptions, and award status without revealing winner details.
 *
 * Features:
 * - Prizes ordered by draw order (sort_order)
 * - "Awarded" badge for prizes that have been given away
 * - "Next" badge highlighting the next prize to be drawn
 * - Mobile-optimized layout with Cards
 *
 * Used for Story 5-3: Participant Prize & Status View (FR33).
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Gift, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParticipantPrize } from "@/lib/schemas/prize";

interface PrizeListParticipantProps {
  prizes: ParticipantPrize[];
  className?: string;
}

export function PrizeListParticipant({
  prizes,
  className,
}: PrizeListParticipantProps) {
  if (prizes.length === 0) {
    return (
      <div
        className="text-center py-4 text-muted-foreground text-sm"
        data-testid="prize-list-empty"
      >
        No prizes added to this raffle yet.
      </div>
    );
  }

  // Find first non-awarded prize (next to be drawn)
  const nextPrizeIndex = prizes.findIndex((p) => !p.is_awarded);

  return (
    <div className={cn("space-y-2", className)} data-testid="prize-list-participant">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
        <h3 className="font-semibold text-sm">Prizes</h3>
      </div>
      {prizes.map((prize, index) => (
        <Card
          key={prize.id}
          data-testid={`prize-card-${prize.id}`}
          className={cn(
            "transition-colors",
            prize.is_awarded && "opacity-60",
            index === nextPrizeIndex && "ring-2 ring-primary ring-offset-2"
          )}
        >
          <CardContent className="py-3 px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Gift
                  className={cn(
                    "h-5 w-5 shrink-0 mt-0.5",
                    prize.is_awarded ? "text-muted-foreground" : "text-primary"
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-medium text-sm truncate",
                      prize.is_awarded && "line-through text-muted-foreground"
                    )}
                    data-testid={`prize-name-${prize.id}`}
                  >
                    {prize.name}
                  </p>
                  {prize.description && (
                    <p
                      className="text-xs text-muted-foreground mt-0.5 line-clamp-2"
                      data-testid={`prize-description-${prize.id}`}
                    >
                      {prize.description}
                    </p>
                  )}
                </div>
              </div>
              {prize.is_awarded ? (
                <Badge
                  variant="secondary"
                  className="shrink-0"
                  data-testid={`prize-badge-awarded-${prize.id}`}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                  Awarded
                </Badge>
              ) : index === nextPrizeIndex ? (
                <Badge
                  variant="default"
                  className="shrink-0"
                  data-testid={`prize-badge-next-${prize.id}`}
                >
                  Next
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
