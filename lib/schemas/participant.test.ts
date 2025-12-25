/**
 * Tests for participant validation schemas
 */

import { JoinRaffleSchema, ParticipantSchema } from "./participant";

describe("JoinRaffleSchema", () => {
  it("should accept valid UUID", () => {
    const result = JoinRaffleSchema.safeParse({
      raffleId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID format", () => {
    const result = JoinRaffleSchema.safeParse({
      raffleId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty string", () => {
    const result = JoinRaffleSchema.safeParse({
      raffleId: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing raffleId", () => {
    const result = JoinRaffleSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject numeric values", () => {
    const result = JoinRaffleSchema.safeParse({
      raffleId: 12345,
    });
    expect(result.success).toBe(false);
  });
});

describe("ParticipantSchema", () => {
  const validParticipant = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    raffle_id: "123e4567-e89b-12d3-a456-426614174001",
    user_id: "123e4567-e89b-12d3-a456-426614174002",
    ticket_count: 1,
    joined_at: "2025-12-25T10:00:00Z",
  };

  it("should accept valid participant record", () => {
    const result = ParticipantSchema.safeParse(validParticipant);
    expect(result.success).toBe(true);
  });

  it("should accept participant with multiple tickets", () => {
    const result = ParticipantSchema.safeParse({
      ...validParticipant,
      ticket_count: 5,
    });
    expect(result.success).toBe(true);
  });

  it("should reject zero ticket count", () => {
    const result = ParticipantSchema.safeParse({
      ...validParticipant,
      ticket_count: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative ticket count", () => {
    const result = ParticipantSchema.safeParse({
      ...validParticipant,
      ticket_count: -1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer ticket count", () => {
    const result = ParticipantSchema.safeParse({
      ...validParticipant,
      ticket_count: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for id", () => {
    const result = ParticipantSchema.safeParse({
      ...validParticipant,
      id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for raffle_id", () => {
    const result = ParticipantSchema.safeParse({
      ...validParticipant,
      raffle_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for user_id", () => {
    const result = ParticipantSchema.safeParse({
      ...validParticipant,
      user_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing fields", () => {
    const result = ParticipantSchema.safeParse({
      id: validParticipant.id,
      // Missing other fields
    });
    expect(result.success).toBe(false);
  });
});
