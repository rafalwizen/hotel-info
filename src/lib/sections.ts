import type { Localized } from "@/db/schema";

/**
 * Pure functions describing room content inheritance. The storage model
 * (room_sections table) keeps hotel templates (roomId NULL) and per-room
 * rows in one table; these helpers merge them for rendering and compute
 * editor states. Kept side-effect free — highest test value (Phase 7).
 */
export type SectionData = {
  id: string;
  basedOnId: string | null;
  title: Localized;
  body: Localized;
  icon: string;
  enabled: boolean;
  sortOrder: number;
};

const bySortOrder = (a: SectionData, b: SectionData) => a.sortOrder - b.sortOrder;

/**
 * Merge hotel templates with a room's overrides/extras:
 * - disabled template is never shown
 * - override with enabled=false hides the template for that room
 * - override with content replaces the template in the template's position
 * - room-only extras (basedOnId NULL) are appended at the end
 */
export function mergeSections(
  templates: SectionData[],
  roomSections: SectionData[],
): SectionData[] {
  const overridesByTemplate = new Map<string, SectionData>();
  const extras: SectionData[] = [];
  for (const section of roomSections) {
    if (section.basedOnId) overridesByTemplate.set(section.basedOnId, section);
    else extras.push(section);
  }

  const merged: SectionData[] = [];
  for (const template of [...templates].sort(bySortOrder)) {
    if (!template.enabled) continue;
    const override = overridesByTemplate.get(template.id);
    if (!override) merged.push(template);
    else if (override.enabled) merged.push(override);
  }
  merged.push(...extras.sort(bySortOrder));
  return merged;
}

export type TemplateState = "inherited" | "overridden" | "hidden";

export type TemplateWithState = {
  template: SectionData;
  override: SectionData | null;
  state: TemplateState;
};

/** Compute the per-template editor state for one room. */
export function templateStates(
  templates: SectionData[],
  roomSections: SectionData[],
): TemplateWithState[] {
  const overridesByTemplate = new Map<string, SectionData>();
  for (const section of roomSections) {
    if (section.basedOnId) overridesByTemplate.set(section.basedOnId, section);
  }
  return [...templates]
    .sort(bySortOrder)
    .map((template) => {
      const override = overridesByTemplate.get(template.id) ?? null;
      const state: TemplateState = override
        ? override.enabled
          ? "overridden"
          : "hidden"
        : "inherited";
      return { template, override, state };
    });
}

/** Room-only sections (basedOnId NULL), sorted. */
export function extraSections(roomSections: SectionData[]): SectionData[] {
  return roomSections
    .filter((s) => !s.basedOnId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
