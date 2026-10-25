import { defineConfig, devices } from "@playwright/test";
import { join } from "node:path";

/**
 * Pruebas de punta a punta: la app de verdad (en modo desarrollo, para que el
 * enlace de entrar no necesite Resend) y un navegador de verdad. Necesitan un
 * Postgres de usar y tirar en E2E_DATABASE_URL: lo vacían al empezar.
 *
 *   E2E_DATABASE_URL=postgres://… npm run e2e
 */
const PUERTO = 3300;
export const URL_E2E = `http://localhost:${PUERTO}`;
export const ARCHIVO_ENLACES = join(process.cwd(), "test-results", "enlaces.jsonl");
export const LLAVE_COSMERITO_E2E = "llave-de-cosmerito-para-las-pruebas-e2e-0123456789";
export const ADMIN_E2E = "admin@e2e.ejemplo";

const base = process.env.E2E_DATABASE_URL;
if (!base) throw new Error("Falta E2E_DATABASE_URL: un Postgres de usar y tirar (las pruebas lo vacían).");

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/preparar.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: { baseURL: URL_E2E, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${PUERTO}`,
    // /demo no toca la base de datos: así el servidor arranca antes de que preparar.ts la vacíe.
    url: `${URL_E2E}/demo`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      DATABASE_URL: base,
      PANEL_DB_PASSWORD: "contrasena-de-las-pruebas-e2e-0123456789",
      BETTER_AUTH_SECRET: "secreto-de-las-pruebas-e2e-0123456789-abcdefghij",
      PANEL_URL: URL_E2E,
      PANEL_ADMIN_EMAIL: ADMIN_E2E,
      PANEL_ENLACES_ARCHIVO: ARCHIVO_ENLACES,
      PANEL_COSMERITO_TOKEN: LLAVE_COSMERITO_E2E,
      RESEND_API_KEY: "",
      PANEL_CORREO_DE: "",
    },
  },
});
