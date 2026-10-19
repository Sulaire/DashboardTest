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
  assert.equal(n8n.panelCodigo({ id_negocio: "BARPICASSO" }), null);
  assert.equal(n8n.panelCodigo({ id_negocio: "BARPICASSO", codigo_panel: " 017 " }), "017");
  assert.equal(n8n.panelCodigo({ codigo_panel: "Bar Picasso" }), null);
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
