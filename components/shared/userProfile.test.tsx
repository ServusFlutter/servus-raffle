import { render, screen } from "@testing-library/react";
import { UserProfile } from "./userProfile";

describe("UserProfile", () => {
  it("renders user name correctly", () => {
    render(<UserProfile name="John Doe" avatarUrl="https://example.com/avatar.jpg" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders avatar component when avatarUrl is provided", () => {
    const { container } = render(<UserProfile name="John Doe" avatarUrl="https://example.com/avatar.jpg" />);
    // Avatar component should be rendered
    const avatar = container.querySelector('[data-slot="avatar"]');
    expect(avatar).toBeInTheDocument();
  });

  it("displays fallback initials when avatarUrl is null", () => {
    render(<UserProfile name="John Doe" avatarUrl={null} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("displays fallback initials when avatarUrl is empty string", () => {
    render(<UserProfile name="Jane Smith" avatarUrl="" />);
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("handles single name correctly for initials", () => {
    render(<UserProfile name="Madonna" avatarUrl={null} />);
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("handles three-part names (shows first two initials)", () => {
    render(<UserProfile name="John Paul Jones" avatarUrl={null} />);
    expect(screen.getByText("JP")).toBeInTheDocument();
  });

  it("truncates long names", () => {
    const longName = "John Doe With A Very Long Name That Should Be Truncated";
    render(<UserProfile name={longName} avatarUrl={null} />);
    const nameElement = screen.getByText(longName);
    expect(nameElement).toHaveClass("truncate");
  });

  it("applies mobile-first sizing to avatar (48px)", () => {
    const { container } = render(<UserProfile name="John Doe" avatarUrl={null} />);
    // Avatar should have h-12 w-12 classes (48px)
    const avatarContainer = container.querySelector('[class*="h-12"]');
    expect(avatarContainer).toBeInTheDocument();
  });

  // Edge case tests
  it("handles empty name gracefully", () => {
    render(<UserProfile name="" avatarUrl={null} />);
    // Should show "?" fallback instead of crashing
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("handles whitespace-only name", () => {
    render(<UserProfile name="   " avatarUrl={null} />);
    // Should show "?" fallback for whitespace
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("handles name with special characters", () => {
    render(<UserProfile name="José García" avatarUrl={null} />);
    // Should extract first letters
    expect(screen.getByText("JG")).toBeInTheDocument();
  });

  it("handles lowercase names correctly", () => {
    render(<UserProfile name="john doe" avatarUrl={null} />);
    // Should uppercase initials
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("handles multiple spaces between words", () => {
    render(<UserProfile name="John    Doe" avatarUrl={null} />);
    // Should handle multiple spaces and extract initials
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  // Accessibility tests
  it("has proper ARIA labels for accessibility", () => {
    const { container } = render(<UserProfile name="John Doe" avatarUrl={null} />);

    // Should have role="group" and aria-label
    const profileGroup = container.querySelector('[role="group"]');
    expect(profileGroup).toBeInTheDocument();
    expect(profileGroup).toHaveAttribute("aria-label", "User profile");
  });
});
