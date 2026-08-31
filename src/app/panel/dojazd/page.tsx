import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { arrivalSteps } from "@/db/schema";
import { requireHotel } from "@/server/tenancy";
import { guestBaseUrl } from "@/server/queries/qr";
import { pick } from "@/lib/i18n";
import { ArrivalStepsEditor } from "@/components/admin/arrival-steps-editor";
import { ArrivalMapForm } from "@/components/admin/arrival-map-form";
import { ShareLinkCard } from "@/components/admin/share-link-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dojazd — Hotel Info" };

/** Arrival guide editor: steps with photos, map pin, and the share link. */
export default async function ArrivalPage() {
  const { hotel } = await requireHotel();

  const steps = await db
    .select()
    .from(arrivalSteps)
    .where(and(eq(arrivalSteps.hotelId, hotel.id), isNull(arrivalSteps.roomId)))
    .orderBy(asc(arrivalSteps.sortOrder), asc(arrivalSteps.id));

  const base = await guestBaseUrl();
  const hotelName = pick(hotel.name, "pl") || hotel.slug;

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dojazd</h1>
        <p className="text-sm text-muted-foreground">
          Instrukcja dotarcia do obiektu: dziwne wejścia, bramy na kod, skrzynki
          na klucze. Gość dostaje jeden link zamiast opisu w SMS-ie.
        </p>
      </header>

      <ShareLinkCard
        url={`${base}/${hotel.slug}/dojazd`}
        messageTemplate={`Dzień dobry! Tu ${hotelName} — instrukcja, jak do nas trafić: {link}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Kroki instrukcji</CardTitle>
          <CardDescription>
            Numerek przy każdym kroku mówi gościowi, w jakiej kolejności iść.
            Kroki wspólne dla całego obiektu — w edytorze konkretnego pokoju
            możesz je nadpisać lub ukryć.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArrivalStepsEditor
            items={steps.map((step) => ({
              id: step.id,
              title: step.title,
              body: step.body,
              photoUrl: step.photoUrl,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mapa</CardTitle>
          <CardDescription>
            Przycisk „Otwórz w Mapach” na stronie dojazdu poprowadzi gościa do
            dokładnie wskazanego miejsca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArrivalMapForm defaultMapUrl={hotel.arrivalMapUrl ?? ""} />
        </CardContent>
      </Card>
    </>
  );
}
