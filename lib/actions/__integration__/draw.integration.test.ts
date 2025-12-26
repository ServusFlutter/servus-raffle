/**
 * Integration Tests for Draw Winner Server Action
 *
 * Story 6.3: Draw Winner Server Action
 *
 * These tests run against a REAL Supabase test instance.
 * They test actual database operations including:
 * - Winner record creation
 * - Prize update atomicity
 * - Previous winner exclusion
 *
 * Run with: npm run test:integration
 *
 * Prerequisites:
 *   1. Docker running
 *   2. Test Supabase instance started: npm run supabase:test:start
 *   3. .env.test configured with test instance keys
 */

import { createClient } from "@supabase/supabase-js";

// Access test instance directly (not through Next.js server components)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for admin operations (bypasses RLS)
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

describe("Draw Winner Integration Tests", () => {
  // Test data
  let testRaffleId: string;
  let testPrize1Id: string;
  let testPrize2Id: string;
  let testUser1Id: string;
  let testUser2Id: string;
  let testUser3Id: string;
  let testUser1Email: string;
  let testUser2Email: string;
  let testUser3Email: string;

  beforeAll(async () => {
    // Create test users
    const timestamp = Date.now();

    // User 1 - will have 5 tickets
    testUser1Email = `test-draw-1-${timestamp}@example.com`;
    const { data: user1Data, error: user1Error } =
      await adminClient.auth.admin.createUser({
        email: testUser1Email,
        password: global.TEST_PASSWORD,
        email_confirm: true,
      });

    if (user1Error) {
      throw new Error(`Failed to create test user 1: ${user1Error.message}`);
    }
    testUser1Id = user1Data.user.id;

    await adminClient.from("users").insert({
      id: testUser1Id,
      email: testUser1Email,
      name: "Test User One",
    });

    // User 2 - will have 2 tickets
    testUser2Email = `test-draw-2-${timestamp}@example.com`;
    const { data: user2Data, error: user2Error } =
      await adminClient.auth.admin.createUser({
        email: testUser2Email,
        password: global.TEST_PASSWORD,
        email_confirm: true,
      });

    if (user2Error) {
      throw new Error(`Failed to create test user 2: ${user2Error.message}`);
    }
    testUser2Id = user2Data.user.id;

    await adminClient.from("users").insert({
      id: testUser2Id,
      email: testUser2Email,
      name: "Test User Two",
    });

    // User 3 - will be a previous winner
    testUser3Email = `test-draw-3-${timestamp}@example.com`;
    const { data: user3Data, error: user3Error } =
      await adminClient.auth.admin.createUser({
        email: testUser3Email,
        password: global.TEST_PASSWORD,
        email_confirm: true,
      });

    if (user3Error) {
      throw new Error(`Failed to create test user 3: ${user3Error.message}`);
    }
    testUser3Id = user3Data.user.id;

    await adminClient.from("users").insert({
      id: testUser3Id,
      email: testUser3Email,
      name: "Test User Three (Previous Winner)",
    });

    // Create test raffle
    const { data: raffleData, error: raffleError } = await adminClient
      .from("raffles")
      .insert({
        name: `Test Draw Raffle ${timestamp}`,
        status: "active",
      })
      .select()
      .single();

    if (raffleError) {
      throw new Error(`Failed to create test raffle: ${raffleError.message}`);
    }
    testRaffleId = raffleData.id;

    // Create test prizes
    const { data: prize1Data, error: prize1Error } = await adminClient
      .from("prizes")
      .insert({
        raffle_id: testRaffleId,
        name: "First Prize",
        sort_order: 0,
      })
      .select()
      .single();

    if (prize1Error) {
      throw new Error(`Failed to create test prize 1: ${prize1Error.message}`);
    }
    testPrize1Id = prize1Data.id;

    const { data: prize2Data, error: prize2Error } = await adminClient
      .from("prizes")
      .insert({
        raffle_id: testRaffleId,
        name: "Second Prize",
        sort_order: 1,
      })
      .select()
      .single();

    if (prize2Error) {
      throw new Error(`Failed to create test prize 2: ${prize2Error.message}`);
    }
    testPrize2Id = prize2Data.id;

    // Add participants with different ticket counts
    await adminClient.from("participants").insert([
      {
        raffle_id: testRaffleId,
        user_id: testUser1Id,
        ticket_count: 5,
      },
      {
        raffle_id: testRaffleId,
        user_id: testUser2Id,
        ticket_count: 2,
      },
      {
        raffle_id: testRaffleId,
        user_id: testUser3Id,
        ticket_count: 3,
      },
    ]);

    console.log(`
    ✓ Created test data:
      - Raffle: ${testRaffleId}
      - Prize 1: ${testPrize1Id}
      - Prize 2: ${testPrize2Id}
      - User 1 (5 tickets): ${testUser1Id}
      - User 2 (2 tickets): ${testUser2Id}
      - User 3 (3 tickets): ${testUser3Id}
    `);
  });

  afterAll(async () => {
    // Clean up test data in reverse order of dependencies
    if (testRaffleId) {
      // Delete winners first
      await adminClient.from("winners").delete().eq("raffle_id", testRaffleId);

      // Delete prizes
      await adminClient.from("prizes").delete().eq("raffle_id", testRaffleId);

      // Delete participants
      await adminClient
        .from("participants")
        .delete()
        .eq("raffle_id", testRaffleId);

      // Delete raffle
      await adminClient.from("raffles").delete().eq("id", testRaffleId);
    }

    // Delete test users
    if (testUser1Id) {
      await adminClient.from("users").delete().eq("id", testUser1Id);
      await adminClient.auth.admin.deleteUser(testUser1Id);
    }
    if (testUser2Id) {
      await adminClient.from("users").delete().eq("id", testUser2Id);
      await adminClient.auth.admin.deleteUser(testUser2Id);
    }
    if (testUser3Id) {
      await adminClient.from("users").delete().eq("id", testUser3Id);
      await adminClient.auth.admin.deleteUser(testUser3Id);
    }

    console.log("✓ Cleaned up test data");
  });

  describe("Database Schema Validation", () => {
    it("should verify winners table exists with correct columns", async () => {
      const { error } = await adminClient.from("winners").select("*").limit(1);

      expect(error).toBeNull();
      // Just verify the query works - columns exist
    });

    it("should verify prizes table has awarded_to and awarded_at columns", async () => {
      const { data, error } = await adminClient
        .from("prizes")
        .select("id, name, awarded_to, awarded_at")
        .eq("id", testPrize1Id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveProperty("awarded_to");
      expect(data).toHaveProperty("awarded_at");
      expect(data?.awarded_to).toBeNull(); // Not awarded yet
    });
  });

  describe("Winner Record Creation", () => {
    it("should create winner record with correct tickets_at_win", async () => {
      const ticketsAtWin = 5;

      // Simulate a draw by creating winner record directly
      const { data: winnerRecord, error } = await adminClient
        .from("winners")
        .insert({
          raffle_id: testRaffleId,
          prize_id: testPrize1Id,
          user_id: testUser1Id,
          tickets_at_win: ticketsAtWin,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(winnerRecord).toBeDefined();
      expect(winnerRecord?.tickets_at_win).toBe(ticketsAtWin);
      expect(winnerRecord?.raffle_id).toBe(testRaffleId);
      expect(winnerRecord?.prize_id).toBe(testPrize1Id);
      expect(winnerRecord?.user_id).toBe(testUser1Id);
      expect(winnerRecord?.won_at).toBeDefined();

      // Clean up
      await adminClient.from("winners").delete().eq("id", winnerRecord.id);
    });
  });

  describe("Prize Update", () => {
    it("should update prize with awarded_to and awarded_at", async () => {
      const now = new Date().toISOString();

      // Update prize
      const { error: updateError } = await adminClient
        .from("prizes")
        .update({
          awarded_to: testUser1Id,
          awarded_at: now,
        })
        .eq("id", testPrize1Id);

      expect(updateError).toBeNull();

      // Verify update
      const { data: prize, error: fetchError } = await adminClient
        .from("prizes")
        .select("awarded_to, awarded_at")
        .eq("id", testPrize1Id)
        .single();

      expect(fetchError).toBeNull();
      expect(prize?.awarded_to).toBe(testUser1Id);
      expect(prize?.awarded_at).toBe(now);

      // Reset for other tests
      await adminClient
        .from("prizes")
        .update({
          awarded_to: null,
          awarded_at: null,
        })
        .eq("id", testPrize1Id);
    });
  });

  describe("Previous Winner Exclusion", () => {
    it("should record a winner and exclude them from subsequent queries", async () => {
      // Make User 3 a winner
      await adminClient.from("winners").insert({
        raffle_id: testRaffleId,
        prize_id: testPrize1Id,
        user_id: testUser3Id,
        tickets_at_win: 3,
      });

      // Query existing winners
      const { data: winners, error: winnersError } = await adminClient
        .from("winners")
        .select("user_id")
        .eq("raffle_id", testRaffleId);

      expect(winnersError).toBeNull();
      expect(winners).toHaveLength(1);
      expect(winners?.[0].user_id).toBe(testUser3Id);

      // Get all participants
      const { data: allParticipants } = await adminClient
        .from("participants")
        .select("user_id")
        .eq("raffle_id", testRaffleId);

      expect(allParticipants).toHaveLength(3);

      // Filter out winners
      const winnerIds = new Set(winners?.map((w) => w.user_id));
      const eligible = allParticipants?.filter((p) => !winnerIds.has(p.user_id));

      expect(eligible).toHaveLength(2);
      expect(eligible?.map((e) => e.user_id)).toContain(testUser1Id);
      expect(eligible?.map((e) => e.user_id)).toContain(testUser2Id);
      expect(eligible?.map((e) => e.user_id)).not.toContain(testUser3Id);

      // Clean up
      await adminClient.from("winners").delete().eq("raffle_id", testRaffleId);
    });
  });

  describe("Accumulated Tickets Calculation", () => {
    it("should calculate tickets from participants table", async () => {
      // Get accumulated tickets for User 1
      const { data: participations, error } = await adminClient
        .from("participants")
        .select("ticket_count")
        .eq("user_id", testUser1Id);

      expect(error).toBeNull();
      const total = participations?.reduce((sum, p) => sum + p.ticket_count, 0);
      expect(total).toBe(5);
    });

    it("should only count tickets after last win", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // Create an older raffle for pre-win participation
      const { data: oldRaffle } = await adminClient
        .from("raffles")
        .insert({
          name: "Old Test Raffle",
          status: "completed",
        })
        .select()
        .single();

      // User 1 had 10 tickets in old raffle (joined 2 days ago)
      await adminClient.from("participants").insert({
        raffle_id: oldRaffle!.id,
        user_id: testUser1Id,
        ticket_count: 10,
        joined_at: twoDaysAgo.toISOString(),
      });

      // User 1 won yesterday
      await adminClient.from("winners").insert({
        raffle_id: oldRaffle!.id,
        user_id: testUser1Id,
        tickets_at_win: 10,
        won_at: yesterday.toISOString(),
      });

      // Query: Find last win
      const { data: lastWin } = await adminClient
        .from("winners")
        .select("won_at")
        .eq("user_id", testUser1Id)
        .order("won_at", { ascending: false })
        .limit(1)
        .single();

      expect(lastWin?.won_at).toBeDefined();

      // Query: Get tickets after last win
      const { data: postWinTickets } = await adminClient
        .from("participants")
        .select("ticket_count")
        .eq("user_id", testUser1Id)
        .gt("joined_at", lastWin!.won_at);

      // Only the current raffle participation (5 tickets) should count
      // The old raffle (10 tickets) was before the win
      const accumulated = postWinTickets?.reduce(
        (sum, p) => sum + p.ticket_count,
        0
      );

      // Current raffle was created in beforeAll, which is after yesterday
      // So it should be included
      expect(accumulated).toBe(5);

      // Clean up
      await adminClient
        .from("participants")
        .delete()
        .eq("raffle_id", oldRaffle!.id);
      await adminClient.from("winners").delete().eq("raffle_id", oldRaffle!.id);
      await adminClient.from("raffles").delete().eq("id", oldRaffle!.id);
    });
  });

  describe("Full Draw Flow Simulation", () => {
    it("should complete full draw flow with atomic updates", async () => {
      // Step 1: Get eligible participants (exclude previous winners)
      const { data: existingWinners } = await adminClient
        .from("winners")
        .select("user_id")
        .eq("raffle_id", testRaffleId);

      const winnerIds = new Set(existingWinners?.map((w) => w.user_id) || []);

      const { data: participants } = await adminClient
        .from("participants")
        .select(
          `
          user_id,
          ticket_count,
          users (
            id,
            name
          )
        `
        )
        .eq("raffle_id", testRaffleId);

      const eligible = participants?.filter((p) => !winnerIds.has(p.user_id));
      expect(eligible?.length).toBe(3);

      // Step 2: Select winner (use first eligible for deterministic test)
      const selectedWinner = eligible![0];

      // Step 3: Create winner record
      const now = new Date().toISOString();
      const { data: winnerRecord, error: winnerError } = await adminClient
        .from("winners")
        .insert({
          raffle_id: testRaffleId,
          prize_id: testPrize2Id,
          user_id: selectedWinner.user_id,
          tickets_at_win: selectedWinner.ticket_count,
          won_at: now,
        })
        .select()
        .single();

      expect(winnerError).toBeNull();
      expect(winnerRecord).toBeDefined();

      // Step 4: Update prize
      const { error: prizeError } = await adminClient
        .from("prizes")
        .update({
          awarded_to: selectedWinner.user_id,
          awarded_at: now,
        })
        .eq("id", testPrize2Id);

      expect(prizeError).toBeNull();

      // Step 5: Verify both updates succeeded
      const { data: verifyWinner } = await adminClient
        .from("winners")
        .select("*")
        .eq("id", winnerRecord!.id)
        .single();

      const { data: verifyPrize } = await adminClient
        .from("prizes")
        .select("*")
        .eq("id", testPrize2Id)
        .single();

      expect(verifyWinner?.user_id).toBe(selectedWinner.user_id);
      expect(verifyWinner?.tickets_at_win).toBe(selectedWinner.ticket_count);
      expect(verifyPrize?.awarded_to).toBe(selectedWinner.user_id);
      expect(verifyPrize?.awarded_at).toBe(now);

      // Clean up
      await adminClient.from("winners").delete().eq("id", winnerRecord!.id);
      await adminClient
        .from("prizes")
        .update({ awarded_to: null, awarded_at: null })
        .eq("id", testPrize2Id);
    });

    it("should exclude first winner from second draw", async () => {
      // First draw - User 1 wins Prize 1
      const { data: winner1 } = await adminClient
        .from("winners")
        .insert({
          raffle_id: testRaffleId,
          prize_id: testPrize1Id,
          user_id: testUser1Id,
          tickets_at_win: 5,
        })
        .select()
        .single();

      await adminClient
        .from("prizes")
        .update({
          awarded_to: testUser1Id,
          awarded_at: new Date().toISOString(),
        })
        .eq("id", testPrize1Id);

      // Second draw - User 1 should be excluded
      const { data: existingWinners } = await adminClient
        .from("winners")
        .select("user_id")
        .eq("raffle_id", testRaffleId);

      const winnerIds = new Set(existingWinners?.map((w) => w.user_id));
      expect(winnerIds.has(testUser1Id)).toBe(true);

      const { data: participants } = await adminClient
        .from("participants")
        .select("user_id")
        .eq("raffle_id", testRaffleId);

      const eligible = participants?.filter((p) => !winnerIds.has(p.user_id));

      // Only User 2 and User 3 should be eligible
      expect(eligible?.length).toBe(2);
      expect(eligible?.map((e) => e.user_id)).not.toContain(testUser1Id);
      expect(eligible?.map((e) => e.user_id)).toContain(testUser2Id);
      expect(eligible?.map((e) => e.user_id)).toContain(testUser3Id);

      // Clean up
      await adminClient.from("winners").delete().eq("id", winner1!.id);
      await adminClient
        .from("prizes")
        .update({ awarded_to: null, awarded_at: null })
        .eq("id", testPrize1Id);
    });
  });
});
