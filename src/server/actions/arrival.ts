"use server";

import { and, asc, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { del, put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { arrivalSteps, hotels, rooms } from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { arrivalMapSchema, arrivalStepSchema } from "@/lib/validation/arrival";
import type { ActionState } from "@/lib/validation/types";

type ArrivalStep = typeof arrivalSteps.$inferSelect;
type Room = typeof rooms.$inferSelect;

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

/** Load a room scoped to the current hotel, or null (no existence leaks). */
async function findRoom(hotelId: string, roomId: string): Promise<Room | null> {
  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.hotelId, hotelId)))
    .limit(1);
  return room ?? null;
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

/** Load an arrival step scoped to the current hotel (room overrides/extras only). */
async function findRoomStep(
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
        isNotNull(arrivalSteps.roomId),
      ),
    )
    .limit(1);
  return step ?? null;
}

/**
 * Delete a room-level step's photo blob — unless the template still uses
 * the same URL (hidden overrides copy the template photo by reference).
 */
async function deleteRoomStepBlob(step: ArrivalStep): Promise<void> {
  let templatePhoto: string | null = null;
  if (step.basedOnId) {
    const [template] = await db
      .select({ photoUrl: arrivalSteps.photoUrl })
      .from(arrivalSteps)
      .where(eq(arrivalSteps.id, step.basedOnId))
      .limit(1);
    templatePhoto = template?.photoUrl ?? null;
  }
  if (step.photoUrl && step.photoUrl !== templatePhoto) {
    await deleteBlobQuietly(step.photoUrl);
  }
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

  // Room overrides cascade via based_on_id FK — collect their photos first.
  const overrides = await db
    .select({ photoUrl: arrivalSteps.photoUrl })
    .from(arrivalSteps)
    .where(eq(arrivalSteps.basedOnId, stepId));

  await db.delete(arrivalSteps).where(eq(arrivalSteps.id, stepId));

  const photos = new Set(
    overrides
      .map((o) => o.photoUrl)
      .filter((p): p is string => Boolean(p) && p !== existing.photoUrl),
  );
  if (existing.photoUrl) photos.add(existing.photoUrl);
  for (const photo of photos) await deleteBlobQuietly(photo);

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

// --- Room overrides and extras ---------------------------------------------

/** Create or update the room's override of a hotel arrival template step. */
export async function overrideTemplateArrivalStepAction(
  roomId: string,
  templateId: string,
  input: z.input<typeof arrivalStepSchema> & { photoUrl?: string | null },
): Promise<ActionState> {
  const parsed = arrivalStepSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  const template = await findTemplateStep(hotel.id, templateId);
  if (!template) return { error: "Nie znaleziono kroku szablonu." };

  const [existing] = await db
    .select()
    .from(arrivalSteps)
    .where(
      and(eq(arrivalSteps.roomId, roomId), eq(arrivalSteps.basedOnId, templateId)),
    )
    .limit(1);

  const photoUrl = input.photoUrl?.trim() || null;
  const values = { title: parsed.data.title, body: parsed.data.body, photoUrl, enabled: true };

  if (existing) {
    await db.update(arrivalSteps).set(values).where(eq(arrivalSteps.id, existing.id));
    // Replaced photo (not shared with the template) is orphaned — drop it.
    if (
      existing.photoUrl &&
      existing.photoUrl !== photoUrl &&
      existing.photoUrl !== template.photoUrl
    ) {
      await deleteBlobQuietly(existing.photoUrl);
    }
  } else {
    await db.insert(arrivalSteps).values({
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

/** Hide (or restore) a template step for this room via enabled=false override. */
export async function setTemplateArrivalHiddenAction(
  roomId: string,
  templateId: string,
  hidden: boolean,
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  const template = await findTemplateStep(hotel.id, templateId);
  if (!template) return { error: "Nie znaleziono kroku szablonu." };

  const [existing] = await db
    .select()
    .from(arrivalSteps)
    .where(
      and(eq(arrivalSteps.roomId, roomId), eq(arrivalSteps.basedOnId, templateId)),
    )
    .limit(1);

  if (!hidden && !existing) return {}; // nothing to restore

  if (existing) {
    await db
      .update(arrivalSteps)
      .set({ enabled: !hidden })
      .where(eq(arrivalSteps.id, existing.id));
  } else {
    // Copy template content (photo by reference) so "restore later" keeps something to edit.
    await db.insert(arrivalSteps).values({
      hotelId: hotel.id,
      roomId,
      basedOnId: templateId,
      title: template.title,
      body: template.body,
      photoUrl: template.photoUrl,
      sortOrder: template.sortOrder,
      enabled: false,
    });
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Delete the room's override — the step goes back to inheriting the template. */
export async function resetArrivalOverrideAction(
  roomId: string,
  templateId: string,
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  const [existing] = await db
    .select()
    .from(arrivalSteps)
    .where(
      and(
        eq(arrivalSteps.roomId, roomId),
        eq(arrivalSteps.basedOnId, templateId),
        eq(arrivalSteps.hotelId, hotel.id),
      ),
    )
    .limit(1);
  if (existing) {
    await db.delete(arrivalSteps).where(eq(arrivalSteps.id, existing.id));
    await deleteRoomStepBlob(existing);
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Next sortOrder at the end of a room's own steps. */
async function nextExtraSortOrder(roomId: string): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${arrivalSteps.sortOrder}), 0)` })
    .from(arrivalSteps)
    .where(and(eq(arrivalSteps.roomId, roomId), isNull(arrivalSteps.basedOnId)));
  return Number(row?.max ?? 0) + 1;
}

/** Create or update a room-only arrival step. */
export async function upsertExtraArrivalStepAction(
  roomId: string,
  input: z.input<typeof arrivalStepSchema> & { id?: string; photoUrl?: string | null },
): Promise<ActionState> {
  const parsed = arrivalStepSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  const room = await findRoom(hotel.id, roomId);
  if (!room) return { error: "Nie znaleziono pokoju." };

  const photoUrl = input.photoUrl?.trim() || null;
  const values = { title: parsed.data.title, body: parsed.data.body, photoUrl };

  if (input.id) {
    const existing = await findRoomStep(hotel.id, input.id);
    if (!existing || existing.roomId !== roomId || existing.basedOnId) {
      return { error: "Nie znaleziono kroku." };
    }
    await db.update(arrivalSteps).set(values).where(eq(arrivalSteps.id, input.id));
    if (existing.photoUrl && existing.photoUrl !== photoUrl) {
      await deleteBlobQuietly(existing.photoUrl);
    }
  } else {
    await db.insert(arrivalSteps).values({
      ...values,
      hotelId: hotel.id,
      roomId,
      basedOnId: null,
      sortOrder: await nextExtraSortOrder(roomId),
    });
  }

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Delete a room-level arrival step (override or extra). */
export async function deleteExtraArrivalStepAction(stepId: string): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const step = await findRoomStep(hotel.id, stepId);
  if (!step) return { error: "Nie znaleziono kroku." };

  await db.delete(arrivalSteps).where(eq(arrivalSteps.id, stepId));
  await deleteRoomStepBlob(step);

  revalidatePath(`/${hotel.slug}`, "layout");
  return {};
}

/** Move a room-only arrival step up/down. */
export async function moveExtraArrivalStepAction(
  stepId: string,
  direction: "up" | "down",
): Promise<ActionState> {
  const { hotel } = await requireHotel();
  const step = await findRoomStep(hotel.id, stepId);
  if (!step || !step.roomId || step.basedOnId) return {};

  const all = await db
    .select({ id: arrivalSteps.id, sortOrder: arrivalSteps.sortOrder })
    .from(arrivalSteps)
    .where(
      and(eq(arrivalSteps.roomId, step.roomId), isNull(arrivalSteps.basedOnId)),
    )
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
