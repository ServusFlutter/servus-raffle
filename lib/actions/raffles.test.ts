/**
 * @jest-environment node
 */
import {
  createRaffle,
  getRaffles,
  getRaffle,
  activateRaffle,
  regenerateQrCode,
} from "./raffles";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/utils/admin";
import { revalidatePath } from "next/cache";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@supabase/supabase-js");
jest.mock("@/lib/utils/admin");
jest.mock("next/cache");

interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  order: jest.Mock;
}

describe("Raffle Server Actions", () => {
  let mockSupabase: MockSupabaseClient;
  let mockServiceClient: MockSupabaseClient;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      ADMIN_EMAILS: "admin@test.com",
    };

    // Mock regular Supabase client (for auth)
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    };

    // Mock service role client (for database operations)
    mockServiceClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createSupabaseClient as jest.Mock).mockReturnValue(mockServiceClient);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("createRaffle", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await createRaffle("Test Raffle");

        expect(result).toEqual({
          data: null,
          error: "Unauthorized: Admin access required",
        });
      });

      it("returns error when user is not an admin", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "user-1", email: "user@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(false);

        const result = await createRaffle("Test Raffle");

        expect(result).toEqual({
          data: null,
          error: "Unauthorized: Admin access required",
        });
      });
    });

    describe("validation", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error for empty name", async () => {
        const result = await createRaffle("");

        expect(result).toEqual({
          data: null,
          error: "Raffle name is required",
        });
      });

      it("returns error for whitespace-only name", async () => {
        const result = await createRaffle("   ");

        expect(result).toEqual({
          data: null,
          error: "Raffle name is required",
        });
      });

      it("truncates name over 255 characters via sanitizeInput", async () => {
        // Note: sanitizeInput truncates to 255 chars before Zod validation,
        // so the validation passes and the raffle is created with truncated name
        const longName = "a".repeat(300);

        mockServiceClient.single.mockResolvedValue({
          data: {
            id: "raffle-123",
            name: "a".repeat(255),
            status: "draft",
            qr_code_expires_at: null,
            created_at: "2024-12-25T10:00:00Z",
            created_by: "admin-1",
          },
          error: null,
        });

        const result = await createRaffle(longName);

        // The name is truncated to 255 characters
        expect(result.error).toBeNull();
        expect(mockServiceClient.insert).toHaveBeenCalledWith({
          name: "a".repeat(255),
          status: "draft",
          created_by: "admin-1",
        });
      });
    });

    describe("successful creation", () => {
      const mockRaffle = {
        id: "raffle-123",
        name: "Test Raffle",
        status: "draft",
        qr_code_expires_at: null,
        created_at: "2024-12-25T10:00:00Z",
        created_by: "admin-1",
      };

      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("creates raffle with valid name", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: mockRaffle,
          error: null,
        });

        const result = await createRaffle("Test Raffle");

        expect(result).toEqual({ data: mockRaffle, error: null });
        expect(mockServiceClient.from).toHaveBeenCalledWith("raffles");
        expect(mockServiceClient.insert).toHaveBeenCalledWith({
          name: "Test Raffle",
          status: "draft",
          created_by: "admin-1",
        });
      });

      it("trims whitespace from name", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: { ...mockRaffle, name: "Trimmed Name" },
          error: null,
        });

        await createRaffle("  Trimmed Name  ");

        expect(mockServiceClient.insert).toHaveBeenCalledWith({
          name: "Trimmed Name",
          status: "draft",
          created_by: "admin-1",
        });
      });

      it("sanitizes HTML from name by encoding entities", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: mockRaffle,
          error: null,
        });

        await createRaffle("<script>alert('xss')</script>Test");

        // HTML entities are now properly encoded instead of just stripped
        expect(mockServiceClient.insert).toHaveBeenCalledWith({
          name: "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;Test",
          status: "draft",
          created_by: "admin-1",
        });
      });

      it("revalidates admin paths on success", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: mockRaffle,
          error: null,
        });

        await createRaffle("Test Raffle");

        expect(revalidatePath).toHaveBeenCalledWith("/admin");
        expect(revalidatePath).toHaveBeenCalledWith("/admin/raffles");
      });
    });

    describe("database errors", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when database insert fails", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        });

        const result = await createRaffle("Test Raffle");

        expect(result).toEqual({
          data: null,
          error: "Failed to create raffle",
        });
      });
    });
  });

  describe("getRaffles", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getRaffles();

        expect(result).toEqual({
          data: null,
          error: "Unauthorized: Admin access required",
        });
      });

      it("returns error when user is not an admin", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "user-1", email: "user@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(false);

        const result = await getRaffles();

        expect(result).toEqual({
          data: null,
          error: "Unauthorized: Admin access required",
        });
      });
    });

    describe("successful fetch", () => {
      const mockRaffles = [
        {
          id: "raffle-1",
          name: "Raffle 1",
          status: "draft",
          qr_code_expires_at: null,
          created_at: "2024-12-25T10:00:00Z",
          created_by: "admin-1",
        },
        {
          id: "raffle-2",
          name: "Raffle 2",
          status: "active",
          qr_code_expires_at: null,
          created_at: "2024-12-24T10:00:00Z",
          created_by: "admin-1",
        },
      ];

      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns list of raffles", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: mockRaffles,
          error: null,
        });

        const result = await getRaffles();

        expect(result).toEqual({ data: mockRaffles, error: null });
        expect(mockServiceClient.from).toHaveBeenCalledWith("raffles");
        expect(mockServiceClient.order).toHaveBeenCalledWith("created_at", {
          ascending: false,
        });
      });

      it("returns empty array when no raffles exist", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [],
          error: null,
        });

        const result = await getRaffles();

        expect(result).toEqual({ data: [], error: null });
      });
    });

    describe("database errors", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when database fetch fails", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        });

        const result = await getRaffles();

        expect(result).toEqual({
          data: null,
          error: "Failed to fetch raffles",
        });
      });
    });
  });

  describe("getRaffle", () => {
    const mockRaffle = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test Raffle",
      status: "draft",
      qr_code_expires_at: null,
      created_at: "2024-12-25T10:00:00Z",
      created_by: "admin-1",
    };

    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getRaffle(mockRaffle.id);

        expect(result).toEqual({
          data: null,
          error: "Unauthorized: Admin access required",
        });
      });
    });

    describe("validation", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error for invalid UUID", async () => {
        const result = await getRaffle("not-a-valid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });
    });

    describe("successful fetch", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns raffle by ID", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: mockRaffle,
          error: null,
        });

        const result = await getRaffle(mockRaffle.id);

        expect(result).toEqual({ data: mockRaffle, error: null });
        expect(mockServiceClient.from).toHaveBeenCalledWith("raffles");
        expect(mockServiceClient.eq).toHaveBeenCalledWith("id", mockRaffle.id);
      });
    });

    describe("raffle not found", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when raffle not found", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await getRaffle(mockRaffle.id);

        expect(result).toEqual({
          data: null,
          error: "Raffle not found",
        });
      });
    });
  });

  describe("activateRaffle", () => {
    const mockRaffleId = "123e4567-e89b-12d3-a456-426614174000";
    const mockDurationMinutes = 180; // 3 hours

    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await activateRaffle(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Unauthorized: Admin access required",
        });
      });

      it("returns error when user is not an admin", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "user-1", email: "user@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(false);

        const result = await activateRaffle(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Unauthorized: Admin access required",
        });
      });
    });

    describe("validation", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error for invalid UUID", async () => {
        const result = await activateRaffle("not-a-valid-uuid", mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });

      it("returns error for duration less than 15 minutes", async () => {
        const result = await activateRaffle(mockRaffleId, 10);

        expect(result).toEqual({
          data: null,
          error: "Duration must be at least 15 minutes",
        });
      });

      it("returns error for duration more than 24 hours", async () => {
        const result = await activateRaffle(mockRaffleId, 1500);

        expect(result).toEqual({
          data: null,
          error: "Duration cannot exceed 24 hours",
        });
      });
    });

    describe("successful activation", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("activates draft raffle and sets expiration", async () => {
        const mockExpiresAt = "2024-12-25T15:00:00.000Z";
        mockServiceClient.single.mockResolvedValue({
          data: { qr_code_expires_at: mockExpiresAt },
          error: null,
        });

        const result = await activateRaffle(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: { qr_code_expires_at: mockExpiresAt },
          error: null,
        });
        expect(mockServiceClient.from).toHaveBeenCalledWith("raffles");
        expect(mockServiceClient.update).toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith(`/admin/raffles/${mockRaffleId}`);
      });

      it("returns error when raffle not found or not draft", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await activateRaffle(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Raffle not found or already activated",
        });
      });
    });

    describe("database errors", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when database update fails", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        });

        const result = await activateRaffle(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Failed to activate raffle",
        });
      });
    });
  });

  describe("regenerateQrCode", () => {
    const mockRaffleId = "123e4567-e89b-12d3-a456-426614174000";
    const mockDurationMinutes = 60; // 1 hour

    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await regenerateQrCode(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Unauthorized: Admin access required",
        });
      });
    });

    describe("validation", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error for invalid UUID", async () => {
        const result = await regenerateQrCode("not-a-valid-uuid", mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });

      it("returns error for duration less than 15 minutes", async () => {
        const result = await regenerateQrCode(mockRaffleId, 5);

        expect(result).toEqual({
          data: null,
          error: "Duration must be at least 15 minutes",
        });
      });
    });

    describe("status validation", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error for draft raffle", async () => {
        // First call returns draft status
        mockServiceClient.single
          .mockResolvedValueOnce({
            data: { status: "draft" },
            error: null,
          });

        const result = await regenerateQrCode(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Cannot regenerate QR for draft raffle. Use activate instead.",
        });
      });

      it("returns error for completed raffle", async () => {
        mockServiceClient.single
          .mockResolvedValueOnce({
            data: { status: "completed" },
            error: null,
          });

        const result = await regenerateQrCode(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Cannot regenerate QR for completed raffle",
        });
      });
    });

    describe("successful regeneration", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("regenerates QR code for active raffle", async () => {
        const mockExpiresAt = "2024-12-25T13:00:00.000Z";
        // First call for status check
        mockServiceClient.single
          .mockResolvedValueOnce({
            data: { status: "active" },
            error: null,
          })
          // Second call for update
          .mockResolvedValueOnce({
            data: { qr_code_expires_at: mockExpiresAt },
            error: null,
          });

        const result = await regenerateQrCode(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: { qr_code_expires_at: mockExpiresAt },
          error: null,
        });
        expect(revalidatePath).toHaveBeenCalledWith(`/admin/raffles/${mockRaffleId}`);
      });
    });

    describe("database errors", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when raffle not found", async () => {
        mockServiceClient.single.mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await regenerateQrCode(mockRaffleId, mockDurationMinutes);

        expect(result).toEqual({
          data: null,
          error: "Raffle not found",
        });
      });
    });
  });
});
