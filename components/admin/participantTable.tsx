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
import type { ParticipantWithDetails } from "@/lib/actions/participants";

interface ParticipantTableProps {
  participants: ParticipantWithDetails[];
}

/**
 * Displays a table of raffle participants with their details.
 *
 * Features:
 * - Shows participant name, avatar, ticket count, and join timestamp
 * - Responsive design: hides Joined column on mobile (AC #6)
 * - Empty state message when no participants
 */
export function ParticipantTable({ participants }: ParticipantTableProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No participants have joined yet. Share the QR code to get started!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="participant-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead className="text-right">Tickets</TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              Joined
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant, index) => (
            <TableRow key={participant.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={participant.user_avatar_url || undefined}
                      alt={participant.user_name || "Anonymous"}
                    />
                    <AvatarFallback>
                      {(participant.user_name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {participant.user_name || "Anonymous"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {participant.ticket_count}
              </TableCell>
              <TableCell
                className="text-right hidden sm:table-cell text-muted-foreground"
                data-testid={`joined-at-${index}`}
              >
                {formatJoinedAt(participant.joined_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Formats a timestamp for display in the participant table.
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date string (e.g., "Dec 26, 2:30 PM")
 */
function formatJoinedAt(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
