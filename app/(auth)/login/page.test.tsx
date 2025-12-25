/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "./page";

// Mock useRouter
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock signIn action
const mockSignIn = jest.fn();
jest.mock("@/lib/actions/auth", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render login page with email/password form", () => {
    render(<LoginPage />);

    expect(screen.getByText("Welcome to Servus Raffle")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign in with your email and password to participate in the raffle"
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("should show error when email is empty", async () => {
    render(<LoginPage />);

    const button = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should show error when password is empty", async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const button = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should show error for invalid email format", async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should call signIn and redirect on successful login", async () => {
    mockSignIn.mockResolvedValue({ data: { id: "user-123" }, error: null });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/participant");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("should show error message from signIn action", async () => {
    mockSignIn.mockResolvedValue({
      data: null,
      error: "Invalid email or password",
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    const button = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should show loading state during sign in", async () => {
    mockSignIn.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
    });
  });

  it("should have link to sign up page", () => {
    render(<LoginPage />);

    const signUpLink = screen.getByRole("link", { name: "Sign Up" });
    expect(signUpLink).toHaveAttribute("href", "/signup");
  });

  it("should render privacy notice", () => {
    render(<LoginPage />);

    expect(
      screen.getByText(/By signing in, you agree to participate/i)
    ).toBeInTheDocument();
  });

  it("should handle unexpected errors gracefully", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred. Please try again.")
      ).toBeInTheDocument();
    });
  });
});
