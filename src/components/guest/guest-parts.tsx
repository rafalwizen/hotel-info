import Link from "next/link";
import { ChevronDown, ChevronRight, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { SectionIcon } from "@/components/icon";
import { gs } from "@/components/guest/strings";
import type {
  GuestAmenity,
  GuestArrivalStep,
  GuestRoomLink,
  GuestSection,
} from "@/components/guest/types";

/**
 * Presentational guest-page parts. Visual language: hotel print ephemera —
 * signage eyebrows (mono small caps), a door-plate room hero, hairline
 * neutral framing, brand color reserved for the hotel identity and Wi-Fi.
 */

/** Neutral small-caps group label — quiet, so content stays the hero. */
export function GroupLabel({ children }: { children: string }) {
  return (
    <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
      {children}
    </h2>
  );
}

/** "floor 2 · 4 guests" fact fragments in the mono register. */
export function roomFacts(room: GuestRoomLink, locale: Locale): string[] {
  const facts: string[] = [];
  if (room.floor !== null) {
    facts.push(room.floor === 0 ? gs("groundFloor", locale) : `${gs("floor", locale)} ${room.floor}`);
  }
  facts.push(`${room.maxGuests} ${gs("guests", locale)}`);
  return facts;
}

/** Door-plate hero: the number IS the identity — it matches the physical door. */
export function DoorPlate({ room, locale }: { room: GuestRoomLink; locale: Locale }) {
  const name = pick(room.name, locale);
  return (
    <div className="space-y-2.5">
      <h1>
        <span className="block font-mono text-6xl font-bold leading-none tracking-tight text-neutral-900">
          {room.number}
        </span>
        {name && <span className="mt-3 block text-xl font-semibold text-neutral-900">{name}</span>}
      </h1>
      <p className="font-mono text-xs tracking-wide text-neutral-500">
        {roomFacts(room, locale).join(" · ")}
      </p>
    </div>
  );
}

/** Amenity chips: icon in a brand-soft dot + label, wrapping freely. */
export function AmenityChips({ items, locale }: { items: GuestAmenity[]; locale: Locale }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <GroupLabel>{gs("amenities", locale)}</GroupLabel>
      <ul className="flex flex-wrap gap-2">
        {items.map((amenity, index) => (
          <li
            key={index}
            className="flex items-center gap-2 rounded-full border border-neutral-200 py-1.5 pr-3.5 pl-1.5"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--hotel-primary)/10 text-(--hotel-primary)">
              <SectionIcon name={amenity.icon} className="size-3.5" />
            </span>
            <span className="text-sm text-neutral-700">{pick(amenity.label, locale)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Room guide sections — open by design. Bodies are short operational
 * paragraphs; hiding them behind taps would fight the page's purpose.
 * whitespace-pre-line honors newlines typed in the admin editor.
 */
export function SectionCards({
  sections,
  locale,
}: {
  sections: GuestSection[];
  locale: Locale;
}) {
  if (sections.length === 0) return null;
  return (
    <section className="space-y-3">
      <GroupLabel>{gs("roomGuide", locale)}</GroupLabel>
      <ol className="space-y-3">
        {sections.map((section, index) => {
          const body = pick(section.body, locale);
          return (
            <li key={index} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--hotel-primary)/10 text-(--hotel-primary)">
                  <SectionIcon name={section.icon} className="size-4" />
                </span>
                <h3 className="font-semibold text-neutral-900">{pick(section.title, locale)}</h3>
              </div>
              {body && (
                <p className="mt-2.5 text-[15px] leading-relaxed whitespace-pre-line text-neutral-600">
                  {body}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Hotel information block as a native <details> — zero JavaScript, keyboard
 * and screen-reader accessible out of the box. Collapsed on the room page
 * (room first, hotel second), open on the hotel overview.
 */
export function HotelDetails({
  slug,
  checkinFrom,
  checkoutUntil,
  phone,
  addressLine,
  sections,
  locale,
  defaultOpen = false,
}: {
  slug: string;
  checkinFrom: string;
  checkoutUntil: string;
  phone: string;
  addressLine: string;
  sections: GuestSection[];
  locale: Locale;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group rounded-xl border border-neutral-200" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
        {gs("aboutHotel", locale)}
        <ChevronDown
          className="size-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="space-y-5 border-t border-neutral-100 p-4">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs font-medium text-neutral-500">{gs("checkin", locale)}</dt>
            <dd className="font-mono text-lg font-semibold text-neutral-900">{checkinFrom}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500">{gs("checkout", locale)}</dt>
            <dd className="font-mono text-lg font-semibold text-neutral-900">{checkoutUntil}</dd>
          </div>
        </dl>

        {phone && (
          <a
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            className="flex items-center gap-2.5 text-neutral-700 transition-colors hover:text-(--hotel-primary)"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--hotel-primary)/10 text-(--hotel-primary)">
              <Phone className="size-4" aria-hidden />
            </span>
            <span className="font-mono text-base font-semibold">{phone}</span>
          </a>
        )}

        {addressLine && (
          <p className="flex items-start gap-2.5 text-sm text-neutral-600">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--hotel-primary)/10 text-(--hotel-primary)">
              <MapPin className="size-4" aria-hidden />
            </span>
            <span className="pt-1.5">{addressLine}</span>
          </p>
        )}

        {sections.length > 0 && (
          <ol className="space-y-3">
            {sections.map((section, index) => {
              const body = pick(section.body, locale);
              return (
                <li key={index} className="rounded-lg bg-neutral-50 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-(--hotel-primary)">
                      <SectionIcon name={section.icon} className="size-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {pick(section.title, locale)}
                    </h3>
                  </div>
                  {body && (
                    <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-neutral-600">
                      {body}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <p>
          <Link
            href={`/${slug}`}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-(--hotel-primary)"
          >
            {gs("backToHotel", locale)}
          </Link>
        </p>
      </div>
    </details>
  );
}

/** "How to find us" entry card on the hotel overview. */
export function ArrivalLink({
  hotelSlug,
  locale,
}: {
  hotelSlug: string;
  locale: Locale;
}) {
  return (
    <Link
      href={`/${hotelSlug}/dojazd`}
      className="flex items-center gap-4 rounded-xl border border-neutral-200 p-4 transition-colors hover:border-(--hotel-primary)/50"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--hotel-primary)/10 text-(--hotel-primary)">
        <MapPin className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-neutral-900">
          {gs("arrivalTitle", locale)}
        </span>
        <span className="block text-sm text-neutral-500">
          {gs("arrivalHint", locale)}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-neutral-400" aria-hidden />
    </Link>
  );
}

/**
 * Room-page arrival block as a native <details> — collapsed by default:
 * the room page leads with the room itself, and guests already in the
 * building don't need directions. Photos ride along because "where is
 * the key box" is exactly the thing a picture answers.
 */
export function ArrivalBlock({
  hotelSlug,
  steps,
  locale,
}: {
  hotelSlug: string;
  steps: GuestArrivalStep[];
  locale: Locale;
}) {
  if (steps.length === 0) return null;
  return (
    <details className="group rounded-xl border border-neutral-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--hotel-primary)/10 text-(--hotel-primary)">
            <MapPin className="size-4" aria-hidden />
          </span>
          {gs("arrivalBlock", locale)}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="space-y-4 border-t border-neutral-100 p-4">
        <ol className="space-y-3">
          {steps.map((step, index) => {
            const title = pick(step.title, locale);
            const body = pick(step.body, locale);
            return (
              <li key={index}>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-lg font-bold leading-none text-(--hotel-primary)">
                    {index + 1}
                  </span>
                  {title && (
                    <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                  )}
                </div>
                {body && (
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-neutral-600">
                    {body}
                  </p>
                )}
                {step.photoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={step.photoUrl}
                    alt={title}
                    className="mt-2 h-36 w-full rounded-lg border border-neutral-200 object-cover"
                  />
                )}
              </li>
            );
          })}
        </ol>

        <p>
          <Link
            href={`/${hotelSlug}/dojazd`}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-(--hotel-primary)"
          >
            {gs("fullGuide", locale)}
          </Link>
        </p>
      </div>
    </details>
  );
}

/** Rooms index on the hotel overview: door numbers lead the way. */
export function RoomsIndex({
  hotelSlug,
  rooms,
  locale,
}: {
  hotelSlug: string;
  rooms: GuestRoomLink[];
  locale: Locale;
}) {
  if (rooms.length === 0) return null;
  return (
    <section className="space-y-3">
      <GroupLabel>{gs("rooms", locale)}</GroupLabel>
      <ol className="space-y-2">
        {rooms.map((room) => (
          <li key={room.slug}>
            <Link
              href={`/${hotelSlug}/${room.slug}`}
              className="flex items-center gap-4 rounded-xl border border-neutral-200 p-4 transition-colors hover:border-(--hotel-primary)/50"
            >
              <span className="w-14 shrink-0 font-mono text-2xl font-bold text-(--hotel-primary)">
                {room.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-neutral-900">
                  {pick(room.name, locale) || room.number}
                </span>
                <span className="block font-mono text-xs tracking-wide text-neutral-500">
                  {roomFacts(room, locale).join(" · ")}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-neutral-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Quiet plate-style footer bookending the page. */
export function GuestFooter({ hotelName }: { hotelName: string }) {
  return (
    <footer className="border-t border-neutral-100 pt-6 pb-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-300">
      {hotelName}
    </footer>
  );
}
