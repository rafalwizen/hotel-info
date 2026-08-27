import { describe, expect, it } from "vitest";
import {
  extraSections,
  mergeSections,
  templateStates,
  type SectionData,
} from "./sections";

const section = (overrides: Partial<SectionData> & { id: string }): SectionData => ({
  basedOnId: null,
  title: { pl: `T-${overrides.id}`, en: "" },
  body: { pl: `B-${overrides.id}`, en: "" },
  icon: "info",
  enabled: true,
  sortOrder: 0,
  ...overrides,
});

describe("mergeSections", () => {
  const t1 = section({ id: "t1", sortOrder: 1 });
  const t2 = section({ id: "t2", sortOrder: 2 });

  it("returns enabled templates in sortOrder", () => {
    expect(mergeSections([t2, t1], []).map((s) => s.id)).toEqual(["t1", "t2"]);
  });

  it("skips disabled templates entirely", () => {
    const disabled = section({ id: "t3", sortOrder: 3, enabled: false });
    expect(mergeSections([t1, disabled], []).map((s) => s.id)).toEqual(["t1"]);
  });

  it("replaces a template with its override, keeping the template position", () => {
    const override = section({
      id: "o1",
      basedOnId: "t1",
      sortOrder: 99,
      title: { pl: "Nadpisane", en: "" },
    });
    const merged = mergeSections([t1, t2], [override]);
    expect(merged.map((s) => s.id)).toEqual(["o1", "t2"]);
    expect(merged[0].title.pl).toBe("Nadpisane");
  });

  it("hides a template when the override is disabled", () => {
    const hidden = section({ id: "o1", basedOnId: "t1", enabled: false, sortOrder: 99 });
    expect(mergeSections([t1, t2], [hidden]).map((s) => s.id)).toEqual(["t2"]);
  });

  it("appends room-only extras at the end ordered by sortOrder", () => {
    const e1 = section({ id: "e1", sortOrder: 5 });
    const e2 = section({ id: "e2", sortOrder: 4 });
    expect(mergeSections([t1], [e2, e1]).map((s) => s.id)).toEqual(["t1", "e2", "e1"]);
  });
});

describe("templateStates", () => {
  it("classifies inherited, overridden and hidden", () => {
    const t1 = section({ id: "t1" });
    const t2 = section({ id: "t2" });
    const t3 = section({ id: "t3" });
    const override = section({ id: "o2", basedOnId: "t2" });
    const hiddenOverride = section({ id: "o3", basedOnId: "t3", enabled: false });

    const states = templateStates([t1, t2, t3], [override, hiddenOverride]);
    expect(states.map((s) => s.state)).toEqual(["inherited", "overridden", "hidden"]);
    expect(states[1].override?.id).toBe("o2");
    expect(states[0].override).toBeNull();
  });
});

describe("extraSections", () => {
  it("returns only basedOnId-null sections, sorted", () => {
    const e1 = section({ id: "e1", sortOrder: 2 });
    const e2 = section({ id: "e2", sortOrder: 1 });
    const override = section({ id: "o1", basedOnId: "t1" });
    expect(extraSections([e1, override, e2]).map((s) => s.id)).toEqual(["e2", "e1"]);
  });
});
