"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DURATION_OPTIONS, DEFAULT_DURATION_MINUTES } from "@/lib/utils/dates";

interface ExpirationSelectorProps {
  onSelect: (durationMinutes: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * Duration picker for QR code expiration
 *
 * Provides preset duration options (1-4 hours) plus a custom time option.
 * Used when activating a raffle or regenerating a QR code.
 */
export function ExpirationSelector({
  onSelect,
  isLoading = false,
  disabled = false,
}: ExpirationSelectorProps) {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(
    DEFAULT_DURATION_MINUTES
  );
  const [showCustom, setShowCustom] = useState(false);
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handlePresetSelect = (minutes: number) => {
    setSelectedDuration(minutes);
    setShowCustom(false);
    setError(null);
  };

  const handleCustomClick = () => {
    setSelectedDuration(null);
    setShowCustom(true);
    setCustomHours("");
    setCustomMinutes("");
    setError(null);
  };

  const validateAndCalculateCustomDuration = (): number | null => {
    const hours = parseInt(customHours) || 0;
    const minutes = parseInt(customMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 15) {
      setError("Duration must be at least 15 minutes");
      return null;
    }

    if (totalMinutes > 1440) {
      setError("Duration cannot exceed 24 hours");
      return null;
    }

    return totalMinutes;
  };

  const handleGenerate = () => {
    setError(null);

    let duration: number | null = selectedDuration;

    if (showCustom) {
      duration = validateAndCalculateCustomDuration();
      if (!duration) return;
    }

    if (!duration) {
      setError("Please select a duration");
      return;
    }

    onSelect(duration);
  };

  // Calculate what time it will expire for preview
  const getExpirationPreview = (): string => {
    let minutes = selectedDuration;

    if (showCustom) {
      const hours = parseInt(customHours) || 0;
      const mins = parseInt(customMinutes) || 0;
      minutes = hours * 60 + mins;
    }

    if (!minutes || minutes <= 0) return "";

    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
    return expiresAt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const expirationPreview = getExpirationPreview();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          QR Code Expiration
        </CardTitle>
        <CardDescription>
          Choose how long the QR code will be valid for participants to scan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Duration Options */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DURATION_OPTIONS.map((option) => (
            <Button
              key={option.minutes}
              type="button"
              variant={
                selectedDuration === option.minutes && !showCustom
                  ? "default"
                  : "outline"
              }
              onClick={() => handlePresetSelect(option.minutes)}
              disabled={isLoading || disabled}
              className="h-12"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Custom Duration Option */}
        <Button
          type="button"
          variant={showCustom ? "default" : "outline"}
          onClick={handleCustomClick}
          disabled={isLoading || disabled}
          className="w-full"
        >
          Custom Duration
        </Button>

        {/* Custom Duration Inputs */}
        {showCustom && (
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="custom-hours">Hours</Label>
              <Input
                id="custom-hours"
                type="number"
                min="0"
                max="24"
                value={customHours}
                onChange={(e) => {
                  setCustomHours(e.target.value);
                  setError(null);
                }}
                placeholder="0"
                disabled={isLoading || disabled}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="custom-minutes">Minutes</Label>
              <Input
                id="custom-minutes"
                type="number"
                min="0"
                max="59"
                value={customMinutes}
                onChange={(e) => {
                  setCustomMinutes(e.target.value);
                  setError(null);
                }}
                placeholder="0"
                disabled={isLoading || disabled}
              />
            </div>
          </div>
        )}

        {/* Expiration Preview */}
        {expirationPreview && (
          <p className="text-sm text-muted-foreground text-center">
            QR code will expire at approximately{" "}
            <span className="font-medium">{expirationPreview}</span>
          </p>
        )}

        {/* Error Display */}
        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isLoading || disabled || (!selectedDuration && !showCustom)}
          className="w-full"
          size="lg"
        >
          {isLoading ? "Generating..." : "Generate QR Code"}
        </Button>
      </CardContent>
    </Card>
  );
}
