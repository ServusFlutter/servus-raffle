import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isExpired } from "@/lib/utils/dates";
import { joinRaffle } from "@/lib/actions/tickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface JoinPageProps {
  params: Promise<{ id: string }>;
}

/**
 * QR code join page for participants
 *
 * This page handles the complete join flow:
 * 1. Validates the raffle exists and is active
 * 2. Checks if the QR code has expired
 * 3. Redirects unauthenticated users to login (preserving return URL)
 * 4. Auto-registers authenticated users
 * 5. Redirects to participant dashboard on success
 */
export default async function JoinPage({ params }: JoinPageProps) {
  const { id } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Create Supabase client
  const supabase = await createClient();

  // Check if user is authenticated (AC #2)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL preserved
    const returnUrl = `/join/${id}`;
    redirect(`/login?redirectTo=${encodeURIComponent(returnUrl)}`);
  }

  // Fetch raffle
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

  // Check if QR code has expired (AC #5)
  if (raffle.qr_code_expires_at && isExpired(raffle.qr_code_expires_at)) {
    redirect(`/join/${id}/expired`);
  }

  // Auto-register the participant (AC #3, #4)
  const result = await joinRaffle(id);

  if (result.error) {
    // Handle error case - show error UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Unable to Join</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{result.error}</p>
            <div className="pt-4">
              <Button asChild>
                <Link href={`/join/${id}`}>Try Again</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success - redirect to participant dashboard (AC #3)
  // Add isNew query param so dashboard can show appropriate toast
  const isNew = result.data?.isNewJoin ? "true" : "false";
  redirect(`/participant/raffle/${id}?joined=${isNew}`);
}
