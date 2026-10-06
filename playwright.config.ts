import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "./e2e/support/env";

loadEnv();

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e/specs",
  // Las pruebas escriben en la misma base: en serie para que no se pisen
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    viewport: { width: 1600, height: 1000 },
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /**
   * Levanta la app si no está corriendo, y la reutiliza si ya lo está.
   * Sin esto, con el servidor caído TODAS las pruebas fallan en milisegundos
   * y el reporte parece un sistema roto cuando solo faltaba `npm run dev`.
   *
   * Se espera por puerto y no por URL: el dev server responde 404 a la
   * petición de sondeo aunque la app funcione.
   */
  webServer: {
    command: "npm run dev",
    port: Number(new URL(baseURL).port || 3000),
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
