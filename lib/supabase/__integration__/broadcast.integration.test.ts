/**
 * Integration Tests for Broadcast Channel
 *
 * Story 6.2: Real-time Channel Setup & Synchronization
 * AC #6: Latency Verification - Verify end-to-end latency < 500ms
 *
 * These tests run against a REAL Supabase test instance.
 * They test actual broadcast channel operations and latency.
 *
 * Run with: npm run test:integration
 *
 * Prerequisites:
 *   1. Docker running
 *   2. Test Supabase instance started: npm run supabase:test:start
 *   3. .env.test configured with test instance keys
 *
 * Note: Broadcast integration tests are challenging because:
 * - They require multiple connected clients
 * - Network conditions affect latency
 * - Supabase local dev may not fully replicate production behavior
 *
 * These tests verify the basic infrastructure works; actual latency
 * should be verified in production-like environments.
 */

import { createClient } from "@supabase/supabase-js";
import {
  RAFFLE_EVENTS,
  getBroadcastChannelName,
} from "@/lib/constants/events";

// Access test instance directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for admin operations (bypasses RLS)
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Anon client for simulating participant operations
const participantClient = createClient(supabaseUrl, supabaseAnonKey);

describe("Broadcast Channel Integration Tests", () => {
  const testRaffleId = "test-broadcast-raffle";

  beforeAll(() => {
    // Ensure required environment variables are set
    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();
    expect(supabaseServiceKey).toBeDefined();
  });

  describe("Channel Subscription (AC #1)", () => {
    it("should create channel with correct naming pattern", async () => {
      const channelName = getBroadcastChannelName(testRaffleId);
      expect(channelName).toBe(`raffle:${testRaffleId}:draw`);

      // Create a channel (this doesn't require the raffle to exist in DB)
      const channel = participantClient.channel(channelName);

      expect(channel).toBeDefined();

      // Cleanup
      await participantClient.removeChannel(channel);
    });

    it("should subscribe to channel within 1 second (AC #1)", async () => {
      const channelName = getBroadcastChannelName(testRaffleId);
      const channel = participantClient.channel(channelName);

      const startTime = Date.now();
      let subscribed = false;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Subscription timed out after 1 second"));
        }, 1000);

        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            subscribed = true;
            clearTimeout(timeout);
            resolve();
          } else if (status === "CHANNEL_ERROR") {
            clearTimeout(timeout);
            reject(new Error("Channel subscription error"));
          }
        });
      });

      const connectionTime = Date.now() - startTime;

      expect(subscribed).toBe(true);
      expect(connectionTime).toBeLessThan(1000); // AC #1: < 1 second

      console.log(`[Broadcast Test] Connection time: ${connectionTime}ms`);

      // Cleanup
      await channel.unsubscribe();
      await participantClient.removeChannel(channel);
    });
  });

  describe("Event Broadcast (AC #2)", () => {
    it("should broadcast event and receive within 500ms threshold", async () => {
      const channelName = getBroadcastChannelName(testRaffleId);

      // Setup receiver (simulating participant)
      const receiverChannel = participantClient.channel(channelName);
      let receivedEvent: { payload: unknown; receivedAt: number } | null = null;

      await new Promise<void>((resolve) => {
        receiverChannel
          .on(
            "broadcast",
            { event: RAFFLE_EVENTS.DRAW_START },
            (payload) => {
              receivedEvent = {
                payload,
                receivedAt: Date.now(),
              };
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              resolve();
            }
          });
      });

      // Small delay to ensure subscription is fully active
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Setup sender (simulating admin) and send event
      const senderChannel = adminClient.channel(channelName);
      const sentTimestamp = Date.now();
      const sentIsoTimestamp = new Date(sentTimestamp).toISOString();

      await senderChannel.send({
        type: "broadcast",
        event: RAFFLE_EVENTS.DRAW_START,
        payload: {
          type: RAFFLE_EVENTS.DRAW_START,
          payload: {
            raffleId: testRaffleId,
            prizeId: "test-prize",
            prizeName: "Test Prize",
          },
          timestamp: sentIsoTimestamp,
        },
      });

      // Wait for event to be received (with timeout)
      const maxWait = 1000; // 1 second max wait
      const startWait = Date.now();
      while (!receivedEvent && Date.now() - startWait < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Verify event was received
      expect(receivedEvent).not.toBeNull();

      if (receivedEvent) {
        const latency = receivedEvent.receivedAt - sentTimestamp;
        console.log(`[Broadcast Test] Event latency: ${latency}ms`);

        // AC #2: Latency should be < 500ms
        // Note: In local testing, this should be very fast
        // In production, network conditions may affect this
        expect(latency).toBeLessThan(500);
      }

      // Cleanup
      await receiverChannel.unsubscribe();
      await participantClient.removeChannel(receiverChannel);
      await adminClient.removeChannel(senderChannel);
    });

    it("should broadcast all event types correctly", async () => {
      const channelName = getBroadcastChannelName(testRaffleId);
      const receivedEvents: string[] = [];

      // Setup receiver
      const receiverChannel = participantClient.channel(channelName);

      await new Promise<void>((resolve) => {
        receiverChannel
          .on("broadcast", { event: RAFFLE_EVENTS.DRAW_START }, () => {
            receivedEvents.push(RAFFLE_EVENTS.DRAW_START);
          })
          .on("broadcast", { event: RAFFLE_EVENTS.WHEEL_SEED }, () => {
            receivedEvents.push(RAFFLE_EVENTS.WHEEL_SEED);
          })
          .on("broadcast", { event: RAFFLE_EVENTS.WINNER_REVEALED }, () => {
            receivedEvents.push(RAFFLE_EVENTS.WINNER_REVEALED);
          })
          .on("broadcast", { event: RAFFLE_EVENTS.RAFFLE_ENDED }, () => {
            receivedEvents.push(RAFFLE_EVENTS.RAFFLE_ENDED);
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              resolve();
            }
          });
      });

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send all event types
      const senderChannel = adminClient.channel(channelName);
      const timestamp = new Date().toISOString();

      const events = [
        RAFFLE_EVENTS.DRAW_START,
        RAFFLE_EVENTS.WHEEL_SEED,
        RAFFLE_EVENTS.WINNER_REVEALED,
        RAFFLE_EVENTS.RAFFLE_ENDED,
      ];

      for (const event of events) {
        await senderChannel.send({
          type: "broadcast",
          event,
          payload: {
            type: event,
            payload: { raffleId: testRaffleId },
            timestamp,
          },
        });
        // Small delay between events
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Wait for all events
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify all events were received
      expect(receivedEvents).toContain(RAFFLE_EVENTS.DRAW_START);
      expect(receivedEvents).toContain(RAFFLE_EVENTS.WHEEL_SEED);
      expect(receivedEvents).toContain(RAFFLE_EVENTS.WINNER_REVEALED);
      expect(receivedEvents).toContain(RAFFLE_EVENTS.RAFFLE_ENDED);

      // Cleanup
      await receiverChannel.unsubscribe();
      await participantClient.removeChannel(receiverChannel);
      await adminClient.removeChannel(senderChannel);
    });
  });

  describe("Event Constants (AC #3)", () => {
    it("should have all required event constants defined", () => {
      expect(RAFFLE_EVENTS.DRAW_START).toBe("DRAW_START");
      expect(RAFFLE_EVENTS.WHEEL_SEED).toBe("WHEEL_SEED");
      expect(RAFFLE_EVENTS.WINNER_REVEALED).toBe("WINNER_REVEALED");
      expect(RAFFLE_EVENTS.RAFFLE_ENDED).toBe("RAFFLE_ENDED");
    });

    it("should generate correct channel names", () => {
      const raffleId = "abc-123-def";
      const channelName = getBroadcastChannelName(raffleId);
      expect(channelName).toBe("raffle:abc-123-def:draw");
    });
  });

  describe("Multiple Subscribers (AC #2)", () => {
    it("should deliver event to multiple subscribers simultaneously", async () => {
      const channelName = getBroadcastChannelName(testRaffleId);
      const receiveTimes: number[] = [];

      // Create multiple subscriber clients
      const subscribers: ReturnType<typeof createClient>[] = [];
      const channels: ReturnType<(typeof participantClient)["channel"]>[] = [];

      for (let i = 0; i < 3; i++) {
        const client = createClient(supabaseUrl, supabaseAnonKey);
        subscribers.push(client);
        const channel = client.channel(channelName);
        channels.push(channel);

        await new Promise<void>((resolve) => {
          channel
            .on("broadcast", { event: RAFFLE_EVENTS.DRAW_START }, () => {
              receiveTimes.push(Date.now());
            })
            .subscribe((status) => {
              if (status === "SUBSCRIBED") {
                resolve();
              }
            });
        });
      }

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send event
      const senderChannel = adminClient.channel(channelName);
      const sentTime = Date.now();

      await senderChannel.send({
        type: "broadcast",
        event: RAFFLE_EVENTS.DRAW_START,
        payload: {
          type: RAFFLE_EVENTS.DRAW_START,
          payload: { raffleId: testRaffleId },
          timestamp: new Date(sentTime).toISOString(),
        },
      });

      // Wait for all receivers
      await new Promise((resolve) => setTimeout(resolve, 500));

      // All subscribers should have received the event
      expect(receiveTimes.length).toBe(3);

      // All receive times should be within 500ms of send time
      for (const receiveTime of receiveTimes) {
        const latency = receiveTime - sentTime;
        expect(latency).toBeLessThan(500);
        console.log(`[Broadcast Test] Subscriber latency: ${latency}ms`);
      }

      // Cleanup
      for (const channel of channels) {
        await channel.unsubscribe();
      }
      await adminClient.removeChannel(senderChannel);
    });
  });
});
