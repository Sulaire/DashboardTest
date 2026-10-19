import { filas, semaforo, valorCrudo, valorDe, type Aviso, type Historial } from "@/lib/calculos";
import type { Color, Producto } from "@/lib/productos/tipos";

/**
 * El resumen de un producto de un cliente para Cosmerito: semáforo y cifras,
 * nada más. Sin códigos, sin textos de los avisos y sin nada que diga quién
 * es cada cliente de tu cliente: Cosmerito solo necesita saber si va bien.
 * Es una función pura (sin base de datos) para poder probar qué sale y qué no.
 */

export type CifraResumen = { etiqueta: string; numero: number | null; fecha: string | null; texto: string };

export type ResumenProducto = {
  producto: string;
  nombre: string;
  semaforo: Color;
  ultimo_aviso: string | null;
  /** Cuántos códigos (clientes de tu cliente) están en «Revisar», sin decir cuáles. */
  por_revisar: number;
  cifras: CifraResumen[];
  /** true si había tantos avisos que no se leyeron todos (las cifras pueden quedarse cortas). */
  incompleto: boolean;
};

export function resumenProducto(
  producto: Producto,
  avisos: Aviso[],
  ahora: Date,
  extra: { historial?: Historial; incompleto?: boolean } = {},
): ResumenProducto {
  const elementos = producto.bloques.flatMap((b) => (b.tipo === "cifras" ? b.elementos : []));
  const ultimo =
    extra.historial?.ultimo ?? avisos.reduce<Date | null>((m, a) => (!m || a.recibido_en > m ? a.recibido_en : m), null);
  return {
    producto: producto.id,
    nombre: producto.nombre,
    semaforo: semaforo(avisos, producto.silencio_horas, ahora, producto.abiertos, extra.historial),
    ultimo_aviso: ultimo ? ultimo.toISOString() : null,
    por_revisar: filas(avisos, undefined, ahora, producto.abiertos).filter((f) => f.estado === "revisar").length,
    cifras: elementos.map((el) => {
      const v = valorCrudo(el, avisos, ahora);
      return {
        etiqueta: el.etiqueta,
        numero: typeof v === "number" ? v : null,
        fecha: v instanceof Date ? v.toISOString() : null,
        texto: valorDe(el, avisos, ahora),
      };
    }),
    incompleto: !!extra.incompleto,
  };
}
