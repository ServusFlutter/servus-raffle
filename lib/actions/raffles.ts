"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/utils/admin";
import {
  CreateRaffleSchema,
  ActivateRaffleSchema,
  type Raffle,
} from "@/lib/schemas/raffle";
import { revalidatePath } from "next/cache";

/**
 * ActionResult type for consistent Server Action responses
 */
type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Creates a Supabase client with service role for admin operations
 * This bypasses RLS and should only be used after admin validation
 */
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Sanitize user input to prevent XSS and clean whitespace
 *
 * Removes/encodes potentially dangerous characters:
 * - HTML tags and entities (<, >, &, ", ')
 * - Control characters
 * - Null bytes
 *
 * @param input - Raw user input string
 * @returns Sanitized string
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    // Remove null bytes and control characters (except newlines/tabs for multiline fields)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Encode HTML entities to prevent XSS
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .slice(0, 255); // Limit length
}

/**
 * Get the current authenticated user and verify admin status
 * @returns The user if admin, null otherwise
 */
async function getAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email || !isAdmin(user.email)) {
    return null;
  }

  return user;
}

/**
 * Create a new raffle
 *
 * @param name - Name of the raffle
 * @returns ActionResult with the created raffle or error
 *
 * @example
 * ```typescript
 * const result = await createRaffle("December Meetup Raffle")
 * if (result.error) {
 *   toast.error(result.error)
 * } else {
 *   router.push(`/admin/raffles/${result.data.id}`)
 * }
 * ```
 */
export async function createRaffle(name: string): Promise<ActionResult<Raffle>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Sanitize and validate input
    const sanitizedName = sanitizeInput(name);
    const validation = CreateRaffleSchema.safeParse({ name: sanitizedName });

    if (!validation.success) {
      // Zod v4 uses 'issues' instead of 'errors'
      const errorMessage = validation.error.issues[0]?.message || "Invalid input";
      return { data: null, error: errorMessage };
    }

    // 3. Create raffle using service role client
    const serviceClient = createServiceRoleClient();

    const { data, error } = await serviceClient
      .from("raffles")
      .insert({
        name: validation.data.name,
        status: "draft",
        created_by: adminUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error creating raffle:", error);
      return { data: null, error: "Failed to create raffle" };
    }

    // 4. Revalidate admin pages to show new raffle
    revalidatePath("/admin");
    revalidatePath("/admin/raffles");

    return { data: data as Raffle, error: null };
  } catch (e) {
    console.error("Unexpected error creating raffle:", e);
    return { data: null, error: "Failed to create raffle" };
  }
}

/**
 * Get all raffles for the admin dashboard
 * Returns raffles ordered by creation date (newest first)
 *
 * @returns ActionResult with array of raffles or error
 *
 * @example
 * ```typescript
 * const result = await getRaffles()
 * if (result.data) {
 *   setRaffles(result.data)
 * }
 * ```
 */
export async function getRaffles(): Promise<ActionResult<Raffle[]>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Fetch raffles using service role client
    const serviceClient = createServiceRoleClient();

    const { data, error } = await serviceClient
      .from("raffles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error fetching raffles:", error);
      return { data: null, error: "Failed to fetch raffles" };
    }

    return { data: data as Raffle[], error: null };
  } catch (e) {
    console.error("Unexpected error fetching raffles:", e);
    return { data: null, error: "Failed to fetch raffles" };
  }
}

/**
 * Get a single raffle by ID
 *
 * @param id - UUID of the raffle to fetch
 * @returns ActionResult with the raffle or error
 *
 * @example
 * ```typescript
 * const result = await getRaffle("123e4567-e89b-12d3-a456-426614174000")
 * if (result.data) {
 *   setRaffle(result.data)
 * }
 * ```
 */
export async function getRaffle(id: string): Promise<ActionResult<Raffle>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Fetch raffle using service role client
    const serviceClient = createServiceRoleClient();

    const { data, error } = await serviceClient
      .from("raffles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Raffle not found" };
      }
      console.error("Database error fetching raffle:", error);
      return { data: null, error: "Failed to fetch raffle" };
    }

    return { data: data as Raffle, error: null };
  } catch (e) {
    console.error("Unexpected error fetching raffle:", e);
    return { data: null, error: "Failed to fetch raffle" };
  }
}

