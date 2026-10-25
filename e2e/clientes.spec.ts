import { expect, test, type APIRequestContext } from "@playwright/test";
import { ADMIN_E2E, LLAVE_COSMERITO_E2E } from "../playwright.config";
import { entrar } from "./ayuda";

/**
 * El recorrido entero: el administrador da de alta dos gestorías, cada una con
 * su buzón y su llave; llegan avisos; una persona de la primera entra y ve
 * solo lo suyo. Lo más importante que tiene que cumplir el panel, en la app de
 * verdad.
 */
test.describe.configure({ mode: "serial" });

const llaves: Record<string, string> = {};
const ids: Record<string, string> = {};

const mandar = (request: APIRequestContext, llave: string, cuerpo: unknown) =>
  request.post("/api/avisos", { headers: { Authorization: `Bearer ${llave}` }, data: cuerpo });

test("el administrador da de alta dos gestorías con su buzón y su llave", async ({ page }) => {
  await entrar(page, ADMIN_E2E);
  await expect(page).toHaveURL(/\/admin$/);
  for (const nombre of ["Gestoría A", "Gestoría B"]) {
    await page.getByLabel("Cliente nuevo").fill(nombre);
    await page.getByRole("button", { name: "Dar de alta" }).click();
    const tarjeta = page.locator("section", { has: page.getByRole("heading", { name: nombre }) });
    await expect(tarjeta).toBeVisible();
    await tarjeta.getByRole("button", { name: "Añadir producto" }).click();
    await expect(tarjeta.getByText("Llave: sin llave")).toBeVisible();
    await tarjeta.getByRole("button", { name: "Crear la llave" }).click();
    llaves[nombre] = (await tarjeta.locator("code").first().textContent())!.trim();
    expect(llaves[nombre]).toMatch(/^dcp_/);
    ids[nombre] = new URL((await tarjeta.getByRole("link", { name: "Ver su panel" }).getAttribute("href"))!, "http://x").searchParams.get("cliente")!;
  }
  const a = page.locator("section", { has: page.getByRole("heading", { name: "Gestoría A" }) });
  await a.getByLabel("Correo").fill("ana@e2e.ejemplo");
  await a.getByRole("button", { name: "Dar acceso" }).click();
  await expect(a.getByText("ana@e2e.ejemplo")).toBeVisible();
});

test("los avisos entran con su llave, y el filtro rechaza lo que no debe", async ({ request }) => {
  const ok = await mandar(request, llaves["Gestoría A"], {
    producto: "buzon-facturas", cliente: "017", ok: true, texto: "3 facturas archivadas; 1 por revisar", cifras: { facturas: 3, pendientes: 1 },
  });
  expect(ok.status()).toBe(200);
  expect((await mandar(request, llaves["Gestoría B"], { producto: "buzon-facturas", cliente: "099", ok: true, texto: "2 facturas archivadas", cifras: { facturas: 2 } })).status()).toBe(200);
  const dni = await mandar(request, llaves["Gestoría A"], { producto: "buzon-facturas", cliente: "017", ok: false, texto: "Factura de 12345678Z" });
  expect(dni.status()).toBe(400);
  const falsa = await mandar(request, "dcp_inventada", { producto: "buzon-facturas", ok: true, texto: "x" });
  expect(falsa.status()).toBe(401);
});

test("una persona de la Gestoría A entra y solo ve lo suyo", async ({ page }) => {
  await entrar(page, "ana@e2e.ejemplo");
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByText("Gestoría A")).toBeVisible();
  await expect(page.getByText("Revisar (1)")).toBeVisible();
  await expect(page.getByRole("cell", { name: "017" })).toBeVisible();
  await expect(page.getByText("099")).toHaveCount(0);
  // Pedir el panel de otro cliente no sirve: eso solo lo puede el administrador.
  await page.goto(`/panel?cliente=${ids["Gestoría B"]}`);
  await expect(page.getByText("Gestoría A")).toBeVisible();
  await expect(page.getByText("Gestoría B")).toHaveCount(0);
  await expect(page.getByText("099")).toHaveCount(0);
  // Y la administración, tampoco.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/panel$/);
});

test("Cosmerito recibe el resumen de los dos, sin códigos ni textos", async ({ request }) => {
  expect((await request.get("/api/cosmerito/v1/resumen")).status()).toBe(401);
  const r = await request.get("/api/cosmerito/v1/resumen", { headers: { Authorization: `Bearer ${LLAVE_COSMERITO_E2E}` } });
  expect(r.status()).toBe(200);
  const cuerpo = await r.text();
  expect(cuerpo).toContain("Gestoría A");
  expect(cuerpo).toContain("Gestoría B");
  expect(cuerpo).not.toContain("017");
  expect(cuerpo).not.toContain("facturas archivadas");
});
