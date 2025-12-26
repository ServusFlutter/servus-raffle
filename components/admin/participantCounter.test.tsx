/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ParticipantCounter } from "./participantCounter";

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    p: ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className={className} {...props}>
        {children}
      </p>
    ),
  },
}));

describe("ParticipantCounter", () => {
  describe("participant count display (AC #3)", () => {
    it("displays participant count", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={12} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("displays Participants label", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={12} />);
      expect(screen.getByText("Participants")).toBeInTheDocument();
    });

    it("displays zero participant count", () => {
      render(<ParticipantCounter participantCount={0} totalTickets={1} />);
      // Participant count should be 0, ticket count is 1
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("displays large participant count", () => {
      render(<ParticipantCounter participantCount={1000} totalTickets={5000} />);
      expect(screen.getByText("1000")).toBeInTheDocument();
    });
  });

  describe("ticket count display (AC #3)", () => {
    it("displays total tickets", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={12} />);
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("displays Total Tickets label", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={12} />);
      expect(screen.getByText("Total Tickets")).toBeInTheDocument();
    });

    it("displays zero tickets", () => {
      render(<ParticipantCounter participantCount={0} totalTickets={0} />);
      // There will be two 0s (one for participants, one for tickets)
      const zeros = screen.getAllByText("0");
      expect(zeros).toHaveLength(2);
    });

    it("displays large ticket count", () => {
      render(<ParticipantCounter participantCount={100} totalTickets={9999} />);
      expect(screen.getByText("9999")).toBeInTheDocument();
    });
  });

  describe("projection styling (AC #4)", () => {
    it("renders with large text for projection visibility", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={12} />);
      const participantNumber = screen.getByText("5");
      const ticketNumber = screen.getByText("12");
      // Both should have large text classes
      expect(participantNumber).toHaveClass("text-4xl");
      expect(ticketNumber).toHaveClass("text-4xl");
    });

    it("renders with bold font weight", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={12} />);
      const participantNumber = screen.getByText("5");
      expect(participantNumber).toHaveClass("font-bold");
    });
  });

  describe("layout", () => {
    it("renders two cards in a grid layout", () => {
      const { container } = render(
        <ParticipantCounter participantCount={5} totalTickets={12} />
      );
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("md:grid-cols-2");
    });

    it("has data-testid for integration testing", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={12} />);
      expect(screen.getByTestId("participant-counter")).toBeInTheDocument();
    });

    it("renders participants card", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={12} />);
      expect(screen.getByTestId("participants-card")).toBeInTheDocument();
    });

    it("renders tickets card", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={12} />);
      expect(screen.getByTestId("tickets-card")).toBeInTheDocument();
    });
  });

  describe("icons", () => {
    it("renders Users icon", () => {
      const { container } = render(
        <ParticipantCounter participantCount={5} totalTickets={12} />
      );
      // Lucide icons render as SVGs
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("edge cases", () => {
    it("handles very large numbers", () => {
      render(
        <ParticipantCounter participantCount={999999} totalTickets={9999999} />
      );
      expect(screen.getByText("999999")).toBeInTheDocument();
      expect(screen.getByText("9999999")).toBeInTheDocument();
    });

    it("renders correctly with matching participant and ticket counts", () => {
      render(<ParticipantCounter participantCount={5} totalTickets={5} />);
      const fives = screen.getAllByText("5");
      expect(fives).toHaveLength(2);
    });
  });
});
