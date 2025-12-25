"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ParticipantRaffleClientProps {
  raffleId: string;
  raffleName: string;
  raffleStatus: string;
  ticketCount: number;
  joinedAt: string;
  showJoinedToast?: string;
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
  joinedAt,
  showJoinedToast,
}: ParticipantRaffleClientProps) {
  const router = useRouter();

  // Show toast on first join (AC #3, #4)
  useEffect(() => {
    if (showJoinedToast === "true") {
      toast.success("You're in! Good luck!", {
        description: "Your ticket has been registered for this raffle.",
        duration: 5000,
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
  }, [showJoinedToast, raffleId, router]);

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">{raffleName}</CardTitle>
          <div className="mt-2">{getStatusBadge()}</div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ticket Count Display */}
          <div className="flex flex-col items-center justify-center py-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="h-6 w-6 text-primary" />
              <span className="text-lg font-medium">Your Tickets</span>
            </div>
            <div className="text-5xl font-bold text-primary">{ticketCount}</div>
            <p className="text-sm text-muted-foreground mt-2">
              ticket{ticketCount !== 1 ? "s" : ""} in this raffle
            </p>
          </div>

          {/* Status */}
          {raffleStatus === "active" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Waiting for draw...</span>
            </div>
          )}

          {raffleStatus === "drawing" && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Clock className="h-4 w-4 animate-pulse" />
              <span className="font-medium">Draw in progress!</span>
            </div>
          )}

          {raffleStatus === "completed" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>Raffle has ended</span>
            </div>
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
    </div>
  );
}
