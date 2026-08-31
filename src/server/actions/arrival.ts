"use server";

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { del, put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { arrivalSteps, hotels } from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { arrivalMapSchema, arrivalStepSchema } from "@/lib/validation/arrival";
import type { ActionState } from "@/lib/validation/types";

type ArrivalStep = typeof arrivalSteps.$inferSelect;

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Sprawdź poprawność danych";
}

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

/** Best-effort blob removal — a dangling photo is cosmetic, not fatal. */
async function deleteBlobQuietly(url: string | null): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch (err) {
    console.error("[arrival] blob delete failed", err);
  }
}

/** Load an arrival step scoped to the current hotel; template scope only. */
async function findTemplateStep(
  hotelId: string,
  stepId: string,
): Promise<ArrivalStep | null> {
  const [step] = await db
    .select()
    .from(arrivalSteps)
    .where(
      and(
        eq(arrivalSteps.id, stepId),
        eq(arrivalSteps.hotelId, hotelId),
        isNull(arrivalSteps.roomId),
      ),
    )
    .limit(1);
  return step ?? null;
}

async function nextTemplateSortOrder(hotelId: string): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${arrivalSteps.sortOrder}), 0)` })
    .from(arrivalSteps)
    .where(and(eq(arrivalSteps.hotelId, hotelId), isNull(arrivalSteps.roomId)));
  return Number(row?.max ?? 0) + 1;
}

/**
 * Photo upload for arrival steps. The client downscales to <=1600px JPEG
 * before sending, so this only validates type/size and stores the blob.
 * Returns the public URL the editor then saves with the step.
 */
export async function uploadArrivalPhotoAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const { hotel } = await requireHotel();

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Nie wybrano pliku." };
  if (!PHOTO_TYPES.has(file.type)) {
    return { error: "Dozwolone formaty: JPG, PNG, WebP." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: "Zdjęcie jest za duże (limit 4 MB)." };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  try {
    const blob = await put(`arrival/${hotel.id}/${nanoid(12)}.${ext}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return { url: blob.url };
  } catch (err) {
    console.error("[arrival] blob put failed", err);
    return { error: "Nie udało się wysłać zdjęcia. Spróbuj ponownie." };
  }
}

/** Create or update a hotel-wide arrival step (roomId NULL template). */
export async function upsertArrivalStepAction(
  input: z.input<typeof arrivalStepSchema> & {
    id?: string;
    photoUrl?: string | null;
  },
): Promise<ActionState> {
  const parsed = arrivalStepSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const photoUrl = input.photoUrl?.trim() || null;

  if (input.id) {
    const existing = await findTemplateStep(hotel.id, input.id);
    if (!existing) return { error: "Nie znaleziono kroku." };
    await db
      .update(arrivalSteps)
      .set({ title: parsed.data.title, body: parsed.data.body, photoUrl })
      .where(eq(arrivalSteps.id, input.id));
    // Replaced photo -> the old blob is orphaned, drop it.
    if (existing.photoUrl && existing.photoUrl !== photoUrl) {
      await deleteBlobQuietly(existing.photoUrl);
    }
  } else {
    await db.insert(arrivalSteps).values({
      hotelId: hotel.id,
      roomId: null,
      basedOnId: null,
      title: parsed.data.title,
      body: parsed.data.body,
      photoUrl,
      sortOrder: await nextTemplateSortOrder(hotel.id),
    });
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function deleteArrivalStepAction(stepId: string): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const existing = await findTemplateStep(hotel.id, stepId);
  if (!existing) return { error: "Nie znaleziono kroku." };

  // Room overrides cascade via based_on_id FK.
  await db.delete(arrivalSteps).where(eq(arrivalSteps.id, stepId));
  await deleteBlobQuietly(existing.photoUrl);

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

export async function moveArrivalStepAction(
  stepId: string,
  direction: "up" | "down",
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const step = await findTemplateStep(hotel.id, stepId);
  if (!step) return { error: "Nie znaleziono kroku." };

  const all = await db
    .select({ id: arrivalSteps.id, sortOrder: arrivalSteps.sortOrder })
    .from(arrivalSteps)
    .where(and(eq(arrivalSteps.hotelId, hotel.id), isNull(arrivalSteps.roomId)))
    .orderBy(asc(arrivalSteps.sortOrder), asc(arrivalSteps.id));
  const index = all.findIndex((s) => s.id === stepId);
  const neighbor = direction === "up" ? all[index - 1] : all[index + 1];
  if (!neighbor) return {};

  await db.transaction(async (tx) => {
    await tx
      .update(arrivalSteps)
      .set({ sortOrder: neighbor.sortOrder })
      .where(eq(arrivalSteps.id, step.id));
    await tx
      .update(arrivalSteps)
      .set({ sortOrder: step.sortOrder })
      .where(eq(arrivalSteps.id, neighbor.id));
  });

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Save the map pin link shown on the arrival guide page. */
export async function updateArrivalMapAction(
  input: z.input<typeof arrivalMapSchema>,
): Promise<ActionState> {
  const parsed = arrivalMapSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  await db
    .update(hotels)
    .set({ arrivalMapUrl: parsed.data.mapUrl || null })
    .where(eq(hotels.id, hotel.id));

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}
