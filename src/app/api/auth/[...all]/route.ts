import { json, leerHasta } from "@/lib/api";
import { auth } from "@/lib/auth";

/**
 * Las rutas de Better Auth (/api/auth/…): pedir el enlace, entrar con él, salir.
 * Better Auth lee el cuerpo entero sin tope; aquí se corta antes en 16 KB, para
 * que unos cuantos envíos enormes no dejen la app sin memoria.
 */
const MAXIMO = 16_384;

export async function GET(request: Request): Promise<Response> {
  return (await auth()).handler(request);
}

export async function POST(request: Request): Promise<Response> {
  const cuerpo = await leerHasta(request, MAXIMO);
  if (cuerpo === null) return json({ ok: false, error: "El cuerpo es demasiado grande." }, 413);
  const copia = new Request(request.url, { method: "POST", headers: request.headers, body: cuerpo });
  return (await auth()).handler(copia);
}
