"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssistantContext } from "@/lib/assistant/types";
import type { AssistantController } from "./use-assistant";
import { MessageBubble } from "./message-bubble";
import { NavButtons } from "./nav-buttons";
import { ProposalCard } from "./proposal-card";

const GREETINGS: Record<AssistantContext, string> = {
  public:
    "Cześć! Jestem asystentem Hotel Info. Powiem Ci, jak działa serwis, ile kosztuje i jak zacząć. W czym pomóc?",
  panel:
    "Cześć! Pomogę Ci uzupełnić dane hotelu — pokoje, udogodnienia, dojazd. Mogę przygotować zmiany, które zatwierdzisz jednym kliknięciem.",
};

const SUBTITLES: Record<AssistantContext, string> = {
  public: "Pomoc — Hotel Info",
  panel: "Asystent panelu",
};

const PLACEHOLDERS: Record<AssistantContext, string> = {
  public: "Zapytaj o cokolwiek…",
  panel: "Napisz wiadomość…",
};

const MAX_INPUT_CHARS = 2000;

/** Hand-rolled chat overlay (no dialog primitive in the project yet). */
export function ChatPanel({
  context,
  assistant,
  onClose,
}: {
  context: AssistantContext;
  assistant: AssistantController;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nearBottomRef = useRef(true);

  // Escape closes; the input gets focus on open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Autoscroll only while the user is pinned near the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [assistant.messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || assistant.streaming) return;
    setDraft("");
    void assistant.send(text);
    inputRef.current?.focus();
  };

  return (
    <div
      role="dialog"
      aria-label="Asystent AI"
      className="fixed inset-x-2 bottom-2 top-16 z-50 flex flex-col overflow-hidden rounded-xl border bg-background shadow-xl sm:inset-auto sm:bottom-20 sm:right-4 sm:h-[560px] sm:max-h-[80dvh] sm:w-[380px] print:hidden"
    >
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">Asystent</p>
          <p className="truncate text-xs text-muted-foreground">{SUBTITLES[context]}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={assistant.clear}
            disabled={assistant.messages.length === 0}
            aria-label="Wyczyść rozmowę"
            title="Wyczyść rozmowę"
          >
            <Trash2 aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Zamknij asystenta"
            title="Zamknij"
          >
            <X aria-hidden />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {assistant.messages.length === 0 ? (
          <MessageBubble message={{ id: "greeting", role: "assistant", text: GREETINGS[context] }} />
        ) : null}
        {assistant.messages.map((message) => (
          <MessageBubble key={message.id} message={message}>
            {message.nav && message.nav.length > 0 ? <NavButtons actions={message.nav} /> : null}
            {message.proposalIds?.map((id) => {
              const proposal = assistant.proposals.find((p) => p.id === id);
              return proposal ? (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onStatus={assistant.setProposalStatus}
                />
              ) : null;
            })}
          </MessageBubble>
        ))}
      </div>

      {assistant.rateLimitedSec !== null ? (
        <p className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
          Wysyłasz wiadomości zbyt często. Odczekaj {assistant.rateLimitedSec} s.
        </p>
      ) : null}

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            rows={1}
            maxLength={MAX_INPUT_CHARS}
            placeholder={PLACEHOLDERS[context]}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            disabled={assistant.streaming}
            className="max-h-28 min-h-9 flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={assistant.streaming || !draft.trim()}
            aria-label="Wyślij wiadomość"
          >
            {assistant.streaming ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          </Button>
        </div>
        {draft.length > 1800 ? (
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {MAX_INPUT_CHARS - draft.length}
          </p>
        ) : null}
      </div>
    </div>
  );
}
