/**
 * @jest-environment node
 */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { syncMeetupProfile } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

// Mock dependencies
jest.mock("@/lib/actions/auth");
jest.mock("@/lib/supabase/server");
jest.mock("@supabase/supabase-js");

// Mock fetch globally
global.fetch = jest.fn();

describe("OAuth Callback Handler", () => {
  const mockEnv = {
    NEXT_PUBLIC_MEETUP_CLIENT_ID: "test-client-id",
    MEETUP_CLIENT_SECRET: "test-client-secret",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(process.env, mockEnv);
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    // Clean up environment
    Object.keys(mockEnv).forEach((key) => {
      delete process.env[key];
    });
  });

  it("should redirect to login with error when OAuth error is present", async () => {
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?error=access_denied"
    );

    const response = await GET(request);

    expect(response.status).toBe(307); // Temporary redirect
    expect(response.headers.get("location")).toContain(
      "/auth/login?error=access_denied"
    );
  });

  it("should redirect to login when authorization code is missing", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback");

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/auth/login?error=missing_code"
    );
  });

  it("should redirect to login when state parameter is missing (CSRF protection)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=test-code"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/auth/login?error=missing_state"
    );
  });

  it("should fail when Meetup OAuth credentials are not configured", async () => {
    delete process.env.NEXT_PUBLIC_MEETUP_CLIENT_ID;

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=test-code&state=test-state"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login?error=");
    expect(decodeURIComponent(response.headers.get("location") || "")).toContain(
      "Meetup OAuth credentials are not configured"
    );
  });

  it("should fail when Supabase configuration is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=test-code&state=test-state"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login?error=");
    expect(decodeURIComponent(response.headers.get("location") || "")).toContain(
      "Supabase configuration is missing"
    );
  });

  it("should handle token exchange failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => "Invalid authorization code",
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=invalid-code&state=test-state"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login?error=");
  });

  it("should handle Meetup GraphQL API failure", async () => {
    // Mock successful token exchange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "test-access-token" }),
    });

    // Mock failed profile fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => "Unauthorized",
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=test-code&state=test-state"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login?error=");
  });

  it("should handle invalid profile data from Meetup", async () => {
    // Mock successful token exchange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "test-access-token" }),
    });

    // Mock profile fetch with missing ID
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { self: { name: "Test User" } } }), // Missing id
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=test-code&state=test-state"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login?error=");
  });

  it("should fail if profile sync fails", async () => {
    // Mock successful token exchange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "test-access-token" }),
    });

    // Mock successful profile fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          self: {
            id: "123456",
            name: "Test User",
            photo: { baseUrl: "https://example.com/avatar.jpg" },
          },
        },
      }),
    });

    // Mock Supabase admin client
    const mockSupabaseAdmin = {
      auth: {
        admin: {
          listUsers: jest.fn().mockResolvedValue({ data: { users: [] } }),
          createUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-uuid" } },
            error: null,
          }),
          generateLink: jest.fn().mockResolvedValue({
            data: {
              properties: {
                action_link:
                  "http://example.com#access_token=token&refresh_token=refresh",
              },
            },
            error: null,
          }),
        },
      },
    };

    // Mock supabase client creation
    const { createClient: createServiceClient } = jest.requireMock(
      "@supabase/supabase-js"
    );
    createServiceClient.mockReturnValue(mockSupabaseAdmin);

    // Mock syncMeetupProfile to return error
    (syncMeetupProfile as jest.Mock).mockResolvedValue({
      data: null,
      error: "Database error",
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=test-code&state=test-state"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login?error=");
    expect(decodeURIComponent(response.headers.get("location") || "")).toContain(
      "Failed to sync user profile"
    );
  });
});
