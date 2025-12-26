/**
 * History types and schemas
 *
 * Types for raffle history display, winner details, and multi-winner statistics.
 * Used by Server Actions and admin components for history tracking.
 */

import { z } from "zod";

/**
 * Schema for raffle history item display
 */
export const RaffleHistoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.string(),
  created_at: z.string(),
  participant_count: z.number().int().min(0),
  prizes_awarded: z.number().int().min(0),
  total_prizes: z.number().int().min(0),
});

/**
 * Type for raffle history list item
 */
export type RaffleHistoryItem = z.infer<typeof RaffleHistoryItemSchema>;

/**
 * Schema for winner detail display
 * Note: prize_id can be empty string for legacy winners without linked prizes
 */
export const WinnerDetailSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_name: z.string().nullable(),
  user_avatar_url: z.string().nullable(),
  prize_name: z.string(),
  prize_id: z.string(), // Can be empty string if no prize linked
  tickets_at_win: z.number().int().min(0),
  won_at: z.string(),
});

/**
 * Type for winner detail in history view
 */
export type WinnerDetail = z.infer<typeof WinnerDetailSchema>;

/**
 * Schema for multi-winner statistics
 */
export const MultiWinnerStatSchema = z.object({
  user_id: z.string().uuid(),
  user_name: z.string().nullable(),
  user_avatar_url: z.string().nullable(),
  win_count: z.number().int().min(2),
  last_win_at: z.string(),
});

/**
 * Type for multi-winner fairness tracking
 */
export type MultiWinnerStat = z.infer<typeof MultiWinnerStatSchema>;
