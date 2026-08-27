import { test, expect } from "@playwright/test";
import { createHotel, createRoom } from "./helpers";

/**
 * Guest-page suite. Runs with a Polish browser locale by default so the
 * PL-first rendering is deterministic; one test opts into en-US to verify
 * the browser-language auto-switch.
 */
test.use({ locale: "pl-PL" });

test.describe("guest pages", () => {
  test("room page: wifi masked by default, reveal works, noindex", async ({ page }) => {
    const { slug } = await createHotel(page, {
      wifiSsid: "E2E-Gosc",
      wifiPassword: "tajne123",
    });
    await createRoom(page, "301");

    await page.goto(`/${slug}/301`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("301");
    await expect(page.getByText("E2E-Gosc")).toBeVisible();

    // Masked by default — the literal never renders until revealed
    await expect(page.getByText("tajne123")).toBeHidden();
    await page.getByRole("button", { name: "Pokaż" }).click();
    await expect(page.getByText("tajne123")).toBeVisible();
    await page.getByRole("button", { name: "Ukryj" }).click();
    await expect(page.getByText("tajne123")).toBeHidden();

    // Wifi passwords must never end up in a search index
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("hotel overview lists rooms and links to the room page", async ({ page }) => {
    const { slug } = await createHotel(page);
    await createRoom(page, "101");

    await page.goto(`/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("E2E Hotel");
    await expect(page.getByText("E2E-Gosc")).toBeHidden(); // no wifi configured

    await page.getByRole("link", { name: /101/ }).click();
    await expect(page).toHaveURL(new RegExp(`/${slug}/101$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText("101");
  });

  test("old room slug permanently redirects after rename", async ({ page }) => {
    const { slug } = await createHotel(page);
    await createRoom(page, "202");

    // createRoom lands on the editor — rename the slug there
    await page.getByLabel("Adres (slug)").fill("prezydent");
    await page.getByRole("button", { name: "Zapisz dane pokoju" }).click();
    await expect(page.getByText("Zapisano dane pokoju.")).toBeVisible({ timeout: 15_000 });

    // The printed-sticker URL keeps working via a permanent redirect
    await page.goto(`/${slug}/202`);
    await expect(page).toHaveURL(new RegExp(`/${slug}/prezydent$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText("202");
  });

  test("unpublished room is not reachable", async ({ page }) => {
    const { slug } = await createHotel(page);
    await createRoom(page, "303");

    await page.getByRole("link", { name: "Pokoje" }).click();
    await page.getByText("Ukryj", { exact: true }).click();
    await expect(page.getByText("Ukryty", { exact: true })).toBeVisible();

    await page.goto(`/${slug}/303`);
    await expect(page.getByText("This page could not be found")).toBeVisible();
  });
});

test.describe("guest locale", () => {
  // English browser: the page must auto-switch after mount, and a manual
  // PL choice must survive a reload (localStorage).
  test.use({ locale: "en-US" });

  test("follows browser language and persists manual choice", async ({ page }) => {
    const { slug } = await createHotel(page, { wifiSsid: "E2E-Gosc" });
    await createRoom(page, "302");

    await page.goto(`/${slug}/302`);
    // Server paints PL, the en-US browser swaps to EN after mount
    await expect(page.getByText("Hotel information")).toBeVisible();

    await page.getByRole("button", { name: "PL" }).click();
    await expect(page.getByText("Informacje o obiekcie")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Informacje o obiekcie")).toBeVisible();
  });
});
