/**
 * @jest-environment node
 */
import { middleware } from "./middleware";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

jest.mock("@supabase/ssr");

describe("middleware", () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe("protected routes", () => {
    it("should allow authenticated user to access /participant route", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "123", email: "test@example.com" } },
      });

      mockRequest = new NextRequest(
        new URL("http://localhost:4000/participant")
      );

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(response.headers.get("Cache-Control")).toBe(
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      expect(response.headers.get("Pragma")).toBe("no-cache");
      expect(response.headers.get("Expires")).toBe("0");
    });

    it("should redirect unauthenticated user from /participant to /login", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      mockRequest = new NextRequest(
        new URL("http://localhost:4000/participant")
      );

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get("location")).toContain("/login");
    });

    it("should redirect unauthenticated user from /admin to /login", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      mockRequest = new NextRequest(
        new URL("http://localhost:4000/admin/dashboard")
      );

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get("location")).toContain("/login");
    });

    it("should allow authenticated user to access /admin route", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "123", email: "admin@example.com" } },
      });

      mockRequest = new NextRequest(
        new URL("http://localhost:4000/admin/dashboard")
      );

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(response.headers.get("Cache-Control")).toBe(
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
    });
  });

  describe("public routes", () => {
    it("should allow access to /login without authentication", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      mockRequest = new NextRequest(new URL("http://localhost:4000/login"));

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should allow access to / without authentication", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      mockRequest = new NextRequest(new URL("http://localhost:4000/"));

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should allow access to /logout without authentication", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      mockRequest = new NextRequest(new URL("http://localhost:4000/logout"));

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(200);
    });
  });
});
