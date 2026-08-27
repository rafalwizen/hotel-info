import { describe, expect, it } from "vitest";
import {
  chunkPages,
  guestHotelUrl,
  guestRoomUrl,
  parseQrSize,
  qrPng,
  qrSvg,
  resolveGuestBaseUrl,
  stickerFileName,
  stripTrailingSlash,
} from "./qr";

describe("stripTrailingSlash", () => {
  it("strips one and many trailing slashes", () => {
    expect(stripTrailingSlash("https://go.example.com/")).toBe("https://go.example.com");
    expect(stripTrailingSlash("https://go.example.com///")).toBe("https://go.example.com");
  });

  it("leaves slash-free values untouched", () => {
    expect(stripTrailingSlash("http://localhost:3000")).toBe("http://localhost:3000");
  });
});

describe("resolveGuestBaseUrl", () => {
  it("prefers the env value over request headers", () => {
    expect(resolveGuestBaseUrl("https://go.example.com/", "http", "localhost:3000")).toBe(
      "https://go.example.com",
    );
  });

  it("falls back to request headers when env is empty", () => {
    expect(resolveGuestBaseUrl(undefined, "https", "app.example.com")).toBe(
      "https://app.example.com",
    );
    expect(resolveGuestBaseUrl("   ", "http", "localhost:3000")).toBe("http://localhost:3000");
  });
});

describe("guest URL builders", () => {
  it("builds hotel and room URLs without doubled slashes", () => {
    expect(guestHotelUrl("https://go.example.com/", "willa-mazury")).toBe(
      "https://go.example.com/willa-mazury",
    );
    expect(guestRoomUrl("https://go.example.com", "willa-mazury", "101")).toBe(
      "https://go.example.com/willa-mazury/101",
    );
  });
});

describe("stickerFileName", () => {
  it("slugifies Polish input to a filename-safe segment", () => {
    expect(stickerFileName("Willa Łódź")).toBe("willa-lodz");
    expect(stickerFileName("Pokój 2/B")).toBe("pokoj-2-b");
  });

  it("never returns an empty string", () => {
    expect(stickerFileName("???")).toBe("qr");
  });
});

describe("parseQrSize", () => {
  it("defaults to 1024 for missing or garbage input", () => {
    expect(parseQrSize(null)).toBe(1024);
    expect(parseQrSize("")).toBe(1024);
    expect(parseQrSize("abc")).toBe(1024);
  });

  it("clamps into the 256–2048 range", () => {
    expect(parseQrSize("64")).toBe(256);
    expect(parseQrSize("512")).toBe(512);
    expect(parseQrSize("9999")).toBe(2048);
  });
});

describe("chunkPages", () => {
  it("splits 20 rooms into 3 pages of 8", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const pages = chunkPages(items, 8);
    expect(pages).toHaveLength(3);
    expect(pages[0]).toHaveLength(8);
    expect(pages[2]).toHaveLength(4);
  });

  it("returns one page for a single page worth of items", () => {
    expect(chunkPages([1, 2, 3], 8)).toEqual([[1, 2, 3]]);
    expect(chunkPages([], 8)).toEqual([]);
  });

  it("rejects non-positive page size", () => {
    expect(() => chunkPages([1], 0)).toThrow();
  });
});

describe("qrSvg / qrPng", () => {
  it("renders an inline SVG with a viewBox", async () => {
    const svg = await qrSvg("https://go.example.com/willa-mazury/101");
    expect(svg).toMatch(/^<svg[^>]*viewBox="/);
    expect(svg).not.toContain("<script");
  });

  it("renders distinct codes for distinct URLs", async () => {
    const [a, b] = await Promise.all([
      qrSvg("https://go.example.com/willa-mazury/101"),
      qrSvg("https://go.example.com/willa-mazury/102"),
    ]);
    expect(a).not.toBe(b);
  });

  it("renders a PNG buffer with PNG magic bytes at the requested width", async () => {
    const png = await qrPng("https://go.example.com/willa-mazury/101", 512);
    // PNG signature: 0x89 0x50 0x4E 0x47
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50);
    // IHDR width is a big-endian uint32 at offset 16
    expect(png.readUInt32BE(16)).toBe(512);
  });
});
