import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

/**
 * Pruebas de guardia: vigilan las reglas de CLAUDE.md leyendo el código. Si
 * una falla, no la apagues: cumple la regla (o, si la regla cambia, cámbiala
 * en CLAUDE.md y aquí a la vez).
 */

const raiz = process.cwd();
function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((n) => {
    const ruta = join(carpeta, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [relative(raiz, ruta)];
  });
}
const codigo = archivos(join(raiz, "src")).filter((a) => /\.tsx?$/.test(a));
const leer = (a: string) => readFileSync(join(raiz, a), "utf8");
const migraciones = readdirSync(join(raiz, "migraciones"))
  .filter((a) => a.endsWith(".sql"))
  .map((a) => readFileSync(join(raiz, "migraciones", a), "utf8"))
  .join("\n");

test("toda tabla con datos de un cliente tiene seguridad por filas", () => {
  // Estas dos se leen antes de saber el cliente y solo guardan ids y huellas.
  const sinReglas = new Set(["miembros", "llaves_producto"]);
  const tablas = [...migraciones.matchAll(/create table (\w+) \(([\s\S]*?)\n\);/g)];
  const deCliente = tablas.filter(([, nombre, cuerpo]) => nombre === "clientes" || /\bcliente_id\b/.test(cuerpo)).map(([, n]) => n);
  assert.ok(deCliente.includes("avisos"));
  for (const t of deCliente) {
    if (sinReglas.has(t)) continue;
    assert.match(migraciones, new RegExp(`alter table ${t} enable row level security`), `${t} sin seguridad por filas`);
    assert.match(migraciones, new RegExp(`create policy \\w+ on ${t}\\b`), `${t} sin regla`);
  }
});

test("el cliente se pone solo con SET LOCAL (set_config(…, true))", () => {
  for (const a of codigo) {
    const t = leer(a);
    assert.doesNotMatch(t, /set\s+app\.cliente_id/i, `${a}: usa set_config(…, true), no SET`);
    for (const m of t.matchAll(/set_config\('app\.cliente_id',[^)]*\)/g)) assert.match(m[0], /,\s*true\)$/, `${a}: ${m[0]}`);
  }
});

test("la conexión del dueño (se salta las reglas) solo la usan admin y la limpieza", () => {
  const permitidos = new Set(["src/lib/db.ts", "src/lib/admin.ts", "src/lib/retencion.ts", "src/lib/resumen-datos.ts", "src/lib/db.test.ts", "src/lib/guardias.test.ts"]);
  for (const a of codigo) if (/poolDueno/.test(leer(a))) assert.ok(permitidos.has(a), `${a} usa poolDueno`);
});

test("lib/admin solo se importa desde el panel de administrador", () => {
  for (const a of codigo) {
    if (!/from "@\/lib\/admin"/.test(leer(a))) continue;
    assert.ok(a.startsWith("src/app/admin/") || a.endsWith(".test.ts"), `${a} importa lib/admin`);
  }
});

test("cada acción del administrador comprueba que eres el administrador", () => {
  const t = leer("src/app/admin/acciones.ts");
  const acciones = [...t.matchAll(/export async function (\w+)[^{]*\{\n([^\n]*)/g)];
  assert.ok(acciones.length > 0);
  for (const [, nombre, primera] of acciones) assert.match(primera, /await exigirAdmin\(\)/, `${nombre} no empieza con exigirAdmin()`);
});

test("las rutas de la API son las conocidas (una nueva se revisa y se añade aquí)", () => {
  const rutas = codigo.filter((a) => a.startsWith("src/app/api/") && a.endsWith("route.ts")).sort();
  assert.deepEqual(rutas, [
    "src/app/api/auth/[...all]/route.ts",
    "src/app/api/avisos/route.ts",
    "src/app/api/cosmerito/v1/resumen/route.ts",
    "src/app/api/salud/route.ts",
  ]);
});

test("la puerta de Cosmerito solo abre con su llave y solo da el resumen", () => {
  const ruta = leer("src/app/api/cosmerito/v1/resumen/route.ts");
  assert.match(ruta, /igualesSecretos\(llave, esperada\)/);
  assert.doesNotMatch(ruta, /quienSoy|@\/lib\/sesion|@\/lib\/admin|@\/lib\/datos/);
  // Lo que se manda sale solo de resumen.ts, que no toca ni códigos ni textos.
  const resumen = leer("src/lib/resumen.ts");
  assert.doesNotMatch(resumen, /\.codigo\b|\.texto\b/);
});

test("la demo no toca nada real", () => {
  const prohibido = /@\/lib\/(db|datos|admin|sesion|auth)"/;
  for (const a of ["src/app/demo/page.tsx", "src/lib/demo.ts"]) assert.doesNotMatch(leer(a), prohibido, a);
});

test("nada de colores sueltos: solo los tokens de globals.css", () => {
  for (const a of codigo.filter((x) => x.endsWith(".tsx"))) assert.doesNotMatch(leer(a), /#[0-9a-f]{3,8}\b|rgb\(/i, a);
});

test("los colores se leen: contraste mínimo en los dos temas", () => {
  // Texto: 4,5:1 (WCAG AA). Bordes de casillas y botones, y columnas de la gráfica: 3:1.
  const css = leer("src/app/globals.css");
  const tokens = (bloque: string) => Object.fromEntries([...bloque.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));
  const claro: Record<string, string> = tokens(css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "");
  const oscuro: Record<string, string> = { ...claro, ...tokens(css.match(/prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}/)?.[1] ?? "") };
  const luz = (hex: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contraste = (a: string, b: string) => {
    const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const cruzar = (colores: string[], fondos: string[]) => colores.flatMap((c) => fondos.map((f): [string, string] => [c, f]));
  const texto: [string, string][] = [
    ...cruzar(["texto", "texto-suave", "acento"], ["fondo", "superficie", "superficie-2"]),
    ...cruzar(["verde", "ambar", "rojo"], ["superficie", "superficie-2"]),
    ...["verde", "ambar", "rojo", "gris"].flatMap((c): [string, string][] => [
      [c, `${c}-fondo`],
      ["texto-suave", `${c}-fondo`],
    ]),
    ["sobre-acento", "acento"],
    ["sobre-acento", "rojo"],
  ];
  const piezas: [string, string][] = [...cruzar(["borde-campo"], ["fondo", "superficie", "superficie-2"]), ["grafica", "superficie"]];
  for (const [tema, t] of [
    ["claro", claro],
    ["oscuro", oscuro],
  ] as const) {
    assert.ok(Object.keys(t).length > 10, `no se han leído los colores del tema ${tema}`);
    for (const [minimo, pares] of [
      [4.5, texto],
      [3, piezas],
    ] as const)
      for (const [a, b] of pares) {
        assert.ok(t[a] && t[b], `${tema}: falta --${a} o --${b}`);
        const r = contraste(t[a], t[b]);
        assert.ok(r >= minimo, `${tema}: --${a} sobre --${b} da ${r.toFixed(2)}:1 (mínimo ${minimo}:1)`);
      }
  }
});
