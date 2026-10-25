import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import { test } from "node:test";
import { limpiarAviso } from "@/lib/avisos";
import { producto } from "@/lib/productos/cargar";

/**
 * El código para el nodo de n8n (integraciones/n8n/aviso_panel.js) tiene que
 * generar avisos que pasen el mismo filtro que /api/avisos. Si cambia el
 * filtro o el producto y esto deja de cuadrar, esta prueba lo dice.
 */
const n8n = createRequire(import.meta.url)(join(process.cwd(), "integraciones/n8n/aviso_panel.js"));
const buzon = producto("buzon-facturas")!;
const pasa = (aviso: Record<string, unknown>) => {
  const r = limpiarAviso(aviso, buzon);
  assert.ok("aviso" in r, `rechazado: ${"error" in r ? r.error : ""} — ${JSON.stringify(aviso)}`);
};

test("el código nunca sale de id_negocio, y sin codigo_panel no hay aviso", () => {
  assert.equal(n8n.panelCodigo({ id_negocio: "BARDEEJEMPLO" }), null);
  assert.equal(n8n.panelCodigo({ id_negocio: "BARDEEJEMPLO", codigo_panel: " 017 " }), "017");
  assert.equal(n8n.panelCodigo({ codigo_panel: "Bar Ejemplo" }), null);
  assert.equal(n8n.panelCodigo({ codigo_panel: "BARDEEJEMPLO" }), null);
  assert.equal(n8n.panelCodigo({ codigo_panel: "612-345-678" }), null);
  assert.equal(n8n.panelCodigo({ codigo_panel: "garcia.lopez.7" }), null);
});

test("pendientes: como el Resumen Semanal, sin descartes ni lo ya resuelto ni otros negocios", () => {
  const filas = [
    { id_negocio: "A", estado: "pendiente", motivo: "pdf_sin_texto_necesita_ocr" },
    { id_negocio: "A", motivo: "proveedor_desconocido" }, // sin estado = pendiente
    { id_negocio: "A", estado: "resuelto", motivo: "sin_fecha" },
    { id_negocio: "A", estado: "pendiente", motivo: "probable_firma" },
    { id_negocio: "A", estado: "pendiente", motivo: "ia_dice_que_no_es_factura" },
    { id_negocio: "B", estado: "pendiente", motivo: "sin_fecha" },
  ];
  assert.equal(n8n.panelPendientes(filas, "A"), 2);
});

test("la regla del código en n8n es la misma que la del panel", async () => {
  const { motivoCodigo } = await import("@/lib/avisos");
  for (const c of ["017", "C-023", "BAR01", "A-7", "123456", "1234567", "garcia.lopez.7", "BARDEEJEMPLO", "612-345-678", "x1", "abcde1", "", "a b 1"])
    assert.equal(n8n.panelCodigoValido(c), motivoCodigo(c) === null, c);
});

test("todos los avisos que genera pasan el filtro del panel", () => {
  for (const [a, p] of [[0, 0], [1, 0], [3, 1], [12, 4]]) pasa(n8n.panelAvisoPasada("017", a, p));
  for (const motivo of [...Object.keys(n8n.PANEL_TEXTOS), "motivo_que_aun_no_existe"])
    for (const aviso of n8n.panelAvisosRevision("017", [{ motivo }])) pasa(aviso);
  pasa(n8n.panelAvisoEnvio("017", 57));
  for (const que of ["error", "credencial", "recuperado"]) pasa(n8n.panelAvisoGeneral(que === "recuperado", que));
});

test("los descartes no se avisan, y un motivo nuevo sale con un texto genérico", () => {
  assert.deepEqual(n8n.panelAvisosRevision("017", [{ motivo: "adjunto_no_pdf" }, { motivo: "ok_cif" }]), []);
  assert.equal(n8n.panelAvisosRevision("017", [{ motivo: "algo_raro" }])[0].texto, "Una factura necesita revisión");
});

test("el aviso de la pasada trae lo que el panel necesita para el ámbar", () => {
  assert.deepEqual(n8n.panelAvisoPasada("017", 3, 1), {
    producto: "buzon-facturas",
    cliente: "017",
    ok: true,
    texto: "3 facturas archivadas; 1 por revisar",
    cifras: { facturas: 3, pendientes: 1 },
  });
});

test("la pasada se manda si archivó algo, si cambian las pendientes o cada 12 horas; se apunta solo si el panel dijo que sí", () => {
  const estado: Record<string, unknown> = {};
  const h = 3_600_000;
  const pasada = (pendientes: number) => n8n.panelAvisoPasada("017", 0, pendientes);
  assert.equal(n8n.panelDebeMandarPasada(estado, "017", 0, 0, 0), true); // la primera vez
  // El panel falló (deploy, 500): no se apunta, así que la siguiente pasada lo repite.
  assert.equal(n8n.panelApuntarEnviados(estado, [pasada(0)], [{ ok: false, error: "x" }], 0), 0);
  assert.equal(n8n.panelDebeMandarPasada(estado, "017", 0, 0, 1 * h), true);
  // Ahora sí llegó.
  assert.equal(n8n.panelApuntarEnviados(estado, [pasada(0)], [{ ok: true }], 1 * h), 1);
  assert.equal(n8n.panelDebeMandarPasada(estado, "017", 0, 0, 2 * h), false); // nada nuevo
  assert.equal(n8n.panelDebeMandarPasada(estado, "017", 2, 0, 3 * h), true); // archivó
  assert.equal(n8n.panelDebeMandarPasada(estado, "017", 0, 1, 3 * h), true); // cambian las pendientes
  assert.equal(n8n.panelDebeMandarPasada(estado, "017", 0, 0, 14 * h), true); // latido (12 h desde la última que llegó)
  assert.equal(n8n.panelDebeMandarPasada(estado, "023", 0, 0, 2 * h), true); // cada negocio, lo suyo
  assert.equal(n8n.panelDebeMandarPasada(null, "017", 0, 0, 2 * h), true); // sin estado, siempre
  // Los avisos de revisión (sin pendientes) no se apuntan, aunque lleguen.
  assert.equal(n8n.panelApuntarEnviados(estado, n8n.panelAvisosRevision("017", [{ motivo: "sin_fecha" }]), [{ ok: true }], 2 * h), 0);
});

test("contar las facturas de todas las vueltas del bucle, no solo la última", () => {
  const vueltas = [[{}], [{}], [{}]];
  assert.equal(n8n.panelContarVueltas((r: number) => vueltas[r] ?? []), 3);
  // n8n lanza un error al pedir una vuelta que no existe: también se para ahí.
  assert.equal(
    n8n.panelContarVueltas((r: number) => {
      if (r >= 2) throw new Error("no existe");
      return [{}, {}];
    }),
    4,
  );
  assert.equal(n8n.panelContarVueltas(() => []), 0);
});
