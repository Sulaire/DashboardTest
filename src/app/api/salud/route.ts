import { json } from "@/lib/api";
import { consultaApp, hayBaseDeDatos } from "@/lib/db";

/** GET /api/salud — para Railway y Cosmerito: responde 200 si la app y su base de datos están vivas. */
export async function GET() {
  if (!hayBaseDeDatos()) return json({ ok: true, base_de_datos: "sin configurar" });
  try {
    await consultaApp("select 1");
    return json({ ok: true, base_de_datos: "ok" });
  } catch (e) {
    console.error(e);
    return json({ ok: false, base_de_datos: "no responde" }, 503);
  }
}
