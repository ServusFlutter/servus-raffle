/**
 * Zod schemas for prize validation
 *
 * Provides type-safe validation for prize creation, updates, and data types.
 * Used on both client (form validation) and server (input validation).
 */

import { z } from "zod";

/**
 * Schema for creating a new prize
 * Used in form validation and server action input validation
 *
 * Note: Uses transform + refine pattern because in Zod v4, transform runs
 * before validators. This ensures whitespace-only names are properly rejected.
 */
export const CreatePrizeSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 1, "Prize name is required")
    .refine(
      (val) => val.length <= 255,
      "Prize name must be 255 characters or less"
    ),
  description: z
    .string()
    .transform((val) => val.trim())
    .optional()
    .nullable(),
});

/**
 * Schema for updating an existing prize
 * Same fields as create, but requires prize ID
 */
export const UpdatePrizeSchema = z.object({
  prizeId: z.string().uuid("Invalid prize ID"),
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 1, "Prize name is required")
    .refine(
      (val) => val.length <= 255,
      "Prize name must be 255 characters or less"
    ),
  description: z
    .string()
    .transform((val) => val.trim())
    .optional()
    .nullable(),
});

/**
 * Schema for a full prize object from the database
 */
export const PrizeSchema = z.object({
  id: z.string().uuid(),
  raffle_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  sort_order: z.number().int(),
  awarded_to: z.string().uuid().nullable(),
  awarded_at: z.string().nullable(),
});

/**
 * Type for creating a new prize
 */
export type CreatePrizeInput = z.infer<typeof CreatePrizeSchema>;

/**
 * Type for updating a prize
 */
export type UpdatePrizeInput = z.infer<typeof UpdatePrizeSchema>;

/**
 * Type for a full prize object
 */
export type Prize = z.infer<typeof PrizeSchema>;

/**
 * Schema for participant-facing prize data (limited info for privacy)
 *
 * Used in Story 5-3: Participant Prize & Status View (FR33, FR34).
 * Does NOT expose winner user_id or awarded_to details to participants.
 * Only shows whether a prize has been awarded (boolean).
 */
export const ParticipantPrizeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  sort_order: z.number().int(),
  is_awarded: z.boolean(),
});

/**
 * Type for participant-facing prize data
 * Limited info - no winner details, just award status
 */
export type ParticipantPrize = z.infer<typeof ParticipantPrizeSchema>;
