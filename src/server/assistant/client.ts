/**
 * Lazy Anthropic SDK client pointed at the configured compatible endpoint,
 * plus a per-process call queue.
 *
 * The z.ai GLM Coding Plan reportedly allows a single concurrent connection,
 * so assistant requests are serialized within this process. Same caveat as
 * src/lib/rate-limit.ts: module memory is PER PROCESS — multiple serverless
 * instances can still race. For real multi-user traffic, move the key to the
 * pay-per-token platform API (or Anthropic) via env; the queue then merely
 * costs a little latency.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AssistantConfig } from "./config";

let cached: Anthropic | null = null;
let cachedKey = "";

export function getAssistantClient(config: AssistantConfig): Anthropic {
  const cacheKey = `${config.baseUrl}:${config.authMode}:${config.apiKey}`;
  if (!cached || cachedKey !== cacheKey) {
    cached = new Anthropic(
      config.authMode === "apiKey"
        ? { baseURL: config.baseUrl, apiKey: config.apiKey }
        : { baseURL: config.baseUrl, authToken: config.apiKey },
    );
    cachedKey = cacheKey;
  }
  return cached;
}

let queue: Promise<unknown> = Promise.resolve();

/** Serialize assistant calls in this process (see file comment). */
export function enqueueAssistantCall<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
}
