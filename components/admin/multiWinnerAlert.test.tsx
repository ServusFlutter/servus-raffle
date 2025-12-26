import { render, screen } from "@testing-library/react";
import { MultiWinnerAlert } from "./multiWinnerAlert";
import type { MultiWinnerStat } from "@/lib/schemas/history";

describe("MultiWinnerAlert", () => {
  const mockMultiWinners: MultiWinnerStat[] = [
    {
      user_id: "user-1",
      user_name: "Alice",
      user_avatar_url: "https://example.com/alice.jpg",
      win_count: 3,
      last_win_at: "2025-12-26T10:00:00Z",
    },
    {
      user_id: "user-2",
      user_name: "Bob",
      user_avatar_url: null,
      win_count: 2,
      last_win_at: "2025-12-25T10:00:00Z",
    },
  ];

  describe("empty state", () => {
    it("returns null when no multi-winners", () => {
      const { container } = render(<MultiWinnerAlert multiWinners={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("alert display", () => {
    it("renders alert when multi-winners exist", () => {
      render(<MultiWinnerAlert multiWinners={mockMultiWinners} />);

      expect(screen.getByTestId("multi-winner-alert")).toBeInTheDocument();
    });

    it("displays informational title", () => {
      render(<MultiWinnerAlert multiWinners={mockMultiWinners} />);

      expect(screen.getByText("Multiple Win Detection")).toBeInTheDocument();
    });

    it("displays explanation text", () => {
      render(<MultiWinnerAlert multiWinners={mockMultiWinners} />);

      expect(
        screen.getByText(/The following users have won multiple times/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/tracked for fairness verification/i)
      ).toBeInTheDocument();
    });
  });

  describe("winner list display", () => {
    it("renders all multi-winners", () => {
      render(<MultiWinnerAlert multiWinners={mockMultiWinners} />);

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("displays win counts", () => {
      render(<MultiWinnerAlert multiWinners={mockMultiWinners} />);

      expect(screen.getByText("3 wins")).toBeInTheDocument();
      expect(screen.getByText("2 wins")).toBeInTheDocument();
    });

    it("has proper test IDs for each winner", () => {
      render(<MultiWinnerAlert multiWinners={mockMultiWinners} />);

      expect(screen.getByTestId("multi-winner-user-1")).toBeInTheDocument();
      expect(screen.getByTestId("multi-winner-user-2")).toBeInTheDocument();
    });
  });

  describe("avatars", () => {
    it("renders avatar fallback with first letter of name", () => {
      render(<MultiWinnerAlert multiWinners={mockMultiWinners} />);

      // Alice has avatar, shows fallback "A" initially (before image loads)
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("renders avatar fallback when no avatar_url", () => {
      render(<MultiWinnerAlert multiWinners={mockMultiWinners} />);

      // Bob has no avatar, should show fallback "B"
      expect(screen.getByText("B")).toBeInTheDocument();
    });
  });

  describe("anonymous user handling", () => {
    it("displays Anonymous for user with no name", () => {
      const anonymousWinner: MultiWinnerStat[] = [
        {
          user_id: "user-3",
          user_name: null,
          user_avatar_url: null,
          win_count: 2,
          last_win_at: "2025-12-24T10:00:00Z",
        },
      ];

      render(<MultiWinnerAlert multiWinners={anonymousWinner} />);

      expect(screen.getByText("Anonymous")).toBeInTheDocument();
      expect(screen.getByText("?")).toBeInTheDocument(); // Fallback avatar
    });
  });

  describe("single multi-winner", () => {
    it("renders correctly with single multi-winner", () => {
      const singleWinner: MultiWinnerStat[] = [
        {
          user_id: "user-1",
          user_name: "Alice",
          user_avatar_url: null,
          win_count: 5,
          last_win_at: "2025-12-26T10:00:00Z",
        },
      ];

      render(<MultiWinnerAlert multiWinners={singleWinner} />);

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("5 wins")).toBeInTheDocument();
    });
  });
});
