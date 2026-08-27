import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { amenities } from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { AmenitiesEditor } from "@/components/admin/amenities-editor";

export const metadata = { title: "Udogodnienia — Hotel Info" };

export default async function AmenitiesPage() {
  const { hotel } = await requireHotel();

  const hotelAmenities = await db
    .select()
    .from(amenities)
    .where(eq(amenities.hotelId, hotel.id))
    .orderBy(asc(amenities.sortOrder), asc(amenities.id));

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Udogodnienia</h1>
        <p className="text-sm text-muted-foreground">
          Katalog dla całego hotelu — przypisujesz je chipsami w edytorze każdego
          pokoju.
        </p>
      </header>
      <AmenitiesEditor
        items={hotelAmenities.map((amenity) => ({
          id: amenity.id,
          icon: amenity.icon,
          label: amenity.label,
        }))}
      />
    </>
  );
}
