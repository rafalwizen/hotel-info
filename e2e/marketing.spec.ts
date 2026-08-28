import { test, expect } from "@playwright/test";

/**
 * Marketing pages: the landing must sell AND its interactive demo must
 * behave like the real guest page (it is built from the same components).
 */
test.describe("marketing", () => {
  test("landing shows the offer and reaches signup", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Gość skanuje naklejkę. Recepcja ma spokój." }),
    ).toBeVisible();

    // Hero QR is generated client-side after mount — wait for the SVG.
    await expect(page.locator("[data-hero-qr] svg")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Wypróbuj 14 dni za darmo" }).first().click();
    await expect(page).toHaveURL(/\/rejestracja$/);
  });

  test("demo phone reacts like the real guest page", async ({ page }) => {
    await page.goto("/#demo");

    // DoorPlate: big mono room number
    await expect(page.getByRole("heading", { level: 1, name: /101/ })).toBeVisible({
      timeout: 20_000,
    });

    // Wi-Fi reveal (the demo uses the real WifiCard)
    await page.getByRole("button", { name: "Pokaż" }).click();
    await expect(page.getByText("mazury2026")).toBeVisible();

    // PL -> EN swap (real GuestHeader locale pill). exact: true — in dev the
    // "Open Next.js Dev Tools" button also substring-matches "en".
    await page.getByRole("button", { name: "en", exact: true }).click();
    await expect(page.getByText("Standard room")).toBeVisible();
    await expect(page.getByText("How things work")).toBeVisible();
  });

  test("pricing and contact pages render", async ({ page }) => {
    await page.goto("/cennik");
    await expect(page.getByRole("heading", { level: 1, name: "Jedna cena. Cały hotel." })).toBeVisible();
    await expect(page.getByText("49 zł").first()).toBeVisible();

    await page.goto("/kontakt");
    await expect(page.getByRole("heading", { level: 1, name: "Napisz, odpowiemy szybko." })).toBeVisible();
    // Scoped to main — the footer repeats the same mailto link.
    await expect(page.locator("main").getByRole("link", { name: /@/ })).toBeVisible();
  });
});
