import type { Metadata, Viewport } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { pick } from "@/lib/i18n";
import { GuestRoomPage } from "@/components/guest/guest-room-page";
import type { GuestSection } from "@/components/guest/types";
import {
  getHotelBySlug,
  getHotelSections,
  getMergedArrivalSteps,
  getRoomAmenities,
  getRoomBySlug,
  getRoomSections,
} from "@/server/queries/guest";

// ISR: pages are cached and refreshed max 5 min after the fact; admin
// mutations call revalidatePath("/${slug}", "layout") for instant updates.
export const revalidate = 300;

type Params = { hotel: string; room: string };

/** A section renders only when it says anything in at least one locale. */
function hasContent(section: { title: { pl: string; en: string }; body: { pl: string; en: string } }): boolean {
  return Boolean(
    section.title.pl.trim() || section.title.en.trim() || section.body.pl.trim() || section.body.en.trim(),
  );
}

function toGuestSections(rows: { icon: string; title: { pl: string; en: string }; body: { pl: string; en: string } }[]): GuestSection[] {
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
  const { hotel: hotelSlug, room: roomSlug } = await params;
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) return {};

  const hotelName = pick(hotel.name, hotel.defaultLocale) || hotel.slug;
  const { room } = await getRoomBySlug(hotel.id, roomSlug);

  // noindex is non-negotiable: the URL exposes the guest wifi password.
  return {
    title: room ? `${room.number} · ${hotelName}` : hotelName,
    description: hotel.addressLine || undefined,
    robots: { index: false, follow: false },
  };
}

export async function generateViewport({ params }: { params: Promise<Params> }): Promise<Viewport> {
  const { hotel: slug } = await params;
  const hotel = await getHotelBySlug(slug);
  return { themeColor: hotel?.brandColor ?? "#ffffff" };
}

/** Room page — the QR sticker target guests scan on the wall. */
export default async function RoomGuestPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { hotel: hotelSlug, room: roomSlug } = await params;
  const hotel = await getHotelBySlug(hotelSlug);
  if (!hotel) notFound();

  const resolution = await getRoomBySlug(hotel.id, roomSlug);
  // Printed stickers never die: an old slug permanently redirects to the
  // canonical one; unknown/unpublished slugs are plain 404s.
  if (resolution.redirectTo) {
    permanentRedirect(`/${hotel.slug}/${resolution.redirectTo}`);
  }
  const room = resolution.room;
  if (!room) notFound();

  const [sectionRows, amenityRows, hotelSectionRows, arrivalRows] = await Promise.all([
    getRoomSections(hotel.id, room.id),
    getRoomAmenities(hotel.id, room.id),
    getHotelSections(hotel.id),
    getMergedArrivalSteps(hotel.id, room.id),
  ]);

  return (
    <GuestRoomPage
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
        room: {
          number: room.number,
          slug: room.slug,
          name: room.name,
          floor: room.floor,
          maxGuests: room.maxGuests,
        },
        sections: toGuestSections(sectionRows),
        amenities: amenityRows
          .filter((a) => a.label.pl.trim() || a.label.en.trim())
          .map((a) => ({ icon: a.icon, label: a.label })),
        hotelSections: toGuestSections(hotelSectionRows),
        arrivalSteps: arrivalRows
          .filter(hasContent)
          .map((row) => ({ title: row.title, body: row.body, photoUrl: row.photoUrl })),
      }}
    />
  );
}
