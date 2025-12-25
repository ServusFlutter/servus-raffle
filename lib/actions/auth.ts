"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * ActionResult type for consistent Server Action responses
 */
type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Database user type matching the users table schema
 */
type DbUser = {
  id: string;
  meetup_id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

/**
 * Meetup profile data for syncing
 */
type MeetupProfile = {
  authUserId: string;
  meetupId: string;
  name: string;
  avatarUrl: string | null;
};

/**
 * Sync Meetup profile data to the users table
 * Handles both new users and returning users (upsert logic)
 *
 * @param profile - Meetup profile data to sync
 * @param supabaseClient - Optional Supabase client (defaults to server client with RLS)
 * @returns ActionResult with user data or error
 */
export async function syncMeetupProfile(
  profile: MeetupProfile,
  supabaseClient?: any
): Promise<ActionResult<DbUser>> {
  try {
    const supabase = supabaseClient || (await createClient());

    // Upsert user profile
    // - Insert if new user (first time signing in)
    // - Update if returning user (match by meetup_id)
    const { data: user, error } = await supabase
      .from("users")
      .upsert(
        {
          id: profile.authUserId,
          meetup_id: profile.meetupId,
          name: profile.name,
          avatar_url: profile.avatarUrl,
        },
        {
          onConflict: "meetup_id", // Match by meetup_id for returning users
          ignoreDuplicates: false, // Update existing records
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Database error syncing profile:", error);
      return {
        data: null,
        error: "Failed to sync profile",
      };
    }

    return {
      data: user,
      error: null,
    };
  } catch (e) {
    console.error("Unexpected error syncing profile:", e);
    return {
      data: null,
      error: "Failed to sync profile",
    };
  }
}

/**
 * Get the current user's profile from the users table
 *
 * @returns ActionResult with user data or error
 */
export async function getCurrentUser(): Promise<ActionResult<DbUser>> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return {
        data: null,
        error: "Not authenticated",
      };
    }

    // Get user profile from users table
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error) {
      console.error("Database error fetching user:", error);
      return {
        data: null,
        error: "Failed to fetch user profile",
      };
    }

    return {
      data: user,
      error: null,
    };
  } catch (e) {
    console.error("Unexpected error fetching user:", e);
    return {
      data: null,
      error: "Failed to fetch user profile",
    };
  }
}

/**
 * Sign out the current user
 * Clears the session cookie and revalidates all paths
 *
 * @returns ActionResult with void data on success
 */
export async function signOut(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      return {
        data: null,
        error: "Failed to sign out",
      };
    }

    // Revalidate all paths to ensure fresh state after logout
    revalidatePath("/", "layout");

    return {
      data: null,
      error: null,
    };
  } catch (e) {
    console.error("Unexpected error signing out:", e);
    return {
      data: null,
      error: "Failed to sign out",
    };
  }
}
