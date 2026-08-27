import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { guestBaseUrl } from "@/server/queries/qr";
import { guestHotelUrl, guestRoomUrl, qrSvg } from "@/lib/qr";
import { QrCenter, type QrRoomRow } from "@/components/admin/qr-center";

export const metadata = { title: "Kody QR — Hotel Info" };

/**
 * QR center: pick stickers (lobby + rooms), print an A4 sticker sheet or
 * download single PNGs. SVG previews are rendered server-side — the sticker
 * on screen is pixel-for-pixel the one that prints.
 */
export default async function QrPage() {
  const { hotel } = await requireHotel();
  const base = await guestBaseUrl();

  const hotelRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.hotelId, hotel.id))
    .orderBy(asc(rooms.sortOrder), asc(rooms.number));

  const rows: QrRoomRow[] = await Promise.all(
    hotelRooms
      .filter((room) => room.published)
      .map(async (room) => ({
        id: room.id,
        number: room.number,
        namePl: room.name.pl,
        // Per-row label shows the path only — the domain is identical on
        // every sticker and is shown once, on the lobby card.
        path: `/${hotel.slug}/${room.slug}`,
        svg: await qrSvg(guestRoomUrl(base, hotel.slug, room.slug)),
      })),
  );

  // Unpublished rooms stay visible but unprintable: their guest page 404s,
  // and a dead sticker on a door is the worst place to find that out.
  const unprintable = hotelRooms
    .filter((room) => !room.published)
    .map((room) => ({ id: room.id, number: room.number }));

  return (
    <QrCenter
      lobby={{
        url: guestHotelUrl(base, hotel.slug),
        svg: await qrSvg(guestHotelUrl(base, hotel.slug)),
      }}
      rooms={rows}
      unprintable={unprintable}
    />
  );
}
