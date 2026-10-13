import { describe, expect, it } from "vitest";
import { consumeSSEBuffer, formatSSE } from "./sse";

describe("formatSSE", () => {
  it("frames an event with its type and single-line JSON data", () => {
    expect(formatSSE("text_delta", { type: "text_delta", text: "hi" })).toBe(
      `event: text_delta\ndata: {"type":"text_delta","text":"hi"}\n\n`,
    );
  });

  it("never emits raw newlines inside data", () => {
    const framed = formatSSE("text_delta", { type: "text_delta", text: "a\nb" });
    expect(framed.split("\n")).toHaveLength(4); // event line, data line, empty, empty
  });
});

describe("consumeSSEBuffer", () => {
  it("parses complete events and keeps a trailing partial block as rest", () => {
    const chunk =
      formatSSE("message_start", { type: "message_start", id: "1" }) +
      `event: text_delta\ndata: {"type":"text_delta","text":"he`;
    const { events, rest } = consumeSSEBuffer(chunk);

    expect(events).toEqual([
      { event: "message_start", data: `{"type":"message_start","id":"1"}` },
    ]);
    expect(rest).toBe(`event: text_delta\ndata: {"type":"text_delta","text":"he`);
  });

  it("reassembles an event split across two calls", () => {
    const first = consumeSSEBuffer(
      `event: text_delta\ndata: {"type":"text_delta","text":"hel`,
    );
    expect(first.events).toHaveLength(0);

    const second = consumeSSEBuffer(first.rest + `lo"}\n\n`);
    expect(second.events).toEqual([
      { event: "text_delta", data: `{"type":"text_delta","text":"hello"}` },
    ]);
    expect(second.rest).toBe("");
  });

  it("normalizes CRLF line endings", () => {
    const { events } = consumeSSEBuffer(
      `event: done\r\ndata: {"type":"done"}\r\n\r\n`,
    );
    expect(events).toEqual([{ event: "done", data: `{"type":"done"}` }]);
  });

  it("joins multi-line data fields and ignores comment lines", () => {
    const { events } = consumeSSEBuffer(
      `: ping\n\nevent: error\ndata: {"type":"error",\ndata: "message":"x"}\n\n`,
    );
    expect(events).toEqual([
      { event: "error", data: `{"type":"error",\n"message":"x"}` },
    ]);
  });

  it("defaults the event name to message when omitted", () => {
    const { events } = consumeSSEBuffer(`data: {"a":1}\n\n`);
    expect(events).toEqual([{ event: "message", data: `{"a":1}` }]);
  });

  it("skips blocks without data lines", () => {
    const { events, rest } = consumeSSEBuffer(`: keepalive\n\n`);
    expect(events).toHaveLength(0);
    expect(rest).toBe("");
  });
});
