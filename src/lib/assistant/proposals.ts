/**
 * The mutation-proposal contract: a discriminated union over the EXISTING
 * validation schemas, so what the model produces and what the server action
 * parses is literally the same schema. Server-side the route safeParses the
 * tool input with this union before emitting a `proposal` SSE event;
 * client-side the confirmation card calls the matching server action with
 * the payload — the model itself has no write path anywhere.
 *
 * Excluded by design: room deletion, reorderings (move up/down), binary
 * photo uploads, QR and auth operations.
 */

import { z } from "zod";
import {
  createRoomSchema,
  duplicateRoomSchema,
  roomSchema,
} from "@/lib/validation/room";
import { arrivalMapSchema, arrivalStepSchema } from "@/lib/validation/arrival";
import { amenitySchema } from "@/lib/validation/amenity";
import { hotelSettingsSchema } from "@/lib/validation/hotel";
import { sectionSchema } from "@/lib/validation/section";

const uuid = z.uuid();
const sectionInput = sectionSchema.extend({ id: uuid.optional() });
const arrivalInput = arrivalStepSchema.extend({
  id: uuid.optional(),
  photoUrl: z.string().nullable().optional(),
});
const arrivalOverrideInput = arrivalStepSchema.extend({
  photoUrl: z.string().nullable().optional(),
});

export const proposalPayloadSchema = z.discriminatedUnion("action", [
  // --- rooms ---
  z.object({
    action: z.literal("create_room").describe("Utwórz nowy pokój (number, nazwa PL/EN, opcjonalnie piętro i max gości)"),
    input: createRoomSchema,
  }),
  z.object({
    action: z.literal("duplicate_room").describe(
      "Duplikuj istniejący pokój (udogodnienia, nadpisane sekcje i kroki dojazdu); number wymagany, reszta opcjonalna = kopia źródła",
    ),
    ...duplicateRoomSchema.shape,
  }),
  z.object({
    action: z.literal("update_room").describe(
      "Edytuj dane pokoju — podmienia CAŁY obiekt, najpierw pobierz aktualne dane get_room i skopiuj niezmienione pola (zwłaszcza slug)",
    ),
    roomId: uuid,
    input: roomSchema,
  }),
  z.object({
    action: z.literal("set_room_published").describe("Opublikuj (true) lub ukryj (false) pokój dla gości"),
    roomId: uuid,
    published: z.boolean(),
  }),
  z.object({
    action: z.literal("set_room_amenities").describe(
      "Ustaw CAŁĄ listę udogodnień pokoju (podmiana zbioru — podaj wszystkie id, nie tylko nowe)",
    ),
    roomId: uuid,
    amenityIds: z.array(uuid),
  }),
  // --- sections (roomSections: templates / per-room overrides / extras) ---
  z.object({
    action: z.literal("upsert_template_section").describe("Dodaj/edytuj sekcję szablonu pokoi (dla wszystkich pokoi)"),
    input: sectionInput,
  }),
  z.object({
    action: z.literal("delete_template_section").describe("Usuń sekcję szablonu — usuwa też nadpisania we wszystkich pokojach"),
    sectionId: uuid,
  }),
  z.object({
    action: z.literal("upsert_hotel_section").describe("Dodaj/edytuj sekcję hotelu (recepcja, śniadanie, parking…)"),
    input: sectionInput,
  }),
  z.object({
    action: z.literal("delete_hotel_section").describe("Usuń sekcję hotelu"),
    sectionId: uuid,
  }),
  z.object({
    action: z.literal("upsert_room_section").describe("Dodaj/edytuj sekcję dodatkową tylko tego pokoju"),
    roomId: uuid,
    input: sectionInput,
  }),
  z.object({
    action: z.literal("override_room_section").describe(
      "Nadpisz treść sekcji szablonu w jednym pokoju — najpierw pobierz treść get_section i skopiuj niezmienione pola",
    ),
    roomId: uuid,
    templateId: uuid,
    input: sectionSchema,
  }),
  z.object({
    action: z.literal("hide_room_section").describe("Ukryj (hidden=true) lub przywróć (hidden=false) sekcję szablonu w jednym pokoju"),
    roomId: uuid,
    templateId: uuid,
    hidden: z.boolean(),
  }),
  z.object({
    action: z.literal("reset_room_section").describe("Usuń nadpisanie sekcji w pokoju — pokój wraca do dziedziczenia szablonu"),
    roomId: uuid,
    templateId: uuid,
  }),
  z.object({
    action: z.literal("delete_room_section").describe("Usuń sekcję dodatkową (lub nadpisanie) pokoju"),
    sectionId: uuid,
  }),
  // --- arrival ---
  z.object({
    action: z.literal("upsert_arrival_step").describe(
      "Dodaj/edytuj krok dojazdu hotelowego — przy edycji przekaż photoUrl BEZ ZMIAN (pominięcie usuwa zdjęcie)",
    ),
    input: arrivalInput,
  }),
  z.object({
    action: z.literal("delete_arrival_step").describe("Usuń krok dojazdu hotelowego — usuwa też nadpisania i zdjęcia"),
    stepId: uuid,
  }),
  z.object({
    action: z.literal("update_arrival_map").describe("Ustaw link do mapy dojazdu (pusty string = wyczyszczenie)"),
    input: arrivalMapSchema,
  }),
  z.object({
    action: z.literal("upsert_room_arrival_step").describe("Dodaj/edytuj krok dojazdu dodatkowy tylko tego pokoju"),
    roomId: uuid,
    input: arrivalInput,
  }),
  z.object({
    action: z.literal("override_room_arrival_step").describe(
      "Nadpisz krok dojazdu szablonu w jednym pokoju — przekaż photoUrl BEZ ZMIAN",
    ),
    roomId: uuid,
    templateId: uuid,
    input: arrivalOverrideInput,
  }),
  z.object({
    action: z.literal("hide_room_arrival_step").describe("Ukryj (hidden=true) lub przywróć (hidden=false) krok dojazdu szablonu w jednym pokoju"),
    roomId: uuid,
    templateId: uuid,
    hidden: z.boolean(),
  }),
  z.object({
    action: z.literal("reset_room_arrival_step").describe("Usuń nadpisanie kroku dojazdu w pokoju — powrót do szablonu"),
    roomId: uuid,
    templateId: uuid,
  }),
  z.object({
    action: z.literal("delete_room_arrival_step").describe("Usuń krok dojazdu dodatkowy (lub nadpisanie) pokoju"),
    stepId: uuid,
  }),
  // --- amenities & hotel ---
  z.object({
    action: z.literal("upsert_amenity").describe("Dodaj/edytuj udogodnienie w katalogu hotelu"),
    input: amenitySchema.extend({ id: uuid.optional() }),
  }),
  z.object({
    action: z.literal("delete_amenity").describe("Usuń udogodnienie z katalogu — znika ze wszystkich pokoi"),
    amenityId: uuid,
  }),
  z.object({
    action: z.literal("update_hotel_settings").describe(
      "Podmienia CAŁY obiekt ustawień hotelu — najpierw pobierz aktualne wartości get_hotel_info i skopiuj niezmienione pola",
    ),
    input: hotelSettingsSchema,
  }),
]);

