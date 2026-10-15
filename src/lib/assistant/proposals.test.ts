import { describe, expect, it } from "vitest";
import { z } from "zod";
import { normalizeProposalInput, proposalPayloadSchema } from "./proposals";

const UUID1 = "0b6d8f1e-4a1a-4e3f-9c2b-7e5d1a3f9c88";
const UUID2 = "1c7e9a2f-5b3b-4f4e-8d3c-6f4e2b5a0d99";

const TITLE = { pl: "Regulamin", en: "House rules" };
const BODY = { pl: "Cisza nocna od 22:00.", en: "" };
const SECTION = { title: TITLE, body: BODY, icon: "info", enabled: true };
const STEP = { title: { pl: "Brama", en: "" }, body: { pl: "Kod 1234.", en: "" } };
const ROOM_FULL = {
  number: "301",
  slug: "301",
  name: { pl: "Pokój standard", en: "" },
  floor: 3,
  maxGuests: 2,
  published: true,
};
const SETTINGS = {
  name: { pl: "Willa Mazury", en: "" },
  brandColor: "#0f766e",
  wifiSsid: "Willa",
  wifiPassword: "haslo123",
  checkinFrom: "15:00",
  checkoutUntil: "11:00",
  phone: "+48 600 100 200",
  email: "recepcja@example.com",
  addressLine: "Leśna 1, Mikołajki",
};

const VALID: Record<string, object> = {
  create_room: { input: { number: "505", name: { pl: "Pokój rodzinny", en: "" }, floor: 2, maxGuests: 3 } },
  duplicate_room: { input: { sourceRoomId: UUID1, number: "401" } },
  update_room: { roomId: UUID1, input: ROOM_FULL },
  set_room_published: { roomId: UUID1, published: false },
  set_room_amenities: { roomId: UUID1, amenityIds: [UUID1, UUID2] },
  upsert_template_section: { input: { ...SECTION, id: UUID2 } },
  delete_template_section: { sectionId: UUID1 },
  upsert_hotel_section: { input: SECTION },
  delete_hotel_section: { sectionId: UUID1 },
  upsert_room_section: { roomId: UUID1, input: SECTION },
  override_room_section: { roomId: UUID1, templateId: UUID2, input: SECTION },
  hide_room_section: { roomId: UUID1, templateId: UUID2, hidden: true },
  reset_room_section: { roomId: UUID1, templateId: UUID2 },
  delete_room_section: { sectionId: UUID1 },
  upsert_arrival_step: { input: { ...STEP, id: UUID1, photoUrl: null } },
  delete_arrival_step: { stepId: UUID1 },
  update_arrival_map: { input: { mapUrl: "https://maps.example.com/pin" } },
  upsert_room_arrival_step: { roomId: UUID1, input: STEP },
  override_room_arrival_step: { roomId: UUID1, templateId: UUID2, input: { ...STEP, photoUrl: null } },
  hide_room_arrival_step: { roomId: UUID1, templateId: UUID2, hidden: false },
  reset_room_arrival_step: { roomId: UUID1, templateId: UUID2 },
  delete_room_arrival_step: { stepId: UUID1 },
  upsert_amenity: { input: { label: { pl: "Wi-Fi", en: "" }, icon: "wifi", id: UUID1 } },
  delete_amenity: { amenityId: UUID1 },
  update_hotel_settings: { input: SETTINGS },
};

const ALL_ACTIONS = Object.keys(VALID);

