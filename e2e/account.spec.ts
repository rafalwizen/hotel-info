import { test, expect } from "@playwright/test";
import { createHotel } from "./helpers";

test.describe("account data rights (RODO)", () => {
  test("export downloads JSON with account data", async ({ page }) => {
    const { email } = await createHotel(page);
    await page.goto("/panel/ustawienia");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Pobierz moje dane (JSON)" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("moje-dane-hotel-info.json");
    const stream = await download.createReadStream();
    let json = "";
    for await (const chunk of stream) json += chunk;
    const parsed = JSON.parse(json);
    expect(parsed.account.email).toBe(email);
    expect(parsed.account.passwordHash).toBeUndefined();
    expect(parsed.hotels.length).toBeGreaterThan(0);
  });

  test("delete account requires exact e-mail confirmation", async ({ page }) => {
    await createHotel(page);
    await page.goto("/panel/ustawienia");

    await page.getByLabel(/Aby potwierdzić/).fill("wrong-address@hotelinfo.test");
    await page.getByRole("button", { name: "Trwale usuń konto" }).click();

    await expect(
      page.getByText("Wpisz dokładnie swój adres e-mail, aby potwierdzić usunięcie konta."),
    ).toBeVisible();
    // Still logged in and on the settings page.
    await expect(page).toHaveURL(/\/panel\/ustawienia$/);
  });

  test("delete account removes hotel and ends the session", async ({ page }) => {
    const { email, slug } = await createHotel(page);
    await page.goto("/panel/ustawienia");

    await page.getByLabel(/Aby potwierdzić/).fill(email);
    await page.getByRole("button", { name: "Trwale usuń konto" }).click();

    // signOut redirects to the landing page.
    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

    // Session is gone: login with the old credentials must fail.
    await page.goto("/zaloguj");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Hasło").fill("supertajne8");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page.getByText("Nieprawidłowy e-mail lub hasło.")).toBeVisible();

    // The guest pages of the deleted hotel are gone (404, no leak).
    const response = await page.request.get(`/${slug}`);
    expect(response.status()).toBe(404);
  });
});
