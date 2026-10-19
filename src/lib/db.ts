import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { config } from "@/lib/config";

/**
 * Las dos conexiones a Postgres (ver docs/COMO_FUNCIONA.md):
 *
 * - **dueño** (DATABASE_URL): aplica las migraciones y sirve solo al panel de
 *   administrador y a la limpieza de avisos viejos. Se salta las reglas por
 *   filas, así que solo la importan `admin.ts` y `retencion.ts` (lo vigila
 *   una prueba de guardia).
 * - **app** (usuario panel_app): todo lo demás. No puede saltarse las reglas.
 *   Para ver datos de un cliente hay que pasar por `comoCliente`.
 */

pg.types.setTypeParser(pg.types.builtins.INT8, (valor) => Number.parseInt(valor, 10));

export const ROL_APP = "panel_app";

type Global = typeof globalThis & {
  __panelDueno?: pg.Pool;
  __panelApp?: pg.Pool;
  __panelListo?: Promise<{ dueno: pg.Pool; app: pg.Pool }>;
};
const g = globalThis as Global;

export class SinBaseDeDatos extends Error {
  constructor() {
    super("No hay base de datos configurada (faltan DATABASE_URL o PANEL_DB_PASSWORD).");
  }
}

export function hayBaseDeDatos(): boolean {
  return !!config.baseDeDatos && !!config.contrasenaApp;
}

/** La misma dirección de la base de datos, pero entrando como panel_app. */
export function urlDeLaApp(urlDueno: string, contrasena: string): string {
  const url = new URL(urlDueno);
  url.username = ROL_APP;
  url.password = contrasena;
  return url.toString();
}

function preparar(): Promise<{ dueno: pg.Pool; app: pg.Pool }> {
  const urlDueno = config.baseDeDatos;
  const contrasena = config.contrasenaApp;
  if (!urlDueno || !contrasena) return Promise.reject(new SinBaseDeDatos());
  if (!g.__panelListo) {
    const dueno = (g.__panelDueno ??= new pg.Pool({ connectionString: urlDueno, max: 3, connectionTimeoutMillis: 10_000 }));
    g.__panelListo = (async () => {
      await migrar(dueno);
      await prepararRolApp(dueno, contrasena);
      await asegurarAdmin(dueno, config.correoAdmin);
      const app = (g.__panelApp ??= new pg.Pool({
        connectionString: urlDeLaApp(urlDueno, contrasena),
        max: 8,
        connectionTimeoutMillis: 10_000,
      }));
      return { dueno, app };
    })();
    // Si falla (p. ej. la base de datos aún arrancando), el siguiente intento lo repite.
    g.__panelListo.catch(() => {
      g.__panelListo = undefined;
    });
  }
  return g.__panelListo;
}

/** La conexión de la app (panel_app). Sin cliente puesto, las tablas con reglas salen vacías. */
export async function poolApp(): Promise<pg.Pool> {
  return (await preparar()).app;
}

/** La conexión del dueño. Solo para admin.ts y retencion.ts. */
export async function poolDueno(): Promise<pg.Pool> {
  return (await preparar()).dueno;
}

/**
 * Hace `trabajo` dentro de una transacción en nombre de un cliente: Postgres
 * solo deja ver y escribir sus filas. `set_config(…, true)` es lo mismo que
 * `SET LOCAL`: vale solo hasta el final de la transacción, así que una
 * conexión reutilizada nunca arrastra el cliente de la petición anterior.
 */
export async function comoCliente<T>(clienteId: string, trabajo: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const conexion = await (await poolApp()).connect();
  try {
    await conexion.query("begin");
    await conexion.query("select set_config('app.cliente_id', $1, true)", [clienteId]);
    const resultado = await trabajo(conexion);
    await conexion.query("commit");
    return resultado;
  } catch (e) {
    await conexion.query("rollback").catch(() => {});
    throw e;
  } finally {
    conexion.release();
  }
}

/** Consulta sin cliente, como panel_app (solo ve lo que no tiene reglas: miembros, huellas de llaves). */
export async function consultaApp<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await (await poolApp()).query<T>(sql, params)).rows;
}

