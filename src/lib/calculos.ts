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

/**
 * Lo que se sabe de un producto más allá de los días que se leen: cuándo habló
 * por última vez, en total y cada código. Sirve para que un producto callado
 * hace meses salga en rojo (no en gris, «nunca llegó nada») y para que un
 * código que lleva mucho sin dar noticias siga en la lista como «Sin movimiento».
 */
export type Historial = { ultimo: Date | null; codigos: Map<string, Date> };

/** Las semanas que puede enseñar como mucho una gráfica: tienen que caber en lo que se lee. */
export const SEMANAS_MAXIMAS = 8;

/**
 * Cuántos días de avisos se leen para pintar una pestaña: cubre «este mes», el
 * envío mensual y las semanas de la gráfica (la de ahora, a medias, y las
 * anteriores enteras).
 */
export const DIAS_QUE_SE_LEEN = SEMANAS_MAXIMAS * 7 + 7;

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
const formatoDia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

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
 * El último valor que mandó cada código de una cifra «de ahora» (no se suma):
 * p. ej. cuántas facturas le quedan por revisar. Los códigos que nunca la
 * mandaron no salen.
 */
export function ultimoValor(avisos: Aviso[], cifra: string): Map<string, number> {
  const valores = new Map<string, number>();
  for (const a of ordenados(avisos)) {
    const clave = a.codigo ?? "";
    if (!valores.has(clave) && cifra in a.cifras) valores.set(clave, a.cifras[cifra]);
  }
  return valores;
}

/** Si un código tiene algo abierto: su último aviso fue malo, o le queda algo por hacer (la cifra `abiertos`). */
function abierto(ultimo: Aviso, pendientes: number | undefined): boolean {
  return !ultimo.ok || (pendientes ?? 0) > 0;
}

/**
 * Un problema sin código (de todo el producto: un error del flujo, una
 * credencial caída) se cierra con cualquier aviso bueno posterior, tenga
 * código o no: si el buzón vuelve a archivar, es que ya funciona.
 */
function generalAbierto(avisos: Aviso[]): boolean {
  const general = ordenados(avisos).find((a) => a.codigo === null);
  if (!general || general.ok) return false;
  return !avisos.some((a) => a.ok && a.recibido_en > general.recibido_en);
}

/**
 * - gris: nunca ha llegado nada;
 * - rojo: nada en las últimas `silencioHoras` (el producto se ha callado);
 * - ámbar: algo abierto: el último aviso de algún código es ok: false (el
 *   siguiente ok de ese código lo cierra, como en el monitor de Cosmerito); si
 *   el producto declara `abiertos`, a algún código le queda algo pendiente (se
 *   apaga cuando llega a 0); o un problema sin código que nada ha cerrado aún;
 * - verde: lo demás.
 */
export function semaforo(avisos: Aviso[], silencioHoras: number, ahora: Date, abiertos?: string, historial?: Historial): Color {
  if (avisos.length === 0) return historial?.ultimo ? "rojo" : "gris";
  const ultimo = ordenados(avisos)[0];
  if (ahora.getTime() - ultimo.recibido_en.getTime() > silencioHoras * 3_600_000) return "rojo";
  if (generalAbierto(avisos)) return "ambar";
  const pendientes = abiertos ? ultimoValor(avisos, abiertos) : new Map<string, number>();
  for (const [codigo, a] of ultimoPorCodigo(avisos)) if (codigo !== "" && abierto(a, pendientes.get(codigo))) return "ambar";
  return "verde";
}

/** El valor de una cifra del bloque «cifras», tal cual: un número, una fecha o nada. */
export function valorCrudo(elemento: Elemento, avisos: Aviso[], ahora: Date): number | Date | null {
  if (elemento.calculo === "suma_mes") {
    const mes = mesDe(ahora);
    let suma = 0;
    for (const a of avisos) if (mesDe(a.recibido_en) === mes) suma += a.cifras[elemento.cifra] ?? 0;
    return suma;
  }
  if (elemento.calculo === "actual") {
    let suma = 0;
    for (const v of ultimoValor(avisos, elemento.cifra).values()) suma += v;
    return suma;
  }
  if (elemento.calculo === "ultima_fecha") {
    const ultimo = ordenados(avisos).find((a) => elemento.cifra in a.cifras);
    return ultimo ? ultimo.recibido_en : null;
  }
  const desde = ahora.getTime() - elemento.dias * 86_400_000;
  return new Set(avisos.filter((a) => a.codigo && a.recibido_en.getTime() >= desde).map((a) => a.codigo)).size;
}