export type ProposalPayload = z.infer<typeof proposalPayloadSchema>;

export type ProposalAction = ProposalPayload["action"];

/**
 * Card chrome metadata per action: risky = full-object replacement worth an
 * amber note; destructive = irreversible delete, red card + "Usuń" button.
 */
export const PROPOSAL_META: Record<
  ProposalAction,
  { title: string; risky: boolean; destructive?: boolean }
> = {
  create_room: { title: "Nowy pokój", risky: false },
  duplicate_room: { title: "Duplikat pokoju", risky: false },
  update_room: { title: "Edycja pokoju", risky: true },
  set_room_published: { title: "Publikacja pokoju", risky: false },
  set_room_amenities: { title: "Udogodnienia pokoju", risky: true },
  upsert_template_section: { title: "Sekcja szablonu pokoi", risky: false },
  delete_template_section: { title: "Usunięcie szablonu sekcji", risky: true, destructive: true },
  upsert_hotel_section: { title: "Sekcja hotelu", risky: false },
  delete_hotel_section: { title: "Usunięcie sekcji hotelu", risky: false, destructive: true },
  upsert_room_section: { title: "Sekcja pokoju", risky: false },
  override_room_section: { title: "Nadpisanie sekcji", risky: false },
  hide_room_section: { title: "Widoczność sekcji", risky: false },
  reset_room_section: { title: "Powrót do szablonu", risky: false },
  delete_room_section: { title: "Usunięcie sekcji pokoju", risky: false, destructive: true },
  upsert_arrival_step: { title: "Krok dojazdu", risky: false },
  delete_arrival_step: { title: "Usunięcie kroku dojazdu", risky: true, destructive: true },
  update_arrival_map: { title: "Mapa dojazdu", risky: false },
  upsert_room_arrival_step: { title: "Krok dojazdu pokoju", risky: false },
  override_room_arrival_step: { title: "Nadpisanie kroku dojazdu", risky: false },
  hide_room_arrival_step: { title: "Widoczność kroku dojazdu", risky: false },
  reset_room_arrival_step: { title: "Powrót do kroku szablonu", risky: false },
  delete_room_arrival_step: { title: "Usunięcie kroku pokoju", risky: false, destructive: true },
  upsert_amenity: { title: "Udogodnienie", risky: false },
  delete_amenity: { title: "Usunięcie udogodnienia", risky: false, destructive: true },
  update_hotel_settings: { title: "Ustawienia hotelu", risky: true },
};
