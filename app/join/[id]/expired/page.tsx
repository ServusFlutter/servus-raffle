import { Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpiredPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Page shown to participants who scan an expired QR code
 *
 * This is a participant-facing page that displays a friendly message
 * when they try to join a raffle whose QR code has expired.
 */
export default async function ExpiredPage({ params }: ExpiredPageProps) {
  // We use the id to potentially look up raffle info in the future
  // For now, we just display a generic expired message
  await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">QR Code Expired</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sorry, this QR code is no longer valid. The raffle organizer may
            have ended the registration period.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>The registration window has closed</span>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact the event
              organizer for a new QR code.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
