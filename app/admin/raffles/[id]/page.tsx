import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, QrCode, Clock, AlertCircle, Gift, Plus, Users, Ticket, Play } from "lucide-react";
import { getRaffle } from "@/lib/actions/raffles";
import { getPrizeCount } from "@/lib/actions/prizes";
import { getRaffleStatistics } from "@/lib/actions/participants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatDate,
  getStatusVariant,
  getStatusDescription,
} from "@/lib/utils/raffle";
import { isExpired, formatExpirationTime } from "@/lib/utils/dates";

interface RaffleDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Raffle detail page
 * Displays raffle information with placeholders for future features
 */
export default async function RaffleDetailPage({
  params,
}: RaffleDetailPageProps) {
  const { id } = await params;
  const [raffleResult, prizeCountResult, statsResult] = await Promise.all([
    getRaffle(id),
    getPrizeCount(id),
    getRaffleStatistics(id),
  ]);

  const { data: raffle, error } = raffleResult;
  const prizeCount = prizeCountResult.data ?? 0;
  const stats = statsResult.data;

  if (error || !raffle) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Raffle Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{raffle.name}</h1>
          <Badge variant={getStatusVariant(raffle.status)} className="text-sm">
            {raffle.status}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Created on {formatDate(raffle.created_at, "long")}
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            {getStatusDescription(raffle.status)}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </CardTitle>
            <CardDescription>
              {raffle.status === "draft"
                ? "Generate a QR code for participants to join"
                : "Manage QR code for participant access"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Draft state - show generate button */}
            {raffle.status === "draft" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Set an expiration time and generate a QR code to allow
                  participants to join this raffle.
                </p>
                <div className="mt-4">
                  <Link href={`/admin/raffles/${raffle.id}/qr`}>
                    <Button className="w-full">
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate QR Code
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {/* Active state with valid QR */}
            {raffle.status === "active" &&
              raffle.qr_code_expires_at &&
              !isExpired(raffle.qr_code_expires_at) && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Expires at{" "}
                      {formatExpirationTime(raffle.qr_code_expires_at)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link href={`/admin/raffles/${raffle.id}/qr`}>
                      <Button className="w-full">
                        <QrCode className="mr-2 h-4 w-4" />
                        View QR Code
                      </Button>
                    </Link>
                  </div>
                </>
              )}

            {/* Active state with expired QR */}
            {raffle.status === "active" &&
              raffle.qr_code_expires_at &&
              isExpired(raffle.qr_code_expires_at) && (
                <>
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>QR code has expired</span>
                  </div>
                  <div className="mt-4">
                    <Link href={`/admin/raffles/${raffle.id}/qr`}>
                      <Button variant="outline" className="w-full">
                        <QrCode className="mr-2 h-4 w-4" />
                        Regenerate QR Code
                      </Button>
                    </Link>
                  </div>
                </>
              )}

            {/* Completed/drawing state */}
            {(raffle.status === "completed" || raffle.status === "drawing") && (
              <p className="text-sm text-muted-foreground">
                QR code is no longer needed for this raffle.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Prizes Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Prizes
            </CardTitle>
            <CardDescription>Manage prizes for this raffle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prizeCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                {prizeCount} {prizeCount === 1 ? "prize" : "prizes"} configured
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No prizes added yet. Add prizes that participants can win.
              </p>
            )}
            <div className="mt-4">
              <Link href={`/admin/raffles/${raffle.id}/prizes`}>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Manage Prizes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Participants Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants
            </CardTitle>
            <CardDescription>View who has joined this raffle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-semibold">{stats.participantCount}</span>{" "}
                    {stats.participantCount === 1 ? "participant" : "participants"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-semibold">{stats.totalTickets}</span>{" "}
                    {stats.totalTickets === 1 ? "ticket" : "tickets"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No participants yet.
              </p>
            )}
            <div className="mt-4">
              <Link href={`/admin/raffles/${raffle.id}/participants`}>
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  View Participants
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Draw Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Live Draw
            </CardTitle>
            <CardDescription>Start the live raffle draw</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Only show for active raffles with prizes (AC #1) */}
            {raffle.status === "active" && prizeCount > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Enter projection mode to conduct the live draw.
                  Best viewed on a large screen or projector.
                </p>
                <div className="mt-4">
                  <Link href={`/admin/raffles/${raffle.id}/live`}>
                    <Button className="w-full" data-testid="start-live-draw-button">
                      <Play className="mr-2 h-4 w-4" />
                      Start Live Draw
                    </Button>
                  </Link>
                </div>
              </>
            ) : raffle.status === "active" && prizeCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add prizes before starting the live draw.
              </p>
            ) : raffle.status === "draft" ? (
              <p className="text-sm text-muted-foreground">
                Activate the raffle and add prizes before starting the live draw.
              </p>
            ) : raffle.status === "drawing" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Drawing is in progress. Return to the live draw view.
                </p>
                <div className="mt-4">
                  <Link href={`/admin/raffles/${raffle.id}/live`}>
                    <Button className="w-full" variant="secondary">
                      <Play className="mr-2 h-4 w-4" />
                      Continue Live Draw
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                This raffle has been completed.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
