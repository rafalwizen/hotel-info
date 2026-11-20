import type { Metadata } from "next";
import Link from "next/link";
import {
  LEGAL_UPDATED,
  OPERATOR_ADDRESS,
  OPERATOR_EMAIL,
  OPERATOR_LEGAL_FORM,
  OPERATOR_NAME,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Regulamin — Hotel Info",
  description:
    "Regulamin usług Hotel Info: okres próbny, abonament, obowiązki stron, odpowiedzialność i wypowiedzenie umowy.",
  robots: { index: true, follow: true },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold tracking-tight text-neutral-900">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-neutral-700">
        {children}
      </div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="ml-5 list-disc space-y-1 pl-1 text-[15px] leading-relaxed text-neutral-700">
      {children}
    </li>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
        Dokument prawny
      </p>
      <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
        Regulamin usług
      </h1>
      <p className="mt-4 text-sm text-neutral-500">
        Ostatnia aktualizacja: {LEGAL_UPDATED}
      </p>

      <article>
        <Section title="§1. Postanowienia ogólne">
          <ol className="space-y-2">
            <Li>
              Regulamin określa zasady świadczenia przez {OPERATOR_NAME} (
              {OPERATOR_LEGAL_FORM}), adres: {OPERATOR_ADDRESS}, e-mail:{" "}
              <a
                href={`mailto:${OPERATOR_EMAIL}`}
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                {OPERATOR_EMAIL}
              </a>{" "}
              („Usługodawca”) usług elektronicznych polegających na udostępnianiu
              konta w systemie Hotel Info oraz publikowaniu stron informacyjnych
              dla gości obiektów noclegowych.
            </Li>
            <Li>
              Usługobiorcą może być pełnoletnia osoba fizyczna posiadająca
              pełną zdolność do czynności prawnych, osoba fizyczna prowadząca
              działalność gospodarczą albo osoba prawna — w każdym przypadku
              uprawniona do reprezentowania obiektu noclegowego, którego dane
              będą publikowane w systemie.
            </Li>
            <Li>
              Umowa o świadczenie usług jest zawierana w systemie
              teleinformatycznym; potwierdzeniem jej zawarcia jest rejestracja
              konta z akceptacją niniejszego regulaminu i{" "}
              <Link
                href="/polityka-prywatnosci"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                polityki prywatności
              </Link>
              .
            </Li>
          </ol>
        </Section>

        <Section title="§2. Okres próbny i zawarcie umowy abonamentowej">
          <ol className="space-y-2">
            <Li>
              Po rejestracji Usługobiorca otrzymuje 14-dniowy okres próbny, bez
              podawania danych karty płatniczej. W okresie próbnym usługa
              działa bez ograniczeń.
            </Li>
            <Li>
              Abonament: 49 zł netto miesięcznie za jeden obiekt. Każdy obiekt
              wymaga osobnego konta i osobnej subskrypcji.
            </Li>
            <Li>
              Po zakończeniu okresu próbnego usługa płatna jest aktywowana po
              opłaceniu pierwszego okresu rozliczeniowego (BLIK lub karta).
              Brak płatności oznacza brak aktywacji — konto i dane pozostają
              zapisane, ale strony gości nie są publikowane.
            </Li>
          </ol>
        </Section>

        <Section title="§3. Płatności">
          <ol className="space-y-2">
            <Li>
              Abonament płatny jest z góry, w okresach miesięcznych.
              Rozliczenie następuje przez operatora płatności; Usługodawca nie
              przechowuje danych kart płatniczych.
            </Li>
            <Li>
              Umowa na czas nieokreślony. Usługobiorca może ją wypowiedzieć w
              dowolnym momencie z zachowaniem biegu opłaconego okresu — usługa
              działa do końca okresu rozliczeniowego.
            </Li>
            <Li>
              Usługodawca może zmienić wysokość abonamentu z 30-dniowym
              uprzedzeniem e-mailowym; zmiana nie obowiązuje w biegu
              opłaconego okresu.
            </Li>
          </ol>
        </Section>

        <Section title="§4. Obowiązki Usługobiorcy">
          <ol className="space-y-2">
            <Li>
              Usługobiorca odpowiada za prawdziwość i aktualność danych
              obiektu (w tym danych kontaktowych i hasła Wi-Fi) publikowanych w
              systemie oraz za posiadanie uprawnień do publikowanych treści i
              zdjęć.
            </Li>
            <Li>
              <strong>Role względem osób trzecich:</strong> w odniesieniu do
              danych publikowanych na stronach gości Usługobiorca jest
              administratorem danych osobowych, a Usługodawca — podmiotem
              przetwarzającym na jego polecenie. Usługobiorca zapoznaje się z{" "}
              <Link
                href="/polityka-prywatnosci"
                className="font-medium text-amber-700 underline-offset-4 hover:underline"
              >
                polityką prywatności
              </Link>{" "}
              przed publikacją jakichkolwiek danych.
            </Li>
            <Li>
              Zakaz publikowania treści niezgodnych z prawem, w szczególności
              danych osobowych osób trzecich bez podstawy prawnej oraz treści
              naruszających prawa autorskie.
            </Li>
            <Li>
              Usługobiorca zabezpiecza swoje hasło i nie udostępnia konta
              osobom trzecim; odpowiada za działania dokonane z jego konta.
            </Li>
          </ol>
        </Section>

        <Section title="§5. Obowiązki Usługodawcy">
          <ol className="space-y-2">
            <Li>
              Usługodawca udostępnia i utrzymuje system zgodnie z niniejszym
              regulaminem, z dbałością o dostępność stron gości; błędy usuwa w
              rozsądnym czasie po ich zgłoszeniu.
            </Li>
            <Li>
              Usługodawca przetwarza dane Usługobiorcy wyłącznie w celu
              realizacji umowy i zgodnie z polityką prywatności, a dane
              publikowane na stronach gości — wyłącznie na polecenie
              Usługobiorcy.
            </Li>
            <Li>
              Usługodawca informuje e-mailowo o istotnych zmianach w działaniu
              systemu oraz o przerwach technicznych trwających dłużej niż
              kilka godzin.
            </Li>
          </ol>
        </Section>

        <Section title="§6. Prawa własności">
          <ol className="space-y-2">
            <Li>
              Hotel Info (oprogramowanie, nazwa, grafiki interfejsu) jest
              własnością Usługodawcy i podlega ochronie prawnej. Usługobiorca
              nie nabywa żadnych praw własności intelektualnej do systemu.
            </Li>
            <Li>
              Treści i zdjęcia wprowadzone przez Usługobiorcy pozostają jego
              własnością; Usługodawca przetwarza je wyłącznie w celu świadczenia
              usługi (wyświetlania stron gości).
            </Li>
          </ol>
        </Section>

        <Section title="§7. Odpowiedzialność">
          <ol className="space-y-2">
            <Li>
              Umowa ma charakter wzajemny między przedsiębiorcami w rozumieniu
              art. 385¹ § 4 Kodeksu cywilnego; postanowienia o rękojmi
              konsumenckiej nie znajdują zastosowania.
            </Li>
            <Li>
              Usługodawca odpowiada za szkodę wynikłą z niewykonania lub
              nienależytego wykonania umowy do wysokości trzykrotności
              miesięcznego abonamentu za dany obiekt, z wyłączeniem szkody
              wyrządzonej umyślnie oraz rażącego niedbalstwa.
            </Li>
            <Li>
              Usługodawca nie odpowiada za treści publikowane przez
              Usługobiorcę ani za skutki ich nieaktualności (np. zmienionego
              hasła Wi-Fi).
            </Li>
          </ol>
        </Section>

        <Section title="§8. Wypowiedzenie i usunięcie konta">
          <ol className="space-y-2">
            <Li>
              Po wypowiedzeniu lub usunięciu konta usługa wygasa: strony gości
              przestają działać, a wydrukowane kody QR prowadzą do strony
              błędu. Usługodawca zalega nie usuwać naklejek przed migracją.
            </Li>
            <Li>
              Usługobiorca może w każdej chwili usunąć konto samodzielnie
              (panel → Ustawienia → „Usuń konto”). Usunięcie jest nieodwracalne
              i kasuje wszystkie obiekty, pokoje i treści powiązane z kontem.
              Przed usunięciem warto pobrać kopię danych (eksport JSON).
            </Li>
            <Li>
              Usługodawca może wypowiedzieć umowę ze skutkiem natychmiastowym w
              razie rażącego naruszenia regulaminu (w szczególności §4), po
              bezskutecznym wezwaniu do zaprzestania naruszeń.
            </Li>
          </ol>
        </Section>

        <Section title="§9. Zmiany regulaminu i prawo właściwe">
          <ol className="space-y-2">
            <Li>
              Usługodawca może zmienić regulamin z 14-dniowym uprzedzeniem
              e-mailowym. Zmiany nie pogarszają praw nabytych w biegu opłaconego
              okresu. Brak wypowiedzenia przed upływem terminu oznacza
              akceptację zmian.
            </Li>
            <Li>
              W sprawach nieuregulowanych stosuje się prawo polskie, w
              szczególności ustawę o świadczeniu usług drogą elektroniczną i
              Kodeks cywilny. Spory rozstrzyga sąd właściwy dla siedziby
              Usługodawcy, a jeżeli Usługobiorca jest konsumentem — sąd
              właściwy według przepisów ogólnych.
            </Li>
          </ol>
        </Section>
      </article>
    </main>
  );
}
