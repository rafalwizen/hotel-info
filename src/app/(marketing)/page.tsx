import Link from "next/link";
import {
  BookOpen,
  Clock3,
  EyeOff,
  Languages,
  Layers,
  Link2,
  MapPin,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { StickerCard } from "@/components/marketing/sticker-card";
import { DemoPhone } from "@/components/marketing/demo-phone";
import { DEMO_STICKER_DOMAIN } from "@/lib/site";

/** Shared section chrome: mono eyebrow + display heading. */
function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
        {eyebrow}
      </p>
      <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
        {title}
      </h2>
    </div>
  );
}

const STEPS = [
  {
    no: "01",
    title: "Załóż hotel i pokoje",
    body: "Dane obiektu wpisujesz raz. Treści piszesz po polsku i angielsku obok siebie — kreator poprowadzi Cię za rękę.",
  },
  {
    no: "02",
    title: "Wydrukuj naklejki",
    body: "Centrum QR generuje arkusz A4 gotowy do druku: osobna naklejka na każdy pokój i jedna na recepcję.",
  },
  {
    no: "03",
    title: "Gość skanuje i wie",
    body: "Telefon otwiera stronę jego pokoju. Bez aplikacji, bez logowania — działa na każdym smartfonie.",
  },
];

/** Questions styled as reception log entries: where and when they landed. */
const RECEIVED_QUESTIONS = [
  { text: "Jaki jest login do wi-fi?", meta: "SMS · 21:37", rotate: "-1deg" },
  { text: "Do której jest śniadanie?", meta: "recepcja · 7:52", rotate: "0.75deg" },
  { text: "Jak włączyć klimatyzację?", meta: "pokój 104 · 23:10", rotate: "-0.6deg" },
  { text: "O której zwalniamy pokój?", meta: "telefon · 10:05", rotate: "1deg" },
  { text: "Gdzie możemy zaparkować?", meta: "brama · 18:44", rotate: "-0.8deg" },
];

/** Arrival-guide mock — mirrors the real /{hotel}/dojazd page content. */
const ARRIVAL_STEPS = [
  {
    title: "Brama na kod 4321",
    body: "Kod wpisz na słupku przy bramie — otwiera się automatycznie.",
  },
  {
    title: "Skrzynka z kluczami",
    body: "Klucz do pokoju 101 wisi w skrzynce po lewej stronie wejścia.",
  },
  {
    title: "Parking na podwórku",
    body: "Wjedź za bramę w prawo — miejsca dla gości są przy płocie.",
  },
];

const ARRIVAL_POINTS = [
  "Kroki ze zdjęciami — brama, skrzynka na klucze, wejście",
  "Pinezka na mapie — jeden dotyk i nawigacja prowadzi pod bramę",
  "Inne wejście w którymś pokoju? Nadpisujesz pojedyncze kroki tylko tam",
];

const DEMO_POINTS = [
  {
    icon: ShieldCheck,
    title: "Hasło wi-fi za przyciskiem",
    body: "Strony gości są celowo ukryte przed wyszukiwarkami — hasło nie trafia do Google, a gość ma je jednym dotknięciem.",
  },
  {
    icon: Languages,
    title: "Polski i angielski",
    body: "Gość przełącza język jednym dotknięciem. Ty piszesz obie wersje obok siebie w panelu — bez wtyczek i tłumaczy.",
  },
  {
    icon: BookOpen,
    title: "Instrukcje pokoju",
    body: "TV, klimatyzacja, sejf: piszesz raz jako szablon dla wszystkich pokoi i nadpisujesz tylko tam, gdzie sprzęt się różni.",
  },
  {
    icon: Clock3,
    title: "Godziny i kontakty",
    body: "Zameldowanie, śniadania, recepcja, parking — zawsze pod ręką, a zmiany w panelu gość widzi natychmiast.",
  },
];

