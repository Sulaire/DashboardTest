import type { Color, Elemento } from "@/lib/productos/tipos";

/**
 * Lo que enseñan los bloques, calculado a partir de los avisos. Son funciones
 * puras (sin base de datos) para poder probarlas y para que la demo use las
 * mismas que el panel de verdad.
 */

export type Aviso = {
  codigo: string | null;
  ok: boolean;
  texto: string;
  cifras: Record<string, number>;
  recibido_en: Date;
};

/** Cuántos días de avisos se leen para pintar una pestaña (cubre «este mes» y el envío mensual). */
export const DIAS_QUE_SE_LEEN = 40;

const ZONA = "Europe/Madrid";
const formatoMes = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit" });
const formatoFecha = new Intl.DateTimeFormat("es-ES", { timeZone: ZONA, day: "numeric", month: "short" });
const formatoFechaHora = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const formatoNumero = new Intl.NumberFormat("es-ES");

/** "2026-10": el mes de una fecha en hora de Madrid. */
export const mesDe = (fecha: Date) => formatoMes.format(fecha);
export const fechaCorta = (fecha: Date) => formatoFecha.format(fecha);
export const fechaYHora = (fecha: Date) => formatoFechaHora.format(fecha);

/** Los avisos, del más nuevo al más viejo. */
const ordenados = (avisos: Aviso[]) => [...avisos].sort((a, b) => b.recibido_en.getTime() - a.recibido_en.getTime());

/** El último aviso de cada código (los avisos sin código cuentan como uno solo). */
export function ultimoPorCodigo(avisos: Aviso[]): Map<string, Aviso> {
  const ultimos = new Map<string, Aviso>();
  for (const a of ordenados(avisos)) {
    const clave = a.codigo ?? "";
    if (!ultimos.has(clave)) ultimos.set(clave, a);
  }
  return ultimos;
}

/**
 * - gris: nunca ha llegado nada;
 * - rojo: nada en las últimas `silencioHoras` (el producto se ha callado);
 * - ámbar: algún código tiene un problema abierto (su último aviso es ok: false;
 *   el siguiente ok lo cierra, como en el monitor de Cosmerito);
 * - verde: lo demás.
 */
export function semaforo(avisos: Aviso[], silencioHoras: number, ahora: Date): Color {
  if (avisos.length === 0) return "gris";
  const ultimo = ordenados(avisos)[0];
  if (ahora.getTime() - ultimo.recibido_en.getTime() > silencioHoras * 3_600_000) return "rojo";
  for (const a of ultimoPorCodigo(avisos).values()) if (!a.ok) return "ambar";
  return "verde";
}

/** El valor de una cifra del bloque «cifras», ya escrito para la pantalla. */
export function valorDe(elemento: Elemento, avisos: Aviso[], ahora: Date): string {
  if (elemento.calculo === "suma_mes") {
    const mes = mesDe(ahora);
    let suma = 0;
    for (const a of avisos) if (mesDe(a.recibido_en) === mes) suma += a.cifras[elemento.cifra] ?? 0;
    return formatoNumero.format(suma);
  }
  if (elemento.calculo === "ultima_fecha") {
    const ultimo = ordenados(avisos).find((a) => elemento.cifra in a.cifras);
    return ultimo ? fechaCorta(ultimo.recibido_en) : "—";
  }
  const desde = ahora.getTime() - elemento.dias * 86_400_000;
  const codigos = new Set(avisos.filter((a) => a.codigo && a.recibido_en.getTime() >= desde).map((a) => a.codigo));
  return formatoNumero.format(codigos.size);
}

/** Un código sin ningún aviso en estos días sale como «Sin movimiento» en la lista. */
export const DIAS_SIN_MOVIMIENTO = 30;

export type Fila = { codigo: string; estado: "bien" | "revisar" | "quieto"; ultimo: Date; delMes: number | null };

const ORDEN_FILA = { revisar: 0, bien: 1, quieto: 2 };

/** Un renglón por código: los que tienen un problema abierto, primero; los quietos, al final. */
export function filas(avisos: Aviso[], cifra: string | undefined, ahora: Date): Fila[] {
  const mes = mesDe(ahora);
  const sumas = new Map<string, number>();
  if (cifra)
    for (const a of avisos)
      if (a.codigo && mesDe(a.recibido_en) === mes) sumas.set(a.codigo, (sumas.get(a.codigo) ?? 0) + (a.cifras[cifra] ?? 0));
  return [...ultimoPorCodigo(avisos).entries()]
    .filter(([codigo]) => codigo !== "")
    .map(([codigo, a]): Fila => ({
      codigo,
      estado: !a.ok ? "revisar" : ahora.getTime() - a.recibido_en.getTime() > DIAS_SIN_MOVIMIENTO * 86_400_000 ? "quieto" : "bien",
      ultimo: a.recibido_en,
      delMes: cifra ? (sumas.get(codigo) ?? 0) : null,
    }))
    .sort((x, y) => ORDEN_FILA[x.estado] - ORDEN_FILA[y.estado] || x.codigo.localeCompare(y.codigo, "es", { numeric: true }));
}

/** Los últimos avisos con problema. */
export function problemas(avisos: Aviso[], maximo: number): Aviso[] {
  return ordenados(avisos).filter((a) => !a.ok).slice(0, maximo);
}
