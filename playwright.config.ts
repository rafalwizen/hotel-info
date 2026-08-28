import { defineConfig, devices, type ReporterDescription } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  // HTML report is uploaded as a CI artifact on failure (see ci.yml).
  reporter: process.env.CI
    ? ([["github"], ["html", { open: "never" }]] satisfies ReporterDescription[])
    : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Always start a FRESH dev server per run: the app keeps in-memory state
  // (login rate limiter buckets) that must not leak between test runs.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        stdout: "pipe",
        timeout: 120_000,
      },
});
