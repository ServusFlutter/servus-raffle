"use client";

import { motion } from "framer-motion";
import { Users, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ParticipantCounterProps {
  participantCount: number;
  totalTickets: number;
}

/**
 * Displays animated statistics counters for participants and tickets.
 *
 * Features:
 * - Large text suitable for projection (AC #4)
 * - Framer Motion animations when values change
 * - Two-column layout on medium+ screens
 */
export function ParticipantCounter({
  participantCount,
  totalTickets,
}: ParticipantCounterProps) {
  return (
    <div
      className="grid gap-4 md:grid-cols-2 mb-6"
      data-testid="participant-counter"
    >
      <Card data-testid="participants-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Participants</p>
              <motion.p
                key={participantCount}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold"
              >
                {participantCount}
              </motion.p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card data-testid="tickets-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Ticket className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <motion.p
                key={totalTickets}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold"
              >
                {totalTickets}
              </motion.p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
