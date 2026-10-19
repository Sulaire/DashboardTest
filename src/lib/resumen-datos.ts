import { avisosDe, historialDe } from "@/lib/datos";
import { poolDueno } from "@/lib/db";
import { producto } from "@/lib/productos/cargar";
import { resumenProducto, type ResumenProducto } from "@/lib/resumen";

/**
 * Lee el resumen de todos los clientes para Cosmerito. La lista de clientes y
 * de lo contratado sale de la conexión del dueño (es lo único que ve a todos),
 * pero los avisos de cada uno se leen como ese cliente (comoCliente), igual
 * que su propio panel.
 */

export type ResumenCliente = { id: string; nombre: string; productos: ResumenProducto[] };

export async function resumenDeTodos(ahora = new Date()): Promise<ResumenCliente[]> {
  const pool = await poolDueno();
  const filas = (
    await pool.query<{ cliente_id: string; nombre: string; contratacion_id: string | null; producto: string | null }>(
      `select c.id as cliente_id, c.nombre, x.id as contratacion_id, x.producto
       from clientes c left join contrataciones x on x.cliente_id = c.id and x.activa
       order by c.creado_en, x.creado_en`,
    )
  ).rows;
  const clientes = new Map<string, ResumenCliente>();
  for (const f of filas) {
    let c = clientes.get(f.cliente_id);
    if (!c) clientes.set(f.cliente_id, (c = { id: f.cliente_id, nombre: f.nombre, productos: [] }));
    const p = f.producto ? producto(f.producto) : undefined;
    if (!p || !f.contratacion_id) continue;
    const [{ avisos, incompleto }, historial] = await Promise.all([
      avisosDe(f.cliente_id, f.contratacion_id),
      historialDe(f.cliente_id, f.contratacion_id),
    ]);
    c.productos.push(resumenProducto(p, avisos, ahora, { historial, incompleto }));
  }
  return [...clientes.values()];
}
