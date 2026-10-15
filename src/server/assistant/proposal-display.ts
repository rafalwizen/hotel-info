/**
 * Server-side display enrichment for proposals: resolves human-readable
 * labels and validates id references against the database BEFORE a card is
 * emitted, so the card never shows a bare uuid and the model gets an error
 * it can self-correct from (e.g. unknown amenity ids, missing room) instead
 * of a card that would only fail at save time.
 */

import type { ProposalDisplay } from "@/lib/assistant/types";
import type { ProposalPayload } from "@/lib/assistant/proposals";
import {
  amenityLabelsByIds,
  countArrivalOverridesForPanel,
  countSectionOverridesForPanel,
  getArrivalStepByIdForPanel,
  getRoomLabelForPanel,
  getSectionByIdForPanel,
  listAmenitiesForPanel,
  listHotelSectionsForPanel,
  type PanelContext,
} from "@/server/queries/panel";

export type EnrichedProposal = { display?: ProposalDisplay; error?: string };

const roomError = "ROOM_NOT_FOUND: taki pokój nie istnieje w tym hotelu";

export async function enrichProposalDisplay(
  panel: PanelContext,
  payload: ProposalPayload,
): Promise<EnrichedProposal> {
  const hotelId = panel.hotel.id;
  const display: ProposalDisplay = {};

  switch (payload.action) {
    // --- rooms (every member targets a room) ---
    case "create_room":
      return { display };

    case "duplicate_room": {
      const label = await getRoomLabelForPanel(hotelId, payload.input.sourceRoomId);
      if (!label) return { error: `SOURCE_${roomError}` };
      display.targetLabel = label;
      return { display };
    }

    case "update_room":
    case "set_room_published":
    case "set_room_amenities":
    case "upsert_room_section":
    case "override_room_section":
    case "hide_room_section":
    case "reset_room_section":
    case "upsert_room_arrival_step":
    case "override_room_arrival_step":
    case "hide_room_arrival_step":
    case "reset_room_arrival_step": {
      const label = await getRoomLabelForPanel(hotelId, payload.roomId);
      if (!label) return { error: roomError };
      display.targetLabel = label;

      if (payload.action === "set_room_amenities") {
        // setRoomAmenitiesAction silently drops unknown ids — reject them
        // here so the model re-lists the catalog instead of losing items.
        const catalog = await listAmenitiesForPanel(hotelId);
        const known = new Set(catalog.map((amenity) => amenity.id));
        const unknown = payload.amenityIds.filter((id) => !known.has(id));
        if (unknown.length > 0) {
          return { error: `UNKNOWN_AMENITY_IDS: ${unknown.join(", ")}` };
        }
        const labels = await amenityLabelsByIds(hotelId, payload.amenityIds);
        display.amenityLabels = payload.amenityIds.map((id) => labels.get(id) ?? id);
      }

      return { display };
    }

    // --- section deletes / targets ---
    case "delete_template_section": {
      const section = await getSectionByIdForPanel(hotelId, payload.sectionId);
      if (!section || section.roomId !== null) {
        return { error: "SECTION_NOT_FOUND: taka sekcja szablonu nie istnieje" };
      }
      display.targetLabel = `Szablon: ${section.title.pl}`;
      display.overrideCount = await countSectionOverridesForPanel(hotelId, payload.sectionId);
      return { display };
    }

    case "delete_hotel_section": {
      const [section] = (await listHotelSectionsForPanel(hotelId)).filter(
        (item) => item.id === payload.sectionId,
      );
      if (!section) return { error: "SECTION_NOT_FOUND: taka sekcja hotelu nie istnieje" };
      display.targetLabel = section.title.pl;
      return { display };
    }

    case "delete_room_section": {
      const section = await getSectionByIdForPanel(hotelId, payload.sectionId);
      if (!section || section.roomId === null) {
        return { error: "SECTION_NOT_FOUND: taka sekcja pokoju nie istnieje" };
      }
      const roomLabel = await getRoomLabelForPanel(hotelId, section.roomId);
      display.targetLabel = `${section.title.pl}${roomLabel ? ` (${roomLabel})` : ""}`;
      return { display };
    }

    // --- arrival ---
    case "delete_arrival_step": {
      const step = await getArrivalStepByIdForPanel(hotelId, payload.stepId);
      if (!step || step.roomId !== null) {
        return { error: "STEP_NOT_FOUND: taki krok dojazdu hotelowego nie istnieje" };
      }
      display.targetLabel = `Krok: ${step.title.pl}`;
      display.overrideCount = await countArrivalOverridesForPanel(hotelId, payload.stepId);
      return { display };
    }

    case "delete_room_arrival_step": {
      const step = await getArrivalStepByIdForPanel(hotelId, payload.stepId);
      if (!step || step.roomId === null) {
        return { error: "STEP_NOT_FOUND: taki krok dojazdu pokoju nie istnieje" };
      }
      const roomLabel = await getRoomLabelForPanel(hotelId, step.roomId);
      display.targetLabel = `${step.title.pl}${roomLabel ? ` (${roomLabel})` : ""}`;
      return { display };
    }

    // --- amenities & hotel (no id targets beyond optional input.id) ---
    case "upsert_arrival_step":
    case "update_arrival_map":
    case "upsert_amenity":
    case "update_hotel_settings":
      return { display };

    case "delete_amenity": {
      const catalog = await listAmenitiesForPanel(hotelId);
      const amenity = catalog.find((item) => item.id === payload.amenityId);
      if (!amenity) return { error: "AMENITY_NOT_FOUND: takie udogodnienie nie istnieje" };
      display.targetLabel = amenity.label.pl || amenity.label.en;
      return { display };
    }

    default:
      return { display };
  }
}
