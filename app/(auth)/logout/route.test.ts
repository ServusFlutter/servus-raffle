/**
 * @jest-environment node
 */
import { GET, POST } from "./route";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NextResponse, NextRequest } from "next/server";

jest.mock("@/lib/supabase/server");
jest.mock("next/navigation");

interface MockSupabaseClient {
  auth: {
    signOut: jest.Mock;
  };
}

describe("Logout Route Handler", () => {
  let mockSupabase: MockSupabaseClient;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        signOut: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // Create mock request with proper nextUrl
    mockRequest = new NextRequest(new URL("http://localhost:3000/logout"));
  });

  describe("POST /logout", () => {
    it("should sign out user and call redirect", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      (redirect as jest.Mock).mockReturnValue(
        NextResponse.redirect(new URL("/login", "http://localhost:3000"))
      );

      // Act
      const result = await POST();

      // Assert
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith("/login");
      expect(result).toBeDefined();
    });

    it("should return error response when signOut fails", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: "Session expired" },
      });

      // Act
      const response = await POST();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to sign out" });
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
    });

    it("should handle unexpected errors gracefully", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockRejectedValue(
        new Error("Network error")
      );

      // Act
      const response = await POST();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Failed to sign out" });
      expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
    });
  });

  describe("GET /logout", () => {
    it("should sign out user and redirect to login via GET", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Temporary redirect
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
      expect(response.headers.get("location")).toContain("/login");
    });

    it("should redirect to login even when signOut fails (GET)", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: "Session expired" },
      });

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Still redirects
      expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
      expect(response.headers.get("location")).toContain("/login");
    });

    it("should handle unexpected errors in GET request", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockRejectedValue(
        new Error("Network error")
      );

      // Act
      const response = await GET(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Still redirects to login
      expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
      expect(response.headers.get("location")).toContain("/login");
    });
  });
});
