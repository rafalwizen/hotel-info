import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { hotelSections } from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { HotelSettingsForm } from "@/components/admin/hotel-settings-form";
import { SectionsEditor } from "@/components/admin/sections-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Ustawienia — Hotel Info" };

export default async function SettingsPage() {
  const { hotel } = await requireHotel();

  const sections = await db
    .select()
    .from(hotelSections)
    .where(eq(hotelSections.hotelId, hotel.id))
    .orderBy(asc(hotelSections.sortOrder), asc(hotelSections.id));

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ustawienia</h1>
        <p className="text-sm text-muted-foreground">
          Dane hotelu widoczne na stronach gości. Adres{" "}
          <span className="font-mono">/{hotel.slug}</span> jest stały — trafi na
          wydrukowane kody QR.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dane hotelu</CardTitle>
          <CardDescription>
            Hasło Wi-Fi pokaże się gościom po naciśnięciu przycisku „Pokaż”.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HotelSettingsForm
            defaultValues={{
              name: hotel.name,
              brandColor: hotel.brandColor,
              wifiSsid: hotel.wifiSsid,
              wifiPassword: hotel.wifiPassword,
              checkinFrom: hotel.checkinFrom,
              checkoutUntil: hotel.checkoutUntil,
              phone: hotel.phone,
              email: hotel.email,
              addressLine: hotel.addressLine,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sekcje strony hotelowej</CardTitle>
          <CardDescription>
            Narracyjne bloki o hotelu (recepcja, śniadanie, parking) — widoczne
            na stronie przeglądowej hotelu, wspólne dla wszystkich pokoi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionsEditor
            scope="hotel"
            emptyHint="Brak sekcji — dodaj np. „Śniadania” lub „Recepcja”."
            items={sections.map((section) => ({
              id: section.id,
              title: section.title,
              body: section.body,
              icon: section.icon,
              enabled: section.enabled,
            }))}
          />
        </CardContent>
      </Card>
    </>
  );
}
