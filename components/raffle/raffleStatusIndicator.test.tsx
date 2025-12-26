import { render, screen } from "@testing-library/react";
import { RaffleStatusIndicator } from "./raffleStatusIndicator";

describe("RaffleStatusIndicator", () => {
  describe("active status", () => {
    it("shows Active status label", () => {
      render(<RaffleStatusIndicator status="active" />);
      expect(screen.getByText("Raffle Open")).toBeInTheDocument();
    });

    it("shows waiting for draw sublabel", () => {
      render(<RaffleStatusIndicator status="active" />);
      expect(
        screen.getByText("Waiting for draw to begin")
      ).toBeInTheDocument();
    });

    it("shows green pulsing dot for active status", () => {
      render(<RaffleStatusIndicator status="active" />);
      const dot = screen.getByTestId("status-dot");
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass("bg-green-500");
      expect(dot).toHaveClass("animate-pulse");
    });

    it("respects prefers-reduced-motion for dot animation", () => {
      render(<RaffleStatusIndicator status="active" />);
      const dot = screen.getByTestId("status-dot");
      expect(dot).toHaveClass("motion-reduce:animate-none");
    });

    it("has green icon color", () => {
      render(<RaffleStatusIndicator status="active" />);
      const icon = screen.getByTestId("status-icon");
      expect(icon).toHaveClass("text-green-500");
    });
  });

  describe("drawing status", () => {
    it("shows Drawing status label", () => {
      render(<RaffleStatusIndicator status="drawing" />);
      expect(screen.getByText("Draw in Progress")).toBeInTheDocument();
    });

    it("shows spinning wheel sublabel", () => {
      render(<RaffleStatusIndicator status="drawing" />);
      expect(screen.getByText("The wheel is spinning!")).toBeInTheDocument();
    });

    it("has amber icon color with spin animation", () => {
      render(<RaffleStatusIndicator status="drawing" />);
      const icon = screen.getByTestId("status-icon");
      expect(icon).toHaveClass("text-amber-500");
      expect(icon).toHaveClass("animate-spin");
    });

    it("respects prefers-reduced-motion for icon animation", () => {
      render(<RaffleStatusIndicator status="drawing" />);
      const icon = screen.getByTestId("status-icon");
      expect(icon).toHaveClass("motion-reduce:animate-none");
    });

    it("does not show pulsing dot for drawing status", () => {
      render(<RaffleStatusIndicator status="drawing" />);
      expect(screen.queryByTestId("status-dot")).not.toBeInTheDocument();
    });
  });

  describe("completed status", () => {
    it("shows Completed status label", () => {
      render(<RaffleStatusIndicator status="completed" />);
      expect(screen.getByText("Raffle Complete")).toBeInTheDocument();
    });

    it("shows all prizes awarded sublabel", () => {
      render(<RaffleStatusIndicator status="completed" />);
      expect(
        screen.getByText("All prizes have been awarded")
      ).toBeInTheDocument();
    });

    it("has muted icon color", () => {
      render(<RaffleStatusIndicator status="completed" />);
      const icon = screen.getByTestId("status-icon");
      expect(icon).toHaveClass("text-muted-foreground");
    });

    it("does not show pulsing dot for completed status", () => {
      render(<RaffleStatusIndicator status="completed" />);
      expect(screen.queryByTestId("status-dot")).not.toBeInTheDocument();
    });
  });

  describe("draft status", () => {
    it("shows Not Started status label", () => {
      render(<RaffleStatusIndicator status="draft" />);
      expect(screen.getByText("Not Started")).toBeInTheDocument();
    });

    it("shows setup sublabel", () => {
      render(<RaffleStatusIndicator status="draft" />);
      expect(screen.getByText("Raffle is being set up")).toBeInTheDocument();
    });

    it("has muted icon color", () => {
      render(<RaffleStatusIndicator status="draft" />);
      const icon = screen.getByTestId("status-icon");
      expect(icon).toHaveClass("text-muted-foreground");
    });
  });

  describe("styling and layout", () => {
    it("has correct container test id", () => {
      render(<RaffleStatusIndicator status="active" />);
      expect(screen.getByTestId("raffle-status-indicator")).toBeInTheDocument();
    });

    it("has rounded-lg and bg-muted styling", () => {
      render(<RaffleStatusIndicator status="active" />);
      const container = screen.getByTestId("raffle-status-indicator");
      expect(container).toHaveClass("rounded-lg");
      expect(container).toHaveClass("bg-muted/50");
    });

    it("accepts and applies custom className", () => {
      render(
        <RaffleStatusIndicator status="active" className="custom-class" />
      );
      const container = screen.getByTestId("raffle-status-indicator");
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("accessibility", () => {
    it("has status role for screen readers", () => {
      render(<RaffleStatusIndicator status="active" />);
      const container = screen.getByTestId("raffle-status-indicator");
      expect(container).toHaveAttribute("role", "status");
    });

    it("has aria-label combining label and sublabel", () => {
      render(<RaffleStatusIndicator status="active" />);
      const container = screen.getByTestId("raffle-status-indicator");
      expect(container).toHaveAttribute(
        "aria-label",
        "Raffle Open: Waiting for draw to begin"
      );
    });

    it("has aria-hidden on decorative icon", () => {
      render(<RaffleStatusIndicator status="active" />);
      const icon = screen.getByTestId("status-icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("has aria-hidden on decorative dot", () => {
      render(<RaffleStatusIndicator status="active" />);
      const dot = screen.getByTestId("status-dot");
      expect(dot).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("test ids", () => {
    it("has correct test id for label", () => {
      render(<RaffleStatusIndicator status="active" />);
      expect(screen.getByTestId("status-label")).toBeInTheDocument();
    });

    it("has correct test id for sublabel", () => {
      render(<RaffleStatusIndicator status="active" />);
      expect(screen.getByTestId("status-sublabel")).toBeInTheDocument();
    });
  });
});
