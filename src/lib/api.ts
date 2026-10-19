/** Respuestas JSON coherentes para toda la API. */
export function json(datos: unknown, estado = 200) {
  return Response.json(datos, { status: estado, headers: { "Cache-Control": "no-store" } });
}

/** Lee como mucho `maximo` bytes del cuerpo; si hay más, devuelve null sin seguir leyendo. */
async function leerHasta(request: Request, maximo: number): Promise<string | null> {
  const declarado = Number(request.headers.get("content-length"));
  if (declarado > maximo) return null;
  if (!request.body) return "";
  const lector = request.body.getReader();
  const trozos: Uint8Array[] = [];
  let leidos = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    leidos += value.byteLength;
    if (leidos > maximo) {
      await lector.cancel().catch(() => {});
      return null;
    }
    trozos.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(trozos));
}

/**
 * Solo acepta cuerpos JSON (objeto) de hasta `maximo` bytes. Un formulario de
 * otra web no puede mandar ese tipo, y un cuerpo enorme no llega a leerse entero.
 */
export async function leerCuerpo(
  request: Request,
  maximo = 8_192,
): Promise<{ cuerpo: Record<string, unknown> } | { error: string; estado: number }> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
    return { error: "El cuerpo tiene que ser un objeto JSON (Content-Type: application/json).", estado: 400 };
  const texto = await leerHasta(request, maximo);
  if (texto === null) return { error: `El cuerpo es demasiado grande (como mucho ${maximo} bytes).`, estado: 413 };
  try {
    const cuerpo = JSON.parse(texto);
    if (cuerpo && typeof cuerpo === "object" && !Array.isArray(cuerpo)) return { cuerpo: cuerpo as Record<string, unknown> };
  } catch {}
  return { error: "El cuerpo tiene que ser un objeto JSON (Content-Type: application/json).", estado: 400 };
}
