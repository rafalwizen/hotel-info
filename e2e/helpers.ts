import { expect, type Page } from "@playwright/test";

/**
 * Shared panel helpers for e2e specs. Each call provisions a fresh account
 * and hotel (unique per timestamp + random suffix), so tests never depend
 * on each other or on prior runs.
 */

export type CreatedHotel = {
  email: string;
  hotelName: string;
  /** Predictable slug — createHotelAction slugifies the unique hotel name. */
  slug: string;
};

export async function createHotel(
  page: Page,
  opts: { wifiSsid?: string; wifiPassword?: string } = {},
): Promise<CreatedHotel> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `e2e-hotel-${stamp}@hotelinfo.test`;

  await page.goto("/rejestracja");
  await page.getByLabel("Imię").fill("E2E Owner");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło").fill("supertajne8");
  await page.getByRole("button", { name: "Utwórz konto" }).click();
  // Cold dev server: the first signup compiles the route + action round trip
  await expect(page).toHaveURL(/\/panel\/start$/, { timeout: 20_000 });

  const hotelName = `E2E Hotel ${stamp}`;
  await page.getByPlaceholder("np. Willa Mazury").fill(hotelName);
  if (opts.wifiSsid) {
    await page.getByLabel("Sieć Wi-Fi (SSID)").fill(opts.wifiSsid);
  }
  if (opts.wifiPassword) {
    await page.getByLabel("Hasło Wi-Fi").fill(opts.wifiPassword);
  }
  await page.getByRole("button", { name: "Utwórz hotel" }).click();

  await expect(page).toHaveURL(/\/panel\/pokoje$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Pokoje" })).toBeVisible();

  return { email, hotelName, slug: `e2e-hotel-${stamp}` };
}

/** Create a room; lands on its editor at /panel/pokoje/[id]. */
export async function createRoom(page: Page, number: string, namePl = "Pokój testowy") {
  await page.getByRole("button", { name: "Dodaj pokój" }).click();
  await page.getByLabel("Numer").fill(number);
  await page.getByPlaceholder("Polski").first().fill(namePl);
  await page.getByRole("button", { name: "Utwórz pokój" }).click();

  await expect(page).toHaveURL(/\/panel\/pokoje\/[0-9a-f-]+$/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: `Pokój ${number}` })).toBeVisible();
}
