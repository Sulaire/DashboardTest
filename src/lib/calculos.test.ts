import assert from "node:assert/strict";
import { test } from "node:test";
import { filas, mesDe, problemas, semaforo, valorDe, type Aviso } from "@/lib/calculos";
import { avisosDeDemo } from "@/lib/demo";

const ahora = new Date("2026-10-15T10:00:00Z");
const hace = (horas: number) => new Date(ahora.getTime() - horas * 3_600_000);
const aviso = (codigo: string | null, ok: boolean, horas: number, cifras: Record<string, number> = {}): Aviso => ({
  codigo,
  ok,
  texto: ok ? "bien" : "mal",
  cifras,
  recibido_en: hace(horas),
});

test("semáforo: gris sin nada, rojo si se calla, ámbar con un problema abierto, verde si no", () => {
  assert.equal(semaforo([], 48, ahora), "gris");
  assert.equal(semaforo([aviso("1", true, 49)], 48, ahora), "rojo");
  assert.equal(semaforo([aviso("1", true, 5), aviso("2", false, 2)], 48, ahora), "ambar");
  // El siguiente ok del mismo código cierra el problema.
  assert.equal(semaforo([aviso("2", false, 5), aviso("2", true, 2)], 48, ahora), "verde");
});

test("cifras: suma del mes en hora de Madrid, última fecha y códigos activos", () => {
  const avisos = [
    aviso("1", true, 1, { facturas: 3 }),
    aviso("2", true, 2, { facturas: 4 }),
    // 30 de septiembre a las 23:30 en Madrid: es de septiembre, no cuenta.
    { ...aviso("1", true, 0, { facturas: 100 }), recibido_en: new Date("2026-09-30T21:30:00Z") },
    aviso(null, true, 24 * 12, { enviadas: 50 }),
    aviso("9", true, 24 * 35, { facturas: 1 }),
  ];
  assert.equal(mesDe(new Date("2026-09-30T22:30:00Z")), "2026-10");
  assert.equal(valorDe({ etiqueta: "", calculo: "suma_mes", cifra: "facturas" }, avisos, ahora), "7");
  assert.equal(valorDe({ etiqueta: "", calculo: "ultima_fecha", cifra: "enviadas" }, avisos, ahora), "3 oct");
  assert.equal(valorDe({ etiqueta: "", calculo: "ultima_fecha", cifra: "nada" }, avisos, ahora), "—");
  assert.equal(valorDe({ etiqueta: "", calculo: "codigos_activos", dias: 30 }, avisos, ahora), "2");
});

test("lista: un renglón por código, los problemas primero y los quietos al final, sin los avisos sin código", () => {
  const r = filas(
    [aviso("10", true, 1, { facturas: 2 }), aviso("2", false, 1), aviso("2", true, 5, { facturas: 1 }), aviso("1", true, 24 * 31), aviso(null, true, 1)],
    "facturas",
    ahora,
  );
  assert.deepEqual(
    r.map((f) => [f.codigo, f.estado, f.delMes]),
    [
      ["2", "revisar", 1],
      ["10", "bien", 2],
      ["1", "quieto", 0],
    ],
  );
});

test("avisos: solo los problemas, del más nuevo al más viejo, hasta el máximo", () => {
  const r = problemas([aviso("1", false, 5), aviso("2", true, 1), aviso("3", false, 1), aviso("4", false, 9)], 2);
  assert.deepEqual(r.map((a) => a.codigo), ["3", "1"]);
});

test("la demo tiene de todo: un problema abierto, un cliente callado y el envío mensual", () => {
  const avisos = avisosDeDemo(ahora);
  assert.equal(semaforo(avisos, 48, ahora), "ambar");
  assert.equal(valorDe({ etiqueta: "", calculo: "codigos_activos", dias: 30 }, avisos, ahora), "11");
  assert.notEqual(valorDe({ etiqueta: "", calculo: "ultima_fecha", cifra: "enviadas" }, avisos, ahora), "—");
});
