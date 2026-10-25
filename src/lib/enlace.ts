/**
 * El enlace del correo no entra directamente: lleva a /entrar/confirmar, una
 * página con un botón «Entrar». Muchos correos de empresa (Microsoft 365 Safe
 * Links y parecidos) abren los enlaces antes que la persona para ver si son
 * peligrosos; como el enlace de Better Auth es de un solo uso, ese programa lo
 * gastaba y a la persona le salía «ese enlace ya no vale» (auditoría del
 * 25-10-2026). Esos programas abren la página, pero no pulsan botones.
 */

/** Lo que se pasa de la dirección de Better Auth a la página (y de ahí, de vuelta). */
export const PARAMETROS = ["token", "callbackURL", "errorCallbackURL", "newUserCallbackURL"] as const;
type Parametro = (typeof PARAMETROS)[number];

const TOKEN = /^[A-Za-z0-9_-]{8,200}$/;
/** Solo vueltas dentro del panel («/…», nunca «//otra-web»). Better Auth lo vuelve a comprobar. */
const DENTRO = (v: string) => /^\/(?![/\\])[^\s]*$/.test(v) && v.length <= 200;

/** Convierte la dirección que da Better Auth en la de la página de confirmar. */
export function enlaceDeConfirmacion(urlBetterAuth: string, base: string): string {
  const original = new URL(urlBetterAuth);
  const destino = new URL("/entrar/confirmar", base);
  for (const p of PARAMETROS) {
    const v = original.searchParams.get(p);
    if (v) destino.searchParams.set(p, v);
  }
  return destino.toString();
}

/** Los parámetros que llegan a la página, comprobados (o null si no valen). */
export function parametrosValidos(q: Partial<Record<Parametro, string | string[] | undefined>>): Record<string, string> | null {
  const token = typeof q.token === "string" ? q.token : "";
  if (!TOKEN.test(token)) return null;
  const salida: Record<string, string> = { token };
  for (const p of PARAMETROS) {
    if (p === "token") continue;
    const v = q[p];
    if (typeof v === "string" && DENTRO(v)) salida[p] = v;
  }
  return salida;
}
