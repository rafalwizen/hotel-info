import { describe, expect, it } from "vitest";
import { z } from "zod";
import { proposalPayloadSchema } from "./proposals";

describe("proposalPayloadSchema", () => {
  it("accepts a minimal create_room payload", () => {
    const parsed = proposalPayloadSchema.safeParse({
      action: "create_room",
      input: { number: "204", name: { pl: "Apartament Widok", en: "" } },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects create_room without the PL name", () => {
    const parsed = proposalPayloadSchema.safeParse({
      action: "create_room",
      input: { number: "204", name: { pl: "", en: "View Apartment" } },
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts upsert_arrival_step with an optional id and photoUrl", () => {
    const parsed = proposalPayloadSchema.safeParse({
      action: "upsert_arrival_step",
      input: {
        id: "existing-step-id",
        photoUrl: null,
        title: { pl: "Brama", en: "Gate" },
        body: { pl: "Kod 1234", en: "Code 1234" },
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts upsert_amenity with a valid payload", () => {
    const parsed = proposalPayloadSchema.safeParse({
      action: "upsert_amenity",
      input: { id: "a1", label: { pl: "Wi-Fi", en: "" }, icon: "wifi" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown action", () => {
    const parsed = proposalPayloadSchema.safeParse({
      action: "delete_room",
      input: { id: "x" },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects update_hotel_settings with a partial object (full replacement semantics)", () => {
    const parsed = proposalPayloadSchema.safeParse({
      action: "update_hotel_settings",
      input: { wifiSsid: "Hotel" },
    });
    expect(parsed.success).toBe(false);
  });

  it("maps to a JSON Schema tool input covering all four actions", () => {
    const json = z.toJSONSchema(proposalPayloadSchema, { io: "input" }) as {
      oneOf?: { properties?: { action?: { const?: string } } }[];
    };
    const actions = (json.oneOf ?? []).map(
      (variant) => variant.properties?.action?.const,
    );
    expect(actions).toEqual([
      "create_room",
      "upsert_arrival_step",
      "upsert_amenity",
      "update_hotel_settings",
    ]);
  });
});
