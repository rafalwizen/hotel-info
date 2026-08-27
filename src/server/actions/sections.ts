"use server";

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { hotelSections, roomSections } from "@/db/schema";
import { isValidIcon } from "@/lib/icons";
import { requireHotel } from "@/server/tenancy";
import { sectionSchema } from "@/lib/validation/section";
import type { ActionState } from "@/lib/validation/types";

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Sprawdź poprawność danych";
}

function safeIcon(icon: string): string {
  return isValidIcon(icon) ? icon : "info";
}

async function nextTemplateSortOrder(hotelId: string): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${roomSections.sortOrder}), 0)` })
    .from(roomSections)
    .where(and(eq(roomSections.hotelId, hotelId), isNull(roomSections.roomId)));
  return Number(row?.max ?? 0) + 1;
}

async function nextHotelSectionSortOrder(hotelId: string): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${hotelSections.sortOrder}), 0)` })
    .from(hotelSections)
    .where(eq(hotelSections.hotelId, hotelId));
  return Number(row?.max ?? 0) + 1;
}

// --- Room templates (roomId NULL, applied to every room) --------------------

export async function upsertTemplateSectionAction(
  input: z.input<typeof sectionSchema> & { id?: string },
): Promise<ActionState> {
  const parsed = sectionSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const values = {
    title: parsed.data.title,
    body: parsed.data.body,
    icon: safeIcon(parsed.data.icon),
    enabled: parsed.data.enabled,
  };

  if (input.id) {
    const [existing] = await db
      .select({ id: roomSections.id })
      .from(roomSections)
      .where(
        and(
          eq(roomSections.id, input.id),
          eq(roomSections.hotelId, hotel.id),
          isNull(roomSections.roomId),
        ),
      )
      .limit(1);
    if (!existing) return { error: "Nie znaleziono sekcji." };
    await db.update(roomSections).set(values).where(eq(roomSections.id, input.id));
  } else {
    await db.insert(roomSections).values({
      ...values,
      hotelId: hotel.id,
      roomId: null,
      basedOnId: null,
      sortOrder: await nextTemplateSortOrder(hotel.id),
    });
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function deleteTemplateSectionAction(sectionId: string): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const [existing] = await db
    .select({ id: roomSections.id })
    .from(roomSections)
    .where(
      and(
        eq(roomSections.id, sectionId),
        eq(roomSections.hotelId, hotel.id),
        isNull(roomSections.roomId),
      ),
    )
    .limit(1);
  if (!existing) return { error: "Nie znaleziono sekcji." };

  // Overrides cascade via based_on_id FK.
  await db.delete(roomSections).where(eq(roomSections.id, sectionId));

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function moveTemplateSectionAction(
  sectionId: string,
  direction: "up" | "down",
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const [section] = await db
    .select()
    .from(roomSections)
    .where(
      and(
        eq(roomSections.id, sectionId),
        eq(roomSections.hotelId, hotel.id),
        isNull(roomSections.roomId),
      ),
    )
    .limit(1);
  if (!section) return { error: "Nie znaleziono sekcji." };

  const all = await db
    .select({ id: roomSections.id, sortOrder: roomSections.sortOrder })
    .from(roomSections)
    .where(and(eq(roomSections.hotelId, hotel.id), isNull(roomSections.roomId)))
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

// --- Hotel sections (reception, breakfast, parking...) ----------------------

export async function upsertHotelSectionAction(
  input: z.input<typeof sectionSchema> & { id?: string },
): Promise<ActionState> {
  const parsed = sectionSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const values = {
    title: parsed.data.title,
    body: parsed.data.body,
    icon: safeIcon(parsed.data.icon),
    enabled: parsed.data.enabled,
  };

  if (input.id) {
    const [existing] = await db
      .select({ id: hotelSections.id })
      .from(hotelSections)
      .where(
        and(eq(hotelSections.id, input.id), eq(hotelSections.hotelId, hotel.id)),
      )
      .limit(1);
    if (!existing) return { error: "Nie znaleziono sekcji." };
    await db.update(hotelSections).set(values).where(eq(hotelSections.id, input.id));
  } else {
    await db.insert(hotelSections).values({
      ...values,
      hotelId: hotel.id,
      sortOrder: await nextHotelSectionSortOrder(hotel.id),
    });
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function deleteHotelSectionAction(sectionId: string): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const [existing] = await db
    .select({ id: hotelSections.id })
    .from(hotelSections)
    .where(
      and(eq(hotelSections.id, sectionId), eq(hotelSections.hotelId, hotel.id)),
    )
    .limit(1);
  if (!existing) return { error: "Nie znaleziono sekcji." };

  await db.delete(hotelSections).where(eq(hotelSections.id, sectionId));

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function moveHotelSectionAction(
  sectionId: string,
  direction: "up" | "down",
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const [section] = await db
    .select()
    .from(hotelSections)
    .where(
      and(eq(hotelSections.id, sectionId), eq(hotelSections.hotelId, hotel.id)),
    )
    .limit(1);
  if (!section) return { error: "Nie znaleziono sekcji." };

  const all = await db
    .select({ id: hotelSections.id, sortOrder: hotelSections.sortOrder })
    .from(hotelSections)
    .where(eq(hotelSections.hotelId, hotel.id))
    .orderBy(asc(hotelSections.sortOrder), asc(hotelSections.id));
  const index = all.findIndex((s) => s.id === sectionId);
  const neighbor = direction === "up" ? all[index - 1] : all[index + 1];
  if (!neighbor) return {};

  await db.transaction(async (tx) => {
    await tx
      .update(hotelSections)
      .set({ sortOrder: neighbor.sortOrder })
      .where(eq(hotelSections.id, section.id));
    await tx
      .update(hotelSections)
      .set({ sortOrder: section.sortOrder })
      .where(eq(hotelSections.id, neighbor.id));
  });

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}
