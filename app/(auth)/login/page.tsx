"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMeetupSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build the OAuth authorization URL
      const clientId = process.env.NEXT_PUBLIC_MEETUP_CLIENT_ID;

      if (!clientId) {
        throw new Error("Meetup OAuth is not configured. Please set NEXT_PUBLIC_MEETUP_CLIENT_ID.");
      }

      const redirectUri = `${window.location.origin}/auth/callback`;
      const authUrl = new URL("https://secure.meetup.com/oauth2/authorize");

      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", "basic");

      // Add state parameter for CSRF protection
      const state = crypto.randomUUID();
      sessionStorage.setItem("oauth_state", state);
      authUrl.searchParams.set("state", state);

      // Redirect to Meetup OAuth
      window.location.href = authUrl.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Servus Raffle</CardTitle>
            <CardDescription>
              Sign in with your Meetup.com account to participate in the raffle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleMeetupSignIn}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6.98 14.47c0 1.14-.92 2.06-2.06 2.06s-2.06-.92-2.06-2.06.92-2.06 2.06-2.06 2.06.92 2.06 2.06zm4.13-2.06c-1.14 0-2.06.92-2.06 2.06s.92 2.06 2.06 2.06 2.06-.92 2.06-2.06-.92-2.06-2.06-2.06zm6.19 0c-1.14 0-2.06.92-2.06 2.06s.92 2.06 2.06 2.06 2.06-.92 2.06-2.06-.92-2.06-2.06-2.06zm3.78-6.89c-2.28-3.13-6.78-3.78-10.06-1.45s-4.22 6.78-1.95 9.92c.48.66.28 1.58-.44 2.06L5.5 17.69c-.72.48-.92 1.45-.44 2.17.48.72 1.45.92 2.17.44l3.13-2.08c.72-.48 1.7-.28 2.17.44 2.28 3.13 6.78 3.78 10.06 1.45s4.22-6.78 1.95-9.92c-.48-.66-.28-1.58.44-2.06l3.13-2.08c.72-.48.92-1.45.44-2.17-.48-.72-1.45-.92-2.17-.44l-3.13 2.08c-.72.48-1.7.28-2.17-.44z"/>
                    </svg>
                    Sign in with Meetup
                  </>
                )}
              </Button>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                By signing in, you agree to participate in the raffle using your
                Meetup.com profile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
