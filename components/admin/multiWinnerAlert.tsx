"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info } from "lucide-react";
import type { MultiWinnerStat } from "@/lib/schemas/history";

interface MultiWinnerAlertProps {
  multiWinners: MultiWinnerStat[];
}

/**
 * Displays an informational alert about users who have won multiple times.
 *
 * Features:
 * - Shows users with 2+ wins across all raffles
 * - Displays user name, avatar, and win count
 * - Styled as informational (not error) - this is expected for fairness tracking
 * - Empty if no multi-winners (returns null)
 */
export function MultiWinnerAlert({ multiWinners }: MultiWinnerAlertProps) {
  if (multiWinners.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-6" data-testid="multi-winner-alert">
      <Info className="h-4 w-4" />
      <AlertTitle>Multiple Win Detection</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          The following users have won multiple times across events. This is
          tracked for fairness verification.
        </p>
        <div className="space-y-2">
          {multiWinners.map((winner) => (
            <div
              key={winner.user_id}
              className="flex items-center gap-3"
              data-testid={`multi-winner-${winner.user_id}`}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={winner.user_avatar_url || undefined}
                  alt={winner.user_name || "Anonymous"}
                />
                <AvatarFallback className="text-xs">
                  {(winner.user_name || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">
                {winner.user_name || "Anonymous"}
              </span>
              <span className="text-muted-foreground">
                {winner.win_count} wins
              </span>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
