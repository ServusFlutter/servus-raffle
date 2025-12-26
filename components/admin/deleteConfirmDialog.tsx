"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Title of the dialog */
  title?: string;
  /** Name of the item being deleted (shown in the confirmation message) */
  itemName: string;
  /** Type of item being deleted (e.g., "prize", "raffle") */
  itemType?: string;
  /** Callback when delete is confirmed */
  onConfirm: () => Promise<void> | void;
  /** Whether the delete action is in progress */
  isDeleting?: boolean;
}

/**
 * Confirmation dialog for delete actions
 * Shows a warning message with the item name and requires explicit confirmation
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  itemName,
  itemType = "item",
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  /**
   * Handle the delete confirmation
   */
  async function handleConfirm() {
    await onConfirm();
  }

  /**
   * Handle cancel/close
   */
  function handleCancel() {
    if (!isDeleting) {
      onOpenChange(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{itemName}&quot;? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${itemType}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
