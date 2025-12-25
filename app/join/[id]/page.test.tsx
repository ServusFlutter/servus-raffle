/**
 * @jest-environment node
 */
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { joinRaffle } from "@/lib/actions/tickets";
import { isExpired } from "@/lib/utils/dates";

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

jest.mock("@/lib/actions/tickets", () => ({
  joinRaffle: jest.fn(),
}));

jest.mock("@/lib/utils/dates", () => ({
  isExpired: jest.fn(),
}));

// Import page after mocks are set up
import JoinPage from "./page";

describe("JoinPage", () => {
  const validRaffleId = "123e4567-e89b-12d3-a456-426614174000";
  const mockUser = { id: "user-123", email: "test@example.com" };
  const mockRaffle = {
    id: validRaffleId,
    name: "Test Raffle",
    status: "active",
    qr_code_expires_at: "2025-12-31T23:59:59Z",
  };

  // Create chainable mock
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
    (isExpired as jest.Mock).mockReturnValue(false);
  });

  describe("UUID Validation", () => {
    it("should call notFound for invalid UUID format", async () => {
      const invalidId = "not-a-valid-uuid";

      await expect(
        JoinPage({ params: Promise.resolve({ id: invalidId }) })
      ).rejects.toThrow(NotFoundError);

      expect(notFound).toHaveBeenCalled();
    });

    it("should not call notFound for valid UUID", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.single.mockResolvedValue({
        data: mockRaffle,
        error: null,
      });
      (joinRaffle as jest.Mock).mockResolvedValue({
        data: { participant: {}, isNewJoin: true },
        error: null,
      });

      // Will throw RedirectError on success (redirect to participant dashboard)
      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(RedirectError);

      // Should call createClient for valid UUID
      expect(createClient).toHaveBeenCalled();
    });
  });

  describe("Authentication (AC #2)", () => {
    it("should redirect unauthenticated users to login with return URL", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(RedirectError);

      expect(redirect).toHaveBeenCalledWith(
        `/login?redirectTo=${encodeURIComponent(`/join/${validRaffleId}`)}`
      );
    });

    it("should continue flow for authenticated users", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.single.mockResolvedValue({
        data: mockRaffle,
        error: null,
      });
      (joinRaffle as jest.Mock).mockResolvedValue({
        data: { participant: {}, isNewJoin: true },
        error: null,
      });

      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(RedirectError);

      // Verify we got past auth check to raffle lookup
      expect(mockSupabase.from).toHaveBeenCalledWith("raffles");
    });
  });

  describe("Raffle Validation", () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
    });

    it("should call notFound when raffle does not exist", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(NotFoundError);

      expect(notFound).toHaveBeenCalled();
    });

    it("should call notFound when raffle is not active", async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRaffle, status: "draft" },
        error: null,
      });

      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(NotFoundError);

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe("QR Code Expiration (AC #5)", () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.single.mockResolvedValue({
        data: mockRaffle,
        error: null,
      });
    });

    it("should redirect to expired page when QR code is expired", async () => {
      (isExpired as jest.Mock).mockReturnValue(true);

      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(RedirectError);

      expect(redirect).toHaveBeenCalledWith(`/join/${validRaffleId}/expired`);
    });

    it("should continue when QR code is not expired", async () => {
      (isExpired as jest.Mock).mockReturnValue(false);
      (joinRaffle as jest.Mock).mockResolvedValue({
        data: { participant: {}, isNewJoin: true },
        error: null,
      });

      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(RedirectError);

      expect(joinRaffle).toHaveBeenCalled();
    });
  });

  describe("Join Flow (AC #3, #4)", () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.single.mockResolvedValue({
        data: mockRaffle,
        error: null,
      });
      (isExpired as jest.Mock).mockReturnValue(false);
    });

    it("should call joinRaffle action with raffle ID", async () => {
      (joinRaffle as jest.Mock).mockResolvedValue({
        data: { participant: {}, isNewJoin: true },
        error: null,
      });

      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(RedirectError);

      expect(joinRaffle).toHaveBeenCalledWith(validRaffleId);
    });

    it("should redirect to participant dashboard with joined=true on new join", async () => {
      (joinRaffle as jest.Mock).mockResolvedValue({
        data: { participant: {}, isNewJoin: true },
        error: null,
      });

      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(RedirectError);

      expect(redirect).toHaveBeenCalledWith(
        `/participant/raffle/${validRaffleId}?joined=true`
      );
    });

    it("should redirect to participant dashboard with joined=false on duplicate join", async () => {
      (joinRaffle as jest.Mock).mockResolvedValue({
        data: { participant: {}, isNewJoin: false },
        error: null,
      });

      await expect(
        JoinPage({ params: Promise.resolve({ id: validRaffleId }) })
      ).rejects.toThrow(RedirectError);

      expect(redirect).toHaveBeenCalledWith(
        `/participant/raffle/${validRaffleId}?joined=false`
      );
    });

    it("should render error UI when joinRaffle fails", async () => {
      (joinRaffle as jest.Mock).mockResolvedValue({
        data: null,
        error: "Failed to join raffle",
      });

      // When joinRaffle fails, the page renders error UI instead of redirecting
      // So it should NOT throw
      const result = await JoinPage({
        params: Promise.resolve({ id: validRaffleId }),
      });

      // Should return JSX (error UI)
      expect(result).toBeDefined();
      // The redirect to participant dashboard should NOT have been called
      expect(redirect).not.toHaveBeenCalledWith(
        expect.stringContaining("/participant/raffle")
      );
    });
  });
});
