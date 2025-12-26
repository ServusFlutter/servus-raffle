/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrizeList } from "./prizeList";
import type { Prize } from "@/lib/schemas/prize";

describe("PrizeList", () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const defaultProps = {
    prizes: [] as Prize[],
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
  };

  const mockPrizes: Prize[] = [
    {
      id: "prize-1",
      raffle_id: "raffle-1",
      name: "First Prize",
      description: "A great first prize",
      sort_order: 0,
      awarded_to: null,
      awarded_at: null,
    },
    {
      id: "prize-2",
      raffle_id: "raffle-1",
      name: "Second Prize",
      description: null,
      sort_order: 1,
      awarded_to: null,
      awarded_at: null,
    },
    {
      id: "prize-3",
      raffle_id: "raffle-1",
      name: "Third Prize",
      description: "An awarded prize",
      sort_order: 2,
      awarded_to: "user-123",
      awarded_at: "2024-12-25T10:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("empty state", () => {
    it("shows empty state message when no prizes", () => {
      render(<PrizeList {...defaultProps} />);

      expect(screen.getByText("No prizes yet")).toBeInTheDocument();
      expect(
        screen.getByText(/Add prizes to this raffle/)
      ).toBeInTheDocument();
    });
  });

  describe("rendering prizes", () => {
    it("displays all prizes", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      expect(screen.getByText("First Prize")).toBeInTheDocument();
      expect(screen.getByText("Second Prize")).toBeInTheDocument();
      expect(screen.getByText("Third Prize")).toBeInTheDocument();
    });

    it("shows prize numbers", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
      expect(screen.getByText("#3")).toBeInTheDocument();
    });

    it("displays prize descriptions when present", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      expect(screen.getByText("A great first prize")).toBeInTheDocument();
      expect(screen.getByText("An awarded prize")).toBeInTheDocument();
    });

    it("handles null descriptions gracefully", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      // Second prize has null description - should not error
      expect(screen.getByText("Second Prize")).toBeInTheDocument();
    });
  });

  describe("status badges", () => {
    it("shows Pending badge for unawarded prizes", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[0]]} />);

      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("shows Awarded badge for awarded prizes", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[2]]} />);

      expect(screen.getByText("Awarded")).toBeInTheDocument();
    });

    it("shows awarded date for awarded prizes", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[2]]} />);

      expect(screen.getByText(/Awarded on/)).toBeInTheDocument();
      expect(screen.getByText(/December 25, 2024/)).toBeInTheDocument();
    });
  });

  describe("action buttons", () => {
    it("renders edit and delete buttons for each prize", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[0]]} />);

      expect(
        screen.getByRole("button", { name: /edit first prize/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete first prize/i })
      ).toBeInTheDocument();
    });

    it("calls onEdit when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[0]]} />);

      const editButton = screen.getByRole("button", { name: /edit first prize/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockPrizes[0]);
    });

    it("calls onDelete when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[0]]} />);

      const deleteButton = screen.getByRole("button", { name: /delete first prize/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockPrizes[0]);
    });

    it("disables buttons for awarded prizes", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[2]]} />);

      const editButton = screen.getByRole("button", { name: /edit third prize/i });
      const deleteButton = screen.getByRole("button", { name: /delete third prize/i });

      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    it("enables buttons for pending prizes", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[0]]} />);

      const editButton = screen.getByRole("button", { name: /edit first prize/i });
      const deleteButton = screen.getByRole("button", { name: /delete first prize/i });

      expect(editButton).not.toBeDisabled();
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe("loading state", () => {
    it("disables all buttons when loading", () => {
      render(
        <PrizeList
          {...defaultProps}
          prizes={[mockPrizes[0]]}
          isLoading={true}
        />
      );

      const editButton = screen.getByRole("button", { name: /edit first prize/i });
      const deleteButton = screen.getByRole("button", { name: /delete first prize/i });

      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("has accessible button labels", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      expect(
        screen.getByRole("button", { name: /edit first prize/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete first prize/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /edit second prize/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete second prize/i })
      ).toBeInTheDocument();
    });

    it("has title attributes for tooltips", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      const editButton = screen.getByRole("button", { name: /edit first prize/i });
      expect(editButton).toHaveAttribute("title", "Edit First Prize");

      const deleteButton = screen.getByRole("button", { name: /delete first prize/i });
      expect(deleteButton).toHaveAttribute("title", "Delete First Prize");
    });

    it("shows disabled reason in title for awarded prizes", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[2]]} />);

      const editButton = screen.getByRole("button", { name: /edit third prize/i });
      expect(editButton).toHaveAttribute("title", "Cannot edit awarded prize");

      const deleteButton = screen.getByRole("button", { name: /delete third prize/i });
      expect(deleteButton).toHaveAttribute("title", "Cannot delete awarded prize");
    });
  });

  describe("multiple prizes", () => {
    it("correctly handles multiple prizes", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      // All three prizes should be visible
      expect(screen.getAllByText("Pending")).toHaveLength(2);
      expect(screen.getAllByText("Awarded")).toHaveLength(1);
    });

    it("maintains order by sort_order", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      const prizeNumbers = screen.getAllByText(/#\d/);
      expect(prizeNumbers[0]).toHaveTextContent("#1");
      expect(prizeNumbers[1]).toHaveTextContent("#2");
      expect(prizeNumbers[2]).toHaveTextContent("#3");
    });
  });
});
