import type { Metadata } from "next";
import { connection } from "next/server";
import { Pestana } from "@/componentes/Bloques";
import { Cabecera, Pestanas } from "@/componentes/Cabecera";
import type { Aviso } from "@/lib/calculos";
import { avisosDeDemo, avisosVigiaDemo } from "@/lib/demo";
import { producto } from "@/lib/productos/cargar";

export const metadata: Metadata = { title: "Demostración" };

/**
 * La demo: un cliente inventado con dos productos (el buzón de facturas y el
 * vigía de su web), con datos inventados, para enseñarla mientras se hace. No
 * lee la base de datos ni pide entrar: no hay nada real que proteger.
 */
const PRODUCTOS: { id: string; avisos: (ahora: Date) => Aviso[] }[] = [
  { id: "buzon-facturas", avisos: avisosDeDemo },
  { id: "vigia-web", avisos: avisosVigiaDemo },
];

export default async function Demo({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await connection(); // que «ahora» sea el momento en que se abre, no el de compilar
  const { p: elegido } = await searchParams;
  const disponibles = PRODUCTOS.flatMap((x) => {
    const p = producto(x.id);
    return p ? [{ ...x, p }] : [];
  });
  const actual = disponibles.find((x) => x.id === elegido) ?? disponibles[0];
  if (!actual) return <p className="p-6">Faltan las descripciones de productos/.</p>;
  const ahora = new Date();
  return (
    <>
      <Cabecera cliente="Gestoría de ejemplo" conSalir={false} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <p className="mb-5 rounded-lg border border-borde bg-superficie-2 px-4 py-3 text-sm text-texto-suave">
          Demostración con datos inventados. Cada cliente ve una pestaña por cada producto que tiene contratado.
        </p>
        <Pestanas lista={disponibles.map((x) => ({ id: x.p.id, nombre: x.p.nombre }))} actual={actual.p.id} base="/demo" />
        <h1 className="mb-1 text-2xl font-semibold">{actual.p.nombre}</h1>
        <p className="mb-5 text-texto-suave">{actual.p.descripcion}</p>
        <Pestana producto={actual.p} bloques={actual.p.bloques} avisos={actual.avisos(ahora)} ahora={ahora} />
      </main>
    </>
  );
}
