import { describe, expect, it } from "vitest";
import { roomSchema } from "./room";

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
