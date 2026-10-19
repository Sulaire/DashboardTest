/**
 * Toda la configuración sale de variables de entorno (en Railway: pestaña
 * Variables del servicio). Lo que falte no rompe la app: cada pantalla dice
 * qué falta (ver `faltan()`).
 */

function leer(nombre: string): string | undefined {
  const valor = process.env[nombre]?.trim();
  return valor ? valor : undefined;
}

export const config = {
  /** Postgres, con el usuario dueño de las tablas (el que da Railway). */
  get baseDeDatos() {
    return leer("DATABASE_URL");
  },
  /**
   * Contraseña del usuario panel_app, el que usa la app para todo salvo el
   * panel de administrador. La app se la pone sola al arrancar.
   */
  get contrasenaApp() {
    return leer("PANEL_DB_PASSWORD");
  },
  /** Secreto con el que Better Auth firma las sesiones. Cadena larga y aleatoria. */
  get secreto() {
    return leer("BETTER_AUTH_SECRET");
  },
  /** La dirección pública de la app (https://…). Va en los enlaces de los correos. */
  get url() {
    return leer("PANEL_URL") ?? (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");
  },
  /** El correo de Jordi: el único administrador. */
  get correoAdmin() {
    return leer("PANEL_ADMIN_EMAIL")?.toLowerCase();
  },
  /** Para mandar los correos de entrada (Resend). */
  get resendClave() {
    return leer("RESEND_API_KEY");
  },
  /**
   * La llave con la que Cosmerito pide el resumen de los clientes
   * (/api/cosmerito/v1/resumen). Opcional; si es corta, no vale.
   */
  get tokenCosmerito() {
    const t = leer("PANEL_COSMERITO_TOKEN");
    return t && t.length >= 32 ? t : undefined;
  },
  /** Remitente de los correos, p. ej. "Panel <entrar@tudominio.es>". */
  get correoDe() {
    return leer("PANEL_CORREO_DE");
  },
};

export const enProduccion = () => process.env.NODE_ENV === "production";

/** Qué falta para que la app funcione entera, explicado. */
export function faltan(): string[] {
  const f: string[] = [];
  if (!config.baseDeDatos) f.push("DATABASE_URL: la base de datos (en Railway, añade un Postgres y enlaza su variable).");
  if (!config.contrasenaApp || !/^[\x21-\x7e]{24,}$/.test(config.contrasenaApp))
    f.push("PANEL_DB_PASSWORD: contraseña de 24 caracteres o más (sin espacios ni tildes) para el usuario panel_app de la base de datos.");
  if (!config.secreto) f.push("BETTER_AUTH_SECRET: cadena larga y aleatoria para firmar las sesiones.");
  if (!config.url) f.push("PANEL_URL: la dirección pública de la app (https://…).");
  if (!config.correoAdmin) f.push("PANEL_ADMIN_EMAIL: tu correo, para entrar como administrador.");
  if (enProduccion() && (!config.resendClave || !config.correoDe))
    f.push("RESEND_API_KEY y PANEL_CORREO_DE: para mandar los correos con el enlace de entrada.");
  return f;
}
