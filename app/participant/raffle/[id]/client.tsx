"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TicketCircle, getTicketMessage } from "@/components/raffle/ticketCircle";
import { StatusBar } from "@/components/raffle/statusBar";
import { PrizeListParticipant } from "@/components/raffle/prizeListParticipant";
import {
  RaffleStatusIndicator,
  type RaffleStatus,
} from "@/components/raffle/raffleStatusIndicator";
import {
  subscribeToRaffleStatusChanges,
  subscribeToPrizeChanges,
} from "@/lib/supabase/realtime";
import type { ParticipantPrize } from "@/lib/schemas/prize";

// Type guard to validate raffle status
function isValidRaffleStatus(status: string): status is RaffleStatus {
  return (
    status === "active" ||
    status === "drawing" ||
    status === "completed" ||
    status === "draft"
  );
}

interface ParticipantRaffleClientProps {
  raffleId: string;
  raffleName: string;
  raffleStatus: string;
  ticketCount: number;
  perRaffleTicketCount: number;
  joinedAt: string;
  showJoinedToast?: string;
  /** Prizes for participant view (Story 5-3) */
  prizes: ParticipantPrize[];
}

/**
 * Client component for participant raffle dashboard
 * Handles toast notifications and client-side interactions
 */
export function ParticipantRaffleClient({
  raffleId,
  raffleName,
  raffleStatus,
  ticketCount,
  perRaffleTicketCount,
  joinedAt,
  showJoinedToast,
  prizes,
}: ParticipantRaffleClientProps) {
  // Calculate if this is a multi-event user (accumulated tickets differ from per-raffle)
  const isMultiEventUser = ticketCount > perRaffleTicketCount;
  const router = useRouter();

  // State for screen reader announcements (AC #5)
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] =
    useState<string>("");

  // Show toast on first join (AC #1, #3, #4)
  useEffect(() => {
    if (showJoinedToast === "true") {
      // Set screen reader announcement (AC #5)
      setScreenReaderAnnouncement(
        `You now have ${ticketCount} ticket${ticketCount !== 1 ? "s" : ""} for the raffle`
      );
      // Toast with 3-second auto-dismiss (AC #1)
      toast.success("You're in! Good luck!", {
        description: "Your ticket has been registered for this raffle.",
        duration: 3000,
      });
      // Remove the query param after showing toast
      router.replace(`/participant/raffle/${raffleId}`, { scroll: false });
    } else if (showJoinedToast === "false") {
      toast.info("You're already registered!", {
        description: "You already have a ticket for this raffle.",
        duration: 3000,
      });
      router.replace(`/participant/raffle/${raffleId}`, { scroll: false });
    }
  }, [showJoinedToast, raffleId, router, ticketCount]);

  // Real-time subscriptions for raffle status and prize changes (Story 5-3 AC #4)
  useEffect(() => {
    // Subscribe to raffle status changes
    const statusChannel = subscribeToRaffleStatusChanges(raffleId, () => {
      router.refresh(); // Re-fetch server data
    });

    // Subscribe to prize award changes
    const prizeChannel = subscribeToPrizeChanges(raffleId, () => {
      router.refresh(); // Re-fetch server data
    });

    return () => {
      statusChannel.unsubscribe();
      prizeChannel.unsubscribe();
    };
  }, [raffleId, router]);

  // Validate and get raffle status for components
  const validatedStatus: RaffleStatus = isValidRaffleStatus(raffleStatus)
    ? raffleStatus
    : "draft";

  const getStatusBadge = () => {
    switch (raffleStatus) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "drawing":
        return <Badge variant="secondary">Drawing in progress</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{raffleStatus}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pb-20">
      {/*
        Screen reader announcement for join events (AC #5)
        This is separate from TicketCircle's aria-label because:
        - This announces the JOIN action: "You NOW have X tickets" (event-based)
        - TicketCircle announces current state: "You have X tickets" (status-based)
        - The JOIN announcement only triggers once on join, not on subsequent visits
      */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="screen-reader-announcement"
      >
        {screenReaderAnnouncement}
      </div>
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">{raffleName}</CardTitle>
          <div className="mt-2">{getStatusBadge()}</div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ticket Count Display - Hero TicketCircle Component (AC #1, #6) */}
          <div className="flex flex-col items-center justify-center py-4">
            <TicketCircle count={ticketCount} size="default" />
            {/* Contextual Messaging (Story 3.3 AC #1, #3) - reflects accumulated count */}
            <p className="text-sm text-muted-foreground mt-4 font-medium">
              {getTicketMessage(ticketCount)}
            </p>
            {/* Show accumulated ticket explanation for multi-event users (Story 3.3 AC #3) */}
            {isMultiEventUser && (
              <p className="text-xs text-muted-foreground mt-1">
                Tickets accumulated across events
              </p>
            )}
          </div>

          {/* Raffle Status Indicator (Story 5-3 AC #3, #6) */}
          <RaffleStatusIndicator status={validatedStatus} />

          {/* Prize List (Story 5-3 AC #1, #2, #5) */}
          {prizes.length > 0 && (
            <PrizeListParticipant prizes={prizes} className="mt-4" />
          )}

          {/* Join Date */}
          <p className="text-center text-xs text-muted-foreground">
            Joined{" "}
            {new Date(joinedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </CardContent>
      </Card>

      {/* StatusBar - fixed at bottom, only visible for active raffles (AC #2, #3) */}
      {validatedStatus !== "draft" && (
        <StatusBar status={validatedStatus} />
      )}
    </div>
  );
}
