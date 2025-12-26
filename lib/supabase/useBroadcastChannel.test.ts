/**
 * Tests for useBroadcastChannel hook
 *
 * Story 6.2: Real-time Channel Setup & Synchronization
 * AC #1: Broadcast Channel Subscription
 * AC #5: Reconnection Handling
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useBroadcastChannel } from "./useBroadcastChannel";
import { RAFFLE_EVENTS } from "@/lib/constants/events";

// Mock Supabase client
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockSend = jest.fn();
const mockOn = jest.fn().mockReturnThis();

const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  send: mockSend,
};

const mockSupabaseClient = {
  channel: jest.fn(() => mockChannel),
  removeChannel: jest.fn(),
};

jest.mock("./client", () => ({
  createClient: () => mockSupabaseClient,
}));

describe("useBroadcastChannel", () => {
  const raffleId = "test-raffle-123";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSubscribe.mockImplementation((callback) => {
      if (callback) {
        callback("SUBSCRIBED");
      }
      return mockChannel;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Channel Subscription (AC #1)", () => {
    it("creates channel with correct naming pattern: raffle:{id}:draw", () => {
      renderHook(() => useBroadcastChannel(raffleId));

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        `raffle:${raffleId}:draw`
      );
    });

    it("subscribes to all raffle event types", () => {
      renderHook(() => useBroadcastChannel(raffleId));

      // Should subscribe to all event types
      expect(mockOn).toHaveBeenCalledWith(
        "broadcast",
        { event: RAFFLE_EVENTS.DRAW_START },
        expect.any(Function)
      );
      expect(mockOn).toHaveBeenCalledWith(
        "broadcast",
        { event: RAFFLE_EVENTS.WHEEL_SEED },
        expect.any(Function)
      );
      expect(mockOn).toHaveBeenCalledWith(
        "broadcast",
        { event: RAFFLE_EVENTS.WINNER_REVEALED },
        expect.any(Function)
      );
      expect(mockOn).toHaveBeenCalledWith(
        "broadcast",
        { event: RAFFLE_EVENTS.RAFFLE_ENDED },
        expect.any(Function)
      );
    });

    it("calls subscribe on the channel", () => {
      renderHook(() => useBroadcastChannel(raffleId));

      expect(mockSubscribe).toHaveBeenCalled();
    });

    it("unsubscribes on unmount", () => {
      const { unmount } = renderHook(() => useBroadcastChannel(raffleId));

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe("Connection State Tracking (AC #1)", () => {
    it("starts in connecting state", () => {
      mockSubscribe.mockImplementation(() => mockChannel); // Don't call callback immediately

      const { result } = renderHook(() => useBroadcastChannel(raffleId));

      expect(result.current.connectionState).toBe("connecting");
    });

    it("transitions to connected when subscription succeeds", async () => {
      mockSubscribe.mockImplementation((callback) => {
        setTimeout(() => callback?.("SUBSCRIBED"), 0);
        return mockChannel;
      });

      const { result } = renderHook(() => useBroadcastChannel(raffleId));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe("connected");
      });
    });

    it("transitions to disconnected when subscription fails", async () => {
      mockSubscribe.mockImplementation((callback) => {
        setTimeout(() => callback?.("CHANNEL_ERROR"), 0);
        return mockChannel;
      });

      const { result } = renderHook(() => useBroadcastChannel(raffleId));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe("disconnected");
      });
    });

    it("exposes isConnected convenience boolean", async () => {
      mockSubscribe.mockImplementation((callback) => {
        setTimeout(() => callback?.("SUBSCRIBED"), 0);
        return mockChannel;
      });

      const { result } = renderHook(() => useBroadcastChannel(raffleId));

      act(() => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });
  });

  describe("Event Callbacks", () => {
    it("calls onDrawStart callback when DRAW_START event received", () => {
      const onDrawStart = jest.fn();
      let drawStartHandler: (payload: unknown) => void = () => {};

      mockOn.mockImplementation((type, config, handler) => {
        if (config.event === RAFFLE_EVENTS.DRAW_START) {
          drawStartHandler = handler;
        }
        return mockChannel;
      });

      renderHook(() =>
        useBroadcastChannel(raffleId, {
          onDrawStart,
        })
      );

      const payload = {
        payload: {
          type: RAFFLE_EVENTS.DRAW_START,
          payload: { raffleId, prizeId: "prize-1", prizeName: "Grand Prize" },
          timestamp: new Date().toISOString(),
        },
      };

      act(() => {
        drawStartHandler(payload);
      });

      expect(onDrawStart).toHaveBeenCalledWith(payload.payload);
    });

    it("calls onWheelSeed callback when WHEEL_SEED event received", () => {
      const onWheelSeed = jest.fn();
      let wheelSeedHandler: (payload: unknown) => void = () => {};

      mockOn.mockImplementation((type, config, handler) => {
        if (config.event === RAFFLE_EVENTS.WHEEL_SEED) {
          wheelSeedHandler = handler;
        }
        return mockChannel;
      });

      renderHook(() =>
        useBroadcastChannel(raffleId, {
          onWheelSeed,
        })
      );

      const payload = {
        payload: {
          type: RAFFLE_EVENTS.WHEEL_SEED,
          payload: { raffleId, prizeId: "prize-1", seed: 12345 },
          timestamp: new Date().toISOString(),
        },
      };

      act(() => {
        wheelSeedHandler(payload);
      });

      expect(onWheelSeed).toHaveBeenCalledWith(payload.payload);
    });

    it("calls onWinnerRevealed callback when WINNER_REVEALED event received", () => {
      const onWinnerRevealed = jest.fn();
      let winnerHandler: (payload: unknown) => void = () => {};

      mockOn.mockImplementation((type, config, handler) => {
        if (config.event === RAFFLE_EVENTS.WINNER_REVEALED) {
          winnerHandler = handler;
        }
        return mockChannel;
      });

      renderHook(() =>
        useBroadcastChannel(raffleId, {
          onWinnerRevealed,
        })
      );

      const payload = {
        payload: {
          type: RAFFLE_EVENTS.WINNER_REVEALED,
          payload: {
            raffleId,
            prizeId: "prize-1",
            winnerId: "user-1",
            winnerName: "John Doe",
          },
          timestamp: new Date().toISOString(),
        },
      };

      act(() => {
        winnerHandler(payload);
      });

      expect(onWinnerRevealed).toHaveBeenCalledWith(payload.payload);
    });

    it("calls onRaffleEnded callback when RAFFLE_ENDED event received", () => {
      const onRaffleEnded = jest.fn();
      let endedHandler: (payload: unknown) => void = () => {};

      mockOn.mockImplementation((type, config, handler) => {
        if (config.event === RAFFLE_EVENTS.RAFFLE_ENDED) {
          endedHandler = handler;
        }
        return mockChannel;
      });

      renderHook(() =>
        useBroadcastChannel(raffleId, {
          onRaffleEnded,
        })
      );

      const payload = {
        payload: {
          type: RAFFLE_EVENTS.RAFFLE_ENDED,
          payload: { raffleId, totalPrizesAwarded: 3 },
          timestamp: new Date().toISOString(),
        },
      };

      act(() => {
        endedHandler(payload);
      });

      expect(onRaffleEnded).toHaveBeenCalledWith(payload.payload);
    });
  });

  describe("Latency Logging", () => {
    it("logs event latency to console", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      let drawStartHandler: (payload: unknown) => void = () => {};

      mockOn.mockImplementation((type, config, handler) => {
        if (config.event === RAFFLE_EVENTS.DRAW_START) {
          drawStartHandler = handler;
        }
        return mockChannel;
      });

      renderHook(() => useBroadcastChannel(raffleId));

      const now = Date.now();
      const payload = {
        payload: {
          type: RAFFLE_EVENTS.DRAW_START,
          payload: { raffleId, prizeId: "prize-1", prizeName: "Grand Prize" },
          timestamp: new Date(now - 100).toISOString(), // 100ms ago
        },
      };

      act(() => {
        drawStartHandler(payload);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Broadcast] Event: DRAW_START, Latency:")
      );

      consoleSpy.mockRestore();
    });

    it("warns when latency exceeds 500ms threshold", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      let drawStartHandler: (payload: unknown) => void = () => {};

      mockOn.mockImplementation((type, config, handler) => {
        if (config.event === RAFFLE_EVENTS.DRAW_START) {
          drawStartHandler = handler;
        }
        return mockChannel;
      });

      renderHook(() => useBroadcastChannel(raffleId));

      const now = Date.now();
      const payload = {
        payload: {
          type: RAFFLE_EVENTS.DRAW_START,
          payload: { raffleId, prizeId: "prize-1", prizeName: "Grand Prize" },
          timestamp: new Date(now - 600).toISOString(), // 600ms ago
        },
      };

      act(() => {
        drawStartHandler(payload);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Broadcast] Latency exceeded 500ms threshold:")
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Reconnection Handling (AC #5)", () => {
    it("provides reconnect function", () => {
      const { result } = renderHook(() => useBroadcastChannel(raffleId));

      expect(result.current.reconnect).toBeDefined();
      expect(typeof result.current.reconnect).toBe("function");
    });

    it("exposes onReconnect callback option", () => {
      const onReconnect = jest.fn();
      mockSubscribe.mockImplementation((callback) => {
        setTimeout(() => callback?.("SUBSCRIBED"), 0);
        return mockChannel;
      });

      const { result } = renderHook(() =>
        useBroadcastChannel(raffleId, { onReconnect })
      );

      act(() => {
        jest.runAllTimers();
      });

      // Trigger reconnect
      act(() => {
        result.current.reconnect();
      });

      act(() => {
        jest.runAllTimers();
      });

      // onReconnect should be called after successful reconnection
      expect(onReconnect).toHaveBeenCalled();
    });

    it("uses exponential backoff for reconnection attempts", () => {
      const onReconnect = jest.fn();
      mockSubscribe.mockImplementation((callback) => {
        setTimeout(() => callback?.("SUBSCRIBED"), 0);
        return mockChannel;
      });

      const { result } = renderHook(() =>
        useBroadcastChannel(raffleId, { onReconnect })
      );

      // Initial connection
      act(() => {
        jest.runAllTimers();
      });

      // First reconnect - should use initial delay (1000ms)
      act(() => {
        result.current.reconnect();
      });

      // Advance by less than backoff delay - onReconnect should not be called yet
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onReconnect).not.toHaveBeenCalled();

      // Advance to complete the delay
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onReconnect).toHaveBeenCalledTimes(1);

      // Run remaining timers for subscription
      act(() => {
        jest.runAllTimers();
      });
    });
  });

  describe("Raffle ID Changes", () => {
    it("resubscribes when raffleId changes", () => {
      const { rerender } = renderHook(
        ({ id }) => useBroadcastChannel(id),
        { initialProps: { id: "raffle-1" } }
      );

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        "raffle:raffle-1:draw"
      );

      rerender({ id: "raffle-2" });

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        "raffle:raffle-2:draw"
      );
    });
  });
});
