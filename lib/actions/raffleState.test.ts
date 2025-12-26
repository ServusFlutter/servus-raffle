/**
 * Tests for raffleState.ts - Server action for draw state recovery
 *
 * Story 6.2: Real-time Channel Setup & Synchronization
 * AC #5: Reconnection Handling - Fetch current state on reconnection
 */

import { getRaffleDrawState } from "./raffleState";

// Mock the server client
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    from: mockFrom,
  })),
}));

describe("getRaffleDrawState", () => {
  const raffleId = "test-raffle-123";

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup chain mock
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
      order: mockOrder,
    });
    mockOrder.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({
      data: { id: raffleId, status: "active" },
      error: null,
    });
  });

  describe("Successful state fetch", () => {
    it("returns current raffle state", async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: raffleId,
          status: "drawing",
          name: "Test Raffle",
        },
        error: null,
      });

      const result = await getRaffleDrawState(raffleId);

      expect(result.data).toBeDefined();
      expect(result.data?.raffle.status).toBe("drawing");
      expect(result.error).toBeNull();
    });

    it("includes prizes with winner information", async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: raffleId,
          status: "drawing",
          name: "Test Raffle",
        },
        error: null,
      });

      mockLimit.mockResolvedValue({
        data: [
          {
            id: "prize-1",
            name: "Grand Prize",
            awarded_to: null,
            winner_name: null,
          },
          {
            id: "prize-2",
            name: "Second Prize",
            awarded_to: "user-123",
            winner_name: "John Doe",
          },
        ],
        error: null,
      });

      const result = await getRaffleDrawState(raffleId);

      expect(result.data?.prizes).toHaveLength(2);
      expect(result.data?.prizes[1].awarded_to).toBe("user-123");
    });

    it("calculates current prize index correctly", async () => {
      mockSingle.mockResolvedValue({
        data: { id: raffleId, status: "drawing" },
        error: null,
      });

      mockLimit.mockResolvedValue({
        data: [
          { id: "prize-1", awarded_to: "user-1" }, // Awarded
          { id: "prize-2", awarded_to: null }, // Current (first unawarded)
          { id: "prize-3", awarded_to: null },
        ],
        error: null,
      });

      const result = await getRaffleDrawState(raffleId);

      expect(result.data?.currentPrizeIndex).toBe(1);
    });

    it("returns -1 for currentPrizeIndex when all prizes awarded", async () => {
      mockSingle.mockResolvedValue({
        data: { id: raffleId, status: "completed" },
        error: null,
      });

      mockLimit.mockResolvedValue({
        data: [
          { id: "prize-1", awarded_to: "user-1" },
          { id: "prize-2", awarded_to: "user-2" },
        ],
        error: null,
      });

      const result = await getRaffleDrawState(raffleId);

      expect(result.data?.currentPrizeIndex).toBe(-1);
    });
  });

  describe("Error handling", () => {
    it("returns error when raffle not found", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const result = await getRaffleDrawState(raffleId);

      expect(result.data).toBeNull();
      expect(result.error).toBe("Failed to fetch raffle state");
    });

    it("returns error when database query fails", async () => {
      mockSingle.mockRejectedValue(new Error("Database error"));

      const result = await getRaffleDrawState(raffleId);

      expect(result.data).toBeNull();
      expect(result.error).toBe("Failed to fetch raffle state");
    });
  });

  describe("Draw in progress detection", () => {
    it("detects when draw is in progress", async () => {
      mockSingle.mockResolvedValue({
        data: { id: raffleId, status: "drawing" },
        error: null,
      });

      mockLimit.mockResolvedValue({
        data: [{ id: "prize-1", awarded_to: null }],
        error: null,
      });

      const result = await getRaffleDrawState(raffleId);

      expect(result.data?.isDrawing).toBe(true);
    });

    it("detects when draw is not in progress", async () => {
      mockSingle.mockResolvedValue({
        data: { id: raffleId, status: "active" },
        error: null,
      });

      mockLimit.mockResolvedValue({
        data: [{ id: "prize-1", awarded_to: null }],
        error: null,
      });

      const result = await getRaffleDrawState(raffleId);

      expect(result.data?.isDrawing).toBe(false);
    });
  });
});
