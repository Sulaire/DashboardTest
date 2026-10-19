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
  assert.ok("error" in limpiarAviso({ ...base, cliente: "Bar Picasso S.L." }, buzon));
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
  ])
    assert.ok("error" in limpiarAviso({ ...base, texto }, buzon), texto);
  assert.ok("error" in limpiarAviso({ ...base, texto: "Total 120,50" }, buzon));
  assert.ok("error" in limpiarAviso({ ...base, texto: "x".repeat(161) }, buzon));
  assert.ok("error" in limpiarAviso({ ...base, texto: "   " }, buzon));
});

test("las fechas y horas no se confunden con teléfonos", () => {
  for (const texto of ["Envío del 2026-10-03 09:00 hecho", "Pasada del 03/10/2026 a las 09:00:15", "Última factura el 3.10.26"])
    assert.ok("aviso" in limpiarAviso({ ...base, texto }, buzon), texto);
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
