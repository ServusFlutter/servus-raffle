/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SignUpPage from "./page";
import { Suspense } from "react";

// Mock useRouter and useSearchParams
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock signUp action
const mockSignUp = jest.fn();
jest.mock("@/lib/actions/auth", () => ({
  signUp: (...args: unknown[]) => mockSignUp(...args),
}));

// Helper to render with Suspense
function renderWithSuspense(ui: React.ReactElement) {
  return render(<Suspense fallback={<div>Loading...</div>}>{ui}</Suspense>);
}

describe("SignUpPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.delete("redirectTo");
  });

  it("should render signup page with registration form", () => {
    renderWithSuspense(<SignUpPage />);

    expect(screen.getByText("Create an Account")).toBeInTheDocument();
    expect(
      screen.getByText("Sign up to participate in the Servus Raffle")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("should show error when name is empty", async () => {
    renderWithSuspense(<SignUpPage />);

    const button = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should show error when email is empty", async () => {
    renderWithSuspense(<SignUpPage />);

    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "Test User" } });

    const button = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should show error for invalid email format", async () => {
    renderWithSuspense(<SignUpPage />);

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should show error when password is too short", async () => {
    renderWithSuspense(<SignUpPage />);

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "short" } });

    const button = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters long")
      ).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("should call signUp and redirect on successful registration", async () => {
    mockSignUp.mockResolvedValue({ data: { id: "user-123" }, error: null });

    renderWithSuspense(<SignUpPage />);

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
        "Test User"
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/participant");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("should show error message from signUp action", async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: "An account with this email already exists",
    });

    renderWithSuspense(<SignUpPage />);

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "existing@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("An account with this email already exists")
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should show loading state during sign up", async () => {
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderWithSuspense(<SignUpPage />);

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Creating account...")).toBeInTheDocument();
    });
  });

  it("should have link to login page", () => {
    renderWithSuspense(<SignUpPage />);

    const signInLink = screen.getByRole("link", { name: "Sign In" });
    expect(signInLink).toHaveAttribute("href", "/login");
  });

  it("should render password requirements hint", () => {
    renderWithSuspense(<SignUpPage />);

    expect(
      screen.getByText("Must be at least 8 characters")
    ).toBeInTheDocument();
  });

  it("should render privacy notice", () => {
    renderWithSuspense(<SignUpPage />);

    expect(
      screen.getByText(/By signing up, you agree to participate/i)
    ).toBeInTheDocument();
  });

  it("should handle unexpected errors gracefully", async () => {
    mockSignUp.mockRejectedValue(new Error("Network error"));

    renderWithSuspense(<SignUpPage />);

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const button = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred. Please try again.")
      ).toBeInTheDocument();
    });
  });

  describe("redirectTo parameter handling", () => {
    it("should redirect to specified URL after signup", async () => {
      mockSearchParams.set("redirectTo", "/join/123");
      mockSignUp.mockResolvedValue({ data: { id: "user-123" }, error: null });

      renderWithSuspense(<SignUpPage />);

      const nameInput = screen.getByLabelText("Name");
      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      const button = screen.getByRole("button", { name: "Sign Up" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/join/123");
      });
    });

    it("should pass redirectTo to login link", () => {
      mockSearchParams.set("redirectTo", "/join/456");

      renderWithSuspense(<SignUpPage />);

      const signInLink = screen.getByRole("link", { name: "Sign In" });
      expect(signInLink).toHaveAttribute(
        "href",
        "/login?redirectTo=%2Fjoin%2F456"
      );
    });
  });
});
