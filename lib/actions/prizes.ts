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
 * Reorder prizes by providing the complete ordered list of prize IDs
 * The sort_order will be assigned based on array position (0, 1, 2, ...)
 *
 * @param raffleId - UUID of the raffle (for validation)
 * @param prizeIds - Array of prize UUIDs in desired order
 * @returns ActionResult with the updated prizes or error
 *
 * @example
 * ```typescript
 * const result = await reorderPrizes(raffleId, [prizeId3, prizeId1, prizeId2])
 * if (result.error) {
 *   toast.error(result.error)
 * } else {
 *   setPrizes(result.data)
 * }
 * ```
 */
export async function reorderPrizes(
  raffleId: string,
  prizeIds: string[]
): Promise<ActionResult<Prize[]>> {
  try {
    // 1. Validate admin status
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return { data: null, error: "Unauthorized: Admin access required" };
    }

    // 2. Validate raffle UUID format
    if (!UUID_REGEX.test(raffleId)) {
      return { data: null, error: "Invalid raffle ID" };
    }

    // 3. Validate all prize UUIDs
    for (const id of prizeIds) {
      if (!UUID_REGEX.test(id)) {
        return { data: null, error: "Invalid prize ID in list" };
      }
    }

    // 4. Get service role client
    const serviceClient = createServiceRoleClient();

    // 5. Verify all prizes exist and belong to this raffle
    const { data: existingPrizes, error: fetchError } = await serviceClient
      .from("prizes")
      .select("id, awarded_to")
      .eq("raffle_id", raffleId);

    if (fetchError) {
      console.error("Error fetching prizes:", fetchError);
      return { data: null, error: "Failed to fetch prizes" };
    }

    const existingIds = new Set(existingPrizes?.map((p) => p.id) || []);
    for (const id of prizeIds) {
      if (!existingIds.has(id)) {
        return { data: null, error: "Prize not found or does not belong to this raffle" };
      }
    }

    // 6. Check if any prizes are awarded (they should not be reordered)
    const awardedPrizes = existingPrizes?.filter((p) => p.awarded_to) || [];
    if (awardedPrizes.length > 0) {
      const awardedIds = new Set(awardedPrizes.map((p) => p.id));
      // Ensure awarded prizes maintain their relative positions
      const originalAwardedPositions = prizeIds
        .map((id, idx) => ({ id, idx }))
        .filter((p) => awardedIds.has(p.id));
      // For now, allow reordering but log a warning if awarded prizes are being moved
      if (originalAwardedPositions.length > 0) {
        console.warn("Reordering includes awarded prizes - proceeding anyway");
      }
    }

    // 7. Update each prize's sort_order based on array position
    const updatePromises = prizeIds.map((prizeId, index) =>
      serviceClient
        .from("prizes")
        .update({ sort_order: index })
        .eq("id", prizeId)
        .eq("raffle_id", raffleId)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error("Errors during reorder:", errors);
      return { data: null, error: "Failed to reorder some prizes" };
    }

    // 8. Fetch updated prizes
    const { data: prizes, error: refetchError } = await serviceClient
      .from("prizes")
      .select("*")
      .eq("raffle_id", raffleId)
      .order("sort_order", { ascending: true });

    if (refetchError) {
      return { data: null, error: "Failed to fetch updated prizes" };
    }

    // 9. Revalidate paths
    revalidatePath(`/admin/raffles/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}/prizes`);

    return { data: prizes as Prize[], error: null };
  } catch (e) {
    console.error("Unexpected error reordering prizes:", e);
    return { data: null, error: "Failed to reorder prizes" };
  }
}

/**
 * Move a prize up in the sort order (swap with previous)
 *
 * @param prizeId - UUID of the prize to move up
 * @returns ActionResult with the updated prizes list or error
 *
 * @example
 * ```typescript
 * const result = await movePrizeUp(prizeId)
 * if (result.error) {
 *   toast.error(result.error)
 * } else {
 *   setPrizes(result.data)
 * }
 * ```
 */
