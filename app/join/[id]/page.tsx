import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isExpired } from "@/lib/utils/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface JoinPageProps {
  params: Promise<{ id: string }>;
}

/**
 * QR code join page for participants
 *
 * This page handles the initial scan of a raffle QR code.
 * - Validates the raffle exists and is active
 * - Checks if the QR code has expired
 * - Redirects to expired page if expired
 * - Full participant registration flow will be implemented in Story 3-1
 */
export default async function JoinPage({ params }: JoinPageProps) {
  const { id } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch raffle (public access - no auth required)
  const supabase = await createClient();

  const { data: raffle, error } = await supabase
    .from("raffles")
    .select("id, name, status, qr_code_expires_at")
    .eq("id", id)
    .single();

  if (error || !raffle) {
    notFound();
  }

  // Check if raffle is active
  if (raffle.status !== "active") {
    // If draft, raffle hasn't started
    // If completed/drawing, raffle is done
    notFound();
  }

  // Check if QR code has expired
  if (raffle.qr_code_expires_at && isExpired(raffle.qr_code_expires_at)) {
    redirect(`/join/${id}/expired`);
  }

  // For now, show a placeholder since full join flow is in Story 3-1
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-2xl">{raffle.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Welcome! Participant registration will be available soon.
          </p>
          <p className="text-sm text-muted-foreground">
            The full join experience is coming in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
