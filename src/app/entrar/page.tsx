import { connection } from "next/server";
import { redirect } from "next/navigation";
import { faltan } from "@/lib/config";
import { MARCA } from "@/lib/marca";
import { quienSoy } from "@/lib/sesion";
import { FormularioEntrar } from "./formulario";

export default async function Entrar({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection(); // se decide en cada visita (sesión, configuración), nunca al compilar
  if (faltan().length) redirect("/");
  if (await quienSoy()) redirect("/");
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">{MARCA.nombre}</h1>
      <p className="mb-6 text-texto-suave">Escribe tu correo y te mandamos un enlace para entrar. Sin contraseñas.</p>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-rojo-fondo px-4 py-3 text-rojo">
          Ese enlace ya no vale (caduca a los 15 minutos y sirve una sola vez). Pide otro.
        </p>
      )}
      <FormularioEntrar />
    </main>
  );
}
