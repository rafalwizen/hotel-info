import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { hotels, memberships, rooms } from "@/db/schema";
import { resolveGuestBaseUrl } from "@/lib/qr";

/**
 * QR-side loaders. Unlike panel pages these CANNOT use requireHotel(): it
 * redirects to /zaloguj, which for an <img>/download fetch would surface as
 * a broken image. Here every failure is a plain 404 — same "no existence
 * leaks" rule, response-shaped for an API route.
 */

/** Request-scoped guest base URL (env override, header fallback). */
export async function guestBaseUrl(): Promise<string> {
  const h = await headers();
  return resolveGuestBaseUrl(
    process.env.NEXT_PUBLIC_GUEST_BASE_URL,
    h.get("x-forwarded-proto") ?? "http",
    h.get("host") ?? "localhost:3000",
  );
}

/**
 * A room owned by the caller's hotel, or null. The membership join IS the
 * tenancy check: a foreign roomId simply does not match.
 */
export async function getRoomForQr(roomId: string): Promise<{
  hotelSlug: string;
  roomSlug: string;
  roomNumber: string;
} | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [row] = await db
    .select({ hotelSlug: hotels.slug, roomSlug: rooms.slug, roomNumber: rooms.number })
    .from(rooms)
    .innerJoin(hotels, eq(rooms.hotelId, hotels.id))
    .innerJoin(memberships, eq(memberships.hotelId, hotels.id))
    .where(and(eq(memberships.userId, session.user.id), eq(rooms.id, roomId)))
    .limit(1);

  return row ?? null;
}

/** The caller's hotel, or null — same shape as getRoomForQr. */
export async function getHotelForQr(): Promise<{ hotelSlug: string } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [row] = await db
    .select({ hotelSlug: hotels.slug })
    .from(hotels)
    .innerJoin(memberships, eq(memberships.hotelId, hotels.id))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  return row ?? null;
}
