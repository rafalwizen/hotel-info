import type { Localized } from "@/db/schema";
import type { Locale } from "@/lib/i18n";

/**
 * Client-safe payloads for guest pages. Both locales are included — the
 * server renders the hotel's default locale (SEO/OG), the PL|EN toggle
 * swaps content client-side without extra requests, keeping ISR intact.
 */

export type GuestHotelInfo = {
  slug: string;
  name: Localized;
  brandColor: string;
  defaultLocale: Locale;
  wifiSsid: string;
  wifiPassword: string;
  checkinFrom: string;
  checkoutUntil: string;
  phone: string;
  addressLine: string;
};

export type GuestSection = {
  icon: string;
  title: Localized;
  body: Localized;
};

export type GuestAmenity = {
  icon: string;
  label: Localized;
};

export type GuestRoomLink = {
  number: string;
  slug: string;
  name: Localized;
  floor: number | null;
  maxGuests: number;
};

/** Payload of /(guest)/[hotel] — hotel overview (lobby QR target). */
export type HotelPagePayload = {
  hotel: GuestHotelInfo;
  rooms: GuestRoomLink[];
  sections: GuestSection[];
};

/** Payload of /(guest)/[hotel]/[room] — the sticker QR target. */
export type RoomPagePayload = {
  hotel: GuestHotelInfo;
  room: GuestRoomLink;
  sections: GuestSection[];
  amenities: GuestAmenity[];
  hotelSections: GuestSection[];
};
