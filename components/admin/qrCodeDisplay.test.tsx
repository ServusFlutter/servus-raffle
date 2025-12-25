import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRCodeDisplay } from "./qrCodeDisplay";

// Mock qrcode.react
jest.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value, size }: { value: string; size: number }) => (
    <svg data-testid="qr-code-svg" data-value={value} data-size={size}>
      <rect />
    </svg>
  ),
}));

describe("QRCodeDisplay", () => {
  const defaultProps = {
    value: "https://example.com/join/test-raffle-id",
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    raffleName: "Test Raffle",
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("rendering", () => {
    it("renders the raffle name", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      expect(screen.getByText("Test Raffle")).toBeInTheDocument();
    });

    it("renders the QR code SVG", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      const qrCode = screen.getByTestId("qr-code-svg");
      expect(qrCode).toBeInTheDocument();
      expect(qrCode).toHaveAttribute(
        "data-value",
        "https://example.com/join/test-raffle-id"
      );
    });

    it("displays countdown timer", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      // Should show time remaining (format: Xh Xm)
      expect(screen.getByText(/\d+h|\d+m/)).toBeInTheDocument();
    });

    it("displays expiration time", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      expect(screen.getByText(/Expires at/)).toBeInTheDocument();
    });

    it("shows scan instruction", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      expect(screen.getByText("Scan to join the raffle")).toBeInTheDocument();
    });
  });

  describe("buttons", () => {
    it("renders download button", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /download/i })
      ).toBeInTheDocument();
    });

    it("renders projection mode toggle button", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /projection mode/i })
      ).toBeInTheDocument();
    });
  });

  describe("projection mode", () => {
    it("starts in standard mode by default", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      // Should show "Projection Mode" button (to enter it)
      expect(
        screen.getByRole("button", { name: /projection mode/i })
      ).toBeInTheDocument();
    });

    it("starts in projection mode when prop is true", () => {
      render(<QRCodeDisplay {...defaultProps} projectionMode={true} />);

      // Should show "Exit Fullscreen" button (to exit projection mode)
      expect(
        screen.getByRole("button", { name: /exit fullscreen/i })
      ).toBeInTheDocument();
    });

    it("toggles projection mode when button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<QRCodeDisplay {...defaultProps} />);

      const toggleButton = screen.getByRole("button", {
        name: /projection mode/i,
      });
      await user.click(toggleButton);

      // Should now show exit button
      expect(
        screen.getByRole("button", { name: /exit fullscreen/i })
      ).toBeInTheDocument();
    });

    it("uses larger QR code size in projection mode", () => {
      render(<QRCodeDisplay {...defaultProps} projectionMode={true} />);

      const qrCode = screen.getByTestId("qr-code-svg");
      expect(qrCode).toHaveAttribute("data-size", "512");
    });

    it("uses standard QR code size in normal mode", () => {
      render(<QRCodeDisplay {...defaultProps} projectionMode={false} />);

      const qrCode = screen.getByTestId("qr-code-svg");
      expect(qrCode).toHaveAttribute("data-size", "256");
    });
  });

  describe("expiration handling", () => {
    it("shows expired state when QR code has expired", () => {
      const expiredProps = {
        ...defaultProps,
        expiresAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      };

      render(<QRCodeDisplay {...expiredProps} />);

      expect(screen.getByText("QR Code Expired")).toBeInTheDocument();
    });

    it("disables download button when expired", () => {
      const expiredProps = {
        ...defaultProps,
        expiresAt: new Date(Date.now() - 60000).toISOString(),
      };

      render(<QRCodeDisplay {...expiredProps} />);

      expect(screen.getByRole("button", { name: /download/i })).toBeDisabled();
    });

    it("calls onExpired callback when QR code expires", () => {
      const onExpired = jest.fn();
      const soonToExpireProps = {
        ...defaultProps,
        expiresAt: new Date(Date.now() + 1000).toISOString(), // 1 second from now
        onExpired,
      };

      render(<QRCodeDisplay {...soonToExpireProps} />);

      // Fast forward time past expiration
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onExpired).toHaveBeenCalled();
    });

    it("shows urgency indicator when less than 15 minutes remain", () => {
      const urgentProps = {
        ...defaultProps,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      };

      render(<QRCodeDisplay {...urgentProps} />);

      expect(screen.getByText("Expiring Soon")).toBeInTheDocument();
    });

    it("does not show urgency indicator when more than 15 minutes remain", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      expect(screen.queryByText("Expiring Soon")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has accessible region label", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      expect(
        screen.getByRole("region", { name: /qr code to join test raffle/i })
      ).toBeInTheDocument();
    });

    it("has live region for countdown", () => {
      render(<QRCodeDisplay {...defaultProps} />);

      // The countdown should be in an aria-live region
      const countdownElement = screen.getByText(/\d+h|\d+m/);
      expect(countdownElement).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("countdown updates", () => {
    it("updates countdown every second", async () => {
      const props = {
        ...defaultProps,
        expiresAt: new Date(Date.now() + 120000).toISOString(), // 2 minutes
      };

      render(<QRCodeDisplay {...props} />);

      const initialCountdown = screen.getByText(/\d+m \d+s/).textContent;

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const updatedCountdown = screen.getByText(/\d+m \d+s/).textContent;
        expect(updatedCountdown).not.toBe(initialCountdown);
      });
    });
  });
});
