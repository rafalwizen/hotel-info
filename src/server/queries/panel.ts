/**
 * Read-side loaders for the AI assistant's panel context (and reusable by
 * panel pages later). Unlike requireHotel() in src/server/tenancy.ts,
 * getPanelContext returns null instead of redirect() — a NEXT_REDIRECT
 * throw must never fly out of the /api/assistant POST handler.
 *
 * Every query is hotelId-scoped (multi-tenancy rule) and React cache()d
 * per request, mirroring src/server/queries/guest.ts conventions. List
 * loaders stay light (ids + short labels) so tool results don't balloon;
 * full content goes through the by-id detail loaders.
 */

import { cache } from "react";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  amenities,
  arrivalSteps,
  hotelSections,
  hotels,
  memberships,
  roomAmenities,
  roomSections,
  rooms,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { extraSections, templateStates } from "@/lib/sections";
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

/** Human label for cards and enrichment ("Pokój 204 — Apartament"). */
export const getRoomLabelForPanel = cache(async (hotelId: string, roomId: string) => {
  const [room] = await db
    .select({ number: rooms.number, name: rooms.name })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.hotelId, hotelId)))
    .limit(1);
  if (!room) return null;
  return room.name.pl ? `Pokój ${room.number} — ${room.name.pl}` : `Pokój ${room.number}`;
});

/** Shape of get_hotel_info: full settings object (update replaces it all). */
export function getHotelInfoShape(context: PanelContext) {
  const hotel = context.hotel;
  return {
    slug: hotel.slug,
    name: hotel.name,
    brandColor: hotel.brandColor,
    wifiSsid: hotel.wifiSsid,
    wifiPassword: hotel.wifiPassword,
    checkinFrom: hotel.checkinFrom,
    checkoutUntil: hotel.checkoutUntil,
    phone: hotel.phone,
    email: hotel.email,
    addressLine: hotel.addressLine,
    arrivalMapUrl: hotel.arrivalMapUrl ?? "",
  };
}

/**
 * Room detail for the get_room tool: identity, amenity id set, and the
 * per-template inherit/override/hide map plus room-only extras for both
 * content families. Reuses the pure inheritance logic from lib/sections.
 */
export const getRoomDetailForPanel = cache(async (hotelId: string, roomId: string) => {
  const [room] = await db
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
    .where(and(eq(rooms.id, roomId), eq(rooms.hotelId, hotelId)))
    .limit(1);
  if (!room) return null;

  const [amenityRows, sectionTemplates, roomSectionRows, arrivalTemplates, roomStepRows] =
    await Promise.all([
      db
        .select({ amenityId: roomAmenities.amenityId })
        .from(roomAmenities)
        .where(eq(roomAmenities.roomId, roomId)),
      db
        .select()
        .from(roomSections)
        .where(and(eq(roomSections.hotelId, hotelId), isNull(roomSections.roomId))),
      db.select().from(roomSections).where(eq(roomSections.roomId, roomId)),
      db
        .select()
        .from(arrivalSteps)
        .where(and(eq(arrivalSteps.hotelId, hotelId), isNull(arrivalSteps.roomId))),
      db.select().from(arrivalSteps).where(eq(arrivalSteps.roomId, roomId)),
    ]);

  return {
    room,
    amenityIds: amenityRows.map((row) => row.amenityId),
    sectionTemplates: templateStates(sectionTemplates, roomSectionRows).map(
      ({ template, override, state }) => ({
        templateId: template.id,
        state,
        templateEnabled: template.enabled,
        titlePl: (override ?? template).title.pl,
        overrideId: override?.id ?? null,
      }),
    ),
    extraSections: extraSections(roomSectionRows).map((section) => ({
      id: section.id,
      titlePl: section.title.pl,
      enabled: section.enabled,
    })),
    arrivalTemplates: templateStates(arrivalTemplates, roomStepRows).map(
      ({ template, override, state }) => ({
        templateId: template.id,
        state,
        templateEnabled: template.enabled,
        titlePl: (override ?? template).title.pl,
        overrideId: override?.id ?? null,
        hasPhoto: (override ?? template).photoUrl != null,
      }),
    ),
    extraArrivalSteps: extraSections(roomStepRows).map((step) => ({
      id: step.id,
      titlePl: step.title.pl,
      enabled: step.enabled,
      hasPhoto: step.photoUrl != null,
    })),
  };
});

/** Full content of one room-section row in any scope (template/override/extra). */
export const getSectionByIdForPanel = cache(async (hotelId: string, sectionId: string) => {
  const [section] = await db
    .select()
    .from(roomSections)
    .where(and(eq(roomSections.id, sectionId), eq(roomSections.hotelId, hotelId)))
    .limit(1);
  return section ?? null;
});

/** Full content of one arrival-step row in any scope (template/override/extra). */
export const getArrivalStepByIdForPanel = cache(async (hotelId: string, stepId: string) => {
  const [step] = await db
    .select()
    .from(arrivalSteps)
    .where(and(eq(arrivalSteps.id, stepId), eq(arrivalSteps.hotelId, hotelId)))
    .limit(1);
  return step ?? null;
});

export const listSectionTemplatesForPanel = cache(async (hotelId: string) =>
  db
    .select({
      id: roomSections.id,
      title: roomSections.title,
      icon: roomSections.icon,
      enabled: roomSections.enabled,
    })
    .from(roomSections)
    .where(and(eq(roomSections.hotelId, hotelId), isNull(roomSections.roomId)))
    .orderBy(asc(roomSections.sortOrder)),
);

export const listHotelSectionsForPanel = cache(async (hotelId: string) =>
  db
    .select({
      id: hotelSections.id,
      title: hotelSections.title,
      icon: hotelSections.icon,
      enabled: hotelSections.enabled,
    })
    .from(hotelSections)
    .where(eq(hotelSections.hotelId, hotelId))
    .orderBy(asc(hotelSections.sortOrder)),
);

/** Template arrival steps with photoUrl — the model needs it for round-trips. */
export const listArrivalStepsForPanel = cache(async (hotelId: string) =>
  db
    .select({
      id: arrivalSteps.id,
      title: arrivalSteps.title,
      enabled: arrivalSteps.enabled,
      photoUrl: arrivalSteps.photoUrl,
    })
    .from(arrivalSteps)
    .where(and(eq(arrivalSteps.hotelId, hotelId), isNull(arrivalSteps.roomId)))
    .orderBy(asc(arrivalSteps.sortOrder)),
);

/** Resolve amenity ids to human labels (PL first, EN fallback). */
export const amenityLabelsByIds = cache(async (hotelId: string, ids: string[]) => {
  if (ids.length === 0) return new Map<string, string>();
  const rows = await db
    .select({ id: amenities.id, label: amenities.label })
    .from(amenities)
    .where(and(eq(amenities.hotelId, hotelId), inArray(amenities.id, ids)));
  return new Map(rows.map((row) => [row.id, row.label.pl || row.label.en || row.id]));
});

/** How many room overrides reference the template (cascade size on delete). */
export const countSectionOverridesForPanel = cache(async (hotelId: string, templateId: string) => {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(roomSections)
    .where(and(eq(roomSections.hotelId, hotelId), eq(roomSections.basedOnId, templateId)));
  return Number(row?.count ?? 0);
});

export const countArrivalOverridesForPanel = cache(async (hotelId: string, templateId: string) => {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(arrivalSteps)
    .where(and(eq(arrivalSteps.hotelId, hotelId), eq(arrivalSteps.basedOnId, templateId)));
  return Number(row?.count ?? 0);
});
