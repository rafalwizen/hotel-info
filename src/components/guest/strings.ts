/**
 * Bilingual chrome copy for guest pages. Content (sections, amenities,
 * room/hotel names) comes from the DB; these are the fixed UI labels.
 */
import type { Locale } from "@/lib/i18n";

export const GUEST_STRINGS = {
  network: { pl: "Sieć", en: "Network" },
  password: { pl: "Hasło", en: "Password" },
  show: { pl: "Pokaż", en: "Show" },
  hide: { pl: "Ukryj", en: "Hide" },
  copy: { pl: "Kopiuj", en: "Copy" },
  copied: { pl: "Skopiowano", en: "Copied" },
  copyFailed: {
    pl: "Skopiuj ręcznie — przytrzymaj hasło",
    en: "Copy manually — press and hold the password",
  },
  amenities: { pl: "Wyposażenie", en: "Amenities" },
  roomGuide: { pl: "Jak korzystać z pokoju", en: "How things work" },
  aboutHotel: { pl: "Informacje o obiekcie", en: "Hotel information" },
  checkin: { pl: "Zameldowanie", en: "Check-in" },
  checkout: { pl: "Wymeldowanie", en: "Check-out" },
  phone: { pl: "Telefon", en: "Phone" },
  address: { pl: "Adres", en: "Address" },
  rooms: { pl: "Pokoje", en: "Rooms" },
  backToHotel: { pl: "Strona obiektu", en: "Hotel page" },
  floor: { pl: "piętro", en: "floor" },
  groundFloor: { pl: "parter", en: "ground floor" },
  guests: { pl: "os.", en: "guests" },
  arrivalTitle: { pl: "Jak do nas trafić", en: "How to find us" },
  arrivalHint: {
    pl: "Instrukcja krok po kroku i mapa",
    en: "Step-by-step directions and a map",
  },
  arrivalSteps: { pl: "Krok po kroku", en: "Step by step" },
  arrivalBlock: { pl: "Jak dotrzeć", en: "How to get here" },
  openInMaps: { pl: "Otwórz w Mapach", en: "Open in Maps" },
  fullGuide: { pl: "Pełna instrukcja dojazdu", en: "Full arrival guide" },
  callUs: { pl: "Zadzwoń do nas", en: "Call us" },
} as const;

export type GuestStringKey = keyof typeof GUEST_STRINGS;

/** Resolve one chrome string for the active locale. */
export function gs(key: GuestStringKey, locale: Locale): string {
  return GUEST_STRINGS[key][locale];
}
