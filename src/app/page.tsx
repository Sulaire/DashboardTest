import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Faltan } from "@/componentes/Faltan";
import { faltan } from "@/lib/config";
import { quienSoy } from "@/lib/sesion";

/** La portada solo reparte: a entrar, a tu panel o a administración. */
export default async function Inicio() {
  await connection(); // se decide en cada visita (sesión, configuración), nunca al compilar
  const lista = faltan();
  if (lista.length) return <Faltan lista={lista} />;
  const yo = await quienSoy();
  if (!yo) redirect("/entrar");
  redirect(yo.esAdmin ? "/admin" : "/panel");
}
