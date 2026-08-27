/**
 * Curated icon catalog shared by admin pickers and guest pages. Values are
 * stored in DB columns (`sections.icon`, `amenities.icon`); unknown values
 * fall back to "info" at render time.
 */
export const SECTION_ICONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "info", label: "Informacja" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "tv", label: "Telewizor" },
  { value: "snowflake", label: "Klimatyzacja" },
  { value: "key", label: "Klucz / sejf" },
  { value: "bed", label: "Łóżko" },
  { value: "bath", label: "Łazienka" },
  { value: "coffee", label: "Śniadanie / kawa" },
  { value: "utensils", label: "Restauracja" },
  { value: "parking", label: "Parking" },
  { value: "phone", label: "Telefon / recepcja" },
  { value: "clock", label: "Godziny" },
  { value: "map-pin", label: "Dojazd / okolica" },
  { value: "shirt", label: "Pranie" },
  { value: "check", label: "Dostępne" },
  { value: "no-symbols", label: "Zakazy" },
] as const;

export const DEFAULT_ICON = "info";

export function isValidIcon(value: string): boolean {
  return SECTION_ICONS.some((i) => i.value === value);
}
