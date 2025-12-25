/**
 * @jest-environment node
 */
import {
  formatDate,
  getStatusVariant,
  getStatusDescription,
} from "./raffle";

describe("formatDate", () => {
  const testDate = "2024-12-25T10:30:00Z";

  describe("short format (default)", () => {
    it("formats date in short format by default", () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/Dec\s+25,\s+2024/);
    });

    it("explicitly uses short format when specified", () => {
      const result = formatDate(testDate, "short");
      expect(result).toMatch(/Dec\s+25,\s+2024/);
    });
  });

  describe("long format", () => {
    it("formats date with time in long format", () => {
      const result = formatDate(testDate, "long");
      // Long format includes month name and time
      expect(result).toMatch(/December/);
      expect(result).toMatch(/25/);
      expect(result).toMatch(/2024/);
    });
  });
});

describe("getStatusVariant", () => {
  it("returns 'default' for active status", () => {
    expect(getStatusVariant("active")).toBe("default");
  });

  it("returns 'destructive' for drawing status", () => {
    expect(getStatusVariant("drawing")).toBe("destructive");
  });

  it("returns 'secondary' for completed status", () => {
    expect(getStatusVariant("completed")).toBe("secondary");
  });

  it("returns 'outline' for draft status", () => {
    expect(getStatusVariant("draft")).toBe("outline");
  });
});

describe("getStatusDescription", () => {
  it("returns setup description for draft", () => {
    expect(getStatusDescription("draft")).toContain("being set up");
  });

  it("returns join description for active", () => {
    expect(getStatusDescription("active")).toContain("join");
  });

  it("returns drawing description for drawing", () => {
    expect(getStatusDescription("drawing")).toContain("Drawing");
  });

  it("returns completion description for completed", () => {
    expect(getStatusDescription("completed")).toContain("drawn");
  });
});
