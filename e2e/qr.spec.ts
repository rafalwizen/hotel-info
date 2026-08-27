import { test, expect, type Page } from "@playwright/test";
import { createHotel, createRoom } from "./helpers";

/** Extract the room id from the editor URL (/panel/pokoje/<id>). */
async function currentRoomId(page: Page): Promise<string> {
  const id = new URL(page.url()).pathname.split("/").pop() ?? "";
  expect(id).toMatch(/^[0-9a-f-]{36}$/);
  return id;
}

test.describe("qr center", () => {
  test("checklist shows room urls and the print sheet renders stickers", async ({ page }) => {
    await createHotel(page);
    await createRoom(page, "101", "Pokój testowy");

    await page.getByRole("link", { name: "Kody QR" }).click();
    await expect(page.getByRole("heading", { name: "Kody QR" })).toBeVisible();

    // The exact guest URL that will be encoded in the sticker
    await expect(page.getByText(/\/e2e-hotel-[0-9a-z-]+\/101$/)).toBeVisible();
    await expect(page.getByText("Hol / recepcja")).toBeVisible();

    // Lobby + room are preselected; the button reflects two stickers
    await expect(page.getByText("Wydrukuje się 2 naklejki")).toBeVisible();

    // The sheet opens in a new tab and auto-prints (no-op headless)
    const [printPage] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByRole("link", { name: "Drukuj naklejki" }).click(),
    ]);
    await expect(printPage.getByRole("heading", { name: "Naklejki QR" })).toBeVisible();

    const lobbySticker = printPage.locator(".qr-sticker", { hasText: "Informacje o hotelu" });
    const roomSticker = printPage.locator(".qr-sticker", { hasText: "101" });
    await expect(lobbySticker).toBeVisible();
    await expect(roomSticker).toBeVisible();
    // Both stickers carry the fallback URL a guest could type in by hand
    await expect(roomSticker.getByText(/\/101$/)).toBeVisible();

    // Print media hides the screen chrome and keeps the sheets
    await printPage.emulateMedia({ media: "print" });
    await expect(printPage.getByRole("link", { name: "Wróć do wyboru" })).toBeHidden();
    await expect(roomSticker).toBeVisible();

    // The sheet really paginates as PDF
    const pdf = await printPage.pdf();
    expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  test("qr png endpoint serves authenticated owners and 404s everyone else", async ({
    page,
    request,
  }) => {
    // Anonymous: 404, never a redirect to the login page
    const anonymous = await request.get("/api/qr/00000000-0000-0000-0000-000000000000");
    expect(anonymous.status()).toBe(404);
    const anonymousHotel = await request.get("/api/qr/hotel");
    expect(anonymousHotel.status()).toBe(404);

    await createHotel(page);
    await createRoom(page, "202", "Pokój A");
    const roomId = await currentRoomId(page);

    // Owner: real PNG with a download disposition
    const own = await page.request.get(`/api/qr/${roomId}`);
    expect(own.status()).toBe(200);
    expect(own.headers()["content-type"]).toBe("image/png");
    expect(own.headers()["content-disposition"]).toContain("attachment");
    expect((await own.body())[0]).toBe(0x89); // PNG magic byte

    const ownHotel = await page.request.get("/api/qr/hotel");
    expect(ownHotel.status()).toBe(200);
    expect(ownHotel.headers()["content-type"]).toBe("image/png");

    // A different hotel owner must not fetch this room's code (tenancy)
    await page.getByRole("button", { name: "Wyloguj się" }).click();
    await expect(page).toHaveURL(/\/zaloguj/);
    await createHotel(page);
    const cross = await page.request.get(`/api/qr/${roomId}`);
    expect(cross.status()).toBe(404);
  });

  test("print sheet with nothing selected is a 404", async ({ page }) => {
    await createHotel(page);
    const response = await page.goto("/panel/qr/print");
    expect(response?.status()).toBe(404);
  });
});
