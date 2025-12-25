import { render, screen } from "@testing-library/react";
import { ParticipantRaffleClient } from "./client";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("ParticipantRaffleClient", () => {
  const defaultProps = {
    raffleId: "test-raffle-123",
    raffleName: "Flutter Munich Raffle",
    raffleStatus: "active",
    ticketCount: 3,
    perRaffleTicketCount: 1,
    joinedAt: "2025-12-25T10:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TicketCircle Integration (AC #1)", () => {
    it("renders TicketCircle component with ticket count", () => {
      render(<ParticipantRaffleClient {...defaultProps} />);

      // Should display the ticket count in the TicketCircle
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("displays ticket count in hero TicketCircle element", () => {
      render(<ParticipantRaffleClient {...defaultProps} />);

      // TicketCircle has status role for accessibility
      const statusElement = screen.getByRole("status");
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveAttribute("aria-label", "You have 3 tickets");
    });

    it("renders TicketCircle for single ticket", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={1} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      const statusElement = screen.getByRole("status");
      expect(statusElement).toHaveAttribute("aria-label", "You have 1 ticket");
    });

    it("renders TicketCircle for zero tickets", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={0} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("Contextual Messaging (AC #4, #5)", () => {
    it("shows 'You're in! Good luck!' for 1 ticket (AC #5)", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={1} />);

      expect(screen.getByText("You're in! Good luck!")).toBeInTheDocument();
    });

    it("shows 'Building momentum!' for 2-3 tickets", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={2} />);

      expect(screen.getByText("Building momentum!")).toBeInTheDocument();
    });

    it("shows 'Looking strong!' for 4-5 tickets", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={4} />);

      expect(screen.getByText("Looking strong!")).toBeInTheDocument();
    });

    it("shows 'Your best odds yet!' for 6+ tickets (AC #4)", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={6} />);

      expect(screen.getByText("Your best odds yet!")).toBeInTheDocument();
    });

    it("shows join message for 0 tickets", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={0} />);

      expect(
        screen.getByText("Join a raffle to get started!")
      ).toBeInTheDocument();
    });
  });

  describe("Accumulated Tickets Display (Story 3.3)", () => {
    it("shows accumulated message for multi-event users (AC #3)", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={3} />);

      expect(
        screen.getByText("Tickets accumulated across events")
      ).toBeInTheDocument();
    });

    it("does not show accumulated message for single ticket", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={1} />);

      expect(
        screen.queryByText("Tickets accumulated across events")
      ).not.toBeInTheDocument();
    });

    it("shows accumulated message for 5th event user (AC #3)", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={5} />);

      expect(
        screen.getByText("Tickets accumulated across events")
      ).toBeInTheDocument();
      expect(screen.getByText("Looking strong!")).toBeInTheDocument();
    });
  });

  describe("Immediate Visibility (AC #6)", () => {
    it("displays ticket count immediately without loading spinner", () => {
      render(<ParticipantRaffleClient {...defaultProps} />);

      // Ticket count should be visible immediately
      expect(screen.getByText("3")).toBeInTheDocument();

      // No loading spinner should be present
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });

    it("TicketCircle renders synchronously without async delays", () => {
      const startTime = performance.now();
      render(<ParticipantRaffleClient {...defaultProps} />);
      const endTime = performance.now();

      // Component should render very quickly (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);

      // Ticket should be visible
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  describe("Light/Dark Mode Classes (AC #2, #3)", () => {
    it("has light mode gradient classes on TicketCircle", () => {
      const { container } = render(
        <ParticipantRaffleClient {...defaultProps} />
      );

      const ticketCircle = container.querySelector(
        '[data-testid="ticket-circle"]'
      );
      expect(ticketCircle).toHaveClass("bg-gradient-to-br");
      expect(ticketCircle).toHaveClass("from-primary");
    });

    it("has dark mode classes on TicketCircle", () => {
      const { container } = render(
        <ParticipantRaffleClient {...defaultProps} />
      );

      const ticketCircle = container.querySelector(
        '[data-testid="ticket-circle"]'
      );
      expect(ticketCircle).toHaveClass("dark:from-slate-900");
      expect(ticketCircle).toHaveClass("dark:to-slate-800");
    });

    it("has frosted glass effect for light mode", () => {
      const { container } = render(
        <ParticipantRaffleClient {...defaultProps} />
      );

      const frostedOverlay = container.querySelector(
        '[data-testid="frosted-overlay"]'
      );
      expect(frostedOverlay).toHaveClass("bg-white/70");
      expect(frostedOverlay).toHaveClass("backdrop-blur-md");
    });

    it("has glow effect for dark mode", () => {
      const { container } = render(
        <ParticipantRaffleClient {...defaultProps} />
      );

      const ticketCircle = container.querySelector(
        '[data-testid="ticket-circle"]'
      );
      expect(ticketCircle).toHaveClass(
        "dark:shadow-[0_0_60px_-15px_rgba(2,125,253,0.5)]"
      );
    });
  });

  describe("Accessibility Integration", () => {
    it("TicketCircle has proper ARIA attributes", () => {
      render(<ParticipantRaffleClient {...defaultProps} />);

      const statusElement = screen.getByRole("status");
      expect(statusElement).toHaveAttribute("aria-live", "polite");
      expect(statusElement).toHaveAttribute("aria-atomic", "true");
    });

    it("respects reduced motion preference", () => {
      const { container } = render(
        <ParticipantRaffleClient {...defaultProps} />
      );

      const ticketNumber = container.querySelector(
        '[data-testid="ticket-number"]'
      );
      expect(ticketNumber).toHaveClass("motion-reduce:transition-none");
    });
  });

  describe("Raffle Information Display", () => {
    it("displays raffle name", () => {
      render(<ParticipantRaffleClient {...defaultProps} />);

      expect(screen.getByText("Flutter Munich Raffle")).toBeInTheDocument();
    });

    it("displays active status badge", () => {
      render(<ParticipantRaffleClient {...defaultProps} />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("displays drawing status badge", () => {
      render(
        <ParticipantRaffleClient {...defaultProps} raffleStatus="drawing" />
      );

      expect(screen.getByText("Drawing in progress")).toBeInTheDocument();
    });

    it("displays completed status badge", () => {
      render(
        <ParticipantRaffleClient {...defaultProps} raffleStatus="completed" />
      );

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });
  });
});
