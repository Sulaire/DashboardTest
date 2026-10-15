import type { Producto } from "@/lib/productos/tipos";

/**
 * El formato común con el que cualquier producto cuenta lo que hace:
 *
 *   { "producto": "buzon-facturas", "cliente": "017", "ok": true,
 *     "texto": "12 facturas archivadas", "cifras": { "facturas": 12 } }
 *
 * "cliente" es el código del cliente de tu cliente (opcional). Nunca importes
 * ni datos personales: códigos, números y frases cortas. Esto rechaza lo que
 * se nota a simple vista (correos, teléfonos, DNI, importes con €); no es un
 * detector perfecto, por eso el formato es estrecho. Ver docs/AVISOS.md.
 */

export type AvisoNuevo = { codigo: string | null; ok: boolean; texto: string; cifras: Record<string, number> };

export const TEXTO_MAXIMO = 160;
const CODIGO = /^[A-Za-z0-9._-]{1,32}$/;
const MAXIMO_CIFRA = 1_000_000_000;

/** Lo que huele a dato personal o a dinero. Cada uno con su explicación. */
const PROHIBIDO: [RegExp, string][] = [
  [/[^\s@]+@[^\s@]+\.[^\s@]+/, "parece un correo"],
  [/(?:\d[\s.-]?){9,}/, "tiene un número largo (teléfono, cuenta…)"],
  [/\b\d{8}[A-Za-z]\b|\b[XYZxyz]\d{7}[A-Za-z]\b/, "parece un DNI o NIE"],
  [/€|\$|£|\d\s*(?:eur|euros?)\b/i, "parece un importe"],
];

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
    codigo = c;
  }

  if (typeof cuerpo.ok !== "boolean") return { error: "'ok' tiene que ser true o false." };

  if (typeof cuerpo.texto !== "string") return { error: "'texto' tiene que ser una frase corta." };
  const texto = cuerpo.texto.replace(/\s+/g, " ").trim();
  if (!texto) return { error: "'texto' no puede ir vacío." };
  if (texto.length > TEXTO_MAXIMO) return { error: `'texto' como mucho ${TEXTO_MAXIMO} caracteres.` };
  for (const [patron, motivo] of PROHIBIDO)
    if (patron.test(texto)) return { error: `'texto' ${motivo}: aquí no van datos personales ni importes.` };

  const cifras: Record<string, number> = {};
  if (cuerpo.cifras !== undefined && cuerpo.cifras !== null) {
    if (typeof cuerpo.cifras !== "object" || Array.isArray(cuerpo.cifras)) return { error: "'cifras' tiene que ser un objeto." };
    for (const [clave, valor] of Object.entries(cuerpo.cifras)) {
      if (!(clave in esperado.cifras))
        return { error: `La cifra '${clave}' no existe en ${esperado.id}. Las que hay: ${Object.keys(esperado.cifras).join(", ")}.` };
      if (!Number.isInteger(valor) || (valor as number) < 0 || (valor as number) > MAXIMO_CIFRA)
        return { error: `La cifra '${clave}' tiene que ser un número entero (un recuento, no un importe).` };
      cifras[clave] = valor as number;
    }
  }

  return { aviso: { codigo, ok: cuerpo.ok, texto, cifras } };
}
