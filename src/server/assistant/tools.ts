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
 * are hotelId-scoped via src/server/queries/panel.ts.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { NAV_INTENTS } from "@/lib/assistant/nav";
import { proposalPayloadSchema } from "@/lib/assistant/proposals";
import { SECTION_ICONS } from "@/lib/icons";
import {
  listAmenitiesForPanel,
  listRoomsForPanel,
  type PanelContext,
} from "@/server/queries/panel";

/** Convert a zod schema into an Anthropic-compatible input_schema object. */
function toInputSchema(schema: z.ZodType): Anthropic.Tool["input_schema"] {
  const json = z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
  // $schema is a zod artifact the provider does not need.
  delete json.$schema;
  return json as Anthropic.Tool["input_schema"];
}

const navigateInput = z.strictObject({
  intent: z.enum(NAV_INTENTS).describe("Dokąd przejść: home, pricing, contact, login, register"),
});

export const navigateTool: Anthropic.Tool = {
  name: "navigate",
  description:
    "Przenosi użytkownika na stronę serwisu Hotel Info. Wywołuj zawsze, gdy użytkownik chce przejść do logowania, rejestracji, cennika, kontaktu lub strony głównej — zamiast podawać adres w treści odpowiedzi. Jedno wywołanie na jedną stronę.",
  input_schema: toInputSchema(navigateInput),
};

export const proposeMutationTool: Anthropic.Tool = {
  name: "propose_mutation",
  description:
    "Przygotuj zmianę do zatwierdzenia przez użytkownika (nowy pokój, krok dojazdu, udogodnienie, ustawienia hotelu). Nic nie zapisujesz — użytkownik zobaczy kartę z danymi i przycisk Zapisz. Przed propozycją EDYCJI istniejącego obiektu pobierz najpierw jego id narzędziem list_*.",
  input_schema: toInputSchema(proposalPayloadSchema),
};

export const panelTools: Anthropic.Tool[] = [
  navigateTool,
  proposeMutationTool,
  {
    name: "list_rooms",
    description:
      "Lista wszystkich pokoi tego hotelu (także nieopublikowanych) z id, numerem, adresem, nazwą PL/EN, piętrem i liczbą osób.",
    input_schema: toInputSchema(z.strictObject({})),
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
      "Aktualne ustawienia hotelu (nazwa, kolor, Wi-Fi, godziny zameldowania, kontakt, adres, slug). Użyj przed propozycją update_hotel_settings — ta akcja podmienia cały obiekt, więc propozycja musi zawierać WSZYSTKIE pola z aktualnymi wartościami.",
    input_schema: toInputSchema(z.strictObject({})),
  },
];

export const publicTools: Anthropic.Tool[] = [navigateTool];

/** Execute one read-only panel tool against the scoped hotel. */
export async function executeReadTool(
  name: string,
  context: PanelContext,
): Promise<unknown> {
  const hotel = context.hotel;
  switch (name) {
    case "list_rooms":
      return { rooms: await listRoomsForPanel(hotel.id) };
    case "list_amenities":
      return {
        amenities: await listAmenitiesForPanel(hotel.id),
        validIcons: SECTION_ICONS.map((icon) => icon.value),
      };
    case "get_hotel_info":
      return {
        slug: hotel.slug,
        name: hotel.name,
        brandColor: hotel.brandColor,
        wifiSsid: hotel.wifiSsid,
        wifiPassword: hotel.wifiPassword,
        checkinFrom: hotel.checkinFrom,
        checkoutUntil: hotel.checkoutUntil,
        phone: hotel.phone,
        email: hotel.email,
        addressLine: hotel.addressLine,
      };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
