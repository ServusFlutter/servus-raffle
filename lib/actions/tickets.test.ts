/**
 * @jest-environment node
 */
import { joinRaffle, getParticipation, getAccumulatedTickets, getRecentWin } from "./tickets";
import { createClient } from "@/lib/supabase/server";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/supabase/admin");

import { createAdminClient } from "@/lib/supabase/admin";

interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
  insert: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
}

describe("Ticket Server Actions", () => {
  let mockSupabase: MockSupabaseClient;
  let mockAdminClient: MockSupabaseClient;

  const validRaffleId = "123e4567-e89b-12d3-a456-426614174000";
  const validUserId = "123e4567-e89b-12d3-a456-426614174001";

  const mockParticipant = {
    id: "123e4567-e89b-12d3-a456-426614174002",
    raffle_id: validRaffleId,
    user_id: validUserId,
    ticket_count: 1,
    joined_at: "2025-12-25T10:00:00Z",
  };

  const mockRaffle = {
    id: validRaffleId,
    status: "active",
    qr_code_expires_at: "2025-12-25T23:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock for auth client (createClient)
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    // Create a fresh mock for admin client (createAdminClient)
    mockAdminClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);
  });

  describe("joinRaffle", () => {
    describe("validation", () => {
      it("returns error for invalid UUID", async () => {
        const result = await joinRaffle("not-a-valid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });

      it("returns error for empty string", async () => {
        const result = await joinRaffle("");

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });
    });

    describe("authentication", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await joinRaffle(validRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Not authenticated",
        });
      });

      it("returns error when auth check fails", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: "Auth error" },
        });

        const result = await joinRaffle(validRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Not authenticated",
        });
      });
    });

    describe("raffle validation", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("returns error when raffle not found", async () => {
        mockAdminClient.single.mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await joinRaffle(validRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Raffle not found",
        });
      });

      it("returns error when raffle is not active", async () => {
        mockAdminClient.single.mockResolvedValueOnce({
          data: { ...mockRaffle, status: "draft" },
          error: null,
        });

        const result = await joinRaffle(validRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Raffle is not active",
        });
      });

      it("returns error when raffle is completed", async () => {
        mockAdminClient.single.mockResolvedValueOnce({
          data: { ...mockRaffle, status: "completed" },
          error: null,
        });

        const result = await joinRaffle(validRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Raffle is not active",
        });
      });
    });

    describe("duplicate join handling (AC #4)", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("returns existing participant without creating duplicate", async () => {
        // Mock raffle lookup (via adminClient)
        mockAdminClient.single
          .mockResolvedValueOnce({
            data: mockRaffle,
            error: null,
          })
          // Mock existing participant check
          .mockResolvedValueOnce({
            data: mockParticipant,
            error: null,
          });

        const result = await joinRaffle(validRaffleId);

        expect(result).toEqual({
          data: {
            participant: mockParticipant,
            isNewJoin: false,
          },
          error: null,
        });
        // Should NOT call insert
        expect(mockAdminClient.insert).not.toHaveBeenCalled();
      });

      it("handles race condition with unique constraint violation", async () => {
        // Mock raffle lookup (via adminClient)
        mockAdminClient.single
          .mockResolvedValueOnce({
            data: mockRaffle,
            error: null,
          })
          // Mock no existing participant
          .mockResolvedValueOnce({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          })
          // Mock insert failing with unique constraint
          .mockResolvedValueOnce({
            data: null,
            error: { code: "23505", message: "duplicate key" },
          })
          // Mock fetching existing after conflict
          .mockResolvedValueOnce({
            data: mockParticipant,
            error: null,
          });

        const result = await joinRaffle(validRaffleId);

        expect(result).toEqual({
          data: {
            participant: mockParticipant,
            isNewJoin: false,
          },
          error: null,
        });
      });
    });

    describe("successful new join (AC #3)", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("creates new participant with 1 ticket", async () => {
        // Mock raffle lookup (via adminClient)
        mockAdminClient.single
          .mockResolvedValueOnce({
            data: mockRaffle,
            error: null,
          })
          // Mock no existing participant
          .mockResolvedValueOnce({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          })
          // Mock insert success
          .mockResolvedValueOnce({
            data: mockParticipant,
            error: null,
          });

        const result = await joinRaffle(validRaffleId);

        expect(result).toEqual({
          data: {
            participant: mockParticipant,
            isNewJoin: true,
          },
          error: null,
        });
        expect(mockAdminClient.from).toHaveBeenCalledWith("participants");
        expect(mockAdminClient.insert).toHaveBeenCalledWith({
          raffle_id: validRaffleId,
          user_id: validUserId,
          ticket_count: 1,
        });
      });
    });

    describe("database errors", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("returns error on insert failure", async () => {
        // Mock raffle lookup (via adminClient)
        mockAdminClient.single
          .mockResolvedValueOnce({
            data: mockRaffle,
            error: null,
          })
          // Mock no existing participant
          .mockResolvedValueOnce({
            data: null,
            error: { code: "PGRST116", message: "Not found" },
          })
          // Mock insert failure
          .mockResolvedValueOnce({
            data: null,
            error: { message: "Database error" },
          });

        const result = await joinRaffle(validRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Failed to join raffle",
        });
      });
    });
  });

  describe("getAccumulatedTickets", () => {
    describe("authentication", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getAccumulatedTickets();

        expect(result).toEqual({
          data: null,
          error: "Not authenticated",
        });
      });
    });

    describe("ticket accumulation", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("returns 0 for user with no participation", async () => {
        // Mock winners query (no wins)
        mockSupabase.single.mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        // Mock participants query (no participations)
        const mockQuery = {
          data: [],
          error: null,
        };
        mockSupabase.eq = jest.fn().mockReturnValue({
          ...mockSupabase,
          gt: jest.fn().mockResolvedValue(mockQuery),
        });
        mockSupabase.from = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: "PGRST116", message: "Not found" },
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await getAccumulatedTickets();

        expect(result.error).toBeNull();
        expect(result.data).toBe(0);
      });

      it("returns ticket_count for single raffle participation (no wins)", async () => {
        // Setup mock chain
        const winnersQuery = {
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        };
        const participantsQuery = {
          data: [{ ticket_count: 1 }],
          error: null,
        };

        mockSupabase.from = jest.fn().mockImplementation((table: string) => {
          if (table === "winners") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue(winnersQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          // participants table
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(participantsQuery),
            }),
          };
        });

        const result = await getAccumulatedTickets();

        expect(result.error).toBeNull();
        expect(result.data).toBe(1);
      });

      it("sums tickets across multiple raffles (no wins)", async () => {
        // User joined 3 raffles with 1 ticket each = 3 total
        const winnersQuery = {
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        };
        const participantsQuery = {
          data: [{ ticket_count: 1 }, { ticket_count: 1 }, { ticket_count: 1 }],
          error: null,
        };

        mockSupabase.from = jest.fn().mockImplementation((table: string) => {
          if (table === "winners") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue(winnersQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(participantsQuery),
            }),
          };
        });

        const result = await getAccumulatedTickets();

        expect(result.error).toBeNull();
        expect(result.data).toBe(3);
      });

      it("excludes tickets from before last win", async () => {
        // User won on Day 3, only count tickets from Day 4+
        const lastWinDate = "2025-12-23T12:00:00Z";
        const winnersQuery = {
          data: { won_at: lastWinDate },
          error: null,
        };
        // Only 2 participations after the win
        const participantsQuery = {
          data: [{ ticket_count: 1 }, { ticket_count: 1 }],
          error: null,
        };

        mockSupabase.from = jest.fn().mockImplementation((table: string) => {
          if (table === "winners") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue(winnersQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gt: jest.fn().mockResolvedValue(participantsQuery),
              }),
            }),
          };
        });

        const result = await getAccumulatedTickets();

        expect(result.error).toBeNull();
        expect(result.data).toBe(2);
      });

      it("returns 0 immediately after winning (no new participations)", async () => {
        // User just won with 5 tickets, now has 0 because no new participations
        const lastWinDate = "2025-12-25T10:00:00Z";
        const winnersQuery = {
          data: { won_at: lastWinDate },
          error: null,
        };
        const participantsQuery = {
          data: [],
          error: null,
        };

        mockSupabase.from = jest.fn().mockImplementation((table: string) => {
          if (table === "winners") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue(winnersQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gt: jest.fn().mockResolvedValue(participantsQuery),
              }),
            }),
          };
        });

        const result = await getAccumulatedTickets();

        expect(result.error).toBeNull();
        expect(result.data).toBe(0);
      });

      it("accumulates new tickets after winning", async () => {
        // User won, then joined 2 more raffles = 2 total
        const lastWinDate = "2025-12-20T10:00:00Z";
        const winnersQuery = {
          data: { won_at: lastWinDate },
          error: null,
        };
        const participantsQuery = {
          data: [{ ticket_count: 1 }, { ticket_count: 1 }],
          error: null,
        };

        mockSupabase.from = jest.fn().mockImplementation((table: string) => {
          if (table === "winners") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue(winnersQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gt: jest.fn().mockResolvedValue(participantsQuery),
              }),
            }),
          };
        });

        const result = await getAccumulatedTickets();

        expect(result.error).toBeNull();
        expect(result.data).toBe(2);
      });
    });

    describe("database errors", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("returns error on participants query failure", async () => {
        const winnersQuery = {
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        };
        const participantsQuery = {
          data: null,
          error: { message: "Database error" },
        };

        mockSupabase.from = jest.fn().mockImplementation((table: string) => {
          if (table === "winners") {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      single: jest.fn().mockResolvedValue(winnersQuery),
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(participantsQuery),
            }),
          };
        });

        const result = await getAccumulatedTickets();

        expect(result).toEqual({
          data: null,
          error: "Failed to get ticket count",
        });
      });
    });
  });

  describe("getParticipation", () => {
    describe("validation", () => {
      it("returns error for invalid UUID", async () => {
        const result = await getParticipation("not-a-valid-uuid");

        expect(result).toEqual({
          data: null,
          error: "Invalid raffle ID",
        });
      });
    });

    describe("authentication", () => {
      it("returns error when user is not authenticated", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getParticipation(validRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Not authenticated",
        });
      });
    });

    describe("successful fetch", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("returns participant record when exists", async () => {
        mockSupabase.single.mockResolvedValueOnce({
          data: mockParticipant,
          error: null,
        });

        const result = await getParticipation(validRaffleId);

        expect(result).toEqual({
          data: mockParticipant,
          error: null,
        });
        expect(mockSupabase.from).toHaveBeenCalledWith("participants");
        expect(mockSupabase.eq).toHaveBeenCalledWith("raffle_id", validRaffleId);
        expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", validUserId);
      });

      it("returns null when not joined", async () => {
        mockSupabase.single.mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        const result = await getParticipation(validRaffleId);

        expect(result).toEqual({
          data: null,
          error: null,
        });
      });
    });

    describe("database errors", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("returns error on database failure", async () => {
        mockSupabase.single.mockResolvedValueOnce({
          data: null,
          error: { code: "OTHER", message: "Database error" },
        });

        const result = await getParticipation(validRaffleId);

        expect(result).toEqual({
          data: null,
          error: "Failed to get participation",
        });
      });
    });
  });

  /**
   * Story 6.6: getRecentWin() tests
   * Tests for detecting recent wins within 24 hours
   */
  describe("getRecentWin", () => {
    describe("authentication", () => {
      it("returns false when user is not authenticated (graceful failure)", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getRecentWin();

        // Should return false, not an error - fails gracefully
        expect(result).toEqual({
          data: false,
          error: null,
        });
      });

      it("returns false when auth check fails (graceful failure)", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: "Auth error" },
        });

        const result = await getRecentWin();

        expect(result).toEqual({
          data: false,
          error: null,
        });
      });
    });

    describe("recent win detection (Story 6.6 AC #5)", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("returns true when user won within last 24 hours", async () => {
        // Mock winners query returning a recent win
        mockSupabase.from = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: "win-123" },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await getRecentWin();

        expect(result).toEqual({
          data: true,
          error: null,
        });
      });

      it("returns false when user has no recent wins", async () => {
        // Mock winners query returning no results
        mockSupabase.from = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await getRecentWin();

        expect(result).toEqual({
          data: false,
          error: null,
        });
      });

      it("returns false when user has never won", async () => {
        // Mock winners query with no matches
        mockSupabase.from = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await getRecentWin();

        expect(result).toEqual({
          data: false,
          error: null,
        });
      });
    });

    describe("database errors (graceful failure)", () => {
      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: validUserId } },
          error: null,
        });
      });

      it("returns false on database query failure (graceful failure)", async () => {
        mockSupabase.from = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Database error" },
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await getRecentWin();

        // Should return false, not an error - graceful failure
        expect(result).toEqual({
          data: false,
          error: null,
        });
      });
    });
  });
});
