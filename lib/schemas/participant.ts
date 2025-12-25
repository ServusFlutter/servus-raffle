/**
 * Zod schemas for participant validation
 *
 * Provides type-safe validation for participant-related operations.
 * Used for joinRaffle server action input validation.
 */

import { z } from "zod";

/**
 * Schema for joining a raffle
 * Validates the raffle ID is a valid UUID
 */
export const JoinRaffleSchema = z.object({
  raffleId: z.string().uuid("Invalid raffle ID"),
});

/**
 * Type for joining a raffle
 */
export type JoinRaffleInput = z.infer<typeof JoinRaffleSchema>;

/**
 * Schema for a participant record from the database
 */
export const ParticipantSchema = z.object({
  id: z.string().uuid(),
  raffle_id: z.string().uuid(),
  user_id: z.string().uuid(),
  ticket_count: z.number().int().positive(),
  joined_at: z.string(),
});

/**
 * Type for a participant record
 */
export type Participant = z.infer<typeof ParticipantSchema>;
