"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { RaffleHistoryItem } from "@/lib/schemas/history";
import type { RaffleStatusType } from "@/lib/schemas/raffle";
import { formatDate, getStatusVariant } from "@/lib/utils/raffle";

interface RaffleHistoryListProps {
  raffles: RaffleHistoryItem[];
  onRaffleClick: (raffleId: string) => void;
}

/**
 * Displays a list of raffle history items.
 *
 * Features:
 * - Shows raffle name, date, participant count, and prizes awarded
 * - Status badge differentiating completed vs active/draft
 * - Each item clickable to view details
 * - Empty state message when no raffles exist
 */
export function RaffleHistoryList({
  raffles,
  onRaffleClick,
}: RaffleHistoryListProps) {
  if (raffles.length === 0) {
    return (
      <div
        className="text-center py-8 text-muted-foreground"
        data-testid="empty-state"
      >
        No raffle history yet. Create and run your first raffle!
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="raffle-history-list">
      {raffles.map((raffle) => (
        <Card
          key={raffle.id}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onRaffleClick(raffle.id)}
          data-testid={`raffle-card-${raffle.id}`}
        >
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{raffle.name}</CardTitle>
                <Badge
                  variant={getStatusVariant(raffle.status as RaffleStatusType)}
                >
                  {getStatusLabel(raffle.status)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(raffle.created_at)}
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span data-testid="participant-count">
                {raffle.participant_count} participant
                {raffle.participant_count !== 1 ? "s" : ""}
              </span>
              <span data-testid="prize-count">
                {raffle.prizes_awarded} of {raffle.total_prizes} prize
                {raffle.total_prizes !== 1 ? "s" : ""} awarded
              </span>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "active":
      return "Active";
    case "drawing":
      return "Drawing";
    case "draft":
    default:
      return "Draft";
  }
}
