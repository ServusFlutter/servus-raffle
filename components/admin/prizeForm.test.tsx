/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrizeForm } from "./prizeForm";
import type { Prize } from "@/lib/schemas/prize";

describe("PrizeForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnOpenChange = jest.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
  };

  const mockPrize: Prize = {
    id: "prize-123",
    raffle_id: "raffle-456",
    name: "Existing Prize",
    description: "Existing description",
    sort_order: 0,
    awarded_to: null,
    awarded_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the add prize form when no prize is provided", () => {
      render(<PrizeForm {...defaultProps} />);

      // Dialog title
      expect(screen.getByRole("heading", { name: "Add Prize" })).toBeInTheDocument();
      expect(
        screen.getByText(/Add a new prize to this raffle/)
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Prize Name")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add prize/i })).toBeInTheDocument();
    });

    it("renders the edit prize form when prize is provided", () => {
      render(<PrizeForm {...defaultProps} prize={mockPrize} />);

      // Dialog title
      expect(screen.getByRole("heading", { name: "Edit Prize" })).toBeInTheDocument();
      expect(
        screen.getByText(/Update the prize details below/)
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Prize Name")).toHaveValue("Existing Prize");
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    it("shows description as optional", () => {
      render(<PrizeForm {...defaultProps} />);

      expect(screen.getByText("(optional)")).toBeInTheDocument();
    });

    it("has correct placeholders", () => {
      render(<PrizeForm {...defaultProps} />);

      expect(
        screen.getByPlaceholderText("e.g., Amazon Gift Card")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g., $50 Amazon gift card")
      ).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows error for empty name submission", async () => {
      const user = userEvent.setup();
      render(<PrizeForm {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /add prize/i });
      await user.click(submitButton);

      expect(screen.getByText("Prize name is required")).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("shows error for whitespace-only name", async () => {
      const user = userEvent.setup();
      render(<PrizeForm {...defaultProps} />);

      const input = screen.getByLabelText("Prize Name");
      await user.type(input, "   ");

      const submitButton = screen.getByRole("button", { name: /add prize/i });
      await user.click(submitButton);

      expect(screen.getByText("Prize name is required")).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("clears error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<PrizeForm {...defaultProps} />);

      // Trigger validation error
      const submitButton = screen.getByRole("button", { name: /add prize/i });
      await user.click(submitButton);
      expect(screen.getByText("Prize name is required")).toBeInTheDocument();

      // Start typing to clear error
      const input = screen.getByLabelText("Prize Name");
      await user.type(input, "Test");

      expect(
        screen.queryByText("Prize name is required")
      ).not.toBeInTheDocument();
    });
  });

  describe("successful submission", () => {
    it("calls onSubmit with name only", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<PrizeForm {...defaultProps} />);

      const nameInput = screen.getByLabelText("Prize Name");
      await user.type(nameInput, "New Prize");

      const submitButton = screen.getByRole("button", { name: /add prize/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("New Prize", null);
      });
    });

    it("calls onSubmit with name and description", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<PrizeForm {...defaultProps} />);

      const nameInput = screen.getByLabelText("Prize Name");
      await user.type(nameInput, "Gift Card");

      const descInput = screen.getByPlaceholderText("e.g., $50 Amazon gift card");
      await user.type(descInput, "A nice gift card");

      const submitButton = screen.getByRole("button", { name: /add prize/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("Gift Card", "A nice gift card");
      });
    });

    it("trims whitespace from name", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<PrizeForm {...defaultProps} />);

      const nameInput = screen.getByLabelText("Prize Name");
      await user.type(nameInput, "  Trimmed Name  ");

      const submitButton = screen.getByRole("button", { name: /add prize/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("Trimmed Name", null);
      });
    });

    it("resets form after successful add", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<PrizeForm {...defaultProps} />);

      const nameInput = screen.getByLabelText("Prize Name");
      await user.type(nameInput, "New Prize");

      const descInput = screen.getByPlaceholderText("e.g., $50 Amazon gift card");
      await user.type(descInput, "Description");

      const submitButton = screen.getByRole("button", { name: /add prize/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Form should be reset
      expect(nameInput).toHaveValue("");
      expect(descInput).toHaveValue("");
    });
  });

  describe("edit mode", () => {
    it("pre-fills form with existing prize data", () => {
      render(<PrizeForm {...defaultProps} prize={mockPrize} />);

      expect(screen.getByLabelText("Prize Name")).toHaveValue("Existing Prize");
      expect(
        screen.getByPlaceholderText("e.g., $50 Amazon gift card")
      ).toHaveValue("Existing description");
    });

    it("calls onSubmit with updated values", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<PrizeForm {...defaultProps} prize={mockPrize} />);

      const nameInput = screen.getByLabelText("Prize Name");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Prize");

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          "Updated Prize",
          "Existing description"
        );
      });
    });

    it("updates form when prize prop changes", () => {
      const secondPrize: Prize = {
        id: "prize-456",
        raffle_id: "raffle-456",
        name: "Second Prize",
        description: "Second description",
        sort_order: 1,
        awarded_to: null,
        awarded_at: null,
      };

      const { rerender } = render(<PrizeForm {...defaultProps} prize={mockPrize} />);

      expect(screen.getByLabelText("Prize Name")).toHaveValue("Existing Prize");
      expect(
        screen.getByPlaceholderText("e.g., $50 Amazon gift card")
      ).toHaveValue("Existing description");

      // Rerender with different prize
      rerender(<PrizeForm {...defaultProps} prize={secondPrize} />);

      expect(screen.getByLabelText("Prize Name")).toHaveValue("Second Prize");
      expect(
        screen.getByPlaceholderText("e.g., $50 Amazon gift card")
      ).toHaveValue("Second description");
    });
  });

  describe("loading state", () => {
    it("shows loading indicator when submitting", () => {
      render(<PrizeForm {...defaultProps} isSubmitting={true} />);

      // Check loading state
      expect(screen.getByText("Adding...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /adding/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      expect(screen.getByLabelText("Prize Name")).toBeDisabled();
    });

    it("shows saving indicator in edit mode", () => {
      render(<PrizeForm {...defaultProps} prize={mockPrize} isSubmitting={true} />);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });

  describe("cancel and close", () => {
    it("calls onOpenChange when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<PrizeForm {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("does not close when submitting", async () => {
      render(<PrizeForm {...defaultProps} isSubmitting={true} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("error handling", () => {
    it("shows error when onSubmit throws", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error("Server error"));

      render(<PrizeForm {...defaultProps} />);

      const nameInput = screen.getByLabelText("Prize Name");
      await user.type(nameInput, "Test Prize");

      const submitButton = screen.getByRole("button", { name: /add prize/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("An unexpected error occurred")
        ).toBeInTheDocument();
      });
    });
  });
});
