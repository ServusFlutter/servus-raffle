import { render, screen, act } from "@testing-library/react";
import { TicketCircle, getTicketMessage } from "./ticketCircle";

describe("TicketCircle", () => {
  describe("rendering", () => {
    it("renders with the correct ticket count", () => {
      render(<TicketCircle count={5} />);

      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders count of 0 correctly", () => {
      render(<TicketCircle count={0} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("renders large numbers correctly", () => {
      render(<TicketCircle count={100} />);

      expect(screen.getByText("100")).toBeInTheDocument();
    });
  });

  describe("size prop variations", () => {
    it("applies default size classes when size is default", () => {
      const { container } = render(<TicketCircle count={1} size="default" />);

      // Default size: 200px mobile
      const circle = container.querySelector('[data-testid="ticket-circle"]');
      expect(circle).toHaveClass("w-[200px]");
      expect(circle).toHaveClass("h-[200px]");
    });

    it("applies large size classes", () => {
      const { container } = render(<TicketCircle count={1} size="large" />);

      const circle = container.querySelector('[data-testid="ticket-circle"]');
      // Large size is always 300px (no responsive breakpoint)
      expect(circle).toHaveClass("w-[300px]");
      expect(circle).toHaveClass("h-[300px]");
    });

    it("applies projection size classes", () => {
      const { container } = render(<TicketCircle count={1} size="projection" />);

      const circle = container.querySelector('[data-testid="ticket-circle"]');
      expect(circle).toHaveClass("w-[400px]");
      expect(circle).toHaveClass("h-[400px]");
    });

    it("defaults to default size when no size prop provided", () => {
      const { container } = render(<TicketCircle count={1} />);

      const circle = container.querySelector('[data-testid="ticket-circle"]');
      expect(circle).toHaveClass("w-[200px]");
    });
  });

  describe("styling", () => {
    it("includes gradient background for light mode", () => {
      const { container } = render(<TicketCircle count={1} />);

      const circle = container.querySelector('[data-testid="ticket-circle"]');
      expect(circle).toHaveClass("bg-gradient-to-br");
      expect(circle).toHaveClass("from-primary");
    });

    it("includes dark mode styling classes", () => {
      const { container } = render(<TicketCircle count={1} />);

      const circle = container.querySelector('[data-testid="ticket-circle"]');
      expect(circle).toHaveClass("dark:from-slate-900");
      expect(circle).toHaveClass("dark:to-slate-800");
    });

    it("has frosted glass overlay", () => {
      const { container } = render(<TicketCircle count={1} />);

      const frosted = container.querySelector('[data-testid="frosted-overlay"]');
      expect(frosted).toBeInTheDocument();
      expect(frosted).toHaveClass("bg-white/70");
      expect(frosted).toHaveClass("backdrop-blur-md");
    });

    it("renders as circular (rounded-full)", () => {
      const { container } = render(<TicketCircle count={1} />);

      const circle = container.querySelector('[data-testid="ticket-circle"]');
      expect(circle).toHaveClass("rounded-full");
    });
  });

  describe("number styling", () => {
    it("applies hero font size for default size", () => {
      const { container } = render(<TicketCircle count={1} size="default" />);

      const number = container.querySelector('[data-testid="ticket-number"]');
      expect(number).toHaveClass("text-[72px]");
    });

    it("applies large font size for large size", () => {
      const { container } = render(<TicketCircle count={1} size="large" />);

      const number = container.querySelector('[data-testid="ticket-number"]');
      // Large size always uses 96px (no responsive breakpoint)
      expect(number).toHaveClass("text-[96px]");
    });

    it("applies projection font size for projection size", () => {
      const { container } = render(<TicketCircle count={1} size="projection" />);

      const number = container.querySelector('[data-testid="ticket-number"]');
      expect(number).toHaveClass("text-[144px]");
    });

    it("has dark mode glow effect on number", () => {
      const { container } = render(<TicketCircle count={1} />);

      const number = container.querySelector('[data-testid="ticket-number"]');
      expect(number).toHaveClass("dark:drop-shadow-[0_0_15px_rgba(2,125,253,0.8)]");
    });
  });

  describe("accessibility", () => {
    it("has status role for ticket count", () => {
      render(<TicketCircle count={5} />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("has correct aria-label for singular ticket", () => {
      render(<TicketCircle count={1} />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-label", "You have 1 ticket");
    });

    it("has correct aria-label for plural tickets", () => {
      render(<TicketCircle count={5} />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-label", "You have 5 tickets");
    });

    it("has aria-live polite for updates", () => {
      render(<TicketCircle count={1} />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-live", "polite");
    });

    it("has aria-atomic true for full announcements", () => {
      render(<TicketCircle count={1} />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-atomic", "true");
    });
  });

  describe("reduced motion support", () => {
    it("includes motion-reduce class for accessibility", () => {
      const { container } = render(<TicketCircle count={1} />);

      const number = container.querySelector('[data-testid="ticket-number"]');
      expect(number).toHaveClass("motion-reduce:transition-none");
    });

    it("includes motion-reduce:transform-none for reduced motion preference", () => {
      const { container } = render(<TicketCircle count={1} />);

      const number = container.querySelector('[data-testid="ticket-number"]');
      expect(number).toHaveClass("motion-reduce:transform-none");
    });
  });

  describe("count change animation", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it("applies scale-105 class when count changes", async () => {
      const { container, rerender } = render(<TicketCircle count={1} />);

      const number = container.querySelector('[data-testid="ticket-number"]');
      expect(number).not.toHaveClass("scale-105");

      // Change count to trigger animation
      rerender(<TicketCircle count={2} />);

      // Animation should be triggered
      expect(number).toHaveClass("scale-105");

      // Clean up timers properly wrapped in act
      await act(async () => {
        jest.runAllTimers();
      });
    });

    it("removes scale-105 class after animation duration", async () => {
      const { container, rerender } = render(<TicketCircle count={1} />);

      rerender(<TicketCircle count={2} />);

      const number = container.querySelector('[data-testid="ticket-number"]');
      expect(number).toHaveClass("scale-105");

      // Advance timers wrapped in act
      await act(async () => {
        jest.runAllTimers();
      });

      expect(number).not.toHaveClass("scale-105");
    });

    it("has transition classes for smooth animation", () => {
      const { container } = render(<TicketCircle count={1} />);

      const number = container.querySelector('[data-testid="ticket-number"]');
      expect(number).toHaveClass("transition-transform");
      expect(number).toHaveClass("duration-300");
      expect(number).toHaveClass("ease-out");
    });
  });

  describe("custom className", () => {
    it("accepts and applies custom className", () => {
      const { container } = render(
        <TicketCircle count={1} className="custom-class" />
      );

      const wrapper = container.querySelector('[data-testid="ticket-circle-wrapper"]');
      expect(wrapper).toHaveClass("custom-class");
    });
  });
});

describe("getTicketMessage", () => {
  it("returns join message for 0 tickets", () => {
    expect(getTicketMessage(0)).toBe("Join a raffle to get started!");
  });

  it("returns luck message for 1 ticket (AC#5)", () => {
    expect(getTicketMessage(1)).toBe("You're in! Good luck!");
  });

  it("returns momentum message for 2 tickets", () => {
    expect(getTicketMessage(2)).toBe("Building momentum!");
  });

  it("returns momentum message for 3 tickets", () => {
    expect(getTicketMessage(3)).toBe("Building momentum!");
  });

  it("returns strong message for 4 tickets", () => {
    expect(getTicketMessage(4)).toBe("Looking strong!");
  });

  it("returns strong message for 5 tickets", () => {
    expect(getTicketMessage(5)).toBe("Looking strong!");
  });

  it("returns best odds message for 6+ tickets (AC#4)", () => {
    expect(getTicketMessage(6)).toBe("Your best odds yet!");
  });

  it("returns best odds message for large counts", () => {
    expect(getTicketMessage(100)).toBe("Your best odds yet!");
  });
});
