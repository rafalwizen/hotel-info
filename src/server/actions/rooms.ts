"use server";

import { and, asc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  amenities,
  roomAmenities,
  roomRedirects,
  roomSections,
  rooms,
} from "@/db/schema";
import { isValidIcon } from "@/lib/icons";
import { slugify } from "@/lib/slug";
import { requireHotel } from "@/server/tenancy";
import { createRoomSchema, roomSchema } from "@/lib/validation/room";
import { sectionSchema } from "@/lib/validation/section";
import type { ActionState } from "@/lib/validation/types";

type Room = typeof rooms.$inferSelect;
type RoomSection = typeof roomSections.$inferSelect;

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Sprawdź poprawność danych";
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && "code" in err && (err as { code?: string }).code === "23505";
}

function safeIcon(icon: string): string {
  return isValidIcon(icon) ? icon : "info";
}

/** Load a room scoped to the current hotel, or null (no existence leaks). */
async function findRoom(hotelId: string, roomId: string): Promise<Room | null> {
  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.hotelId, hotelId)))
    .limit(1);
  return room ?? null;
}

/** Load a room section scoped to the current hotel (room overrides/extras only). */
async function findRoomSection(
  hotelId: string,
  sectionId: string,
): Promise<RoomSection | null> {
  const [section] = await db
    .select()
    .from(roomSections)
    .where(
      and(
        eq(roomSections.id, sectionId),
        eq(roomSections.hotelId, hotelId),
        isNotNull(roomSections.roomId),
      ),
    )
    .limit(1);
  return section ?? null;
}

