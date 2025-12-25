import { createClient } from "@/lib/supabase/server";
import { syncMeetupProfile } from "@/lib/actions/auth";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate required parameters
  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_code", request.url)
    );
  }

  // Validate state parameter for CSRF protection
  if (!state) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_state", request.url)
    );
  }

  try {
    // Validate environment variables
    const clientId = process.env.NEXT_PUBLIC_MEETUP_CLIENT_ID;
    const clientSecret = process.env.MEETUP_CLIENT_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!clientId || !clientSecret) {
      throw new Error("Meetup OAuth credentials are not configured");
    }

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase configuration is missing");
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      "https://secure.meetup.com/oauth2/access",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          redirect_uri: `${request.nextUrl.origin}/auth/callback`,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      throw new Error("Failed to exchange authorization code");
    }

    const tokenData = await tokenResponse.json();
    const meetupAccessToken = tokenData.access_token;

    if (!meetupAccessToken) {
      throw new Error("No access token received");
    }

    // Fetch user profile from Meetup GraphQL API
    const profileResponse = await fetch("https://api.meetup.com/gql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${meetupAccessToken}`,
      },
      body: JSON.stringify({
        query: `
          query {
            self {
              id
              name
              photo {
                baseUrl
              }
            }
          }
        `,
      }),
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error("Profile fetch failed:", errorText);
      throw new Error("Failed to fetch user profile");
    }

    const profileData = await profileResponse.json();
    const meetupUser = profileData.data?.self;

    if (!meetupUser || !meetupUser.id) {
      throw new Error("Invalid profile data received");
    }

    // Use service role client for admin operations
    const supabaseAdmin = createServiceClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Use meetup ID as unique identifier in email format
    const email = `${meetupUser.id}@meetup.servus-raffle.app`;

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find((u) => u.email === email);

    let authUserId: string;

    if (existingUser) {
      // User exists, use their ID
      authUserId = existingUser.id;
    } else {
      // Create new user using admin API
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            meetup_id: meetupUser.id,
            name: meetupUser.name,
          },
        });

      if (createError || !newUser.user) {
        console.error("Create user error:", createError);
        throw new Error("Failed to create user account");
      }

      authUserId = newUser.user.id;
    }

    // Sync Meetup profile to our users table using service role client
    // This bypasses RLS policies since we're in the OAuth callback context
    const { error: syncError } = await syncMeetupProfile(
      {
        authUserId,
        meetupId: meetupUser.id,
        name: meetupUser.name || "Anonymous",
        avatarUrl: meetupUser.photo?.baseUrl || null,
      },
      supabaseAdmin
    );

    if (syncError) {
      console.error("Profile sync error:", syncError);
      throw new Error("Failed to sync user profile");
    }

    // Create a session token for the user using admin API
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (sessionError || !sessionData) {
      console.error("Session creation error:", sessionError);
      throw new Error("Failed to create session");
    }

    // The magiclink response includes an action_link we can parse
    // Or we can use a different approach: sign in with OTP
    // For now, let's use a simpler approach with a redirect that includes the session

    // Alternative: Use the hash from the action_link to set session
    const actionLink = sessionData.properties.action_link;
    const hashMatch = actionLink.match(/#(.+)$/);

    if (!hashMatch) {
      throw new Error("Failed to extract session from action link");
    }

    const hashParams = new URLSearchParams(hashMatch[1]);
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      throw new Error("Failed to extract tokens from action link");
    }

    // Get the regular client and set the session
    const supabase = await createClient();
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (setSessionError) {
      console.error("Set session error:", setSessionError);
      throw new Error("Failed to set session");
    }

    // Redirect to participant dashboard
    const redirectUrl = new URL("/participant", request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("OAuth callback error:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
