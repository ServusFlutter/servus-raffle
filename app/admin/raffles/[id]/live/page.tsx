import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/utils/admin";
import { getRaffle } from "@/lib/actions/raffles";
import { getPrizesWithWinners, type PrizeWithWinner } from "@/lib/actions/prizes";
import { getRaffleStatistics } from "@/lib/actions/participants";
import { LiveDrawClient } from "./client";

interface LiveDrawPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Live Draw Page - Server Component
 *
 * This page provides a projection-optimized interface for conducting
 * live raffle draws at events. It handles:
 * - Admin authorization
 * - Raffle and prize data fetching
 * - Passing data to the interactive client component
 *
 * Story 6.1: Admin Live Draw Mode & Projection UI
 */
export default async function LiveDrawPage({ params }: LiveDrawPageProps) {
  const { id } = await params;

  // 1. Validate admin authorization
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email || !isAdmin(user.email)) {
    redirect("/login");
  }

  // 2. Fetch raffle data
  const [raffleResult, prizesResult, statsResult] = await Promise.all([
    getRaffle(id),
    getPrizesWithWinners(id),
    getRaffleStatistics(id),
  ]);

  const { data: raffle, error: raffleError } = raffleResult;
  const { data: prizes, error: prizesError } = prizesResult;
  const { data: stats } = statsResult;

  if (raffleError || !raffle) {
    notFound();
  }

  if (prizesError) {
    console.error("Error fetching prizes:", prizesError);
  }

  // 3. Calculate prize progress
  const allPrizes: PrizeWithWinner[] = prizes || [];
  const awardedCount = allPrizes.filter((p) => p.awarded_to !== null).length;
  const totalPrizes = allPrizes.length;

  // Find the current prize (first unawarded prize in sort order)
  const currentPrize = allPrizes.find((p) => p.awarded_to === null) || null;
  const currentPrizeIndex = currentPrize
    ? allPrizes.findIndex((p) => p.id === currentPrize.id)
    : -1;

  return (
    <LiveDrawClient
      raffleId={raffle.id}
      raffleName={raffle.name}
      raffleStatus={raffle.status}
      currentPrize={currentPrize}
      currentPrizeIndex={currentPrizeIndex}
      totalPrizes={totalPrizes}
      awardedCount={awardedCount}
      participantCount={stats?.participantCount ?? 0}
      totalTickets={stats?.totalTickets ?? 0}
      prizes={allPrizes}
    />
  );
}
