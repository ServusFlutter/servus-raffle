import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpirationSelector } from "./expirationSelector";

describe("ExpirationSelector", () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders title and description", () => {
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      expect(screen.getByText("QR Code Expiration")).toBeInTheDocument();
      expect(
        screen.getByText(/Choose how long the QR code will be valid/)
      ).toBeInTheDocument();
    });

    it("renders all preset duration options", () => {
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      expect(screen.getByRole("button", { name: "1 hour" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "2 hours" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "3 hours" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "4 hours" })).toBeInTheDocument();
    });

    it("renders custom duration button", () => {
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      expect(
        screen.getByRole("button", { name: "Custom Duration" })
      ).toBeInTheDocument();
    });

    it("renders generate button", () => {
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      expect(
        screen.getByRole("button", { name: "Generate QR Code" })
      ).toBeInTheDocument();
    });

    it("selects 3 hours by default", () => {
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      // 3 hours button should have default variant (different from outline)
      const threeHourButton = screen.getByRole("button", { name: "3 hours" });
      expect(threeHourButton).toHaveClass("bg-primary");
    });
  });

  describe("preset selection", () => {
    it("calls onSelect with correct duration for 1 hour", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "1 hour" }));
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(mockOnSelect).toHaveBeenCalledWith(60);
    });

    it("calls onSelect with correct duration for 2 hours", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "2 hours" }));
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(mockOnSelect).toHaveBeenCalledWith(120);
    });

    it("calls onSelect with correct duration for 4 hours", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "4 hours" }));
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(mockOnSelect).toHaveBeenCalledWith(240);
    });

    it("shows expiration preview when preset selected", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "2 hours" }));

      expect(
        screen.getByText(/QR code will expire at approximately/)
      ).toBeInTheDocument();
    });
  });

  describe("custom duration", () => {
    it("shows custom inputs when Custom Duration clicked", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "Custom Duration" }));

      expect(screen.getByLabelText("Hours")).toBeInTheDocument();
      expect(screen.getByLabelText("Minutes")).toBeInTheDocument();
    });

    it("accepts valid custom duration", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "Custom Duration" }));
      await user.type(screen.getByLabelText("Hours"), "2");
      await user.type(screen.getByLabelText("Minutes"), "30");
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(mockOnSelect).toHaveBeenCalledWith(150); // 2*60 + 30 = 150
    });

    it("rejects duration less than 15 minutes", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "Custom Duration" }));
      await user.type(screen.getByLabelText("Minutes"), "10");
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(mockOnSelect).not.toHaveBeenCalled();
      expect(
        screen.getByText("Duration must be at least 15 minutes")
      ).toBeInTheDocument();
    });

    it("rejects duration more than 24 hours", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "Custom Duration" }));
      await user.type(screen.getByLabelText("Hours"), "25");
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(mockOnSelect).not.toHaveBeenCalled();
      expect(
        screen.getByText("Duration cannot exceed 24 hours")
      ).toBeInTheDocument();
    });

    it("clears error when input changes", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "Custom Duration" }));
      await user.type(screen.getByLabelText("Minutes"), "5");
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(
        screen.getByText("Duration must be at least 15 minutes")
      ).toBeInTheDocument();

      await user.clear(screen.getByLabelText("Minutes"));
      await user.type(screen.getByLabelText("Minutes"), "30");

      expect(
        screen.queryByText("Duration must be at least 15 minutes")
      ).not.toBeInTheDocument();
    });

    it("handles only hours input", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "Custom Duration" }));
      await user.type(screen.getByLabelText("Hours"), "1");
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(mockOnSelect).toHaveBeenCalledWith(60);
    });

    it("handles only minutes input", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "Custom Duration" }));
      await user.type(screen.getByLabelText("Minutes"), "45");
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(mockOnSelect).toHaveBeenCalledWith(45);
    });
  });

  describe("switching between preset and custom", () => {
    it("clears custom inputs when selecting preset", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      // Select custom and enter values
      await user.click(screen.getByRole("button", { name: "Custom Duration" }));
      await user.type(screen.getByLabelText("Hours"), "5");

      // Switch back to preset
      await user.click(screen.getByRole("button", { name: "2 hours" }));

      // Custom inputs should be hidden
      expect(screen.queryByLabelText("Hours")).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loading text when isLoading", () => {
      render(<ExpirationSelector onSelect={mockOnSelect} isLoading={true} />);

      expect(screen.getByText("Generating...")).toBeInTheDocument();
    });

    it("disables all buttons when loading", () => {
      render(<ExpirationSelector onSelect={mockOnSelect} isLoading={true} />);

      expect(screen.getByRole("button", { name: "1 hour" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "2 hours" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "3 hours" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "4 hours" })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Custom Duration" })
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "Generating..." })).toBeDisabled();
    });
  });

  describe("disabled state", () => {
    it("disables all buttons when disabled prop is true", () => {
      render(<ExpirationSelector onSelect={mockOnSelect} disabled={true} />);

      expect(screen.getByRole("button", { name: "1 hour" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "2 hours" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "3 hours" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "4 hours" })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Custom Duration" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Generate QR Code" })
      ).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("has proper labels for custom inputs", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "Custom Duration" }));

      const hoursInput = screen.getByLabelText("Hours");
      const minutesInput = screen.getByLabelText("Minutes");

      expect(hoursInput).toHaveAttribute("type", "number");
      expect(minutesInput).toHaveAttribute("type", "number");
    });

    it("shows error with role=alert", async () => {
      const user = userEvent.setup();
      render(<ExpirationSelector onSelect={mockOnSelect} />);

      await user.click(screen.getByRole("button", { name: "Custom Duration" }));
      await user.type(screen.getByLabelText("Minutes"), "5");
      await user.click(screen.getByRole("button", { name: "Generate QR Code" }));

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
