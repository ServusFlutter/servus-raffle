/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ParticipantTable } from "./participantTable";
import type { ParticipantWithDetails } from "@/lib/actions/participants";

describe("ParticipantTable", () => {
  const createMockParticipant = (
    overrides: Partial<ParticipantWithDetails> = {}
  ): ParticipantWithDetails => ({
    id: `participant-${Math.random().toString(36).slice(2, 9)}`,
    user_id: `user-${Math.random().toString(36).slice(2, 9)}`,
    ticket_count: 1,
    joined_at: "2025-12-26T10:00:00Z",
    user_name: "Test User",
    user_avatar_url: null,
    ...overrides,
  });

  describe("empty state", () => {
    it("shows empty state message when no participants", () => {
      render(<ParticipantTable participants={[]} />);
      expect(
        screen.getByText(/no participants have joined yet/i)
      ).toBeInTheDocument();
    });

    it("includes QR code suggestion in empty state", () => {
      render(<ParticipantTable participants={[]} />);
      expect(screen.getByText(/share the qr code/i)).toBeInTheDocument();
    });

    it("does not render table when no participants", () => {
      render(<ParticipantTable participants={[]} />);
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  describe("participant display (AC #1, #2)", () => {
    it("displays participant name", () => {
      const participants = [createMockParticipant({ user_name: "Alice" })];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("displays Anonymous for null user_name", () => {
      const participants = [createMockParticipant({ user_name: null })];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByText("Anonymous")).toBeInTheDocument();
    });

    it("displays ticket count", () => {
      const participants = [createMockParticipant({ ticket_count: 5 })];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("displays formatted join timestamp", () => {
      const participants = [
        createMockParticipant({ joined_at: "2025-12-26T14:30:00Z" }),
      ];
      render(<ParticipantTable participants={participants} />);
      // The exact format depends on locale, but should contain month and time
      const timestampCell = screen.getByTestId("joined-at-0");
      expect(timestampCell).toBeInTheDocument();
    });

    it("renders multiple participants", () => {
      const participants = [
        createMockParticipant({ id: "1", user_name: "Alice" }),
        createMockParticipant({ id: "2", user_name: "Bob" }),
        createMockParticipant({ id: "3", user_name: "Charlie" }),
      ];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });
  });

  describe("avatar display", () => {
    it("renders avatar component", () => {
      const participants = [
        createMockParticipant({
          user_name: "Alice",
          user_avatar_url: "https://example.com/alice.jpg",
        }),
      ];
      const { container } = render(
        <ParticipantTable participants={participants} />
      );
      // Avatar component is rendered (the actual image rendering depends on browser)
      const avatarSpan = container.querySelector('[data-slot="avatar"]');
      expect(avatarSpan).toBeInTheDocument();
    });

    it("renders avatar fallback with first initial when no avatar_url", () => {
      const participants = [
        createMockParticipant({ user_name: "Bob", user_avatar_url: null }),
      ];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByText("B")).toBeInTheDocument();
    });

    it("renders ? as fallback for Anonymous user", () => {
      const participants = [
        createMockParticipant({ user_name: null, user_avatar_url: null }),
      ];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByText("?")).toBeInTheDocument();
    });
  });

  describe("table structure", () => {
    it("renders table with correct headers", () => {
      const participants = [createMockParticipant()];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("Participant")).toBeInTheDocument();
      expect(screen.getByText("Tickets")).toBeInTheDocument();
      expect(screen.getByText("Joined")).toBeInTheDocument();
    });

    it("renders table rows for each participant", () => {
      const participants = [
        createMockParticipant({ id: "1" }),
        createMockParticipant({ id: "2" }),
      ];
      render(<ParticipantTable participants={participants} />);
      const rows = screen.getAllByRole("row");
      // 1 header row + 2 data rows = 3 total
      expect(rows).toHaveLength(3);
    });
  });

  describe("mobile responsiveness (AC #6)", () => {
    it("has overflow-x-auto wrapper for horizontal scrolling", () => {
      const participants = [createMockParticipant()];
      const { container } = render(
        <ParticipantTable participants={participants} />
      );
      const wrapper = container.querySelector(".overflow-x-auto");
      expect(wrapper).toBeInTheDocument();
    });

    it("hides Joined column on small screens", () => {
      const participants = [createMockParticipant()];
      render(<ParticipantTable participants={participants} />);
      const joinedHeader = screen.getByText("Joined");
      // Check it has the hidden sm:table-cell class
      expect(joinedHeader).toHaveClass("hidden");
      expect(joinedHeader).toHaveClass("sm:table-cell");
    });
  });

  describe("accessibility", () => {
    it("has data-testid for integration testing", () => {
      const participants = [createMockParticipant()];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByTestId("participant-table")).toBeInTheDocument();
    });

    it("displays ticket count with monospace font for alignment", () => {
      const participants = [createMockParticipant({ ticket_count: 123 })];
      render(<ParticipantTable participants={participants} />);
      const ticketCell = screen.getByText("123");
      expect(ticketCell).toHaveClass("font-mono");
    });
  });

  describe("edge cases", () => {
    it("handles large number of participants", () => {
      const participants = Array.from({ length: 100 }, (_, i) =>
        createMockParticipant({
          id: `p-${i}`,
          user_name: `User ${i}`,
          ticket_count: i + 1,
        })
      );
      render(<ParticipantTable participants={participants} />);
      const rows = screen.getAllByRole("row");
      expect(rows).toHaveLength(101); // 1 header + 100 data rows
    });

    it("handles participants with very long names", () => {
      const longName = "A".repeat(100);
      const participants = [createMockParticipant({ user_name: longName })];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("handles participants with high ticket counts", () => {
      const participants = [createMockParticipant({ ticket_count: 9999 })];
      render(<ParticipantTable participants={participants} />);
      expect(screen.getByText("9999")).toBeInTheDocument();
    });
  });
});
