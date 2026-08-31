import { test, expect } from "@playwright/test";
import { createHotel, createRoom } from "./helpers";

/**
 * Arrival guide ("Dojazd"): the shareable how-to-find-us link. Panel side,
 * the public /{hotel}/dojazd page, room-page block and per-room overrides.
 * Photo upload itself is not covered here — it needs a real Blob store
 * token (BLOB_READ_WRITE_TOKEN); see the deploy runbook in README.
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

test.describe("arrival guide (guest)", () => {
  // Polish locale keeps the PL-first rendering deterministic.
  test.use({ locale: "pl-PL" });

  test("public guide shows steps, map link and EN toggle", async ({ page }) => {
    const { slug } = await createHotel(page);

    // No content yet -> the shared link is a 404, not an empty page
    await page.goto(`/${slug}/dojazd`);
    await expect(page.getByText("This page could not be found")).toBeVisible();

    // One step + a map pin
    await page.goto("/panel/dojazd");
    await page.getByRole("button", { name: "Dodaj krok" }).click();
    await page.getByPlaceholder("np. Brama na kod").fill("Brama na kod 4321");
    await page.getByRole("button", { name: "Dodaj krok", exact: true }).click();
    await expect(page.getByText("Zapisano krok.")).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("Link do pinezki na mapie").fill("https://maps.example.com/pin");
    await page.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(page.getByText("Zapisano link do mapy.")).toBeVisible({ timeout: 15_000 });

    // The shareable page: heading, step, map target, noindex
    await page.goto(`/${slug}/dojazd`);
    await expect(page.getByRole("heading", { name: "Jak do nas trafić" })).toBeVisible();
    await expect(page.getByText("Brama na kod 4321")).toBeVisible();
    const map = page.getByRole("link", { name: "Otwórz w Mapach" });
    await expect(map).toHaveAttribute("href", "https://maps.example.com/pin");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    // EN toggle swaps the chrome copy (step content falls back to PL)
    await page.getByRole("button", { name: "en", exact: true }).click();
    await expect(page.getByRole("heading", { name: "How to find us" })).toBeVisible();
  });

  test("room page block inherits steps; hiding works per room", async ({ page }) => {
    const { slug } = await createHotel(page);
    await createRoom(page, "201");
    const editorUrl = page.url();

    // Hotel-wide step (URL asserted first: "Dodaj krok pokoju" on the room
    // editor would substring-match otherwise during the client-side nav)
    await page.getByRole("link", { name: "Dojazd" }).click();
    await expect(page).toHaveURL(/\/panel\/dojazd$/);
    await page.getByRole("button", { name: "Dodaj krok" }).click();
    await page.getByPlaceholder("np. Brama na kod").fill("Wejście od podwórza");
    await page.getByRole("button", { name: "Dodaj krok", exact: true }).click();
    await expect(page.getByText("Zapisano krok.")).toBeVisible({ timeout: 15_000 });

    // Room page: collapsible block lists the inherited step + guide link
    await page.goto(`/${slug}/201`);
    await page.getByText("Jak dotrzeć", { exact: true }).click();
    await expect(page.getByText("Wejście od podwórza")).toBeVisible();
    await expect(page.getByRole("link", { name: "Pełna instrukcja dojazdu" })).toHaveAttribute(
      "href",
      `/${slug}/dojazd`,
    );

    // Hide the step for this room only
    await page.goto(editorUrl);
    await page.getByRole("button", { name: "Ukryj w tym pokoju" }).click();
    await expect(page.getByText("Krok ukryty w tym pokoju.")).toBeVisible({ timeout: 15_000 });

    // Room page loses the whole block (no steps left); the guide keeps it
    await page.goto(`/${slug}/201`);
    await expect(page.getByText("Jak dotrzeć", { exact: true })).toBeHidden();
    await page.goto(`/${slug}/dojazd`);
    await expect(page.getByText("Wejście od podwórza")).toBeVisible();
  });

  test("room slug 'dojazd' is rejected", async ({ page }) => {
    await createHotel(page);
    await createRoom(page, "202");

    await page.getByLabel("Adres (slug)").fill("dojazd");
    await page.getByRole("button", { name: "Zapisz dane pokoju" }).click();
    await expect(
      page.getByText("Ten adres jest zarezerwowany dla systemu — wybierz inny."),
    ).toBeVisible();
  });
});
