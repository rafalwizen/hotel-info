/**
 * The mutation-proposal contract: a discriminated union over the EXISTING
 * validation schemas, so what the model produces and what the server action
 * parses is literally the same schema. Server-side the route safeParses the
 * tool input with this union before emitting a `proposal` SSE event;
 * client-side the confirmation card calls the matching server action with
 * the payload — the model itself has no write path anywhere.
 */

import { z } from "zod";
import { createRoomSchema, duplicateRoomSchema } from "@/lib/validation/room";
import { arrivalStepSchema } from "@/lib/validation/arrival";
import { amenitySchema } from "@/lib/validation/amenity";
import { hotelSettingsSchema } from "@/lib/validation/hotel";

export const proposalPayloadSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_room").describe("Utwórz nowy pokój"),
    input: createRoomSchema,
  }),
  z.object({
    action: z.literal("duplicate_room").describe(
      "Duplikuj istniejący pokój (udogodnienia, nadpisane sekcje i kroki dojazdu); number wymagany, reszta opcjonalna = kopia źródła",
    ),
    ...duplicateRoomSchema.shape,
  }),
  z.object({
    action: z.literal("upsert_arrival_step"),
    input: arrivalStepSchema.extend({ id: z.string().optional(), photoUrl: z.string().nullable().optional() }),
  }),
  z.object({
    action: z.literal("upsert_amenity"),
    input: amenitySchema.extend({ id: z.string().optional() }),
  }),
  z.object({ action: z.literal("update_hotel_settings"), input: hotelSettingsSchema }),
]);

export type ProposalPayload = z.infer<typeof proposalPayloadSchema>;

export type ProposalAction = ProposalPayload["action"];

/** Card chrome metadata per action (risky = full-object replacement). */
export const PROPOSAL_META: Record<ProposalAction, { title: string; risky: boolean }> = {
  create_room: { title: "Nowy pokój", risky: false },
  duplicate_room: { title: "Duplikat pokoju", risky: false },
  upsert_arrival_step: { title: "Krok dojazdu", risky: false },
  upsert_amenity: { title: "Udogodnienie", risky: false },
  update_hotel_settings: { title: "Ustawienia hotelu", risky: true },
};
