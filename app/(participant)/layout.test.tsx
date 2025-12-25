import { render, screen } from "@testing-library/react";
import ParticipantLayout from "./layout";

// Mock the getCurrentUser function
jest.mock("@/lib/actions/auth", () => ({
  getCurrentUser: jest.fn(),
}));

// Mock Next.js redirect
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { getCurrentUser } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe("ParticipantLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: null,
      error: "Not authenticated",
    });

    // Need to handle the redirect throw
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(async () => {
      await ParticipantLayout({ children: <div>Test Content</div> });
    }).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders layout with user profile when authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: {
        id: "user-1",
        meetup_id: "12345",
        name: "John Doe",
        avatar_url: "https://example.com/avatar.jpg",
        created_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await ParticipantLayout({
      children: <div>Test Content</div>,
    });

    // Render the result
    render(result as React.ReactElement);

    // Check that user name is displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    // Check that children are rendered
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("redirects when getCurrentUser returns error", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: null,
      error: "Database error",
    });

    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(async () => {
      await ParticipantLayout({ children: <div>Test Content</div> });
    }).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("has proper layout structure with header and main", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: {
        id: "user-1",
        meetup_id: "12345",
        name: "Jane Smith",
        avatar_url: null,
        created_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await ParticipantLayout({
      children: <div>Dashboard Content</div>,
    });

    const { container } = render(result as React.ReactElement);

    // Check for header
    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();

    // Check for main
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  it("does not include logout button (Story 1.4 scope)", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: {
        id: "user-1",
        meetup_id: "12345",
        name: "Jane Smith",
        avatar_url: null,
        created_at: "2025-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await ParticipantLayout({
      children: <div>Dashboard Content</div>,
    });

    const { container } = render(result as React.ReactElement);

    // Should NOT have logout button (that's Story 1.4)
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });
});
