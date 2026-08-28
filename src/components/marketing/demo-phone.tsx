"use client";

import { useState, type CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";
import { GuestHeader } from "@/components/guest/guest-locale";
import { WifiCard } from "@/components/guest/wifi-card";
import { AmenityChips, DoorPlate, HotelDetails, SectionCards } from "@/components/guest/guest-parts";
import type { GuestAmenity, GuestRoomLink, GuestSection } from "@/components/guest/types";

/**
 * Interactive demo of the guest room page, built from the REAL guest-page
 * components — the marketing mockup can never drift from the product. The
 * PL|EN toggle and the password reveal are fully functional. Demo data
 * mirrors db/seed.ts (Willa Mazury, room 101).
 */

const DEMO_ROOM: GuestRoomLink = {
  number: "101",
  slug: "101",
  name: { pl: "Pokój standardowy", en: "Standard room" },
  floor: 1,
  maxGuests: 2,
};

const DEMO_AMENITIES: GuestAmenity[] = [
  { icon: "wifi", label: { pl: "Wi-Fi", en: "Wi-Fi" } },
  { icon: "tv", label: { pl: 'Telewizor 43"', en: '43" TV' } },
  { icon: "coffee", label: { pl: "Czajnik", en: "Kettle" } },
  { icon: "shower-head", label: { pl: "Prysznic", en: "Shower" } },
];

const DEMO_SECTIONS: GuestSection[] = [
  {
    icon: "tv",
    title: { pl: "Telewizor", en: "Television" },
    body: {
      pl: "Pilot leży przy telewizorze. Lista kanałów pojawia się po przycisku LIST. Kabel HDMI jest w szufladzie biurka.",
      en: "The remote is next to the TV. The channel list appears after pressing LIST. An HDMI cable is in the desk drawer.",
    },
  },
  {
    icon: "air-vent",
    title: { pl: "Klimatyzacja", en: "Air conditioning" },
    body: {
      pl: "Steruje nią pilot ścienny przy drzwiach balkonowych. Rekomendowane 21–23°C. Prosimy wyłączać przy otwartych oknach.",
      en: "Use the wall remote by the balcony door. Recommended 21–23°C. Please switch it off when windows are open.",
    },
  },
];

const DEMO_HOTEL_SECTIONS: GuestSection[] = [
  {
    icon: "croissant",
    title: { pl: "Śniadania", en: "Breakfast" },
    body: {
      pl: "Serwujemy je 8:00–10:30 w jadalni na parterze. Prosimy zgłaszać do 21:00 dnia poprzedniego.",
      en: "Served 8:00–10:30 in the ground-floor dining room. Please order by 21:00 the day before.",
    },
  },
];

export function DemoPhone() {
  // Local state, not the guest localStorage store — this is a demo, the
  // visitor's language choice here should not leak into real guest pages.
  const [locale, setLocale] = useState<Locale>("pl");

  return (
    <div className="mx-auto w-fit">
      <div className="rounded-[2.6rem] border border-neutral-200 bg-neutral-900 p-2 shadow-2xl shadow-neutral-900/25">
        <div
          className="flex w-[320px] flex-col overflow-hidden rounded-[2.1rem] bg-white sm:w-[350px]"
          style={{ "--hotel-primary": "#0f766e" } as CSSProperties}
        >
          {/* Speaker bezel — stays put while the page scrolls below it. */}
          <div className="flex shrink-0 justify-center bg-white pt-2.5 pb-1">
            <div className="h-1.5 w-16 rounded-full bg-neutral-900/85" />
          </div>
          <div className="h-[600px] overflow-y-auto">
            <GuestHeader
              hotelName={{ pl: "Willa Mazury", en: "Mazury Villa" }}
              locale={locale}
              onLocaleChange={setLocale}
            />
            <main className="mx-auto w-full max-w-md space-y-8 px-5 pt-7 pb-10">
              <DoorPlate room={DEMO_ROOM} locale={locale} />
              <WifiCard ssid="WillaMazury-Gosc" password="mazury2026" locale={locale} />
              <AmenityChips items={DEMO_AMENITIES} locale={locale} />
              <SectionCards sections={DEMO_SECTIONS} locale={locale} />
              <HotelDetails
                slug="willa-mazury"
                checkinFrom="15:00"
                checkoutUntil="11:00"
                phone="+48 600 100 200"
                addressLine="ul. Jeziorana 12, 11-500 Wilkasy"
                sections={DEMO_HOTEL_SECTIONS}
                locale={locale}
              />
            </main>
          </div>
        </div>
      </div>
      <p className="mt-5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400">
        demo · Willa Mazury · pokój 101
      </p>
    </div>
  );
}
