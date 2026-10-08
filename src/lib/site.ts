/**
 * Site-wide constants used by marketing copy. CONTACT_EMAIL is a placeholder
 * — update it once the production domain is bought; demo guest URLs follow
 * GUEST_BASE_URL automatically.
 */

/** Support inbox shown on /kontakt and in the footer. */
export const CONTACT_EMAIL = "kontakt@hotelinfo.pl";

/**
 * Demo guest URLs displayed in marketing mocks (sticker fallback, arrival
 * SMS). Built from GUEST_BASE_URL (baked at build time — set on Vercel) so
 * the mocks always point at a live guest page; the localhost fallback keeps
 * them honest in local dev against db/seed.ts. Scheme is stripped — the
 * copy shows the URL as a guest would type it; actual links use relative
 * hrefs so they work on every origin.
 */
const DEMO_GUEST_BASE = (process.env.GUEST_BASE_URL ?? "http://localhost:3000")
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

/** Sticker mock: guest page of the demo room (mirrors db/seed.ts). */
export const DEMO_ROOM_URL = `${DEMO_GUEST_BASE}/willa-mazury/101`;

/** Arrival SMS mock: the demo hotel's arrival guide. */
export const DEMO_ARRIVAL_URL = `${DEMO_GUEST_BASE}/willa-mazury/dojazd`;
