/**
 * Tool definitions handed to the model. Schemas are derived from zod via
 * z.toJSONSchema (io: "input" — the same values the server actions will
 * parse), so the model's contract and the app's validation contract stay
 * identical.
 *
 * Hard boundary: the ONLY write-shaped tool is `propose_mutation`, which
 * does not write anything server-side — it emits an SSE event and the
 * change is applied client-side by the user clicking Zapisz on the
 * confirmation card (which calls the regular server action). Read tools
 * are hotelId-scoped via src/server/queries/panel.ts and deliberately
 * light: id-rich lists + by-id detail loaders.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { NAV_INTENTS } from "@/lib/assistant/nav";
import { proposalPayloadSchema } from "@/lib/assistant/proposals";
import { SECTION_ICONS } from "@/lib/icons";
import { duplicateRoomSchema } from "@/lib/validation/room";
import {
  getArrivalStepByIdForPanel,
  getHotelInfoShape,
  getRoomDetailForPanel,
  getSectionByIdForPanel,
  listAmenitiesForPanel,
  listArrivalStepsForPanel,
  listHotelSectionsForPanel,
  listRoomsForPanel,
  listSectionTemplatesForPanel,
  type PanelContext,
} from "@/server/queries/panel";

/** Convert a zod schema into an Anthropic-compatible input_schema object. */
function toInputSchema(schema: z.ZodType): Anthropic.Tool["input_schema"] {
  const json = z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
  // $schema is a zod artifact the provider does not need.
  delete json.$schema;
  return json as Anthropic.Tool["input_schema"];
}

const uuidInput = (field: string) =>
  z.strictObject({ [field]: z.uuid().describe("id z narzędzi list_*/get_*") });

export const navigateTool: Anthropic.Tool = {
  name: "navigate",
  description:
    "Przenosi użytkownika na stronę serwisu Hotel Info. Wywołuj zawsze, gdy użytkownik chce przejść do logowania, rejestracji, cennika, kontaktu lub strony głównej — zamiast podawać adres w treści odpowiedzi. Jedno wywołanie na jedną stronę.",
  input_schema: toInputSchema(
    z.strictObject({
      intent: z.enum(NAV_INTENTS).describe("Dokąd przejść: home, pricing, contact, login, register"),
    }),
  ),
};

export const proposeMutationTool: Anthropic.Tool = {
  name: "propose_mutation",
  description:
    "Przygotuj zmianę do zatwierdzenia przez użytkownika. Rodziny akcji: pokoje (create_room, update_room, set_room_published, set_room_amenities), sekcje (szablony pokoi, sekcje hotelu, nadpisania/ukrycia/dodatkowe per pokój), dojazd (kroki hotelowe i per pokój, mapa), udogodnienia, ustawienia hotelu. DO DUPLIKACJI POKOJU używaj dedykowanego narzędzia duplicate_room. Nic nie zapisujesz — użytkownik zobaczy kartę z danymi i przycisk Zapisz. Przed EDYCJĄ pobierz aktualny stan (get_room / get_section / get_arrival_step / get_hotel_info) i skopiuj niezmienione pola.",
  input_schema: toInputSchema(proposalPayloadSchema),
};

/**
 * Dedicated single-purpose tool: small flat schema the model can call
 * reliably (the 25-variant propose_mutation union proved too heavy for
 * GLM-flash, which emitted empty arguments). Routed through the same
 * proposal pipeline in the route handler.
 */
export const duplicateRoomTool: Anthropic.Tool = {
  name: "duplicate_room",
  description:
    "Duplikuj istniejący pokój wraz z udogodnieniami, nadpisanymi sekcjami i krokami dojazdu. sourceRoomId z list_rooms; number nowego pokoju wymagany; nazwa/piętro/max gości opcjonalne (brak = kopia ze źródła). Kopia startuje nieopublikowana — nic nie zapisujesz, użytkownik zatwierdza kartę.",
  input_schema: toInputSchema(duplicateRoomSchema),
};

