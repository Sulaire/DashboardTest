import assert from "node:assert/strict";
import { test } from "node:test";
import { correoEnlace } from "@/lib/correo-plantilla";

const enlace = "https://panel.ejemplo.es/api/auth/magic-link/verify?token=abc&callbackURL=%2F";

test("el correo de entrada lleva el enlace en texto y en HTML (escapado)", () => {
  const c = correoEnlace(enlace);
  assert.match(c.asunto, /enlace para entrar/);
  assert.ok(c.texto.includes(enlace));
  assert.ok(c.html.includes('href="https://panel.ejemplo.es/api/auth/magic-link/verify?token=abc&amp;callbackURL=%2F"'));
  assert.match(c.html, /<html lang="es">/);
  assert.match(c.html, /15 minutos/);
});

test("el correo no carga nada de fuera (ni imágenes ni píxeles de seguimiento)", () => {
  const { html } = correoEnlace(enlace);
  assert.doesNotMatch(html, /<img|<link|<script|url\(/i);
  const direcciones = [...html.matchAll(/https?:\/\/[^"<\s]+/g)].map((m) => m[0]);
  assert.ok(direcciones.every((d) => d.startsWith("https://panel.ejemplo.es/")), direcciones.join(" "));
});

test("un enlace con caracteres raros no rompe el HTML", () => {
  const { html } = correoEnlace('https://x.es/?a="><script>alert(1)</script>');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&quot;&gt;&lt;script&gt;/);
});
