import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Cabecera } from "@/componentes/Cabecera";
import { listarClientes } from "@/lib/admin";
import { fechaYHora } from "@/lib/calculos";
import { faltan } from "@/lib/config";
import { cargarProductos } from "@/lib/productos/cargar";
import { borrarAvisosViejos } from "@/lib/retencion";
import { quienSoy } from "@/lib/sesion";
import { anadirPersona, anularLlaves, cambiarActiva, contratar, crearCliente, elegirBloques, quitarPersona } from "./acciones";
import { BotonLlave } from "./boton-llave";

const boton = "rounded-lg bg-superficie-2 px-3 py-1.5 text-sm";
const campo = "rounded-lg border border-borde bg-superficie px-3 py-1.5";

/** El panel de administrador: dar de alta clientes, personas, productos y llaves. Solo Jordi. */
export default async function Admin() {
  await connection(); // se decide en cada visita (sesión, configuración), nunca al compilar
  if (faltan().length) redirect("/");
  const yo = await quienSoy();
  if (!yo) redirect("/entrar");
  if (!yo.esAdmin) redirect("/panel");

  await borrarAvisosViejos();
  const { productos, errores } = cargarProductos();
  const clientes = await listarClientes();

  return (
    <>
      <Cabecera cliente="Administración" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {errores.length > 0 && (
          <section role="alert" className="rounded-xl bg-rojo-fondo p-4 text-rojo">
            <h2 className="font-semibold">Productos con errores (no se pueden usar)</h2>
            <ul className="mt-2 list-disc pl-5">
              {errores.map((e) => (
                <li key={e.archivo}>
                  productos/{e.archivo}: {e.errores.join(" ")}
                </li>
              ))}
            </ul>
          </section>
        )}

        <form action={crearCliente} className="flex flex-wrap items-end gap-2 rounded-xl border border-borde bg-superficie p-4">
          <label className="flex flex-col gap-1 text-sm">
            Cliente nuevo
            <input name="nombre" required maxLength={80} placeholder="Nombre (solo lo ves tú y él)" className={campo} />
          </label>
          <button className={boton}>Dar de alta</button>
        </form>

        {clientes.length === 0 && <p className="text-texto-suave">Aún no hay clientes.</p>}

        {clientes.map((c) => {
          const sinContratar = [...productos.values()].filter((p) => !c.contrataciones.some((x) => x.producto === p.id));
          return (
            <section key={c.id} className="space-y-4 rounded-xl border border-borde bg-superficie p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">{c.nombre}</h2>
                <Link href={`/panel?cliente=${c.id}`} className="text-sm text-acento underline">
                  Ver su panel
                </Link>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-texto-suave">Personas con acceso</h3>
                <ul className="mb-2 space-y-1">
                  {c.personas.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <span>{p.correo}</span>
                      <form action={quitarPersona}>
                        <input type="hidden" name="cliente" value={c.id} />
                        <input type="hidden" name="usuario" value={p.id} />
                        <button className="text-sm text-rojo underline">Quitar</button>
                      </form>
                    </li>
                  ))}
                  {c.personas.length === 0 && <li className="text-texto-suave">Nadie todavía.</li>}
                </ul>
                <form action={anadirPersona} className="flex flex-wrap gap-2">
                  <input type="hidden" name="cliente" value={c.id} />
                  <input name="correo" type="email" required placeholder="correo@ejemplo.es" aria-label="Correo" className={campo} />
                  <button className={boton}>Dar acceso</button>
                </form>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">Productos</h3>
                {c.contrataciones.map((x) => {
                  const p = productos.get(x.producto);
                  return (
                    <div key={x.id} className="space-y-3 rounded-lg bg-superficie-2 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {p?.nombre ?? x.producto} {!x.activa && <span className="text-texto-suave">(desactivado)</span>}
                        </p>
                        <form action={cambiarActiva}>
                          <input type="hidden" name="contratacion" value={x.id} />
                          <input type="hidden" name="activa" value={x.activa ? "no" : "si"} />
                          <button className={boton}>{x.activa ? "Desactivar" : "Activar"}</button>
                        </form>
                      </div>
                      <p className="text-sm text-texto-suave">
                        Último aviso: {x.ultimoAviso ? fechaYHora(x.ultimoAviso) : "ninguno"} · {x.avisos30} en 30 días ·
                        Llave: {x.llaveViva ? "puesta" : "sin llave"}
                      </p>
                      <div className="flex flex-wrap items-start gap-3">
                        <BotonLlave contratacion={x.id} hayLlave={x.llaveViva} />
                        {x.llaveViva && (
                          <form action={anularLlaves}>
                            <input type="hidden" name="contratacion" value={x.id} />
                            <button className="rounded-lg px-3 py-1.5 text-sm text-rojo underline">Anular la llave</button>
                          </form>
                        )}
                      </div>
                      {p && (
                        <form action={elegirBloques} className="space-y-2">
                          <input type="hidden" name="contratacion" value={x.id} />
                          <fieldset>
                            <legend className="mb-1 text-sm">Bloques que ve el cliente</legend>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {p.bloques.map((b) => (
                                <label key={b.id} className="flex items-center gap-2 text-sm">
                                  <input type="checkbox" name="bloque" value={b.id} defaultChecked={!x.bloques || x.bloques.includes(b.id)} />
                                  {b.titulo}
                                </label>
                              ))}
                            </div>
                          </fieldset>
                          <button className={boton}>Guardar bloques</button>
                        </form>
                      )}
                    </div>
                  );
                })}
                {sinContratar.length > 0 && (
                  <form action={contratar} className="flex flex-wrap gap-2">
                    <input type="hidden" name="cliente" value={c.id} />
                    <select name="producto" aria-label="Producto" className={campo}>
                      {sinContratar.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                    <button className={boton}>Añadir producto</button>
                  </form>
                )}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
