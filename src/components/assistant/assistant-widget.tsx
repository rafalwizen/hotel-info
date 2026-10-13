"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import type { AssistantContext } from "@/lib/assistant/types";
import { useAssistant } from "./use-assistant";
import { ChatPanel } from "./chat-panel";

/**
 * Floating assistant launcher + chat overlay. `enabled` comes from the
 * server layout (assistantEnabled()) — for statically prerendered pages the
 * flag is baked at build time, so adding the key on Vercel needs a redeploy.
 * The panel aborts the in-flight stream when closed.
 */
export function AssistantWidget({
  context,
  enabled,
}: {
  context: AssistantContext;
  enabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const assistant = useAssistant(context);

  if (!enabled) return null;

  const close = () => {
    assistant.stop();
    setOpen(false);
  };

  return (
    <>
      {open ? (
        <ChatPanel context={context} assistant={assistant} onClose={close} />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Otwórz asystenta AI"
          aria-expanded={false}
          className="fixed right-4 bottom-4 z-50 mb-[env(safe-area-inset-bottom)] flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 print:hidden"
        >
          <Bot className="size-5" aria-hidden />
        </button>
      )}
    </>
  );
}
