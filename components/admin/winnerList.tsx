"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WinnerDetail } from "@/lib/schemas/history";

interface WinnerListProps {
  winners: WinnerDetail[];
}

/**
 * Displays a table of raffle winners with their details.
 *
 * Features:
 * - Shows winner name, avatar, prize won, ticket count at win, and timestamp
 * - Responsive design: hides Won At column on mobile
 * - Empty state message when no winners
 */
export function WinnerList({ winners }: WinnerListProps) {
  if (winners.length === 0) {
    return (
      <div
        className="text-center py-8 text-muted-foreground"
        data-testid="empty-state"
      >
        No winners yet. This raffle is still in progress.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="winner-list">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Winner</TableHead>
            <TableHead>Prize</TableHead>
            <TableHead className="text-right">Tickets</TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              Won At
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {winners.map((winner, index) => (
            <TableRow key={winner.id} data-testid={`winner-row-${index}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={winner.user_avatar_url || undefined}
                      alt={winner.user_name || "Anonymous"}
                    />
                    <AvatarFallback>
                      {(winner.user_name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {winner.user_name || "Anonymous"}
                  </span>
                </div>
              </TableCell>
              <TableCell data-testid={`prize-name-${index}`}>
                {winner.prize_name}
              </TableCell>
              <TableCell
                className="text-right font-mono"
                data-testid={`tickets-at-win-${index}`}
              >
                {winner.tickets_at_win}
              </TableCell>
              <TableCell
                className="text-right hidden sm:table-cell text-muted-foreground"
                data-testid={`won-at-${index}`}
              >
                {formatWonAt(winner.won_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Formats a timestamp for display in the winner list.
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date string (e.g., "Dec 26, 2:30 PM")
 */
function formatWonAt(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
