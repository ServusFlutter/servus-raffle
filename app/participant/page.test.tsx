import { render, screen } from "@testing-library/react";
import ParticipantDashboard from "./page";

describe("ParticipantDashboard", () => {
  it("renders welcome message", async () => {
    const result = await ParticipantDashboard();
    render(result as React.ReactElement);

    // Should have a heading
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it("renders placeholder for ticket display", async () => {
    const result = await ParticipantDashboard();
    render(result as React.ReactElement);

    // Should indicate tickets will be shown here
    expect(
      screen.getByText(/tickets will be displayed here/i)
    ).toBeInTheDocument();
  });

  it("has proper page structure", async () => {
    const result = await ParticipantDashboard();
    const { container } = render(result as React.ReactElement);

    // Should have a container div
    expect(container.querySelector("div")).toBeInTheDocument();
  });
});
