import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";
import { ARCHIVO_ENLACES } from "../playwright.config";

/** El último enlace de entrar mandado a ese correo (la app lo escribe en un archivo en modo desarrollo). */
export async function enlaceDe(correo: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    const lineas = readFileSync(ARCHIVO_ENLACES, "utf8").trim().split("\n").filter(Boolean);
    const suyos = lineas.map((l) => JSON.parse(l) as { correo: string; enlace: string }).filter((x) => x.correo === correo);
    if (suyos.length) return suyos[suyos.length - 1].enlace;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No ha llegado ningún enlace para ${correo}`);
}

/** Entra con el correo: pide el enlace en /entrar y lo abre. */
export async function entrar(page: Page, correo: string) {
  await page.goto("/entrar");
  await page.getByLabel("Tu correo").fill(correo);
  await page.getByRole("button", { name: /Mandarme el enlace/ }).click();
  await expect(page.getByRole("status")).toContainText("te acaba de llegar un enlace");
  // El enlace lleva a una página con un botón (para que los escáneres de correo no lo gasten).
  await page.goto(await enlaceDe(correo));
  await expect(page.getByRole("heading", { name: "Entrar a tu panel" })).toBeVisible();
  await page.getByRole("button", { name: "Entrar" }).click();
}
