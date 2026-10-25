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
    // Los de la segunda auditoría (25-10-2026):
    "Llama al 612 - 345 - 678",
    "Llama al 612 / 345 / 678",
    "Llama al 612\u2066345\u2069678",
    "Llama al 6\u034F1\u034F2\u034F3\u034F4\u034F5\u034F6\u034F7\u034F8",
    "Llama al 612\u3164345\u3164678",
    "Llama al ٦١٢٣٤٥٦٧٨",
    "ana @ gmail.com",
    "ana@gmail",
    "ana{at}gmail.com",
    "ana<at>gmail.com",
    "ana at gmail dot com",
    "Total 79eur",
    "Total 79EUROS",
    "Total 79'03",
    "Total 79 , 03",
    "Total 1500 pts",
    "Son 1500 pesetas",
    "Total 79₹",
    "Mira https://drive.google.com/file/d/abc",
    "Mira www.ejemplo.es",
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
  for (const cliente of ["017", "C-023", "BAR01", "A-7", "123456"]) assert.ok("aviso" in limpiarAviso({ ...base, cliente }, buzon), cliente);
  // Los de la segunda auditoría (25-10-2026): con separadores, o un nombre con una cifra.
  for (const cliente of ["612-345-678", "612.34.56.78", "12.345.678-Z", "6_1_2_3_4_5_6_7_8", "garcia.lopez.7", "cliente_7", "x".repeat(17)])
    assert.ok("error" in limpiarAviso({ ...base, cliente }, buzon), cliente);
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

test("caracteres de control: 400 (antes, el nulo daba 500 en Postgres)", () => {
  for (const texto of ["Hola\u0000mundo", "Campana\u0007", "Escape \u001b[31mrojo"])
    assert.ok("error" in limpiarAviso({ ...base, texto }, buzon), JSON.stringify(texto));
  // Un salto de línea o un tabulador sí valen (se convierten en espacios).
  assert.ok("aviso" in limpiarAviso({ ...base, texto: "3 facturas\narchivadas" }, buzon));
});

test("una cifra no puede esconder un teléfono ni un DNI", () => {
  assert.ok("error" in limpiarAviso({ ...base, cifras: { facturas: 612345678 } }, buzon));
  assert.ok("error" in limpiarAviso({ ...base, cifras: { facturas: 1_000_000 } }, buzon));
  assert.ok("aviso" in limpiarAviso({ ...base, cifras: { facturas: 999_999 } }, buzon));
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
