"use client";

import { Pencil, Trash2, Trophy, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Prize } from "@/lib/schemas/prize";

interface PrizeListProps {
  /** List of prizes to display */
  prizes: Prize[];
  /** Callback when edit button is clicked */
  onEdit: (prize: Prize) => void;
  /** Callback when delete button is clicked */
  onDelete: (prize: Prize) => void;
  /** Callback when move up button is clicked */
  onMoveUp?: (prize: Prize) => void;
  /** Callback when move down button is clicked */
  onMoveDown?: (prize: Prize) => void;
  /** Whether any action is in progress */
  isLoading?: boolean;
}

/**
 * Displays a list of prizes for a raffle
 * Shows prize name, description, award status, and action buttons
 */
export function PrizeList({
  prizes,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isLoading = false,
}: PrizeListProps) {
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
    <div className="space-y-4">
      {prizes.map((prize, index) => (
        <Card key={prize.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
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
              <div className="flex items-center gap-1 shrink-0">
                {onMoveUp && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMoveUp(prize)}
                    disabled={isLoading || index === 0 || !!prize.awarded_to}
                    aria-label={`Move ${prize.name} up`}
                    title={
                      prize.awarded_to
                        ? "Cannot move awarded prize"
                        : index === 0
                          ? "Already first"
                          : `Move ${prize.name} up`
                    }
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                )}
                {onMoveDown && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMoveDown(prize)}
                    disabled={isLoading || index === prizes.length - 1 || !!prize.awarded_to}
                    aria-label={`Move ${prize.name} down`}
                    title={
                      prize.awarded_to
                        ? "Cannot move awarded prize"
                        : index === prizes.length - 1
                          ? "Already last"
                          : `Move ${prize.name} down`
                    }
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
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
          {prize.awarded_to && prize.awarded_at && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Awarded on{" "}
                {new Date(prize.awarded_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

/**
 * Badge showing the award status of a prize
 */
function PrizeStatusBadge({ prize }: { prize: Prize }) {
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
