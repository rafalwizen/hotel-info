"use client";

import type { CSSProperties } from "react";
import { GuestHeader, useGuestLocale } from "@/components/guest/guest-locale";
import { pick } from "@/lib/i18n";
import { WifiCard } from "@/components/guest/wifi-card";
import {
  ArrivalLink,
  GuestFooter,
  HotelDetails,
  RoomsIndex,
} from "@/components/guest/guest-parts";
import type { HotelPagePayload } from "@/components/guest/types";

/**
 * Hotel overview (the lobby QR target): wifi, hotel facts with sections
 * open by default, and the rooms index. Room pages remain one tap away.
 */
export function GuestHotelPage({ payload }: { payload: HotelPagePayload }) {
  const [locale, chooseLocale] = useGuestLocale(payload.hotel.defaultLocale);
  const { hotel } = payload;
  const name = pick(hotel.name, locale) || hotel.slug;

  return (
    <div
      style={{ "--hotel-primary": hotel.brandColor } as CSSProperties}
      className="min-h-dvh bg-white text-neutral-900"
    >
      <GuestHeader hotelName={hotel.name} locale={locale} onLocaleChange={chooseLocale} />

      <main className="mx-auto w-full max-w-md space-y-8 px-5 pt-7 pb-10">
        <div className="space-y-2">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-neutral-900">
            {name}
          </h1>
          {hotel.addressLine && (
            <p className="font-mono text-xs tracking-wide text-neutral-400">{hotel.addressLine}</p>
          )}
        </div>

        <WifiCard ssid={hotel.wifiSsid} password={hotel.wifiPassword} locale={locale} />

        <HotelDetails
          slug={hotel.slug}
          checkinFrom={hotel.checkinFrom}
          checkoutUntil={hotel.checkoutUntil}
          phone={hotel.phone}
          addressLine={hotel.addressLine}
          sections={payload.sections}
          locale={locale}
          defaultOpen
        />

        {payload.arrivalGuide && <ArrivalLink hotelSlug={hotel.slug} locale={locale} />}

        <RoomsIndex hotelSlug={hotel.slug} rooms={payload.rooms} locale={locale} />

        <GuestFooter hotelName={name} />
      </main>
    </div>
  );
}
