import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, isReservedSlug, isValidSlug, slugify } from "./slug";

describe("slugify", () => {
  it("strips Polish diacritics", () => {
    expect(slugify("Willa nad Jeziorem Łańskim")).toBe("willa-nad-jeziorem-lanskim");
    expect(slugify("ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ")).toBe("acelnoszz-acelnoszz");
  });

  it("collapses non-alphanumerics into single dashes and trims", () => {
    expect(slugify("  Hotel --- Leśny!  ")).toBe("hotel-lesny");
    expect(slugify("A&B/C")).toBe("a-b-c");
  });

  it("lowercases and caps length at 60", () => {
    expect(slugify("GRAND HOTEL")).toBe("grand-hotel");
    expect(slugify("a".repeat(80)).length).toBe(60);
  });

  it("returns empty string for input with no usable characters", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("")).toBe("");
  });
});

describe("reserved slugs", () => {
  it("blocks static routes and infra paths", () => {
    expect(isReservedSlug("panel")).toBe(true);
    expect(isReservedSlug("api")).toBe(true);
    expect(isReservedSlug("robots.txt")).toBe(true);
    expect(RESERVED_SLUGS.has("cennik")).toBe(true);
  });

  it("allows normal hotel slugs", () => {
    expect(isReservedSlug("willa-mazury")).toBe(false);
    expect(isReservedSlug("hotel123")).toBe(false);
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase letters, digits and inner dashes", () => {
    expect(isValidSlug("ab")).toBe(true);
    expect(isValidSlug("hotel-12")).toBe(true);
  });

  it("rejects short, uppercase, spaced and dash-edged values", () => {
    expect(isValidSlug("a")).toBe(false);
    expect(isValidSlug("Hotel")).toBe(false);
    expect(isValidSlug("ho tel")).toBe(false);
    expect(isValidSlug("-hotel")).toBe(false);
    expect(isValidSlug("hotel-")).toBe(false);
  });
});
