"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hotels, memberships } from "@/db/schema";
import { isReservedSlug, isValidSlug, slugify } from "@/lib/slug";
import { requireHotel, requireUser } from "@/server/tenancy";
import {
  createHotelSchema,
  hotelSettingsSchema,
} from "@/lib/validation/hotel";
import type { ActionState } from "@/lib/validation/types";

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Sprawdź poprawność danych";
}

/** Revalidate every guest page of this hotel (path layout covers /[hotel]/**). */
export async function revalidateHotel(slug: string): Promise<void> {
  revalidatePath(`/${slug}`, "layout");
}

/**
 * Onboarding: create the hotel and its OWNER membership in one transaction.
 * The hotel slug is immutable after creation — printed QR codes depend on it.
 */
export async function createHotelAction(
  input: z.input<typeof createHotelSchema>,
): Promise<ActionState> {
  const parsed = createHotelSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const user = await requireUser();

  // Already onboarded — never create a second hotel for one account.
  const [existing] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1);
  if (existing) redirect("/panel");

  const slug = slugify(parsed.data.slug);
  if (!isValidSlug(slug)) {
    return { error: "Adres musi mieć co najmniej 2 znaki (małe litery, cyfry, myślniki)" };
  }
  if (isReservedSlug(slug)) {
    return { error: "Ten adres jest zarezerwowany dla systemu — wybierz inny." };
  }

  const [taken] = await db
    .select({ id: hotels.id })
    .from(hotels)
    .where(eq(hotels.slug, slug))
    .limit(1);
  if (taken) return { error: "Hotel z tym adresem już istnieje — wybierz inny." };

  await db.transaction(async (tx) => {
    const [hotel] = await tx
      .insert(hotels)
      .values({
        slug,
        name: parsed.data.name ?? { pl: slug, en: "" },
        brandColor: parsed.data.brandColor ?? "#0f766e",
        wifiSsid: parsed.data.wifiSsid ?? "",
        wifiPassword: parsed.data.wifiPassword ?? "",
        checkinFrom: parsed.data.checkinFrom ?? "15:00",
        checkoutUntil: parsed.data.checkoutUntil ?? "11:00",
        phone: parsed.data.phone ?? "",
        email: parsed.data.email ?? "",
        addressLine: parsed.data.addressLine ?? "",
      })
      .returning({ id: hotels.id });
    await tx
      .insert(memberships)
      .values({ userId: user.id, hotelId: hotel.id });
  });

  // The /panel layout was rendered bare on /panel/start; without this the
  // client router reuses it and the sidebar never appears after the redirect.
  revalidatePath("/panel", "layout");
  redirect("/panel/pokoje");
}

export async function updateHotelSettingsAction(
  input: z.input<typeof hotelSettingsSchema>,
): Promise<ActionState> {
  const parsed = hotelSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { hotel } = await requireHotel();
  await db
    .update(hotels)
    .set({
      name: parsed.data.name,
      brandColor: parsed.data.brandColor,
      wifiSsid: parsed.data.wifiSsid,
      wifiPassword: parsed.data.wifiPassword,
      checkinFrom: parsed.data.checkinFrom,
      checkoutUntil: parsed.data.checkoutUntil,
      phone: parsed.data.phone,
      email: parsed.data.email,
      addressLine: parsed.data.addressLine,
    })
    .where(eq(hotels.id, hotel.id));

  await revalidateHotel(hotel.slug);
  return {};
}
