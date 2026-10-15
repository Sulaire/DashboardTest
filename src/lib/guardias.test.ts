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
  const permitidos = new Set(["src/lib/db.ts", "src/lib/admin.ts", "src/lib/retencion.ts", "src/lib/db.test.ts", "src/lib/guardias.test.ts"]);
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
  assert.deepEqual(rutas, ["src/app/api/auth/[...all]/route.ts", "src/app/api/avisos/route.ts", "src/app/api/salud/route.ts"]);
});

test("la demo no toca nada real", () => {
  const prohibido = /@\/lib\/(db|datos|admin|sesion|auth)"/;
  for (const a of ["src/app/demo/page.tsx", "src/lib/demo.ts"]) assert.doesNotMatch(leer(a), prohibido, a);
});

test("nada de colores sueltos: solo los tokens de globals.css", () => {
  for (const a of codigo.filter((x) => x.endsWith(".tsx"))) assert.doesNotMatch(leer(a), /#[0-9a-f]{3,8}\b|rgb\(/i, a);
});
