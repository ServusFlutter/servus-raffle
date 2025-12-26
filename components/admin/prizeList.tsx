"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, Trophy, Clock, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PrizeWithWinner } from "@/lib/actions/prizes";

export type { PrizeWithWinner };

interface PrizeListProps {
  /** List of prizes to display */
  prizes: PrizeWithWinner[];
  /** Callback when edit button is clicked */
  onEdit: (prize: PrizeWithWinner) => void;
  /** Callback when delete button is clicked */
  onDelete: (prize: PrizeWithWinner) => void;
  /** Callback when prizes are reordered via drag-and-drop */
  onReorder?: (newOrder: PrizeWithWinner[]) => void;
  /** Whether any action is in progress */
  isLoading?: boolean;
  /** Whether to highlight the next prize to be drawn */
  highlightNextToDraw?: boolean;
}

/**
 * Individual sortable prize card component
 */
function SortablePrizeCard({
  prize,
  index,
  isAwarded,
  isNextToDraw,
  onEdit,
  onDelete,
  isLoading,
  canDrag,
}: {
  prize: PrizeWithWinner;
  index: number;
  isAwarded: boolean;
  isNextToDraw: boolean;
  onEdit: (prize: PrizeWithWinner) => void;
  onDelete: (prize: PrizeWithWinner) => void;
  isLoading: boolean;
  canDrag: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: prize.id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isAwarded && "opacity-60",
        isNextToDraw && "border-2 border-blue-500 shadow-md",
        isDragging && "shadow-lg ring-2 ring-primary opacity-90"
      )}
      data-testid={isNextToDraw ? "next-to-draw-prize" : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {canDrag && (
              <button
                type="button"
                className={cn(
                  "cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 rounded hover:bg-muted",
                  isLoading && "cursor-not-allowed opacity-50"
                )}
                aria-label={`Drag to reorder ${prize.name}`}
                data-testid={`drag-handle-${prize.id}`}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground font-mono">
                  #{index + 1}
                </span>
                <CardTitle className="text-lg truncate">{prize.name}</CardTitle>
                <PrizeStatusBadge prize={prize} />
              </div>
              {prize.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {prize.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(prize)}
              disabled={isLoading || !!prize.awarded_to}
              aria-label={`Edit ${prize.name}`}
              title={
                prize.awarded_to
                  ? "Cannot edit awarded prize"
                  : `Edit ${prize.name}`
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(prize)}
              disabled={isLoading || !!prize.awarded_to}
              aria-label={`Delete ${prize.name}`}
              title={
                prize.awarded_to
                  ? "Cannot delete awarded prize"
                  : `Delete ${prize.name}`
              }
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {prize.awarded_to && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span>
              Awarded to{" "}
              <span className="font-medium" data-testid="winner-name">
                {prize.winner_name || "Unknown"}
              </span>
            </span>
            {prize.awarded_at && (
              <span className="text-xs" data-testid="award-timestamp">
                on{" "}
                {new Date(prize.awarded_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Displays a list of prizes for a raffle with drag-and-drop reordering
 * Shows prize name, description, award status, and action buttons
 *
 * Visual states:
 * - Awarded prizes: reduced opacity (grayed out), cannot be dragged
 * - Next prize to draw: highlighted with blue border (when highlightNextToDraw=true)
 * - Winner name displayed for awarded prizes
 * - Drag handle shown for non-awarded prizes
 */
export function PrizeList({
  prizes,
  onEdit,
  onDelete,
  onReorder,
  isLoading = false,
  highlightNextToDraw = false,
}: PrizeListProps) {
  const nextToDrawIndex = prizes.findIndex((p) => !p.awarded_to);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const prizeIds = useMemo(() => prizes.map((p) => p.id), [prizes]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = prizes.findIndex((p) => p.id === active.id);
      const newIndex = prizes.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(prizes, oldIndex, newIndex);
        onReorder?.(newOrder);
      }
    }
  }

  if (prizes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-muted-foreground">
            No prizes yet
          </CardTitle>
          <CardDescription className="text-center">
            Add prizes to this raffle using the button above.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={prizeIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4" data-testid="prize-list">
          {prizes.map((prize, index) => {
            const isAwarded = !!prize.awarded_to;
            const isNextToDraw = highlightNextToDraw && index === nextToDrawIndex;
            const canDrag = !isAwarded && !isLoading && !!onReorder;

            return (
              <SortablePrizeCard
                key={prize.id}
                prize={prize}
                index={index}
                isAwarded={isAwarded}
                isNextToDraw={isNextToDraw}
                onEdit={onEdit}
                onDelete={onDelete}
                isLoading={isLoading}
                canDrag={canDrag}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * Badge showing the award status of a prize
 */
function PrizeStatusBadge({ prize }: { prize: PrizeWithWinner }) {
  if (prize.awarded_to) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        <Trophy className="mr-1 h-3 w-3" />
        Awarded
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Clock className="mr-1 h-3 w-3" />
      Pending
    </Badge>
  );
}
