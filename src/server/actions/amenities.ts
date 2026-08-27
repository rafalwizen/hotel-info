"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { amenities } from "@/db/schema";
import { isValidIcon } from "@/lib/icons";
import { requireHotel } from "@/server/tenancy";
import { amenitySchema } from "@/lib/validation/amenity";
import type { ActionState } from "@/lib/validation/types";

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Sprawdź poprawność danych";
}

function safeIcon(icon: string): string {
  return isValidIcon(icon) ? icon : "check";
}

export async function upsertAmenityAction(
  input: z.input<typeof amenitySchema> & { id?: string },
): Promise<ActionState> {
  const parsed = amenitySchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const values = { label: parsed.data.label, icon: safeIcon(parsed.data.icon) };

  if (input.id) {
    const [existing] = await db
      .select({ id: amenities.id })
      .from(amenities)
      .where(and(eq(amenities.id, input.id), eq(amenities.hotelId, hotel.id)))
      .limit(1);
    if (!existing) return { error: "Nie znaleziono udogodnienia." };
    await db.update(amenities).set(values).where(eq(amenities.id, input.id));
  } else {
    const [row] = await db
      .select({ max: sql<number>`coalesce(max(${amenities.sortOrder}), 0)` })
      .from(amenities)
      .where(eq(amenities.hotelId, hotel.id));
    await db.insert(amenities).values({
      ...values,
      hotelId: hotel.id,
      sortOrder: Number(row?.max ?? 0) + 1,
    });
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function deleteAmenityAction(amenityId: string): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const [existing] = await db
    .select({ id: amenities.id })
    .from(amenities)
    .where(and(eq(amenities.id, amenityId), eq(amenities.hotelId, hotel.id)))
    .limit(1);
  if (!existing) return { error: "Nie znaleziono udogodnienia." };

  // room_amenities rows cascade.
  await db.delete(amenities).where(eq(amenities.id, amenityId));

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function moveAmenityAction(
  amenityId: string,
  direction: "up" | "down",
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const [amenity] = await db
    .select()
    .from(amenities)
    .where(and(eq(amenities.id, amenityId), eq(amenities.hotelId, hotel.id)))
    .limit(1);
  if (!amenity) return { error: "Nie znaleziono udogodnienia." };

  const all = await db
    .select({ id: amenities.id, sortOrder: amenities.sortOrder })
    .from(amenities)
    .where(eq(amenities.hotelId, hotel.id))
    .orderBy(asc(amenities.sortOrder), asc(amenities.id));
  const index = all.findIndex((a) => a.id === amenityId);
  const neighbor = direction === "up" ? all[index - 1] : all[index + 1];
  if (!neighbor) return {};

  await db.transaction(async (tx) => {
    await tx
      .update(amenities)
      .set({ sortOrder: neighbor.sortOrder })
      .where(eq(amenities.id, amenity.id));
    await tx
      .update(amenities)
      .set({ sortOrder: amenity.sortOrder })
      .where(eq(amenities.id, neighbor.id));
  });

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}
