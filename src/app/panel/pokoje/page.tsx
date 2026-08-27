import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { RoomsList } from "@/components/admin/rooms-list";

export const metadata = { title: "Pokoje — Hotel Info" };

export default async function RoomsPage() {
  const { hotel } = await requireHotel();

  const hotelRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.hotelId, hotel.id))
    .orderBy(asc(rooms.sortOrder), asc(rooms.number));

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pokoje</h1>
        <p className="text-sm text-muted-foreground">
          Każdy pokój dostanie własny kod QR i stronę dla gości pod adresem{" "}
          <span className="font-mono">/{hotel.slug}/…</span>
        </p>
      </header>
      <RoomsList
        rooms={hotelRooms.map((room) => ({
          id: room.id,
          number: room.number,
          slug: room.slug,
          namePl: room.name.pl,
          published: room.published,
        }))}
      />
    </>
  );
}
