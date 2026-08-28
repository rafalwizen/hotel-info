/**
 * Slug utilities. Guest pages own EVERY top-level path segment that is not
 * a static route (`/(guest)/[hotel]/[room]`), so any new top-level route in
 * `src/app/` MUST be added to RESERVED_SLUGS below (project rule, AGENTS.md).
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // Static routes that exist today
  "api",
  "panel",
  "zaloguj",
  "rejestracja",
  "reset-hasla",
  // Marketing routes
  "cennik",
  "kontakt",
  // Infra / well-known paths that must never resolve to a hotel
  "_next",
  "static",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "og",
]);

/** Polish letters that do not survive NFD decomposition (stroke/o-slash family). */
const PL_STROKES: Record<string, string> = {
  ł: "l",
  ø: "o",
  đ: "d",
  ß: "ss",
};

/**
 * Lowercase, strip diacritics (Polish included), collapse everything else
 * to dashes: "Willa nad Jeziorem Łańskim!" -> "willa-nad-jeziorem-lanskim".
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[łøđß]/g, (ch) => PL_STROKES[ch] ?? ch)
    .normalize("NFD")
    // strip combining marks produced by NFD (a with ogonek -> a + U+0328)
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && slug.length >= 2;
}
