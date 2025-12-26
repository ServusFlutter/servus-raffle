/**
 * @jest-environment node
 */
import {
  getParticipantsWithDetails,
  getRaffleStatistics,
} from "./participants";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/utils/admin";

jest.mock("@/lib/supabase/server");
jest.mock("@supabase/supabase-js");
jest.mock("@/lib/utils/admin");

interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  order: jest.Mock;
}

describe("Participants Server Actions", () => {
  let mockSupabase: MockSupabaseClient;
  let mockServiceClient: MockSupabaseClient;
  const originalEnv = process.env;

  const mockRaffleId = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      ADMIN_EMAILS: "admin@test.com",
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    };

    mockServiceClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createSupabaseClient as jest.Mock).mockReturnValue(mockServiceClient);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getParticipantsWithDetails", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getParticipantsWithDetails(mockRaffleId);

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

        const result = await getParticipantsWithDetails(mockRaffleId);

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

      it("returns error for invalid raffle UUID", async () => {
        const result = await getParticipantsWithDetails("invalid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });
    });

    describe("successful fetch", () => {
      const mockParticipantsWithUser = [
        {
          id: "participant-1",
          user_id: "user-1",
          ticket_count: 3,
          joined_at: "2025-12-26T10:00:00Z",
          user: { name: "Alice", avatar_url: "https://example.com/alice.jpg" },
        },
        {
          id: "participant-2",
          user_id: "user-2",
          ticket_count: 1,
          joined_at: "2025-12-26T11:00:00Z",
          user: { name: "Bob", avatar_url: null },
        },
      ];

      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns list of participants with user details", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: mockParticipantsWithUser,
          error: null,
        });

        const result = await getParticipantsWithDetails(mockRaffleId);

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(2);
        expect(result.data![0]).toEqual({
          id: "participant-1",
          user_id: "user-1",
          ticket_count: 3,
          joined_at: "2025-12-26T10:00:00Z",
          user_name: "Alice",
          user_avatar_url: "https://example.com/alice.jpg",
        });
        expect(result.data![1]).toEqual({
          id: "participant-2",
          user_id: "user-2",
          ticket_count: 1,
          joined_at: "2025-12-26T11:00:00Z",
          user_name: "Bob",
          user_avatar_url: null,
        });
      });

      it("returns empty array when no participants", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [],
          error: null,
        });

        const result = await getParticipantsWithDetails(mockRaffleId);

        expect(result).toEqual({ data: [], error: null });
      });

      it("handles participant with null user gracefully", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [
            {
              id: "participant-1",
              user_id: "user-1",
              ticket_count: 1,
              joined_at: "2025-12-26T10:00:00Z",
              user: null,
            },
          ],
          error: null,
        });

        const result = await getParticipantsWithDetails(mockRaffleId);

        expect(result.data![0].user_name).toBeNull();
        expect(result.data![0].user_avatar_url).toBeNull();
      });

      it("orders participants by joined_at descending (newest first)", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: mockParticipantsWithUser,
          error: null,
        });

        await getParticipantsWithDetails(mockRaffleId);

        expect(mockServiceClient.order).toHaveBeenCalledWith("joined_at", {
          ascending: false,
        });
      });
    });

    describe("database error", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when database fails", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        });

        const result = await getParticipantsWithDetails(mockRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Failed to fetch participants",
        });
      });
    });
  });

  describe("getRaffleStatistics", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getRaffleStatistics(mockRaffleId);

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

        const result = await getRaffleStatistics(mockRaffleId);

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

      it("returns error for invalid raffle UUID", async () => {
        const result = await getRaffleStatistics("invalid-uuid");

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

      it("returns correct statistics", async () => {
        mockServiceClient.eq.mockResolvedValue({
          data: [
            { ticket_count: 3 },
            { ticket_count: 1 },
            { ticket_count: 5 },
          ],
          error: null,
        });

        const result = await getRaffleStatistics(mockRaffleId);

        expect(result).toEqual({
          data: {
            participantCount: 3,
            totalTickets: 9,
          },
          error: null,
        });
      });

      it("returns zero statistics when no participants", async () => {
        mockServiceClient.eq.mockResolvedValue({
          data: [],
          error: null,
        });

        const result = await getRaffleStatistics(mockRaffleId);

        expect(result).toEqual({
          data: {
            participantCount: 0,
            totalTickets: 0,
          },
          error: null,
        });
      });
    });

    describe("database error", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when database fails", async () => {
        mockServiceClient.eq.mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        });

        const result = await getRaffleStatistics(mockRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Failed to fetch statistics",
        });
      });
    });
  });
});
