"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatePrizeSchema } from "@/lib/schemas/prize";
import type { Prize } from "@/lib/schemas/prize";

interface PrizeFormProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Prize to edit (if in edit mode) */
  prize?: Prize;
  /** Callback when form is submitted */
  onSubmit: (name: string, description: string | null) => Promise<void>;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
}

/**
 * Form for creating or editing a prize
 * Displayed in a dialog with name and optional description fields
 */
export function PrizeForm({
  open,
  onOpenChange,
  prize,
  onSubmit,
  isSubmitting = false,
}: PrizeFormProps) {
  const [name, setName] = useState(prize?.name ?? "");
  const [description, setDescription] = useState(prize?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!prize;

  // Sync form state when prize prop changes (e.g., editing different prizes)
  useEffect(() => {
    if (prize) {
      setName(prize.name);
      setDescription(prize.description ?? "");
      setError(null);
    }
  }, [prize]);

  /**
   * Handle form submission
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const validation = CreatePrizeSchema.safeParse({
      name,
      description: description || null,
    });

    if (!validation.success) {
      const errorMessage =
        validation.error.issues[0]?.message || "Invalid input";
      setError(errorMessage);
      return;
    }

    try {
      await onSubmit(validation.data.name, validation.data.description || null);
      // Reset form on success (parent will close dialog)
      if (!isEditMode) {
        setName("");
        setDescription("");
      }
    } catch {
      setError("An unexpected error occurred");
    }
  }

  /**
   * Handle dialog close
   */
  function handleClose() {
    if (!isSubmitting) {
      setError(null);
      if (!isEditMode) {
        setName("");
        setDescription("");
      }
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Prize" : "Add Prize"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the prize details below."
              : "Add a new prize to this raffle. Prizes will be drawn in order."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="prize-name">Prize Name</Label>
              <Input
                id="prize-name"
                type="text"
                placeholder="e.g., Amazon Gift Card"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                aria-describedby={error ? "prize-error" : undefined}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prize-description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="prize-description"
                placeholder="e.g., $50 Amazon gift card"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            {error && (
              <p id="prize-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Saving..." : "Adding..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Add Prize"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
