"use client";

import { cn } from "@/lib/utils";
import type { AssistantMessage } from "./use-assistant";

/** One chat bubble; `children` (nav buttons, proposal cards) render under it. */
export function MessageBubble({
  message,
  children,
}: {
  message: AssistantMessage;
  children?: React.ReactNode;
}) {
  const isUser = message.role === "user";

  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser && "rounded-br-md bg-primary text-primary-foreground",
            !isUser && !message.error && "rounded-bl-md bg-muted text-foreground",
            !isUser && message.error && "rounded-bl-md border border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {message.text ||
            (message.streaming ? (
              <span
                className="inline-block size-3 animate-pulse rounded-full bg-muted-foreground/50"
                aria-label="Asystent pisze…"
              />
            ) : null)}
          {message.streaming && message.text ? (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-current align-text-bottom" />
          ) : null}
        </div>
      </div>
      {children ? <div className="flex flex-col items-start gap-1.5">{children}</div> : null}
    </div>
  );
}
