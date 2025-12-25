import { render, screen } from "@testing-library/react";
import { StatusBar } from "./statusBar";

describe("StatusBar", () => {
  describe("rendering for active status", () => {
    it("renders 'Locked in - waiting for draw' state for active raffle", () => {
      render(<StatusBar status="active" />);
      expect(
        screen.getByText("Locked in - waiting for draw")
      ).toBeInTheDocument();
    });

    it("shows pulsing green dot for active status", () => {
      render(<StatusBar status="active" />);
      const dot = screen.getByTestId("status-dot");
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass("bg-green-500");
      expect(dot).toHaveClass("animate-pulse");
    });

    it("uses 2-second animation cycle (Tailwind default animate-pulse)", () => {
      render(<StatusBar status="active" />);
      const dot = screen.getByTestId("status-dot");
      // Tailwind's animate-pulse is 2s by default
      expect(dot).toHaveClass("animate-pulse");
    });
  });

  describe("non-active status", () => {
    it("returns null for completed status", () => {
      const { container } = render(<StatusBar status="completed" />);
      expect(container).toBeEmptyDOMElement();
    });

    it("returns null for drawing status", () => {
      const { container } = render(<StatusBar status="drawing" />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("positioning and styling", () => {
    it("is fixed to the bottom of the screen", () => {
      render(<StatusBar status="active" />);
      const statusBar = screen.getByTestId("status-bar");
      expect(statusBar).toHaveClass("fixed");
      expect(statusBar).toHaveClass("bottom-0");
      expect(statusBar).toHaveClass("left-0");
      expect(statusBar).toHaveClass("right-0");
    });

    it("has semi-transparent backdrop blur styling", () => {
      render(<StatusBar status="active" />);
      const statusBar = screen.getByTestId("status-bar");
      expect(statusBar).toHaveClass("bg-background/95");
      expect(statusBar).toHaveClass("backdrop-blur-sm");
    });

    it("has border-top separator", () => {
      render(<StatusBar status="active" />);
      const statusBar = screen.getByTestId("status-bar");
      expect(statusBar).toHaveClass("border-t");
    });

    it("centers content with flex", () => {
      render(<StatusBar status="active" />);
      const statusBar = screen.getByTestId("status-bar");
      expect(statusBar).toHaveClass("flex");
      expect(statusBar).toHaveClass("items-center");
      expect(statusBar).toHaveClass("justify-center");
    });
  });

  describe("reduced motion support", () => {
    it("respects prefers-reduced-motion preference", () => {
      render(<StatusBar status="active" />);
      const dot = screen.getByTestId("status-dot");
      expect(dot).toHaveClass("motion-reduce:animate-none");
    });
  });

  describe("dark mode support", () => {
    it("maintains visibility in dark mode (green-500 works in both modes)", () => {
      render(<StatusBar status="active" />);
      const dot = screen.getByTestId("status-dot");
      // Green-500 is visible in both light and dark modes
      expect(dot).toHaveClass("bg-green-500");
    });

    it("uses muted-foreground text for subtle appearance", () => {
      render(<StatusBar status="active" />);
      const text = screen.getByText("Locked in - waiting for draw");
      expect(text).toHaveClass("text-muted-foreground");
    });
  });

  describe("custom className", () => {
    it("accepts and applies custom className", () => {
      render(<StatusBar status="active" className="custom-class" />);
      const statusBar = screen.getByTestId("status-bar");
      expect(statusBar).toHaveClass("custom-class");
    });
  });
});
