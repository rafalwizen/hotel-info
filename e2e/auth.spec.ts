import { test, expect } from "@playwright/test";

/**
 * Self-contained tests: each test generates its own email INSIDE the test
 * body. The spec module may be re-evaluated in separate workers, so a
 * module-level const would give different values to different tests.
 */
test.describe("auth flow", () => {
  test("signup creates account, session and redirects to panel", async ({ page }) => {
    const email = `e2e-signup-${Date.now()}@hotelinfo.test`;
    await page.goto("/rejestracja");
    await page.getByLabel("Imię").fill("E2E Test");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Hasło").fill("supertajne8");
    await page.getByRole("button", { name: "Utwórz konto" }).click();

    await expect(page).toHaveURL(/\/panel$/);
    await expect(page.getByRole("heading", { name: "Cześć, E2E Test!" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    // New user has no hotel yet — onboarding hint visible
    await expect(page.getByText("Nie masz jeszcze hotelu", { exact: false })).toBeVisible();
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
    await expect(page).toHaveURL(/\/panel$/);

    // Logout via placeholder dashboard button (phase 3 replaces it)
    await page.getByRole("button", { name: "Wyloguj się" }).click();
    await expect(page).toHaveURL(/\/zaloguj$/);

    // Panel now redirects back to login
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/zaloguj/);

    // Log back in with the same credentials
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Hasło").fill(password);
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL(/\/panel$/);
    await expect(page.getByRole("heading", { name: "Cześć, E2E Login!" })).toBeVisible();
  });

  test("wrong password shows error message", async ({ page }) => {
    const email = `e2e-limit-${Date.now()}@hotelinfo.test`;
    await page.goto("/zaloguj");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Hasło").fill("zle-haslo");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    // Rate limiter engagement is NOT asserted here: in-memory buckets are
    // not shared across dev-server requests (see rate-limit.ts caveat), so
    // its logic is covered by unit tests instead.
    await expect(page.getByText("Nieprawidłowy e-mail lub hasło.")).toBeVisible();
  });
});
