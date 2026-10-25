import { MARCA } from "@/lib/marca";

/**
 * El correo con el enlace para entrar: en texto y en HTML. Es lo primero que
 * ve un cliente, así que va cuidado, pero sencillo: sin imágenes ni nada que
 * se cargue de fuera (muchos programas de correo lo bloquean, y así no hay
 * píxeles de seguimiento), con el enlace también escrito por si el botón no
 * se ve, y legible en claro y en oscuro.
 *
 * Los colores van escritos aquí porque los programas de correo no entienden
 * las variables de CSS: son los de globals.css (tema claro). Si cambian allí,
 * cámbialos aquí.
 */
const COLOR = {
  fondo: "#f6f7f9",
  superficie: "#ffffff",
  borde: "#dde1e8",
  texto: "#161a22",
  textoSuave: "#4a5262",
  acento: "#3550c8",
  sobreAcento: "#ffffff",
};

const escapar = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type Correo = { asunto: string; texto: string; html: string };

export function correoEnlace(enlace: string, minutos = 15): Correo {
  const marca = MARCA.nombre;
  const asunto = `Tu enlace para entrar a ${marca}`;
  const texto = [
    "Hola:",
    "",
    `Para entrar a ${marca}, abre este enlace. Vale ${minutos} minutos y solo una vez:`,
    "",
    enlace,
    "",
    "Si no lo has pedido tú, no hagas nada: sin el enlace nadie puede entrar.",
    "",
  ].join("\n");
  const e = escapar(enlace);
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapar(asunto)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.fondo};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.fondo};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${COLOR.superficie};border:1px solid ${COLOR.borde};border-radius:12px;">
<tr><td style="padding:28px 28px 8px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:${COLOR.texto};">
<p style="margin:0 0 4px;font-size:14px;color:${COLOR.textoSuave};">${escapar(marca)}</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${COLOR.texto};">Tu enlace para entrar</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5;">Pulsa el botón para entrar a tu panel. Vale ${minutos} minutos y solo se puede usar una vez.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:${COLOR.acento};">
<a href="${e}" style="display:inline-block;padding:12px 22px;font-size:16px;font-weight:600;color:${COLOR.sobreAcento};text-decoration:none;border-radius:8px;">Entrar a mi panel</a>
</td></tr></table>
<p style="margin:24px 0 8px;font-size:14px;line-height:1.5;color:${COLOR.textoSuave};">Si el botón no funciona, copia esta dirección en el navegador:</p>
<p style="margin:0 0 24px;font-size:13px;line-height:1.4;word-break:break-all;"><a href="${e}" style="color:${COLOR.acento};">${e}</a></p>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid ${COLOR.borde};font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.5;color:${COLOR.textoSuave};">
Si no lo has pedido tú, no hagas nada: sin el enlace nadie puede entrar.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
  return { asunto, texto, html };
}
