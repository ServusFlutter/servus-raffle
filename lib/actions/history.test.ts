/**
 * @jest-environment node
 */
import {
  getRaffleHistory,
  getRaffleWinners,
  getMultiWinnerStats,
} from "./history";
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
  in: jest.Mock;
  order: jest.Mock;
}

describe("History Server Actions", () => {
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
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    };

    mockServiceClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createSupabaseClient as jest.Mock).mockReturnValue(mockServiceClient);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getRaffleHistory", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getRaffleHistory();

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

        const result = await getRaffleHistory();

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
          name: "December Raffle",
          status: "completed",
          created_at: "2025-12-26T10:00:00Z",
        },
        {
          id: "raffle-2",
          name: "November Raffle",
          status: "active",
          created_at: "2025-11-26T10:00:00Z",
        },
      ];

      const mockParticipants = [
        { raffle_id: "raffle-1" },
        { raffle_id: "raffle-1" },
        { raffle_id: "raffle-1" },
        { raffle_id: "raffle-2" },
        { raffle_id: "raffle-2" },
      ];

      const mockPrizes = [
        { raffle_id: "raffle-1", awarded_to: "user-1" },
        { raffle_id: "raffle-1", awarded_to: "user-2" },
        { raffle_id: "raffle-1", awarded_to: null },
        { raffle_id: "raffle-2", awarded_to: null },
        { raffle_id: "raffle-2", awarded_to: null },
      ];

      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns raffles sorted by date descending with correct counts", async () => {
        // First call: raffles query
        mockServiceClient.order
          .mockResolvedValueOnce({
            data: mockRaffles,
            error: null,
          });
        // Second call: participants query
        mockServiceClient.in
          .mockResolvedValueOnce({
            data: mockParticipants,
            error: null,
          })
          // Third call: prizes query
          .mockResolvedValueOnce({
            data: mockPrizes,
            error: null,
          });

        const result = await getRaffleHistory();

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(2);
        expect(result.data![0]).toEqual({
          id: "raffle-1",
          name: "December Raffle",
          status: "completed",
          created_at: "2025-12-26T10:00:00Z",
          participant_count: 3,
          prizes_awarded: 2,
          total_prizes: 3,
        });
        expect(result.data![1]).toEqual({
          id: "raffle-2",
          name: "November Raffle",
          status: "active",
          created_at: "2025-11-26T10:00:00Z",
          participant_count: 2,
          prizes_awarded: 0,
          total_prizes: 2,
        });
      });

      it("returns empty array when no raffles exist", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [],
          error: null,
        });

        const result = await getRaffleHistory();

        expect(result).toEqual({ data: [], error: null });
      });

      it("handles raffles with no participants or prizes", async () => {
        mockServiceClient.order.mockResolvedValueOnce({
          data: [mockRaffles[0]],
          error: null,
        });
        mockServiceClient.in
          .mockResolvedValueOnce({
            data: [],
            error: null,
          })
          .mockResolvedValueOnce({
            data: [],
            error: null,
          });

        const result = await getRaffleHistory();

        expect(result.data![0].participant_count).toBe(0);
        expect(result.data![0].prizes_awarded).toBe(0);
        expect(result.data![0].total_prizes).toBe(0);
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

      it("returns error when raffles query fails", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        });

        const result = await getRaffleHistory();

        expect(result).toEqual({
          data: null,
          error: "Failed to fetch raffle history",
        });
      });
    });
  });

  describe("getRaffleWinners", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getRaffleWinners(mockRaffleId);

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

        const result = await getRaffleWinners(mockRaffleId);

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
        const result = await getRaffleWinners("invalid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });
    });

    describe("successful fetch", () => {
      const mockWinnersWithJoins = [
        {
          id: "winner-1",
          user_id: "user-1",
          tickets_at_win: 5,
          won_at: "2025-12-26T10:00:00Z",
          prize_id: "prize-1",
          user: { name: "Alice", avatar_url: "https://example.com/alice.jpg" },
          prize: { name: "Grand Prize" },
        },
        {
          id: "winner-2",
          user_id: "user-2",
          tickets_at_win: 3,
          won_at: "2025-12-26T10:05:00Z",
          prize_id: "prize-2",
          user: { name: "Bob", avatar_url: null },
          prize: { name: "Second Prize" },
        },
      ];

      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns winners with user and prize details", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: mockWinnersWithJoins,
          error: null,
        });

        const result = await getRaffleWinners(mockRaffleId);

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(2);
        expect(result.data![0]).toEqual({
          id: "winner-1",
          user_id: "user-1",
          user_name: "Alice",
          user_avatar_url: "https://example.com/alice.jpg",
          prize_name: "Grand Prize",
          prize_id: "prize-1",
          tickets_at_win: 5,
          won_at: "2025-12-26T10:00:00Z",
        });
        expect(result.data![1]).toEqual({
          id: "winner-2",
          user_id: "user-2",
          user_name: "Bob",
          user_avatar_url: null,
          prize_name: "Second Prize",
          prize_id: "prize-2",
          tickets_at_win: 3,
          won_at: "2025-12-26T10:05:00Z",
        });
      });

      it("returns empty array for raffle with no winners", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [],
          error: null,
        });

        const result = await getRaffleWinners(mockRaffleId);

        expect(result).toEqual({ data: [], error: null });
      });

      it("handles winner with null user gracefully", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [
            {
              id: "winner-1",
              user_id: "user-1",
              tickets_at_win: 5,
              won_at: "2025-12-26T10:00:00Z",
              prize_id: "prize-1",
              user: null,
              prize: { name: "Prize" },
            },
          ],
          error: null,
        });

        const result = await getRaffleWinners(mockRaffleId);

        expect(result.data![0].user_name).toBeNull();
        expect(result.data![0].user_avatar_url).toBeNull();
      });

      it("handles winner with null prize gracefully", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [
            {
              id: "winner-1",
              user_id: "user-1",
              tickets_at_win: 5,
              won_at: "2025-12-26T10:00:00Z",
              prize_id: null,
              user: { name: "Alice", avatar_url: null },
              prize: null,
            },
          ],
          error: null,
        });

        const result = await getRaffleWinners(mockRaffleId);

        expect(result.data![0].prize_name).toBe("Unknown Prize");
        expect(result.data![0].prize_id).toBe("");
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

        const result = await getRaffleWinners(mockRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Failed to fetch winners",
        });
      });
    });
  });

  describe("getMultiWinnerStats", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getMultiWinnerStats();

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

        const result = await getMultiWinnerStats();

        expect(result).toEqual({
          data: null,
          error: "Unauthorized: Admin access required",
        });
      });
    });

    describe("successful fetch", () => {
      const mockWinnersForStats = [
        {
          user_id: "user-1",
          won_at: "2025-12-26T10:00:00Z",
          user: { name: "Alice", avatar_url: "https://example.com/alice.jpg" },
        },
        {
          user_id: "user-1",
          won_at: "2025-11-26T10:00:00Z",
          user: { name: "Alice", avatar_url: "https://example.com/alice.jpg" },
        },
        {
          user_id: "user-1",
          won_at: "2025-10-26T10:00:00Z",
          user: { name: "Alice", avatar_url: "https://example.com/alice.jpg" },
        },
        {
          user_id: "user-2",
          won_at: "2025-12-25T10:00:00Z",
          user: { name: "Bob", avatar_url: null },
        },
        {
          user_id: "user-2",
          won_at: "2025-11-25T10:00:00Z",
          user: { name: "Bob", avatar_url: null },
        },
        {
          user_id: "user-3",
          won_at: "2025-12-24T10:00:00Z",
          user: { name: "Charlie", avatar_url: null },
        },
      ];

      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns users who won multiple times sorted by win count", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: mockWinnersForStats,
          error: null,
        });

        const result = await getMultiWinnerStats();

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(2);
        expect(result.data![0]).toEqual({
          user_id: "user-1",
          user_name: "Alice",
          user_avatar_url: "https://example.com/alice.jpg",
          win_count: 3,
          last_win_at: "2025-12-26T10:00:00Z",
        });
        expect(result.data![1]).toEqual({
          user_id: "user-2",
          user_name: "Bob",
          user_avatar_url: null,
          win_count: 2,
          last_win_at: "2025-12-25T10:00:00Z",
        });
      });

      it("excludes users with only one win", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [
            {
              user_id: "user-1",
              won_at: "2025-12-26T10:00:00Z",
              user: { name: "Alice", avatar_url: null },
            },
          ],
          error: null,
        });

        const result = await getMultiWinnerStats();

        expect(result).toEqual({ data: [], error: null });
      });

      it("returns empty array when no winners exist", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [],
          error: null,
        });

        const result = await getMultiWinnerStats();

        expect(result).toEqual({ data: [], error: null });
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

        const result = await getMultiWinnerStats();

        expect(result).toEqual({
          data: null,
          error: "Failed to fetch multi-winner stats",
        });
      });
    });
  });
});
