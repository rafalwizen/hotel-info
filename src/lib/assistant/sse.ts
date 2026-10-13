/**
 * SSE framing helpers for the assistant stream. `consumeSSEBuffer` is the
 * pure client-side parser (feed it decoded chunks, get complete events and
 * the unconsumed remainder back); `formatSSE` is the server-side emitter
 * counterpart. JSON.stringify never emits raw newlines, so `data:` stays a
 * single line by construction.
 */

export type RawSSE = { event: string; data: string };

/** Serialize one event in `event:/data:` framing terminated by a blank line. */
export function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Parse complete events out of an accumulated buffer. Handles CRLF, multi
 * `data:` lines (joined with \n) and `: comment` lines (ignored — the server
 * sends `: ping` keepalives). The trailing incomplete block is returned as
 * `rest` and must be prepended to the next chunk.
 */
export function consumeSSEBuffer(buffer: string): { events: RawSSE[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const blocks = normalized.split("\n\n");
  // Last block is either empty (buffer ended on a boundary) or incomplete.
  const rest = blocks.pop() ?? "";

  const events: RawSSE[] = [];
  for (const block of blocks) {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith(":")) continue;
      if (line.startsWith("event:")) {
        event = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).replace(/^ /, ""));
      }
    }
    if (dataLines.length > 0) {
      events.push({ event, data: dataLines.join("\n") });
    }
  }
  return { events, rest };
}
