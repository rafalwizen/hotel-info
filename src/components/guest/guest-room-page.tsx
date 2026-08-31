"use client";

import type { CSSProperties } from "react";
import { GuestHeader, useGuestLocale } from "@/components/guest/guest-locale";
import { pick } from "@/lib/i18n";
import { WifiCard } from "@/components/guest/wifi-card";
import {
  AmenityChips,
  ArrivalBlock,
  DoorPlate,
  GuestFooter,
  HotelDetails,
  SectionCards,
} from "@/components/guest/guest-parts";
import type { RoomPagePayload } from "@/components/guest/types";

/**
 * Guest room page (the QR sticker target): wifi first, then the room
 * (amenities, how things work), then the collapsible hotel block.
 * Receives both locales from the server and swaps content client-side.
 */
export function GuestRoomPage({ payload }: { payload: RoomPagePayload }) {
  const [locale, chooseLocale] = useGuestLocale(payload.hotel.defaultLocale);
  const { hotel } = payload;

  return (
    <div
      style={{ "--hotel-primary": hotel.brandColor } as CSSProperties}
      className="min-h-dvh bg-white text-neutral-900"
    >
      <GuestHeader
        hotelName={hotel.name}
        locale={locale}
        onLocaleChange={chooseLocale}
      />

      <main className="mx-auto w-full max-w-md space-y-8 px-5 pt-7 pb-10">
        <DoorPlate room={payload.room} locale={locale} />

        <WifiCard
          ssid={hotel.wifiSsid}
          password={hotel.wifiPassword}
          locale={locale}
        />

        <AmenityChips items={payload.amenities} locale={locale} />

        <ArrivalBlock hotelSlug={hotel.slug} steps={payload.arrivalSteps} locale={locale} />

        <SectionCards sections={payload.sections} locale={locale} />

        <HotelDetails
          slug={hotel.slug}
          checkinFrom={hotel.checkinFrom}
          checkoutUntil={hotel.checkoutUntil}
          phone={hotel.phone}
          addressLine={hotel.addressLine}
          sections={payload.hotelSections}
          locale={locale}
        />

        <GuestFooter hotelName={pick(hotel.name, locale) || hotel.slug} />
      </main>
    </div>
  );
}
