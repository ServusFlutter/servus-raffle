/**
 * @jest-environment node
 */
import {
  createPrize,
  getPrizes,
  updatePrize,
  deletePrize,
  getPrizeCount,
  reorderPrizes,
  movePrizeUp,
  movePrizeDown,
} from "./prizes";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/utils/admin";
import { revalidatePath } from "next/cache";

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
  delete: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
}

describe("Prize Server Actions", () => {
  let mockSupabase: MockSupabaseClient;
  let mockServiceClient: MockSupabaseClient;
  const originalEnv = process.env;

  const mockRaffleId = "123e4567-e89b-12d3-a456-426614174000";
  const mockPrizeId = "123e4567-e89b-12d3-a456-426614174001";

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
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    mockServiceClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createSupabaseClient as jest.Mock).mockReturnValue(mockServiceClient);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("createPrize", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await createPrize(mockRaffleId, "Test Prize");

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

        const result = await createPrize(mockRaffleId, "Test Prize");

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
        const result = await createPrize("invalid-uuid", "Test Prize");

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });

      it("returns error for empty name", async () => {
        const result = await createPrize(mockRaffleId, "");

        expect(result).toEqual({
          data: null,
          error: "Prize name is required",
        });
      });

      it("returns error for whitespace-only name", async () => {
        const result = await createPrize(mockRaffleId, "   ");

        expect(result).toEqual({
          data: null,
          error: "Prize name is required",
        });
      });
    });

    describe("successful creation", () => {
      const mockPrize = {
        id: mockPrizeId,
        raffle_id: mockRaffleId,
        name: "Test Prize",
        description: null,
        sort_order: 0,
        awarded_to: null,
        awarded_at: null,
      };

      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("creates prize with valid name", async () => {
        mockServiceClient.single
          .mockResolvedValueOnce({ data: { id: mockRaffleId }, error: null })
          .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
          .mockResolvedValueOnce({ data: mockPrize, error: null });

        const result = await createPrize(mockRaffleId, "Test Prize");

        expect(result).toEqual({ data: mockPrize, error: null });
        expect(revalidatePath).toHaveBeenCalledWith(`/admin/raffles/${mockRaffleId}`);
        expect(revalidatePath).toHaveBeenCalledWith(`/admin/raffles/${mockRaffleId}/prizes`);
      });

      it("creates prize with description", async () => {
        const prizeWithDescription = { ...mockPrize, description: "A great prize" };
        mockServiceClient.single
          .mockResolvedValueOnce({ data: { id: mockRaffleId }, error: null })
          .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
          .mockResolvedValueOnce({ data: prizeWithDescription, error: null });

        const result = await createPrize(mockRaffleId, "Test Prize", "A great prize");

        expect(result).toEqual({ data: prizeWithDescription, error: null });
      });

      it("auto-assigns next sort_order", async () => {
        mockServiceClient.single
          .mockResolvedValueOnce({ data: { id: mockRaffleId }, error: null })
          .mockResolvedValueOnce({ data: { sort_order: 2 }, error: null })
          .mockResolvedValueOnce({ data: { ...mockPrize, sort_order: 3 }, error: null });

        await createPrize(mockRaffleId, "Test Prize");

        expect(mockServiceClient.insert).toHaveBeenCalledWith({
          raffle_id: mockRaffleId,
          name: "Test Prize",
          description: null,
          sort_order: 3,
        });
      });

      it("trims whitespace from name", async () => {
        mockServiceClient.single
          .mockResolvedValueOnce({ data: { id: mockRaffleId }, error: null })
          .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
          .mockResolvedValueOnce({ data: mockPrize, error: null });

        await createPrize(mockRaffleId, "  Test Prize  ");

        expect(mockServiceClient.insert).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Test Prize" })
        );
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

      it("returns error when raffle does not exist", async () => {
        mockServiceClient.single.mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await createPrize(mockRaffleId, "Test Prize");

        expect(result).toEqual({
          data: null,
          error: "Raffle not found",
        });
      });
    });
  });

  describe("getPrizes", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getPrizes(mockRaffleId);

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
        const result = await getPrizes("invalid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });
    });

    describe("successful fetch", () => {
      const mockPrizes = [
        {
          id: "prize-1",
          raffle_id: mockRaffleId,
          name: "First Prize",
          description: null,
          sort_order: 0,
          awarded_to: null,
          awarded_at: null,
        },
        {
          id: "prize-2",
          raffle_id: mockRaffleId,
          name: "Second Prize",
          description: "A description",
          sort_order: 1,
          awarded_to: null,
          awarded_at: null,
        },
      ];

      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns list of prizes ordered by sort_order", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: mockPrizes,
          error: null,
        });

        const result = await getPrizes(mockRaffleId);

        expect(result).toEqual({ data: mockPrizes, error: null });
        expect(mockServiceClient.from).toHaveBeenCalledWith("prizes");
        expect(mockServiceClient.eq).toHaveBeenCalledWith("raffle_id", mockRaffleId);
        expect(mockServiceClient.order).toHaveBeenCalledWith("sort_order", { ascending: true });
      });

      it("returns empty array when no prizes exist", async () => {
        mockServiceClient.order.mockResolvedValue({
          data: [],
          error: null,
        });

        const result = await getPrizes(mockRaffleId);

        expect(result).toEqual({ data: [], error: null });
      });
    });
  });

  describe("updatePrize", () => {
    const mockPrize = {
      id: mockPrizeId,
      raffle_id: mockRaffleId,
      name: "Updated Prize",
      description: "Updated description",
      sort_order: 0,
      awarded_to: null,
      awarded_at: null,
    };

    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await updatePrize(mockPrizeId, "Updated Prize");

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

      it("returns error for invalid prize UUID", async () => {
        const result = await updatePrize("invalid-uuid", "Updated Prize");

        expect(result).toEqual({
          data: null,
          error: "Invalid prize ID",
        });
      });

      it("returns error for empty name", async () => {
        const result = await updatePrize(mockPrizeId, "");

        expect(result).toEqual({
          data: null,
          error: "Prize name is required",
        });
      });
    });

    describe("successful update", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("updates prize with new name", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: mockPrize,
          error: null,
        });

        const result = await updatePrize(mockPrizeId, "Updated Prize");

        expect(result).toEqual({ data: mockPrize, error: null });
        expect(mockServiceClient.update).toHaveBeenCalledWith({
          name: "Updated Prize",
          description: null,
        });
        expect(revalidatePath).toHaveBeenCalledWith(`/admin/raffles/${mockRaffleId}`);
      });

      it("updates prize with new description", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: mockPrize,
          error: null,
        });

        await updatePrize(mockPrizeId, "Updated Prize", "New description");

        expect(mockServiceClient.update).toHaveBeenCalledWith({
          name: "Updated Prize",
          description: "New description",
        });
      });
    });

    describe("prize not found", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when prize does not exist", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await updatePrize(mockPrizeId, "Updated Prize");

        expect(result).toEqual({
          data: null,
          error: "Prize not found",
        });
      });
    });
  });

  describe("deletePrize", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await deletePrize(mockPrizeId);

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
        const result = await deletePrize("invalid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid prize ID",
        });
      });
    });

    describe("successful deletion", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("deletes prize and revalidates paths", async () => {
        // First call: fetch prize to get raffle_id
        mockServiceClient.single.mockResolvedValueOnce({
          data: { raffle_id: mockRaffleId },
          error: null,
        });
        // Delete operation: from().delete().eq() returns { error: null }
        mockServiceClient.delete.mockReturnValueOnce({
          eq: jest.fn().mockResolvedValue({ error: null }),
        });

        const result = await deletePrize(mockPrizeId);

        expect(result).toEqual({ data: { success: true }, error: null });
        expect(revalidatePath).toHaveBeenCalledWith(`/admin/raffles/${mockRaffleId}`);
        expect(revalidatePath).toHaveBeenCalledWith(`/admin/raffles/${mockRaffleId}/prizes`);
      });
    });

    describe("prize not found", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when prize does not exist", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await deletePrize(mockPrizeId);

        expect(result).toEqual({
          data: null,
          error: "Prize not found",
        });
      });
    });
  });

  describe("getPrizeCount", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getPrizeCount(mockRaffleId);

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
        const result = await getPrizeCount("invalid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });
    });

    describe("successful count", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns prize count", async () => {
        mockServiceClient.eq.mockResolvedValue({
          count: 5,
          error: null,
        });

        const result = await getPrizeCount(mockRaffleId);

        expect(result).toEqual({ data: 5, error: null });
      });

      it("returns 0 when no prizes", async () => {
        mockServiceClient.eq.mockResolvedValue({
          count: 0,
          error: null,
        });

        const result = await getPrizeCount(mockRaffleId);

        expect(result).toEqual({ data: 0, error: null });
      });
    });
  });

  describe("reorderPrizes", () => {
    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await reorderPrizes(mockRaffleId, ["prize-1", "prize-2"]);

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

        const result = await reorderPrizes(mockRaffleId, ["prize-1", "prize-2"]);

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
        const result = await reorderPrizes("invalid-uuid", ["prize-1"]);

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });

      it("returns error for invalid prize UUID in list", async () => {
        const result = await reorderPrizes(mockRaffleId, ["invalid-uuid"]);

        expect(result).toEqual({
          data: null,
          error: "Invalid prize ID in list",
        });
      });
    });

    describe("prize not found", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when prize does not belong to raffle", async () => {
        const validPrizeId = "123e4567-e89b-12d3-a456-426614174001";
        const unknownPrizeId = "123e4567-e89b-12d3-a456-426614174009";

        // Mock fetch existing prizes - only returns one prize
        mockServiceClient.eq.mockResolvedValueOnce({
          data: [{ id: validPrizeId, awarded_to: null }],
          error: null,
        });

        const result = await reorderPrizes(mockRaffleId, [validPrizeId, unknownPrizeId]);

        expect(result).toEqual({
          data: null,
          error: "Prize not found or does not belong to this raffle",
        });
      });
    });
  });

  describe("movePrizeUp", () => {
    const mockPrize = {
      id: mockPrizeId,
      raffle_id: mockRaffleId,
      name: "Test Prize",
      sort_order: 1,
      awarded_to: null,
      awarded_at: null,
    };

    const mockPreviousPrize = {
      id: "prize-prev",
      raffle_id: mockRaffleId,
      name: "Previous Prize",
      sort_order: 0,
      awarded_to: null,
      awarded_at: null,
    };

    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await movePrizeUp(mockPrizeId);

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
        const result = await movePrizeUp("invalid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid prize ID",
        });
      });

      it("returns error when prize not found", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await movePrizeUp(mockPrizeId);

        expect(result).toEqual({
          data: null,
          error: "Prize not found",
        });
      });

      it("returns error when prize is awarded", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: { ...mockPrize, awarded_to: "user-123" },
          error: null,
        });

        const result = await movePrizeUp(mockPrizeId);

        expect(result).toEqual({
          data: null,
          error: "Cannot move awarded prize",
        });
      });

      it("returns error when prize is already first", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: { ...mockPrize, sort_order: 0 },
          error: null,
        });
        mockServiceClient.order.mockResolvedValue({
          data: [{ ...mockPrize, sort_order: 0 }],
          error: null,
        });

        const result = await movePrizeUp(mockPrizeId);

        expect(result).toEqual({
          data: null,
          error: "Prize is already first",
        });
      });
    });

    describe("cannot swap with awarded prize", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when previous prize is awarded", async () => {
        const awardedPreviousPrize = {
          ...mockPreviousPrize,
          awarded_to: "winner-123",
        };

        mockServiceClient.single.mockResolvedValueOnce({
          data: mockPrize,
          error: null,
        });
        mockServiceClient.order.mockResolvedValueOnce({
          data: [awardedPreviousPrize, mockPrize],
          error: null,
        });

        const result = await movePrizeUp(mockPrizeId);

        expect(result).toEqual({
          data: null,
          error: "Cannot swap with awarded prize",
        });
      });
    });
  });

  describe("movePrizeDown", () => {
    const mockPrize = {
      id: mockPrizeId,
      raffle_id: mockRaffleId,
      name: "Test Prize",
      sort_order: 0,
      awarded_to: null,
      awarded_at: null,
    };

    const mockNextPrize = {
      id: "prize-next",
      raffle_id: mockRaffleId,
      name: "Next Prize",
      sort_order: 1,
      awarded_to: null,
      awarded_at: null,
    };

    describe("authorization", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await movePrizeDown(mockPrizeId);

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
        const result = await movePrizeDown("invalid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid prize ID",
        });
      });

      it("returns error when prize not found", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await movePrizeDown(mockPrizeId);

        expect(result).toEqual({
          data: null,
          error: "Prize not found",
        });
      });

      it("returns error when prize is awarded", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: { ...mockPrize, awarded_to: "user-123" },
          error: null,
        });

        const result = await movePrizeDown(mockPrizeId);

        expect(result).toEqual({
          data: null,
          error: "Cannot move awarded prize",
        });
      });

      it("returns error when prize is already last", async () => {
        mockServiceClient.single.mockResolvedValue({
          data: mockPrize,
          error: null,
        });
        mockServiceClient.order.mockResolvedValue({
          data: [mockPrize],
          error: null,
        });

        const result = await movePrizeDown(mockPrizeId);

        expect(result).toEqual({
          data: null,
          error: "Prize is already last",
        });
      });
    });

    describe("cannot swap with awarded prize", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "admin-1", email: "admin@test.com" } },
          error: null,
        });
        (isAdmin as jest.Mock).mockReturnValue(true);
      });

      it("returns error when next prize is awarded", async () => {
        const awardedNextPrize = {
          ...mockNextPrize,
          awarded_to: "winner-123",
        };

        mockServiceClient.single.mockResolvedValueOnce({
          data: mockPrize,
          error: null,
        });
        mockServiceClient.order.mockResolvedValueOnce({
          data: [mockPrize, awardedNextPrize],
          error: null,
        });

        const result = await movePrizeDown(mockPrizeId);

        expect(result).toEqual({
          data: null,
          error: "Cannot swap with awarded prize",
        });
      });
    });
  });
});
