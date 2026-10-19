import assert from "node:assert/strict";
import { test } from "node:test";
import { crearLimite } from "@/lib/limite";

test("el límite deja pasar hasta N por minuto y vuelve a abrir al minuto siguiente", () => {
  const dentro = crearLimite(2);
  assert.equal(dentro("a", 0), true);
  assert.equal(dentro("a", 10), true);
  assert.equal(dentro("a", 20), false);
  assert.equal(dentro("b", 20), true); // cada clave lleva su cuenta
  assert.equal(dentro("a", 60_000), true);
});

test("el mapa no crece sin fin", () => {
  const dentro = crearLimite(1, 3);
  for (const c of ["a", "b", "c", "d"]) assert.equal(dentro(c, 0), true);
  assert.equal(dentro("a", 0), true); // se vació al llegar al máximo: «a» empieza de cero
});

test("«lleno» mira sin gastar, y la ventana puede ser más larga que un minuto", () => {
  const dentro = crearLimite(2, 100, 15 * 60_000);
  assert.equal(dentro.lleno("a", 0), false);
  dentro("a", 0);
  dentro("a", 1);
  assert.equal(dentro.lleno("a", 2), true);
  assert.equal(dentro("a", 60_000), false); // a los 15 minutos, no al minuto
  assert.equal(dentro("a", 15 * 60_000), true);
});
