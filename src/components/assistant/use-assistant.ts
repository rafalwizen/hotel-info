"use client";

/**
 * Client state machine for the assistant widget: optimistic bubbles, SSE
 * stream parsing (src/lib/assistant/sse.ts), inline error/rate-limit states
 * and history persistence (public: localStorage, panel: sessionStorage).
 * `messagesRef` is kept in sync synchronously so persist() in finally sees
 * the final conversation even before React commits.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { consumeSSEBuffer } from "@/lib/assistant/sse";
import {
  clearHistory,
  loadHistory,
  saveHistory,
  trimHistory,
} from "@/lib/assistant/history";
import type {
  AssistantContext,
  AssistantSSEEvent,
  ChatMessage,
  Proposal,
} from "@/lib/assistant/types";

export type NavAction = { href: string; label: string };

export type AssistantMessage = ChatMessage & {
  nav?: NavAction[];
  proposalIds?: string[];
  streaming?: boolean;
  error?: boolean;
};

const MAX_INPUT_CHARS = 2000;

export function useAssistant(context: AssistantContext) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  // Proposals live in memory only: persisted chat text survives a reload,
  // but a pending card referencing possibly-stale data does not.
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [rateLimitedSec, setRateLimitedSec] = useState<number | null>(null);

  const messagesRef = useRef<AssistantMessage[]>([]);
  const streamingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const commit = useCallback((next: AssistantMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const patchLast = useCallback(
    (
      id: string,
      patch: Partial<AssistantMessage> | ((m: AssistantMessage) => Partial<AssistantMessage>),
    ) => {
      commit(
        messagesRef.current.map((m) =>
          m.id === id ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m,
        ),
      );
    },
    [commit],
  );

  // Restore persisted history after hydration (storage is client-only, so
  // the initial server render must start empty); abort on unmount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    commit(
      loadHistory(context).map((m) => ({ id: m.id, role: m.role, text: m.text, nav: m.nav })),
    );
    return () => {
      abortRef.current?.abort();
    };
  }, [commit, context]);

  const persist = useCallback(() => {
    saveHistory(
      context,
      messagesRef.current
        .filter((m) => !m.error && m.text.trim().length > 0)
        .map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text.slice(0, MAX_INPUT_CHARS),
          nav: m.nav,
        })),
    );
  }, [context]);

  const finish = useCallback(
    (id: string, text: string) => {
      patchLast(id, { text, error: true, streaming: false });
      setStreaming(false);
      streamingRef.current = false;
    },
    [patchLast],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_INPUT_CHARS);
      if (!text || streamingRef.current) return;

      const previous = messagesRef.current
        .filter((m) => !m.error && m.text.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.text }));
      const assistantId = nanoid(8);

      setRateLimitedSec(null);
      commit([
        ...messagesRef.current,
        { id: nanoid(8), role: "user", text },
        { id: assistantId, role: "assistant", text: "", streaming: true },
      ]);
      setStreaming(true);
      streamingRef.current = true;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const payload = trimHistory([...previous, { role: "user", content: text }], {
          max: 16,
          maxTotalChars: 24_000,
        });
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: payload }),
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 429) {
            setRateLimitedSec(Number(res.headers.get("retry-after")) || 60);
            finish(assistantId, "Wysyłasz wiadomości zbyt często. Odczekaj chwilę i spróbuj ponownie.");
          } else if (res.status === 501) {
            finish(assistantId, "Asystent jest obecnie niedostępny.");
          } else {
            finish(assistantId, "Nie udało się wysłać wiadomości. Spróbuj ponownie.");
          }
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          finish(assistantId, "Nie udało się nawiązać połączenia z asystentem.");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let finished = false;

        const handle = (event: AssistantSSEEvent) => {
          switch (event.type) {
            case "text_delta": {
              const delta = event.text;
              patchLast(assistantId, (m) => ({ text: m.text + delta }));
              break;
            }
            case "nav_action": {
              const action = { href: event.href, label: event.label };
              patchLast(assistantId, (m) => ({ nav: [...(m.nav ?? []), action] }));
              break;
            }
            case "proposal": {
              const proposal = event.proposal;
              setProposals((prev) => [...prev, proposal]);
              patchLast(assistantId, (m) => ({
                proposalIds: [...(m.proposalIds ?? []), proposal.id],
              }));
              break;
            }
            case "done":
              finished = true;
              patchLast(assistantId, { streaming: false });
              break;
            case "error": {
              const message = event.message;
              finished = true;
              finish(assistantId, message);
              break;
            }
            default:
              // Unknown event types are ignored for forward compatibility.
              break;
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const { events, rest } = consumeSSEBuffer(buffer + decoder.decode(value, { stream: true }));
          buffer = rest;
          for (const ev of events) {
            try {
              handle(JSON.parse(ev.data) as AssistantSSEEvent);
            } catch {
              /* skip malformed frame */
            }
          }
        }

        if (!finished) {
          // Stream ended without a terminal event (proxy cut, deploy).
          patchLast(assistantId, (m) =>
            m.text.trim()
              ? { streaming: false }
              : { text: "Połączenie zostało przerwane. Spróbuj ponownie.", error: true, streaming: false },
          );
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Panel closed / unmounted — finalize whatever arrived.
          patchLast(assistantId, (m) =>
            m.text.trim()
              ? { streaming: false }
              : { text: "Przerwano.", error: true, streaming: false },
          );
        } else {
          finish(assistantId, "Przepraszam, chwilowo nie mogę odpowiedzieć. Spróbuj ponownie za chwilę.");
        }
      } finally {
        setStreaming(false);
        streamingRef.current = false;
        if (abortRef.current === controller) abortRef.current = null;
        persist();
      }
    },
    [commit, finish, patchLast, persist],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const setProposalStatus = useCallback((id: string, status: "saved" | "rejected") => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    commit([]);
    setProposals([]);
    setRateLimitedSec(null);
    clearHistory(context);
  }, [commit, context]);

  return { messages, proposals, streaming, rateLimitedSec, send, stop, clear, setProposalStatus };
}

export type AssistantController = ReturnType<typeof useAssistant>;
