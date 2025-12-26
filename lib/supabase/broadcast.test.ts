/**
 * Tests for broadcast.ts - Server-side broadcast utilities
 *
 * Story 6.2: Real-time Channel Setup & Synchronization
 * AC #2: Event Broadcast Latency - Events sent with timestamp for latency tracking
 */

import {
  broadcastDrawEvent,
  broadcastDrawStart,
  broadcastWheelSeed,
  broadcastWinnerRevealed,
  broadcastRaffleEnded,
} from "./broadcast";
import {
  RAFFLE_EVENTS,
  getBroadcastChannelName,
} from "@/lib/constants/events";

// Mock admin client
const mockSend = jest.fn().mockResolvedValue("ok");
const mockRemoveChannel = jest.fn().mockResolvedValue(undefined);
const mockChannel = {
  send: mockSend,
};

const mockAdminClient = {
  channel: jest.fn(() => mockChannel),
  removeChannel: mockRemoveChannel,
};

jest.mock("./admin", () => ({
  createAdminClient: () => mockAdminClient,
}));

describe("Broadcast Utilities", () => {
  const raffleId = "test-raffle-123";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-12-26T10:00:00.000Z"));
    mockSend.mockResolvedValue("ok");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("broadcastDrawEvent", () => {
    it("creates channel with correct naming pattern", async () => {
      await broadcastDrawEvent(raffleId, RAFFLE_EVENTS.DRAW_START, {
        raffleId,
        prizeId: "prize-1",
        prizeName: "Grand Prize",
      });

      expect(mockAdminClient.channel).toHaveBeenCalledWith(
        getBroadcastChannelName(raffleId)
      );
    });

    it("sends broadcast with correct structure", async () => {
      const payload = {
        raffleId,
        prizeId: "prize-1",
        prizeName: "Grand Prize",
      };

      await broadcastDrawEvent(raffleId, RAFFLE_EVENTS.DRAW_START, payload);

      expect(mockSend).toHaveBeenCalledWith({
        type: "broadcast",
        event: RAFFLE_EVENTS.DRAW_START,
        payload: {
          type: RAFFLE_EVENTS.DRAW_START,
          payload,
          timestamp: "2025-12-26T10:00:00.000Z",
        },
      });
    });

    it("includes timestamp in ISO 8601 format for latency tracking", async () => {
      await broadcastDrawEvent(raffleId, RAFFLE_EVENTS.WHEEL_SEED, {
        raffleId,
        prizeId: "prize-1",
        seed: 12345,
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            timestamp: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
            ),
          }),
        })
      );
    });

    it("logs broadcast event for monitoring", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await broadcastDrawEvent(raffleId, RAFFLE_EVENTS.DRAW_START, {
        raffleId,
        prizeId: "prize-1",
        prizeName: "Grand Prize",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Broadcast] Sending DRAW_START to raffle:")
      );

      consoleSpy.mockRestore();
    });

    it("returns success result from channel.send", async () => {
      mockSend.mockResolvedValue("ok");

      const result = await broadcastDrawEvent(
        raffleId,
        RAFFLE_EVENTS.DRAW_START,
        {
          raffleId,
          prizeId: "prize-1",
          prizeName: "Grand Prize",
        }
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it("returns error result when send fails", async () => {
      mockSend.mockRejectedValue(new Error("Network error"));

      const result = await broadcastDrawEvent(
        raffleId,
        RAFFLE_EVENTS.DRAW_START,
        {
          raffleId,
          prizeId: "prize-1",
          prizeName: "Grand Prize",
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("cleans up channel after sending", async () => {
      await broadcastDrawEvent(raffleId, RAFFLE_EVENTS.DRAW_START, {
        raffleId,
        prizeId: "prize-1",
        prizeName: "Grand Prize",
      });

      expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe("broadcastDrawStart", () => {
    it("broadcasts DRAW_START event with correct payload", async () => {
      await broadcastDrawStart(raffleId, "prize-1", "Grand Prize");

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          event: RAFFLE_EVENTS.DRAW_START,
          payload: expect.objectContaining({
            type: RAFFLE_EVENTS.DRAW_START,
            payload: {
              raffleId,
              prizeId: "prize-1",
              prizeName: "Grand Prize",
            },
          }),
        })
      );
    });
  });

  describe("broadcastWheelSeed", () => {
    it("broadcasts WHEEL_SEED event with correct payload", async () => {
      await broadcastWheelSeed(raffleId, "prize-1", 42);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          event: RAFFLE_EVENTS.WHEEL_SEED,
          payload: expect.objectContaining({
            type: RAFFLE_EVENTS.WHEEL_SEED,
            payload: {
              raffleId,
              prizeId: "prize-1",
              seed: 42,
            },
          }),
        })
      );
    });
  });

  describe("broadcastWinnerRevealed", () => {
    it("broadcasts WINNER_REVEALED event with correct payload", async () => {
      await broadcastWinnerRevealed(
        raffleId,
        "prize-1",
        "user-123",
        "John Doe"
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          event: RAFFLE_EVENTS.WINNER_REVEALED,
          payload: expect.objectContaining({
            type: RAFFLE_EVENTS.WINNER_REVEALED,
            payload: {
              raffleId,
              prizeId: "prize-1",
              winnerId: "user-123",
              winnerName: "John Doe",
            },
          }),
        })
      );
    });
  });

  describe("broadcastRaffleEnded", () => {
    it("broadcasts RAFFLE_ENDED event with correct payload", async () => {
      await broadcastRaffleEnded(raffleId, 5);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          event: RAFFLE_EVENTS.RAFFLE_ENDED,
          payload: expect.objectContaining({
            type: RAFFLE_EVENTS.RAFFLE_ENDED,
            payload: {
              raffleId,
              totalPrizesAwarded: 5,
            },
          }),
        })
      );
    });
  });
});
