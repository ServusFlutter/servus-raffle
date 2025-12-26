import { render, screen } from "@testing-library/react";
import { ParticipantRaffleClient } from "./client";
import { toast } from "sonner";

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
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

// Mock realtime subscriptions (Story 5-3)
jest.mock("@/lib/supabase/realtime", () => ({
  subscribeToRaffleStatusChanges: jest.fn(() => ({
    unsubscribe: jest.fn(),
  })),
  subscribeToPrizeChanges: jest.fn(() => ({
    unsubscribe: jest.fn(),
  })),
}));

// Mock broadcast channel hook (Story 6.2)
jest.mock("@/lib/supabase/useBroadcastChannel", () => ({
  useBroadcastChannel: jest.fn(() => ({
    connectionState: "connected",
    isConnected: true,
    reconnect: jest.fn(),
  })),
}));

const mockToast = toast as jest.Mocked<typeof toast>;

describe("ParticipantRaffleClient", () => {
  const defaultProps = {
    raffleId: "test-raffle-123",
    raffleName: "Flutter Munich Raffle",
    raffleStatus: "active",
    ticketCount: 3,
    perRaffleTicketCount: 1,
    joinedAt: "2025-12-25T10:00:00Z",
    prizes: [], // Story 5-3: Default to empty prizes array
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
      const ticketCircle = screen.getByTestId("ticket-circle");
      expect(ticketCircle).toBeInTheDocument();
      expect(ticketCircle).toHaveAttribute("aria-label", "You have 3 tickets");
    });

    it("renders TicketCircle for single ticket", () => {
      render(<ParticipantRaffleClient {...defaultProps} ticketCount={1} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      const ticketCircle = screen.getByTestId("ticket-circle");
      expect(ticketCircle).toHaveAttribute("aria-label", "You have 1 ticket");
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

      const ticketCircle = screen.getByTestId("ticket-circle");
      expect(ticketCircle).toHaveAttribute("aria-live", "polite");
      expect(ticketCircle).toHaveAttribute("aria-atomic", "true");
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

  describe("StatusBar Integration (Story 3.4 AC #2, #3)", () => {
    it("renders StatusBar for active raffle", () => {
      render(<ParticipantRaffleClient {...defaultProps} raffleStatus="active" />);

      expect(screen.getByTestId("status-bar")).toBeInTheDocument();
      expect(
        screen.getByText("Locked in - waiting for draw")
      ).toBeInTheDocument();
    });

    it("shows pulsing green dot in StatusBar", () => {
      render(<ParticipantRaffleClient {...defaultProps} raffleStatus="active" />);

      // Get the status dot within the StatusBar specifically (not the RaffleStatusIndicator)
      const statusBar = screen.getByTestId("status-bar");
      const dot = statusBar.querySelector('[data-testid="status-dot"]');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass("bg-green-500");
      expect(dot).toHaveClass("animate-pulse");
    });

    it("does not render StatusBar for completed raffle", () => {
      render(
        <ParticipantRaffleClient {...defaultProps} raffleStatus="completed" />
      );

      expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument();
    });

    it("does not render StatusBar for drawing raffle", () => {
      render(
        <ParticipantRaffleClient {...defaultProps} raffleStatus="drawing" />
      );

      expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument();
    });

    it("has proper passive UX - no action buttons visible (AC #4)", () => {
      render(<ParticipantRaffleClient {...defaultProps} raffleStatus="active" />);

      // StatusBar is informational only, no buttons
      const statusBar = screen.getByTestId("status-bar");
      expect(statusBar.querySelector("button")).not.toBeInTheDocument();

      // No action buttons in the card either
      const buttons = screen.queryAllByRole("button");
      expect(buttons).toHaveLength(0);
    });
  });

  describe("Toast Timing (Story 3.4 AC #1)", () => {
    it("shows success toast with 3-second duration on join", () => {
      render(
        <ParticipantRaffleClient {...defaultProps} showJoinedToast="true" />
      );

      expect(mockToast.success).toHaveBeenCalledWith(
        "You're in! Good luck!",
        expect.objectContaining({
          duration: 3000,
        })
      );
    });

    it("shows info toast with 3-second duration for already registered", () => {
      render(
        <ParticipantRaffleClient {...defaultProps} showJoinedToast="false" />
      );

      expect(mockToast.info).toHaveBeenCalledWith(
        "You're already registered!",
        expect.objectContaining({
          duration: 3000,
        })
      );
    });
  });

  describe("Invalid Status Handling (Type Safety)", () => {
    it("does not render StatusBar for invalid/unknown status", () => {
      render(
        <ParticipantRaffleClient {...defaultProps} raffleStatus="invalid-status" />
      );

      expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument();
    });

    it("still renders the rest of the dashboard for unknown status", () => {
      render(
        <ParticipantRaffleClient {...defaultProps} raffleStatus="pending" />
      );

      // Core elements should still render
      expect(screen.getByText("Flutter Munich Raffle")).toBeInTheDocument();
      expect(screen.getByTestId("ticket-circle")).toBeInTheDocument();
      // StatusBar should not render for invalid status
      expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument();
    });
  });

  describe("Screen Reader ARIA Live Region (Story 3.4 AC #5)", () => {
    it("has hidden ARIA live region for screen reader announcements", () => {
      render(<ParticipantRaffleClient {...defaultProps} />);

      const announcement = screen.getByTestId("screen-reader-announcement");
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute("role", "status");
      expect(announcement).toHaveAttribute("aria-live", "polite");
      expect(announcement).toHaveClass("sr-only");
    });

    it("announces ticket count to screen readers on join", () => {
      render(
        <ParticipantRaffleClient
          {...defaultProps}
          ticketCount={3}
          showJoinedToast="true"
        />
      );

      const announcement = screen.getByTestId("screen-reader-announcement");
      expect(announcement).toHaveTextContent(
        "You now have 3 tickets for the raffle"
      );
    });

    it("announces singular ticket correctly", () => {
      render(
        <ParticipantRaffleClient
          {...defaultProps}
          ticketCount={1}
          showJoinedToast="true"
        />
      );

      const announcement = screen.getByTestId("screen-reader-announcement");
      expect(announcement).toHaveTextContent(
        "You now have 1 ticket for the raffle"
      );
    });

    it("does not announce on initial load without showJoinedToast", () => {
      render(<ParticipantRaffleClient {...defaultProps} />);

      const announcement = screen.getByTestId("screen-reader-announcement");
      expect(announcement).toHaveTextContent("");
    });
  });

  describe("Broadcast Channel Subscription (Story 6.2)", () => {
    it("subscribes to broadcast channel with raffleId", () => {
      const { useBroadcastChannel } = jest.requireMock(
        "@/lib/supabase/useBroadcastChannel"
      );

      render(<ParticipantRaffleClient {...defaultProps} />);

      expect(useBroadcastChannel).toHaveBeenCalledWith(
        defaultProps.raffleId,
        expect.objectContaining({
          onDrawStart: expect.any(Function),
          onWheelSeed: expect.any(Function),
          onWinnerRevealed: expect.any(Function),
          onRaffleEnded: expect.any(Function),
          onReconnect: expect.any(Function),
        })
      );
    });

    it("handles broadcast channel connection state", () => {
      const { useBroadcastChannel } = jest.requireMock(
        "@/lib/supabase/useBroadcastChannel"
      );
      useBroadcastChannel.mockReturnValue({
        connectionState: "connected",
        isConnected: true,
        reconnect: jest.fn(),
      });

      render(<ParticipantRaffleClient {...defaultProps} />);

      // Component should render without errors when connected
      expect(screen.getByTestId("ticket-circle")).toBeInTheDocument();
    });
  });
});