const readToolSpecs: Anthropic.Tool[] = [
  {
    name: "list_rooms",
    description:
      "Lista wszystkich pokoi tego hotelu (także nieopublikowanych) z id, numerem, adresem, nazwą PL/EN, piętrem i liczbą osób.",
    input_schema: toInputSchema(z.strictObject({})),
  },
  {
    name: "get_room",
    description:
      "Pełny stan pokoju: dane, lista id udogodnień oraz mapa sekcji i kroków dojazdu (dziedziczy/nadpisane/ukryte + dodatkowe). Wywołaj przed update_room i set_room_amenities.",
    input_schema: toInputSchema(uuidInput("roomId")),
  },
  {
    name: "list_amenities",
    description:
      "Katalog udogodnień tego hotelu (id, etykieta PL/EN, ikona) wraz z listą dozwolonych wartości ikon.",
    input_schema: toInputSchema(z.strictObject({})),
  },
  {
    name: "get_hotel_info",
    description:
      "Aktualne ustawienia hotelu (nazwa, kolor, Wi-Fi, godziny, kontakt, adres, link do mapy, slug). Użyj przed update_hotel_settings — ta akcja podmienia cały obiekt.",
    input_schema: toInputSchema(z.strictObject({})),
  },
  {
    name: "list_room_section_templates",
    description: "Sekcje szablonu pokoi tego hotelu (id, tytuł PL, ikona, widoczność).",
    input_schema: toInputSchema(z.strictObject({})),
  },
  {
    name: "list_hotel_sections",
    description: "Sekcje hotelu — recepcja, śniadanie, parking (id, tytuł PL, ikona, widoczność).",
    input_schema: toInputSchema(z.strictObject({})),
  },
  {
    name: "get_section",
    description:
      "Pełna treść jednej sekcji (szablon, nadpisanie lub dodatkowa): tytuł/treść PL+EN, ikona, widoczność. Wywołaj przed edycją lub nadpisaniem sekcji.",
    input_schema: toInputSchema(uuidInput("id")),
  },
  {
    name: "list_arrival_steps",
    description:
      "Kroki dojazdu hotelowego (id, tytuł PL, widoczność, photoUrl — potrzebne do round-trip przy edycji).",
    input_schema: toInputSchema(z.strictObject({})),
  },
  {
    name: "get_arrival_step",
    description:
      "Pełna treść jednego kroku dojazdu (dowolny zakres): tytuł/treść PL+EN, photoUrl. Wywołaj przed edycją — i przekaż photoUrl z powrotem BEZ ZMIAN.",
    input_schema: toInputSchema(uuidInput("id")),
  },
];

export const PANEL_READ_TOOLS = new Set(readToolSpecs.map((tool) => tool.name));

export const panelTools: Anthropic.Tool[] = [
  navigateTool,
  duplicateRoomTool,
  proposeMutationTool,
  ...readToolSpecs,
];

export const publicTools: Anthropic.Tool[] = [navigateTool];

/** Execute one read-only panel tool with a validated input. */
export async function executeReadTool(
  name: string,
  rawInput: unknown,
  context: PanelContext,
): Promise<unknown> {
  const hotelId = context.hotel.id;
  const input = (rawInput ?? {}) as Record<string, unknown>;

  switch (name) {
    case "list_rooms":
      return { rooms: await listRoomsForPanel(hotelId) };
    case "get_room": {
      const roomId = z.string().uuid().safeParse(input.roomId);
      if (!roomId.success) return { error: "INVALID_INPUT: roomId musi być uuid" };
      const detail = await getRoomDetailForPanel(hotelId, roomId.data);
      return detail ?? { error: "ROOM_NOT_FOUND: taki pokój nie istnieje w tym hotelu" };
    }
    case "list_amenities":
      return {
        amenities: await listAmenitiesForPanel(hotelId),
        validIcons: SECTION_ICONS.map((icon) => icon.value),
      };
    case "get_hotel_info":
      return getHotelInfoShape(context);
    case "list_room_section_templates":
      return { templates: await listSectionTemplatesForPanel(hotelId) };
    case "list_hotel_sections":
      return { sections: await listHotelSectionsForPanel(hotelId) };
    case "get_section": {
      const id = z.string().uuid().safeParse(input.id);
      if (!id.success) return { error: "INVALID_INPUT: id musi być uuid" };
      const section = await getSectionByIdForPanel(hotelId, id.data);
      return section ?? { error: "SECTION_NOT_FOUND: taka sekcja nie istnieje w tym hotelu" };
    }
    case "list_arrival_steps":
      return { steps: await listArrivalStepsForPanel(hotelId) };
    case "get_arrival_step": {
      const id = z.string().uuid().safeParse(input.id);
      if (!id.success) return { error: "INVALID_INPUT: id musi być uuid" };
      const step = await getArrivalStepByIdForPanel(hotelId, id.data);
      return step ?? { error: "STEP_NOT_FOUND: taki krok nie istnieje w tym hotelu" };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