describe("proposalPayloadSchema", () => {
  it("accepts every member's representative payload", () => {
    for (const action of ALL_ACTIONS) {
      const parsed = proposalPayloadSchema.safeParse({ action, ...VALID[action] });
      expect(parsed.success, `expected ${action} to parse`).toBe(true);
    }
  });

  it("accepts set_room_amenities with an empty list (clearing)", () => {
    const parsed = proposalPayloadSchema.safeParse({
      action: "set_room_amenities",
      roomId: UUID1,
      amenityIds: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts create_room with optional floor and maxGuests", () => {
    const parsed = proposalPayloadSchema.safeParse({
      action: "create_room",
      input: { number: "505", name: { pl: "Pokój rodzinny", en: "" }, floor: 2, maxGuests: 3 },
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a minimal duplicate_room payload (everything but number copied)", () => {
    const parsed = proposalPayloadSchema.safeParse({
      action: "duplicate_room",
      input: { sourceRoomId: UUID1, number: "401" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects duplicate_room without a number", () => {
    expect(
      proposalPayloadSchema.safeParse({ action: "duplicate_room", input: { sourceRoomId: UUID1 } })
        .success,
    ).toBe(false);
  });

  it("rejects create_room without the PL name", () => {
    expect(
      proposalPayloadSchema.safeParse({
        action: "create_room",
        input: { number: "204", name: { pl: "", en: "View Apartment" } },
      }).success,
    ).toBe(false);
  });

  it("rejects create_room with floor 51", () => {
    expect(
      proposalPayloadSchema.safeParse({
        action: "create_room",
        input: { number: "1", name: { pl: "x", en: "" }, floor: 51 },
      }).success,
    ).toBe(false);
  });

  it("rejects update_room with a partial object (full replacement semantics)", () => {
    expect(
      proposalPayloadSchema.safeParse({ action: "update_room", roomId: UUID1, input: { number: "1" } })
        .success,
    ).toBe(false);
  });

  it("rejects a non-uuid roomId", () => {
    expect(
      proposalPayloadSchema.safeParse({ action: "set_room_published", roomId: "42", published: true })
        .success,
    ).toBe(false);
  });

  it("rejects override_room_section missing the PL title", () => {
    expect(
      proposalPayloadSchema.safeParse({
        action: "override_room_section",
        roomId: UUID1,
        templateId: UUID2,
        input: { ...SECTION, title: { pl: "", en: "Rules" } },
      }).success,
    ).toBe(false);
  });

  it("rejects update_arrival_map with a non-http URL", () => {
    expect(
      proposalPayloadSchema.safeParse({
        action: "update_arrival_map",
        input: { mapUrl: "ftp://example.com" },
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown action", () => {
    expect(proposalPayloadSchema.safeParse({ action: "delete_room", roomId: UUID1 }).success).toBe(
      false,
    );
  });

  it("maps to a JSON Schema tool input covering all 25 actions in order", () => {
    const json = z.toJSONSchema(proposalPayloadSchema, { io: "input" }) as {
      oneOf?: { properties?: { action?: { const?: string } } }[];
    };
    const actions = (json.oneOf ?? []).map((variant) => variant.properties?.action?.const);
    expect(actions).toHaveLength(25);
    expect(actions).toEqual(ALL_ACTIONS);
  });
});

describe("normalizeProposalInput", () => {
  it("wraps a flat duplicate_room shape into input", () => {
    const normalized = normalizeProposalInput({
      action: "duplicate_room",
      sourceRoomId: UUID1,
      number: "401",
    });
    expect(normalized).toEqual({
      action: "duplicate_room",
      input: { sourceRoomId: UUID1, number: "401" },
    });
  });

  it("unwraps a double-nested duplicate_room input", () => {
    const normalized = normalizeProposalInput({
      action: "duplicate_room",
      input: { input: { sourceRoomId: UUID1, number: "401" }, extra: "stripped-by-zod" },
    });
    expect(normalized).toEqual({
      action: "duplicate_room",
      input: { sourceRoomId: UUID1, number: "401", extra: "stripped-by-zod" },
    });
  });

  it("coerces a JSON-number room number to a string", () => {
    const normalized = normalizeProposalInput({
      action: "duplicate_room",
      input: { sourceRoomId: UUID1, number: 401 },
    });
    expect(
      proposalPayloadSchema.safeParse(normalized).success,
    ).toBe(true);

    const created = normalizeProposalInput({
      action: "create_room",
      input: { number: 505, name: { pl: "Pokój", en: "" } },
    });
    expect(proposalPayloadSchema.safeParse(created).success).toBe(true);
  });

  it("passes other actions through untouched", () => {
    const raw = { action: "set_room_published", roomId: UUID1, published: true };
    expect(normalizeProposalInput(raw)).toEqual(raw);
    expect(normalizeProposalInput(null)).toBeNull();
    expect(normalizeProposalInput("x")).toBe("x");
  });

  it("end-to-end: flat duplicate with numeric number parses after normalization", () => {
    const normalized = normalizeProposalInput({
      action: "duplicate_room",
      sourceRoomId: UUID1,
      number: 401,
      maxGuests: 3,
    });
    const parsed = proposalPayloadSchema.safeParse(normalized);
    expect(parsed.success).toBe(true);
  });
});
