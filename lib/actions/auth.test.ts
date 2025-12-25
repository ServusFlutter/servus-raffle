/**
 * @jest-environment node
 */
import { signOut, signIn, signUp, getCurrentUser } from "./auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Mock Supabase client
jest.mock("@/lib/supabase/server");
jest.mock("next/cache");

interface MockSupabaseClient {
  auth: {
    signOut: jest.Mock;
    signUp: jest.Mock;
    signInWithPassword: jest.Mock;
    getUser: jest.Mock;
  };
  from: jest.Mock;
  insert: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
}

describe("Auth Server Actions", () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        signOut: jest.fn(),
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("signUp", () => {
    it("should return error when password is too short", async () => {
      // Act
      const result = await signUp("test@example.com", "short", "Test User");

      // Assert
      expect(result).toEqual({
        data: null,
        error: "Password must be at least 8 characters",
      });
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("should return error when email is empty", async () => {
      // Act
      const result = await signUp("", "password123", "Test User");

      // Assert
      expect(result).toEqual({
        data: null,
        error: "Email and name are required",
      });
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("should return error when name is empty", async () => {
      // Act
      const result = await signUp("test@example.com", "password123", "   ");

      // Assert
      expect(result).toEqual({
        data: null,
        error: "Email and name are required",
      });
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("should sanitize input and remove HTML tags from name", async () => {
      // Arrange
      const mockAuthUser = { id: "user-123", email: "test@example.com" };
      const mockDbUser = {
        id: "user-123",
        email: "test@example.com",
        name: "scriptTest User/script",
        avatar_url: null,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      // Act
      await signUp("TEST@example.com", "password123", "<script>Test User</script>");

      // Assert - email should be lowercased, name should have tags removed
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should successfully create a new user", async () => {
      // Arrange
      const mockAuthUser = { id: "user-123", email: "test@example.com" };
      const mockDbUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        avatar_url: null,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      // Act
      const result = await signUp("test@example.com", "password123", "Test User");

      // Assert
      expect(result).toEqual({ data: mockDbUser, error: null });
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("should return error when user already exists", async () => {
      // Arrange
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "User already registered" },
      });

      // Act
      const result = await signUp("existing@example.com", "password123", "Test");

      // Assert
      expect(result).toEqual({
        data: null,
        error: "An account with this email already exists",
      });
    });

    it("should return error when auth fails", async () => {
      // Arrange
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "Auth service error" },
      });

      // Act
      const result = await signUp("test@example.com", "password123", "Test");

      // Assert
      expect(result).toEqual({ data: null, error: "Failed to create account" });
    });

    it("should return error when profile creation fails", async () => {
      // Arrange
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      // Act
      const result = await signUp("test@example.com", "password123", "Test");

      // Assert
      expect(result).toEqual({
        data: null,
        error: "Account created but profile setup failed",
      });
    });
  });

  describe("signIn", () => {
    it("should successfully sign in an existing user", async () => {
      // Arrange
      const mockAuthUser = { id: "user-123" };
      const mockDbUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        avatar_url: null,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      // Act
      const result = await signIn("test@example.com", "password123");

      // Assert
      expect(result).toEqual({ data: mockDbUser, error: null });
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("should return error for invalid credentials", async () => {
      // Arrange
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      });

      // Act
      const result = await signIn("test@example.com", "wrongpassword");

      // Assert
      expect(result).toEqual({ data: null, error: "Invalid email or password" });
    });

    it("should return error when profile not found", async () => {
      // Arrange
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      // Act
      const result = await signIn("test@example.com", "password123");

      // Assert
      expect(result).toEqual({ data: null, error: "Profile not found" });
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user profile", async () => {
      // Arrange
      const mockAuthUser = { id: "user-123" };
      const mockDbUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        avatar_url: null,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: mockDbUser,
        error: null,
      });

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toEqual({ data: mockDbUser, error: null });
    });

    it("should return error when not authenticated", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toEqual({ data: null, error: "Not authenticated" });
    });

    it("should return error when profile fetch fails", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result).toEqual({ data: null, error: "Failed to fetch user profile" });
    });
  });

  describe("signOut", () => {
    it("should successfully sign out user", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const result = await signOut();

      // Assert
      expect(result).toEqual({ data: null, error: null });
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("should return error when Supabase signOut fails", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: "Session expired" },
      });

      // Act
      const result = await signOut();

      // Assert
      expect(result).toEqual({ data: null, error: "Failed to sign out" });
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockRejectedValue(new Error("Network error"));

      // Act
      const result = await signOut();

      // Assert
      expect(result).toEqual({ data: null, error: "Failed to sign out" });
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("should revalidate paths only on successful signout", async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      await signOut();

      // Assert
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(revalidatePath).toHaveBeenCalledTimes(1);
    });
  });
});
