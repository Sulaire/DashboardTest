import { json } from "@/lib/api";
import { config } from "@/lib/config";
import { hayBaseDeDatos } from "@/lib/db";
import { crearLimite } from "@/lib/limite";
import { igualesSecretos, llaveDeCabecera } from "@/lib/llaves";
import { resumenDeTodos } from "@/lib/resumen-datos";

/**
 * GET /api/cosmerito/v1/resumen — la puerta por la que Cosmerito pregunta cómo
 * va cada cliente: semáforo y cifras, nada personal (src/lib/resumen.ts).
 * Solo con su propia llave (PANEL_COSMERITO_TOKEN): ni la sesión de un
 * cliente ni la llave de un producto sirven aquí. Explicado en docs/COSMERITO.md.
 */
const limite = crearLimite(30);

export async function GET(request: Request) {
  const esperada = config.tokenCosmerito;
  if (!esperada) return json({ ok: false, error: "Esta puerta no está configurada (falta PANEL_COSMERITO_TOKEN)." }, 503);
  const llave = llaveDeCabecera(request.headers.get("authorization"));
  if (!llave || !igualesSecretos(llave, esperada)) return json({ ok: false, error: "No autorizado." }, 401);
  if (!limite("cosmerito")) return json({ ok: false, error: "Demasiadas llamadas: espera un minuto." }, 429);
  if (!hayBaseDeDatos()) return json({ ok: false, error: "El panel aún no tiene base de datos." }, 503);
  try {
    const ahora = new Date();
    return json({ ok: true, version: 1, generado_en: ahora.toISOString(), clientes: await resumenDeTodos(ahora) });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "Error interno del panel. Prueba otra vez en un rato." }, 500);
  }
}
