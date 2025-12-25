/**
 * @jest-environment node
 */
import { isAdmin } from "./admin";

describe("isAdmin", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("when ADMIN_EMAILS is set", () => {
    it("returns true for admin email", () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      expect(isAdmin("admin@example.com")).toBe(true);
    });

    it("returns false for non-admin email", () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      expect(isAdmin("user@example.com")).toBe(false);
    });

    it("handles case-insensitive matching", () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      expect(isAdmin("ADMIN@EXAMPLE.COM")).toBe(true);
      expect(isAdmin("Admin@Example.Com")).toBe(true);
    });

    it("handles multiple admin emails", () => {
      process.env.ADMIN_EMAILS = "admin1@example.com,admin2@example.com";
      expect(isAdmin("admin1@example.com")).toBe(true);
      expect(isAdmin("admin2@example.com")).toBe(true);
      expect(isAdmin("user@example.com")).toBe(false);
    });

    it("handles whitespace in env var", () => {
      process.env.ADMIN_EMAILS = " admin@example.com , user@test.com ";
      expect(isAdmin("admin@example.com")).toBe(true);
      expect(isAdmin("user@test.com")).toBe(true);
    });

    it("handles mixed case in env var with whitespace", () => {
      process.env.ADMIN_EMAILS = " ADMIN@Example.COM ";
      expect(isAdmin("admin@example.com")).toBe(true);
    });
  });

  describe("when email is null or undefined", () => {
    it("returns false for undefined email", () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      expect(isAdmin(undefined)).toBe(false);
    });

    it("returns false for null email", () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      expect(isAdmin(null)).toBe(false);
    });

    it("returns false for empty string email", () => {
      process.env.ADMIN_EMAILS = "admin@example.com";
      expect(isAdmin("")).toBe(false);
    });
  });

  describe("when ADMIN_EMAILS is not set or empty", () => {
    it("returns false when ADMIN_EMAILS is undefined", () => {
      delete process.env.ADMIN_EMAILS;
      expect(isAdmin("admin@example.com")).toBe(false);
    });

    it("returns false when ADMIN_EMAILS is empty string", () => {
      process.env.ADMIN_EMAILS = "";
      expect(isAdmin("admin@example.com")).toBe(false);
    });

    it("returns false when ADMIN_EMAILS contains only whitespace", () => {
      process.env.ADMIN_EMAILS = "   ";
      expect(isAdmin("admin@example.com")).toBe(false);
    });

    it("returns false when ADMIN_EMAILS contains only commas", () => {
      process.env.ADMIN_EMAILS = ",,,";
      expect(isAdmin("admin@example.com")).toBe(false);
    });
  });
});
