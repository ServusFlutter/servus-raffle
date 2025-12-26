/**
 * WinnerCard Component Tests
 *
 * Story 6.5: Winner Celebration & Announcement
 *
 * Tests:
 * - AC #2: WinnerCard displays with scale + fade animation
 * - AC #3: Winner name and ticket count displayed correctly
 * - AC #7: Screen reader accessibility with ARIA live region
 */

import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { WinnerCard } from "./winnerCard";

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

describe("WinnerCard", () => {
  const defaultProps = {
    winnerName: "Lisa",
    ticketCount: 8,
    isCurrentUser: false,
  };

  describe("Rendering (AC #3)", () => {
    it("renders winner name correctly", () => {
      render(<WinnerCard {...defaultProps} />);

      expect(screen.getByText("Lisa")).toBeInTheDocument();
    });

    it("renders ticket count with correct format", () => {
      render(<WinnerCard {...defaultProps} />);

      // Use getAllByText since ticket count appears in both visible text and sr-only
      const ticketElements = screen.getAllByText(/8 tickets/i);
      expect(ticketElements.length).toBeGreaterThan(0);
    });

    it("displays WINNER text", () => {
      render(<WinnerCard {...defaultProps} />);

      // Get the visible WINNER badge element specifically
      expect(screen.getByText("WINNER!")).toBeInTheDocument();
    });

    it("renders the winner name at appropriate size", () => {
      render(<WinnerCard {...defaultProps} />);

      const nameElement = screen.getByTestId("winner-name");
      expect(nameElement).toBeInTheDocument();
      // Typography specs: 48px mobile by default
      expect(nameElement).toHaveClass("text-5xl");
    });

    it("renders prize name when provided", () => {
      render(<WinnerCard {...defaultProps} prizeName="Grand Prize" />);

      expect(screen.getByText("Grand Prize")).toBeInTheDocument();
    });
  });

  describe("Current User Winner (AC #3)", () => {
    it("shows special congratulations when current user is winner", () => {
      render(<WinnerCard {...defaultProps} isCurrentUser={true} />);

      expect(screen.getByText(/Congratulations/i)).toBeInTheDocument();
    });

    it("does not show congratulations for non-winners", () => {
      render(<WinnerCard {...defaultProps} isCurrentUser={false} />);

      expect(screen.queryByText(/Congratulations/i)).not.toBeInTheDocument();
    });
  });

  describe("Celebration Gold Background (AC #2)", () => {
    it("has celebration gold background color", () => {
      render(<WinnerCard {...defaultProps} />);

      const card = screen.getByTestId("winner-card");
      expect(card).toHaveClass("bg-[#F7DC6F]");
    });
  });

  describe("Animation Variants (AC #2)", () => {
    it("configures scale + fade entrance animation", () => {
      render(<WinnerCard {...defaultProps} />);

      const card = screen.getByTestId("winner-card");
      // Animation should start from hidden state
      expect(card).toHaveAttribute("data-initial", "hidden");
      expect(card).toHaveAttribute("data-animate", "visible");
    });
  });

  describe("Accessibility (AC #7)", () => {
    it("has ARIA live region for screen reader announcement", () => {
      render(<WinnerCard {...defaultProps} />);

      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    });

    it("announces winner with correct screen reader text", () => {
      render(<WinnerCard {...defaultProps} />);

      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toHaveTextContent(
        "Lisa is the winner with 8 tickets"
      );
    });

    it("has appropriate ARIA label on winner card", () => {
      render(<WinnerCard {...defaultProps} />);

      const card = screen.getByTestId("winner-card");
      expect(card).toHaveAttribute(
        "aria-label",
        "Winner announcement: Lisa with 8 tickets"
      );
    });
  });

  describe("Projection Mode Typography (AC #3)", () => {
    it("applies projection mode styles when isProjectionMode is true", () => {
      render(<WinnerCard {...defaultProps} isProjectionMode={true} />);

      const nameElement = screen.getByTestId("winner-name");
      // Typography specs: 96px for projection mode
      expect(nameElement).toHaveClass("projection:text-8xl");
    });
  });

  describe("Custom className", () => {
    it("applies custom className", () => {
      render(<WinnerCard {...defaultProps} className="custom-class" />);

      const card = screen.getByTestId("winner-card");
      expect(card).toHaveClass("custom-class");
    });
  });

  describe("onCelebrationEnd callback", () => {
    it("calls onCelebrationEnd after specified duration", async () => {
      jest.useFakeTimers();
      const onCelebrationEnd = jest.fn();

      render(
        <WinnerCard
          {...defaultProps}
          onCelebrationEnd={onCelebrationEnd}
          celebrationDuration={3000}
        />
      );

      expect(onCelebrationEnd).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(onCelebrationEnd).toHaveBeenCalledTimes(1);
      });

      jest.useRealTimers();
    });
  });
});
