/**
 * @jest-environment node
 */
import {
  CreatePrizeSchema,
  UpdatePrizeSchema,
  PrizeSchema,
  type Prize,
  type CreatePrizeInput,
  type UpdatePrizeInput,
} from "./prize";

describe("CreatePrizeSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid name", () => {
      const result = CreatePrizeSchema.safeParse({ name: "Amazon Gift Card" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Amazon Gift Card");
      }
    });

    it("trims whitespace from name", () => {
      const result = CreatePrizeSchema.safeParse({ name: "  Gift Card  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Gift Card");
      }
    });

    it("accepts a single character name", () => {
      const result = CreatePrizeSchema.safeParse({ name: "X" });
      expect(result.success).toBe(true);
    });

    it("accepts a 255 character name", () => {
      const longName = "a".repeat(255);
      const result = CreatePrizeSchema.safeParse({ name: longName });
      expect(result.success).toBe(true);
    });

    it("accepts name with optional description", () => {
      const result = CreatePrizeSchema.safeParse({
        name: "Gift Card",
        description: "$50 Amazon gift card",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Gift Card");
        expect(result.data.description).toBe("$50 Amazon gift card");
      }
    });

    it("accepts name with null description", () => {
      const result = CreatePrizeSchema.safeParse({
        name: "Gift Card",
        description: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts name with undefined description", () => {
      const result = CreatePrizeSchema.safeParse({
        name: "Gift Card",
        description: undefined,
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from description", () => {
      const result = CreatePrizeSchema.safeParse({
        name: "Gift Card",
        description: "  A great prize  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("A great prize");
      }
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty name", () => {
      const result = CreatePrizeSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Prize name is required");
      }
    });

    it("rejects whitespace-only name", () => {
      const result = CreatePrizeSchema.safeParse({ name: "   " });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Prize name is required");
      }
    });

    it("rejects name over 255 characters", () => {
      const tooLongName = "a".repeat(256);
      const result = CreatePrizeSchema.safeParse({ name: tooLongName });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Prize name must be 255 characters or less"
        );
      }
    });

    it("rejects missing name field", () => {
      const result = CreatePrizeSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects null name", () => {
      const result = CreatePrizeSchema.safeParse({ name: null });
      expect(result.success).toBe(false);
    });

    it("rejects non-string name", () => {
      const result = CreatePrizeSchema.safeParse({ name: 123 });
      expect(result.success).toBe(false);
    });
  });
});

describe("UpdatePrizeSchema", () => {
  const validInput = {
    prizeId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Updated Prize",
    description: "Updated description",
  };

  describe("valid inputs", () => {
    it("accepts valid prizeId, name, and description", () => {
      const result = UpdatePrizeSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("accepts valid prizeId and name without description", () => {
      const result = UpdatePrizeSchema.safeParse({
        prizeId: validInput.prizeId,
        name: "Updated Prize",
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from name and description", () => {
      const result = UpdatePrizeSchema.safeParse({
        ...validInput,
        name: "  Trimmed  ",
        description: "  Trimmed desc  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Trimmed");
        expect(result.data.description).toBe("Trimmed desc");
      }
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid UUID for prizeId", () => {
      const result = UpdatePrizeSchema.safeParse({
        ...validInput,
        prizeId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid prize ID");
      }
    });

    it("rejects empty name", () => {
      const result = UpdatePrizeSchema.safeParse({
        ...validInput,
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing prizeId", () => {
      const result = UpdatePrizeSchema.safeParse({
        name: "Updated Prize",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("PrizeSchema", () => {
  const validPrize: Prize = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    raffle_id: "123e4567-e89b-12d3-a456-426614174001",
    name: "Test Prize",
    description: "A test prize",
    sort_order: 0,
    awarded_to: null,
    awarded_at: null,
  };

  describe("valid inputs", () => {
    it("accepts a valid prize object", () => {
      const result = PrizeSchema.safeParse(validPrize);
      expect(result.success).toBe(true);
    });

    it("accepts prize with awarded_to and awarded_at", () => {
      const result = PrizeSchema.safeParse({
        ...validPrize,
        awarded_to: "123e4567-e89b-12d3-a456-426614174002",
        awarded_at: "2024-12-25T10:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts null description", () => {
      const result = PrizeSchema.safeParse({
        ...validPrize,
        description: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts various sort_order values", () => {
      [0, 1, 5, 100].forEach((sort_order) => {
        const result = PrizeSchema.safeParse({ ...validPrize, sort_order });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("invalid inputs", () => {
    it("rejects invalid UUID for id", () => {
      const result = PrizeSchema.safeParse({
        ...validPrize,
        id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID for raffle_id", () => {
      const result = PrizeSchema.safeParse({
        ...validPrize,
        raffle_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID for awarded_to", () => {
      const result = PrizeSchema.safeParse({
        ...validPrize,
        awarded_to: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer sort_order", () => {
      const result = PrizeSchema.safeParse({
        ...validPrize,
        sort_order: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = PrizeSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe("Type exports", () => {
  it("CreatePrizeInput type works correctly", () => {
    const input: CreatePrizeInput = { name: "Test Prize" };
    expect(input.name).toBe("Test Prize");
  });

  it("CreatePrizeInput with description works correctly", () => {
    const input: CreatePrizeInput = {
      name: "Test Prize",
      description: "A description",
    };
    expect(input.name).toBe("Test Prize");
    expect(input.description).toBe("A description");
  });

  it("UpdatePrizeInput type works correctly", () => {
    const input: UpdatePrizeInput = {
      prizeId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Updated Prize",
    };
    expect(input.prizeId).toBeDefined();
    expect(input.name).toBe("Updated Prize");
  });

  it("Prize type works correctly", () => {
    const prize: Prize = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      raffle_id: "123e4567-e89b-12d3-a456-426614174001",
      name: "Test",
      description: null,
      sort_order: 0,
      awarded_to: null,
      awarded_at: null,
    };
    expect(prize.id).toBeDefined();
    expect(prize.sort_order).toBe(0);
  });
});
