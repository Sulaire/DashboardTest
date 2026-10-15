import { NextResponse } from "next/server";

/** Respuestas JSON coherentes para toda la API. */
export function json(datos: unknown, estado = 200) {
  return NextResponse.json(datos, { status: estado, headers: { "Cache-Control": "no-store" } });
}

/** Solo acepta cuerpos JSON (objeto). Un formulario de otra web no puede mandar ese tipo. */
export async function leerCuerpo(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return null;
  try {
    const cuerpo = await request.json();
    return cuerpo && typeof cuerpo === "object" && !Array.isArray(cuerpo) ? (cuerpo as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
