import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { roomSections } from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { SectionsEditor } from "@/components/admin/sections-editor";

export const metadata = { title: "Szablon pokoi — Hotel Info" };

/** Hotel-wide room section templates ("write once, works in every room"). */
export default async function RoomTemplatesPage() {
  const { hotel } = await requireHotel();

  const templates = await db
    .select()
    .from(roomSections)
    .where(and(eq(roomSections.hotelId, hotel.id), isNull(roomSections.roomId)))
    .orderBy(asc(roomSections.sortOrder), asc(roomSections.id));

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Szablon pokoi</h1>
        <p className="text-sm text-muted-foreground">
          Napisz raz (np. „Jak obsłużyć klimatyzację”), a pojawi się na stronie
          każdego pokoju. W edytorze pokoju możesz pojedyncze sekcje nadpisać
          albo ukryć.
        </p>
      </header>
      <SectionsEditor
        scope="template"
        emptyHint="Brak szablonów — dodaj sekcję wspólną dla wszystkich pokoi."
        addLabel="Dodaj sekcję szablonu"
        items={templates.map((section) => ({
          id: section.id,
          title: section.title,
          body: section.body,
          icon: section.icon,
          enabled: section.enabled,
        }))}
      />
    </>
  );
}
