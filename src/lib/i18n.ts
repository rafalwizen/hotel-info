import type { Localized } from "@/db/schema";

export type Locale = "pl" | "en";

export const LOCALES: readonly Locale[] = ["pl", "en"] as const;

/**
 * Pick a localized string with a fallback chain: requested locale first,
 * then the other locale, then empty string. Any content beats none on a
 * guest page (an empty title would render a broken card).
 */
export function pick(
  value: Localized | null | undefined,
  locale: Locale,
): string {
  if (!value) return "";
  const primary = value[locale];
  if (primary && primary.trim()) return primary;
  const fallback = locale === "pl" ? value.en : value.pl;
  return fallback && fallback.trim() ? fallback : "";
}
