import { guestRoomUrl, parseQrSize, qrPng, stickerFileName } from "@/lib/qr";
import { getRoomForQr, guestBaseUrl } from "@/server/queries/qr";

const NOT_FOUND = new Response("Not Found", { status: 404 });

/**
 * GET /api/qr/[roomId] — room sticker PNG download.
 * Tenancy-checked: any miss (anonymous, foreign hotel, bad id) is a 404.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/qr/[roomId]">) {
  const { roomId } = await ctx.params;
  const room = await getRoomForQr(roomId);
  if (!room) return NOT_FOUND;

  const base = await guestBaseUrl();
  const size = parseQrSize(new URL(request.url).searchParams.get("size"));
  const png = await qrPng(guestRoomUrl(base, room.hotelSlug, room.roomSlug), size);

  const fileName = `qr-${stickerFileName(room.hotelSlug)}-${stickerFileName(room.roomNumber)}.png`;
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      // Slugs change; a cached PNG could encode a dead URL.
      "Cache-Control": "private, no-store",
    },
  });
}
