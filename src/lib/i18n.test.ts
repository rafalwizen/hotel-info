import { describe, expect, it } from "vitest";
import { pick } from "./i18n";

describe("pick", () => {
  it("returns the requested locale when present", () => {
    expect(pick({ pl: "Dzień", en: "Day" }, "en")).toBe("Day");
    expect(pick({ pl: "Dzień", en: "Day" }, "pl")).toBe("Dzień");
  });

  it("falls back to the other locale when requested is empty", () => {
    expect(pick({ pl: "Dzień", en: "" }, "en")).toBe("Dzień");
    expect(pick({ pl: "", en: "Day" }, "pl")).toBe("Day");
  });

  it("treats whitespace-only as empty", () => {
    expect(pick({ pl: "Dzień", en: "   " }, "en")).toBe("Dzień");
  });

  it("returns empty string when both locales are empty or value is null", () => {
    expect(pick({ pl: "", en: "" }, "pl")).toBe("");
    expect(pick(null, "pl")).toBe("");
    expect(pick(undefined, "en")).toBe("");
  });
});
