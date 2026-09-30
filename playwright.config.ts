import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

/**
 * Tes end-to-end (browser sungguhan) — lihat README "Testing".
 * Default memakai `npm run dev` di http://localhost:3000 (server yang sudah jalan dipakai ulang).
 * Butuh database development yang sudah di-seed (npm run db:seed) & PAYMENT_PROVIDER=mock.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  // Tes berbagi database development → berurutan agar hasil stabil.
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "id-ID",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Opsional: pakai Chromium yang sudah terpasang (mis. di CI) alih-alih unduhan Playwright.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: baseURL, reuseExistingServer: true, timeout: 180_000 },
});
