import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Pestana } from "@/componentes/Bloques";
import { Cabecera, Pestanas } from "@/componentes/Cabecera";
import { faltan } from "@/lib/config";
import { avisosDe, nombreCliente, pestanas } from "@/lib/datos";
import { bloquesElegidos, producto } from "@/lib/productos/cargar";
import { quienSoy } from "@/lib/sesion";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * El panel de un cliente: una pestaña por producto contratado, con los
 * bloques que haya elegido. Todo lo lee como ese cliente (comoCliente), así
 * que aunque algo fallara aquí, Postgres no enseñaría lo de otro.
 * El administrador puede ver el de cualquiera con ?cliente=<id>.
 */
export default async function Panel({ searchParams }: { searchParams: Promise<{ p?: string; cliente?: string }> }) {
  await connection(); // se decide en cada visita (sesión, configuración), nunca al compilar
  if (faltan().length) redirect("/");
  const yo = await quienSoy();
  if (!yo) redirect("/entrar");
  const q = await searchParams;

  let clienteId = yo.clientes[0];
  if (yo.esAdmin && q.cliente) {
    if (!UUID.test(q.cliente)) notFound();
    clienteId = q.cliente;
  }
  if (!clienteId && yo.esAdmin) redirect("/admin");
  if (!clienteId)
    return (
      <>
        <Cabecera admin={yo.esAdmin} />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <p>Tu cuenta aún no tiene ningún panel. Si crees que es un error, escribe a Jordi.</p>
        </main>
      </>
    );

  const [nombre, lista] = await Promise.all([nombreCliente(clienteId), pestanas(clienteId)]);
  if (!nombre) notFound();
  const conocidas = lista.flatMap((t) => {
    const p = producto(t.producto);
    return p ? [{ ...t, p }] : [];
  });
  const actual = conocidas.find((t) => t.producto === q.p) ?? conocidas[0];
  const avisos = actual ? await avisosDe(clienteId, actual.contratacionId) : [];
  const ahora = new Date();
  const base = yo.esAdmin && q.cliente ? `/panel?cliente=${clienteId}` : "/panel";

  return (
    <>
      <Cabecera cliente={nombre} admin={yo.esAdmin} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {yo.esAdmin && q.cliente && (
          <p className="mb-5 rounded-lg border border-borde bg-superficie-2 px-4 py-3 text-sm">
            Estás viendo el panel de <strong>{nombre}</strong> como administrador.
          </p>
        )}
        {!actual ? (
          <p>Aún no hay ningún producto activo en este panel.</p>
        ) : (
          <>
            <Pestanas lista={conocidas.map((t) => ({ id: t.p.id, nombre: t.p.nombre }))} actual={actual.p.id} base={base} />
            <h1 className="mb-1 text-2xl font-semibold">{actual.p.nombre}</h1>
            <p className="mb-5 text-texto-suave">{actual.p.descripcion}</p>
            <Pestana producto={actual.p} bloques={bloquesElegidos(actual.p, actual.bloques)} avisos={avisos} ahora={ahora} />
          </>
        )}
      </main>
    </>
  );
}
