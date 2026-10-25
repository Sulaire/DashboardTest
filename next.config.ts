import type { NextConfig } from "next";

/*
 * Política de contenido: la página solo carga cosas de su propio dominio.
 * Next mete pequeños scripts en línea al pintar la página, por eso hace falta
 * 'unsafe-inline'. Solo en producción: en `next dev` choca con la recarga en
 * caliente de Turbopack y la página se recarga en bucle (visto el 15-10-2026).
 * Si algún día se carga algo de fuera (fuentes, Stripe…), hay que permitirlo aquí.
 */
const desarrollo = process.env.NODE_ENV !== "production";
const politica = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Las pruebas de punta a punta (e2e/) compilan en su propia carpeta, para no
  // mezclarse con la de `npm run dev` ni con la del build.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // `next dev` añadiría a CLAUDE.md un aviso en inglés que ese archivo ya da en español.
  agentRules: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Privado: nada de buscadores, nada de incrustarlo en otra web.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          ...(desarrollo ? [] : [{ key: "Content-Security-Policy", value: politica }]),
          ...(desarrollo ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
