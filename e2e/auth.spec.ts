import { test, expect } from "@playwright/test";
import { createHotel } from "./helpers";

/**
 * Self-contained tests: each test generates its own email INSIDE the test
 * body. The spec module may be re-evaluated in separate workers, so a
 * module-level const would give different values to different tests.
 */
test.describe("auth flow", () => {
  test("signup creates session and lands on onboarding", async ({ page }) => {
    const email = `e2e-signup-${Date.now()}@hotelinfo.test`;
    await page.goto("/rejestracja");
    await page.getByLabel("Imię").fill("E2E Test");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Hasło").fill("supertajne8");
    await page.getByRole("button", { name: "Utwórz konto" }).click();

    // No hotel yet — the panel routes redirect to the onboarding wizard.
    await expect(page).toHaveURL(/\/panel\/start$/);
    // CardTitle renders as a div (shadcn) — assert on text, not heading role.
    // Reaching /panel/start already proves the session (proxy redirects
    // anonymous users to /zaloguj).
    await expect(page.getByText("Skonfiguruj swój hotel")).toBeVisible();
  });

  test("panel requires session (proxy redirect)", async ({ page }) => {
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/zaloguj\?next=%2Fpanel/);
    // CardTitle renders as a div (shadcn), so assert on the description text
    await expect(page.getByText("Panel zarządzania Twoim hotelem")).toBeVisible();
  });

  test("logout then login works", async ({ page }) => {
    const email = `e2e-login-${Date.now()}@hotelinfo.test`;
    const password = "supertajne8";

    // Create the account this test will log into
    await page.goto("/rejestracja");
    await page.getByLabel("Imię").fill("E2E Login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Hasło").fill(password);
    await page.getByRole("button", { name: "Utwórz konto" }).click();
    await expect(page).toHaveURL(/\/panel\/start$/);

    // The onboarding page has no sidebar — logout via its escape hatch
    await page.getByRole("button", { name: "Wyloguj się" }).click();
    await expect(page).toHaveURL(/\/zaloguj$/);

    // Panel now redirects back to login
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/zaloguj/);

    // Log back in with the same credentials
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Hasło").fill(password);
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/panel\/start$/);
    await expect(page.getByText("Skonfiguruj swój hotel")).toBeVisible();
  });

  test("wrong password shows error message", async ({ page }) => {
    const email = `e2e-limit-${Date.now()}@hotelinfo.test`;
    await page.goto("/zaloguj");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Hasło").fill("zle-haslo");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    // The limiter counts FAILED attempts only (successes clear the bucket),
    // but its buckets live as long as the dev-server process — repeated
    // suite runs against one server can still legitimately trip it, so both
    // error outcomes are accepted. Bucket logic is covered by unit tests.
    await expect(
      page.getByText(/Nieprawidłowy e-mail lub hasło\.|Zbyt wiele prób logowania/),
    ).toBeVisible();
  });
});

test.describe("onboarding + room crud", () => {
  test("onboarding creates hotel with auto slug and lands on rooms", async ({ page }) => {
    await createHotel(page);

    // Live slug preview derived from the hotel name
    await expect(page.getByText("Nie masz jeszcze pokoi")).toBeVisible();
    // Sidebar navigation is present once a hotel exists
    await expect(page.getByRole("link", { name: "Szablon pokoi" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ustawienia" })).toBeVisible();
  });

  test("room create opens the editor and saves edits", async ({ page }) => {
    await createHotel(page);

    await page.getByRole("button", { name: "Dodaj pokój" }).click();
    await page.getByLabel("Numer").fill("101");
    await page.getByPlaceholder("Polski").first().fill("Pokój standardowy");
    await page.getByRole("button", { name: "Utwórz pokój" }).click();

    // createRoomAction redirects straight to the new room editor
    await expect(page).toHaveURL(/\/panel\/pokoje\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: "Pokój 101" })).toBeVisible();

    // Edit and save room identity
    await page.getByLabel("Max gości").fill("4");
    await page.getByRole("button", { name: "Zapisz dane pokoju" }).click();
    await expect(page.getByText("Zapisano dane pokoju.")).toBeVisible({ timeout: 15_000 });

    // Back on the list, the room row is visible
    await page.getByRole("link", { name: "Pokoje" }).click();
    await expect(page.getByText("Pokój standardowy")).toBeVisible();
    await expect(page.getByText("/101")).toBeVisible();
  });
});
