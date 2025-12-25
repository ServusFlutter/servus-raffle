/**
 * @jest-environment node
 */
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Create error classes for Next.js navigation functions
class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
    this.name = "NotFoundError";
  }
}

class RedirectError extends Error {
  constructor(public url: string) {
    super("NEXT_REDIRECT");
    this.name = "RedirectError";
  }
}

// Mock dependencies - these functions throw in Next.js
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new RedirectError(url);
  }),
  notFound: jest.fn(() => {
    throw new NotFoundError();
  }),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Mock the tickets action for accumulated tickets
jest.mock("@/lib/actions/tickets", () => ({
  getAccumulatedTickets: jest.fn().mockResolvedValue({ data: 3, error: null }),
}));

// Mock the client component - simple mock that returns null
jest.mock("./client", () => ({
  ParticipantRaffleClient: () => null,
}));

// Import after mocks
import ParticipantRafflePage from "./page";

describe("ParticipantRafflePage", () => {
  const validRaffleId = "123e4567-e89b-12d3-a456-426614174000";
  const mockUser = { id: "user-123", email: "test@example.com" };
  const mockParticipation = {
    id: "participant-123",
    raffle_id: validRaffleId,
    user_id: "user-123",
    ticket_count: 1,
    joined_at: "2025-12-25T10:00:00Z",
  };
  const mockRaffle = {
    id: validRaffleId,
    name: "Test Raffle",
    status: "active",
  };

  // Create chainable mock for supabase
  const createChainableMock = () => {
    const mock: Record<string, jest.Mock> = {};
    mock.from = jest.fn().mockReturnValue(mock);
    mock.select = jest.fn().mockReturnValue(mock);
    mock.eq = jest.fn().mockReturnValue(mock);
    mock.single = jest.fn();
    mock.auth = {
      getUser: jest.fn(),
    };
    return mock;
  };

  let mockSupabase: ReturnType<typeof createChainableMock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createChainableMock();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("UUID Validation", () => {
    it("should call notFound for invalid UUID format", async () => {
      const invalidId = "not-a-valid-uuid";

      await expect(
        ParticipantRafflePage({
          params: Promise.resolve({ id: invalidId }),
          searchParams: Promise.resolve({}),
        })
      ).rejects.toThrow(NotFoundError);

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe("Authentication", () => {
    it("should redirect unauthenticated users to login with return URL", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(
        ParticipantRafflePage({
          params: Promise.resolve({ id: validRaffleId }),
          searchParams: Promise.resolve({}),
        })
      ).rejects.toThrow(RedirectError);

      expect(redirect).toHaveBeenCalledWith(
        `/login?redirectTo=${encodeURIComponent(`/participant/raffle/${validRaffleId}`)}`
      );
    });
  });

  describe("Participation Check", () => {
    it("should show not joined message when user has no participation", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      const result = await ParticipantRafflePage({
        params: Promise.resolve({ id: validRaffleId }),
        searchParams: Promise.resolve({}),
      });

      // Should return error UI, not redirect
      expect(result).toBeDefined();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should fetch raffle info when participation exists", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockParticipation,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockRaffle,
          error: null,
        });

      await ParticipantRafflePage({
        params: Promise.resolve({ id: validRaffleId }),
        searchParams: Promise.resolve({}),
      });

      // Should query participants table first, then raffles
      expect(mockSupabase.from).toHaveBeenCalledWith("participants");
      expect(mockSupabase.from).toHaveBeenCalledWith("raffles");
    });
  });

  describe("Successful Render", () => {
    it("should render client component when participation exists", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockParticipation,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockRaffle,
          error: null,
        });

      // Should not throw - renders successfully
      await expect(
        ParticipantRafflePage({
          params: Promise.resolve({ id: validRaffleId }),
          searchParams: Promise.resolve({}),
        })
      ).resolves.toBeDefined();
    });

    it("should handle joined=true search param", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockParticipation,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockRaffle,
          error: null,
        });

      // Should not throw - renders successfully
      await expect(
        ParticipantRafflePage({
          params: Promise.resolve({ id: validRaffleId }),
          searchParams: Promise.resolve({ joined: "true" }),
        })
      ).resolves.toBeDefined();
    });

    it("should handle joined=false search param", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockParticipation,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockRaffle,
          error: null,
        });

      // Should not throw - renders successfully
      await expect(
        ParticipantRafflePage({
          params: Promise.resolve({ id: validRaffleId }),
          searchParams: Promise.resolve({ joined: "false" }),
        })
      ).resolves.toBeDefined();
    });
  });
});
