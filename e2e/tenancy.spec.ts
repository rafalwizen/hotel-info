import { test, expect, type Page } from "@playwright/test";
import { createHotel, createRoom } from "./helpers";

/**
 * Cross-tenant isolation: URL ids from another hotel must never resolve —
 * a 404 (not 403) so their existence cannot even be probed. The QR API side
 * of this contract lives in qr.spec.ts; this file covers the panel pages.
 */

/** Extract the room id from the editor URL (/panel/pokoje/<id>). */
async function currentRoomId(page: Page): Promise<string> {
  const id = new URL(page.url()).pathname.split("/").pop() ?? "";
  expect(id).toMatch(/^[0-9a-f-]{36}$/);
  return id;
}

test.describe("tenant isolation", () => {
  test("a foreign room id in the panel editor 404s", async ({ page }) => {
    // Hotel A owns a room; capture its id from the editor URL
    await createHotel(page);
    await createRoom(page, "101", "Pokój A");
    const foreignRoomId = await currentRoomId(page);

    // Switch to hotel B (fresh account) and try to open A's room editor
    await page.getByRole("button", { name: "Wyloguj się" }).click();
    await expect(page).toHaveURL(/\/zaloguj/);
    await createHotel(page);

    const response = await page.goto(`/panel/pokoje/${foreignRoomId}`);
    expect(response?.status()).toBe(404);
    await expect(page.getByText("This page could not be found")).toBeVisible();
  });
});
