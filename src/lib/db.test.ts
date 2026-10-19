import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import pg from "pg";
import * as admin from "@/lib/admin";
import { avisosDe, clientesDeUsuario, destinoDeLlave, guardarAviso, nombreCliente, pestanas } from "@/lib/datos";
import { cerrarDb, comoCliente, consultaApp, poolApp, poolDueno } from "@/lib/db";
import { borrarAvisosViejos } from "@/lib/retencion";

/**
 * Pruebas con Postgres de verdad: solo corren con TEST_DATABASE_URL apuntando
 * a una base de datos de usar y tirar (BORRAN todas sus tablas). La más
 * importante: que un cliente no pueda ver lo de otro aunque el código no filtre.
 */

const url = process.env.TEST_DATABASE_URL;
const sin = { skip: url ? false : "sin TEST_DATABASE_URL" };

let A: string, B: string, llaveA: string, llaveB: string, contratacionA: string;

before(async () => {
  if (!url) return;
  const limpio = new pg.Client({ connectionString: url });
  await limpio.connect();
  await limpio.query("drop schema public cascade; create schema public;");
  await limpio.end();
  process.env.DATABASE_URL = url;
  process.env.PANEL_DB_PASSWORD = "contrasena-de-prueba-larga-0123456789";
  process.env.PANEL_ADMIN_EMAIL = "jordi@ejemplo.es";

  A = await admin.crearCliente("Gestoría A");
  B = await admin.crearCliente("Gestoría B");
  await admin.contratar(A, "buzon-facturas");
  await admin.contratar(B, "buzon-facturas");
  const [ca] = (await admin.listarClientes()).find((c) => c.id === A)!.contrataciones;
  const [cb] = (await admin.listarClientes()).find((c) => c.id === B)!.contrataciones;
  contratacionA = ca.id;
  llaveA = await admin.nuevaLlaveProducto(ca.id);
  llaveB = await admin.nuevaLlaveProducto(cb.id);
});

after(async () => {
  if (url) await cerrarDb();
});

test("panel_app no es dueño de nada y no puede saltarse las reglas", sin, async () => {
  const [rol] = (await (await poolDueno()).query("select rolsuper, rolbypassrls from pg_roles where rolname = 'panel_app'")).rows;
  assert.deepEqual(rol, { rolsuper: false, rolbypassrls: false });
  const [yo] = await consultaApp<{ current_user: string }>("select current_user");
  assert.equal(yo.current_user, "panel_app");
  const propias = await consultaApp("select tablename from pg_tables where schemaname = 'public' and tableowner = 'panel_app'");
  assert.equal(propias.length, 0);
});

test("la llave decide el cliente, y cada aviso va al suyo", sin, async () => {
  const dA = await destinoDeLlave(llaveA);
  const dB = await destinoDeLlave(llaveB);
  assert.equal(dA?.clienteId, A);
  assert.equal(dB?.clienteId, B);
  assert.equal(await destinoDeLlave("dcp_inventada"), null);
  await guardarAviso(dA!, { codigo: "017", ok: true, texto: "3 facturas archivadas", cifras: { facturas: 3 } });
  await guardarAviso(dB!, { codigo: "099", ok: false, texto: "PDF ilegible", cifras: { pendientes: 1 } });
  const deA = await avisosDe(A, contratacionA);
  assert.deepEqual(deA.map((a) => a.codigo), ["017"]);
});

test("seguridad por filas: sin filtrar, cada cliente solo ve lo suyo", sin, async () => {
  // A propósito sin "where": si las reglas fallaran, saldrían los de B.
  const avisos = await comoCliente(A, async (c) => (await c.query("select codigo from avisos")).rows);
  assert.deepEqual(avisos, [{ codigo: "017" }]);
  const clientes = await comoCliente(A, async (c) => (await c.query("select nombre from clientes")).rows);
  assert.deepEqual(clientes, [{ nombre: "Gestoría A" }]);
  assert.equal(await nombreCliente(B), "Gestoría B");
  assert.equal((await pestanas(A)).length, 1);
});

test("seguridad por filas: sin cliente puesto no se ve nada", sin, async () => {
  assert.deepEqual(await consultaApp("select * from avisos"), []);
  assert.deepEqual(await consultaApp("select * from clientes"), []);
});

test("seguridad por filas: no se puede escribir en otro cliente", sin, async () => {
  await assert.rejects(
    comoCliente(A, (c) =>
      c.query("insert into avisos (cliente_id, contratacion_id, ok, texto) select $1, id, true, 'x' from contrataciones", [B]),
    ),
  );
  await assert.rejects(comoCliente(A, (c) => c.query("delete from avisos")), /permission denied/);
  await assert.rejects(comoCliente(A, (c) => c.query("update clientes set nombre = 'x'")), /permission denied/);
});

