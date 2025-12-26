"use client";

import { Trophy, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Prize } from "@/lib/schemas/prize";

interface PrizeStatusSummaryProps {
  /** List of prizes to calculate status from */
  prizes: Prize[];
}

/**
 * Displays a summary of prize award status for a raffle.
 *
 * Shows "X of Y awarded" counter with progress bar, or "All prizes awarded"
 * when complete. Returns null if there are no prizes.
 */
export function PrizeStatusSummary({ prizes }: PrizeStatusSummaryProps) {
  const awardedCount = prizes.filter((p) => p.awarded_to).length;
  const totalCount = prizes.length;
  const allAwarded = awardedCount === totalCount && totalCount > 0;
  const progressPercent = totalCount > 0 ? (awardedCount / totalCount) * 100 : 0;

  if (totalCount === 0) {
    return null;
  }

  return (
    <Card className="mb-6" data-testid="prize-status-summary">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {allAwarded ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                <span className="font-semibold text-green-600" data-testid="all-awarded-message">
                  All prizes awarded
                </span>
              </>
            ) : (
              <>
                <Trophy className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium" data-testid="awarded-count">
                  {awardedCount} of {totalCount} awarded
                </span>
              </>
            )}
          </div>
          {!allAwarded && (
            <span className="text-sm text-muted-foreground" data-testid="remaining-count">
              {totalCount - awardedCount} remaining
            </span>
          )}
        </div>
        <Progress
          value={progressPercent}
          className="h-2"
          aria-label={`Prize progress: ${awardedCount} of ${totalCount} awarded`}
        />
      </CardContent>
    </Card>
  );
}
