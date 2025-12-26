import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /logout
 * Logs out the current user and redirects to login page
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return NextResponse.json(
        { error: "Failed to sign out" },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          }
        }
      );
    }

    // Redirect to login page after successful logout
    return redirect("/login");
  } catch (e) {
    console.error("Unexpected logout error:", e);
    return NextResponse.json(
      { error: "Failed to sign out" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      }
    );
  }
}

/**
 * GET /logout
 * Also support GET for simple link-based logout (convenience)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    // Use request URL to construct redirect (works in any environment)
    const redirectUrl = new URL("/login", request.nextUrl.origin);

    if (error) {
      console.error("Logout error:", error);
      // Still redirect to login even on error to avoid showing stale auth state
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    }

    // Redirect to login page after successful logout
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (e) {
    console.error("Unexpected logout error:", e);
    // Still redirect to login even on error to avoid showing stale auth state
    const redirectUrl = new URL("/login", request.nextUrl.origin);
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }
}
