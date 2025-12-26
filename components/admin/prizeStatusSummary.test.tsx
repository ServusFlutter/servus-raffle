/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PrizeStatusSummary } from "./prizeStatusSummary";
import type { Prize } from "@/lib/schemas/prize";

describe("PrizeStatusSummary", () => {
  const createMockPrize = (overrides: Partial<Prize> = {}): Prize => ({
    id: `prize-${Math.random().toString(36).slice(2, 9)}`,
    raffle_id: "raffle-1",
    name: "Test Prize",
    description: null,
    sort_order: 0,
    awarded_to: null,
    awarded_at: null,
    ...overrides,
  });

  describe("empty state", () => {
    it("returns null when no prizes", () => {
      const { container } = render(<PrizeStatusSummary prizes={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("does not render status summary card when prizes array is empty", () => {
      render(<PrizeStatusSummary prizes={[]} />);
      expect(screen.queryByTestId("prize-status-summary")).not.toBeInTheDocument();
    });
  });

  describe("initial pending state (AC1)", () => {
    it("shows 0 of X awarded when no prizes awarded", () => {
      const prizes = [
        createMockPrize({ id: "1" }),
        createMockPrize({ id: "2" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByText("0 of 2 awarded")).toBeInTheDocument();
    });

    it("shows remaining count for unawarded prizes", () => {
      const prizes = [
        createMockPrize({ id: "1" }),
        createMockPrize({ id: "2" }),
        createMockPrize({ id: "3" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByText("3 remaining")).toBeInTheDocument();
    });

    it("shows correct count with single prize", () => {
      const prizes = [createMockPrize({ id: "1" })];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByText("0 of 1 awarded")).toBeInTheDocument();
      expect(screen.getByText("1 remaining")).toBeInTheDocument();
    });
  });

  describe("partial progress", () => {
    it("shows X of Y awarded for partially awarded prizes", () => {
      const prizes = [
        createMockPrize({ id: "1", awarded_to: "user-1" }),
        createMockPrize({ id: "2" }),
        createMockPrize({ id: "3" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByText("1 of 3 awarded")).toBeInTheDocument();
    });

    it("shows remaining count correctly", () => {
      const prizes = [
        createMockPrize({ id: "1", awarded_to: "user-1" }),
        createMockPrize({ id: "2", awarded_to: "user-2" }),
        createMockPrize({ id: "3" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByText("1 remaining")).toBeInTheDocument();
    });

    it("does not show all awarded message when partially complete", () => {
      const prizes = [
        createMockPrize({ id: "1", awarded_to: "user-1" }),
        createMockPrize({ id: "2" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.queryByText("All prizes awarded")).not.toBeInTheDocument();
    });
  });

  describe("completion state (AC5)", () => {
    it("shows All prizes awarded when complete", () => {
      const prizes = [
        createMockPrize({ id: "1", awarded_to: "user-1" }),
        createMockPrize({ id: "2", awarded_to: "user-2" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByText("All prizes awarded")).toBeInTheDocument();
    });

    it("does not show remaining count when all awarded", () => {
      const prizes = [
        createMockPrize({ id: "1", awarded_to: "user-1" }),
        createMockPrize({ id: "2", awarded_to: "user-2" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.queryByTestId("remaining-count")).not.toBeInTheDocument();
    });

    it("does not show X of Y format when all awarded", () => {
      const prizes = [
        createMockPrize({ id: "1", awarded_to: "user-1" }),
        createMockPrize({ id: "2", awarded_to: "user-2" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.queryByTestId("awarded-count")).not.toBeInTheDocument();
    });

    it("shows all awarded for single prize when awarded", () => {
      const prizes = [
        createMockPrize({ id: "1", awarded_to: "user-1" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByText("All prizes awarded")).toBeInTheDocument();
    });
  });

  describe("progress bar", () => {
    it("renders progress bar with correct aria-label", () => {
      const prizes = [
        createMockPrize({ id: "1", awarded_to: "user-1" }),
        createMockPrize({ id: "2" }),
        createMockPrize({ id: "3" }),
        createMockPrize({ id: "4" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-label",
        "Prize progress: 1 of 4 awarded"
      );
    });

    it("renders progress bar even when all awarded", () => {
      const prizes = [
        createMockPrize({ id: "1", awarded_to: "user-1" }),
        createMockPrize({ id: "2", awarded_to: "user-2" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("renders progress bar at 0% when none awarded", () => {
      const prizes = [
        createMockPrize({ id: "1" }),
        createMockPrize({ id: "2" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has accessible trophy icon", () => {
      const prizes = [createMockPrize({ id: "1" })];
      render(<PrizeStatusSummary prizes={prizes} />);
      // Icons with aria-hidden should not be read by screen readers
      const trophyIcons = document.querySelectorAll('[aria-hidden="true"]');
      expect(trophyIcons.length).toBeGreaterThan(0);
    });

    it("has data-testid for integration testing", () => {
      const prizes = [createMockPrize({ id: "1" })];
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByTestId("prize-status-summary")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles large number of prizes", () => {
      const prizes = Array.from({ length: 100 }, (_, i) =>
        createMockPrize({
          id: `prize-${i}`,
          awarded_to: i < 75 ? `user-${i}` : null
        })
      );
      render(<PrizeStatusSummary prizes={prizes} />);
      expect(screen.getByText("75 of 100 awarded")).toBeInTheDocument();
      expect(screen.getByText("25 remaining")).toBeInTheDocument();
    });

    it("handles prizes with awarded_at but null awarded_to correctly", () => {
      // Edge case: awarded_at set but awarded_to is null (shouldn't happen but test robustness)
      const prizes = [
        createMockPrize({ id: "1", awarded_to: null, awarded_at: "2024-12-25T10:00:00Z" }),
        createMockPrize({ id: "2", awarded_to: "user-1", awarded_at: "2024-12-25T10:00:00Z" }),
      ];
      render(<PrizeStatusSummary prizes={prizes} />);
      // Only count prizes with awarded_to as awarded
      expect(screen.getByText("1 of 2 awarded")).toBeInTheDocument();
    });
  });
});
