import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { pick } from "@/lib/i18n";
import { GuestHotelPage } from "@/components/guest/guest-hotel-page";
import type { GuestSection } from "@/components/guest/types";
import {
  getHotelBySlug,
  getHotelSections,
  getPublishedRooms,
} from "@/server/queries/guest";

// ISR: pages are cached and refreshed max 5 min after the fact; admin
// mutations call revalidatePath("/${slug}", "layout") for instant updates.
export const revalidate = 300;

type Params = { hotel: string };

/** A section renders only when it says anything in at least one locale. */
function hasContent(section: { title: { pl: string; en: string }; body: { pl: string; en: string } }): boolean {
  return Boolean(
    section.title.pl.trim() || section.title.en.trim() || section.body.pl.trim() || section.body.en.trim(),
  );
}

function toGuestSections(
  rows: Awaited<ReturnType<typeof getHotelSections>>,
): GuestSection[] {
  return rows.filter(hasContent).map((row) => ({
    icon: row.icon,
    title: row.title,
    body: row.body,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { hotel: slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return {};

  // noindex is non-negotiable: the URL exposes the guest wifi password.
  // Never put wifi data or section bodies into meta/OG.
  return {
    title: pick(hotel.name, hotel.defaultLocale) || hotel.slug,
    description: hotel.addressLine || undefined,
    robots: { index: false, follow: false },
  };
}

export async function generateViewport({ params }: { params: Promise<Params> }): Promise<Viewport> {
  const { hotel: slug } = await params;
  const hotel = await getHotelBySlug(slug);
  return { themeColor: hotel?.brandColor ?? "#ffffff" };
}

/** Hotel overview — the lobby QR target. */
export default async function HotelGuestPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { hotel: slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const [roomRows, sectionRows] = await Promise.all([
    getPublishedRooms(hotel.id),
    getHotelSections(hotel.id),
  ]);

  return (
    <GuestHotelPage
      payload={{
        hotel: {
          slug: hotel.slug,
          name: hotel.name,
          brandColor: hotel.brandColor,
          defaultLocale: hotel.defaultLocale,
          wifiSsid: hotel.wifiSsid,
          wifiPassword: hotel.wifiPassword,
          checkinFrom: hotel.checkinFrom,
          checkoutUntil: hotel.checkoutUntil,
          phone: hotel.phone,
          addressLine: hotel.addressLine,
        },
        rooms: roomRows.map((room) => ({
          number: room.number,
          slug: room.slug,
          name: room.name,
          floor: room.floor,
          maxGuests: room.maxGuests,
        })),
        sections: toGuestSections(sectionRows),
      }}
    />
  );
}
