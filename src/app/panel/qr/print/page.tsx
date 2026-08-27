import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { guestBaseUrl } from "@/server/queries/qr";
import { chunkPages, guestHotelUrl, guestRoomUrl, qrSvg } from "@/lib/qr";
import { pick } from "@/lib/i18n";
import { PrintOnMount } from "@/components/admin/print-on-mount";

export const metadata = { title: "Naklejki QR — Hotel Info" };

/** Stickers per A4 sheet: 2 columns x 4 rows inside a 10mm margin. */
const STICKERS_PER_PAGE = 8;

/**
 * Screen preview mirrors the printed sheet 1:1 (A4 at true scale); print
 * media hides the chrome and paginates via .qr-page breaks.
 */
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 10mm; }
  * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .qr-page { break-after: page; }
  .qr-page:last-child { break-after: auto; }
}
`;

type Sticker =
  | { kind: "lobby"; hotelName: string; title: string; url: string; svg: string }
  | { kind: "room"; hotelName: string; number: string; title: string; url: string; svg: string };

function StickerCard({ sticker }: { sticker: Sticker }) {
  return (
    <div className="qr-sticker flex h-[58mm] w-full flex-col break-inside-avoid rounded-[2mm] border border-dashed border-neutral-400 p-[3mm]">
      <p className="truncate text-[7pt] font-semibold uppercase tracking-[0.14em] text-neutral-600">
        {sticker.hotelName}
      </p>
      <div className="mt-auto flex flex-1 items-center gap-[4mm]">
        <div
          aria-hidden
          className="h-[44mm] w-[44mm] shrink-0 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: sticker.svg }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[6.5pt] font-medium uppercase tracking-[0.1em] text-neutral-400">
            Zeskanuj kod telefonem
          </p>
          <p className="mt-[1.5mm] font-mono text-[22pt] leading-none font-bold text-neutral-900">
            {sticker.kind === "room" ? sticker.number : "INFO"}
          </p>
          <p className="mt-[2mm] text-[10pt] leading-tight text-neutral-700">{sticker.title}</p>
          <p className="mt-[2mm] break-all font-mono text-[6.5pt] leading-snug text-neutral-500">
            {sticker.url}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The printable sticker sheet: ?lobby=1&rooms=<id,id,...>. Room ids are
 * re-validated against the caller's hotel (never trusted from the URL), and
 * a sheet with zero stickers 404s rather than printing a blank page.
 */
export default async function QrPrintPage({
  searchParams,
}: PageProps<"/panel/qr/print">) {
  const { hotel } = await requireHotel();
  const sp = await searchParams;
  const base = await guestBaseUrl();
  const hotelName = pick(hotel.name, "pl") || hotel.slug;

  const rawRooms = typeof sp.rooms === "string" ? sp.rooms : "";
  const roomIds = [...new Set(rawRooms.split(",").map((s) => s.trim()).filter(Boolean))];
  const includeLobby = sp.lobby === "1";

  const stickers: Sticker[] = [];

  if (includeLobby) {
    const url = guestHotelUrl(base, hotel.slug);
    stickers.push({ kind: "lobby", hotelName, title: "Informacje o hotelu", url, svg: await qrSvg(url) });
  }

  if (roomIds.length > 0) {
    // inArray is scoped by hotelId — foreign ids simply never match
    const found = await db
      .select({ id: rooms.id, number: rooms.number, slug: rooms.slug, name: rooms.name })
      .from(rooms)
      .where(and(eq(rooms.hotelId, hotel.id), inArray(rooms.id, roomIds)));
    const byId = new Map(found.map((room) => [room.id, room]));

    for (const id of roomIds) {
      const room = byId.get(id);
      if (!room) continue;
      const url = guestRoomUrl(base, hotel.slug, room.slug);
      stickers.push({
        kind: "room",
        hotelName,
        number: room.number,
        title: room.name.pl || `Pokój ${room.number}`,
        url,
        svg: await qrSvg(url),
      });
    }
  }

  if (stickers.length === 0) notFound();

  const pages = chunkPages(stickers, STICKERS_PER_PAGE);

  return (
    <div className="min-h-dvh bg-neutral-100 print:bg-white">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="mx-auto max-w-[230mm] space-y-4 p-6 print:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Naklejki QR</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Arkusz A4 gotowy do druku — okno druku otworzy się automatycznie. Wydrukuj na
              papierze samoprzylepnym i przytnij po przerywanych liniach.
            </p>
          </div>
          <Link
            href="/panel/qr"
            className="shrink-0 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Wróć do wyboru
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto pb-10 print:overflow-visible print:pb-0">
        <div className="flex flex-col items-center gap-8 print:gap-0">
          {pages.map((page, index) => (
            <div
              key={index}
              className="qr-page grid w-[210mm] grid-cols-2 gap-x-[6mm] gap-y-[6mm] bg-white p-[10mm] shadow-sm print:w-auto print:p-0 print:shadow-none"
            >
              {page.map((sticker) => (
                <StickerCard key={sticker.url} sticker={sticker} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <PrintOnMount />
    </div>
  );
}
