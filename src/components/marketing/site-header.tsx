import Link from "next/link";
import { QrCode } from "lucide-react";
import { CtaLink } from "./cta-link";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hidden rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 md:inline-flex"
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Hotel Info — strona główna">
          <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <QrCode className="size-4" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Hotel Info</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Menu strony">
          <NavLink href="/cennik">Cennik</NavLink>
          <NavLink href="/kontakt">Kontakt</NavLink>
          <span className="mx-1 hidden h-5 w-px bg-neutral-200 md:block" />
          <Link
            href="/zaloguj"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 sm:inline-flex"
          >
            Zaloguj się
          </Link>
          <CtaLink href="/rejestracja" size="sm">
            Wypróbuj za darmo
          </CtaLink>
        </nav>
      </div>
    </header>
  );
}
