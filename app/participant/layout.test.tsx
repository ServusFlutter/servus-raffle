/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the getCurrentUser function
jest.mock("@/lib/actions/auth", () => ({
  getCurrentUser: jest.fn(),
}));

// Mock Next.js redirect
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { getCurrentUser } from "@/lib/actions/auth";

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;

// Import after mocks
import ParticipantLayout from "./layout";

describe("ParticipantLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders layout structure with header and main", () => {
    const { container } = render(
      <ParticipantLayout>
        <div>Test Content</div>
      </ParticipantLayout>
    );

    // Check for header
    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();

    // Check for main
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();

    // Check that children are rendered
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders loading skeleton while user data is loading", () => {
    // getCurrentUser is async, so initially shows skeleton
    mockGetCurrentUser.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { container } = render(
      <ParticipantLayout>
        <div>Test Content</div>
      </ParticipantLayout>
    );

    // Should show skeleton loading state
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("does not include logout button (Story 1.4 scope)", () => {
    render(
      <ParticipantLayout>
        <div>Dashboard Content</div>
      </ParticipantLayout>
    );

    // Should NOT have logout button (that's Story 1.4)
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });
});
