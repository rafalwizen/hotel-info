import { eq } from "drizzle-orm";
import { db } from "@/db";
import { hotels, memberships } from "@/db/schema";
import { requireUser } from "@/server/tenancy";
import { logoutAction } from "@/server/actions/logout";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Panel — Hotel Info" };

/**
 * Phase-2 placeholder dashboard. Phase 3 replaces this with the real panel
 * layout (onboarding wizard, rooms, amenities, QR center).
 */
export default async function PanelPage() {
  const user = await requireUser();

  const [row] = await db
    .select({ hotelName: hotels.name, slug: hotels.slug })
    .from(memberships)
    .innerJoin(hotels, eq(memberships.hotelId, hotels.id))
    .where(eq(memberships.userId, user.id))
    .limit(1);

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Cześć{user.name ? `, ${user.name}` : ""}!
        </h1>
        {row ? (
          <p className="text-muted-foreground">
            Twój hotel: <strong>{row.hotelName.pl}</strong> ({row.slug})
          </p>
        ) : (
          <p className="text-muted-foreground">
            Nie masz jeszcze hotelu — kreator konfiguracji pojawi się w kolejnej fazie.
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Zalogowany jako {user.email}
      </p>
      <form action={logoutAction}>
        <Button variant="outline" type="submit">
          Wyloguj się
        </Button>
      </form>
    </main>
  );
}
