/**
 * POST /api/assistant — streaming chat endpoint for the AI assistant.
 *
 * Flow: config gate (501 when no key) → zod body validation → history trim
 * → context detection (session + membership → panel, else public; the client
 * never chooses) → in-memory rate limit (plain 429 before the stream opens)
 * → SSE stream: message_start / text_delta / nav_action / proposal / done /
 * error. The provider call runs a manual tool-use loop (no SDK beta
 * features — the compatible endpoint would not have them) and is serialized
 * through the per-process queue (single-connection plans). Client
 * disconnects abort the upstream request via req.signal.
 *
 * Write boundary: the only write-shaped tool is propose_mutation, which
 * emits an SSE event and terminates the loop — data reaches the database
 * exclusively through the regular server action invoked by the user's
 * click on the confirmation card.
 */

import Anthropic from "@anthropic-ai/sdk";
import { nanoid } from "nanoid";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { formatSSE } from "@/lib/assistant/sse";
import { resolveNav } from "@/lib/assistant/nav";
import { proposalPayloadSchema } from "@/lib/assistant/proposals";
import { trimHistory } from "@/lib/assistant/history";
import type { AssistantContext } from "@/lib/assistant/types";
import { getAssistantConfig, type AssistantConfig } from "@/server/assistant/config";
import { enqueueAssistantCall, getAssistantClient } from "@/server/assistant/client";
import { panelSystemPrompt, publicSystemPrompt } from "@/server/assistant/prompts";
import { executeReadTool, panelTools, publicTools } from "@/server/assistant/tools";
import { getPanelContext, type PanelContext } from "@/server/queries/panel";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RATE_LIMITS = {
  public: { limit: 8, windowMs: 5 * 60_000 },
  panel: { limit: 30, windowMs: 5 * 60_000 },
} as const;
const MAX_ITERATIONS = { public: 3, panel: 6 } as const;
const MAX_NAV_ACTIONS = 3;
const PING_INTERVAL_MS = 15_000;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** Provider error → user-facing Polish message. Status-only, no detail leak. */
function toErrorEvent(err: unknown): { type: "error"; message: string; retry: boolean } {
  const status = err instanceof Anthropic.APIError ? err.status : undefined;
  if (status === 429 || status === 529) {
    return {
      type: "error",
      message: "Asystent jest chwilowo przeciążony. Spróbuj ponownie za chwilę.",
      retry: true,
    };
  }
  if (status === 401 || status === 403) {
    return { type: "error", message: "Błąd konfiguracji asystenta.", retry: false };
  }
  return {
    type: "error",
    message: "Przepraszam, chwilowo nie mogę odpowiedzieć. Spróbuj ponownie za chwilę.",
    retry: true,
  };
}

