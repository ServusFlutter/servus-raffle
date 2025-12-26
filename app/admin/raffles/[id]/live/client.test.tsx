import { render, screen } from "@testing-library/react";
import { LiveDrawClient } from "./client";
import type { PrizeWithWinner } from "@/lib/actions/prizes";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

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

// Mock broadcast channel hook (Story 6.2)
jest.mock("@/lib/supabase/useBroadcastChannel", () => ({
  useBroadcastChannel: jest.fn(() => ({
    connectionState: "connected",
    isConnected: true,
    reconnect: jest.fn(),
  })),
}));

// Mock realtime subscriptions (Story 6.2 AC #4)
jest.mock("@/lib/supabase/realtime", () => ({
  subscribeToParticipantChanges: jest.fn(() => ({
    unsubscribe: jest.fn(),
  })),
}));

describe("LiveDrawClient", () => {
  const mockPrizes: PrizeWithWinner[] = [
    {
      id: "prize-1",
      raffle_id: "raffle-123",
      name: "Grand Prize",
      description: "A fantastic prize",
      sort_order: 0,
      awarded_to: null,
      awarded_at: null,
      winner_name: null,
    },
    {
      id: "prize-2",
      raffle_id: "raffle-123",
      name: "Second Prize",
      description: "Also great",
      sort_order: 1,
      awarded_to: null,
      awarded_at: null,
      winner_name: null,
    },
    {
      id: "prize-3",
      raffle_id: "raffle-123",
      name: "Third Prize",
      description: null,
      sort_order: 2,
      awarded_to: null,
      awarded_at: null,
      winner_name: null,
    },
  ];

  const defaultProps = {
    raffleId: "raffle-123",
    raffleName: "Flutter Munich December Raffle",
    raffleStatus: "active",
    currentPrize: mockPrizes[0],
    currentPrizeIndex: 0,
    totalPrizes: 3,
    awardedCount: 0,
    participantCount: 42,
    totalTickets: 156,
    prizes: mockPrizes,
  };

  describe("Projection Mode Rendering (AC #2)", () => {
    it("renders with black background for projection", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const container = screen.getByTestId("live-draw-container");
      expect(container).toHaveClass("bg-black");
      expect(container).toHaveClass("text-white");
    });

    it("renders raffle name with large text", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const raffleName = screen.getByTestId("raffle-name");
      expect(raffleName).toBeInTheDocument();
      expect(raffleName).toHaveTextContent("Flutter Munich December Raffle");
      // Should have large text classes
      expect(raffleName).toHaveClass("text-4xl");
    });

    it("takes up full screen height", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const container = screen.getByTestId("live-draw-container");
      expect(container).toHaveClass("min-h-screen");
    });
  });

  describe("Exit Button (AC #4)", () => {
    it("renders exit button in top-right corner", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const exitButton = screen.getByTestId("exit-button");
      expect(exitButton).toBeInTheDocument();
      expect(exitButton).toHaveAttribute("aria-label", "Exit Live Draw");
    });

    it("exit button links to raffle detail page", () => {
      render(<LiveDrawClient {...defaultProps} />);

      // The exit button is wrapped in a link - find the link by querying closest
      const exitButton = screen.getByTestId("exit-button");
      const exitLink = exitButton.closest("a");
      expect(exitLink).toHaveAttribute("href", "/admin/raffles/raffle-123");
    });
  });

  describe("Current Prize Display (AC #5)", () => {
    it("displays current prize name prominently", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const prizeName = screen.getByTestId("current-prize-name");
      expect(prizeName).toBeInTheDocument();
      expect(prizeName).toHaveTextContent("Grand Prize");
      // Should have very large text
      expect(prizeName).toHaveClass("text-5xl");
    });

    it("displays prize description when available", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const prizeDescription = screen.getByTestId("current-prize-description");
      expect(prizeDescription).toBeInTheDocument();
      expect(prizeDescription).toHaveTextContent("A fantastic prize");
    });

    it("shows Now Drawing label above current prize", () => {
      render(<LiveDrawClient {...defaultProps} />);

      expect(screen.getByText("Now Drawing")).toBeInTheDocument();
    });

    it("does not display prize description when null", () => {
      const propsWithNullDescription = {
        ...defaultProps,
        currentPrize: mockPrizes[2], // Prize with null description
        currentPrizeIndex: 2,
      };

      render(<LiveDrawClient {...propsWithNullDescription} />);

      expect(
        screen.queryByTestId("current-prize-description")
      ).not.toBeInTheDocument();
    });
  });

  describe("Prize Progress Display (AC #5)", () => {
    it("displays prize progress indicator", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const prizeProgress = screen.getByTestId("prize-progress");
      expect(prizeProgress).toBeInTheDocument();
      expect(prizeProgress).toHaveTextContent("Prize 1 of 3");
    });

    it("updates prize progress for different positions", () => {
      const propsWithSecondPrize = {
        ...defaultProps,
        currentPrize: mockPrizes[1],
        currentPrizeIndex: 1,
        awardedCount: 1,
      };

      render(<LiveDrawClient {...propsWithSecondPrize} />);

      const prizeProgress = screen.getByTestId("prize-progress");
      expect(prizeProgress).toHaveTextContent("Prize 2 of 3");
    });

    it("has proper aria-label for accessibility", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const prizeProgress = screen.getByTestId("prize-progress");
      expect(prizeProgress).toHaveAttribute("aria-label", "Prize 1 of 3");
    });
  });

  describe("Participant Count Display (AC #3)", () => {
    it("displays participant count", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const participantCount = screen.getByTestId("participant-count");
      expect(participantCount).toBeInTheDocument();
      expect(participantCount).toHaveTextContent("42");
    });

    it("displays total ticket count", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const ticketCount = screen.getByTestId("ticket-count");
      expect(ticketCount).toBeInTheDocument();
      expect(ticketCount).toHaveTextContent("156");
    });

    it("shows singular participant label for 1 participant", () => {
      const propsWithOneParticipant = {
        ...defaultProps,
        participantCount: 1,
      };

      render(<LiveDrawClient {...propsWithOneParticipant} />);

      expect(screen.getByText("Participant")).toBeInTheDocument();
    });

    it("shows plural participants label for multiple participants", () => {
      render(<LiveDrawClient {...defaultProps} />);

      expect(screen.getByText("Participants")).toBeInTheDocument();
    });

    it("has proper aria-label on stats container", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const stats = screen.getByTestId("participant-stats");
      expect(stats).toHaveAttribute(
        "aria-label",
        "42 participants with 156 total tickets"
      );
    });
  });

  describe("Draw Winner Button (AC #3)", () => {
    it("renders Draw Winner button prominently", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const drawButton = screen.getByTestId("draw-button");
      expect(drawButton).toBeInTheDocument();
      expect(drawButton).toHaveTextContent("Draw Winner");
    });

    it("Draw Winner button is disabled (placeholder for Story 6.3)", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const drawButton = screen.getByTestId("draw-button");
      expect(drawButton).toBeDisabled();
    });

    it("has large button styling for projection visibility", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const drawButton = screen.getByTestId("draw-button");
      expect(drawButton).toHaveClass("text-2xl");
      expect(drawButton).toHaveClass("px-12");
    });
  });

  describe("No Prizes State", () => {
    it("displays no prizes message when there are no prizes", () => {
      const propsWithNoPrizes = {
        ...defaultProps,
        currentPrize: null,
        currentPrizeIndex: -1,
        totalPrizes: 0,
        prizes: [],
      };

      render(<LiveDrawClient {...propsWithNoPrizes} />);

      const noPrizesMessage = screen.getByTestId("no-prizes-message");
      expect(noPrizesMessage).toBeInTheDocument();
      expect(noPrizesMessage).toHaveTextContent("No prizes configured");
    });

    it("does not show Draw Winner button when no prizes", () => {
      const propsWithNoPrizes = {
        ...defaultProps,
        currentPrize: null,
        currentPrizeIndex: -1,
        totalPrizes: 0,
        prizes: [],
      };

      render(<LiveDrawClient {...propsWithNoPrizes} />);

      expect(screen.queryByTestId("draw-button")).not.toBeInTheDocument();
    });
  });

  describe("All Prizes Awarded State", () => {
    it("displays completion message when all prizes awarded", () => {
      const awardedPrizes: PrizeWithWinner[] = mockPrizes.map((p) => ({
        ...p,
        awarded_to: "user-123",
        awarded_at: "2025-12-25T10:00:00Z",
        winner_name: "John Doe",
      }));

      const propsAllAwarded = {
        ...defaultProps,
        currentPrize: null,
        currentPrizeIndex: -1,
        awardedCount: 3,
        prizes: awardedPrizes,
      };

      render(<LiveDrawClient {...propsAllAwarded} />);

      const completedMessage = screen.getByTestId("all-prizes-awarded");
      expect(completedMessage).toBeInTheDocument();
      expect(completedMessage).toHaveTextContent("Raffle Complete!");
    });

    it("shows All prizes awarded in progress indicator", () => {
      const awardedPrizes: PrizeWithWinner[] = mockPrizes.map((p) => ({
        ...p,
        awarded_to: "user-123",
        awarded_at: "2025-12-25T10:00:00Z",
        winner_name: "John Doe",
      }));

      const propsAllAwarded = {
        ...defaultProps,
        currentPrize: null,
        currentPrizeIndex: -1,
        awardedCount: 3,
        prizes: awardedPrizes,
      };

      render(<LiveDrawClient {...propsAllAwarded} />);

      const prizeProgress = screen.getByTestId("prize-progress");
      expect(prizeProgress).toHaveTextContent("All prizes awarded!");
    });

    it("does not show Draw Winner button when all prizes awarded", () => {
      const awardedPrizes: PrizeWithWinner[] = mockPrizes.map((p) => ({
        ...p,
        awarded_to: "user-123",
        awarded_at: "2025-12-25T10:00:00Z",
        winner_name: "John Doe",
      }));

      const propsAllAwarded = {
        ...defaultProps,
        currentPrize: null,
        currentPrizeIndex: -1,
        awardedCount: 3,
        prizes: awardedPrizes,
      };

      render(<LiveDrawClient {...propsAllAwarded} />);

      expect(screen.queryByTestId("draw-button")).not.toBeInTheDocument();
    });
  });

  describe("Prize Summary Display", () => {
    it("displays prize summary at bottom of screen", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const prizeSummary = screen.getByTestId("prize-summary");
      expect(prizeSummary).toBeInTheDocument();
    });

    it("shows all prizes in summary", () => {
      render(<LiveDrawClient {...defaultProps} />);

      expect(screen.getByTestId("prize-item-0")).toBeInTheDocument();
      expect(screen.getByTestId("prize-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("prize-item-2")).toBeInTheDocument();
    });

    it("highlights current prize in summary", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const currentPrizeItem = screen.getByTestId("prize-item-0");
      // Current prize should have primary styling
      expect(currentPrizeItem).toHaveClass("bg-primary/20");
      expect(currentPrizeItem).toHaveClass("text-primary");
    });

    it("shows awarded prizes with winner name", () => {
      const partiallyAwardedPrizes: PrizeWithWinner[] = [
        {
          ...mockPrizes[0],
          awarded_to: "user-123",
          awarded_at: "2025-12-25T10:00:00Z",
          winner_name: "Jane Smith",
        },
        mockPrizes[1],
        mockPrizes[2],
      ];

      const propsWithAwardedPrize = {
        ...defaultProps,
        currentPrize: mockPrizes[1],
        currentPrizeIndex: 1,
        awardedCount: 1,
        prizes: partiallyAwardedPrizes,
      };

      render(<LiveDrawClient {...propsWithAwardedPrize} />);

      const awardedPrizeItem = screen.getByTestId("prize-item-0");
      expect(awardedPrizeItem).toHaveTextContent("Grand Prize");
      expect(awardedPrizeItem).toHaveTextContent("Jane Smith");
      expect(awardedPrizeItem).toHaveClass("bg-green-900/30");
    });

    it("does not show prize summary when no prizes", () => {
      const propsWithNoPrizes = {
        ...defaultProps,
        currentPrize: null,
        currentPrizeIndex: -1,
        totalPrizes: 0,
        prizes: [],
      };

      render(<LiveDrawClient {...propsWithNoPrizes} />);

      expect(screen.queryByTestId("prize-summary")).not.toBeInTheDocument();
    });
  });

  describe("Broadcast Channel Subscription (Story 6.2)", () => {
    it("subscribes to broadcast channel with raffleId", () => {
      const { useBroadcastChannel } = jest.requireMock(
        "@/lib/supabase/useBroadcastChannel"
      );

      render(<LiveDrawClient {...defaultProps} />);

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

    it("shows connection indicator when connected", () => {
      const { useBroadcastChannel } = jest.requireMock(
        "@/lib/supabase/useBroadcastChannel"
      );
      useBroadcastChannel.mockReturnValue({
        connectionState: "connected",
        isConnected: true,
        reconnect: jest.fn(),
      });

      render(<LiveDrawClient {...defaultProps} />);

      const connectionIndicator = screen.getByTestId("connection-indicator");
      expect(connectionIndicator).toBeInTheDocument();
      // Should show wifi icon when connected
      expect(
        connectionIndicator.querySelector('[aria-label="Real-time connection active"]')
      ).toBeInTheDocument();
    });

    it("shows reconnect button when disconnected", () => {
      const { useBroadcastChannel } = jest.requireMock(
        "@/lib/supabase/useBroadcastChannel"
      );
      useBroadcastChannel.mockReturnValue({
        connectionState: "disconnected",
        isConnected: false,
        reconnect: jest.fn(),
      });

      render(<LiveDrawClient {...defaultProps} />);

      const connectionIndicator = screen.getByTestId("connection-indicator");
      expect(connectionIndicator).toBeInTheDocument();
      // Should show reconnect button when disconnected
      expect(
        screen.getByRole("button", { name: /reconnect/i })
      ).toBeInTheDocument();
    });
  });

  describe("Real-time Participant Count (Story 6.2 AC #4)", () => {
    it("subscribes to participant changes", () => {
      const { subscribeToParticipantChanges } = jest.requireMock(
        "@/lib/supabase/realtime"
      );

      render(<LiveDrawClient {...defaultProps} />);

      expect(subscribeToParticipantChanges).toHaveBeenCalledWith(
        defaultProps.raffleId,
        expect.any(Function)
      );
    });

    it("displays initial participant count", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const participantCount = screen.getByTestId("participant-count");
      expect(participantCount).toHaveTextContent("42");
    });

    it("displays initial ticket count", () => {
      render(<LiveDrawClient {...defaultProps} />);

      const ticketCount = screen.getByTestId("ticket-count");
      expect(ticketCount).toHaveTextContent("156");
    });
  });
});
