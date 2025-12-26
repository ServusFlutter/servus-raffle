"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/utils/admin";
import {
  CreatePrizeSchema,
  UpdatePrizeSchema,
  type Prize,
} from "@/lib/schemas/prize";
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
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .slice(0, 255);
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
 * UUID regex for validation
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Create a new prize for a raffle
 *
 * @param raffleId - UUID of the raffle to add the prize to
 * @param name - Name of the prize
 * @param description - Optional description of the prize
 * @returns ActionResult with the created prize or error
 *
 * @example
 * ```typescript
 * const result = await createPrize(
 *   "123e4567-...",
 *   "Amazon Gift Card",
 *   "$50 Amazon gift card"
 * )
 * if (result.error) {
 *   toast.error(result.error)
 * } else {
 *   toast.success("Prize added!")
 * }
 * ```
 */
export async function createPrize(
  raffleId: string,
  name: string,
  description?: string | null
): Promise<ActionResult<Prize>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format for raffleId
    if (!UUID_REGEX.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Sanitize and validate input with Zod
    const sanitizedName = sanitizeInput(name);
    const sanitizedDescription = description ? sanitizeInput(description) : null;

    const validation = CreatePrizeSchema.safeParse({
      name: sanitizedName,
      description: sanitizedDescription,
    });

    if (!validation.success) {
      const errorMessage =
        validation.error.issues[0]?.message || "Invalid input";
      return { data: null, error: errorMessage };
    }

    // 4. Get service role client
    const serviceClient = createServiceRoleClient();

    // 5. Verify raffle exists
    const { data: raffle, error: raffleError } = await serviceClient
      .from("raffles")
      .select("id")
      .eq("id", raffleId)
      .single();

    if (raffleError || !raffle) {
      return { data: null, error: "Raffle not found" };
    }

    // 6. Get next sort_order for this raffle
    const { data: maxSortOrder } = await serviceClient
      .from("prizes")
      .select("sort_order")
      .eq("raffle_id", raffleId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = maxSortOrder ? maxSortOrder.sort_order + 1 : 0;

    // 7. Insert prize
    const { data, error } = await serviceClient
      .from("prizes")
      .insert({
        raffle_id: raffleId,
        name: validation.data.name,
        description: validation.data.description || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error creating prize:", error);
      return { data: null, error: "Failed to create prize" };
    }

    // 8. Revalidate paths
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/prizes`);

    return { data: data as Prize, error: null };
  } catch (e) {
    console.error("Unexpected error creating prize:", e);
    return { data: null, error: "Failed to create prize" };
  }
}

/**
 * Get all prizes for a raffle
 *
 * @param raffleId - UUID of the raffle to get prizes for
 * @returns ActionResult with array of prizes or error
 *
 * @example
 * ```typescript
 * const result = await getPrizes("123e4567-...")
 * if (result.data) {
 *   setPrizes(result.data)
 * }
 * ```
 */
export async function getPrizes(raffleId: string): Promise<ActionResult<Prize[]>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format
    if (!UUID_REGEX.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Fetch prizes using service role client
    const serviceClient = createServiceRoleClient();

    const { data, error } = await serviceClient
      .from("prizes")
      .select("*")
      .eq("raffle_id", raffleId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Database error fetching prizes:", error);
      return { data: null, error: "Failed to fetch prizes" };
    }

    return { data: data as Prize[], error: null };
  } catch (e) {
    console.error("Unexpected error fetching prizes:", e);
    return { data: null, error: "Failed to fetch prizes" };
  }
}

/**
 * Update an existing prize
 *
 * @param prizeId - UUID of the prize to update
 * @param name - New name for the prize
 * @param description - New description for the prize (optional)
 * @returns ActionResult with the updated prize or error
 *
 * @example
 * ```typescript
 * const result = await updatePrize("prize-123", "New Name", "New description")
 * if (result.error) {
 *   toast.error(result.error)
 * } else {
 *   toast.success("Prize updated!")
 * }
 * ```
 */
export async function updatePrize(
  prizeId: string,
  name: string,
  description?: string | null
): Promise<ActionResult<Prize>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Sanitize and validate input
    const sanitizedName = sanitizeInput(name);
    const sanitizedDescription = description ? sanitizeInput(description) : null;

    const validation = UpdatePrizeSchema.safeParse({
      prizeId,
      name: sanitizedName,
      description: sanitizedDescription,
    });

    if (!validation.success) {
      const errorMessage =
        validation.error.issues[0]?.message || "Invalid input";
      return { data: null, error: errorMessage };
    }

    // 3. Get service role client
    const serviceClient = createServiceRoleClient();

    // 4. Update prize
    const { data, error } = await serviceClient
      .from("prizes")
      .update({
        name: validation.data.name,
        description: validation.data.description || null,
      })
      .eq("id", prizeId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Prize not found" };
      }
      console.error("Database error updating prize:", error);
      return { data: null, error: "Failed to update prize" };
    }

    // 5. Revalidate paths
    revalidatePath(`/admin/raffles/${data.raffle_id}`);
    revalidatePath(`/admin/raffles/${data.raffle_id}/prizes`);

    return { data: data as Prize, error: null };
  } catch (e) {
    console.error("Unexpected error updating prize:", e);
    return { data: null, error: "Failed to update prize" };
  }
}

/**
 * Delete a prize
 *
 * @param prizeId - UUID of the prize to delete
 * @returns ActionResult with success boolean or error
 *
 * @example
 * ```typescript
 * const result = await deletePrize("prize-123")
 * if (result.error) {
 *   toast.error(result.error)
 * } else {
 *   toast.success("Prize deleted!")
 * }
 * ```
 */
export async function deletePrize(
  prizeId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format
    if (!UUID_REGEX.test(prizeId)) {
      return { data: null, error: "Invalid prize ID" };
    }

    // 3. Get service role client
    const serviceClient = createServiceRoleClient();

    // 4. Get prize's raffle_id for path revalidation before deleting
    const { data: prize, error: fetchError } = await serviceClient
      .from("prizes")
      .select("raffle_id")
      .eq("id", prizeId)
      .single();

    if (fetchError || !prize) {
      if (fetchError?.code === "PGRST116") {
        return { data: null, error: "Prize not found" };
      }
      return { data: null, error: "Failed to find prize" };
    }

    // 5. Delete prize
    const { error } = await serviceClient
      .from("prizes")
      .delete()
      .eq("id", prizeId);

    if (error) {
      console.error("Database error deleting prize:", error);
      return { data: null, error: "Failed to delete prize" };
    }

    // 6. Revalidate paths
    revalidatePath(`/admin/raffles/${prize.raffle_id}`);
    revalidatePath(`/admin/raffles/${prize.raffle_id}/prizes`);

    return { data: { success: true }, error: null };
  } catch (e) {
    console.error("Unexpected error deleting prize:", e);
    return { data: null, error: "Failed to delete prize" };
  }
}

/**
 * Get the count of prizes for a raffle
 *
 * @param raffleId - UUID of the raffle
 * @returns ActionResult with the prize count or error
 */
export async function getPrizeCount(
  raffleId: string
): Promise<ActionResult<number>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate UUID format
    if (!UUID_REGEX.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Get count using service role client
    const serviceClient = createServiceRoleClient();

    const { count, error } = await serviceClient
      .from("prizes")
      .select("*", { count: "exact", head: true })
      .eq("raffle_id", raffleId);

    if (error) {
      console.error("Database error counting prizes:", error);
      return { data: null, error: "Failed to count prizes" };
    }

    return { data: count ?? 0, error: null };
  } catch (e) {
    console.error("Unexpected error counting prizes:", e);
    return { data: null, error: "Failed to count prizes" };
  }
}
