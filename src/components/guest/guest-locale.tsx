"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { Localized } from "@/db/schema";

const LOCALE_STORAGE_KEY = "guest-locale";

/**
 * Guest locale as an external store (localStorage + browser language).
 *
 * useSyncExternalStore gives us the exact semantics this page needs: the
 * server snapshot is the hotel's default locale (hydration matches the SSR
 * output), and after mount React re-reads the client snapshot — swapping to
 * a stored/browser preference without a hydration mismatch and without
 * setState-in-effect.
 */

const listeners = new Set<() => void>();

/** Memoized so repeated getSnapshot calls return a stable primitive. */
let cachedLocale: Locale | null = null;
let cacheValid = false;

function readPreferredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "pl" || stored === "en") return stored;
  } catch {
    // Private mode / storage disabled — fall through to the browser language.
  }
  // Only switch for an explicit match; anything else keeps the default.
  const nav = navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("pl")) return "pl";
  if (nav.startsWith("en")) return "en";
  return null;
}

function getSnapshot(): Locale | null {
  if (!cacheValid) {
    cachedLocale = readPreferredLocale();
    cacheValid = true;
  }
  return cachedLocale;
}

function getServerSnapshot(): Locale | null {
  return null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Store writer: persists the manual choice and notifies subscribers. */
function setGuestLocale(next: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  } catch {
    // Storage unavailable — the choice just won't persist.
  }
  cachedLocale = next;
  cacheValid = true;
  for (const listener of listeners) listener();
}

/** Locale for a guest page: stored/browser preference, else hotel default. */
export function useGuestLocale(defaultLocale: Locale) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const choose = useCallback((next: Locale) => setGuestLocale(next), []);
  return [stored ?? defaultLocale, choose] as const;
}

/** Sticky signage header: hotel eyebrow + the PL|EN pill. */
export function GuestHeader({
  hotelName,
  locale,
  onLocaleChange,
}: {
  hotelName: Localized;
  locale: Locale;
  onLocaleChange: (next: Locale) => void;
}) {
  const name = pick(hotelName, locale);
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-3">
        <span className="truncate font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-(--hotel-primary)">
          {name}
        </span>
        <LocaleToggle locale={locale} onChange={onLocaleChange} />
      </div>
    </header>
  );
}

function LocaleToggle({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (next: Locale) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Język / Language"
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-neutral-200 p-0.5"
    >
      {(["pl", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={locale === code}
          className={
            locale === code
              ? "rounded-full bg-(--hotel-primary)/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-(--hotel-primary)"
              : "rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-neutral-400 transition-colors hover:text-neutral-600"
          }
        >
          {code}
        </button>
      ))}
    </div>
  );
}
