import { poolDueno } from "@/lib/db";

/**
 * Los avisos se borran solos a los 12 meses (y las sesiones y enlaces caducados, en cuanto caducan). Es lo acordado para el contrato
 * de encargo (docs/PROTECCION_DE_DATOS.md): no guardar más de lo necesario.
 * Usa la conexión del dueño porque borra lo de todos los clientes a la vez.
 */

export const MESES_QUE_SE_GUARDAN = 12;
const CADA = 6 * 3_600_000; // como mucho una vez cada 6 horas por proceso

const g = globalThis as typeof globalThis & { __panelUltimaLimpieza?: number };

/**
 * Borra los avisos de más de 12 meses y, de paso, las sesiones caducadas (que
 * guardan la IP y el navegador de quien entró) y los enlaces de entrar ya
 * caducados (que guardan el correo escrito en /entrar). Better Auth solo borra
 * una sesión caducada si alguien la vuelve a usar (auditoría del 25-10-2026).
 * Devuelve cuántos avisos borró.
 */
export async function borrarAvisosViejos(): Promise<number> {
  const pool = await poolDueno();
  const r = await pool.query("delete from avisos where recibido_en < now() - make_interval(months => $1)", [MESES_QUE_SE_GUARDAN]);
  await pool.query(`delete from "session" where "expiresAt" < now()`);
  await pool.query(`delete from "verification" where "expiresAt" < now()`);
  return r.rowCount ?? 0;
}

/** La llama cada aviso que llega; solo trabaja si hace rato que no se hizo. Nunca falla hacia fuera. */
export function limpiarSiToca(ahora = Date.now()): void {
  if (g.__panelUltimaLimpieza && ahora - g.__panelUltimaLimpieza < CADA) return;
  g.__panelUltimaLimpieza = ahora;
  borrarAvisosViejos().catch((e) => console.error("No se pudieron borrar los avisos viejos:", e));
}
