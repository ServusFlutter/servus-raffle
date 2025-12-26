import { render, screen } from "@testing-library/react";
import { PrizeListParticipant } from "./prizeListParticipant";
import type { ParticipantPrize } from "@/lib/schemas/prize";

describe("PrizeListParticipant", () => {
  const mockPrizes: ParticipantPrize[] = [
    {
      id: "prize-1",
      name: "First Prize",
      description: "A wonderful first prize",
      sort_order: 0,
      is_awarded: false,
    },
    {
      id: "prize-2",
      name: "Second Prize",
      description: "A great second prize",
      sort_order: 1,
      is_awarded: false,
    },
    {
      id: "prize-3",
      name: "Third Prize",
      description: null,
      sort_order: 2,
      is_awarded: false,
    },
  ];

  describe("empty state", () => {
    it("shows empty state message when no prizes", () => {
      render(<PrizeListParticipant prizes={[]} />);
      expect(
        screen.getByText(/no prizes added to this raffle yet/i)
      ).toBeInTheDocument();
    });

    it("has correct test id for empty state", () => {
      render(<PrizeListParticipant prizes={[]} />);
      expect(screen.getByTestId("prize-list-empty")).toBeInTheDocument();
    });
  });

  describe("prize display", () => {
    it("displays prizes in order with names", () => {
      render(<PrizeListParticipant prizes={mockPrizes} />);
      expect(screen.getByText("First Prize")).toBeInTheDocument();
      expect(screen.getByText("Second Prize")).toBeInTheDocument();
      expect(screen.getByText("Third Prize")).toBeInTheDocument();
    });

    it("displays prize descriptions when available", () => {
      render(<PrizeListParticipant prizes={mockPrizes} />);
      expect(screen.getByText("A wonderful first prize")).toBeInTheDocument();
      expect(screen.getByText("A great second prize")).toBeInTheDocument();
    });

    it("does not render description element for prizes without descriptions", () => {
      render(<PrizeListParticipant prizes={mockPrizes} />);
      // Third prize has null description
      expect(
        screen.queryByTestId("prize-description-prize-3")
      ).not.toBeInTheDocument();
    });

    it("renders the Prizes header with trophy icon", () => {
      render(<PrizeListParticipant prizes={mockPrizes} />);
      expect(screen.getByText("Prizes")).toBeInTheDocument();
    });

    it("has correct test id for prize list", () => {
      render(<PrizeListParticipant prizes={mockPrizes} />);
      expect(screen.getByTestId("prize-list-participant")).toBeInTheDocument();
    });
  });

  describe("awarded badges", () => {
    it("shows Awarded badge for awarded prizes", () => {
      const prizesWithAwarded: ParticipantPrize[] = [
        {
          id: "prize-1",
          name: "Awarded Prize",
          description: null,
          sort_order: 0,
          is_awarded: true,
        },
      ];
      render(<PrizeListParticipant prizes={prizesWithAwarded} />);
      expect(screen.getByText("Awarded")).toBeInTheDocument();
    });

    it("adds opacity styling to awarded prizes", () => {
      const prizesWithAwarded: ParticipantPrize[] = [
        {
          id: "prize-1",
          name: "Awarded Prize",
          description: null,
          sort_order: 0,
          is_awarded: true,
        },
      ];
      render(<PrizeListParticipant prizes={prizesWithAwarded} />);
      const card = screen.getByTestId("prize-card-prize-1");
      expect(card).toHaveClass("opacity-60");
    });

    it("adds line-through styling to awarded prize names", () => {
      const prizesWithAwarded: ParticipantPrize[] = [
        {
          id: "prize-1",
          name: "Awarded Prize",
          description: null,
          sort_order: 0,
          is_awarded: true,
        },
      ];
      render(<PrizeListParticipant prizes={prizesWithAwarded} />);
      const prizeName = screen.getByTestId("prize-name-prize-1");
      expect(prizeName).toHaveClass("line-through");
    });
  });

  describe("next prize highlighting", () => {
    it("highlights next prize to be drawn with Next badge", () => {
      render(<PrizeListParticipant prizes={mockPrizes} />);
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("shows Next badge on first non-awarded prize", () => {
      const mixedPrizes: ParticipantPrize[] = [
        {
          id: "prize-1",
          name: "Awarded Prize",
          description: null,
          sort_order: 0,
          is_awarded: true,
        },
        {
          id: "prize-2",
          name: "Next Prize",
          description: null,
          sort_order: 1,
          is_awarded: false,
        },
        {
          id: "prize-3",
          name: "Future Prize",
          description: null,
          sort_order: 2,
          is_awarded: false,
        },
      ];
      render(<PrizeListParticipant prizes={mixedPrizes} />);

      // Should have "Next" badge for prize-2
      expect(screen.getByTestId("prize-badge-next-prize-2")).toBeInTheDocument();
      // Should not have "Next" badge for prize-3
      expect(
        screen.queryByTestId("prize-badge-next-prize-3")
      ).not.toBeInTheDocument();
    });

    it("adds ring styling to next prize card", () => {
      render(<PrizeListParticipant prizes={mockPrizes} />);
      const firstCard = screen.getByTestId("prize-card-prize-1");
      expect(firstCard).toHaveClass("ring-2");
      expect(firstCard).toHaveClass("ring-primary");
    });

    it("does not show Next badge when all prizes are awarded", () => {
      const allAwarded: ParticipantPrize[] = [
        {
          id: "prize-1",
          name: "Prize 1",
          description: null,
          sort_order: 0,
          is_awarded: true,
        },
        {
          id: "prize-2",
          name: "Prize 2",
          description: null,
          sort_order: 1,
          is_awarded: true,
        },
      ];
      render(<PrizeListParticipant prizes={allAwarded} />);
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("accepts and applies custom className", () => {
      render(
        <PrizeListParticipant prizes={mockPrizes} className="custom-class" />
      );
      const container = screen.getByTestId("prize-list-participant");
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("accessibility", () => {
    it("has aria-hidden on decorative icons", () => {
      render(<PrizeListParticipant prizes={mockPrizes} />);
      // Trophy and Gift icons should have aria-hidden
      const container = screen.getByTestId("prize-list-participant");
      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });
});
