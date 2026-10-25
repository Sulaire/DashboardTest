import { config, enProduccion } from "@/lib/config";
import { correoEnlace } from "@/lib/correo-plantilla";

/**
 * El correo con el enlace para entrar. Lo manda Resend (tomado prestado: el
 * envío de correos no se hace a mano). Sin Resend, en tu ordenador el enlace
 * sale en la terminal para poder probar; en producción, sin Resend, falla.
 */
export async function mandarEnlace(correo: string, enlace: string): Promise<void> {
  if (!config.resendClave || !config.correoDe) {
    if (enProduccion()) throw new Error("Faltan RESEND_API_KEY o PANEL_CORREO_DE: no se puede mandar el correo.");
    console.log(`\n[Sin Resend] Enlace para entrar de ${correo}:\n${enlace}\n`);
    return;
  }
  const { asunto, texto, html } = correoEnlace(enlace);
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.resendClave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.correoDe,
      to: [correo],
      subject: asunto,
      text: texto,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!respuesta.ok) throw new Error(`Resend respondió ${respuesta.status}.`);
}
