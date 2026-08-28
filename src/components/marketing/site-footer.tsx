import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

const FOOTER_SECTIONS = [
  {
    title: "Produkt",
    links: [
      { href: "/cennik", label: "Cennik" },
      { href: "/#demo", label: "Demo" },
      { href: "/rejestracja", label: "Rejestracja" },
    ],
  },
  {
    title: "Konto",
    links: [
      { href: "/zaloguj", label: "Zaloguj się" },
      { href: "/panel", label: "Panel" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-12 md:flex-row md:justify-between md:px-8">
        <div className="max-w-xs">
          <p className="font-display text-lg font-bold tracking-tight">Hotel Info</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Naklejka z kodem QR w każdym pokoju — informacje dla gościa, które odpowiadają same
            za siebie.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                {section.title}
              </p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-neutral-600 transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Kontakt
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 inline-block text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-100">
        <p className="mx-auto w-full max-w-6xl px-5 py-5 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400 md:px-8">
          © 2026 Hotel Info
        </p>
      </div>
    </footer>
  );
}
