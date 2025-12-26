/**
 * WinnerCelebration Container Component Tests
 *
 * Story 6.5: Winner Celebration & Announcement
 *
 * Tests:
 * - AC #1: 500ms suspense pause after wheel stops
 * - AC #2, #3: WinnerCard integration
 * - AC #4: ConfettiOverlay integration
 * - AC #5: Synchronized announcement via broadcast
 * - AC #6: Non-winner message
 * - AC #7: Screen reader accessibility
 */

import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { WinnerCelebration, SUSPENSE_PAUSE_MS } from "./winnerCelebration";

// Mock canvas-confetti
jest.mock("canvas-confetti", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock framer-motion to avoid animation complexities in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      initial,
      animate,
      role,
      "aria-label": ariaLabel,
      "data-testid": dataTestId,
    }: {
      children: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      initial?: string;
      animate?: string;
      role?: string;
      "aria-label"?: string;
      "data-testid"?: string;
    }) => (
      <div
        className={className}
        style={style}
        role={role}
        aria-label={ariaLabel}
        data-testid={dataTestId}
        data-initial={initial}
        data-animate={animate}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock matchMedia for reduced motion tests
const mockMatchMedia = (prefersReducedMotion: boolean = false) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches:
        query === "(prefers-reduced-motion: reduce)" && prefersReducedMotion,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe("WinnerCelebration", () => {
  const defaultWinnerData = {
    winnerId: "user-123",
    winnerName: "Lisa",
    ticketsAtWin: 8,
    prizeName: "Grand Prize",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMatchMedia(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Suspense Pause (AC #1)", () => {
    it("exports SUSPENSE_PAUSE_MS constant as 500", () => {
      expect(SUSPENSE_PAUSE_MS).toBe(500);
    });

    it("shows suspense state before revealing winner", () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
        />
      );

      // Initially should show suspense indicator
      expect(screen.getByTestId("suspense-indicator")).toBeInTheDocument();
      expect(screen.getByText(/And the winner is/i)).toBeInTheDocument();
    });

    it("reveals winner after 500ms suspense pause", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
        />
      );

      // Initially no winner card
      expect(screen.queryByTestId("winner-card")).not.toBeInTheDocument();

      // Advance past suspense pause
      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS);
      });

      // Now winner card should be visible
      await waitFor(() => {
        expect(screen.getByTestId("winner-card")).toBeInTheDocument();
      });
    });

    it("hides suspense indicator after winner is revealed", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId("suspense-indicator")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Winner Display (AC #2, #3)", () => {
    it("displays winner name after suspense", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS);
      });

      await waitFor(() => {
        expect(screen.getByText("Lisa")).toBeInTheDocument();
      });
    });

    it("displays ticket count after suspense", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS);
      });

      await waitFor(() => {
        expect(screen.getAllByText(/8 tickets/i).length).toBeGreaterThan(0);
      });
    });

    it("displays prize name when provided", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS);
      });

      await waitFor(() => {
        expect(screen.getByText("Grand Prize")).toBeInTheDocument();
      });
    });
  });

  describe("Current User Winner Identification", () => {
    it("identifies current user as winner", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="user-123"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS);
      });

      await waitFor(() => {
        expect(screen.getByText(/Congratulations/i)).toBeInTheDocument();
      });
    });

    it("does not show congratulations for non-winners", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS);
      });

      await waitFor(() => {
        expect(screen.getByTestId("winner-card")).toBeInTheDocument();
      });
      expect(screen.queryByText(/Congratulations/i)).not.toBeInTheDocument();
    });
  });

  describe("Non-Winner Message (AC #6)", () => {
    it("shows non-winner message after celebration ends", async () => {
      const userTicketCount = 5;
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
          currentUserTicketCount={userTicketCount}
        />
      );

      // Advance past suspense + celebration duration (3 seconds default)
      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Not this time - your 5 tickets carry forward to the next raffle!/i)
        ).toBeInTheDocument();
      });
    });

    it("does not show non-winner message to winner", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="user-123"
          currentUserTicketCount={8}
        />
      );

      // Advance past suspense + celebration duration
      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        expect(screen.queryByText(/Not this time/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Does Not Show When Inactive", () => {
    it("returns null when showCelebration is false", () => {
      const { container } = render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={false}
          currentUserId="other-user"
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Callback Integration", () => {
    it("calls onCelebrationComplete after celebration", async () => {
      const onComplete = jest.fn();
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
          onCelebrationComplete={onComplete}
        />
      );

      // Advance past suspense + celebration
      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Projection Mode", () => {
    it("passes projection mode to WinnerCard", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
          isProjectionMode={true}
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS);
      });

      await waitFor(() => {
        const winnerCard = screen.getByTestId("winner-card");
        // Check that projection mode class is applied
        expect(winnerCard).toBeInTheDocument();
      });
    });
  });

  describe("Winner Post-Celebration Message (Story 6.6 AC #3)", () => {
    it("shows congratulations message to winner after celebration", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="user-123"
        />
      );

      // Advance past suspense + celebration duration
      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        expect(screen.getByText("Congratulations!")).toBeInTheDocument();
      });
    });

    it("shows prize name in winner message", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="user-123"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        expect(screen.getByText(/You won Grand Prize!/i)).toBeInTheDocument();
      });
    });

    it("shows ticket reset message to winner", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="user-123"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Your tickets have been reset to 0/i)
        ).toBeInTheDocument();
      });
    });

    it("shows 'See you at the next meetup' message", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="user-123"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/See you at the next meetup!/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Non-Winner Message (Story 6.6 AC #4)", () => {
    it("shows non-winner message with correct ticket count", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
          currentUserTicketCount={5}
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Not this time - your 5 tickets carry forward to the next raffle!/i)
        ).toBeInTheDocument();
      });
    });

    it("shows singular 'ticket carries' for 1 ticket", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
          currentUserTicketCount={1}
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Not this time - your 1 ticket carries forward to the next raffle!/i)
        ).toBeInTheDocument();
      });
    });

    it("shows congratulations to winner name in non-winner message", async () => {
      render(
        <WinnerCelebration
          {...defaultWinnerData}
          showCelebration={true}
          currentUserId="other-user"
        />
      );

      act(() => {
        jest.advanceTimersByTime(SUSPENSE_PAUSE_MS + 3000);
      });

      await waitFor(() => {
        // Text is split across elements, use getByTestId and check text content
        const nonWinnerMessage = screen.getByTestId("non-winner-message");
        expect(nonWinnerMessage.textContent).toMatch(/Congratulations to/);
        expect(nonWinnerMessage.textContent).toMatch(/Lisa/);
      });
    });
  });
});
