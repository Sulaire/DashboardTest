import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Las llaves de los productos (con las que n8n manda sus avisos). Solo se
 * guarda su huella (sha256): si alguien copiara la base de datos, no tendría
 * las llaves.
 */

export const PREFIJO_LLAVE = "dcp_";

export const huellaDe = (llave: string) => createHash("sha256").update(llave).digest("hex");

export function nuevaLlave(): string {
  return PREFIJO_LLAVE + randomBytes(32).toString("base64url");
}

/** La llave de "Authorization: Bearer <llave>", o null. */
export function llaveDeCabecera(cabecera: string | null): string | null {
  const m = cabecera?.match(/^Bearer\s+(\S+)$/i);
  return m ? m[1] : null;
}


/** Compara dos secretos sin dar pistas por el tiempo que tarda (se comparan sus huellas, siempre del mismo largo). */
export function igualesSecretos(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}
