import { config, enProduccion } from "@/lib/config";

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
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.resendClave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.correoDe,
      to: [correo],
      subject: "Tu enlace para entrar al panel",
      text: `Hola:\n\nPara entrar a tu panel, abre este enlace (vale 15 minutos y solo una vez):\n\n${enlace}\n\nSi no lo has pedido tú, no hagas nada: sin el enlace nadie puede entrar.\n`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!respuesta.ok) throw new Error(`Resend respondió ${respuesta.status}.`);
}
