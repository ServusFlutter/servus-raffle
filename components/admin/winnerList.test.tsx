import { render, screen } from "@testing-library/react";
import { WinnerList } from "./winnerList";
import type { WinnerDetail } from "@/lib/schemas/history";

describe("WinnerList", () => {
  const mockWinners: WinnerDetail[] = [
    {
      id: "winner-1",
      user_id: "user-1",
      user_name: "Alice",
      user_avatar_url: "https://example.com/alice.jpg",
      prize_name: "Grand Prize",
      prize_id: "prize-1",
      tickets_at_win: 5,
      won_at: "2025-12-26T10:00:00Z",
    },
    {
      id: "winner-2",
      user_id: "user-2",
      user_name: "Bob",
      user_avatar_url: null,
      prize_name: "Second Prize",
      prize_id: "prize-2",
      tickets_at_win: 3,
      won_at: "2025-12-26T10:05:00Z",
    },
    {
      id: "winner-3",
      user_id: "user-3",
      user_name: null,
      user_avatar_url: null,
      prize_name: "Third Prize",
      prize_id: "prize-3",
      tickets_at_win: 1,
      won_at: "2025-12-26T10:10:00Z",
    },
  ];

  describe("empty state", () => {
    it("displays empty state message when no winners", () => {
      render(<WinnerList winners={[]} />);

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(
        screen.getByText(/No winners yet. This raffle is still in progress/i)
      ).toBeInTheDocument();
    });
  });

  describe("winner list display", () => {
    it("renders all winners", () => {
      render(<WinnerList winners={mockWinners} />);

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Anonymous")).toBeInTheDocument();
    });

    it("displays prize names", () => {
      render(<WinnerList winners={mockWinners} />);

      expect(screen.getByText("Grand Prize")).toBeInTheDocument();
      expect(screen.getByText("Second Prize")).toBeInTheDocument();
      expect(screen.getByText("Third Prize")).toBeInTheDocument();
    });

    it("displays ticket counts", () => {
      render(<WinnerList winners={mockWinners} />);

      expect(screen.getByTestId("tickets-at-win-0")).toHaveTextContent("5");
      expect(screen.getByTestId("tickets-at-win-1")).toHaveTextContent("3");
      expect(screen.getByTestId("tickets-at-win-2")).toHaveTextContent("1");
    });

    it("displays formatted won_at times", () => {
      render(<WinnerList winners={mockWinners} />);

      // Check that won_at cells exist
      expect(screen.getByTestId("won-at-0")).toBeInTheDocument();
      expect(screen.getByTestId("won-at-1")).toBeInTheDocument();
      expect(screen.getByTestId("won-at-2")).toBeInTheDocument();
    });
  });

  describe("avatars", () => {
    it("renders avatar fallback with first letter of name", () => {
      render(<WinnerList winners={mockWinners} />);

      // Alice has avatar, shows fallback "A" initially (before image loads)
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("renders avatar fallback when no avatar_url", () => {
      render(<WinnerList winners={mockWinners} />);

      // Bob has no avatar, should show fallback "B"
      expect(screen.getByText("B")).toBeInTheDocument();
    });

    it("renders ? fallback for anonymous user", () => {
      render(<WinnerList winners={mockWinners} />);

      // Anonymous user should show fallback "?"
      expect(screen.getByText("?")).toBeInTheDocument();
    });
  });

  describe("table structure", () => {
    it("has proper table headers", () => {
      render(<WinnerList winners={mockWinners} />);

      expect(screen.getByText("Winner")).toBeInTheDocument();
      expect(screen.getByText("Prize")).toBeInTheDocument();
      expect(screen.getByText("Tickets")).toBeInTheDocument();
      expect(screen.getByText("Won At")).toBeInTheDocument();
    });

    it("has proper test IDs for rows", () => {
      render(<WinnerList winners={mockWinners} />);

      expect(screen.getByTestId("winner-row-0")).toBeInTheDocument();
      expect(screen.getByTestId("winner-row-1")).toBeInTheDocument();
      expect(screen.getByTestId("winner-row-2")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper test ID for the list container", () => {
      render(<WinnerList winners={mockWinners} />);

      expect(screen.getByTestId("winner-list")).toBeInTheDocument();
    });
  });
});