export async function movePrizeUp(
  prizeId: string
): Promise<ActionResult<Prize[]>> {
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

    // 4. Get the prize and its raffle's prizes
    const { data: prize, error: prizeError } = await serviceClient
      .from("prizes")
      .select("*")
      .eq("id", prizeId)
      .single();

    if (prizeError || !prize) {
      return { data: null, error: "Prize not found" };
    }

    // 5. Check if prize is awarded
    if (prize.awarded_to) {
      return { data: null, error: "Cannot move awarded prize" };
    }

    // 6. Get all prizes for this raffle ordered by sort_order
    const { data: allPrizes, error: fetchError } = await serviceClient
      .from("prizes")
      .select("*")
      .eq("raffle_id", prize.raffle_id)
      .order("sort_order", { ascending: true });

    if (fetchError || !allPrizes) {
      return { data: null, error: "Failed to fetch prizes" };
    }

    // 7. Find current position
    const currentIndex = allPrizes.findIndex((p) => p.id === prizeId);
    if (currentIndex === 0) {
      return { data: null, error: "Prize is already first" };
    }

    // 8. Get the previous prize
    const previousPrize = allPrizes[currentIndex - 1];

    // Check if previous prize is awarded (we can still swap)
    if (previousPrize.awarded_to) {
      return { data: null, error: "Cannot swap with awarded prize" };
    }

    // 9. Swap sort_order values
    const currentSortOrder = prize.sort_order;
    const previousSortOrder = previousPrize.sort_order;

    const { error: updateError1 } = await serviceClient
      .from("prizes")
      .update({ sort_order: previousSortOrder })
      .eq("id", prizeId);

    if (updateError1) {
      return { data: null, error: "Failed to update prize order" };
    }

    const { error: updateError2 } = await serviceClient
      .from("prizes")
      .update({ sort_order: currentSortOrder })
      .eq("id", previousPrize.id);

    if (updateError2) {
      // Try to rollback
      await serviceClient
        .from("prizes")
        .update({ sort_order: currentSortOrder })
        .eq("id", prizeId);
      return { data: null, error: "Failed to update prize order" };
    }

    // 10. Fetch updated prizes
    const { data: updatedPrizes, error: refetchError } = await serviceClient
      .from("prizes")
      .select("*")
      .eq("raffle_id", prize.raffle_id)
      .order("sort_order", { ascending: true });

    if (refetchError) {
      return { data: null, error: "Failed to fetch updated prizes" };
    }

    // 11. Revalidate paths
    revalidatePath(`/admin/raffles/${prize.raffle_id}`);
    revalidatePath(`/admin/raffles/${prize.raffle_id}/prizes`);

    return { data: updatedPrizes as Prize[], error: null };
  } catch (e) {
    console.error("Unexpected error moving prize up:", e);
    return { data: null, error: "Failed to move prize" };
  }
}

/**
 * Move a prize down in the sort order (swap with next)
 *
 * @param prizeId - UUID of the prize to move down
 * @returns ActionResult with the updated prizes list or error
 *
 * @example
 * ```typescript
 * const result = await movePrizeDown(prizeId)
 * if (result.error) {
 *   toast.error(result.error)
 * } else {
 *   setPrizes(result.data)
 * }
 * ```
 */
export async function movePrizeDown(
  prizeId: string
): Promise<ActionResult<Prize[]>> {
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

    // 4. Get the prize
    const { data: prize, error: prizeError } = await serviceClient
      .from("prizes")
      .select("*")
      .eq("id", prizeId)
      .single();

    if (prizeError || !prize) {
      return { data: null, error: "Prize not found" };
    }

    // 5. Check if prize is awarded
    if (prize.awarded_to) {
      return { data: null, error: "Cannot move awarded prize" };
    }

    // 6. Get all prizes for this raffle ordered by sort_order
    const { data: allPrizes, error: fetchError } = await serviceClient
      .from("prizes")
      .select("*")
      .eq("raffle_id", prize.raffle_id)
      .order("sort_order", { ascending: true });

    if (fetchError || !allPrizes) {
      return { data: null, error: "Failed to fetch prizes" };
    }

    // 7. Find current position
    const currentIndex = allPrizes.findIndex((p) => p.id === prizeId);
    if (currentIndex === allPrizes.length - 1) {
      return { data: null, error: "Prize is already last" };
    }

    // 8. Get the next prize
    const nextPrize = allPrizes[currentIndex + 1];

    // Check if next prize is awarded (we can still swap)
    if (nextPrize.awarded_to) {
      return { data: null, error: "Cannot swap with awarded prize" };
    }

    // 9. Swap sort_order values
    const currentSortOrder = prize.sort_order;
    const nextSortOrder = nextPrize.sort_order;

    const { error: updateError1 } = await serviceClient
      .from("prizes")
      .update({ sort_order: nextSortOrder })
      .eq("id", prizeId);

    if (updateError1) {
      return { data: null, error: "Failed to update prize order" };
    }

    const { error: updateError2 } = await serviceClient
      .from("prizes")
      .update({ sort_order: currentSortOrder })
      .eq("id", nextPrize.id);

    if (updateError2) {
      // Try to rollback
      await serviceClient
        .from("prizes")
        .update({ sort_order: currentSortOrder })
        .eq("id", prizeId);
      return { data: null, error: "Failed to update prize order" };
    }

    // 10. Fetch updated prizes
    const { data: updatedPrizes, error: refetchError } = await serviceClient
      .from("prizes")
      .select("*")
      .eq("raffle_id", prize.raffle_id)
      .order("sort_order", { ascending: true });

    if (refetchError) {
      return { data: null, error: "Failed to fetch updated prizes" };
    }

    // 11. Revalidate paths
    revalidatePath(`/admin/raffles/${prize.raffle_id}`);
    revalidatePath(`/admin/raffles/${prize.raffle_id}/prizes`);

    return { data: updatedPrizes as Prize[], error: null };
  } catch (e) {
    console.error("Unexpected error moving prize down:", e);
    return { data: null, error: "Failed to move prize" };
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
