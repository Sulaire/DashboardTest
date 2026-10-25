import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { limpiarAviso } from "@/lib/avisos";
import { semaforo, valorDe, type Aviso } from "@/lib/calculos";
import { producto } from "@/lib/productos/cargar";

/**
 * El segundo producto, «Tu web» (vigía de web): su aviso pasa el filtro del
 * panel, el flujo de n8n lleva exactamente el código probado y no lleva
 * secretos. Si alguien cambia aviso_vigia.js sin regenerar el flujo, falla.
 */
const raiz = process.cwd();
const vigia = createRequire(import.meta.url)(join(raiz, "integraciones/vigia-web/aviso_vigia.js"));
const web = producto("vigia-web")!;

test("el producto «Tu web» está bien descrito", () => {
  assert.ok(web, "productos/vigia-web.json no carga");
  assert.deepEqual(Object.keys(web.cifras).sort(), ["caidas", "comprobaciones", "ms"]);
});

test("el resultado de pedir la web: bien, error HTTP, red caída", () => {
  assert.deepEqual(vigia.vigiaResultado({ statusCode: 200 }, 1000, 1245), { ok: true, estado: 200, ms: 245 });
  assert.deepEqual(vigia.vigiaResultado({ statusCode: 301 }, 0, 10), { ok: true, estado: 301, ms: 10 });
  assert.deepEqual(vigia.vigiaResultado({ statusCode: 503 }, 0, 10), { ok: false, estado: 503, ms: 10 });
  assert.deepEqual(vigia.vigiaResultado({ error: { message: "ETIMEDOUT" } }, 0, 10), { ok: false, estado: 0, ms: null });
});

test("todos sus avisos pasan el filtro del panel", () => {
  for (const r of [
    { ok: true, estado: 200, ms: 245 },
    { ok: true, estado: 200, ms: null },
    { ok: true, estado: 200, ms: 9_999_999 },
    { ok: false, estado: 503, ms: 12 },
    { ok: false, estado: 0, ms: null },
  ]) {
    const aviso = vigia.vigiaAviso(r);
    const limpio = limpiarAviso(aviso, web);
    assert.ok("aviso" in limpio, `rechazado: ${"error" in limpio ? limpio.error : ""} — ${JSON.stringify(aviso)}`);
  }
});

test("con sus avisos, el panel enseña lo que debe", () => {
  const ahora = new Date("2026-10-15T10:00:00Z");
  const a = (horas: number, r: { ok: boolean; estado: number; ms: number | null }): Aviso => {
    const v = vigia.vigiaAviso(r);
    return { codigo: null, ok: v.ok, texto: v.texto, cifras: v.cifras, recibido_en: new Date(ahora.getTime() - horas * 3_600_000) };
  };
  const bien = [a(1, { ok: true, estado: 200, ms: 300 }), a(0.5, { ok: true, estado: 200, ms: 210 })];
  assert.equal(semaforo(bien, web.silencio_horas, ahora), "verde");
  const caida = [...bien, a(0.25, { ok: false, estado: 0, ms: null })];
  assert.equal(semaforo(caida, web.silencio_horas, ahora), "ambar");
  // Vuelve a responder: se apaga sola.
  assert.equal(semaforo([...caida, a(0.1, { ok: true, estado: 200, ms: 250 })], web.silencio_horas, ahora), "verde");
  // Tres horas sin noticias del vigía: rojo.
  assert.equal(semaforo([a(3, { ok: true, estado: 200, ms: 200 })], web.silencio_horas, ahora), "rojo");
  const cifras = web.bloques.find((b) => b.tipo === "cifras");
  assert.ok(cifras && cifras.tipo === "cifras");
  const porEtiqueta = Object.fromEntries(cifras.elementos.map((el) => [el.etiqueta, valorDe(el, caida, ahora)]));
  assert.equal(porEtiqueta["Comprobaciones este mes"], "3");
  assert.equal(porEtiqueta["Caídas este mes"], "1");
  assert.equal(porEtiqueta["Respuesta ahora (ms)"], "210");
});

test("el flujo de n8n está al día con el código probado y no lleva secretos", async () => {
  const { texto, flujo } = await import(pathToFileURL(join(raiz, "integraciones/vigia-web/construir.mjs")).href);
  const archivo = readFileSync(join(raiz, "integraciones/vigia-web/vigia_web.n8n.json"), "utf8");
  assert.equal(archivo, texto(), "vigia_web.n8n.json está viejo: ejecuta node integraciones/vigia-web/construir.mjs");
  const f = flujo();
  const codigo = f.nodes.find((n: { name: string }) => n.name === "Preparar Aviso").parameters.jsCode as string;
  assert.ok(codigo.startsWith(readFileSync(join(raiz, "integraciones/vigia-web/aviso_vigia.js"), "utf8")));
  assert.doesNotMatch(archivo, /Bearer|dcp_[A-Za-z0-9_-]{10,}/, "la llave va en una credencial de n8n, nunca en el flujo");
  const panel = f.nodes.find((n: { name: string }) => n.name === "Mandar al Panel");
  assert.equal(panel.parameters.genericAuthType, "httpHeaderAuth");
  assert.equal(panel.onError, "continueRegularOutput");
});
