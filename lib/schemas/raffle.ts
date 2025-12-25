/**
 * Zod schemas for raffle validation
 *
 * Provides type-safe validation for raffle creation and data types.
 * Used on both client (form validation) and server (input validation).
 */

import { z } from "zod";

/**
 * Valid raffle status values
 * - draft: Initial state, raffle is being set up
 * - active: QR code is active, participants can join
 * - drawing: Wheel animation in progress
 * - completed: All prizes drawn
 */
export const RaffleStatus = z.enum(["draft", "active", "drawing", "completed"]);

/**
 * Schema for creating a new raffle
 * Used in form validation and server action input validation
 *
 * Note: Uses transform + refine pattern because in Zod v4, transform runs
 * before validators. This ensures whitespace-only names are properly rejected.
 */
export const CreateRaffleSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 1, "Raffle name is required")
    .refine(
      (val) => val.length <= 255,
      "Raffle name must be 255 characters or less"
    ),
});

/**
 * Schema for a full raffle object from the database
 */
export const RaffleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: RaffleStatus,
  qr_code_expires_at: z.string().nullable(),
  created_at: z.string(),
  created_by: z.string().uuid().nullable(),
});

/**
 * Type for creating a new raffle
 */
export type CreateRaffleInput = z.infer<typeof CreateRaffleSchema>;

/**
 * Type for a full raffle object
 */
export type Raffle = z.infer<typeof RaffleSchema>;

/**
 * Type for raffle status
 */
export type RaffleStatusType = z.infer<typeof RaffleStatus>;

/**
 * Schema for activating a raffle with QR code expiration
 * Used when admin generates QR code for participants to join
 *
 * Duration must be between 15 minutes and 24 hours (1440 minutes)
 * to prevent accidental very short or very long expirations
 */
export const ActivateRaffleSchema = z.object({
  raffleId: z.string().uuid("Invalid raffle ID"),
  durationMinutes: z
    .number()
    .int("Duration must be a whole number")
    .min(15, "Duration must be at least 15 minutes")
    .max(1440, "Duration cannot exceed 24 hours"),
});

/**
 * Type for activating a raffle
 */
export type ActivateRaffleInput = z.infer<typeof ActivateRaffleSchema>;
