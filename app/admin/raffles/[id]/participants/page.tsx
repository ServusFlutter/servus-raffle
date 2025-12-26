import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { getRaffle } from "@/lib/actions/raffles";
import {
  getParticipantsWithDetails,
  getRaffleStatistics,
} from "@/lib/actions/participants";
import { ParticipantsRealtime } from "./participantsRealtime";

interface ParticipantsPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Participants page for a raffle.
 *
 * Displays:
 * - Statistics summary (participant count, total tickets)
 * - List of all participants with names, avatars, ticket counts
 * - Real-time updates when new participants join (AC #5)
 */
export default async function ParticipantsPage({
  params,
}: ParticipantsPageProps) {
  const { id } = await params;

  // Fetch all data in parallel
  const [raffleResult, participantsResult, statsResult] = await Promise.all([
    getRaffle(id),
    getParticipantsWithDetails(id),
    getRaffleStatistics(id),
  ]);

  // Handle raffle not found
  if (raffleResult.error || !raffleResult.data) {
    notFound();
  }

  const raffle = raffleResult.data;

  return (
    <div className="container mx-auto max-w-4xl">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/admin/raffles/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Raffle
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Users className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
          <p className="text-muted-foreground">{raffle.name}</p>
        </div>
      </div>

      {/* Real-time wrapper for statistics and list */}
      <ParticipantsRealtime
        raffleId={id}
        initialStats={statsResult.data}
        initialParticipants={participantsResult.data || []}
      />
    </div>
  );
}
