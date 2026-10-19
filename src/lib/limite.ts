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
  /** Si esa clave ya ha gastado su cupo (sin gastar una más). */
  lleno: (clave: string, ahora?: number) => boolean;
};

export function crearLimite(porVentana: number, maximoClaves = 10_000, ventanaMs = 60_000): Limite {
  const ventanas = new Map<string, Ventana>();
  function actual(clave: string, ahora: number): Ventana {
    let v = ventanas.get(clave);
    if (!v || ahora - v.desde >= ventanaMs) {
      // Para que el mapa no crezca sin fin, se vacía cuando hay demasiadas claves.
      if (!v && ventanas.size >= maximoClaves) ventanas.clear();
      v = { desde: ahora, usadas: 0 };
      ventanas.set(clave, v);
    }
    return v;
  }
  const dentro = ((clave: string, ahora = Date.now()) => {
    const v = actual(clave, ahora);
    v.usadas++;
    return v.usadas <= porVentana;
  }) as Limite;
  dentro.lleno = (clave, ahora = Date.now()) => actual(clave, ahora).usadas >= porVentana;
  return dentro;
}
