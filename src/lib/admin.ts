import { randomUUID } from "node:crypto";
import { poolDueno } from "@/lib/db";
import { huellaDe, nuevaLlave } from "@/lib/llaves";
import { producto } from "@/lib/productos/cargar";

/**
 * Lo que hace el panel de administrador (solo Jordi): dar de alta clientes,
 * personas, productos y llaves. Usa la conexión del dueño, que ve a todos los
 * clientes; por eso solo la llaman las acciones de src/app/admin, que
 * comprueban antes que eres el administrador (lo vigila una prueba de guardia).
 */

export type ClienteAdmin = {
  id: string;
  nombre: string;
  personas: { id: string; correo: string }[];
  contrataciones: {
    id: string;
    producto: string;
    bloques: string[] | null;
    activa: boolean;
    llaveViva: boolean;
    ultimoAviso: Date | null;
    avisos30: number;
  }[];
};

export async function listarClientes(): Promise<ClienteAdmin[]> {
  const pool = await poolDueno();
  const clientes = (await pool.query<{ id: string; nombre: string }>("select id, nombre from clientes order by creado_en")).rows;
  const personas = (
    await pool.query<{ cliente_id: string; id: string; email: string }>(
      `select m.cliente_id, u.id, u.email from miembros m join "user" u on u.id = m.usuario_id order by u.email`,
    )
  ).rows;
  const contrataciones = (
    await pool.query<{
      id: string;
      cliente_id: string;
      producto: string;
      bloques: string[] | null;
      activa: boolean;
      llave_viva: boolean;
      ultimo: Date | null;
      avisos30: number;
    }>(
      `select c.id, c.cliente_id, c.producto, c.bloques, c.activa,
              exists (select 1 from llaves_producto l where l.contratacion_id = c.id and l.revocada_en is null) as llave_viva,
              (select max(recibido_en) from avisos a where a.contratacion_id = c.id) as ultimo,
              (select count(*) from avisos a where a.contratacion_id = c.id and a.recibido_en > now() - interval '30 days') as avisos30
       from contrataciones c order by c.creado_en`,
    )
  ).rows;
  return clientes.map((c) => ({
    ...c,
    personas: personas.filter((p) => p.cliente_id === c.id).map((p) => ({ id: p.id, correo: p.email })),
    contrataciones: contrataciones
      .filter((x) => x.cliente_id === c.id)
      .map((x) => ({
        id: x.id,
        producto: x.producto,
        bloques: x.bloques,
        activa: x.activa,
        llaveViva: x.llave_viva,
        ultimoAviso: x.ultimo,
        avisos30: x.avisos30,
      })),
  }));
}

/**
 * Da de baja a un cliente y borra todo lo suyo: productos, llaves, avisos y
 * las cuentas de sus personas (si no tienen acceso a otro cliente). Es lo que
 * pide el contrato de encargo al terminar el servicio. No se puede deshacer.
 */
export async function borrarCliente(clienteId: string, correoAdmin: string | undefined): Promise<void> {
  const pool = await poolDueno();
  const conexion = await pool.connect();
  try {
    await conexion.query("begin");
    const personas = (
      await conexion.query<{ usuario_id: string }>("select usuario_id from miembros where cliente_id = $1", [clienteId])
    ).rows.map((f) => f.usuario_id);
    await conexion.query("delete from clientes where id = $1", [clienteId]);
    if (personas.length)
      await conexion.query(
        `delete from "user" u where u.id = any($1)
           and not exists (select 1 from miembros m where m.usuario_id = u.id)
           and u.email is distinct from $2`,
        [personas, correoAdmin ?? null],
      );
    await conexion.query("commit");
  } catch (e) {
    await conexion.query("rollback").catch(() => {});
    throw e;
  } finally {
    conexion.release();
  }
}

export type AvisoAdmin = { codigo: string | null; ok: boolean; texto: string; cifras: Record<string, number>; recibido_en: Date };

/** Los últimos avisos de un producto contratado, para comprobar que n8n manda bien. */
export async function ultimosAvisos(contratacionId: string, cuantos = 10): Promise<AvisoAdmin[]> {
  const pool = await poolDueno();
  return (
    await pool.query<AvisoAdmin>(
      "select codigo, ok, texto, cifras, recibido_en from avisos where contratacion_id = $1 order by recibido_en desc limit $2",
      [contratacionId, cuantos],
    )
  ).rows;
}

