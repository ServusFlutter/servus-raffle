import { render, screen, fireEvent } from "@testing-library/react";
import { RaffleHistoryList } from "./raffleHistoryList";
import type { RaffleHistoryItem } from "@/lib/schemas/history";

describe("RaffleHistoryList", () => {
  const mockOnRaffleClick = jest.fn();

  const mockRaffles: RaffleHistoryItem[] = [
    {
      id: "raffle-1",
      name: "December Raffle",
      status: "completed",
      created_at: "2025-12-26T10:00:00Z",
      participant_count: 25,
      prizes_awarded: 3,
      total_prizes: 3,
    },
    {
      id: "raffle-2",
      name: "November Raffle",
      status: "active",
      created_at: "2025-11-26T10:00:00Z",
      participant_count: 10,
      prizes_awarded: 0,
      total_prizes: 5,
    },
    {
      id: "raffle-3",
      name: "October Raffle",
      status: "draft",
      created_at: "2025-10-26T10:00:00Z",
      participant_count: 0,
      prizes_awarded: 0,
      total_prizes: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("empty state", () => {
    it("displays empty state message when no raffles", () => {
      render(
        <RaffleHistoryList raffles={[]} onRaffleClick={mockOnRaffleClick} />
      );

      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(
        screen.getByText(/No raffle history yet/i)
      ).toBeInTheDocument();
    });
  });

  describe("raffle list display", () => {
    it("renders all raffles", () => {
      render(
        <RaffleHistoryList
          raffles={mockRaffles}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      expect(screen.getByText("December Raffle")).toBeInTheDocument();
      expect(screen.getByText("November Raffle")).toBeInTheDocument();
      expect(screen.getByText("October Raffle")).toBeInTheDocument();
    });

    it("displays participant counts", () => {
      render(
        <RaffleHistoryList
          raffles={mockRaffles}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      expect(screen.getByText("25 participants")).toBeInTheDocument();
      expect(screen.getByText("10 participants")).toBeInTheDocument();
      expect(screen.getByText("0 participants")).toBeInTheDocument();
    });

    it("displays prize counts", () => {
      render(
        <RaffleHistoryList
          raffles={mockRaffles}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      expect(screen.getByText("3 of 3 prizes awarded")).toBeInTheDocument();
      expect(screen.getByText("0 of 5 prizes awarded")).toBeInTheDocument();
      expect(screen.getByText("0 of 0 prizes awarded")).toBeInTheDocument();
    });

    it("displays correct singular form for 1 participant", () => {
      const singleParticipantRaffle: RaffleHistoryItem[] = [
        {
          id: "raffle-1",
          name: "Test Raffle",
          status: "active",
          created_at: "2025-12-26T10:00:00Z",
          participant_count: 1,
          prizes_awarded: 0,
          total_prizes: 1,
        },
      ];

      render(
        <RaffleHistoryList
          raffles={singleParticipantRaffle}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      expect(screen.getByText("1 participant")).toBeInTheDocument();
      expect(screen.getByText("0 of 1 prize awarded")).toBeInTheDocument();
    });
  });

  describe("status badges", () => {
    it("displays Completed badge for completed raffles", () => {
      render(
        <RaffleHistoryList
          raffles={mockRaffles}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("displays Active badge for active raffles", () => {
      render(
        <RaffleHistoryList
          raffles={mockRaffles}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("displays Draft badge for draft raffles", () => {
      render(
        <RaffleHistoryList
          raffles={mockRaffles}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      expect(screen.getByText("Draft")).toBeInTheDocument();
    });
  });

  describe("click handling", () => {
    it("calls onRaffleClick with raffle ID when card is clicked", () => {
      render(
        <RaffleHistoryList
          raffles={mockRaffles}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      fireEvent.click(screen.getByTestId("raffle-card-raffle-1"));

      expect(mockOnRaffleClick).toHaveBeenCalledWith("raffle-1");
    });

    it("calls onRaffleClick for each raffle", () => {
      render(
        <RaffleHistoryList
          raffles={mockRaffles}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      fireEvent.click(screen.getByTestId("raffle-card-raffle-2"));
      expect(mockOnRaffleClick).toHaveBeenCalledWith("raffle-2");

      fireEvent.click(screen.getByTestId("raffle-card-raffle-3"));
      expect(mockOnRaffleClick).toHaveBeenCalledWith("raffle-3");
    });
  });

  describe("accessibility", () => {
    it("has proper test IDs for testing", () => {
      render(
        <RaffleHistoryList
          raffles={mockRaffles}
          onRaffleClick={mockOnRaffleClick}
        />
      );

      expect(screen.getByTestId("raffle-history-list")).toBeInTheDocument();
      expect(screen.getByTestId("raffle-card-raffle-1")).toBeInTheDocument();
    });
  });
});
