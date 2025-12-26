"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PrizeForm } from "@/components/admin/prizeForm";
import { PrizeList } from "@/components/admin/prizeList";
import { DeleteConfirmDialog } from "@/components/admin/deleteConfirmDialog";
import {
  getPrizesWithWinners,
  createPrize,
  updatePrize,
  deletePrize,
  reorderPrizes,
  type PrizeWithWinner,
} from "@/lib/actions/prizes";
import { getRaffle } from "@/lib/actions/raffles";
import { PrizeStatusSummary } from "@/components/admin/prizeStatusSummary";
import type { Raffle } from "@/lib/schemas/raffle";

/**
 * Prizes management page for a raffle
 * Allows admins to add, edit, delete, and reorder prizes
 * Uses optimistic updates for smooth drag-and-drop reordering
 */
export default function PrizesPage() {
  const params = useParams<{ id: string }>();
  const raffleId = params.id;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [prizes, setPrizes] = useState<PrizeWithWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track pending reorder operations to prevent race conditions
  const pendingReorderRef = useRef<AbortController | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<PrizeWithWinner | null>(null);
  const [deletingPrize, setDeletingPrize] = useState<PrizeWithWinner | null>(null);

  /**
   * Load raffle and prizes data
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [raffleResult, prizesResult] = await Promise.all([
        getRaffle(raffleId),
        getPrizesWithWinners(raffleId),
      ]);

      if (raffleResult.error || !raffleResult.data) {
        toast.error(raffleResult.error || "Raffle not found");
        return;
      }

      setRaffle(raffleResult.data);

      if (prizesResult.error) {
        toast.error(prizesResult.error);
        return;
      }

      setPrizes(prizesResult.data || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [raffleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Handle adding a new prize
   */
  async function handleAddPrize(name: string, description: string | null) {
    setIsSubmitting(true);
    try {
      const result = await createPrize(raffleId, name, description);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Prize added successfully");
      setIsAddDialogOpen(false);
      await loadData();
    } catch {
      toast.error("Failed to add prize");
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Handle updating an existing prize
   */
  async function handleUpdatePrize(name: string, description: string | null) {
    if (!editingPrize) return;

    setIsSubmitting(true);
    try {
      const result = await updatePrize(editingPrize.id, name, description);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Prize updated successfully");
      setEditingPrize(null);
      await loadData();
    } catch {
      toast.error("Failed to update prize");
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Handle deleting a prize
   */
  async function handleDeletePrize() {
    if (!deletingPrize) return;

    setIsSubmitting(true);
    try {
      const result = await deletePrize(deletingPrize.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Prize deleted successfully");
      setDeletingPrize(null);
      await loadData();
    } catch {
      toast.error("Failed to delete prize");
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Open edit dialog for a prize
   */
  function handleEditClick(prize: PrizeWithWinner) {
    setEditingPrize(prize);
  }

  /**
   * Open delete confirmation for a prize
   */
  function handleDeleteClick(prize: PrizeWithWinner) {
    setDeletingPrize(prize);
  }

  /**
   * Handle reordering prizes via drag-and-drop
   * Uses optimistic updates for smooth UX - updates UI immediately,
   * then syncs with server in background. Reverts on error.
   */
  async function handleReorder(newOrder: PrizeWithWinner[]) {
    // Cancel any pending reorder operation
    if (pendingReorderRef.current) {
      pendingReorderRef.current.abort();
    }

    // Store previous state for potential rollback
    const previousPrizes = prizes;

    // Optimistic update - update UI immediately
    setPrizes(newOrder);

    // Create new abort controller for this operation
    const abortController = new AbortController();
    pendingReorderRef.current = abortController;

    try {
      // Extract prize IDs in new order
      const prizeIds = newOrder.map((p) => p.id);

      // Sync with server in background (no await blocking UI)
      const result = await reorderPrizes(raffleId, prizeIds);

      // Check if this operation was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (result.error) {
        // Revert to previous state on error
        setPrizes(previousPrizes);
        toast.error(result.error);
      }
      // Success - no need to update state, optimistic update already applied
    } catch {
      // Check if this operation was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Revert to previous state on error
      setPrizes(previousPrizes);
      toast.error("Failed to save prize order");
    } finally {
      // Clear the pending reference if this is still the active operation
      if (pendingReorderRef.current === abortController) {
        pendingReorderRef.current = null;
      }
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-10 w-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Raffle not found</h1>
          <Link href="/admin">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/admin/raffles/${raffleId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Raffle
        </Link>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Prizes</h1>
        </div>
        <p className="text-muted-foreground">
          Manage prizes for{" "}
          <span className="font-medium text-foreground">{raffle.name}</span>
        </p>
      </div>

      {/* Add prize button */}
      <div className="mb-6">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Prize
        </Button>
      </div>

      {/* Prize status summary */}
      <PrizeStatusSummary prizes={prizes} />

      {/* Prize list with drag-and-drop */}
      <PrizeList
        prizes={prizes}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onReorder={handleReorder}
        isLoading={isSubmitting}
        highlightNextToDraw={raffle.status === "active"}
      />

      {/* Add prize dialog */}
      <PrizeForm
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddPrize}
        isSubmitting={isSubmitting}
      />

      {/* Edit prize dialog */}
      <PrizeForm
        open={!!editingPrize}
        onOpenChange={(open) => {
          if (!open) setEditingPrize(null);
        }}
        prize={editingPrize ?? undefined}
        onSubmit={handleUpdatePrize}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={!!deletingPrize}
        onOpenChange={(open) => {
          if (!open) setDeletingPrize(null);
        }}
        itemName={deletingPrize?.name ?? ""}
        itemType="prize"
        onConfirm={handleDeletePrize}
        isDeleting={isSubmitting}
      />
    </div>
  );
}
