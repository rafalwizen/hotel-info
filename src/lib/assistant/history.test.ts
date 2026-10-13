import { describe, expect, it } from "vitest";
import {
  parseHistory,
  serializeHistory,
  trimHistory,
  type StoredMessage,
} from "./history";

const msg = (id: string, role: "user" | "assistant", text: string) => ({ id, role, content: text });

describe("trimHistory", () => {
  it("drops the oldest messages beyond max", () => {
    const messages = Array.from({ length: 20 }, (_, i) => msg(`m${i}`, i % 2 ? "assistant" : "user", `x`));
    const trimmed = trimHistory(messages, { max: 16, maxTotalChars: 100_000 });
    expect(trimmed).toHaveLength(16);
    expect(trimmed[0].id).toBe("m4");
    expect(trimmed.at(-1)?.id).toBe("m19");
  });

  it("always keeps the newest message even when it alone exceeds the budget", () => {
    const trimmed = trimHistory([msg("a", "user", "x".repeat(5000))], {
      max: 16,
      maxTotalChars: 10,
    });
    expect(trimmed).toHaveLength(1);
  });

  it("truncates single messages to the per-message cap", () => {
    const trimmed = trimHistory([msg("a", "user", "y".repeat(5000))], {
      max: 16,
      maxTotalChars: 100_000,
    });
    expect(trimmed[0].content).toHaveLength(2000);
  });

  it("drops old messages until the total char budget holds", () => {
    // Each message stays under the 2000-char per-message cap so the budget
    // is what forces the drop (900×3 = 2700 > 2000 → oldest goes).
    const messages = [
      msg("a", "user", "x".repeat(900)),
      msg("b", "assistant", "x".repeat(900)),
      msg("c", "user", "x".repeat(900)),
    ];
    const trimmed = trimHistory(messages, { max: 16, maxTotalChars: 2000 });
    expect(trimmed.map((m) => m.id)).toEqual(["b", "c"]);
  });
});

describe("history round-trip", () => {
  const sample: StoredMessage[] = [
    { id: "a", role: "user", text: "Cześć" },
    { id: "b", role: "assistant", text: "Dzień dobry!", nav: [{ href: "/cennik", label: "Cennik" }] },
  ];

  it("serializes and parses back", () => {
    expect(parseHistory(JSON.stringify(serializeHistory(sample)))).toEqual(sample);
  });

  it("parses null for missing, corrupt or foreign-shape input", () => {
    expect(parseHistory(null)).toBeNull();
    expect(parseHistory("not json")).toBeNull();
    expect(parseHistory(JSON.stringify({ v: 2, messages: [] }))).toBeNull();
    expect(parseHistory(JSON.stringify({ v: 1, messages: [{ id: 1 }] }))).toBeNull();
    expect(
      parseHistory(
        JSON.stringify({ v: 1, messages: [{ id: "x", role: "system", text: "y" }] }),
      ),
    ).toBeNull();
  });

  it("caps the stored list to the newest 30 entries", () => {
    const many: StoredMessage[] = Array.from({ length: 40 }, (_, i) => ({
      id: `m${i}`,
      role: "user" as const,
      text: "x",
    }));
    const round = parseHistory(JSON.stringify(serializeHistory(many)));
    expect(round).toHaveLength(30);
    expect(round?.[0].id).toBe("m10");
  });
});
