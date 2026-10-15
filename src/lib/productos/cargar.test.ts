import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { bloquesElegidos, cargarProductos, validarProducto } from "@/lib/productos/cargar";

test("todas las descripciones de productos/ son válidas", () => {
  const { productos, errores } = cargarProductos();
  assert.deepEqual(errores, []);
  assert.ok(productos.has("buzon-facturas"));
});

test("una descripción con errores se explica", () => {
  const r = validarProducto({
    id: "x",
    nombre: "X",
    descripcion: "d",
    codigos: "c",
    silencio_horas: 1,
    cifras: { a: "A" },
    bloques: [
      { id: "c", tipo: "cifras", titulo: "t", elementos: [{ etiqueta: "e", calculo: "suma_mes", cifra: "b" }] },
      { id: "c", tipo: "grafica", titulo: "t" },
    ],
  });
  assert.ok("errores" in r);
  assert.match(r.errores.join(" "), /'b' no está en 'cifras'/);
  assert.match(r.errores.join(" "), /id repetido/);
});

test("un archivo roto no tumba el resto", () => {
  const carpeta = mkdtempSync(join(tmpdir(), "productos-"));
  writeFileSync(join(carpeta, "roto.json"), "{");
  const { productos, errores } = cargarProductos(carpeta);
  assert.equal(productos.size, 0);
  assert.equal(errores[0].archivo, "roto.json");
});

test("a la carta: los bloques elegidos, en el orden del producto", () => {
  const p = cargarProductos().productos.get("buzon-facturas")!;
  assert.equal(bloquesElegidos(p, null).length, p.bloques.length);
  assert.deepEqual(bloquesElegidos(p, ["avisos", "estado"]).map((b) => b.id), ["estado", "avisos"]);
});
