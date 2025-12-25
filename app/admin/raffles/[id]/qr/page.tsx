"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QRCodeDisplay } from "@/components/admin/qrCodeDisplay";
import { ExpirationSelector } from "@/components/admin/expirationSelector";
import { getRaffle, activateRaffle, regenerateQrCode } from "@/lib/actions/raffles";
import { isExpired } from "@/lib/utils/dates";
import type { Raffle } from "@/lib/schemas/raffle";

interface QRCodePageProps {
  params: Promise<{ id: string }>;
}

/**
 * QR Code generation and display page for raffle admins
 *
 * Features:
 * - Duration selector for initial activation
 * - QR code display with countdown
 * - Regeneration for expired QR codes
 * - Projection mode for meetup display
 */
export default function QRCodePage({ params }: QRCodePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [qrExpired, setQrExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch raffle data
  useEffect(() => {
    async function fetchRaffle() {
      setIsLoading(true);
      setError(null);

      const result = await getRaffle(resolvedParams.id);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.data) {
        setRaffle(result.data);
        // Check if QR code is expired
        if (result.data.qr_code_expires_at) {
          setQrExpired(isExpired(result.data.qr_code_expires_at));
        }
      }

      setIsLoading(false);
    }

    fetchRaffle();
  }, [resolvedParams.id]);

  // Handle QR code expiration callback
  const handleExpired = () => {
    setQrExpired(true);
  };

  // Handle activating a draft raffle
  const handleActivate = async (durationMinutes: number) => {
    if (!raffle) return;

    setIsActivating(true);

    const result = await activateRaffle(raffle.id, durationMinutes);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      toast.success("QR code generated successfully");
      // Update local state with new expiration
      setRaffle({
        ...raffle,
        status: "active",
        qr_code_expires_at: result.data.qr_code_expires_at,
      });
      setQrExpired(false);
    }

    setIsActivating(false);
  };

  // Handle regenerating an expired QR code
  const handleRegenerate = async (durationMinutes: number) => {
    if (!raffle) return;

    setIsActivating(true);

    const result = await regenerateQrCode(raffle.id, durationMinutes);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      toast.success("QR code regenerated successfully");
      // Update local state with new expiration
      setRaffle({
        ...raffle,
        qr_code_expires_at: result.data.qr_code_expires_at,
      });
      setQrExpired(false);
    }

    setIsActivating(false);
  };

  // Build the join URL for the QR code
  const getJoinUrl = (): string => {
    if (typeof window === "undefined") {
      return `/join/${resolvedParams.id}`;
    }
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/${resolvedParams.id}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !raffle) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">
              {error || "Raffle not found"}
            </p>
            <Button variant="outline" onClick={() => router.push("/admin")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Draft raffle - show activation UI
  if (raffle.status === "draft") {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-6">
          <Link
            href={`/admin/raffles/${raffle.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Raffle
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{raffle.name}</h1>
            <Badge variant="outline">Draft</Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Generate a QR code for participants to scan and join
          </p>
        </div>

        <ExpirationSelector
          onSelect={handleActivate}
          isLoading={isActivating}
        />
      </div>
    );
  }

  // Active raffle with expired QR - show regeneration UI
  if (raffle.status === "active" && qrExpired) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-6">
          <Link
            href={`/admin/raffles/${raffle.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Raffle
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{raffle.name}</h1>
            <Badge variant="destructive">Expired</Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            The QR code has expired. Generate a new one to allow more
            participants to join.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Regenerate QR Code
            </CardTitle>
            <CardDescription>
              Create a new QR code with updated expiration time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpirationSelector
              onSelect={handleRegenerate}
              isLoading={isActivating}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active raffle with valid QR - show QR code display
  if (raffle.status === "active" && raffle.qr_code_expires_at) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-6">
          <Link
            href={`/admin/raffles/${raffle.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Raffle
          </Link>
        </div>

        <QRCodeDisplay
          value={getJoinUrl()}
          expiresAt={raffle.qr_code_expires_at}
          raffleName={raffle.name}
          onExpired={handleExpired}
        />
      </div>
    );
  }

  // Completed/other status - show message
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6">
        <Link
          href={`/admin/raffles/${raffle.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Raffle
        </Link>
      </div>

      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground mb-4">
            QR code generation is not available for {raffle.status} raffles
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/raffles/${raffle.id}`)}
          >
            Back to Raffle Details
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
