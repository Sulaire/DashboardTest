import { DIAS_QUE_SE_LEEN, type Aviso } from "@/lib/calculos";
import { comoCliente, consultaApp } from "@/lib/db";
import type { AvisoNuevo } from "@/lib/avisos";
import { huellaDe } from "@/lib/llaves";

/**
 * Lo que la app lee y escribe de cada cliente, siempre como panel_app y
 * dentro de `comoCliente`: aunque una consulta de aquí olvidara filtrar por
 * cliente, Postgres no dejaría ver lo de otro.
 */

export type Pestana = { contratacionId: string; producto: string; bloques: string[] | null };

/** Los clientes que puede ver una persona (por ahora, uno). */
export async function clientesDeUsuario(usuarioId: string): Promise<string[]> {
  const filas = await consultaApp<{ cliente_id: string }>(
    "select cliente_id from miembros where usuario_id = $1 order by creado_en",
    [usuarioId],
  );
  return filas.map((f) => f.cliente_id);
}

export async function nombreCliente(clienteId: string): Promise<string | null> {
  return comoCliente(clienteId, async (c) => (await c.query<{ nombre: string }>("select nombre from clientes")).rows[0]?.nombre ?? null);
}

/** Lo contratado por el cliente: una pestaña por producto activo. */
export async function pestanas(clienteId: string): Promise<Pestana[]> {
  return comoCliente(clienteId, async (c) =>
    (
      await c.query<{ id: string; producto: string; bloques: string[] | null }>(
        "select id, producto, bloques from contrataciones where activa order by creado_en",
      )
    ).rows.map((f) => ({ contratacionId: f.id, producto: f.producto, bloques: f.bloques })),
  );
}

/** Los avisos recientes de una pestaña. */
export async function avisosDe(clienteId: string, contratacionId: string): Promise<Aviso[]> {
  return comoCliente(clienteId, async (c) =>
    (
      await c.query<Aviso>(
        `select codigo, ok, texto, cifras, recibido_en from avisos
         where contratacion_id = $1 and recibido_en > now() - make_interval(days => $2)
         order by recibido_en desc limit 20000`,
        [contratacionId, DIAS_QUE_SE_LEEN],
      )
    ).rows,
  );
}

export type Destino = { contratacionId: string; clienteId: string; producto: string };

/** A quién pertenece una llave de producto (viva y de una contratación activa), o null. */
export async function destinoDeLlave(llave: string): Promise<Destino | null> {
  const [fila] = await consultaApp<{ contratacion_id: string; cliente_id: string }>(
    "select contratacion_id, cliente_id from llaves_producto where huella = $1 and revocada_en is null",
    [huellaDe(llave)],
  );
  if (!fila) return null;
  return comoCliente(fila.cliente_id, async (c) => {
    const [contratacion] = (
      await c.query<{ producto: string }>("select producto from contrataciones where id = $1 and activa", [fila.contratacion_id])
    ).rows;
    return contratacion ? { contratacionId: fila.contratacion_id, clienteId: fila.cliente_id, producto: contratacion.producto } : null;
  });
}

export async function guardarAviso(destino: Destino, aviso: AvisoNuevo): Promise<void> {
  await comoCliente(destino.clienteId, (c) =>
    c.query("insert into avisos (cliente_id, contratacion_id, codigo, ok, texto, cifras) values ($1, $2, $3, $4, $5, $6)", [
      destino.clienteId,
      destino.contratacionId,
      aviso.codigo,
      aviso.ok,
      aviso.texto,
      JSON.stringify(aviso.cifras),
    ]),
  );
}
