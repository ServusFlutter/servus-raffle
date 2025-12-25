"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createRaffle } from "@/lib/actions/raffles";
import { CreateRaffleSchema } from "@/lib/schemas/raffle";
import { Loader2 } from "lucide-react";

/**
 * Form for creating a new raffle
 * Includes client-side validation and server action submission
 */
export function RaffleForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle form submission
   * Validates input, calls server action, and handles response
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const validation = CreateRaffleSchema.safeParse({ name });
    if (!validation.success) {
      // Zod v4 uses 'issues' instead of 'errors'
      const errorMessage =
        validation.error.issues[0]?.message || "Invalid input";
      setError(errorMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createRaffle(name);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (result.data) {
        toast.success("Raffle created successfully");
        router.push(`/admin/raffles/${result.data.id}`);
      }
    } catch {
      const errorMessage = "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Raffle</CardTitle>
        <CardDescription>
          Enter a name for your raffle. You can add prizes and configure
          settings after creation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Raffle Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., December Meetup Raffle"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              aria-describedby={error ? "name-error" : undefined}
              autoFocus
            />
            {error && (
              <p id="name-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Raffle"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
