import { and, asc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  amenities,
  arrivalSteps,
  roomAmenities,
  roomSections,
  rooms,
} from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { extraSections, templateStates } from "@/lib/sections";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomForm } from "@/components/admin/room-form";
import { RoomAmenities } from "@/components/admin/room-amenities";
import { RoomSections } from "@/components/admin/room-sections";
import { RoomArrival } from "@/components/admin/room-arrival";

type Params = { id: string };

/** Room editor: identity, amenity chips, section inheritance + extras. */
export default async function RoomEditorPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { hotel } = await requireHotel();
  const { id } = await params;

  // URL ids are NEVER trusted alone — always paired with hotelId (404, not 403).
  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, id), eq(rooms.hotelId, hotel.id)))
    .limit(1);
  if (!room) notFound();

  const [amenityRows, assignedRows, templateRows, sectionRows, arrivalTemplateRows, arrivalRoomRows] =
    await Promise.all([
      db
        .select()
        .from(amenities)
        .where(eq(amenities.hotelId, hotel.id))
        .orderBy(asc(amenities.sortOrder), asc(amenities.id)),
      db
        .select({ amenityId: roomAmenities.amenityId })
        .from(roomAmenities)
        .where(eq(roomAmenities.roomId, room.id)),
      db
        .select()
        .from(roomSections)
        .where(
          and(eq(roomSections.hotelId, hotel.id), isNull(roomSections.roomId)),
        )
        .orderBy(asc(roomSections.sortOrder), asc(roomSections.id)),
      db
        .select()
        .from(roomSections)
        .where(eq(roomSections.roomId, room.id))
        .orderBy(asc(roomSections.sortOrder), asc(roomSections.id)),
      db
        .select()
        .from(arrivalSteps)
        .where(
          and(eq(arrivalSteps.hotelId, hotel.id), isNull(arrivalSteps.roomId)),
        )
        .orderBy(asc(arrivalSteps.sortOrder), asc(arrivalSteps.id)),
      db
        .select()
        .from(arrivalSteps)
        .where(eq(arrivalSteps.roomId, room.id))
        .orderBy(asc(arrivalSteps.sortOrder), asc(arrivalSteps.id)),
    ]);

  const templates = templateStates(templateRows, sectionRows);
  const extras = extraSections(sectionRows);
  const arrivalTemplates = templateStates(arrivalTemplateRows, arrivalRoomRows);
  const arrivalExtras = extraSections(arrivalRoomRows);
  const guestBase = (process.env.GUEST_BASE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pokój {room.number}
        </h1>
        <p className="text-sm text-muted-foreground">
          Strona gościa:{" "}
          <span className="font-mono">
            {guestBase}/{hotel.slug}/{room.slug}
          </span>
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dane pokoju</CardTitle>
          <CardDescription>
            Zmiana adresu (slug) jest bezpieczna — stary adres będzie
            automatycznie przekierowywał, więc wydrukowane kody QR nie przestaną
            działać.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomForm
            roomId={room.id}
            roomSlugPrefix={`${guestBase}/${hotel.slug}`}
            defaultValues={{
              number: room.number,
              slug: room.slug,
              name: room.name,
              floor: room.floor,
              maxGuests: room.maxGuests,
              published: room.published,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Udogodnienia</CardTitle>
          <CardDescription>
            Zaznaczone chipsy pojawią się na stronie tego pokoju.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomAmenities
            key={assignedRows.map((r) => r.amenityId).join(",")}
            roomId={room.id}
            options={amenityRows.map((a) => ({
              id: a.id,
              icon: a.icon,
              labelPl: a.label.pl,
            }))}
            initialIds={assignedRows.map((r) => r.amenityId)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sekcje treści</CardTitle>
          <CardDescription>
            Sekcje z szablonu hotelu możesz nadpisać lub ukryć tylko w tym
            pokoju; sekcje własne widoczne są wyłącznie tutaj.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomSections roomId={room.id} templates={templates} extras={extras} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dojazd</CardTitle>
          <CardDescription>
            Kroki instrukcji dojazdu z szablonu hotelu możesz nadpisać lub
            ukryć tylko w tym pokoju — np. gdy ten pokój ma inne wejście.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomArrival
            roomId={room.id}
            templates={arrivalTemplates}
            extras={arrivalExtras}
          />
        </CardContent>
      </Card>
    </>
  );
}