/** Aplica, en orden, los .sql de migraciones/ que aún no se hayan aplicado. */
export async function migrar(pool: pg.Pool, carpeta = join(process.cwd(), "migraciones")): Promise<string[]> {
  const cliente = await pool.connect();
  const aplicadas: string[] = [];
  try {
    // Un candado para que dos procesos arrancando a la vez no migren dos veces.
    await cliente.query("select pg_advisory_lock(727275)");
    await cliente.query(
      "create table if not exists migraciones (nombre text primary key, aplicada_en timestamptz not null default now())",
    );
    const hechas = new Set((await cliente.query<{ nombre: string }>("select nombre from migraciones")).rows.map((r) => r.nombre));
    const archivos = readdirSync(/*turbopackIgnore: true*/ carpeta).filter((a) => a.endsWith(".sql")).sort();
    for (const archivo of archivos) {
      if (hechas.has(archivo)) continue;
      await cliente.query("begin");
      try {
        await cliente.query(readFileSync(join(/*turbopackIgnore: true*/ carpeta, archivo), "utf8"));
        await cliente.query("insert into migraciones (nombre) values ($1)", [archivo]);
        await cliente.query("commit");
        aplicadas.push(archivo);
      } catch (e) {
        await cliente.query("rollback");
        throw new Error(`La migración ${archivo} falló: ${(e as Error).message}`);
      }
    }
  } finally {
    await cliente.query("select pg_advisory_unlock(727275)").catch(() => {});
    cliente.release();
  }
  return aplicadas;
}

/**
 * La contraseña de panel_app como la guarda Postgres (SCRAM-SHA-256), hecha
 * aquí: así a Postgres le llega ya cifrada y no puede quedar escrita tal cual
 * en su registro de órdenes (auditoría del 19-10-2026). Es el mismo cálculo
 * que hace Postgres (RFC 7677); solo se usan contraseñas de caracteres ASCII
 * visibles, para que no haga falta el paso de normalización (SASLprep).
 */
export function verificadorScram(contrasena: string, sal = randomBytes(16), iteraciones = 4096): string {
  const salada = pbkdf2Sync(contrasena, sal, iteraciones, 32, "sha256");
  const claveCliente = createHmac("sha256", salada).update("Client Key").digest();
  const guardada = createHash("sha256").update(claveCliente).digest();
  const servidor = createHmac("sha256", salada).update("Server Key").digest();
  return `SCRAM-SHA-256$${iteraciones}:${sal.toString("base64")}$${guardada.toString("base64")}:${servidor.toString("base64")}`;
}

export const CONTRASENA_VALIDA = /^[\x21-\x7e]{24,}$/;

/**
 * Deja a panel_app listo para entrar con PANEL_DB_PASSWORD, y nada más:
 * sin poder saltarse las reglas por filas, sin superpoderes.
 */
export async function prepararRolApp(pool: pg.Pool, contrasena: string): Promise<void> {
  if (!CONTRASENA_VALIDA.test(contrasena))
    throw new Error("PANEL_DB_PASSWORD tiene que tener al menos 24 caracteres, sin espacios ni letras con tilde.");
  const cliente = await pool.connect();
  try {
    // ALTER ROLE no acepta parámetros ($1): el verificador va escapado por pg.
    await cliente.query(
      `alter role ${ROL_APP} with login nosuperuser nobypassrls password ${cliente.escapeLiteral(verificadorScram(contrasena))}`,
    );
  } finally {
    cliente.release();
  }
}

/** Crea la cuenta del administrador si aún no existe (sin ella no podría entrar: no hay registro abierto). */
export async function asegurarAdmin(pool: pg.Pool, correo: string | undefined): Promise<void> {
  if (!correo) return;
  await pool.query(
    `insert into "user" (id, name, email, "emailVerified") values (gen_random_uuid()::text, $1, $1, false)
     on conflict (email) do nothing`,
    [correo],
  );
}

/** Solo para las pruebas: cierra las conexiones y olvida el estado. */
export async function cerrarDb(): Promise<void> {
  const listo = g.__panelListo;
  g.__panelListo = undefined;
  await listo?.catch(() => {});
  await g.__panelApp?.end();
  await g.__panelDueno?.end();
  g.__panelApp = undefined;
  g.__panelDueno = undefined;
}
