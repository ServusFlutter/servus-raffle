"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Maximize2, Minimize2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getTimeRemaining,
  formatCountdown,
  formatExpirationTime,
  isExpired,
} from "@/lib/utils/dates";

interface QRCodeDisplayProps {
  value: string;
  expiresAt: string;
  raffleName: string;
  projectionMode?: boolean;
  onExpired?: () => void;
}

/**
 * QR Code display component with countdown timer and projection mode support
 *
 * Features:
 * - High-contrast QR code optimized for projection
 * - Real-time countdown to expiration
 * - Download as PNG functionality
 * - Toggle between standard and projection modes
 */
export function QRCodeDisplay({
  value,
  expiresAt,
  raffleName,
  projectionMode = false,
  onExpired,
}: QRCodeDisplayProps) {
  const [isProjection, setIsProjection] = useState(projectionMode);
  const [countdown, setCountdown] = useState(formatCountdown(expiresAt));
  const [expired, setExpired] = useState(isExpired(expiresAt));
  const qrRef = useRef<HTMLDivElement>(null);
  const expiredCallbackFired = useRef(false);

  // Update countdown every second
  useEffect(() => {
    // Reset callback flag when expiresAt changes
    expiredCallbackFired.current = false;

    const updateCountdown = () => {
      const newExpired = isExpired(expiresAt);
      setCountdown(formatCountdown(expiresAt));
      setExpired(newExpired);

      // Only call onExpired once per expiration
      if (newExpired && onExpired && !expiredCallbackFired.current) {
        expiredCallbackFired.current = true;
        onExpired();
      }
    };

    // Initial update
    updateCountdown();

    // Set up interval for countdown
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  // Handle QR code download as PNG
  const handleDownload = useCallback(() => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) {
      console.error("QR code SVG element not found");
      return;
    }

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get canvas 2D context");
      return;
    }

    // Set canvas size for high-res output (1024x1024)
    const size = 1024;
    canvas.width = size;
    canvas.height = size;

    // Fill with white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();

    // Handle image load error
    img.onerror = () => {
      console.error("Failed to load QR code image for download");
      URL.revokeObjectURL(svgUrl);
    };

    img.onload = () => {
      // Draw SVG onto canvas with padding
      const padding = 64;
      ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);

      // Create download link
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${raffleName.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`;
      link.href = pngUrl;
      link.click();

      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  }, [raffleName]);

  // Calculate sizes based on mode
  const qrSize = isProjection ? 512 : 256;
  const titleSize = isProjection ? "text-4xl" : "text-xl";
  const subtitleSize = isProjection ? "text-2xl" : "text-base";
  const countdownSize = isProjection ? "text-6xl" : "text-3xl";

  // Get time remaining for detailed display
  const timeRemaining = getTimeRemaining(expiresAt);

  return (
    <Card
      className={`transition-all duration-300 ${
        isProjection
          ? "fixed inset-0 z-50 rounded-none border-none bg-black text-white flex flex-col items-center justify-center"
          : "max-w-lg mx-auto"
      }`}
      role="region"
      aria-label={`QR code to join ${raffleName}`}
    >
      {!isProjection && (
        <CardHeader className="text-center">
          <CardTitle className={titleSize}>{raffleName}</CardTitle>
        </CardHeader>
      )}

      <CardContent
        className={`flex flex-col items-center gap-6 ${
          isProjection ? "gap-8" : ""
        }`}
      >
        {/* Projection mode header */}
        {isProjection && (
          <h1 className={`${titleSize} font-bold text-center mb-4`}>
            {raffleName}
          </h1>
        )}

        {/* QR Code */}
        <div
          ref={qrRef}
          className={`p-4 bg-white rounded-lg ${expired ? "opacity-50" : ""}`}
          id="qr-code"
        >
          <QRCodeSVG
            value={value}
            size={qrSize}
            level="H"
            marginSize={2}
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </div>

        {/* Expiration Status */}
        {expired ? (
          <div className="flex flex-col items-center gap-2">
            <Badge
              variant="destructive"
              className={`${isProjection ? "text-xl px-4 py-2" : ""}`}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              QR Code Expired
            </Badge>
            <p className={`${subtitleSize} text-muted-foreground text-center`}>
              This QR code is no longer valid
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Clock
                className={`${isProjection ? "h-8 w-8" : "h-5 w-5"} text-muted-foreground`}
              />
              <span
                className={`${countdownSize} font-mono font-bold tabular-nums`}
                aria-live="polite"
                aria-atomic="true"
              >
                {countdown}
              </span>
            </div>
            <p className={`${subtitleSize} text-muted-foreground`}>
              Expires at {formatExpirationTime(expiresAt)}
            </p>
            {/* Show urgency indicator when less than 15 minutes remain */}
            {timeRemaining.totalSeconds > 0 &&
              timeRemaining.totalSeconds < 900 && (
                <Badge variant="destructive" className="animate-pulse">
                  Expiring Soon
                </Badge>
              )}
          </div>
        )}

        {/* Scan instruction */}
        <p
          className={`${subtitleSize} ${
            isProjection ? "text-white/80" : "text-muted-foreground"
          } text-center`}
        >
          Scan to join the raffle
        </p>

        {/* Controls */}
        <div
          className={`flex gap-3 ${isProjection ? "absolute bottom-8 right-8" : ""}`}
        >
          <Button
            variant={isProjection ? "secondary" : "outline"}
            size={isProjection ? "lg" : "default"}
            onClick={handleDownload}
            disabled={expired}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {!isProjection && "Download"}
          </Button>
          <Button
            variant={isProjection ? "secondary" : "outline"}
            size={isProjection ? "lg" : "default"}
            onClick={() => setIsProjection(!isProjection)}
            className="gap-2"
          >
            {isProjection ? (
              <>
                <Minimize2 className="h-4 w-4" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                Projection Mode
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
