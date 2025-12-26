/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the server action before importing the component
const mockRaffles = [
  {
    id: "raffle-1",
    name: "December Meetup",
    status: "draft",
    qr_code_expires_at: null,
    created_at: "2024-12-25T10:00:00Z",
    created_by: "admin-1",
    winner_count: 0,
  },
  {
    id: "raffle-2",
    name: "November Meetup",
    status: "completed",
    qr_code_expires_at: null,
    created_at: "2024-11-28T10:00:00Z",
    created_by: "admin-1",
    winner_count: 3,
  },
];

jest.mock("@/lib/actions/raffles", () => ({
  __esModule: true,
  getRafflesWithWinnerCount: jest.fn().mockResolvedValue({
    data: [],
    error: null,
  }),
}));

// Need to import after mocking
import AdminDashboard from "./page";
import { getRafflesWithWinnerCount } from "@/lib/actions/raffles";

describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("with empty raffle list", () => {
    beforeEach(() => {
      (getRafflesWithWinnerCount as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
    });

    it("renders the admin dashboard heading", async () => {
      const Page = await AdminDashboard();
      render(Page);

      expect(
        screen.getByRole("heading", { name: /admin dashboard/i })
      ).toBeInTheDocument();
    });

    it("renders the dashboard description", async () => {
      const Page = await AdminDashboard();
      render(Page);

      expect(
        screen.getByText(/manage raffles and view event history/i)
      ).toBeInTheDocument();
    });

    it("renders Create New Raffle button", async () => {
      const Page = await AdminDashboard();
      render(Page);

      const createButton = screen.getByRole("link", {
        name: /create new raffle/i,
      });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute("href", "/admin/raffles/new");
    });

    it("renders empty state when no raffles", async () => {
      const Page = await AdminDashboard();
      render(Page);

      expect(
        screen.getByText(/no raffles yet\. create your first raffle/i)
      ).toBeInTheDocument();
    });

    it("renders quick stats section with zeros", async () => {
      const Page = await AdminDashboard();
      render(Page);

      expect(
        screen.getByRole("heading", { name: /quick stats/i })
      ).toBeInTheDocument();
      expect(screen.getByText("Total Raffles")).toBeInTheDocument();
      expect(screen.getByText("Active Raffles")).toBeInTheDocument();
      expect(screen.getByText("Completed Raffles")).toBeInTheDocument();
    });
  });

  describe("with raffles", () => {
    beforeEach(() => {
      (getRafflesWithWinnerCount as jest.Mock).mockResolvedValue({
        data: mockRaffles,
        error: null,
      });
    });

    it("renders list of raffles", async () => {
      const Page = await AdminDashboard();
      render(Page);

      expect(screen.getByText("December Meetup")).toBeInTheDocument();
      expect(screen.getByText("November Meetup")).toBeInTheDocument();
    });

    it("displays status badges", async () => {
      const Page = await AdminDashboard();
      render(Page);

      expect(screen.getByText("draft")).toBeInTheDocument();
      expect(screen.getByText("completed")).toBeInTheDocument();
    });

    it("raffle items link to detail pages", async () => {
      const Page = await AdminDashboard();
      render(Page);

      const links = screen.getAllByRole("link");
      const raffleLinks = links.filter(
        (link) =>
          link.getAttribute("href")?.startsWith("/admin/raffles/raffle-")
      );
      expect(raffleLinks.length).toBe(2);
    });

    it("displays correct stats", async () => {
      const Page = await AdminDashboard();
      render(Page);

      // Total: 2, Active: 0, Completed: 1
      // Find stats by their text content
      expect(screen.getByText("2")).toBeInTheDocument(); // Total
      expect(screen.getByText("1")).toBeInTheDocument(); // Completed
    });

    it("displays winner count badge for completed raffles (Story 6.7)", async () => {
      const Page = await AdminDashboard();
      render(Page);

      // Winner count badge should be visible for completed raffle with 3 winners
      expect(screen.getByTestId("winner-count-badge")).toBeInTheDocument();
      expect(screen.getByText("3 Winners")).toBeInTheDocument();
    });
  });

  describe("with error", () => {
    beforeEach(() => {
      (getRafflesWithWinnerCount as jest.Mock).mockResolvedValue({
        data: null,
        error: "Failed to fetch raffles",
      });
    });

    it("displays error message", async () => {
      const Page = await AdminDashboard();
      render(Page);

      expect(screen.getByText("Failed to fetch raffles")).toBeInTheDocument();
    });
  });
});

describe("AdminDashboard Accessibility", () => {
  beforeEach(() => {
    (getRafflesWithWinnerCount as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
  });

  it("has proper heading hierarchy", async () => {
    const Page = await AdminDashboard();
    render(Page);

    // h1 for main title
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Admin Dashboard");

    // h2 for sections
    const h2List = screen.getAllByRole("heading", { level: 2 });
    expect(h2List.length).toBeGreaterThanOrEqual(2); // Raffles, Quick Stats
  });
});
