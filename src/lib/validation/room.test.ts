import { describe, expect, it } from "vitest";
import { createRoomSchema, duplicateRoomSchema, roomSchema } from "./room";

const validRoom = {
  number: "101",
  slug: "101",
  name: { pl: "Pokój standard", en: "" },
  floor: null,
  maxGuests: 2,
  published: true,
};

describe("roomSchema", () => {
  it("rejects the reserved arrival-guide slug", () => {
    const result = roomSchema.safeParse({ ...validRoom, slug: "dojazd" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("zarezerwowany");
    }
  });

  it("accepts an ordinary room slug", () => {
    expect(roomSchema.safeParse(validRoom).success).toBe(true);
  });
});

describe("createRoomSchema", () => {
  it("accepts the minimal manual-form payload (no floor, no maxGuests)", () => {
    const result = createRoomSchema.safeParse({
      number: "204",
      name: { pl: "Apartament", en: "" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts floor and maxGuests when provided (assistant path)", () => {
    const result = createRoomSchema.safeParse({
      number: "204",
      name: { pl: "Apartament", en: "" },
      floor: 2,
      maxGuests: 4,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.floor).toBe(2);
      expect(result.data.maxGuests).toBe(4);
    }
  });

  it("accepts an explicit null floor (cleared) and rejects floor 51", () => {
    expect(
      createRoomSchema.safeParse({ number: "1", name: { pl: "x", en: "" }, floor: null }).success,
    ).toBe(true);
    expect(
      createRoomSchema.safeParse({ number: "1", name: { pl: "x", en: "" }, floor: 51 }).success,
    ).toBe(false);
  });

  it("rejects maxGuests 0", () => {
    expect(
      createRoomSchema.safeParse({ number: "1", name: { pl: "x", en: "" }, maxGuests: 0 }).success,
    ).toBe(false);
  });
});

describe("duplicateRoomSchema", () => {
  it("accepts a minimal duplicate (only source and number — rest copied)", () => {
    const result = duplicateRoomSchema.safeParse({
      sourceRoomId: "0b6d8f1e-4a1a-4e3f-9c2b-7e5d1a3f9c88",
      number: "401",
    });
    expect(result.success).toBe(true);
  });

  it("accepts overrides for name, floor and maxGuests", () => {
    const result = duplicateRoomSchema.safeParse({
      sourceRoomId: "0b6d8f1e-4a1a-4e3f-9c2b-7e5d1a3f9c88",
      number: "401",
      name: { pl: "Apartament Widok", en: "View Apartment" },
      floor: 4,
      maxGuests: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing number and a non-uuid sourceRoomId", () => {
    expect(
      duplicateRoomSchema.safeParse({ sourceRoomId: "not-a-uuid" }).success,
    ).toBe(false);
    expect(
      duplicateRoomSchema.safeParse({
        sourceRoomId: "0b6d8f1e-4a1a-4e3f-9c2b-7e5d1a3f9c88",
      }).success,
    ).toBe(false);
  });
});
