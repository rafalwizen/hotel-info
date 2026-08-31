import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { pick } from "@/lib/i18n";
import { GuestArrivalPage } from "@/components/guest/guest-arrival-page";
import { getArrivalSteps, getHotelBySlug } from "@/server/queries/guest";

// ISR: pages are cached and refreshed max 5 min after the fact; admin
// mutations call revalidatePath("/${slug}", "layout") for instant updates.
export const revalidate = 300;

type Params = { hotel: string };

/** A step renders only when it says anything in at least one locale. */
function hasContent(step: {
  title: { pl: string; en: string };
  body: { pl: string; en: string };
}): boolean {
  return Boolean(
    step.title.pl.trim() || step.title.en.trim() || step.body.pl.trim() || step.body.en.trim(),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { hotel: slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return {};

  const hotelName = pick(hotel.name, hotel.defaultLocale) || hotel.slug;
  // noindex: gate codes and key-box locations must stay out of indexes.
  return {
    title: `${hotelName} — jak do nas trafić`,
    description: hotel.addressLine || undefined,
    robots: { index: false, follow: false },
  };
}

export async function generateViewport({
  params,
}: {
  params: Promise<Params>;
}): Promise<Viewport> {
  const { hotel: slug } = await params;
  const hotel = await getHotelBySlug(slug);
  return { themeColor: hotel?.brandColor ?? "#ffffff" };
}

/** Shareable arrival guide — the link owners paste into Booking/SMS chats. */
export default async function ArrivalGuidePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { hotel: slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const stepRows = await getArrivalSteps(hotel.id);
  const steps = stepRows
    .filter(hasContent)
    .map((row) => ({ title: row.title, body: row.body, photoUrl: row.photoUrl }));

  // Nothing written yet -> the shared link must not render an empty page.
  if (steps.length === 0 && !hotel.arrivalMapUrl) notFound();

  return (
    <GuestArrivalPage
      payload={{
        hotel: {
          slug: hotel.slug,
          name: hotel.name,
          brandColor: hotel.brandColor,
          defaultLocale: hotel.defaultLocale,
          addressLine: hotel.addressLine,
          phone: hotel.phone,
        },
        steps,
        mapUrl: hotel.arrivalMapUrl,
      }}
    />
  );
}
