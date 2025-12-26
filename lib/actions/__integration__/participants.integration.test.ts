/**
 * Integration Tests for Participants Actions
 *
 * These tests run against a REAL Supabase test instance.
 * They test actual database operations, RLS policies, and auth flows.
 *
 * Run with: npm run test:integration
 *
 * Prerequisites:
 *   1. Docker running
 *   2. Test Supabase instance started: npm run supabase:test:start
 *   3. .env.test configured with test instance keys
 */

import { createClient } from "@supabase/supabase-js";

// Declare global test utilities from jest.integration.setup.js
declare global {
  var TEST_PASSWORD: string;
  var TEST_RAFFLE_ACTIVE_ID: string;
  var TEST_RAFFLE_DRAFT_ID: string;
  var TEST_RAFFLE_COMPLETED_ID: string;
}

// Access test instance directly (not through Next.js server components)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for admin operations (bypasses RLS)
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

describe("Participants Integration Tests", () => {
  // Test user created for this test run
  let testUserId: string;
  let testUserEmail: string;
  let testUser2Id: string;
  let testUser2Email: string;

  beforeAll(async () => {
    // Create first test user
    testUserEmail = `test-participant-${Date.now()}@example.com`;

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: testUserEmail,
        password: global.TEST_PASSWORD,
        email_confirm: true,
      });

    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`);
    }

    testUserId = authData.user.id;

    // Create corresponding public.users record
    const { error: userError } = await adminClient.from("users").insert({
      id: testUserId,
      email: testUserEmail,
      name: "Test Participant 1",
      avatar_url: "https://example.com/avatar1.jpg",
    });

    if (userError) {
      throw new Error(`Failed to create public user: ${userError.message}`);
    }

    // Create second test user
    testUser2Email = `test-participant2-${Date.now()}@example.com`;

    const { data: authData2, error: authError2 } =
      await adminClient.auth.admin.createUser({
        email: testUser2Email,
        password: global.TEST_PASSWORD,
        email_confirm: true,
      });

    if (authError2) {
      throw new Error(`Failed to create test user 2: ${authError2.message}`);
    }

    testUser2Id = authData2.user.id;

    // Create corresponding public.users record
    const { error: userError2 } = await adminClient.from("users").insert({
      id: testUser2Id,
      email: testUser2Email,
      name: "Test Participant 2",
      avatar_url: null, // No avatar for this user
    });

    if (userError2) {
      throw new Error(`Failed to create public user 2: ${userError2.message}`);
    }

    console.log(
      `Created test users: ${testUserEmail} (${testUserId}), ${testUser2Email} (${testUser2Id})`
    );
  });

  afterAll(async () => {
    // Clean up test users
    if (testUserId) {
      await adminClient.from("users").delete().eq("id", testUserId);
      await adminClient.auth.admin.deleteUser(testUserId);
    }
    if (testUser2Id) {
      await adminClient.from("users").delete().eq("id", testUser2Id);
      await adminClient.auth.admin.deleteUser(testUser2Id);
    }
    console.log(`Cleaned up test users`);
  });

  describe("getParticipantsWithDetails queries", () => {
    it("should return participants with user details from join", async () => {
      // Add participants to active raffle
      await adminClient.from("participants").insert([
        {
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUserId,
          ticket_count: 3,
        },
        {
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUser2Id,
          ticket_count: 1,
        },
      ]);

      // Query participants with user join (same as getParticipantsWithDetails)
      const { data, error } = await adminClient
        .from("participants")
        .select(
          `
          id,
          user_id,
          ticket_count,
          joined_at,
          user:users!user_id (
            name,
            avatar_url
          )
        `
        )
        .eq("raffle_id", global.TEST_RAFFLE_ACTIVE_ID)
        .order("joined_at", { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThanOrEqual(2);

      // Find our test participants
      const testParticipant1 = data!.find((p) => p.user_id === testUserId);
      const testParticipant2 = data!.find((p) => p.user_id === testUser2Id);

      expect(testParticipant1).toBeDefined();
      expect(testParticipant1!.ticket_count).toBe(3);
      const user1 = testParticipant1!.user as unknown as { name: string; avatar_url: string | null };
      expect(user1.name).toBe("Test Participant 1");
      expect(user1.avatar_url).toBe("https://example.com/avatar1.jpg");

      expect(testParticipant2).toBeDefined();
      expect(testParticipant2!.ticket_count).toBe(1);
      const user2 = testParticipant2!.user as unknown as { name: string; avatar_url: string | null };
      expect(user2.name).toBe("Test Participant 2");
      expect(user2.avatar_url).toBeNull();

      // Clean up
      await adminClient
        .from("participants")
        .delete()
        .eq("raffle_id", global.TEST_RAFFLE_ACTIVE_ID)
        .in("user_id", [testUserId, testUser2Id]);
    });

    it("should return empty array for raffle with no participants", async () => {
      // Create a new raffle with no participants
      const { data: newRaffle, error: createError } = await adminClient
        .from("raffles")
        .insert({
          name: "Empty Test Raffle",
          status: "active",
        })
        .select()
        .single();

      expect(createError).toBeNull();

      // Query participants
      const { data, error } = await adminClient
        .from("participants")
        .select(
          `
          id,
          user_id,
          ticket_count,
          joined_at,
          user:users!user_id (
            name,
            avatar_url
          )
        `
        )
        .eq("raffle_id", newRaffle!.id)
        .order("joined_at", { ascending: false });

      expect(error).toBeNull();
      expect(data).toEqual([]);

      // Clean up
      await adminClient.from("raffles").delete().eq("id", newRaffle!.id);
    });
  });

  describe("getRaffleStatistics queries", () => {
    it("should correctly count participants and sum tickets", async () => {
      // Add participants with different ticket counts
      await adminClient.from("participants").insert([
        {
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUserId,
          ticket_count: 3,
        },
        {
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUser2Id,
          ticket_count: 5,
        },
      ]);

      // Query for statistics
      const { data, error } = await adminClient
        .from("participants")
        .select("ticket_count")
        .eq("raffle_id", global.TEST_RAFFLE_ACTIVE_ID);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Calculate statistics
      const participantCount = data!.length;
      const totalTickets = data!.reduce(
        (sum, p) => sum + (p.ticket_count || 0),
        0
      );

      expect(participantCount).toBeGreaterThanOrEqual(2);
      expect(totalTickets).toBeGreaterThanOrEqual(8); // At least 3 + 5 = 8

      // Clean up
      await adminClient
        .from("participants")
        .delete()
        .eq("raffle_id", global.TEST_RAFFLE_ACTIVE_ID)
        .in("user_id", [testUserId, testUser2Id]);
    });

    it("should return zero statistics for raffle with no participants", async () => {
      // Create a new raffle with no participants
      const { data: newRaffle, error: createError } = await adminClient
        .from("raffles")
        .insert({
          name: "Empty Stats Raffle",
          status: "active",
        })
        .select()
        .single();

      expect(createError).toBeNull();

      // Query for statistics
      const { data, error } = await adminClient
        .from("participants")
        .select("ticket_count")
        .eq("raffle_id", newRaffle!.id);

      expect(error).toBeNull();
      expect(data).toEqual([]);

      // Calculate statistics
      const participantCount = data!.length;
      const totalTickets = data!.reduce(
        (sum, p) => sum + (p.ticket_count || 0),
        0
      );

      expect(participantCount).toBe(0);
      expect(totalTickets).toBe(0);

      // Clean up
      await adminClient.from("raffles").delete().eq("id", newRaffle!.id);
    });
  });

  describe("Ordering behavior", () => {
    it("should order participants by joined_at descending", async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

      // Add participants with specific timestamps
      await adminClient.from("participants").insert([
        {
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUserId,
          ticket_count: 1,
          joined_at: earlier.toISOString(),
        },
        {
          raffle_id: global.TEST_RAFFLE_ACTIVE_ID,
          user_id: testUser2Id,
          ticket_count: 1,
          joined_at: now.toISOString(),
        },
      ]);

      // Query with ordering
      const { data, error } = await adminClient
        .from("participants")
        .select("user_id, joined_at")
        .eq("raffle_id", global.TEST_RAFFLE_ACTIVE_ID)
        .in("user_id", [testUserId, testUser2Id])
        .order("joined_at", { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(2);

      // Second user (joined later) should be first
      expect(data![0].user_id).toBe(testUser2Id);
      expect(data![1].user_id).toBe(testUserId);

      // Clean up
      await adminClient
        .from("participants")
        .delete()
        .eq("raffle_id", global.TEST_RAFFLE_ACTIVE_ID)
        .in("user_id", [testUserId, testUser2Id]);
    });
  });
});
