"use server";

import { count, eq, inArray } from "drizzle-orm";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/auth";
import { db } from "@/db";
import {
  amenities,
  arrivalSteps,
  hotelSections,
  hotels,
  memberships,
  roomAmenities,
  roomRedirects,
  roomSections,
  rooms,
  users,
} from "@/db/schema";
import { requireUser } from "@/server/tenancy";
import type { AuthActionState } from "@/lib/validation/auth";

/**
 * Data subject rights tooling (RODO art. 15/17/20).
 *
 * NOTE on cascades: `hotels` has NO FK to `users` — only `memberships` links
 * them. Deleting the user alone would leave orphaned hotels, so account
 * deletion removes the hotels explicitly; all content tables then cascade
 * from `hotels`, and `memberships`/`password_reset_tokens` cascade from
 * `users`.
 */

/** Best-effort blob removal — a dangling photo is cosmetic, not fatal. */
async function deleteBlobQuietly(url: string | null): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch (err) {
    console.error("[account] blob delete failed", err);
  }
}

export async function exportAccountDataAction(): Promise<string> {
  const user = await requireUser();

  const userMemberships = await db.select().from(memberships).where(eq(memberships.userId, user.id));
  const hotelIds = userMemberships.map((m) => m.hotelId);

  const userHotels = hotelIds.length
    ? await db.select().from(hotels).where(inArray(hotels.id, hotelIds))
    : [];

  const [userRooms, userAmenities, userHotelSections, userRoomSections, userArrivalSteps, userRoomRedirects] =
    hotelIds.length
      ? await Promise.all([
          db.select().from(rooms).where(inArray(rooms.hotelId, hotelIds)),
          db.select().from(amenities).where(inArray(amenities.hotelId, hotelIds)),
          db.select().from(hotelSections).where(inArray(hotelSections.hotelId, hotelIds)),
          db.select().from(roomSections).where(inArray(roomSections.hotelId, hotelIds)),
          db.select().from(arrivalSteps).where(inArray(arrivalSteps.hotelId, hotelIds)),
          db.select().from(roomRedirects).where(inArray(roomRedirects.hotelId, hotelIds)),
        ])
      : [[], [], [], [], [], []];

  // Room amenities link rooms to amenities; fetch by the room ids we own.
  const roomIds = userRooms.map((r) => r.id);
  const userRoomAmenities = roomIds.length
    ? await db.select().from(roomAmenities).where(inArray(roomAmenities.roomId, roomIds))
    : [];

  const [userRow] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      termsAcceptedAt: users.termsAcceptedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      account: userRow,
      memberships: userMemberships,
      hotels: userHotels,
      rooms: userRooms,
      amenities: userAmenities,
      roomAmenities: userRoomAmenities,
      hotelSections: userHotelSections,
      roomSections: userRoomSections,
      arrivalSteps: userArrivalSteps,
      roomRedirects: userRoomRedirects,
    },
    null,
    2,
  );
}

export async function deleteAccountAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const user = await requireUser();

  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (confirm !== user.email.toLowerCase()) {
    return { error: "Wpisz dokładnie swój adres e-mail, aby potwierdzić usunięcie konta." };
  }

  const userMemberships = await db
    .select({ hotelId: memberships.hotelId })
    .from(memberships)
    .where(eq(memberships.userId, user.id));
  const hotelIds = userMemberships.map((m) => m.hotelId);

  // Future-proofing for team access: refuse to delete hotels shared with
  // another member — their account would lose data they never agreed to lose.
  if (hotelIds.length) {
    for (const hotelId of hotelIds) {
      const [{ members }] = await db
        .select({ members: count() })
        .from(memberships)
        .where(eq(memberships.hotelId, hotelId));
      if (members > 1) {
        return {
          error:
            "Jeden z Twoich obiektów ma dodatkowych członków. Usuń ich najpierw lub napisz do nas.",
        };
      }
    }
  }

  const userHotels = hotelIds.length
    ? await db.select().from(hotels).where(inArray(hotels.id, hotelIds))
    : [];
  const slugs = userHotels.map((h) => h.slug);
  const photoUrls = userHotels.map((h) => h.logoUrl);

  const arrivalPhotos = hotelIds.length
    ? await db
        .select({ photoUrl: arrivalSteps.photoUrl })
        .from(arrivalSteps)
        .where(inArray(arrivalSteps.hotelId, hotelIds))
    : [];
  photoUrls.push(...arrivalPhotos.map((s) => s.photoUrl));

  await db.transaction(async (tx) => {
    // Hotels first (content cascades from them), then the user (memberships
    // and reset tokens cascade from the user).
    if (hotelIds.length) {
      await tx.delete(hotels).where(inArray(hotels.id, hotelIds));
    }
    await tx.delete(users).where(eq(users.id, user.id));
  });

  // Guest pages and ISR caches must drop immediately.
  for (const slug of slugs) {
    revalidatePath(`/${slug}`, "layout");
  }
  // Blob cleanup is best-effort and must never block the deletion.
  await Promise.all(photoUrls.map((url) => deleteBlobQuietly(url)));

  // signOut throws NEXT_REDIRECT on success — must stay outside try/catch.
  await signOut({ redirectTo: "/" });
}