export async function POST(req: Request): Promise<Response> {
  const config = getAssistantConfig();
  if (!config) {
    return Response.json({ error: "assistant-disabled" }, { status: 501 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "invalid-body" }, { status: 400 });
  }

  // Trim, then drop leading assistant turns — the API requires a user opener.
  let conversation = trimHistory(body.messages, { max: 16, maxTotalChars: 24_000 });
  while (conversation.length > 0 && conversation[0].role !== "user") {
    conversation = conversation.slice(1);
  }
  if (conversation.length === 0) {
    return Response.json({ error: "invalid-body" }, { status: 400 });
  }

  const panel = await getPanelContext();
  const context: AssistantContext = panel ? "panel" : "public";

  const rate = RATE_LIMITS[context];
  const rateKey = panel ? `assistant:panel:${panel.userId}` : `assistant:public:${clientIp(req.headers)}`;
  const limit = rateLimit(rateKey, rate.limit, rate.windowMs);
  if (!limit.allowed) {
    return Response.json(
      { error: "rate-limited", retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec) } },
    );
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: { type: string } & Record<string, unknown>) => {
        if (closed) return;
        controller.enqueue(encoder.encode(formatSSE(event.type, event)));
      };

      const ping = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": ping\n\n"));
      }, PING_INTERVAL_MS);

      const abort = new AbortController();
      const onClientAbort = () => abort.abort();
      req.signal.addEventListener("abort", onClientAbort);

      try {
        await enqueueAssistantCall(() =>
          runConversation({ config, context, panel, conversation, send, signal: abort.signal }),
        );
      } catch (err) {
        // Client went away — nothing to deliver, close quietly.
        if (err instanceof Anthropic.APIUserAbortError) {
          /* noop */
        } else {
          send(toErrorEvent(err));
        }
      } finally {
        clearInterval(ping);
        req.signal.removeEventListener("abort", onClientAbort);
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed by cancel() */
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

type AssistantEvent = { type: string } & Record<string, unknown>;

type RunArgs = {
  config: AssistantConfig;
  context: AssistantContext;
  panel: PanelContext | null;
  conversation: { role: "user" | "assistant"; content: string }[];
  send: (event: AssistantEvent) => void;
  signal: AbortSignal;
};

/** Manual tool-use loop: stream text, execute whitelisted tools, repeat. */
async function runConversation({ config, context, panel, conversation, send, signal }: RunArgs): Promise<void> {
  const client = getAssistantClient(config);

  send({ type: "message_start", id: nanoid(10), context });

  const messages: Anthropic.MessageParam[] = conversation.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const tools = panel ? panelTools : publicTools;
  const system = panel ? panelSystemPrompt(panel.hotel) : publicSystemPrompt();
  let navCount = 0;

  for (let iteration = 0; iteration < MAX_ITERATIONS[context]; iteration++) {
    const stream = client.messages.stream(
      {
        model: config.model,
        max_tokens: 1200,
        temperature: 0,
        system,
        messages,
        tools,
      },
      { signal },
    );

    stream.on("text", (text) => send({ type: "text_delta", text }));
    const final = await stream.finalMessage();

    if (final.stop_reason !== "tool_use") {
      send({ type: "done", finish: "end_turn" });
      return;
    }

    messages.push({ role: "assistant", content: final.content });

    const results: Anthropic.ToolResultBlockParam[] = [];
    let proposalEmitted = false;

    for (const block of final.content) {
      if (block.type !== "tool_use") continue;

      if (block.name === "navigate") {
        const rawIntent = (block.input as { intent?: unknown } | undefined)?.intent;
        const intent = typeof rawIntent === "string" ? rawIntent : "";
        const nav = resolveNav(intent, context);
        if (nav && navCount < MAX_NAV_ACTIONS) {
          navCount += 1;
          send({ type: "nav_action", intent, href: nav.href, label: nav.label });
          results.push({ type: "tool_result", tool_use_id: block.id, content: "NAV_DELIVERED" });
        } else {
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            is_error: true,
            content: nav ? "NAV_LIMIT_REACHED" : "UNKNOWN_INTENT",
          });
        }
        continue;
      }

      if (block.name === "propose_mutation") {
        if (!panel) {
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            is_error: true,
            content: "NOT_AVAILABLE_IN_PUBLIC_CONTEXT",
          });
          continue;
        }
        const parsed = proposalPayloadSchema.safeParse(block.input);
        if (!parsed.success) {
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            is_error: true,
            content: `INVALID_PAYLOAD: ${parsed.error.issues[0]?.message ?? "Sprawdź dane"}`,
          });
          continue;
        }
        send({
          type: "proposal",
          proposal: { id: nanoid(10), status: "pending", ...parsed.data },
        });
        proposalEmitted = true;
        results.push({ type: "tool_result", tool_use_id: block.id, content: "PROPOSAL_DELIVERED" });
        continue;
      }

      if (panel && (block.name === "list_rooms" || block.name === "list_amenities" || block.name === "get_hotel_info")) {
        const data = await executeReadTool(block.name, panel);
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(data),
        });
        continue;
      }

      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        is_error: true,
        content: `Unknown tool: ${block.name}`,
      });
    }

    if (proposalEmitted) {
      // Terminal: the card carries the confirmation copy — no extra model
      // turn, saving provider credits.
      send({ type: "done", finish: "proposal" });
      return;
    }

    messages.push({ role: "user", content: results });
  }

  send({ type: "done", finish: "max_iterations" });
}
