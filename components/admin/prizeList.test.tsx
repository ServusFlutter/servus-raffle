/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrizeList, type PrizeWithWinner } from "./prizeList";

// Mock @dnd-kit modules since they don't work well in JSDOM
jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: {},
  arrayMove: jest.fn((arr, from, to) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => null),
    },
  },
}));

describe("PrizeList", () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnReorder = jest.fn();

  const defaultProps = {
    prizes: [] as PrizeWithWinner[],
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onReorder: mockOnReorder,
  };

  const mockPrizes: PrizeWithWinner[] = [
    {
      id: "prize-1",
      raffle_id: "raffle-1",
      name: "First Prize",
      description: "A great first prize",
      sort_order: 0,
      awarded_to: null,
      awarded_at: null,
      winner_name: null,
    },
    {
      id: "prize-2",
      raffle_id: "raffle-1",
      name: "Second Prize",
      description: null,
      sort_order: 1,
      awarded_to: null,
      awarded_at: null,
      winner_name: null,
    },
    {
      id: "prize-3",
      raffle_id: "raffle-1",
      name: "Third Prize",
      description: "An awarded prize",
      sort_order: 2,
      awarded_to: "user-123",
      awarded_at: "2024-12-25T10:00:00Z",
      winner_name: "John Winner",
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

      expect(screen.getByText(/Awarded to/)).toBeInTheDocument();
      expect(screen.getByTestId("award-timestamp")).toBeInTheDocument();
    });

    it("shows winner name for awarded prizes", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[2]]} />);

      expect(screen.getByTestId("winner-name")).toHaveTextContent("John Winner");
    });

    it("shows Unknown when winner_name is null", () => {
      const prizeWithNoWinnerName: PrizeWithWinner = {
        ...mockPrizes[2],
        winner_name: null,
      };
      render(<PrizeList {...defaultProps} prizes={[prizeWithNoWinnerName]} />);

      expect(screen.getByTestId("winner-name")).toHaveTextContent("Unknown");
    });
  });

  describe("visual distinction (AC3)", () => {
    it("applies opacity to awarded prizes", () => {
      const { container } = render(<PrizeList {...defaultProps} prizes={[mockPrizes[2]]} />);

      // The Card with awarded prize should have opacity-60 class
      const cardWithOpacity = container.querySelector('.opacity-60');
      expect(cardWithOpacity).toBeInTheDocument();
    });

    it("highlights next prize to draw when highlightNextToDraw is true", () => {
      render(
        <PrizeList
          {...defaultProps}
          prizes={mockPrizes}
          highlightNextToDraw={true}
        />
      );

      expect(screen.getByTestId("next-to-draw-prize")).toBeInTheDocument();
    });

    it("does not highlight next prize when highlightNextToDraw is false", () => {
      render(
        <PrizeList
          {...defaultProps}
          prizes={mockPrizes}
          highlightNextToDraw={false}
        />
      );

      expect(screen.queryByTestId("next-to-draw-prize")).not.toBeInTheDocument();
    });

    it("highlights first unawarded prize as next to draw", () => {
      const prizesWithFirstAwarded: PrizeWithWinner[] = [
        { ...mockPrizes[0], awarded_to: "user-1", winner_name: "Winner 1" },
        { ...mockPrizes[1] }, // This should be highlighted
        { ...mockPrizes[2] },
      ];

      render(
        <PrizeList
          {...defaultProps}
          prizes={prizesWithFirstAwarded}
          highlightNextToDraw={true}
        />
      );

      const nextToDraw = screen.getByTestId("next-to-draw-prize");
      expect(nextToDraw).toContainElement(screen.getByText("Second Prize"));
    });

    it("does not highlight any prize when all are awarded", () => {
      const allAwarded: PrizeWithWinner[] = mockPrizes.map((p) => ({
        ...p,
        awarded_to: "user-1",
        winner_name: "Winner",
      }));

      render(
        <PrizeList
          {...defaultProps}
          prizes={allAwarded}
          highlightNextToDraw={true}
        />
      );

      expect(screen.queryByTestId("next-to-draw-prize")).not.toBeInTheDocument();
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

  describe("drag-and-drop reordering", () => {
    it("renders drag handles for non-awarded prizes when onReorder is provided", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      // First and second prizes (not awarded) should have drag handles
      expect(screen.getByTestId("drag-handle-prize-1")).toBeInTheDocument();
      expect(screen.getByTestId("drag-handle-prize-2")).toBeInTheDocument();
    });

    it("does not render drag handles for awarded prizes", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[2]]} />);

      // Awarded prize should not have a drag handle
      expect(screen.queryByTestId("drag-handle-prize-3")).not.toBeInTheDocument();
    });

    it("does not render drag handles when onReorder is not provided", () => {
      render(
        <PrizeList
          prizes={mockPrizes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // No drag handles when onReorder is not provided
      expect(screen.queryByTestId("drag-handle-prize-1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("drag-handle-prize-2")).not.toBeInTheDocument();
    });

    it("drag handles have accessible labels", () => {
      render(<PrizeList {...defaultProps} prizes={[mockPrizes[0]]} />);

      const dragHandle = screen.getByTestId("drag-handle-prize-1");
      expect(dragHandle).toHaveAttribute("aria-label", "Drag to reorder First Prize");
    });

    it("does not render drag handles when loading", () => {
      render(
        <PrizeList
          {...defaultProps}
          prizes={[mockPrizes[0]]}
          isLoading={true}
        />
      );

      // When loading, drag should be disabled (canDrag = false)
      expect(screen.queryByTestId("drag-handle-prize-1")).not.toBeInTheDocument();
    });

    it("renders prize list container with testid", () => {
      render(<PrizeList {...defaultProps} prizes={mockPrizes} />);

      expect(screen.getByTestId("prize-list")).toBeInTheDocument();
    });
  });
});