const FEATURES = [
  {
    icon: Languages,
    title: "Dwa języki, jedna edycja",
    body: "Formularze PL|EN obok siebie. Serwer renderuje wersję domyślną, gość przełącza bez przeładowania.",
  },
  {
    icon: QrCode,
    title: "Centrum QR i wydruk A4",
    body: "Podglądy wszystkich kodów, pliki PNG do pobrania i arkusz naklejek gotowy do wydruku i pokrojenia.",
  },
  {
    icon: RefreshCw,
    title: "Zmiany widoczne od razu",
    body: "Poprawisz hasło wi-fi w panelu, a strona gościa odświeża się natychmiast — bez czekania na cache.",
  },
  {
    icon: Link2,
    title: "Krótki adres w kodzie",
    body: "Proste ścieżki na naszej krótkiej domenie: prostszy wzór QR, łatwiejszy skan z małej naklejki.",
  },
  {
    icon: Layers,
    title: "Szablony pokoi",
    body: "Napisz instrukcję raz — działa we wszystkich pokojach. Konkretny pokój może ją nadpisać lub ukryć.",
  },
  {
    icon: EyeOff,
    title: "Ukryte przed Google",
    body: "Strony gości są nieindeksowane z powodu hasła wi-fi. Gość trafia na nie wyłącznie kodem z naklejki.",
  },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero: the thesis + the product's own artifact (a live sticker). */}
      <section className="mx-auto grid w-full max-w-6xl gap-14 px-5 pt-16 pb-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-8 md:pt-24 md:pb-28">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
            Małe hotele · pensjonaty · gospodarstwa
          </p>
          <h1 className="font-display mt-4 text-4xl leading-[1.06] font-semibold tracking-tight text-neutral-900 md:text-[3.4rem]">
            Gość skanuje naklejkę.
            <br />
            Recepcja ma spokój.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-neutral-600">
            W każdym pokoju mała strona z informacjami dla gościa: wi-fi, godziny śniadania,
            checkout i instrukcje sprzętów. Po polsku i angielsku, bez aplikacji i bez logowania.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CtaLink href="/rejestracja">Wypróbuj za darmo</CtaLink>
            <CtaLink href="/#demo" variant="secondary">
              Zobacz demo
            </CtaLink>
          </div>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Bez karty kredytowej · anulujesz w każdej chwili
          </p>
        </div>
        <div className="flex flex-col items-center">
          <StickerCard />
          <p className="mt-7 flex items-center gap-2 text-sm text-neutral-500">
            <ScanLine className="size-4 shrink-0 text-amber-700" aria-hidden />
            Ten kod jest prawdziwy — zeskanuj go telefonem.
          </p>
        </div>
      </section>

      {/* Trust strip — honest signals only; real owner quotes come later. */}
      <section className="border-y border-neutral-200">
        <p className="mx-auto w-full max-w-6xl px-5 py-4 text-center font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500 md:px-8">
          Wsparcie po polsku · Dane hostowane w UE · 14 dni bez karty kredytowej
        </p>
      </section>

      {/* The problem, as it actually arrives at a reception desk. */}
      <section className="bg-neutral-50">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <SectionHead eyebrow="Znasz to?" title="Te pytania słyszysz codziennie" />
          <div className="mt-10 flex flex-wrap gap-5">
            {RECEIVED_QUESTIONS.map((question) => (
              <figure
                key={question.text}
                className="w-60 rotate-[var(--tilt)] rounded-xl border border-dashed border-neutral-300 bg-white p-4 shadow-sm"
                style={{ "--tilt": question.rotate } as React.CSSProperties}
              >
                <blockquote className="text-[15px] leading-snug font-medium text-neutral-800">
                  „{question.text}”
                </blockquote>
                <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                  {question.meta}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-12 max-w-xl text-lg font-medium text-neutral-900">
            Pięć takich pytań dziennie po 3 minuty to ponad 7 godzin recepcji w miesiącu.
            Każdą z tych odpowiedzi możesz przykleić na drzwiach. Dosłownie.{" "}
            <Link href="/#demo" className="text-amber-700 underline-offset-4 hover:underline">
              Zobacz rozwiązanie ↓
            </Link>
          </p>
        </div>
      </section>

      {/* How it works — a real sequence, hence the numbers. */}
      <section className="border-y border-neutral-200">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:grid-cols-3 md:px-8 md:py-20">
          {STEPS.map((step) => (
            <div key={step.no}>
              <p className="font-mono text-sm font-bold tracking-[0.18em] text-amber-700">
                {step.no}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Arrival guide — the second artifact: one link sent before the trip. */}
      <section className="bg-neutral-50">
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 md:grid-cols-[1fr_auto] md:items-center md:px-8 md:py-28">
          <div>
            <SectionHead eyebrow="Dojazd" title="Jeden link z instrukcją dojazdu" />
            <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600">
              Brama na kod, skrzynka na klucze, wjazd od podwórka? Spisz instrukcję krok po
              kroku — ze zdjęciami i pinezką na mapie, po polsku i angielsku — a link wyślij
              gościowi na Bookingu albo SMS-em, zanim wyruszy w drogę.
            </p>
            <ul className="mt-8 space-y-2.5">
              {ARRIVAL_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-neutral-600">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-600"
                    aria-hidden
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center gap-4">
            {/* The message the owner actually sends */}
            <div className="w-full max-w-xs rounded-2xl rounded-bl-md bg-neutral-900 px-4 py-3 shadow-sm">
              <p className="text-sm leading-snug text-white">
                Dzień dobry! Instrukcja dotarcia:{" "}
                <span className="font-semibold text-amber-300 underline underline-offset-2">
                  {DEMO_STICKER_DOMAIN}/willa-mazury/dojazd
                </span>
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                Booking.com · 2 dni przed przyjazdem
              </p>
            </div>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400"
              aria-hidden
            >
              ↓ gość otwiera link
            </p>
            {/* What opens — styled like the printable artifacts elsewhere on the page */}
            <div className="w-full max-w-xs rotate-[1.25deg] rounded-2xl border border-dashed border-neutral-300 bg-white p-5 shadow-sm transition-transform duration-300 ease-out hover:rotate-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                Jak do nas trafić
              </p>
              <ol className="mt-4 space-y-4">
                {ARRIVAL_STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="font-mono text-lg leading-none font-bold text-neutral-900">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
                <MapPin className="size-3.5" aria-hidden />
                Otwórz w Mapach
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo: the REAL guest page, interactive, in a phone frame. */}
      <section id="demo" className="scroll-mt-20">
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 md:grid-cols-[1fr_auto] md:items-center md:px-8 md:py-28">
          <div>
            <SectionHead eyebrow="Demo" title="Zobacz, co widzi gość" />
            <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600">
              To prawdziwa strona gościa — dokładnie taka, jaka wyjdzie za Twoim kodem. Spróbuj:
              przełącz język, odsłoń hasło.
            </p>
            <ul className="mt-10 space-y-7">
              {DEMO_POINTS.map((point) => (
                <li key={point.title} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <point.icon className="size-4.5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{point.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{point.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <CtaLink href="/rejestracja">Wypróbuj za darmo</CtaLink>
            </div>
          </div>
          <DemoPhone />
        </div>
      </section>

      {/* Feature grid. */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <SectionHead eyebrow="Panel" title="Wszystko w jednym miejscu" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-neutral-200 bg-white p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-neutral-900 text-white">
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-neutral-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing band + final CTA. */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-20 md:flex-row md:items-end md:justify-between md:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Przyklej odpowiedzi na drzwiach.
            </h2>
            <p className="mt-4 text-lg text-neutral-300">
              <strong className="font-semibold text-white">49 zł / mies. za cały obiekt</strong> —
              bez limitu pokoi. Pierwsze 14 dni za darmo, bez karty.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <CtaLink href="/rejestracja" variant="invert">
              Załóż konto
            </CtaLink>
            <Link
              href="/cennik"
              className="px-4 text-sm font-medium text-neutral-300 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Pełny cennik
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
