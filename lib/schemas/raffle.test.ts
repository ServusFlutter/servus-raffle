/**
 * @jest-environment node
 */
import {
  CreateRaffleSchema,
  RaffleSchema,
  RaffleStatus,
  ActivateRaffleSchema,
  type Raffle,
  type CreateRaffleInput,
  type ActivateRaffleInput,
} from "./raffle";

describe("CreateRaffleSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid name", () => {
      const result = CreateRaffleSchema.safeParse({ name: "December Meetup" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("December Meetup");
      }
    });

    it("trims whitespace from name", () => {
      const result = CreateRaffleSchema.safeParse({ name: "  Meetup Raffle  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Meetup Raffle");
      }
    });

    it("accepts a single character name", () => {
      const result = CreateRaffleSchema.safeParse({ name: "X" });
      expect(result.success).toBe(true);
    });

    it("accepts a 255 character name", () => {
      const longName = "a".repeat(255);
      const result = CreateRaffleSchema.safeParse({ name: longName });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty name", () => {
      const result = CreateRaffleSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Raffle name is required");
      }
    });

    it("rejects whitespace-only name", () => {
      const result = CreateRaffleSchema.safeParse({ name: "   " });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Raffle name is required");
      }
    });

    it("rejects name over 255 characters", () => {
      const tooLongName = "a".repeat(256);
      const result = CreateRaffleSchema.safeParse({ name: tooLongName });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Raffle name must be 255 characters or less"
        );
      }
    });

    it("rejects missing name field", () => {
      const result = CreateRaffleSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects null name", () => {
      const result = CreateRaffleSchema.safeParse({ name: null });
      expect(result.success).toBe(false);
    });

    it("rejects non-string name", () => {
      const result = CreateRaffleSchema.safeParse({ name: 123 });
      expect(result.success).toBe(false);
    });
  });
});

describe("RaffleSchema", () => {
  const validRaffle: Raffle = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Test Raffle",
    status: "draft",
    qr_code_expires_at: null,
    created_at: "2024-12-25T10:00:00Z",
    created_by: "123e4567-e89b-12d3-a456-426614174001",
  };

  describe("valid inputs", () => {
    it("accepts a valid raffle object", () => {
      const result = RaffleSchema.safeParse(validRaffle);
      expect(result.success).toBe(true);
    });

    it("accepts all valid status values", () => {
      const statuses = ["draft", "active", "drawing", "completed"] as const;
      statuses.forEach((status) => {
        const result = RaffleSchema.safeParse({ ...validRaffle, status });
        expect(result.success).toBe(true);
      });
    });

    it("accepts null qr_code_expires_at", () => {
      const result = RaffleSchema.safeParse({
        ...validRaffle,
        qr_code_expires_at: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid qr_code_expires_at timestamp", () => {
      const result = RaffleSchema.safeParse({
        ...validRaffle,
        qr_code_expires_at: "2024-12-25T12:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts null created_by", () => {
      const result = RaffleSchema.safeParse({
        ...validRaffle,
        created_by: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid UUID for id", () => {
      const result = RaffleSchema.safeParse({
        ...validRaffle,
        id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid status value", () => {
      const result = RaffleSchema.safeParse({
        ...validRaffle,
        status: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = RaffleSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID for created_by", () => {
      const result = RaffleSchema.safeParse({
        ...validRaffle,
        created_by: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("RaffleStatus", () => {
  it("accepts valid status values", () => {
    expect(RaffleStatus.safeParse("draft").success).toBe(true);
    expect(RaffleStatus.safeParse("active").success).toBe(true);
    expect(RaffleStatus.safeParse("drawing").success).toBe(true);
    expect(RaffleStatus.safeParse("completed").success).toBe(true);
  });

  it("rejects invalid status values", () => {
    expect(RaffleStatus.safeParse("pending").success).toBe(false);
    expect(RaffleStatus.safeParse("cancelled").success).toBe(false);
    expect(RaffleStatus.safeParse("").success).toBe(false);
  });
});

describe("ActivateRaffleSchema", () => {
  const validInput = {
    raffleId: "123e4567-e89b-12d3-a456-426614174000",
    durationMinutes: 180,
  };

  describe("valid inputs", () => {
    it("accepts valid raffleId and duration", () => {
      const result = ActivateRaffleSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("accepts minimum duration of 15 minutes", () => {
      const result = ActivateRaffleSchema.safeParse({
        ...validInput,
        durationMinutes: 15,
      });
      expect(result.success).toBe(true);
    });

    it("accepts maximum duration of 1440 minutes (24 hours)", () => {
      const result = ActivateRaffleSchema.safeParse({
        ...validInput,
        durationMinutes: 1440,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid UUID for raffleId", () => {
      const result = ActivateRaffleSchema.safeParse({
        ...validInput,
        raffleId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid raffle ID");
      }
    });

    it("rejects duration less than 15 minutes", () => {
      const result = ActivateRaffleSchema.safeParse({
        ...validInput,
        durationMinutes: 10,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Duration must be at least 15 minutes"
        );
      }
    });

    it("rejects duration greater than 24 hours", () => {
      const result = ActivateRaffleSchema.safeParse({
        ...validInput,
        durationMinutes: 1441,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Duration cannot exceed 24 hours"
        );
      }
    });

    it("rejects non-integer duration", () => {
      const result = ActivateRaffleSchema.safeParse({
        ...validInput,
        durationMinutes: 60.5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Duration must be a whole number"
        );
      }
    });

    it("rejects missing raffleId", () => {
      const result = ActivateRaffleSchema.safeParse({
        durationMinutes: 180,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing durationMinutes", () => {
      const result = ActivateRaffleSchema.safeParse({
        raffleId: validInput.raffleId,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Type exports", () => {
  it("CreateRaffleInput type works correctly", () => {
    const input: CreateRaffleInput = { name: "Test" };
    expect(input.name).toBe("Test");
  });

  it("Raffle type works correctly", () => {
    const raffle: Raffle = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Test",
      status: "draft",
      qr_code_expires_at: null,
      created_at: "2024-01-01T00:00:00Z",
      created_by: null,
    };
    expect(raffle.id).toBeDefined();
    expect(raffle.status).toBe("draft");
  });

  it("ActivateRaffleInput type works correctly", () => {
    const input: ActivateRaffleInput = {
      raffleId: "123e4567-e89b-12d3-a456-426614174000",
      durationMinutes: 180,
    };
    expect(input.raffleId).toBeDefined();
    expect(input.durationMinutes).toBe(180);
  });
});
