import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { config } from "@/lib/config";
import { clientesDeUsuario } from "@/lib/datos";

/** Quién está mirando: la persona, si es el administrador y qué clientes puede ver. */
export type Yo = { id: string; correo: string; esAdmin: boolean; clientes: string[] };

export async function quienSoy(): Promise<Yo | null> {
  const sesion = await (await auth()).api.getSession({ headers: await headers() });
  if (!sesion) return null;
  const correo = sesion.user.email.toLowerCase();
  return {
    id: sesion.user.id,
    correo,
    esAdmin: !!config.correoAdmin && correo === config.correoAdmin,
    clientes: await clientesDeUsuario(sesion.user.id),
  };
}
