/**
 * Server-side display enrichment for proposals: resolves human-readable
 * labels and validates id references against the database BEFORE a card is
 * emitted, so the card never shows a bare uuid and the model gets an error
 * it can self-correct from (e.g. unknown amenity ids, missing source room)
 * instead of a card that would only fail at save time.
 *
 * Phase 1 covers the duplicate/create surface; the full sweep (amenity id
 * validation, delete-target labels, override counts) extends the switch.
 */

import type { ProposalDisplay } from "@/lib/assistant/types";
import type { ProposalPayload } from "@/lib/assistant/proposals";
import { getRoomLabelForPanel, type PanelContext } from "@/server/queries/panel";

export type EnrichedProposal = { display?: ProposalDisplay; error?: string };

export async function enrichProposalDisplay(
  panel: PanelContext,
  payload: ProposalPayload,
): Promise<EnrichedProposal> {
  const display: ProposalDisplay = {};

  switch (payload.action) {
    case "duplicate_room": {
      const label = await getRoomLabelForPanel(panel.hotel.id, payload.sourceRoomId);
      if (!label) return { error: "SOURCE_ROOM_NOT_FOUND: taki pokój nie istnieje w tym hotelu" };
      display.targetLabel = label;
      return { display };
    }
    default:
      return { display };
  }
}
