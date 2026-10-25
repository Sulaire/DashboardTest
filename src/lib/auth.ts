import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";
import { magicLink } from "better-auth/plugins/magic-link";
import { config } from "@/lib/config";
import { mandarEnlace } from "@/lib/correo";
import { enlaceDeConfirmacion } from "@/lib/enlace";
import { consultaApp, poolApp } from "@/lib/db";
import { crearLimite } from "@/lib/limite";

/**
 * Inicio de sesión con Better Auth (librería probada; nada hecho a mano).
 * Se entra con un enlace que llega al correo. No hay registro abierto
 * (disableSignUp): solo entra quien tú das de alta en el panel de administrador.
 * Better Auth usa la conexión de panel_app; sus tablas no tienen reglas por filas.
 */

/** Como mucho 3 enlaces por correo cada 15 minutos: nadie puede llenarle el buzón a un cliente. */
const enlacesPorCorreo = crearLimite(3, 10_000, 15 * 60_000);

/**
 * Se manda DESPUÉS de responder (after): así la respuesta tarda lo mismo y dice
 * lo mismo tenga cuenta el correo o no, y si Resend falla nadie se entera
 * desde fuera (queda en el log). Antes, un correo con cuenta tardaba más (la
 * llamada a Resend) y, si Resend fallaba, daba 500: se podía adivinar quién es
 * cliente (auditoría del 19-10-2026).
 */
function mandarEnSegundoPlano(email: string, url: string): void {
  after(async () => {
    try {
      const correo = email.toLowerCase();
      if (!enlacesPorCorreo(correo)) return;
      // El correo lleva a la página de confirmar, no al enlace de un solo uso (src/lib/enlace.ts).
      if (await existeCuenta(correo)) await mandarEnlace(correo, enlaceDeConfirmacion(url, config.url ?? url));
    } catch (e) {
      console.error("No se pudo mandar el enlace de entrada:", e);
    }
  });
}

async function crear() {
  if (!config.secreto) throw new Error("Falta BETTER_AUTH_SECRET.");
  // Sin PANEL_URL, Better Auth haría el enlace con la dirección que diga quien
  // lo pide (cabecera Host): podría mandarte un enlace bueno a una web falsa.
  if (!config.url) throw new Error("Falta PANEL_URL.");
  return betterAuth({
    database: await poolApp(),
    secret: config.secreto,
    baseURL: config.url,
    basePath: "/api/auth",
    telemetry: { enabled: false },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    // Railway pone la IP real en X-Real-IP; X-Forwarded-For lo puede inventar quien llama.
    advanced: { ipAddress: { ipAddressHeaders: ["x-real-ip"] } },
    plugins: [
      magicLink({
        disableSignUp: true,
        expiresIn: 15 * 60,
        storeToken: "hashed",
        // Solo se manda a quien tiene cuenta: si no, cualquiera podría usar el
        // formulario para mandar correos a quien quisiera. La respuesta es la misma.
        sendMagicLink: async ({ email, url }) => mandarEnSegundoPlano(email, url),
      }),
      // Siempre el último: deja que las Server Actions pongan la cookie de sesión.
      nextCookies(),
    ],
  });
}

async function existeCuenta(correo: string): Promise<boolean> {
  return (await consultaApp(`select 1 from "user" where email = $1`, [correo.toLowerCase()])).length > 0;
}

type Auth = Awaited<ReturnType<typeof crear>>;
const g = globalThis as typeof globalThis & { __panelAuth?: Promise<Auth> };

export function auth(): Promise<Auth> {
  if (!g.__panelAuth) {
    g.__panelAuth = crear();
    g.__panelAuth.catch(() => {
      g.__panelAuth = undefined;
    });
  }
  return g.__panelAuth;
}
