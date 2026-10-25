import assert from "node:assert/strict";
import { test } from "node:test";
import { enlaceDeConfirmacion, parametrosValidos } from "@/lib/enlace";

test("el enlace del correo lleva a la página de confirmar, con sus parámetros", () => {
  const url = enlaceDeConfirmacion(
    "https://panel.ejemplo.es/api/auth/magic-link/verify?token=abcDEF123_-xyz&callbackURL=%2F&errorCallbackURL=%2Fentrar%3Ferror%3D1&otro=x",
    "https://panel.ejemplo.es",
  );
  const u = new URL(url);
  assert.equal(u.pathname, "/entrar/confirmar");
  assert.equal(u.searchParams.get("token"), "abcDEF123_-xyz");
  assert.equal(u.searchParams.get("callbackURL"), "/");
  assert.equal(u.searchParams.get("errorCallbackURL"), "/entrar?error=1");
  assert.equal(u.searchParams.get("otro"), null);
});

test("la página solo acepta un token con forma de token y vueltas dentro del panel", () => {
  assert.equal(parametrosValidos({ token: "corto" }), null);
  assert.equal(parametrosValidos({ token: "<script>alert(1)</script>" }), null);
  assert.deepEqual(parametrosValidos({ token: "abcDEF123_-xyz", callbackURL: "/", errorCallbackURL: "//malo.com" }), {
    token: "abcDEF123_-xyz",
    callbackURL: "/",
  });
  assert.deepEqual(parametrosValidos({ token: "abcDEF123_-xyz", callbackURL: "https://malo.com" }), { token: "abcDEF123_-xyz" });
  assert.deepEqual(parametrosValidos({ token: "abcDEF123_-xyz", callbackURL: "/\\\\malo.com" }), { token: "abcDEF123_-xyz" });
});
