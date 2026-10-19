import assert from "node:assert/strict";
import { createHash, createHmac, pbkdf2Sync } from "node:crypto";
import { test } from "node:test";
import { CONTRASENA_VALIDA, urlDeLaApp, verificadorScram } from "@/lib/db";

test("el verificador SCRAM tiene la forma que espera Postgres y es el cálculo del RFC 7677", () => {
  const sal = Buffer.from("0123456789abcdef");
  const v = verificadorScram("contrasena-de-prueba-larga-0123456789", sal, 4096);
  const m = /^SCRAM-SHA-256\$4096:([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+):([A-Za-z0-9+/=]+)$/.exec(v);
  assert.ok(m, v);
  assert.equal(Buffer.from(m[1], "base64").toString(), "0123456789abcdef");
  const salada = pbkdf2Sync("contrasena-de-prueba-larga-0123456789", sal, 4096, 32, "sha256");
  const guardada = createHash("sha256").update(createHmac("sha256", salada).update("Client Key").digest()).digest();
  assert.equal(m[2], guardada.toString("base64"));
  // Con sal al azar, dos verificadores de la misma contraseña son distintos.
  assert.notEqual(verificadorScram("x".repeat(30)), verificadorScram("x".repeat(30)));
});

test("la contraseña de panel_app: 24 caracteres ASCII visibles como mínimo", () => {
  assert.ok(CONTRASENA_VALIDA.test("a".repeat(24)));
  assert.ok(!CONTRASENA_VALIDA.test("a".repeat(23)));
  assert.ok(!CONTRASENA_VALIDA.test("contraseña-larga-con-tilde-0123"));
  assert.ok(!CONTRASENA_VALIDA.test("con espacios dentro 0123456789"));
});

test("la dirección de la app cambia solo el usuario y la contraseña", () => {
  const u = new URL(urlDeLaApp("postgres://postgres:secreto@db.railway.internal:5432/railway?sslmode=require", "otra:/@clave"));
  assert.equal(u.username, "panel_app");
  assert.equal(decodeURIComponent(u.password), "otra:/@clave");
  assert.equal(u.host, "db.railway.internal:5432");
  assert.equal(u.pathname, "/railway");
  assert.equal(u.search, "?sslmode=require");
});
