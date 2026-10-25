import type { Metadata } from "next";
import { connection } from "next/server";
import { Pestana } from "@/componentes/Bloques";
import { Cabecera } from "@/componentes/Cabecera";
import { avisosDeDemo } from "@/lib/demo";
import { producto } from "@/lib/productos/cargar";

export const metadata: Metadata = { title: "Demostración" };

/**
 * La demo: la pestaña del buzón con datos inventados, para enseñarla a la
 * gestoría mientras se hace. No lee la base de datos ni pide entrar: no hay
 * nada real que proteger.
 */
export default async function Demo() {
  await connection(); // que «ahora» sea el momento en que se abre, no el de compilar
  const p = producto("buzon-facturas");
  if (!p) return <p className="p-6">Falta productos/buzon-facturas.json.</p>;
  const ahora = new Date();
  return (
    <>
      <Cabecera cliente="Gestoría de ejemplo" conSalir={false} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <p className="mb-5 rounded-lg border border-borde bg-superficie-2 px-4 py-3 text-sm text-texto-suave">
          Demostración con datos inventados. Así verá la gestoría su buzón de facturas.
        </p>
        <h1 className="mb-1 text-2xl font-semibold">{p.nombre}</h1>
        <p className="mb-5 text-texto-suave">{p.descripcion}</p>
        <Pestana producto={p} bloques={p.bloques} avisos={avisosDeDemo(ahora)} ahora={ahora} />
      </main>
    </>
  );
}
