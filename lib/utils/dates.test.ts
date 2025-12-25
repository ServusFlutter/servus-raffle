import {
  isExpired,
  getTimeRemaining,
  formatCountdown,
  formatExpirationTime,
  DURATION_OPTIONS,
  DEFAULT_DURATION_MINUTES,
} from "./dates";

describe("Date Utilities", () => {
  describe("isExpired", () => {
    it("returns true for null expiration", () => {
      expect(isExpired(null)).toBe(true);
    });

    it("returns true for past timestamp", () => {
      const pastDate = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
      expect(isExpired(pastDate)).toBe(true);
    });

    it("returns false for future timestamp", () => {
      const futureDate = new Date(Date.now() + 60000).toISOString(); // 1 minute from now
      expect(isExpired(futureDate)).toBe(false);
    });

    it("returns true for current timestamp (edge case)", () => {
      const now = new Date().toISOString();
      expect(isExpired(now)).toBe(true);
    });
  });

  describe("getTimeRemaining", () => {
    it("returns zero values for expired timestamp", () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      const result = getTimeRemaining(pastDate);

      expect(result).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
      });
    });

    it("calculates correct time remaining", () => {
      // Set a time 1 hour, 30 minutes, and 45 seconds from now
      const futureDate = new Date(
        Date.now() + (1 * 3600 + 30 * 60 + 45) * 1000
      ).toISOString();
      const result = getTimeRemaining(futureDate);

      expect(result.isExpired).toBe(false);
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(30);
      // Seconds might be 44 or 45 due to timing
      expect(result.seconds).toBeGreaterThanOrEqual(44);
      expect(result.seconds).toBeLessThanOrEqual(45);
    });

    it("handles large time differences correctly", () => {
      const futureDate = new Date(Date.now() + 10 * 3600 * 1000).toISOString(); // 10 hours
      const result = getTimeRemaining(futureDate);

      expect(result.hours).toBe(10);
      expect(result.isExpired).toBe(false);
    });
  });

  describe("formatCountdown", () => {
    it("returns 'Expired' for past timestamp", () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      expect(formatCountdown(pastDate)).toBe("Expired");
    });

    it("formats hours and minutes for long durations", () => {
      const futureDate = new Date(Date.now() + 2.5 * 3600 * 1000).toISOString(); // 2.5 hours
      const result = formatCountdown(futureDate);

      expect(result).toMatch(/^2h \d+m$/);
    });

    it("includes seconds for short durations (< 5 minutes)", () => {
      const futureDate = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 minutes
      const result = formatCountdown(futureDate);

      expect(result).toMatch(/^\d+m \d+s$/);
    });

    it("does not include seconds for longer durations", () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
      const result = formatCountdown(futureDate);

      expect(result).not.toMatch(/s$/);
    });
  });

  describe("formatExpirationTime", () => {
    it("formats time in 12-hour format", () => {
      const date = new Date("2024-12-25T15:30:00Z");
      const result = formatExpirationTime(date.toISOString());

      // Result depends on local timezone, but should contain AM or PM
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });
  });

  describe("DURATION_OPTIONS", () => {
    it("has 4 preset options", () => {
      expect(DURATION_OPTIONS).toHaveLength(4);
    });

    it("contains expected durations", () => {
      const durations = DURATION_OPTIONS.map((opt) => opt.minutes);
      expect(durations).toEqual([60, 120, 180, 240]);
    });

    it("has human-readable labels", () => {
      expect(DURATION_OPTIONS[0].label).toBe("1 hour");
      expect(DURATION_OPTIONS[1].label).toBe("2 hours");
    });
  });

  describe("DEFAULT_DURATION_MINUTES", () => {
    it("is set to 3 hours (180 minutes)", () => {
      expect(DEFAULT_DURATION_MINUTES).toBe(180);
    });
  });
});
