import { expect, test } from "@playwright/test";

test("la demo enseña los dos productos, sin errores y sin moverse de lado en el móvil", async ({ page }) => {
  const errores: string[] = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1, name: "Buzón de facturas" })).toBeVisible();
  await expect(page.getByText("Por revisar ahora")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Tu web" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tu web" })).toBeVisible();
  await expect(page.getByText("Caídas por semana")).toBeVisible();
  expect(errores).toEqual([]);
});