/**
 * Activate a raffle by setting QR code expiration and changing status to active
 *
 * This is an atomic operation that:
 * 1. Validates the raffle is in draft status
 * 2. Calculates the expiration timestamp from the duration
 * 3. Updates both status and qr_code_expires_at in a single database call
 *
 * @param raffleId - UUID of the raffle to activate
 * @param durationMinutes - Duration until QR code expires (15-1440 minutes)
 * @returns ActionResult with the updated expiration timestamp or error
 *
 * @example
 * ```typescript
 * const result = await activateRaffle("123e4567-...", 180) // 3 hours
 * if (result.data) {
 *   console.log("QR expires at:", result.data.qr_code_expires_at)
 * }
 * ```
 */
export async function activateRaffle(
  raffleId: string,
  durationMinutes: number
): Promise<ActionResult<{ qr_code_expires_at: string }>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate input with Zod schema
    const parsed = ActivateRaffleSchema.safeParse({ raffleId, durationMinutes });
    if (!parsed.success) {
      const errorMessage = parsed.error.issues[0]?.message || "Invalid input";
      return { data: null, error: errorMessage };
    }

    // 3. Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // 4. Update raffle atomically (only if status is draft)
    const serviceClient = createServiceRoleClient();

    const { data, error } = await serviceClient
      .from("raffles")
      .update({
        status: "active",
        qr_code_expires_at: expiresAt.toISOString(),
      })
      .eq("id", raffleId)
      .eq("status", "draft") // Only activate draft raffles
      .select("qr_code_expires_at")
      .single();

    if (error) {
      // PGRST116 means no rows matched the filter (raffle not found or not draft)
      if (error.code === "PGRST116") {
        return { data: null, error: "Raffle not found or already activated" };
      }
      console.error("Database error activating raffle:", error);
      return { data: null, error: "Failed to activate raffle" };
    }

    // 5. Revalidate pages to reflect new status
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/qr`);
    revalidatePath("/admin");
    revalidatePath("/admin/raffles");

    return { data: { qr_code_expires_at: data.qr_code_expires_at }, error: null };
  } catch (e) {
    console.error("Unexpected error activating raffle:", e);
    return { data: null, error: "Failed to activate raffle" };
  }
}

/**
 * Regenerate QR code for an expired or active raffle
 *
 * This allows admins to extend or reset the QR code expiration
 * for a raffle that is already active or has expired.
 *
 * @param raffleId - UUID of the raffle to regenerate QR for
 * @param durationMinutes - New duration until QR code expires (15-1440 minutes)
 * @returns ActionResult with the new expiration timestamp or error
 *
 * @example
 * ```typescript
 * const result = await regenerateQrCode("123e4567-...", 60) // Extend by 1 hour
 * if (result.data) {
 *   console.log("New expiration:", result.data.qr_code_expires_at)
 * }
 * ```
 */
/**
 * Update raffle status (admin only)
 *
 * Used to transition raffle to 'completed' after all prizes awarded.
 * Story 6.7: Sequential Prize Drawing & Raffle Completion
 *
 * @param raffleId - UUID of the raffle
 * @param status - New status ('drawing' | 'completed')
 * @returns ActionResult with success or error
 *
 * @example
 * ```typescript
 * const result = await updateRaffleStatus(raffleId, "completed");
 * if (result.error) {
 *   toast.error(result.error);
 * }
 * ```
 */
export async function updateRaffleStatus(
  raffleId: string,
  status: "drawing" | "completed"
): Promise<ActionResult<{ status: string }>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Validate status value
    if (status !== "drawing" && status !== "completed") {
      return { data: null, error: "Invalid status value" };
    }

    // 4. Update raffle status
    const serviceClient = createServiceRoleClient();

    const { data, error } = await serviceClient
      .from("raffles")
      .update({ status })
      .eq("id", raffleId)
      .select("status")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Raffle not found" };
      }
      console.error("Database error updating raffle status:", error);
      return { data: null, error: "Failed to update raffle status" };
    }

    // 5. Revalidate relevant paths
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/live`);
    revalidatePath("/admin");
    revalidatePath("/admin/history");

    return { data: { status: data.status }, error: null };
  } catch (e) {
    console.error("Unexpected error updating raffle status:", e);
    return { data: null, error: "Failed to update raffle status" };
  }
}

