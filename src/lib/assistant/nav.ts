/**
 * Whitelist of pages the assistant can send the user to. The model never
 * emits raw hrefs — it picks an intent and the server resolves it against
 * the current context (public marketing vs. admin panel), so a hallucinated
 * or injected target simply fails to resolve.
 */

import type { AssistantContext } from "./types";

export const NAV_TARGETS = {
  home: { href: "/", label: "Strona główna", contexts: ["public"] },
  pricing: { href: "/cennik", label: "Zobacz cennik", contexts: ["public"] },
  contact: { href: "/kontakt", label: "Skontaktuj się", contexts: ["public"] },
  login: { href: "/zaloguj", label: "Zaloguj się", contexts: ["public"] },
  register: { href: "/rejestracja", label: "Utwórz konto", contexts: ["public"] },
  rooms: { href: "/panel/pokoje", label: "Pokoje", contexts: ["panel"] },
  amenities: { href: "/panel/udogodnienia", label: "Udogodnienia", contexts: ["panel"] },
  arrival: { href: "/panel/dojazd", label: "Dojazd", contexts: ["panel"] },
  qr: { href: "/panel/qr", label: "Kody QR", contexts: ["panel"] },
  settings: { href: "/panel/ustawienia", label: "Ustawienia", contexts: ["panel"] },
} as const;

export type NavIntent = keyof typeof NAV_TARGETS;

export const NAV_INTENTS = Object.keys(NAV_TARGETS) as NavIntent[];

/** Resolve a model-provided intent to a concrete link, or null when the
 * intent is unknown or not allowed in this context. */
export function resolveNav(
  intent: string,
  context: AssistantContext,
): { href: string; label: string } | null {
  const target = NAV_TARGETS[intent as NavIntent];
  if (!target) return null;
  const contexts: readonly AssistantContext[] = target.contexts;
  return contexts.includes(context) ? { href: target.href, label: target.label } : null;
}
