import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { hotels, memberships } from "@/db/schema";

type Hotel = typeof hotels.$inferSelect;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

/**
 * Session-only guard. Use on pages that must exist BEFORE the user has a
 * hotel (e.g. the onboarding wizard). Redirects to /zaloguj when anonymous.
 */
export const requireUser = cache(async (): Promise<SessionUser> => {
  const session = await auth();
  if (!session?.user?.id || !session?.user.email) {
    redirect("/zaloguj");
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? "",
  };
});

/**
 * THE multi-tenancy entry point. Every admin page and Server Function MUST
 * call this first and scope all queries by the returned hotel.id.
 * Redirects: anonymous -> /zaloguj, no hotel yet -> /panel/start.
 */
export const requireHotel = cache(async (): Promise<{ user: SessionUser; hotel: Hotel }> => {
  const user = await requireUser();

  const [row] = await db
    .select({ hotel: hotels, role: memberships.role })
    .from(memberships)
    .innerJoin(hotels, eq(memberships.hotelId, hotels.id))
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (!row) {
    redirect("/panel/start");
  }

  return { user, hotel: row.hotel };
});