/**
 * Raffle with winner count for dashboard display
 * Story 6.7 AC #6
 */
export type RaffleWithWinnerCount = Raffle & {
  winner_count: number;
};

/**
 * Get all raffles with winner counts for the admin dashboard
 * Returns raffles ordered by creation date (newest first)
 * Includes winner count for completed raffles
 *
 * Story 6.7: Added winner count for dashboard display
 *
 * @returns ActionResult with array of raffles with winner counts or error
 *
 * @example
 * ```typescript
 * const result = await getRafflesWithWinnerCount()
 * if (result.data) {
 *   setRaffles(result.data)
 * }
 * ```
 */
export async function getRafflesWithWinnerCount(): Promise<ActionResult<RaffleWithWinnerCount[]>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Fetch raffles using service role client
    const serviceClient = createServiceRoleClient();

    const { data: raffles, error: rafflesError } = await serviceClient
      .from("raffles")
      .select("*")
      .order("created_at", { ascending: false });

    if (rafflesError) {
      console.error("Database error fetching raffles:", rafflesError);
      return { data: null, error: "Failed to fetch raffles" };
    }

    if (!raffles) {
      return { data: [], error: null };
    }

    // 3. Get winner counts for all raffles in one query
    const { data: winnerCounts, error: winnerCountsError } = await serviceClient
      .from("winners")
      .select("raffle_id");

    if (winnerCountsError) {
      console.error("Database error fetching winner counts:", winnerCountsError);
      // Continue without winner counts
    }

    // 4. Count winners per raffle
    const winnerCountMap = new Map<string, number>();
    if (winnerCounts) {
      for (const winner of winnerCounts) {
        const current = winnerCountMap.get(winner.raffle_id) || 0;
        winnerCountMap.set(winner.raffle_id, current + 1);
      }
    }

    // 5. Combine raffles with winner counts
    const rafflesWithCounts: RaffleWithWinnerCount[] = raffles.map((raffle) => ({
      ...(raffle as Raffle),
      winner_count: winnerCountMap.get(raffle.id) || 0,
    }));

    return { data: rafflesWithCounts, error: null };
  } catch (e) {
    console.error("Unexpected error fetching raffles with winner count:", e);
    return { data: null, error: "Failed to fetch raffles" };
  }
}

export async function regenerateQrCode(
  raffleId: string,
  durationMinutes: number
): Promise<ActionResult<{ qr_code_expires_at: string }>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate input with Zod schema
    const parsed = ActivateRaffleSchema.safeParse({ raffleId, durationMinutes });
    if (!parsed.success) {
      const errorMessage = parsed.error.issues[0]?.message || "Invalid input";
      return { data: null, error: errorMessage };
    }

    // 3. Calculate new expiration timestamp
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // 4. Update raffle (must be active status to regenerate)
    const serviceClient = createServiceRoleClient();

    // First, check if raffle exists and is in a valid state for regeneration
    const { data: raffle, error: fetchError } = await serviceClient
      .from("raffles")
      .select("status")
      .eq("id", raffleId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return { data: null, error: "Raffle not found" };
      }
      console.error("Database error fetching raffle:", fetchError);
      return { data: null, error: "Failed to regenerate QR code" };
    }

    // Only allow regeneration for active raffles
    if (raffle.status !== "active") {
      return {
        data: null,
        error:
          raffle.status === "draft"
            ? "Cannot regenerate QR for draft raffle. Use activate instead."
            : "Cannot regenerate QR for completed raffle",
      };
    }

    // 5. Update expiration timestamp
    const { data, error } = await serviceClient
      .from("raffles")
      .update({
        qr_code_expires_at: expiresAt.toISOString(),
      })
      .eq("id", raffleId)
      .select("qr_code_expires_at")
      .single();

    if (error) {
      console.error("Database error regenerating QR code:", error);
      return { data: null, error: "Failed to regenerate QR code" };
    }

    // 6. Revalidate pages
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/qr`);
    revalidatePath("/admin");
    revalidatePath("/admin/raffles");

    return { data: { qr_code_expires_at: data.qr_code_expires_at }, error: null };
  } catch (e) {
    console.error("Unexpected error regenerating QR code:", e);
    return { data: null, error: "Failed to regenerate QR code" };
  }
}
