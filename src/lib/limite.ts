/**
 * Un límite de llamadas por ventana de tiempo (un minuto, si no se dice otra
 * cosa), en memoria, como el de las llaves de agente de Cosmerito. Si una llave
 * se filtra o un flujo de n8n entra en bucle, no llena la base de datos: a
 * partir del límite se responde 429. Al reiniciar la app se pone a cero, y con
 * varias copias de la app cada una lleva su cuenta: es un freno, no una cuenta
 * exacta.
 */

type Ventana = { desde: number; usadas: number };

export type Limite = ((clave: string, ahora?: number) => boolean) & {
  /** Si esa clave ya ha gastado su cupo (sin gastar una más, y sin apuntarla si no estaba). */
  lleno: (clave: string, ahora?: number) => boolean;
  /** Devuelve una llamada gastada (p. ej. se contó un intento y resultó bueno). */
  devolver: (clave: string, ahora?: number) => void;
};

export function crearLimite(porVentana: number, maximoClaves = 10_000, ventanaMs = 60_000): Limite {
  const ventanas = new Map<string, Ventana>();
  const viva = (v: Ventana | undefined, ahora: number): v is Ventana => !!v && ahora - v.desde < ventanaMs;

  /**
   * Para que el mapa no crezca sin fin: primero se quitan las ventanas ya
   * pasadas; si aun así está lleno, las más viejas. Nunca se vacía entero (eso
   * pondría a cero a la vez los cupos de todos, auditoría del 25-10-2026).
   */
  function hacerSitio(ahora: number) {
    if (ventanas.size < maximoClaves) return;
    for (const [clave, v] of ventanas) if (!viva(v, ahora)) ventanas.delete(clave);
    for (const clave of ventanas.keys()) {
      if (ventanas.size < maximoClaves) break;
      ventanas.delete(clave); // un Map recuerda el orden de entrada: las primeras son las más viejas
    }
  }

  const dentro = ((clave: string, ahora = Date.now()) => {
    let v = ventanas.get(clave);
    if (!viva(v, ahora)) {
      ventanas.delete(clave);
      hacerSitio(ahora);
      v = { desde: ahora, usadas: 0 };
      ventanas.set(clave, v);
    }
    v.usadas++;
    return v.usadas <= porVentana;
  }) as Limite;
  dentro.lleno = (clave, ahora = Date.now()) => {
    const v = ventanas.get(clave);
    return viva(v, ahora) && v.usadas >= porVentana;
  };
  dentro.devolver = (clave, ahora = Date.now()) => {
    const v = ventanas.get(clave);
    if (viva(v, ahora) && v.usadas > 0) v.usadas--;
  };
  return dentro;
}
