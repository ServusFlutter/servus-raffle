"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PrizeForm } from "@/components/admin/prizeForm";
import { PrizeList } from "@/components/admin/prizeList";
import { DeleteConfirmDialog } from "@/components/admin/deleteConfirmDialog";
import {
  getPrizes,
  createPrize,
  updatePrize,
  deletePrize,
  movePrizeUp,
  movePrizeDown,
} from "@/lib/actions/prizes";
import { getRaffle } from "@/lib/actions/raffles";
import type { Prize } from "@/lib/schemas/prize";
import type { Raffle } from "@/lib/schemas/raffle";

/**
 * Prizes management page for a raffle
 * Allows admins to add, edit, and delete prizes
 */
export default function PrizesPage() {
  const params = useParams<{ id: string }>();
  const raffleId = params.id;

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [deletingPrize, setDeletingPrize] = useState<Prize | null>(null);

  /**
   * Load raffle and prizes data
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [raffleResult, prizesResult] = await Promise.all([
        getRaffle(raffleId),
        getPrizes(raffleId),
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
  function handleEditClick(prize: Prize) {
    setEditingPrize(prize);
  }

  /**
   * Open delete confirmation for a prize
   */
  function handleDeleteClick(prize: Prize) {
    setDeletingPrize(prize);
  }

  /**
   * Handle moving a prize up in the sort order
   */
  async function handleMoveUp(prize: Prize) {
    setIsSubmitting(true);
    try {
      const result = await movePrizeUp(prize.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setPrizes(result.data);
        toast.success("Prize moved up");
      }
    } catch {
      toast.error("Failed to move prize");
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Handle moving a prize down in the sort order
   */
  async function handleMoveDown(prize: Prize) {
    setIsSubmitting(true);
    try {
      const result = await movePrizeDown(prize.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setPrizes(result.data);
        toast.success("Prize moved down");
      }
    } catch {
      toast.error("Failed to move prize");
    } finally {
      setIsSubmitting(false);
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

      {/* Prize list */}
      <PrizeList
        prizes={prizes}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        isLoading={isSubmitting}
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
