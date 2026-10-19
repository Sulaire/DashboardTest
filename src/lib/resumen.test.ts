import assert from "node:assert/strict";
import { test } from "node:test";
import { avisosDeDemo } from "@/lib/demo";
import { producto } from "@/lib/productos/cargar";
import { resumenProducto } from "@/lib/resumen";

const ahora = new Date("2026-10-15T10:00:00Z");
const buzon = producto("buzon-facturas")!;

test("el resumen para Cosmerito trae semáforo y cifras", () => {
  const r = resumenProducto(buzon, avisosDeDemo(ahora), ahora);
  assert.equal(r.producto, "buzon-facturas");
  assert.equal(r.semaforo, "ambar");
  assert.equal(r.por_revisar, 1);
  const porEtiqueta = Object.fromEntries(r.cifras.map((c) => [c.etiqueta, c]));
  assert.equal(porEtiqueta["Por revisar ahora"].numero, 1);
  assert.equal(porEtiqueta["Clientes activos (30 días)"].numero, 11);
  assert.ok(porEtiqueta["Último envío a la gestoría"].fecha);
  assert.ok(r.ultimo_aviso);
});

test("el resumen no lleva códigos ni textos de los avisos", () => {
  const avisos = [
    { codigo: "CANARIO-COD", ok: false, texto: "TEXTO-CANARIO", cifras: { pendientes: 2 }, recibido_en: new Date(ahora.getTime() - 3_600_000) },
  ];
  const salida = JSON.stringify(resumenProducto(buzon, avisos, ahora));
  assert.doesNotMatch(salida, /CANARIO/);
  assert.deepEqual(Object.keys(resumenProducto(buzon, avisos, ahora)).sort(), [
    "cifras",
    "incompleto",
    "nombre",
    "por_revisar",
    "producto",
    "semaforo",
    "ultimo_aviso",
  ]);
});

test("callado hace meses: rojo, con su última fecha", () => {
  const ultimo = new Date("2026-05-01T10:00:00Z");
  const r = resumenProducto(buzon, [], ahora, { historial: { ultimo, codigos: new Map([["1", ultimo]]) } });
  assert.equal(r.semaforo, "rojo");
  assert.equal(r.ultimo_aviso, ultimo.toISOString());
});

test("sin avisos: gris y cifras a cero o vacías", () => {
  const r = resumenProducto(buzon, [], ahora);
  assert.equal(r.semaforo, "gris");
  assert.equal(r.ultimo_aviso, null);
  assert.ok(r.cifras.every((c) => c.numero === 0 || c.numero === null));
});
