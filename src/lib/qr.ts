import QRCode from "qrcode";
import { slugify } from "./slug";

/**
 * QR generation for guest stickers. One spec for the whole app:
 * black on white (max contrast on any printer), error correction M
 * (survives a scratched sticker), 2-module quiet zone.
 */
const QR_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: { dark: "#000000", light: "#FFFFFF" },
};

/** "https://go.example.com/" -> "https://go.example.com" */
export function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Base URL encoded into stickers. Env wins (the short QR domain in prod);
 * request headers are the dev/preview fallback so local QRs still scan.
 */
export function resolveGuestBaseUrl(
  envValue: string | undefined,
  proto: string,
  host: string,
): string {
  return stripTrailingSlash(envValue?.trim() || `${proto}://${host}`);
}

/** Lobby sticker target: the hotel overview page. */
export function guestHotelUrl(base: string, hotelSlug: string): string {
  return `${stripTrailingSlash(base)}/${hotelSlug}`;
}

/** Room sticker target: the per-room guest page. */
export function guestRoomUrl(base: string, hotelSlug: string, roomSlug: string): string {
  return `${stripTrailingSlash(base)}/${hotelSlug}/${roomSlug}`;
}

/** Vector QR for print (inline SVG — infinite resolution on paper). */
export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
}

/** Raster QR for download; width includes the quiet zone. */
export async function qrPng(url: string, width = 1024): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...QR_OPTIONS, type: "png", width });
}

/** Clamp a ?size= query value into a sane raster range; 1024 is the spec. */
export function parseQrSize(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return 1024;
  return Math.min(2048, Math.max(256, parsed));
}

/** Sticker-safe filename segment: "Pokój 2/B" -> "pokoj-2-b". */
export function stickerFileName(part: string): string {
  // One canonical slugifier (handles the Polish stroke letters NFD misses)
  return slugify(part) || "qr";
}

/** Split stickers into fixed A4 pages (2 x 4 grid per sheet). */
export function chunkPages<T>(items: T[], perPage: number): T[][] {
  if (perPage < 1) throw new Error("perPage must be >= 1");
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}
