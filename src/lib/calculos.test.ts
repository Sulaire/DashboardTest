import assert from "node:assert/strict";
import { test } from "node:test";
import { fechaDeLunes, filas, mesDe, porSemana, problemas, semaforo, valorDe, type Aviso } from "@/lib/calculos";
import { avisosDeDemo, avisosVigiaDemo } from "@/lib/demo";

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

test("semáforo con «abiertos»: un ok no apaga el ámbar mientras quede algo pendiente", () => {
  const malo = aviso("5", false, 3);
  const quedaUna = aviso("5", true, 2, { facturas: 2, pendientes: 1 });
  assert.equal(semaforo([malo, quedaUna], 48, ahora), "verde"); // sin abiertos: el ok lo cierra
  assert.equal(semaforo([malo, quedaUna], 48, ahora, "pendientes"), "ambar");
  // Un aviso posterior sin la cifra no la olvida: vale el último que la trajo.
  assert.equal(semaforo([malo, quedaUna, aviso("5", true, 1, { facturas: 1 })], 48, ahora, "pendientes"), "ambar");
  assert.equal(semaforo([malo, quedaUna, aviso("5", true, 1, { pendientes: 0 })], 48, ahora, "pendientes"), "verde");
  // Un ok: false sigue abriendo aunque la cola esté a 0 (p. ej. un error del flujo).
  assert.equal(semaforo([aviso("5", true, 2, { pendientes: 0 }), aviso(null, false, 1)], 48, ahora, "pendientes"), "ambar");
});

test("un problema sin código lo cierra cualquier aviso bueno posterior", () => {
  const error = aviso(null, false, 3);
  assert.equal(semaforo([aviso("1", true, 5), error], 48, ahora), "ambar");
  assert.equal(semaforo([error, aviso("1", true, 1)], 48, ahora), "verde");
  assert.equal(semaforo([error, aviso(null, true, 1)], 48, ahora), "verde");
  // Uno malo con código no cierra el general.
  assert.equal(semaforo([error, aviso("1", false, 1)], 48, ahora), "ambar");
});

test("historial: callado hace meses es rojo, no gris; y los códigos viejos siguen en la lista", () => {
  const historial = { ultimo: new Date("2026-06-01T10:00:00Z"), codigos: new Map([["9", new Date("2026-06-01T10:00:00Z")]]) };
  assert.equal(semaforo([], 48, ahora, undefined, historial), "rojo");
  assert.equal(semaforo([], 48, ahora, undefined, { ultimo: null, codigos: new Map() }), "gris");
  const r = filas([aviso("1", true, 1, { facturas: 2 })], "facturas", ahora, undefined, historial);
  assert.deepEqual(
    r.map((f) => [f.codigo, f.estado]),
    [
      ["1", "bien"],
      ["9", "quieto"],
    ],
  );
});

test("cifras «actual»: el último valor de cada código, sumado", () => {
  const avisos = [aviso("1", true, 5, { pendientes: 4 }), aviso("1", true, 1, { pendientes: 1 }), aviso("2", true, 2, { pendientes: 2 }), aviso("3", true, 1)];
  assert.equal(valorDe({ etiqueta: "", calculo: "actual", cifra: "pendientes" }, avisos, ahora), "3");
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

test("lista con «abiertos»: Revisar con cuántas le quedan", () => {
  const r = filas([aviso("1", true, 1, { facturas: 2, pendientes: 2 }), aviso("2", true, 1, { pendientes: 0 })], "facturas", ahora, "pendientes");
  assert.deepEqual(
    r.map((f) => [f.codigo, f.estado, f.pendientes]),
    [
      ["1", "revisar", 2],
      ["2", "bien", 0],
    ],
  );
});

test("por semana: de lunes a domingo en hora de Madrid, la de ahora a medias", () => {
  // ahora = jueves 15-10-2026 12:00 en Madrid; su lunes es el 12.
  const semanas = porSemana(
    [
      { ...aviso("1", true, 0, { facturas: 3 }), recibido_en: new Date("2026-10-12T00:30:00+02:00") }, // lunes 12, recién empezado
      { ...aviso("1", true, 0, { facturas: 2 }), recibido_en: new Date("2026-10-11T23:30:00+02:00") }, // domingo 11: semana anterior
      { ...aviso("2", true, 0, { facturas: 5 }), recibido_en: new Date("2026-09-28T10:00:00+02:00") },
      { ...aviso("2", true, 0, { otra: 9 }), recibido_en: new Date("2026-10-13T10:00:00+02:00") },
    ],
    "facturas",
    3,
    ahora,
  );
  assert.deepEqual(
    semanas.map((x) => [fechaDeLunes(x.lunes), x.total, x.enCurso]),
    [
      ["28 sept", 5, false],
      ["5 oct", 2, false],
      ["12 oct", 3, true],
    ],
  );
});

test("avisos: solo los problemas, del más nuevo al más viejo, hasta el máximo", () => {
  const r = problemas([aviso("1", false, 5), aviso("2", true, 1), aviso("3", false, 1), aviso("4", false, 9)], 2);
  assert.deepEqual(r.map((a) => a.codigo), ["3", "1"]);
});

test("la demo tiene de todo: un problema abierto, un cliente callado y el envío mensual", () => {
  const avisos = avisosDeDemo(ahora);
  assert.equal(semaforo(avisos, 48, ahora, "pendientes"), "ambar");
  assert.equal(valorDe({ etiqueta: "", calculo: "actual", cifra: "pendientes" }, avisos, ahora), "1");
  assert.equal(valorDe({ etiqueta: "", calculo: "codigos_activos", dias: 30 }, avisos, ahora), "11");
  assert.notEqual(valorDe({ etiqueta: "", calculo: "ultima_fecha", cifra: "enviadas" }, avisos, ahora), "—");
});

test("la demo de «Tu web»: en línea ahora, con sus dos caídas en el historial", () => {
  const avisos = avisosVigiaDemo(ahora);
  assert.equal(semaforo(avisos, 2, ahora), "verde");
  assert.equal(avisos.filter((a) => !a.ok).length, 3);
});
