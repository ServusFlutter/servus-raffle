"use client";

import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RaffleHistoryList } from "@/components/admin/raffleHistoryList";
import { MultiWinnerAlert } from "@/components/admin/multiWinnerAlert";
import { WinnerList } from "@/components/admin/winnerList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getRaffleHistory,
  getRaffleWinners,
  getMultiWinnerStats,
} from "@/lib/actions/history";
import type {
  RaffleHistoryItem,
  WinnerDetail,
  MultiWinnerStat,
} from "@/lib/schemas/history";
import { formatDate } from "@/lib/utils/raffle";

/**
 * Raffle History Page
 *
 * Displays:
 * - List of all past/completed raffles sorted by date (newest first)
 * - Each raffle shows: name, date, participant count, prizes awarded
 * - Multi-winner stats alert for fairness verification
 * - Detail modal with complete winner list for each raffle
 */
export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raffles, setRaffles] = useState<RaffleHistoryItem[]>([]);
  const [multiWinners, setMultiWinners] = useState<MultiWinnerStat[]>([]);

  // Detail modal state
  const [selectedRaffle, setSelectedRaffle] = useState<RaffleHistoryItem | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [winners, setWinners] = useState<WinnerDetail[]>([]);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError(null);

      const [historyResult, multiWinnerResult] = await Promise.all([
        getRaffleHistory(),
        getMultiWinnerStats(),
      ]);

      if (historyResult.error) {
        setError(historyResult.error);
      } else {
        setRaffles(historyResult.data || []);
      }

      if (multiWinnerResult.data) {
        setMultiWinners(multiWinnerResult.data);
      }

      setLoading(false);
    }

    loadHistory();
  }, []);

  async function handleRaffleClick(raffleId: string) {
    const raffle = raffles.find((r) => r.id === raffleId);
    if (!raffle) return;

    setSelectedRaffle(raffle);
    setDetailLoading(true);
    setDetailError(null);
    setWinners([]);

    const result = await getRaffleWinners(raffleId);

    if (result.error) {
      setDetailError(result.error);
    } else if (result.data) {
      setWinners(result.data);
    }

    setDetailLoading(false);
  }

  function handleCloseDetail() {
    setSelectedRaffle(null);
    setWinners([]);
    setDetailError(null);
  }

  if (loading) {
    return <HistoryPageSkeleton />;
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <History className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Raffle History</h1>
      </div>

      {/* Multi-Winner Fairness Check */}
      <MultiWinnerAlert multiWinners={multiWinners} />

      {/* Error State */}
      {error && (
        <Card className="bg-destructive/10 mb-6">
          <CardContent className="py-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Raffle History List */}
      {!error && (
        <RaffleHistoryList
          raffles={raffles}
          onRaffleClick={handleRaffleClick}
        />
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedRaffle} onOpenChange={handleCloseDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRaffle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedRaffle.name}
                </DialogTitle>
                <div className="text-sm text-muted-foreground">
                  {formatDate(selectedRaffle.created_at, "long")}
                </div>
              </DialogHeader>

              {/* Raffle Summary */}
              <div className="flex gap-4 py-4 border-b text-sm">
                <div>
                  <span className="text-muted-foreground">Participants:</span>{" "}
                  <span className="font-medium">
                    {selectedRaffle.participant_count}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Prizes Awarded:</span>{" "}
                  <span className="font-medium">
                    {selectedRaffle.prizes_awarded} of{" "}
                    {selectedRaffle.total_prizes}
                  </span>
                </div>
              </div>

              {/* Winner List */}
              <div className="py-4">
                <h3 className="font-semibold mb-4">Winners</h3>
                {detailLoading ? (
                  <WinnerListSkeleton />
                ) : detailError ? (
                  <div className="text-center py-4 text-destructive">
                    {detailError}
                  </div>
                ) : (
                  <WinnerList winners={winners} />
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={handleCloseDetail}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Loading skeleton for the history page
 */
function HistoryPageSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-9 w-48" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-4 mt-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the winner list
 */
function WinnerListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}
