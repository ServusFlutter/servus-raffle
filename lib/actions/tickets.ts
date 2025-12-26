"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  JoinRaffleSchema,
  type Participant,
} from "@/lib/schemas/participant";

/**
 * ActionResult type for consistent Server Action responses
 * Following project pattern: ALWAYS return { data, error } - NEVER throw
 */
type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Join result includes participant data and whether this was a new join
 */
export type JoinRaffleResult = {
  participant: Participant;
  isNewJoin: boolean;
};

/**
 * Join a raffle as the current authenticated user
 *
 * Handles the complete join flow:
 * 1. Validates raffle ID format
 * 2. Verifies user is authenticated
 * 3. Checks raffle exists and is active
 * 4. Uses upsert to handle duplicate joins gracefully (AC #4)
 * 5. Returns participant record with ticket count
 *
 * @param raffleId - UUID of the raffle to join
 * @returns ActionResult with JoinRaffleResult or error
 *
 * @example
 * const result = await joinRaffle("123e4567-e89b-12d3-a456-426614174000");
 * if (result.error) {
 *   toast.error(result.error);
 * } else {
 *   redirect(`/participant/raffle/${result.data.participant.raffle_id}`);
 * }
 */
export async function joinRaffle(
  raffleId: string
): Promise<ActionResult<JoinRaffleResult>> {
  try {
    // Validate input
    const parsed = JoinRaffleSchema.safeParse({ raffleId });
    if (!parsed.success) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // Use regular client for auth (reads cookies)
    const supabase = await createClient();
    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: "Not authenticated" };
    }

    // Check raffle exists and is active
    const { data: raffle, error: raffleError } = await adminClient
      .from("raffles")
      .select("id, status, qr_code_expires_at")
      .eq("id", raffleId)
      .single();

    if (raffleError || !raffle) {
      return { data: null, error: "Raffle not found" };
    }

    if (raffle.status !== "active") {
      return { data: null, error: "Raffle is not active" };
    }

    // Check for existing participation first
    const { data: existingParticipant } = await adminClient
      .from("participants")
      .select("*")
      .eq("raffle_id", raffleId)
      .eq("user_id", user.id)
      .single();

    if (existingParticipant) {
      // Already joined - return existing record (AC #4)
      return {
        data: {
          participant: existingParticipant,
          isNewJoin: false,
        },
        error: null,
      };
    }

    // Insert new participant record
    const { data: newParticipant, error: insertError } = await adminClient
      .from("participants")
      .insert({
        raffle_id: raffleId,
        user_id: user.id,
        ticket_count: 1,
      })
      .select()
      .single();

    if (insertError) {
      // Handle race condition - record was created between check and insert
      if (insertError.code === "23505") {
        // Unique constraint violation - fetch existing
        const { data: existing } = await adminClient
          .from("participants")
          .select("*")
          .eq("raffle_id", raffleId)
          .eq("user_id", user.id)
          .single();

        if (existing) {
          return {
            data: {
              participant: existing,
              isNewJoin: false,
            },
            error: null,
          };
        }
      }

      console.error("Failed to join raffle:", insertError);
      return { data: null, error: "Failed to join raffle" };
    }

    return {
      data: {
        participant: newParticipant,
        isNewJoin: true,
      },
      error: null,
    };
  } catch (e) {
    console.error("Unexpected error joining raffle:", e);
    return { data: null, error: "Failed to join raffle" };
  }
}

/**
 * Get participant record for the current user in a specific raffle
 *
 * @param raffleId - UUID of the raffle
 * @returns ActionResult with Participant or null if not joined
 */
export async function getParticipation(
  raffleId: string
): Promise<ActionResult<Participant | null>> {
  try {
    const parsed = JoinRaffleSchema.safeParse({ raffleId });
    if (!parsed.success) {
      return { data: null, error: "Invalid raffle ID" };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data: participant, error } = await supabase
      .from("participants")
      .select("*")
      .eq("raffle_id", raffleId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      // No participant record found is not an error
      if (error.code === "PGRST116") {
        return { data: null, error: null };
      }
      console.error("Failed to get participation:", error);
      return { data: null, error: "Failed to get participation" };
    }

    return { data: participant, error: null };
  } catch (e) {
    console.error("Unexpected error getting participation:", e);
    return { data: null, error: "Failed to get participation" };
  }
}

/**
 * Get accumulated ticket count for the current authenticated user
 *
 * Calculates the total ticket count across all raffles the user has participated in,
 * excluding tickets from before their last win (if any). This implements the
 * "tickets reset after winning" behavior.
 *
 * AC #1: Display accumulated ticket count
 * AC #2: Exclude won raffle tickets
 * AC #4: Post-win ticket reset in display
 * AC #5: Query performance (uses indexed queries)
 *
 * @returns ActionResult with accumulated ticket count or error
 *
 * @example
 * const result = await getAccumulatedTickets();
 * if (result.error) {
 *   toast.error(result.error);
 * } else {
 *   console.log(`You have ${result.data} tickets!`);
 * }
 */
export async function getAccumulatedTickets(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: "Not authenticated" };
    }

    // Step 1: Find user's last win timestamp
    const { data: lastWin } = await supabase
      .from("winners")
      .select("won_at")
      .eq("user_id", user.id)
      .order("won_at", { ascending: false })
      .limit(1)
      .single();

    // Step 2: Build query for accumulated tickets
    let query = supabase
      .from("participants")
      .select("ticket_count")
      .eq("user_id", user.id);

    // Step 3: If user has won before, only count tickets after last win
    if (lastWin?.won_at) {
      query = query.gt("joined_at", lastWin.won_at);
    }

    const { data: participations, error } = await query;

    if (error) {
      console.error("Failed to get accumulated tickets:", error);
      return { data: null, error: "Failed to get ticket count" };
    }

    // Sum all ticket counts
    const total =
      participations?.reduce((sum, p) => sum + (p.ticket_count || 0), 0) || 0;

    return { data: total, error: null };
  } catch (e) {
    console.error("Unexpected error getting accumulated tickets:", e);
    return { data: null, error: "Failed to get ticket count" };
  }
}
