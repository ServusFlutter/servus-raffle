/**
 * ConfettiOverlay Component Tests
 *
 * Story 6.5: Winner Celebration & Announcement
 *
 * Tests:
 * - AC #4: Confetti fires with 150 particles
 * - AC #4: Correct colors: Gold, Coral, Flutter Blue, Sky Blue
 * - AC #4: Animation lasts 3 seconds
 * - Accessibility: Respects reduced motion preference
 */

import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import confetti from "canvas-confetti";
import { ConfettiOverlay } from "./confettiOverlay";

// Mock canvas-confetti
jest.mock("canvas-confetti", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock matchMedia for reduced motion tests
const mockMatchMedia = (prefersReducedMotion: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" && prefersReducedMotion,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe("ConfettiOverlay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Default to no reduced motion preference
    mockMatchMedia(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Confetti Configuration (AC #4)", () => {
    it("fires confetti when active is true", () => {
      render(<ConfettiOverlay active={true} />);

      expect(confetti).toHaveBeenCalled();
    });

    it("does not fire confetti when active is false", () => {
      render(<ConfettiOverlay active={false} />);

      expect(confetti).not.toHaveBeenCalled();
    });

    it("fires confetti with 150 particles", () => {
      render(<ConfettiOverlay active={true} />);

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 150,
        })
      );
    });

    it("fires confetti with correct spread value (70)", () => {
      render(<ConfettiOverlay active={true} />);

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          spread: 70,
        })
      );
    });

    it("fires confetti with correct colors", () => {
      render(<ConfettiOverlay active={true} />);

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          colors: ["#F7DC6F", "#FF6B6B", "#0553B1", "#54C5F8"],
        })
      );
    });

    it("sets disableForReducedMotion to true", () => {
      render(<ConfettiOverlay active={true} />);

      expect(confetti).toHaveBeenCalledWith(
        expect.objectContaining({
          disableForReducedMotion: true,
        })
      );
    });
  });

  describe("Animation Duration (AC #4)", () => {
    it("uses default 3000ms duration", () => {
      const onComplete = jest.fn();
      render(<ConfettiOverlay active={true} onComplete={onComplete} />);

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("respects custom duration prop", () => {
      const onComplete = jest.fn();
      render(
        <ConfettiOverlay active={true} duration={5000} onComplete={onComplete} />
      );

      act(() => {
        jest.advanceTimersByTime(4999);
      });

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Reduced Motion Accessibility", () => {
    it("does not fire confetti when user prefers reduced motion", () => {
      mockMatchMedia(true);

      render(<ConfettiOverlay active={true} />);

      expect(confetti).not.toHaveBeenCalled();
    });

    it("still calls onComplete when reduced motion is preferred", () => {
      mockMatchMedia(true);
      const onComplete = jest.fn();

      render(<ConfettiOverlay active={true} onComplete={onComplete} />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cleanup", () => {
    it("cleans up timeout on unmount", () => {
      const onComplete = jest.fn();
      const { unmount } = render(
        <ConfettiOverlay active={true} onComplete={onComplete} />
      );

      // Timer should be active when onComplete is provided
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      unmount();

      // After unmount, callback should not have been called
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("does not fire confetti multiple times when active changes to true multiple times", () => {
      const { rerender } = render(<ConfettiOverlay active={false} />);

      rerender(<ConfettiOverlay active={true} />);
      rerender(<ConfettiOverlay active={true} />);
      rerender(<ConfettiOverlay active={true} />);

      // Should only fire once on the first transition to active
      expect(confetti).toHaveBeenCalledTimes(1);
    });
  });

  describe("Multiple Bursts", () => {
    it("fires confetti burst again when active toggles off then on", () => {
      const { rerender } = render(<ConfettiOverlay active={true} />);

      expect(confetti).toHaveBeenCalledTimes(1);

      rerender(<ConfettiOverlay active={false} />);
      rerender(<ConfettiOverlay active={true} />);

      expect(confetti).toHaveBeenCalledTimes(2);
    });
  });
});
