import { guestHotelUrl, parseQrSize, qrPng, stickerFileName } from "@/lib/qr";
import { getHotelForQr, guestBaseUrl } from "@/server/queries/qr";

const NOT_FOUND = new Response("Not Found", { status: 404 });

/**
 * GET /api/qr/hotel — lobby sticker PNG (targets the hotel overview page).
 * Static segment wins over the sibling [roomId] route, and a nanoid roomId
 * never collides with the literal "hotel".
 */
export async function GET(request: Request) {
  const hotel = await getHotelForQr();
  if (!hotel) return NOT_FOUND;

  const base = await guestBaseUrl();
  const size = parseQrSize(new URL(request.url).searchParams.get("size"));
  const png = await qrPng(guestHotelUrl(base, hotel.hotelSlug), size);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${stickerFileName(hotel.hotelSlug)}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
