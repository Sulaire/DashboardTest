import { ipDe, json, leerCuerpo } from "@/lib/api";
import { limpiarAviso } from "@/lib/avisos";
import { destinoDeLlave, guardarAviso } from "@/lib/datos";
import { hayBaseDeDatos } from "@/lib/db";
import { crearLimite } from "@/lib/limite";
import { huellaDe, llaveDeCabecera } from "@/lib/llaves";
import { producto } from "@/lib/productos/cargar";
import { limpiarSiToca } from "@/lib/retencion";

/**
 * POST /api/avisos — la puerta por la que los productos (n8n…) cuentan lo que hacen:
 *
 *   Authorization: Bearer <llave del producto>
 *   { "producto": "buzon-facturas", "cliente": "017", "ok": true,
 *     "texto": "12 facturas archivadas", "cifras": { "facturas": 12 } }
 *
 * La llave decide de qué cliente es el aviso (no el cuerpo). Explicado en docs/AVISOS.md.
 * Con freno: 120 avisos por minuto por producto contratado, y 30 intentos con
 * llaves desconocidas por minuto desde cada IP (para que probar llaves
 * inventadas no cargue la base de datos). El intento se cuenta ANTES de mirar
 * la base de datos (si llegan 300 a la vez, solo 30 la tocan) y se devuelve si
 * la llave vale. Una llave que ha valido hace poco no pasa por ese freno: las
 * llaves malas de otro (o una vieja olvidada en n8n) nunca bloquean a las
 * buenas, aunque salgan de la misma IP (auditoría del 25-10-2026).
 */
const porLlave = crearLimite(120);
const intentosPorIp = crearLimite(30);
const BUENAS_MS = 10 * 60_000;
const buenas = new Map<string, number>(); // huella de una llave que ha valido → hasta cuándo se fía uno de ella

function esBuena(huella: string, ahora: number): boolean {
  const hasta = buenas.get(huella);
  if (hasta && hasta > ahora) return true;
  if (hasta) buenas.delete(huella);
  return false;
}
export async function POST(request: Request) {
  if (!hayBaseDeDatos()) return json({ ok: false, error: "El panel aún no tiene base de datos." }, 503);
  const llave = llaveDeCabecera(request.headers.get("authorization"));
  if (!llave) return json({ ok: false, error: "Falta Authorization: Bearer <llave del producto>." }, 401);
  const ip = ipDe(request);
  const huella = huellaDe(llave);
  const ahora = Date.now();
  const conocida = esBuena(huella, ahora);
  if (!conocida && !intentosPorIp(ip, ahora)) return json({ ok: false, error: "Demasiadas llaves que no valen: espera un minuto." }, 429);
  try {
    // La base de datos se mira siempre: una llave anulada deja de valer al momento.
    const destino = await destinoDeLlave(llave);
    if (!destino) {
      buenas.delete(huella);
      return json({ ok: false, error: "Esa llave no vale (o está anulada, o el producto está desactivado)." }, 401);
    }
    if (!conocida) intentosPorIp.devolver(ip, ahora);
    if (buenas.size > 5_000) buenas.clear();
    buenas.set(huella, ahora + BUENAS_MS);
    const descripcion = producto(destino.producto);
    if (!descripcion) return json({ ok: false, error: "El producto de esta llave ya no existe en el panel." }, 409);
    if (!porLlave(destino.contratacionId)) return json({ ok: false, error: "Demasiados avisos de este producto: espera un minuto." }, 429);
    const leido = await leerCuerpo(request);
    if ("error" in leido) return json({ ok: false, error: leido.error }, leido.estado);
    const r = limpiarAviso(leido.cuerpo, descripcion);
    if ("error" in r) return json({ ok: false, error: r.error }, 400);
    await guardarAviso(destino, r.aviso);
    limpiarSiToca();
    return json({ ok: true });
  } catch (e) {
    // El detalle va al log de Railway; fuera solo un mensaje genérico.
    console.error(e);
    return json({ ok: false, error: "Error interno del panel. Prueba otra vez en un rato." }, 500);
  }
}
