/**
 * El formato de la descripción de un producto (productos/<id>.json): qué
 * bloques enseña su pestaña y de qué cifras sale cada uno. Es al dashboard lo
 * que hub.json es a Cosmerito. Explicado en docs/PRODUCTOS.md.
 */

export type Color = "verde" | "ambar" | "rojo" | "gris";

/** Una cifra del bloque «cifras»: de dónde sale el número. */
export type Elemento =
  /** La suma de esa cifra en los avisos de este mes (hora de Madrid). */
  | { etiqueta: string; calculo: "suma_mes"; cifra: string }
  /** La fecha del último aviso que trae esa cifra (p. ej. el último envío). */
  | { etiqueta: string; calculo: "ultima_fecha"; cifra: string }
  /** Lo que vale ahora: la suma, código a código, del último valor que mandó de esa cifra (p. ej. lo que queda por revisar). */
  | { etiqueta: string; calculo: "actual"; cifra: string }
  /** Cuántos códigos distintos han mandado algo en los últimos `dias` días. */
  | { etiqueta: string; calculo: "codigos_activos"; dias: number };

export type Bloque =
  | { id: string; tipo: "semaforo"; titulo: string; textos: Record<Color, string> }
  | { id: string; tipo: "cifras"; titulo: string; elementos: Elemento[] }
  /** Un renglón por código, con su semáforo y (si se dice) la suma del mes de una cifra. */
  | { id: string; tipo: "lista"; titulo: string; cifra?: string }
  /** Columnas con la suma de una cifra por semana (de lunes a domingo, hora de Madrid), las últimas `semanas`. */
  | { id: string; tipo: "grafica"; titulo: string; cifra: string; semanas: number }
  /** Los últimos avisos con ok: false. */
  | { id: string; tipo: "avisos"; titulo: string; maximo: number };

export type TipoBloque = Bloque["tipo"];
export const TIPOS_BLOQUE: TipoBloque[] = ["semaforo", "cifras", "grafica", "lista", "avisos"];

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  /** Cómo se llaman los códigos de los avisos en la pantalla (p. ej. «Cliente»). */
  codigos: string;
  /** Horas sin ningún aviso a partir de las que el semáforo se pone rojo. */
  silencio_horas: number;
  /**
   * Opcional: la cifra que cuenta lo que espera a alguien ahora mismo (en el
   * buzón, las facturas por revisar). No se suma: vale el último valor de cada
   * código. Si es mayor que 0, ese código sale en ámbar aunque el último aviso
   * fuera bueno; cuando baja a 0, se apaga.
   */
  abiertos?: string;
  /** Las cifras que puede mandar el producto, con su nombre para la pantalla. Otras se rechazan. */
  cifras: Record<string, string>;
  bloques: Bloque[];
};
