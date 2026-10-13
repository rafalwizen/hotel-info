import { describe, expect, it } from "vitest";
import { NAV_INTENTS, NAV_TARGETS, resolveNav } from "./nav";

describe("resolveNav", () => {
  it("resolves every whitelisted intent in its own context", () => {
    for (const intent of NAV_INTENTS) {
      const target = NAV_TARGETS[intent];
      const context = target.contexts[0];
      expect(resolveNav(intent, context)).toEqual({
        href: target.href,
        label: target.label,
      });
    }
  });

  it("returns null for an unknown intent", () => {
    expect(resolveNav("admin", "public")).toBeNull();
    expect(resolveNav("", "panel")).toBeNull();
    expect(resolveNav("../../etc", "public")).toBeNull();
  });

  it("returns null when the intent is not allowed in this context", () => {
    // Panel target requested in the public context must not resolve.
    expect(resolveNav("rooms", "public")).toBeNull();
    expect(resolveNav("settings", "public")).toBeNull();
    // Public target requested in the panel context must not resolve.
    expect(resolveNav("login", "panel")).toBeNull();
    expect(resolveNav("register", "panel")).toBeNull();
  });
});
