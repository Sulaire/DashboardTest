import assert from "node:assert/strict";
import { test } from "node:test";
import { limpiarAviso } from "@/lib/avisos";
import { producto } from "@/lib/productos/cargar";

const buzon = producto("buzon-facturas")!;
const base = { producto: "buzon-facturas", cliente: "017", ok: true, texto: "12 facturas archivadas", cifras: { facturas: 12 } };

test("acepta el formato común", () => {
  assert.deepEqual(limpiarAviso(base, buzon), {
    aviso: { codigo: "017", ok: true, texto: "12 facturas archivadas", cifras: { facturas: 12 } },
  });
  // Sin código ni cifras también vale (un aviso de todo el buzón).
  assert.ok("aviso" in limpiarAviso({ producto: "buzon-facturas", ok: false, texto: "Gmail no responde" }, buzon));
});

test("el producto tiene que ser el de la llave", () => {
  assert.ok("error" in limpiarAviso({ ...base, producto: "otro" }, buzon));
});

test("el código es corto, nunca un nombre", () => {
  assert.ok("error" in limpiarAviso({ ...base, cliente: "Bar Ejemplo S.L." }, buzon));
  // Un número se toma como código (n8n a veces los manda así).
  const r = limpiarAviso({ ...base, cliente: 17 }, buzon);
  assert.ok("aviso" in r && r.aviso.codigo === "17");
});

test("rechaza datos personales e importes en el texto", () => {
  for (const texto of [
    "Factura de juan@correo.es",
    "Llamar al 600 123 456",
    "Cuenta ES12 3456 7890 1234",
    "NIF 12345678Z",
    "Total 120,50 €",
    "Total 120 euros",
    // Los que encontró la auditoría del 19-10-2026:
    "Llama al 612.34.56.78",
    "DNI 12.345.678-Z",
    "DNI 12345678 Z",
    "NIE X-1234567-L",
    "Importe 79.03",
    "EUR 79",
    "79 USD",
    "Llama al ６１２３４５６７８",
    "Llama al 6\u200B1\u200B2\u200B3\u200B4\u200B5\u200B6\u200B7\u200B8",
    "Escribe a ana＠gmail.com",
    "Cuenta ES12/3456/7890/1234",
    "Escribe a ana (at) gmail.com",
    "ana arroba gmail punto com",
    "Llama al 61/23/4567 o al 12/34/5678",
  ])
    assert.ok("error" in limpiarAviso({ ...base, texto }, buzon), texto);
  assert.ok("error" in limpiarAviso({ ...base, texto: "Total 120,50" }, buzon));
  assert.ok("error" in limpiarAviso({ ...base, texto: "x".repeat(161) }, buzon));
  assert.ok("error" in limpiarAviso({ ...base, texto: "   " }, buzon));
});

test("las fechas y horas no se confunden con teléfonos", () => {
  for (const texto of [
    "Envío del 2026-10-03 09:00 hecho",
    "Pasada del 03/10/2026 a las 09:00:15",
    "12 facturas archivadas; 3 por revisar",
    "Semana 41: 120 facturas",
    "12 archivadas y 3 por revisar", // la «y» seguida de un número no es un NIE
    "Pasada del 2026-12-31 a las 23:59",
  ])
    assert.ok("aviso" in limpiarAviso({ ...base, texto }, buzon), texto);
});

test("un código no puede ser un DNI, NIE, CIF ni teléfono", () => {
  for (const cliente of ["12345678Z", "X1234567L", "B12345678", "612345678", "1234567"])
    assert.ok("error" in limpiarAviso({ ...base, cliente }, buzon), cliente);
  for (const cliente of ["017", "C-023", "cliente_7", "BAR01"]) assert.ok("aviso" in limpiarAviso({ ...base, cliente }, buzon), cliente);
  // Sin ninguna cifra, es un nombre (como el id_negocio de la v3).
  for (const cliente of ["BARDEEJEMPLO", "ana.garcia"]) assert.ok("error" in limpiarAviso({ ...base, cliente }, buzon), cliente);
});

test("las cifras heredadas de los objetos de JavaScript no cuelan", () => {
  assert.ok("error" in limpiarAviso({ ...base, cifras: JSON.parse('{"constructor": 7903}') }, buzon));
  assert.ok("error" in limpiarAviso({ ...base, cifras: JSON.parse('{"toString": 1}') }, buzon));
});

test("el texto se guarda normalizado y sin invisibles", () => {
  const r = limpiarAviso({ ...base, texto: "１２ facturas\u200B archivadas" }, buzon);
  assert.ok("aviso" in r && r.aviso.texto === "12 facturas archivadas");
});

test("las cifras son recuentos declarados por el producto", () => {
  assert.ok("error" in limpiarAviso({ ...base, cifras: { importe_total: 1200 } }, buzon));
  assert.ok("aviso" in limpiarAviso({ ...base, cifras: { facturas: 3, pendientes: 0 } }, buzon));
  assert.ok("error" in limpiarAviso({ ...base, cifras: { facturas: 12.5 } }, buzon));
  assert.ok("error" in limpiarAviso({ ...base, cifras: { facturas: -1 } }, buzon));
  assert.ok("error" in limpiarAviso({ ...base, cifras: [1] }, buzon));
});

test("ok es obligatorio y booleano", () => {
  assert.ok("error" in limpiarAviso({ ...base, ok: "true" }, buzon));
});
