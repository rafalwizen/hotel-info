import type { Metadata } from "next";
import {
  LEGAL_UPDATED,
  OPERATOR_ADDRESS,
  OPERATOR_EMAIL,
  OPERATOR_LEGAL_FORM,
  OPERATOR_NAME,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Polityka prywatności — Hotel Info",
  description:
    "Jak Hotel Info przetwarza dane osobowe: cele, podstawy prawne, odbiorcy, przekazywanie poza EOG i Twoje prawa z RODO.",
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

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
        Dokument prawny
      </p>
      <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
        Polityka prywatności
      </h1>
      <p className="mt-4 text-sm text-neutral-500">
        Ostatnia aktualizacja: {LEGAL_UPDATED}
      </p>

      <article>
        <Section title="1. Administrator danych">
          <p>
            Administratorem Twoich danych osobowych w rozumieniu rozporządzenia
            (UE) 2016/679 (RODO) jest <strong>{OPERATOR_NAME}</strong> (
            {OPERATOR_LEGAL_FORM}), adres: {OPERATOR_ADDRESS}, e-mail:{" "}
            <a
              href={`mailto:${OPERATOR_EMAIL}`}
              className="font-medium text-amber-700 underline-offset-4 hover:underline"
            >
              {OPERATOR_EMAIL}
            </a>{" "}
            („Hotel Info”, „usługodawca”).
          </p>
          <p>
            Hotel Info pełni dwie role, w zależności od rodzaju danych:
          </p>
          <ul className="space-y-2">
            <Li>
              <strong>dla kont użytkowników i strony marketingowej</strong> —
              jesteśmy <strong>administratorem</strong> danych (np. e-mail i
              hasło konta hotelarza);
            </Li>
            <Li>
              <strong>dla treści publikowanych przez hotele na stronach gości</strong>{" "}
              (opisy pokoi, dane kontaktowe obiektu, hasła Wi-Fi) — hotelem
              posiadającym konto jest <strong>administrator</strong>, a Hotel
              Info działa jako <strong>podmiot przetwarzający</strong> na jego
              polecenie.
            </Li>
          </ul>
        </Section>

        <Section title="2. Jakie dane przetwarzamy i w jakim celu">
          <ul className="space-y-2">
            <Li>
              <strong>Konto użytkownika (panel):</strong> imię, adres e-mail,
              hasło (wyłącznie jako skrót bcrypt), data utworzenia konta i data
              akceptacji regulaminu. Cel: utworzenie i prowadzenie konta,
              uwierzytelnianie, realizacja umowy. Podstawa: art. 6 ust. 1 lit. b
              RODO (wykonanie umowy).
            </Li>
            <Li>
              <strong>Dane obiektu wprowadzane w panelu:</strong> nazwa, dane
              kontaktowe (telefon, e-mail, adres), sieć i hasło Wi-Fi, treści
              pokoi i przewodników. Cel: wyświetlanie stron gości skanowanych z
              naklejek QR. Podstawa: art. 6 ust. 1 lit. b RODO (wykonanie
              umowy); dla danych osób reprezentujących obiekt — art. 6 ust. 1
              lit. f (uzasadniony interes: obsługa klienta).
            </Li>
            <Li>
              <strong>Reset hasła:</strong> jednorazowy token (w bazie wyłącznie
              jako skrót SHA-256) i adres e-mail odbiorcy wiadomości. Cel:
              bezpieczne odzyskanie dostępu. Podstawa: art. 6 ust. 1 lit. f RODO.
            </Li>
            <Li>
              <strong>Ograniczenie liczby zapytań (rate limiting):</strong>
              adres IP, wyłącznie w pamięci serwera, przez maksymalnie 15 minut
              — ochrona przed nadużyciami logowania i API. Podstawa: art. 6
              ust. 1 lit. f RODO.
            </Li>
            <Li>
              <strong>Asystent AI:</strong> treść rozmowy z asystentem. W
              trybie publicznym (strona marketingowa) — anonimowy tekst pytania.
              W panelu — tekst rozmowy oraz kontekst Twojego obiektu (nazwa,
              dane kontaktowe, sieć i hasło Wi-Fi, treści pokoi), odczytany
              wyłącznie z konta, do którego jesteś zalogowany. Rozmowy nie są
              zapisywane po stronie serwera; historia przechowywana jest tylko w
              Twojej przeglądarce (szczegóły w pkt 5). Podstawa: art. 6 ust. 1
              lit. b i f RODO.
            </Li>
          </ul>
          <p>
            Nie przetwarzamy danych szczególnych kategorii (art. 9 RODO) ani
            danych gości hotelowych. Nie stosujemy zautomatyzznego
            podejmowania decyzji ani profilowania (art. 22 RODO).
          </p>
        </Section>

        <Section title="3. Odbiorcy i podmioty przetwarzające">
          <p>Dane powierzamy następującym podmiotom:</p>
          <ul className="space-y-2">
            <Li>
              <strong>Neon (Neon Tech, Inc.)</strong> — baza danych
              PostgreSQL, region UE (Frankfurt, aws-eu-central-1);
            </Li>
            <Li>
              <strong>Vercel, Inc.</strong> — hosting aplikacji oraz magazyn
              zdjęć (Vercel Blob) przesyłanych do przewodników dojazdu;
            </Li>
            <Li>
              <strong>Resend, Inc.</strong> — wysyłka wiadomości e-mail (linki
              resetujące hasło);
            </Li>
            <Li>
              <strong>z.ai (Zhipu AI)</strong> — dostawca modelu językowego
              dla asystenta AI (szczegóły w pkt 4).
            </Li>
          </ul>
          <p>
            Danymi nie handlujemy i nie przekazujemy ich podmiotom trzecim w
            celach marketingowych. Nie stosujemy narzędzi analitycznych
            śledzących użytkowników.
          </p>
        </Section>

        <Section title="4. Przekazywanie danych poza Europejski Obszar Gospodarczy">
          <p>
            Część podmiotów wymienionych w pkt 3 ma siedzibę w USA (Vercel,
            Resend). Przekazywanie danych odbywa się na podstawie standardowych
            klauzul umownych (SCC) zawartych z tymi dostawcami.
          </p>
          <p>
            <strong>Asystent AI (z.ai).</strong> Treść rozmów oraz — w trybie
            panelowym — kontekst Twojego obiektu (w tym hasło Wi-Fi i dane
            kontaktowe) są przekazywane do dostawcy modelu językowego z.ai,
            z siedzibą w Chinach, do którego nie ma decyzji Komisji Europejskiej
            o adekwatności i z którym nie zawarto standardowych klauzul
            umownych. Oznacza to, że dane opuszczają EOG bez gwarancji
            równoważnej ochrony. Korzystasz z asystenta na własne ryzyko —
            <strong> nie wpisuj w rozmowie danych, których nie chcesz
            przekazać poza EOG</strong>. Asystenta można wyłączyć w całości po
            stronie operatora (wtedy znika z interfejsu).
          </p>
          <p>
            Baza danych aplikacji pozostaje w regionie UE (Neon,
            Frankfurt).
          </p>
        </Section>

        <Section title="5. Okres przechowywania">
          <ul className="space-y-2">
            <Li>
              <strong>Konto i dane obiektu:</strong> przez czas trwania umowy,
              do usunięcia konta (panel → Ustawienia → „Usuń konto”) lub
              wypowiedzenia;
            </Li>
            <Li>
              <strong>Tokeny resetu hasła:</strong> maksymalnie 1 godzina, po
              użyciu usuwane natychmiast;
            </Li>
            <Li>
              <strong>Rozmowy z asystentem:</strong> po stronie serwera nie są
              przechowywane w ogóle; w Twojej przeglądarce — maksymalnie 30
              ostatnich wiadomości (strona marketingowa: localStorage, panel:
              sessionStorage, czyszczone po zamknięciu karty);
            </Li>
            <Li>
              <strong>Adresy IP (rate limiting):</strong> maksymalnie 15 minut,
              wyłącznie w pamięci procesu.
            </Li>
          </ul>
        </Section>

        <Section title="6. Twoje prawa">
          <p>
            Zgodnie z RODO przysługują Ci: prawo dostępu do danych (art. 15),
            ich sprostowania (art. 16), usunięcia (art. 17), ograniczenia
            przetwarzania (art. 18), przenoszenia danych (art. 20), sprzeciwu
            (art. 21) oraz prawo cofnięcia zgody w dowolnym momencie bez wpływu
            na zgodność przetwarzania dokonanego przed cofnięciem.
          </p>
          <p>
            Najprościej zrealizujesz je samodzielnie: w panelu (Ustawienia →
            „Konto i dane”) możesz <strong>pobrać kopię swoich danych</strong>{" "}
            (eksport JSON) oraz <strong>trwale usunąć konto</strong> wraz ze
            wszystkimi obiektami i treściami. Możesz też napisać do nas na{" "}
            <a
              href={`mailto:${OPERATOR_EMAIL}`}
              className="font-medium text-amber-700 underline-offset-4 hover:underline"
            >
              {OPERATOR_EMAIL}
            </a>{" "}
            — odpowiemy w ciągu 30 dni.
          </p>
          <p>
            Masz prawo skargi do Prezesa Urzędu Ochrony Danych Osobowych
            (ul. Stawki 2, 00-193 Warszawa,{" "}
            <a
              href="https://www.uodo.gov.pl"
              className="font-medium text-amber-700 underline-offset-4 hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              uodo.gov.pl
            </a>
            ).
          </p>
        </Section>

        <Section title="7. Cookies i pamięć przeglądarki">
          <p>
            Stosujemy wyłącznie <strong>cookie niezbędne</strong>: plik sesji
            logowania (<code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[13px]">authjs.session-token</code>),
            utrzymujący Cię zalogowanym w panelu (30 dni). Nie używamy cookies
            analitycznych, marketingowych ani żadnych skryptów śledzących stron
            trzecich — dlatego nie wyświetlamy banera zgody.
          </p>
          <p>
            Poza cookies strona zapisuje w pamięci lokalnej Twojej przeglądarki
            (localStorage): preferowany język strony gości oraz historię rozmowy
            z asystentem w trybie publicznym (maks. 30 wiadomości). Dane te
            nigdy nie opuszczają Twojego urządzenia i możesz je wyczyścić w
            ustawieniach przeglądarki.
          </p>
          <p>
            Jeśli w przyszłości dodamy narzędzia analityczne, wcześniejsza
            zgoda będzie wymagana przed ich użyciem.
          </p>
        </Section>

        <Section title="8. Bezpieczeństwo i zmiany polityki">
          <p>
            Dane chronimy transportem szyfrowanym (HTTPS), hasła przechowujemy
            wyłącznie jako skróty bcrypt, tokeny resetu — jako skróty SHA-256.
            Strony gości z hasłami Wi-Fi są domyślnie nieindeksowane przez
            wyszukiwarki.
          </p>
          <p>
            Politykę możemy aktualizować (np. gdy zmieni się lista podmiotów
            przetwarzających) — data ostatniej zmiany zawsze widnieje u góry
            strony. O istotnych zmianach poinformujemy e-mailem na adres konta.
          </p>
        </Section>
      </article>
    </main>
  );
}
