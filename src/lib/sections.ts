import type { Localized } from "@/db/schema";

/**
 * Pure functions describing template/override/extra inheritance. Two content
 * families share this model: room sections and arrival guide steps. Kept
 * side-effect free and generic over the base shape — highest test value.
 */
export type Inheritable = {
  id: string;
  basedOnId: string | null;
  sortOrder: number;
  enabled: boolean;
};

export type SectionData = Inheritable & {
  title: Localized;
  body: Localized;
  icon: string;
};

const bySortOrder = (a: Inheritable, b: Inheritable) => a.sortOrder - b.sortOrder;

/**
 * Merge hotel templates with a room's overrides/extras:
 * - disabled template is never shown
 * - override with enabled=false hides the template for that room
 * - override with content replaces the template in the template's position
 * - room-only extras (basedOnId NULL) are appended at the end
 */
export function mergeSections<T extends Inheritable>(
  templates: T[],
  roomSections: T[],
): T[] {
  const overridesByTemplate = new Map<string, T>();
  const extras: T[] = [];
  for (const section of roomSections) {
    if (section.basedOnId) overridesByTemplate.set(section.basedOnId, section);
    else extras.push(section);
  }

  const merged: T[] = [];
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

export type TemplateWithState<T extends Inheritable> = {
  template: T;
  override: T | null;
  state: TemplateState;
};

/** Compute the per-template editor state for one room. */
export function templateStates<T extends Inheritable>(
  templates: T[],
  roomSections: T[],
): TemplateWithState<T>[] {
  const overridesByTemplate = new Map<string, T>();
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
export function extraSections<T extends Inheritable>(roomSections: T[]): T[] {
  return roomSections
    .filter((s) => !s.basedOnId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
