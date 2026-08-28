import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt — Hotel Info",
  description: "Napisz do nas — odpowiadamy w ciągu doby.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
        Kontakt
      </p>
      <h1 className="font-display mt-3 max-w-xl text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
        Napisz, odpowiemy szybko.
      </h1>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600">
        Pytanie, pomysł albo coś nie działa? Jedna wiadomość wystarczy — odpowiadamy w ciągu
        doby.
      </p>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-10 flex max-w-md items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:border-neutral-400"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <Mail className="size-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-neutral-900">{CONTACT_EMAIL}</span>
          <span className="block text-sm text-neutral-500">
            Kliknij, żeby napisać wiadomość
          </span>
        </span>
      </a>

      <div className="mt-12 border-t border-neutral-200 pt-10">
        <p className="max-w-md text-neutral-600">
          Wolisz sprawdzić na własnej skórze? Konto zakładasz w minutę — pierwsze 14 dni jest
          darmowe.
        </p>
        <CtaLink href="/rejestracja" className="mt-5">
          Wypróbuj 14 dni za darmo
        </CtaLink>
      </div>
    </main>
  );
}
