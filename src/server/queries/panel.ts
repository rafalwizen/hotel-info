/**
 * Read-side loaders for the AI assistant's panel context (and reusable by
 * panel pages later). Unlike requireHotel() in src/server/tenancy.ts,
 * getPanelContext returns null instead of redirect() — a NEXT_REDIRECT
 * throw must never fly out of the /api/assistant POST handler.
 *
 * Every query is hotelId-scoped (multi-tenancy rule) and React cache()d
 * per request, mirroring src/server/queries/guest.ts conventions.
 */

import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { amenities, hotels, memberships, rooms } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { HotelRow } from "@/server/queries/guest";

export type PanelContext = { userId: string; hotel: HotelRow };

/** Auth + membership check without redirects; null = anonymous or no hotel. */
export const getPanelContext = cache(async (): Promise<PanelContext | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [row] = await db
    .select({ hotel: hotels })
    .from(memberships)
    .innerJoin(hotels, eq(memberships.hotelId, hotels.id))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  return row ? { userId: session.user.id, hotel: row.hotel } : null;
});

export const listRoomsForPanel = cache(async (hotelId: string) =>
  db
    .select({
      id: rooms.id,
      number: rooms.number,
      slug: rooms.slug,
      name: rooms.name,
      floor: rooms.floor,
      maxGuests: rooms.maxGuests,
      published: rooms.published,
    })
    .from(rooms)
    .where(eq(rooms.hotelId, hotelId))
    .orderBy(asc(rooms.sortOrder)),
);

export const listAmenitiesForPanel = cache(async (hotelId: string) =>
  db
    .select({
      id: amenities.id,
      label: amenities.label,
      icon: amenities.icon,
    })
    .from(amenities)
    .where(eq(amenities.hotelId, hotelId))
    .orderBy(asc(amenities.sortOrder)),
);
