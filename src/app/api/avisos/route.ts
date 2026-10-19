import { json, leerCuerpo } from "@/lib/api";
import { limpiarAviso } from "@/lib/avisos";
import { destinoDeLlave, guardarAviso } from "@/lib/datos";
import { hayBaseDeDatos } from "@/lib/db";
import { crearLimite } from "@/lib/limite";
import { llaveDeCabecera } from "@/lib/llaves";
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
 * Con freno: 120 avisos por minuto por producto contratado y 1.200 en total
 * (para que probar llaves inventadas tampoco cargue la base de datos).
 */
const porLlave = crearLimite(120);
const enTotal = crearLimite(1_200);
export async function POST(request: Request) {
  if (!hayBaseDeDatos()) return json({ ok: false, error: "El panel aún no tiene base de datos." }, 503);
  const llave = llaveDeCabecera(request.headers.get("authorization"));
  if (!llave) return json({ ok: false, error: "Falta Authorization: Bearer <llave del producto>." }, 401);
  if (!enTotal("todas")) return json({ ok: false, error: "Demasiadas llamadas: espera un minuto." }, 429);
  try {
    const destino = await destinoDeLlave(llave);
    if (!destino) return json({ ok: false, error: "Esa llave no vale (o está anulada, o el producto está desactivado)." }, 401);
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
