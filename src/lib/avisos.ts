import type { Producto } from "@/lib/productos/tipos";

/**
 * El formato común con el que cualquier producto cuenta lo que hace:
 *
 *   { "producto": "buzon-facturas", "cliente": "017", "ok": true,
 *     "texto": "12 facturas archivadas", "cifras": { "facturas": 12 } }
 *
 * "cliente" es el código del cliente de tu cliente (opcional). Nunca importes
 * ni datos personales: códigos, números y frases cortas. Esto rechaza lo que
 * se nota a simple vista (correos, números largos como teléfonos o DNI,
 * importes); no es un detector perfecto, por eso el formato es estrecho: un
 * código, sí o no, una frase corta y recuentos. Ver docs/AVISOS.md.
 */

export type AvisoNuevo = { codigo: string | null; ok: boolean; texto: string; cifras: Record<string, number> };

export const TEXTO_MAXIMO = 160;
const CODIGO = /^[A-Za-z0-9._-]{1,32}$/;
const MAXIMO_CIFRA = 1_000_000_000;

/**
 * Antes de mirar, el texto se pasa a su forma normal (NFKC): así los dígitos
 * «de ancho completo» (６１２…) o la arroba ＠ se convierten en los de siempre
 * y no se cuelan. Y se quitan los caracteres invisibles que podrían partir un
 * número para que no se reconozca.
 */
const INVISIBLES = /[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;
export const normalizar = (texto: string) => texto.normalize("NFKC").replace(INVISIBLES, "");

/**
 * Siete cifras o más seguidas, aunque vayan separadas por espacios, puntos,
 * guiones o barras (hasta dos caracteres entre una y otra): un teléfono, un DNI,
 * una cuenta… En un aviso no hace falta ningún número tan largo.
 */
const NUMERO_LARGO = /\d(?:[^\p{L}\d]{0,2}\d){6,}/u;

/** Lo que huele a dato personal o a dinero. Cada uno con su explicación. */
const PROHIBIDO: [RegExp, string][] = [
  [/[^\s@]+@[^\s@]+\.[^\s@]+|[([]\s*at\s*[)\]]|\barroba\b/i, "parece un correo"],
  [NUMERO_LARGO, "tiene un número largo (teléfono, DNI, cuenta…)"],
  [/[€$£¥]|\b(?:eur|euros?|usd|gbp|d[oó]lar(?:es)?|libras?)\b/i, "parece un importe"],
  [/\d[.,]\d{2}(?!\d)/, "parece un importe (un número con céntimos)"],
];

/**
 * Las fechas y horas no son datos personales, pero sus cifras seguidas
 * («2026-10-03 12:00») parecerían un teléfono: se quitan antes de mirar. Solo
 * en estas formas exactas: 2026-10-03, 03/10/2026 (con barras) y 09:00. Otras
 * («3.10.26») se parecen demasiado a otras cosas y no se quitan.
 */
const FECHAS = /\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})\/(\d{1,2})\/(?:\d{4}|\d{2})\b|\b(\d{1,2}):([0-5]\d)(?::[0-5]\d)?\b/g;

/** Quita solo las fechas y horas que existen (un «12/34/5678» no es una fecha: puede ser un teléfono partido). */
function quitarFechas(texto: string): string {
  return texto.replace(FECHAS, (todo, _a, mesIso, diaIso, dia, mes, hora) => {
    const [d, m] = mesIso ? [Number(diaIso), Number(mesIso)] : [Number(dia), Number(mes)];
    if (hora !== undefined) return Number(hora) <= 23 ? " " : todo;
    return d >= 1 && d <= 31 && m >= 1 && m <= 12 ? " " : todo;
  });
}

/**
 * Un código no puede ser un DNI, NIE, CIF o teléfono (aunque sus caracteres
 * valgan): se reconoce por la forma, y cualquier código de 7 cifras o más.
 */
const CODIGO_PROHIBIDO = /^\d{8}[A-Za-z]$|^[XYZxyz]\d{7}[A-Za-z]$|^[A-HJNP-SUVWa-hjnp-suvw]\d{7}[0-9A-Ja-j]$|\d{7,}/;

export function limpiarAviso(
  cuerpo: Record<string, unknown>,
  esperado: Producto,
): { aviso: AvisoNuevo } | { error: string } {
  if (cuerpo.producto !== esperado.id)
    return { error: `'producto' tiene que ser "${esperado.id}" (es el producto de esta llave).` };

  let codigo: string | null = null;
  if (cuerpo.cliente !== undefined && cuerpo.cliente !== null && cuerpo.cliente !== "") {
    const c = typeof cuerpo.cliente === "number" ? String(cuerpo.cliente) : cuerpo.cliente;
    if (typeof c !== "string" || !CODIGO.test(c))
      return { error: "'cliente' es un código corto (letras, números, . _ -), nunca un nombre." };
    // Un código lleva al menos una cifra: así un nombre («BARDEEJEMPLO», «ana.garcia») no pasa por código.
    if (!/\d/.test(c))
      return { error: "'cliente' tiene que llevar al menos una cifra (p. ej. el número de cliente de la gestoría): un nombre no vale." };
    if (CODIGO_PROHIBIDO.test(c))
      return { error: "'cliente' parece un DNI, NIE, CIF o teléfono: usa el número de cliente de la gestoría, no un dato suyo." };
    codigo = c;
  }

  if (typeof cuerpo.ok !== "boolean") return { error: "'ok' tiene que ser true o false." };

  if (typeof cuerpo.texto !== "string") return { error: "'texto' tiene que ser una frase corta." };
  const texto = normalizar(cuerpo.texto).replace(/\s+/g, " ").trim();
  if (!texto) return { error: "'texto' no puede ir vacío." };
  if (texto.length > TEXTO_MAXIMO) return { error: `'texto' como mucho ${TEXTO_MAXIMO} caracteres.` };
  const sinFechas = quitarFechas(texto);
  for (const [patron, motivo] of PROHIBIDO)
    if (patron.test(sinFechas)) return { error: `'texto' ${motivo}: aquí no van datos personales ni importes.` };

  const cifras: Record<string, number> = {};
  if (cuerpo.cifras !== undefined && cuerpo.cifras !== null) {
    if (typeof cuerpo.cifras !== "object" || Array.isArray(cuerpo.cifras)) return { error: "'cifras' tiene que ser un objeto." };
    for (const [clave, valor] of Object.entries(cuerpo.cifras)) {
      if (!Object.hasOwn(esperado.cifras, clave))
        return { error: `La cifra '${clave}' no existe en ${esperado.id}. Las que hay: ${Object.keys(esperado.cifras).join(", ")}.` };
      if (!Number.isInteger(valor) || (valor as number) < 0 || (valor as number) > MAXIMO_CIFRA)
        return { error: `La cifra '${clave}' tiene que ser un número entero (un recuento, no un importe).` };
      cifras[clave] = valor as number;
    }
  }

  return { aviso: { codigo, ok: cuerpo.ok, texto, cifras } };
}
