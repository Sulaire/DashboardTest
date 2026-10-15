import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { config } from "@/lib/config";
import { mandarEnlace } from "@/lib/correo";
import { consultaApp, poolApp } from "@/lib/db";

/**
 * Inicio de sesión con Better Auth (librería probada; nada hecho a mano).
 * Se entra con un enlace que llega al correo. No hay registro abierto
 * (disableSignUp): solo entra quien tú das de alta en el panel de administrador.
 * Better Auth usa la conexión de panel_app; sus tablas no tienen reglas por filas.
 */

async function crear() {
  if (!config.secreto) throw new Error("Falta BETTER_AUTH_SECRET.");
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
        sendMagicLink: async ({ email, url }) => {
          if (await existeCuenta(email)) await mandarEnlace(email, url);
        },
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
