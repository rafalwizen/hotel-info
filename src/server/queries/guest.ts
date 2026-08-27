import { cache } from "react";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  amenities,
  hotelSections,
  hotels,
  roomAmenities,
  roomRedirects,
  roomSections,
  rooms,
} from "@/db/schema";
import { mergeSections } from "@/lib/sections";

/**
 * Public guest-page loaders. No auth — this IS the public surface — but
 * unpublished rooms never resolve, and slug lookups follow room_redirects
 * so printed QR stickers keep working after renames.
 *
 * Every loader is wrapped in React cache(): generateMetadata, generateViewport
 * and the page itself must not duplicate queries within one request.
 */

export type HotelRow = typeof hotels.$inferSelect;
export type RoomRow = typeof rooms.$inferSelect;

export const getHotelBySlug = cache(async (slug: string): Promise<HotelRow | null> => {
  const [hotel] = await db.select().from(hotels).where(eq(hotels.slug, slug)).limit(1);
  return hotel ?? null;
});

export type RoomResolution =
  | { room: RoomRow; redirectTo: null }
  | { room: null; redirectTo: string }
  | { room: null; redirectTo: null };

/**
 * Resolve a guest URL slug to a published room. A slug that was renamed
 * (room_redirects) resolves to the canonical slug so the page can issue a
 * permanent redirect; unpublished rooms behave like missing ones.
 */
export const getRoomBySlug = cache(async (hotelId: string, slug: string): Promise<RoomResolution> => {
  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.hotelId, hotelId), eq(rooms.slug, slug)))
    .limit(1);
  if (room) return room.published ? { room, redirectTo: null } : { room: null, redirectTo: null };

  const [hit] = await db
    .select({ slug: rooms.slug, published: rooms.published })
    .from(roomRedirects)
    .innerJoin(rooms, eq(roomRedirects.roomId, rooms.id))
    .where(and(eq(roomRedirects.hotelId, hotelId), eq(roomRedirects.oldSlug, slug)))
    .limit(1);
  if (hit?.published) return { room: null, redirectTo: hit.slug };

  return { room: null, redirectTo: null };
});

/** Published rooms of a hotel, sticker order. */
export const getPublishedRooms = cache(async (hotelId: string): Promise<RoomRow[]> =>
  db
    .select()
    .from(rooms)
    .where(and(eq(rooms.hotelId, hotelId), eq(rooms.published, true)))
    .orderBy(asc(rooms.sortOrder), asc(rooms.number)),
);

/** Enabled hotel-level narrative sections (reception, breakfast, parking). */
export const getHotelSections = cache(
  async (hotelId: string) =>
    db
      .select()
      .from(hotelSections)
      .where(and(eq(hotelSections.hotelId, hotelId), eq(hotelSections.enabled, true)))
      .orderBy(asc(hotelSections.sortOrder), asc(hotelSections.id)),
);

/**
 * Room sections as the guest sees them: hotel templates merged with this
 * room's overrides/extras (disabled templates and hidden overrides drop out).
 */
export const getRoomSections = cache(async (hotelId: string, roomId: string) => {
  const [templates, own] = await Promise.all([
    db
      .select()
      .from(roomSections)
      .where(and(eq(roomSections.hotelId, hotelId), isNull(roomSections.roomId))),
    db.select().from(roomSections).where(eq(roomSections.roomId, roomId)),
  ]);
  return mergeSections(templates, own);
});

/** Amenities assigned to a room, in catalog order. */
export const getRoomAmenities = cache(async (hotelId: string, roomId: string) =>
  db
    .select({ icon: amenities.icon, label: amenities.label })
    .from(roomAmenities)
    .innerJoin(amenities, eq(roomAmenities.amenityId, amenities.id))
    .where(and(eq(amenities.hotelId, hotelId), eq(roomAmenities.roomId, roomId)))
    .orderBy(asc(amenities.sortOrder), asc(amenities.id)),
);
