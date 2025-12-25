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
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

/**
 * Sanitize user input to prevent XSS and clean whitespace
 * @param input - Raw user input string
 * @returns Sanitized string
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .slice(0, 255); // Limit length
}

/**
 * Sign up a new user with email, password, and name
 * Creates auth user and user profile in a single operation
 *
 * @param email - User's email address
 * @param password - User's password (min 8 characters)
 * @param name - User's display name
 * @returns ActionResult with user data or error
 */
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<ActionResult<DbUser>> {
  try {
    // Server-side validation
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = sanitizeInput(name);

    if (!sanitizedEmail || !sanitizedName) {
      return { data: null, error: "Email and name are required" };
    }

    // Password validation (must match client-side requirements)
    if (password.length < 8) {
      return { data: null, error: "Password must be at least 8 characters" };
    }

    const supabase = await createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
    });

    if (authError) {
      // Handle specific error cases with user-friendly messages
      if (authError.message.includes("already registered")) {
        return { data: null, error: "An account with this email already exists" };
      }
      console.error("Auth error during signup:", authError);
      return { data: null, error: "Failed to create account" };
    }

    if (!authData.user) {
      return { data: null, error: "Failed to create account" };
    }

    // 2. Create user profile in users table
    const { data: user, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: sanitizedEmail,
        name: sanitizedName,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Database error creating profile:", profileError);
      // Note: Auth user was created but profile failed
      // In production, you might want to clean up the auth user here
      return { data: null, error: "Account created but profile setup failed" };
    }

    // Revalidate paths to reflect authenticated state
    revalidatePath("/", "layout");

    return { data: user, error: null };
  } catch (e) {
    console.error("Unexpected error during signup:", e);
    return { data: null, error: "Failed to create account" };
  }
}

/**
 * Sign in an existing user with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns ActionResult with user data or error
 */
export async function signIn(
  email: string,
  password: string
): Promise<ActionResult<DbUser>> {
  try {
    const supabase = await createClient();

    // Sign in with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      // Return generic error message for security (don't reveal if email exists)
      console.error("Auth error during signin:", authError);
      return { data: null, error: "Invalid email or password" };
    }

    if (!authData.user) {
      return { data: null, error: "Invalid email or password" };
    }

    // Get user profile from users table
    const { data: user, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      console.error("Database error fetching profile:", profileError);
      // User is authenticated but profile not found - edge case
      return { data: null, error: "Profile not found" };
    }

    // Revalidate paths to reflect authenticated state
    revalidatePath("/", "layout");

    return { data: user, error: null };
  } catch (e) {
    console.error("Unexpected error during signin:", e);
    return { data: null, error: "Failed to sign in" };
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