/** Next sortOrder value at the end of the given scope. */
async function nextSortOrder(
  hotelId: string,
  scope: "rooms" | { roomId: string },
): Promise<number> {
  if (scope === "rooms") {
    const [row] = await db
      .select({ max: sql<number>`coalesce(max(${rooms.sortOrder}), 0)` })
      .from(rooms)
      .where(eq(rooms.hotelId, hotelId));
    return Number(row?.max ?? 0) + 1;
  }
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${roomSections.sortOrder}), 0)` })
    .from(roomSections)
    .where(
      and(eq(roomSections.roomId, scope.roomId), isNull(roomSections.basedOnId)),
    );
  return Number(row?.max ?? 0) + 1;
}

/** Derive a unique room slug: "101", then "101-2", "101-3", ... */
async function uniqueRoomSlug(
  hotelId: string,
  base: string,
): Promise<string> {
  const rows = await db
    .select({ slug: rooms.slug })
    .from(rooms)
    .where(eq(rooms.hotelId, hotelId));
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createRoomAction(
  input: z.input<typeof createRoomSchema>,
): Promise<ActionState> {
  const parsed = createRoomSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const base = slugify(parsed.data.number) || slugify(parsed.data.name.pl) || "pokoj";
  const slug = await uniqueRoomSlug(hotel.id, base);
  const sortOrder = await nextSortOrder(hotel.id, "rooms");

  let newId: string;
  try {
    const [room] = await db
      .insert(rooms)
      .values({
        hotelId: hotel.id,
        number: parsed.data.number,
        slug,
        name: parsed.data.name,
        sortOrder,
      })
      .returning({ id: rooms.id });
    newId = room.id;
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: "Pokój z tym numerem już istnieje." };
    }
    throw err;
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  redirect(`/panel/pokoje/${newId}`);
}

export async function updateRoomAction(
  roomId: string,
  input: z.input<typeof roomSchema>,
): Promise<ActionState> {
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  const newSlug = slugify(parsed.data.slug);
  if (newSlug !== parsed.data.slug) {
    return { error: "Adres pokoju: małe litery, cyfry i myślniki." };
  }

  try {
    await db
      .update(rooms)
      .set({
        number: parsed.data.number,
        slug: newSlug,
        name: parsed.data.name,
        floor: parsed.data.floor,
        maxGuests: parsed.data.maxGuests,
        published: parsed.data.published,
      })
      .where(and(eq(rooms.id, roomId), eq(rooms.hotelId, hotel.id)));

    // Slug renames must never break printed QR stickers (301 via room_redirects).
    if (newSlug !== room.slug) {
      await db
        .insert(roomRedirects)
        .values({ hotelId: hotel.id, roomId: room.id, oldSlug: room.slug })
        .onConflictDoNothing();
    }
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: "Pokój z tym numerem lub adresem już istnieje." };
    }
    throw err;
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function deleteRoomAction(roomId: string): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  await db
    .delete(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.hotelId, hotel.id)));

  revalidatePath(`/${hotel.slug}`, "layout");
  redirect("/panel/pokoje");
}

export async function toggleRoomPublishedAction(
  roomId: string,
  published: boolean,
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  await db
    .update(rooms)
    .set({ published })
    .where(and(eq(rooms.id, roomId), eq(rooms.hotelId, hotel.id)));

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function moveRoomAction(
  roomId: string,
  direction: "up" | "down",
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  const all = await db
    .select({ id: rooms.id, sortOrder: rooms.sortOrder })
    .from(rooms)
    .where(eq(rooms.hotelId, hotel.id))
    .orderBy(asc(rooms.sortOrder), asc(rooms.number));
  const index = all.findIndex((r) => r.id === roomId);
  const neighbor = direction === "up" ? all[index - 1] : all[index + 1];
  if (!neighbor) return {};

  await db.transaction(async (tx) => {
    await tx.update(rooms).set({ sortOrder: neighbor.sortOrder }).where(eq(rooms.id, room.id));
    await tx.update(rooms).set({ sortOrder: room.sortOrder }).where(eq(rooms.id, neighbor.id));
  });

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function setRoomAmenitiesAction(
  roomId: string,
  amenityIds: string[],
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  // Only amenities from this hotel's catalog are accepted.
  const valid = amenityIds.length
    ? await db
        .select({ id: amenities.id })
        .from(amenities)
        .where(
          and(eq(amenities.hotelId, hotel.id), inArray(amenities.id, amenityIds)),
        )
    : [];
  const validIds = new Set(valid.map((v) => v.id));

  await db.transaction(async (tx) => {
    await tx.delete(roomAmenities).where(eq(roomAmenities.roomId, roomId));
    if (validIds.size) {
      await tx
        .insert(roomAmenities)
        .values([...validIds].map((amenityId) => ({ roomId, amenityId })));
    }
  });

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

// --- Room section overrides and extras -------------------------------------

/** Create or update the room's override of a hotel template section. */
export async function overrideTemplateSectionAction(
  roomId: string,
  templateId: string,
  input: z.input<typeof sectionSchema>,
): Promise<ActionState> {
  const parsed = sectionSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  const [template] = await db
    .select()
    .from(roomSections)
    .where(
      and(
        eq(roomSections.id, templateId),
        eq(roomSections.hotelId, hotel.id),
        isNull(roomSections.roomId),
      ),
    )
    .limit(1);
  if (!template) return { error: "Nie znaleziono sekcji szablonu." };

  const [existing] = await db
    .select()
    .from(roomSections)
    .where(
      and(
        eq(roomSections.roomId, roomId),
        eq(roomSections.basedOnId, templateId),
      ),
    )
    .limit(1);

  const values = {
    title: parsed.data.title,
    body: parsed.data.body,
    icon: safeIcon(parsed.data.icon),
    enabled: true,
  };

  if (existing) {
    await db.update(roomSections).set(values).where(eq(roomSections.id, existing.id));
  } else {
    await db.insert(roomSections).values({
      ...values,
      hotelId: hotel.id,
      roomId,
      basedOnId: templateId,
      sortOrder: template.sortOrder,
    });
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Hide (or restore) a template section for this room via enabled=false override. */
export async function setTemplateHiddenAction(
  roomId: string,
  templateId: string,
  hidden: boolean,
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  const [template] = await db
    .select()
    .from(roomSections)
    .where(
      and(
        eq(roomSections.id, templateId),
        eq(roomSections.hotelId, hotel.id),
        isNull(roomSections.roomId),
      ),
    )
    .limit(1);
  if (!template) return { error: "Nie znaleziono sekcji szablonu." };

  const [existing] = await db
    .select()
    .from(roomSections)
    .where(
      and(
        eq(roomSections.roomId, roomId),
        eq(roomSections.basedOnId, templateId),
      ),
    )
    .limit(1);

  if (!hidden && !existing) return {}; // nothing to restore

  if (existing) {
    await db
      .update(roomSections)
      .set({ enabled: !hidden })
      .where(eq(roomSections.id, existing.id));
  } else {
    // Copy template content so "restore later" keeps something to edit.
    await db.insert(roomSections).values({
      hotelId: hotel.id,
      roomId,
      basedOnId: templateId,
      title: template.title,
      body: template.body,
      icon: template.icon,
      sortOrder: template.sortOrder,
      enabled: false,
    });
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Delete the room's override — the section goes back to inheriting the template. */
export async function resetTemplateOverrideAction(
  roomId: string,
  templateId: string,
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  await db
    .delete(roomSections)
    .where(
      and(
        eq(roomSections.roomId, roomId),
        eq(roomSections.basedOnId, templateId),
        eq(roomSections.hotelId, hotel.id),
      ),
    );

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Create or update a room-only extra section. */
export async function upsertExtraSectionAction(
  roomId: string,
  input: z.input<typeof sectionSchema> & { id?: string },
): Promise<ActionState> {
  const parsed = sectionSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  const values = {
    title: parsed.data.title,
    body: parsed.data.body,
    icon: safeIcon(parsed.data.icon),
    enabled: parsed.data.enabled,
  };

  if (input.id) {
    const existing = await findRoomSection(hotel.id, input.id);
    if (!existing || existing.roomId !== roomId || existing.basedOnId) {
      return { error: "Nie znaleziono sekcji." };
    }
    await db.update(roomSections).set(values).where(eq(roomSections.id, input.id));
  } else {
    const sortOrder = await nextSortOrder(hotel.id, { roomId });
    await db.insert(roomSections).values({
      ...values,
      hotelId: hotel.id,
      roomId,
      basedOnId: null,
      sortOrder,
    });
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Delete a room-level section (override or extra). */
export async function deleteRoomSectionAction(sectionId: string): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const section = await findRoomSection(hotel.id, sectionId);
  if (!section) return { error: "Nie znaleziono sekcji." };

  await db.delete(roomSections).where(eq(roomSections.id, sectionId));

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Move a room-only extra section up/down. */
export async function moveExtraSectionAction(
  sectionId: string,
  direction: "up" | "down",
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const section = await findRoomSection(hotel.id, sectionId);
  if (!section || !section.roomId || section.basedOnId) return {};

  const all = await db
    .select({ id: roomSections.id, sortOrder: roomSections.sortOrder })
    .from(roomSections)
    .where(
      and(
        eq(roomSections.roomId, section.roomId),
        isNull(roomSections.basedOnId),
      ),
    )
    .orderBy(asc(roomSections.sortOrder), asc(roomSections.id));
  const index = all.findIndex((s) => s.id === sectionId);
  const neighbor = direction === "up" ? all[index - 1] : all[index + 1];
  if (!neighbor) return {};

  await db.transaction(async (tx) => {
    await tx
      .update(roomSections)
      .set({ sortOrder: neighbor.sortOrder })
      .where(eq(roomSections.id, section.id));
    await tx
      .update(roomSections)
      .set({ sortOrder: section.sortOrder })
      .where(eq(roomSections.id, neighbor.id));
  });

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}
