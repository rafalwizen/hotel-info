/**
 * Chat history persistence and trimming for the assistant widget. Public
 * conversations survive reloads (localStorage); panel conversations are
 * per-tab (sessionStorage). Only role/text/nav survive serialization —
 * never request payloads or API responses.
 */

import type { AssistantContext, ChatMessage } from "./types";

const STORAGE_KEYS: Record<AssistantContext, string> = {
  public: "hi:assistant:public:v1",
  panel: "hi:assistant:panel:v1",
};

/** What actually gets persisted for one message. */
export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  nav?: { href: string; label: string }[];
};

type HistoryEnvelope = { v: 1; messages: StoredMessage[] };

const MAX_STORED = 30;
const MAX_MESSAGE_CHARS = 2000;

export type TrimOptions = {
  /** Newest N messages the model may see. */
  max: number;
  /** Total character budget across all messages. */
  maxTotalChars: number;
};

/**
 * Cap a conversation for the request payload: truncates single messages to
 * MAX_MESSAGE_CHARS and drops oldest messages until both limits hold. The
 * newest message is always kept.
 */
export function trimHistory<
  T extends { role: "user" | "assistant"; content: string },
>(messages: T[], options: TrimOptions): T[] {
  const capped = messages.map((m) => ({
    ...m,
    content: m.content.slice(0, MAX_MESSAGE_CHARS),
  }));

  let kept = capped.slice(-options.max);
  const budget = () => kept.reduce((sum, m) => sum + m.content.length, 0);
  while (kept.length > 1 && budget() > options.maxTotalChars) {
    kept = kept.slice(1);
  }
  return kept;
}

/** Versioned envelope for storage — corrupt input parses to null. */
export function serializeHistory(messages: StoredMessage[]): HistoryEnvelope {
  return { v: 1, messages: messages.slice(-MAX_STORED) };
}

export function parseHistory(raw: string | null): StoredMessage[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { v?: unknown }).v !== 1 ||
      !Array.isArray((parsed as { messages?: unknown }).messages)
    ) {
      return null;
    }
    const messages: StoredMessage[] = [];
    for (const item of (parsed as { messages: unknown[] }).messages) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as { id?: unknown }).id !== "string" ||
        ((item as { role?: unknown }).role !== "user" &&
          (item as { role?: unknown }).role !== "assistant") ||
        typeof (item as { text?: unknown }).text !== "string"
      ) {
        return null;
      }
      let nav: { href: string; label: string }[] | undefined;
      if ("nav" in item) {
        const rawNav = (item as { nav?: unknown }).nav;
        if (!Array.isArray(rawNav)) return null;
        nav = [];
        for (const entry of rawNav) {
          if (
            typeof entry !== "object" ||
            entry === null ||
            typeof (entry as { href?: unknown }).href !== "string" ||
            typeof (entry as { label?: unknown }).label !== "string"
          ) {
            return null;
          }
          nav.push({
            href: (entry as { href: string }).href,
            label: (entry as { label: string }).label,
          });
        }
      }
      messages.push({
        id: (item as { id: string }).id,
        role: (item as { role: "user" | "assistant" }).role,
        text: (item as { text: string }).text,
        ...(nav ? { nav } : {}),
      });
    }
    return messages.slice(-MAX_STORED);
  } catch {
    return null;
  }
}

function storageFor(context: AssistantContext): Storage | null {
  if (typeof window === "undefined") return null;
  return context === "public" ? window.localStorage : window.sessionStorage;
}

export function loadHistory(context: AssistantContext): StoredMessage[] {
  const storage = storageFor(context);
  if (!storage) return [];
  return parseHistory(storage.getItem(STORAGE_KEYS[context])) ?? [];
}

export function saveHistory(context: AssistantContext, messages: StoredMessage[]): void {
  const storage = storageFor(context);
  if (!storage) return;
  storage.setItem(STORAGE_KEYS[context], JSON.stringify(serializeHistory(messages)));
}

export function clearHistory(context: AssistantContext): void {
  const storage = storageFor(context);
  if (!storage) return;
  storage.removeItem(STORAGE_KEYS[context]);
}

/** Map persisted messages back to renderable chat messages. */
export function toChatMessages(stored: StoredMessage[]): ChatMessage[] {
  return stored.map((m) => ({ id: m.id, role: m.role, text: m.text }));
}
