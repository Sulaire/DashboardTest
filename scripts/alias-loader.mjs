/**
 * Traduce el alias "@/..." a rutas de src/ para el ejecutor de pruebas, y
 * completa la extensión de las importaciones relativas que no la llevan.
 *
 * En la web lo resuelve el compilador de Next leyendo tsconfig.json, pero
 * `node --test` ejecuta los ficheros directamente y no sabe nada de ese
 * alias. Esto es lo mínimo para que las pruebas importen igual que el código
 * de producción, sin tener que ensuciar las importaciones con rutas
 * relativas ni añadir un ejecutor de pruebas con sus cien dependencias.
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";

const SRC = pathToFileURL(resolvePath(process.cwd(), "src") + "/").href;

export function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    let target = SRC + specifier.slice(2);
    // El código de producción importa sin extensión ("@/lib/config"); Node
    // en modo ESM la exige.
    if (!/\.[a-z]+$/.test(target)) target += ".ts";
    return next(target, context);
  }

  /*
   * Lo mismo para las relativas sin extensión, que es como importa
   * next.config.ts ("./src/lib/vitrina"). Se comprueba que el fichero .ts
   * exista de verdad antes de añadir nada: así una carpeta con index o un
   * paquete que se llame igual siguen resolviéndose como siempre.
   */
  if (/^\.{1,2}\//.test(specifier) && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
    const candidato = new URL(specifier + ".ts", context.parentURL);
    if (existsSync(fileURLToPath(candidato))) return next(candidato.href, context);
  }

  return next(specifier, context);
}
