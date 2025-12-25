/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Create mock functions that persist across module mock
const mockCreateRaffle = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

// Mock modules - Jest hoists these before imports
jest.mock("@/lib/actions/raffles", () => ({
  __esModule: true,
  createRaffle: (...args: unknown[]) => mockCreateRaffle(...args),
}));

jest.mock("sonner", () => ({
  __esModule: true,
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Import component AFTER mocks are set up
import { RaffleForm } from "./raffleForm";

describe("RaffleForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the form with all elements", () => {
      render(<RaffleForm />);

      expect(screen.getByText("Create New Raffle")).toBeInTheDocument();
      expect(screen.getByLabelText("Raffle Name")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g., December Meetup Raffle")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create raffle/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("has the name input with correct attributes", () => {
      render(<RaffleForm />);

      const input = screen.getByLabelText("Raffle Name");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("placeholder", "e.g., December Meetup Raffle");
    });
  });

  describe("validation", () => {
    it("shows error for empty name submission", async () => {
      const user = userEvent.setup();
      render(<RaffleForm />);

      const submitButton = screen.getByRole("button", { name: /create raffle/i });
      await user.click(submitButton);

      expect(screen.getByText("Raffle name is required")).toBeInTheDocument();
      expect(mockCreateRaffle).not.toHaveBeenCalled();
    });

    it("shows error for whitespace-only name", async () => {
      const user = userEvent.setup();
      render(<RaffleForm />);

      const input = screen.getByLabelText("Raffle Name");
      await user.type(input, "   ");

      const submitButton = screen.getByRole("button", { name: /create raffle/i });
      await user.click(submitButton);

      expect(screen.getByText("Raffle name is required")).toBeInTheDocument();
      expect(mockCreateRaffle).not.toHaveBeenCalled();
    });

    it("clears error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<RaffleForm />);

      // Trigger validation error
      const submitButton = screen.getByRole("button", { name: /create raffle/i });
      await user.click(submitButton);
      expect(screen.getByText("Raffle name is required")).toBeInTheDocument();

      // Start typing to clear error
      const input = screen.getByLabelText("Raffle Name");
      await user.type(input, "Test");

      expect(
        screen.queryByText("Raffle name is required")
      ).not.toBeInTheDocument();
    });
  });

  describe("successful submission", () => {
    it("calls createRaffle and redirects on success", async () => {
      const user = userEvent.setup();
      const mockRaffle = {
        id: "raffle-123",
        name: "Test Raffle",
        status: "draft",
        qr_code_expires_at: null,
        created_at: "2024-12-25T10:00:00Z",
        created_by: "admin-1",
      };

      mockCreateRaffle.mockResolvedValue({
        data: mockRaffle,
        error: null,
      });

      render(<RaffleForm />);

      const input = screen.getByLabelText("Raffle Name");
      await user.type(input, "Test Raffle");

      const submitButton = screen.getByRole("button", { name: /create raffle/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateRaffle).toHaveBeenCalledWith("Test Raffle");
        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Raffle created successfully"
        );
        expect(mockPush).toHaveBeenCalledWith("/admin/raffles/raffle-123");
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: { data: null; error: null }) => void;
      const pendingPromise = new Promise<{ data: null; error: null }>(
        (resolve) => {
          resolvePromise = resolve;
        }
      );

      mockCreateRaffle.mockReturnValue(pendingPromise);

      render(<RaffleForm />);

      const input = screen.getByLabelText("Raffle Name");
      await user.type(input, "Test Raffle");

      const submitButton = screen.getByRole("button", { name: /create raffle/i });
      await user.click(submitButton);

      expect(screen.getByText("Creating...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      expect(input).toBeDisabled();

      // Cleanup - resolve promise and wait for state update
      await waitFor(() => {
        resolvePromise!({ data: null, error: null });
      });
    });
  });

  describe("error handling", () => {
    it("shows error toast on server error", async () => {
      const user = userEvent.setup();
      mockCreateRaffle.mockResolvedValue({
        data: null,
        error: "Failed to create raffle",
      });

      render(<RaffleForm />);

      const input = screen.getByLabelText("Raffle Name");
      await user.type(input, "Test Raffle");

      const submitButton = screen.getByRole("button", { name: /create raffle/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to create raffle");
        expect(screen.getByText("Failed to create raffle")).toBeInTheDocument();
      });
    });

    it("handles unexpected errors gracefully", async () => {
      const user = userEvent.setup();
      mockCreateRaffle.mockRejectedValue(new Error("Network error"));

      render(<RaffleForm />);

      const input = screen.getByLabelText("Raffle Name");
      await user.type(input, "Test Raffle");

      const submitButton = screen.getByRole("button", { name: /create raffle/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "An unexpected error occurred"
        );
      });
    });
  });

  describe("navigation", () => {
    it("calls router.back on cancel click", async () => {
      const user = userEvent.setup();
      render(<RaffleForm />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
