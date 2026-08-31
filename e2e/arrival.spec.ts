import { test, expect } from "@playwright/test";
import { createHotel } from "./helpers";

/**
 * Arrival guide ("Dojazd"): the shareable how-to-find-us link. Panel side
 * lives here; the public page and room overrides are covered below and in
 * the guest specs.
 */
test.describe("arrival guide (panel)", () => {
  test("editor lists steps and offers the share link", async ({ page }) => {
    await createHotel(page);

    await page.getByRole("link", { name: "Dojazd" }).click();
    await expect(page.getByRole("heading", { name: "Dojazd" })).toBeVisible();

    // The link the owner pastes into Booking/SMS chats
    await expect(page.getByText("Kopiuj link")).toBeVisible();
    await expect(page.getByText("Kopiuj wiadomość")).toBeVisible();
    await expect(page.getByText(/\/dojazd$/)).toBeVisible();

    // Empty state -> the add button is the call to action
    await expect(page.getByText("Brak kroków", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Dodaj krok" }).click();
    await expect(page.getByPlaceholder("np. Brama na kod")).toBeVisible();

    // Create a step and see it listed with its ordinal
    await page.getByPlaceholder("np. Brama na kod").fill("Brama na kod 1234");
    await page.getByRole("button", { name: "Dodaj krok", exact: true }).click();
    await expect(page.getByText("Zapisano krok.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("#1")).toBeVisible();
  });
});
