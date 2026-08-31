"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { GuestHeader, useGuestLocale } from "@/components/guest/guest-locale";
import { GuestFooter, GroupLabel } from "@/components/guest/guest-parts";
import { pick } from "@/lib/i18n";
import { gs } from "@/components/guest/strings";
import type { ArrivalPagePayload } from "@/components/guest/types";

/**
 * The shareable arrival guide (/{hotel}/dojazd): map pin first — one tap
 * into navigation for a guest en route — then numbered steps for the
 * tricky final meters (gate codes, key boxes, weird entrances).
 * Same print-ephemera language as the other guest pages; the step
 * numerals echo the door-plate mono style because order is the content.
 */
export function GuestArrivalPage({ payload }: { payload: ArrivalPagePayload }) {
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
            {gs("arrivalTitle", locale)}
          </h1>
          <p className="font-mono text-xs tracking-wide text-neutral-400">
            {[name, hotel.addressLine].filter(Boolean).join(" · ")}
          </p>
        </div>

        {payload.mapUrl && (
          <a
            href={payload.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-(--hotel-primary)/40 bg-(--hotel-primary)/[0.07] px-4 py-3.5 font-semibold text-(--hotel-primary) transition-colors hover:bg-(--hotel-primary)/10"
          >
            <MapPin className="size-4" aria-hidden />
            {gs("openInMaps", locale)}
          </a>
        )}

        <section className="space-y-3">
          <GroupLabel>{gs("arrivalSteps", locale)}</GroupLabel>
          <ol className="space-y-3">
            {payload.steps.map((step, index) => {
              const title = pick(step.title, locale);
              const body = pick(step.body, locale);
              return (
                <li key={index} className="rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-2xl font-bold leading-none text-(--hotel-primary)">
                      {index + 1}
                    </span>
                    {title && (
                      <h2 className="font-semibold text-neutral-900">{title}</h2>
                    )}
                  </div>
                  {body && (
                    <p className="mt-2.5 text-[15px] leading-relaxed whitespace-pre-line text-neutral-600">
                      {body}
                    </p>
                  )}
                  {step.photoUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={step.photoUrl}
                      alt={title}
                      className="mt-3 w-full rounded-lg border border-neutral-200 object-cover"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {hotel.phone && (
          <a
            href={`tel:${hotel.phone.replace(/[^+\d]/g, "")}`}
            className="flex items-center gap-2.5 text-neutral-700 transition-colors hover:text-(--hotel-primary)"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--hotel-primary)/10 text-(--hotel-primary)">
              <Phone className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-xs font-medium text-neutral-500">
                {gs("callUs", locale)}
              </span>
              <span className="font-mono text-base font-semibold">{hotel.phone}</span>
            </span>
          </a>
        )}

        <p>
          <Link
            href={`/${hotel.slug}`}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-(--hotel-primary)"
          >
            {gs("backToHotel", locale)}
          </Link>
        </p>

        <GuestFooter hotelName={name} />
      </main>
    </div>
  );
}
