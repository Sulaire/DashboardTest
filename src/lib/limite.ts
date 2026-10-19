/**
 * Un límite de llamadas por minuto, en memoria (como el de las llaves de
 * agente de Cosmerito). Si una llave de producto se filtra o un flujo de n8n
 * entra en bucle, no llena la base de datos: a partir del límite responde 429.
 * Al reiniciar la app se pone a cero, y con varias copias de la app cada una
 * lleva su cuenta: es un freno, no una cuenta exacta.
 */

type Ventana = { desde: number; usadas: number };

export function crearLimite(porMinuto: number, maximoClaves = 10_000) {
  const ventanas = new Map<string, Ventana>();
  return function dentro(clave: string, ahora = Date.now()): boolean {
    let v = ventanas.get(clave);
    if (!v || ahora - v.desde >= 60_000) {
      // Para que el mapa no crezca sin fin, se vacía cuando hay demasiadas claves.
      if (!v && ventanas.size >= maximoClaves) ventanas.clear();
      v = { desde: ahora, usadas: 0 };
      ventanas.set(clave, v);
    }
    v.usadas++;
    return v.usadas <= porMinuto;
  };
}
