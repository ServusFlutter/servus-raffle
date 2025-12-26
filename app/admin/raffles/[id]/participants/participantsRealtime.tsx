"use client";

import { useCallback, useEffect, useState } from "react";
import { ParticipantCounter } from "@/components/admin/participantCounter";
import { ParticipantTable } from "@/components/admin/participantTable";
import {
  getParticipantsWithDetails,
  getRaffleStatistics,
  type ParticipantWithDetails,
  type RaffleStatistics,
} from "@/lib/actions/participants";
import { subscribeToParticipantChanges } from "@/lib/supabase/realtime";
import { Skeleton } from "@/components/ui/skeleton";

interface ParticipantsRealtimeProps {
  raffleId: string;
  initialStats: RaffleStatistics | null;
  initialParticipants: ParticipantWithDetails[];
}

/**
 * Client wrapper for real-time participant updates.
 *
 * This component:
 * - Displays participant statistics and list
 * - Subscribes to real-time changes when new participants join
 * - Re-fetches data when changes are detected (AC #5)
 */
export function ParticipantsRealtime({
  raffleId,
  initialStats,
  initialParticipants,
}: ParticipantsRealtimeProps) {
  const [stats, setStats] = useState<RaffleStatistics | null>(initialStats);
  const [participants, setParticipants] = useState<ParticipantWithDetails[]>(initialParticipants);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Refresh participants and statistics from the server.
   * Called when real-time updates are received.
   */
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [participantsResult, statsResult] = await Promise.all([
        getParticipantsWithDetails(raffleId),
        getRaffleStatistics(raffleId),
      ]);

      if (participantsResult.data) {
        setParticipants(participantsResult.data);
      }
      if (statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Failed to refresh participant data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [raffleId]);

  // Subscribe to real-time participant changes
  useEffect(() => {
    const channel = subscribeToParticipantChanges(raffleId, () => {
      // When a new participant joins, refresh the data
      refreshData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [raffleId, refreshData]);

  // Show loading skeleton while initial data is not available
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Counter */}
      <div className={isRefreshing ? "opacity-70 transition-opacity" : ""}>
        <ParticipantCounter
          participantCount={stats.participantCount}
          totalTickets={stats.totalTickets}
        />
      </div>

      {/* Participant List */}
      <div className={isRefreshing ? "opacity-70 transition-opacity" : ""}>
        <ParticipantTable participants={participants} />
      </div>
    </div>
  );
}