test("SET LOCAL: al acabar la transacción, la conexión olvida el cliente", sin, async () => {
  const pool = await poolApp();
  const conexion = await pool.connect();
  try {
    await conexion.query("begin");
    await conexion.query("select set_config('app.cliente_id', $1, true)", [A]);
    await conexion.query("commit");
    const [fila] = (await conexion.query("select coalesce(current_setting('app.cliente_id', true), '') as c")).rows;
    assert.equal(fila.c, "");
    assert.deepEqual((await conexion.query("select * from avisos")).rows, []);
  } finally {
    conexion.release();
  }
});

test("una llave anulada deja de valer y la nueva anula la vieja", sin, async () => {
  const otra = await admin.nuevaLlaveProducto(contratacionA);
  assert.equal(await destinoDeLlave(llaveA), null);
  assert.equal((await destinoDeLlave(otra))?.clienteId, A);
  await admin.anularLlaves(contratacionA);
  assert.equal(await destinoDeLlave(otra), null);
});

test("personas: dar y quitar acceso", sin, async () => {
  await admin.anadirPersona(A, " Ana@Gestoria.es ");
  const [persona] = (await admin.listarClientes()).find((c) => c.id === A)!.personas;
  assert.equal(persona.correo, "ana@gestoria.es");
  assert.deepEqual(await clientesDeUsuario(persona.id), [A]);
  await admin.quitarPersona(A, persona.id, "jordi@ejemplo.es");
  assert.deepEqual(await clientesDeUsuario(persona.id), []);
  // Sin acceso a ningún cliente, su cuenta (y su correo) se borra.
  const queda = (await (await poolDueno()).query(`select 1 from "user" where id = $1`, [persona.id])).rows;
  assert.equal(queda.length, 0);
  await assert.rejects(admin.anadirPersona(A, "no-es-un-correo"));
});

test("a la carta: se guardan solo bloques que existen; todos = null", sin, async () => {
  await admin.elegirBloques(contratacionA, ["avisos", "inventado"]);
  assert.deepEqual((await pestanas(A))[0].bloques, ["avisos"]);
  await admin.elegirBloques(contratacionA, ["estado", "cifras-mes", "clientes", "avisos"]);
  assert.equal((await pestanas(A))[0].bloques, null);
});

test("los avisos de más de 12 meses se borran", sin, async () => {
  const pool = await poolDueno();
  await pool.query(
    "insert into avisos (cliente_id, contratacion_id, ok, texto, recibido_en) values ($1, $2, true, 'viejo', now() - interval '13 months')",
    [A, contratacionA],
  );
  assert.equal(await borrarAvisosViejos(), 1);
});

test("los últimos avisos de un producto, para el administrador", sin, async () => {
  const avisos = await admin.ultimosAvisos(contratacionA);
  assert.ok(avisos.length >= 1);
  assert.ok(avisos.every((a, i) => i === 0 || avisos[i - 1].recibido_en >= a.recibido_en));
});

test("dar de baja un cliente borra todo lo suyo y nada de otro", sin, async () => {
  const C = await admin.crearCliente("Gestoría C");
  await admin.contratar(C, "buzon-facturas");
  const [cc] = (await admin.listarClientes()).find((c) => c.id === C)!.contrataciones;
  const llaveC = await admin.nuevaLlaveProducto(cc.id);
  await guardarAviso((await destinoDeLlave(llaveC))!, { codigo: "1", ok: true, texto: "x", cifras: {} });
  await admin.anadirPersona(C, "solo-de-c@ejemplo.es");
  await admin.anadirPersona(C, "jordi@ejemplo.es"); // el admin nunca se borra
  const antesB = (await comoCliente(B, (c) => c.query("select count(*)::int as n from avisos"))).rows[0].n;

  await admin.borrarCliente(C, "jordi@ejemplo.es");

  const pool = await poolDueno();
  assert.equal((await pool.query("select 1 from clientes where id = $1", [C])).rows.length, 0);
  assert.equal((await pool.query("select 1 from avisos where cliente_id = $1", [C])).rows.length, 0);
  assert.equal((await pool.query("select 1 from llaves_producto where cliente_id = $1", [C])).rows.length, 0);
  assert.equal(await destinoDeLlave(llaveC), null);
  assert.equal((await pool.query(`select 1 from "user" where email = 'solo-de-c@ejemplo.es'`)).rows.length, 0);
  assert.equal((await pool.query(`select 1 from "user" where email = 'jordi@ejemplo.es'`)).rows.length, 1);
  assert.equal((await comoCliente(B, (c) => c.query("select count(*)::int as n from avisos"))).rows[0].n, antesB);
});

test("panel_app no puede crear nada en el esquema", sin, async () => {
  await assert.rejects(consultaApp("create table plantada (x int)"), /permission denied/);
});

test("el administrador tiene cuenta desde el arranque", sin, async () => {
  const filas = (await (await poolDueno()).query(`select 1 from "user" where email = 'jordi@ejemplo.es'`)).rows;
  assert.equal(filas.length, 1);
});