export async function crearCliente(nombre: string): Promise<string> {
  const limpio = nombre.trim().slice(0, 80);
  if (!limpio) throw new Error("El cliente necesita un nombre.");
  const pool = await poolDueno();
  return (await pool.query<{ id: string }>("insert into clientes (nombre) values ($1) returning id", [limpio])).rows[0].id;
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Da acceso a una persona: crea su cuenta si no existe y la une al cliente. */
export async function anadirPersona(clienteId: string, correo: string): Promise<void> {
  const limpio = correo.trim().toLowerCase();
  if (!CORREO.test(limpio) || limpio.length > 200) throw new Error("Ese correo no parece válido.");
  const pool = await poolDueno();
  const { id } = (
    await pool.query<{ id: string }>(
      `insert into "user" (id, name, email, "emailVerified") values ($1, $2, $2, false)
       on conflict (email) do update set email = excluded.email returning id`,
      [randomUUID(), limpio],
    )
  ).rows[0];
  await pool.query("insert into miembros (usuario_id, cliente_id) values ($1, $2) on conflict do nothing", [id, clienteId]);
}

/**
 * Quita el acceso a una persona. Si ya no puede ver ningún cliente, se borra
 * su cuenta (y con ella sus sesiones abiertas): no hay por qué guardar su correo.
 */
export async function quitarPersona(clienteId: string, usuarioId: string, correoAdmin: string | undefined): Promise<void> {
  const pool = await poolDueno();
  await pool.query("delete from miembros where usuario_id = $1 and cliente_id = $2", [usuarioId, clienteId]);
  await pool.query(
    `delete from "user" u where u.id = $1
       and not exists (select 1 from miembros m where m.usuario_id = u.id)
       and u.email is distinct from $2`,
    [usuarioId, correoAdmin ?? null],
  );
}

export async function contratar(clienteId: string, productoId: string): Promise<void> {
  if (!producto(productoId)) throw new Error("Ese producto no existe en productos/.");
  const pool = await poolDueno();
  await pool.query(
    "insert into contrataciones (cliente_id, producto) values ($1, $2) on conflict (cliente_id, producto) do update set activa = true",
    [clienteId, productoId],
  );
}

export async function cambiarActiva(contratacionId: string, activa: boolean): Promise<void> {
  const pool = await poolDueno();
  await pool.query("update contrataciones set activa = $2 where id = $1", [contratacionId, activa]);
}

/** Guarda los bloques elegidos (null = todos). Solo se aceptan ids del producto. */
export async function elegirBloques(contratacionId: string, elegidos: string[] | null): Promise<void> {
  const pool = await poolDueno();
  const [fila] = (await pool.query<{ producto: string }>("select producto from contrataciones where id = $1", [contratacionId])).rows;
  const p = fila && producto(fila.producto);
  if (!p) throw new Error("No encuentro ese producto.");
  const validos = elegidos ? p.bloques.map((b) => b.id).filter((id) => elegidos.includes(id)) : null;
  const todos = validos && validos.length === p.bloques.length;
  await pool.query("update contrataciones set bloques = $2 where id = $1", [contratacionId, todos ? null : validos]);
}

/**
 * Crea la llave con la que el producto manda sus avisos y anula las
 * anteriores (una sola viva). Devuelve la llave: se enseña esta vez y no más.
 */
export async function nuevaLlaveProducto(contratacionId: string): Promise<string> {
  const pool = await poolDueno();
  const [c] = (await pool.query<{ cliente_id: string }>("select cliente_id from contrataciones where id = $1", [contratacionId])).rows;
  if (!c) throw new Error("No encuentro esa contratación.");
  const llave = nuevaLlave();
  const conexion = await pool.connect();
  try {
    await conexion.query("begin");
    await conexion.query("update llaves_producto set revocada_en = now() where contratacion_id = $1 and revocada_en is null", [
      contratacionId,
    ]);
    await conexion.query("insert into llaves_producto (contratacion_id, cliente_id, huella) values ($1, $2, $3)", [
      contratacionId,
      c.cliente_id,
      huellaDe(llave),
    ]);
    await conexion.query("commit");
  } catch (e) {
    await conexion.query("rollback").catch(() => {});
    throw e;
  } finally {
    conexion.release();
  }
  return llave;
}

export async function anularLlaves(contratacionId: string): Promise<void> {
  const pool = await poolDueno();
  await pool.query("update llaves_producto set revocada_en = now() where contratacion_id = $1 and revocada_en is null", [contratacionId]);
}
