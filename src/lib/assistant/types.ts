/**
 * Shared wire contract for the AI assistant: the route handler emits these
 * events as SSE and the client hook parses them. Single source of truth for
 * both sides — keep in sync when extending (e.g. panel proposals).
 */

import type { ProposalPayload } from "./proposals";

export type AssistantContext = "public" | "panel";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

/**
 * A mutation the model drafted: rendered as a confirmation card, applied
 * ONLY when the user clicks Zapisz (the client then calls the same server
 * action the regular form would). The model never holds a write path.
 */
export type ProposalStatus = "pending" | "saved" | "rejected";

/**
 * Server-resolved display metadata for the card — labels, counts and
 * validations the model must not be trusted to provide (uuids alone are
 * unreadable; amenity id sets are validated against the catalog here).
 */
export type ProposalDisplay = {
  targetLabel?: string;
  amenityLabels?: string[];
  overrideCount?: number;
};

export type Proposal = {
  id: string;
  status: ProposalStatus;
  display?: ProposalDisplay;
} & ProposalPayload;

/** Server → client SSE events (see src/lib/assistant/sse.ts for framing). */
export type AssistantSSEEvent =
  | { type: "message_start"; id: string; context: AssistantContext }
  | { type: "text_delta"; text: string }
  | { type: "nav_action"; intent: string; href: string; label: string }
  | { type: "proposal"; proposal: Proposal }
  | { type: "done"; finish: "end_turn" | "proposal" | "max_iterations" }
  | { type: "error"; message: string; retry: boolean };
