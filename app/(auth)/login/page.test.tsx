/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "./page";

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn(() => "mock-uuid-1234"),
  },
});

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
});

describe("LoginPage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_MEETUP_CLIENT_ID: "test-client-id",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should render login page with Meetup button", () => {
    render(<LoginPage />);

    expect(screen.getByText("Welcome to Servus Raffle")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign in with your Meetup.com account to participate in the raffle"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Sign in with Meetup")).toBeInTheDocument();
  });

  it("should show error when MEETUP_CLIENT_ID is not configured", async () => {
    delete process.env.NEXT_PUBLIC_MEETUP_CLIENT_ID;

    render(<LoginPage />);

    const button = screen.getByRole("button", { name: /sign in with meetup/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/Meetup OAuth is not configured/)
      ).toBeInTheDocument();
    });
  });

  it("should set CSRF state in sessionStorage when initiating OAuth", async () => {
    render(<LoginPage />);

    const button = screen.getByRole("button", { name: /sign in with meetup/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSessionStorage.getItem("oauth_state")).toBe("mock-uuid-1234");
    });
  });

  it("should disable button and show loading state during sign in", async () => {
    render(<LoginPage />);

    const button = screen.getByRole("button", { name: /sign in with meetup/i });
    fireEvent.click(button);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText("Connecting...")).toBeInTheDocument();
    });
  });

  it("should handle errors gracefully", async () => {
    // Override crypto to throw error
    (global.crypto.randomUUID as jest.Mock).mockImplementation(() => {
      throw new Error("Test error");
    });

    render(<LoginPage />);

    const button = screen.getByRole("button", { name: /sign in with meetup/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Test error")).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it("should render privacy notice", () => {
    render(<LoginPage />);

    expect(
      screen.getByText(/By signing in, you agree to participate/i)
    ).toBeInTheDocument();
  });
});