/** El mismo valor, ya escrito para la pantalla. */
export function valorDe(elemento: Elemento, avisos: Aviso[], ahora: Date): string {
  const v = valorCrudo(elemento, avisos, ahora);
  if (v === null) return "—";
  return v instanceof Date ? fechaCorta(v) : formatoNumero.format(v);
}

/** Un código sin ningún aviso en estos días sale como «Sin movimiento» en la lista. */
export const DIAS_SIN_MOVIMIENTO = 30;

export type Fila = {
  codigo: string;
  estado: "bien" | "revisar" | "quieto";
  ultimo: Date;
  delMes: number | null;
  /** Lo que le queda pendiente (la cifra `abiertos`), si el producto la tiene y el código la mandó. */
  pendientes: number | null;
};

const ORDEN_FILA = { revisar: 0, bien: 1, quieto: 2 };

/** Un renglón por código: los que tienen un problema abierto, primero; los quietos, al final. */
export function filas(avisos: Aviso[], cifra: string | undefined, ahora: Date, abiertos?: string, historial?: Historial): Fila[] {
  const mes = mesDe(ahora);
  const pendientes = abiertos ? ultimoValor(avisos, abiertos) : new Map<string, number>();
  const sumas = new Map<string, number>();
  if (cifra)
    for (const a of avisos)
      if (a.codigo && mesDe(a.recibido_en) === mes) sumas.set(a.codigo, (sumas.get(a.codigo) ?? 0) + (a.cifras[cifra] ?? 0));
  const lista: Fila[] = [...ultimoPorCodigo(avisos).entries()]
    .filter(([codigo]) => codigo !== "")
    .map(([codigo, a]): Fila => ({
      codigo,
      estado: abierto(a, pendientes.get(codigo))
        ? "revisar"
        : ahora.getTime() - a.recibido_en.getTime() > DIAS_SIN_MOVIMIENTO * 86_400_000
          ? "quieto"
          : "bien",
      ultimo: a.recibido_en,
      delMes: cifra ? (sumas.get(codigo) ?? 0) : null,
      pendientes: pendientes.get(codigo) ?? null,
    }));
  // Los códigos que hablaron alguna vez pero no en los días que se leen: «Sin movimiento».
  for (const [codigo, ultimo] of historial?.codigos ?? [])
    if (codigo !== "" && !lista.some((f) => f.codigo === codigo))
      lista.push({ codigo, estado: "quieto", ultimo, delMes: cifra ? 0 : null, pendientes: null });
  return lista.sort((x, y) => ORDEN_FILA[x.estado] - ORDEN_FILA[y.estado] || x.codigo.localeCompare(y.codigo, "es", { numeric: true }));
}

/** El día de Madrid de una fecha, como medianoche UTC de ese día (para contar días sin líos de horario). */
function diaDe(fecha: Date): number {
  const [a, m, d] = formatoDia.format(fecha).split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

/** El lunes (hora de Madrid) de la semana de una fecha, como medianoche UTC. */
function lunesDe(fecha: Date): number {
  const dia = diaDe(fecha);
  return dia - ((new Date(dia).getUTCDay() + 6) % 7) * 86_400_000;
}

export type Semana = { lunes: Date; total: number; enCurso: boolean };

/** La suma de una cifra por semana, de la más vieja a la de ahora (que va a medias). */
export function porSemana(avisos: Aviso[], cifra: string, semanas: number, ahora: Date): Semana[] {
  const actual = lunesDe(ahora);
  const sumas = new Map<number, number>();
  for (const a of avisos) {
    if (!(cifra in a.cifras)) continue;
    const l = lunesDe(a.recibido_en);
    sumas.set(l, (sumas.get(l) ?? 0) + a.cifras[cifra]);
  }
  return Array.from({ length: semanas }, (_, i) => {
    const l = actual - (semanas - 1 - i) * 7 * 86_400_000;
    return { lunes: new Date(l), total: sumas.get(l) ?? 0, enCurso: l === actual };
  });
}

/** «13 oct»: la fecha de un lunes devuelto por porSemana (ya es medianoche UTC del día de Madrid). */
export const fechaDeLunes = (lunes: Date) =>
  new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", day: "numeric", month: "short" }).format(lunes);

/** Los últimos avisos con problema. */
export function problemas(avisos: Aviso[], maximo: number): Aviso[] {
  return ordenados(avisos).filter((a) => !a.ok).slice(0, maximo);
}
