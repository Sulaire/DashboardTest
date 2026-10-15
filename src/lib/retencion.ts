import { poolDueno } from "@/lib/db";

/**
 * Los avisos se borran solos a los 12 meses. Es lo acordado para el contrato
 * de encargo (docs/PROTECCION_DE_DATOS.md): no guardar más de lo necesario.
 * Usa la conexión del dueño porque borra lo de todos los clientes a la vez.
 */

export const MESES_QUE_SE_GUARDAN = 12;
const CADA = 6 * 3_600_000; // como mucho una vez cada 6 horas por proceso

const g = globalThis as typeof globalThis & { __panelUltimaLimpieza?: number };

export async function borrarAvisosViejos(): Promise<number> {
  const pool = await poolDueno();
  const r = await pool.query("delete from avisos where recibido_en < now() - make_interval(months => $1)", [MESES_QUE_SE_GUARDAN]);
  return r.rowCount ?? 0;
}

/** La llama cada aviso que llega; solo trabaja si hace rato que no se hizo. Nunca falla hacia fuera. */
export function limpiarSiToca(ahora = Date.now()): void {
  if (g.__panelUltimaLimpieza && ahora - g.__panelUltimaLimpieza < CADA) return;
  g.__panelUltimaLimpieza = ahora;
  borrarAvisosViejos().catch((e) => console.error("No se pudieron borrar los avisos viejos:", e));
}
