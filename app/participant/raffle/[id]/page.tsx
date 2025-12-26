import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ParticipantRaffleClient } from "./client";
import { getAccumulatedTickets } from "@/lib/actions/tickets";
import { getPrizesForParticipant } from "@/lib/actions/prizes";

interface ParticipantRafflePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Participant dashboard for a specific raffle (Server Component)
 *
 * Shows:
 * - Raffle name and status
 * - Ticket count
 * - "You're in!" confirmation toast on first join (via client component)
 * - Waiting for draw status
 */
export default async function ParticipantRafflePage({
  params,
  searchParams,
}: ParticipantRafflePageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const joined = resolvedSearchParams?.joined as string | undefined;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/participant/raffle/${id}`)}`);
  }

  // Get participation record
  const { data: participation, error: participationError } = await supabase
    .from("participants")
    .select("*")
    .eq("raffle_id", id)
    .eq("user_id", user.id)
    .single();

  if (participationError || !participation) {
    // User hasn't joined this raffle
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You haven&apos;t joined this raffle yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get raffle info
  const { data: raffle } = await supabase
    .from("raffles")
    .select("id, name, status")
    .eq("id", id)
    .single();

  // Get accumulated ticket count across all events (Story 3.3)
  const accumulatedResult = await getAccumulatedTickets();
  const accumulatedTickets = accumulatedResult.data ?? participation.ticket_count;

  // Fetch prizes for participant view (Story 5-3)
  const prizesResult = await getPrizesForParticipant(id);

  return (
    <ParticipantRaffleClient
      raffleId={id}
      raffleName={raffle?.name || "Raffle"}
      raffleStatus={raffle?.status || "active"}
      ticketCount={accumulatedTickets}
      perRaffleTicketCount={participation.ticket_count}
      joinedAt={participation.joined_at}
      showJoinedToast={joined}
      prizes={prizesResult.data || []}
    />
  );
}
