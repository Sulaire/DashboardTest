import { auth } from "@/lib/auth";

/** Las rutas de Better Auth (/api/auth/…): pedir el enlace, entrar con él, salir. */
async function manejar(request: Request): Promise<Response> {
  return (await auth()).handler(request);
}

export const GET = manejar;
export const POST = manejar;
