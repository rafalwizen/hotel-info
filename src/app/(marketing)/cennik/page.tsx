import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";

export const metadata: Metadata = {
  title: "Cennik — Hotel Info",
  description:
    "Jedna cena za cały obiekt: 49 zł miesięcznie, bez limitu pokoi. 14 dni próbnych bez karty kredytowej.",
};

const INCLUDED = [
  "Nielimitowana liczba pokoi",
  "Treści PL + EN na każdej stronie",
  "Centrum QR: podglądy, PNG i arkusz A4",
  "Własny kolor marki na stronach gości",
  "Krótki adres na domenie Hotel Info",
  "Zmiany widoczne dla gości natychmiast",
  "Przekierowania starych kodów przy zmianie nazw",
];

const FAQ = [
  {
    q: "Czy gość musi coś instalować?",
    a: "Nie. Kod prowadzi na zwykłą stronę — otwiera się w przeglądarce każdego telefonu, także bez sieci Wi-Fi obiektu.",
  },
  {
    q: "Czy mogę użyć własnej domeny?",
    a: "Na start każdy hotel dostaje adres na naszej krótkiej domenie — to celowe: krótszy adres to prostszy wzór kodu i łatwiejszy skan z małej naklejki. Obsługę własnych domen dodamy w kolejnej wersji.",
  },
  {
    q: "Co się stanie ze starymi naklejkami, gdy zmienię numer lub nazwę pokoju?",
    a: "Nic. Stary adres automatycznie przekierowuje na nowy — wydrukowane kody działają dalej.",
  },
  {
    q: "Czy strony gości są widoczne w Google?",
    a: "Nie. Są celowo nieindeksowane, bo pokazują hasło Wi-Fi. Gość trafia na nie wyłącznie kodem z naklejki.",
  },
  {
    q: "Ile czasu zajmuje utrzymanie?",
    a: "Konfiguracja to kilkanaście minut. Później zmieniasz tylko to, co się zmienia — na przykład hasło Wi-Fi.",
  },
  {
    q: "Jak wygląda płatność?",
    a: "Subskrypcja miesięczna, BLIK lub karta. Anulujesz kiedy chcesz — kody działają do końca opłaconego okresu.",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
        Cennik
      </p>
      <h1 className="font-display mt-3 max-w-xl text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
        Jedna cena. Cały hotel.
      </h1>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600">
        Bez limitu pokoi, bez ukrytych opłat, bez umowy na czas określony.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
            Plan Hotel
          </p>
          <p className="font-display mt-4 text-5xl font-semibold tracking-tight text-neutral-900">
            49 zł
            <span className="ml-2 align-middle font-sans text-base font-normal text-neutral-500">
              / mies. za obiekt
            </span>
          </p>
          <ul className="mt-8 space-y-3.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] text-neutral-800">
                <Check className="mt-0.5 size-4.5 shrink-0 text-amber-700" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <CtaLink href="/rejestracja" className="mt-8 w-full">
            Wypróbuj 14 dni za darmo
          </CtaLink>
          <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400">
            Bez karty · po trialu 49 zł/mies.
          </p>
        </section>

        <div className="flex flex-col gap-6">
          <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm leading-relaxed text-neutral-600">
            Każdy obiekt — hotel, pensjonat czy gospodarstwo — to osobne konto z osobną
            subskrypcją. Prowadzisz dwa budynki przy jednej recepcji?{" "}
            <Link
              href="/kontakt"
              className="font-medium text-amber-700 underline-offset-4 hover:underline"
            >
              Napisz do nas
            </Link>
            , coś ustalimy.
          </p>

          <section aria-label="Częste pytania">
            <h2 className="font-display text-xl font-semibold tracking-tight text-neutral-900">
              Częste pytania
            </h2>
            <div className="mt-4 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
              {FAQ.map((item) => (
                <details key={item.q} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left text-[15px] font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span
                      aria-hidden
                      className="font-mono text-neutral-400 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
