import assert from "node:assert/strict";
import { test } from "node:test";
import { ipDe, leerCuerpo } from "@/lib/api";

const peticion = (cuerpo: string, tipo = "application/json") =>
  new Request("http://x/api/avisos", { method: "POST", headers: { "Content-Type": tipo }, body: cuerpo });

test("leerCuerpo: solo objetos JSON, con su tipo", async () => {
  assert.deepEqual(await leerCuerpo(peticion('{"a":1}')), { cuerpo: { a: 1 } });
  assert.equal(("estado" in (await leerCuerpo(peticion("[1]"))) && 400), 400);
  assert.equal(("estado" in (await leerCuerpo(peticion("{roto"))) && 400), 400);
  assert.equal(("estado" in (await leerCuerpo(peticion('{"a":1}', "text/plain"))) && 400), 400);
});

test("leerCuerpo: un cuerpo demasiado grande da 413 sin leerlo entero", async () => {
  const r = await leerCuerpo(peticion(JSON.stringify({ texto: "x".repeat(10_000) })), 8_192);
  assert.ok("estado" in r && r.estado === 413);
  // También cuando no dice su tamaño (llega a trozos).
  const trozos = new ReadableStream({
    start(c) {
      for (let i = 0; i < 20; i++) c.enqueue(new TextEncoder().encode("x".repeat(1_000)));
      c.close();
    },
  });
  const sinTamano = new Request("http://x", { method: "POST", headers: { "Content-Type": "application/json" }, body: trozos, duplex: "half" } as RequestInit);
  const r2 = await leerCuerpo(sinTamano, 8_192);
  assert.ok("estado" in r2 && r2.estado === 413);
});

test("ipDe: X-Real-IP, o el último salto de X-Forwarded-For (nunca el primero)", () => {
  const con = (h: Record<string, string>) => new Request("http://x", { headers: h });
  assert.equal(ipDe(con({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "9.9.9.9" })), "1.1.1.1");
  assert.equal(ipDe(con({ "x-forwarded-for": "6.6.6.6, 2.2.2.2" })), "2.2.2.2");
  assert.equal(ipDe(con({})), "sin-ip");
});
