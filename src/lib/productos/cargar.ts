import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DIAS_QUE_SE_LEEN, SEMANAS_MAXIMAS } from "@/lib/calculos";
import { TIPOS_BLOQUE, type Bloque, type Producto } from "@/lib/productos/tipos";

/**
 * Lee las descripciones de productos/ (una por archivo) y las comprueba. Un
 * archivo mal escrito no tumba la app: se queda fuera y su error sale en el
 * panel de administrador (y en las pruebas, que fallan).
 */

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CIFRA = /^[a-z][a-z0-9_]{0,31}$/;

const esTexto = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export function validarProducto(dato: unknown): { producto: Producto } | { errores: string[] } {
  const e: string[] = [];
  const p = dato as Partial<Producto> | null;
  if (!p || typeof p !== "object") return { errores: ["No es un objeto JSON."] };
  if (!esTexto(p.id) || !ID.test(p.id)) e.push("'id' tiene que ir en minúsculas y con guiones.");
  if (!esTexto(p.nombre)) e.push("Falta 'nombre'.");
  if (!esTexto(p.descripcion)) e.push("Falta 'descripcion'.");
  if (!esTexto(p.codigos)) e.push("Falta 'codigos' (cómo se llaman los códigos en pantalla).");
  if (typeof p.silencio_horas !== "number" || !(p.silencio_horas > 0)) e.push("'silencio_horas' tiene que ser un número mayor que 0.");
  const cifras = p.cifras && typeof p.cifras === "object" ? p.cifras : null;
  if (!cifras) e.push("Falta 'cifras'.");
  else for (const [clave, nombre] of Object.entries(cifras)) {
    if (!CIFRA.test(clave)) e.push(`La cifra '${clave}' tiene que ir en minúsculas (letras, números y _).`);
    if (!esTexto(nombre)) e.push(`La cifra '${clave}' necesita un nombre.`);
  }
  const conocida = (c: unknown) => typeof c === "string" && !!cifras && Object.hasOwn(cifras, c);
  if (p.abiertos !== undefined && !conocida(p.abiertos)) e.push(`'abiertos' tiene que ser una de las 'cifras'.`);
  if (!Array.isArray(p.bloques) || p.bloques.length === 0) e.push("Faltan 'bloques'.");
  else {
    const ids = new Set<string>();
    for (const b of p.bloques as Bloque[]) {
      const quien = `Bloque '${b?.id ?? "?"}'`;
      if (!esTexto(b?.id) || !ID.test(b.id)) e.push(`${quien}: 'id' en minúsculas y con guiones.`);
      else if (ids.has(b.id)) e.push(`${quien}: id repetido.`);
      else ids.add(b.id);
      if (!TIPOS_BLOQUE.includes(b?.tipo)) {
        e.push(`${quien}: tipo desconocido (${TIPOS_BLOQUE.join(", ")}).`);
        continue;
      }
      if (!esTexto(b.titulo)) e.push(`${quien}: falta 'titulo'.`);
      if (b.tipo === "semaforo" && !(["verde", "ambar", "rojo", "gris"] as const).every((c) => esTexto(b.textos?.[c])))
        e.push(`${quien}: 'textos' necesita verde, ambar, rojo y gris.`);
      if (b.tipo === "cifras") {
        if (!Array.isArray(b.elementos) || b.elementos.length === 0) e.push(`${quien}: faltan 'elementos'.`);
        else for (const el of b.elementos) {
          if (!esTexto(el.etiqueta)) e.push(`${quien}: un elemento sin 'etiqueta'.`);
          if (el.calculo === "suma_mes" || el.calculo === "ultima_fecha" || el.calculo === "actual") {
            if (!conocida(el.cifra)) e.push(`${quien}: la cifra '${el.cifra}' no está en 'cifras'.`);
          } else if (el.calculo === "codigos_activos") {
            if (!(Number.isInteger(el.dias) && el.dias > 0 && el.dias <= DIAS_QUE_SE_LEEN))
              e.push(`${quien}: 'dias' entre 1 y ${DIAS_QUE_SE_LEEN} (los días que se leen).`);
          } else e.push(`${quien}: cálculo desconocido (suma_mes, ultima_fecha, actual, codigos_activos).`);
        }
      }
      if (b.tipo === "grafica") {
        if (!conocida(b.cifra)) e.push(`${quien}: la cifra '${b.cifra}' no está en 'cifras'.`);
        if (!(Number.isInteger(b.semanas) && b.semanas >= 2 && b.semanas <= SEMANAS_MAXIMAS))
          e.push(`${quien}: 'semanas' entre 2 y ${SEMANAS_MAXIMAS}.`);
      }
      if (b.tipo === "lista" && b.cifra !== undefined && !conocida(b.cifra)) e.push(`${quien}: la cifra '${b.cifra}' no está en 'cifras'.`);
      if (b.tipo === "avisos" && !(Number.isInteger(b.maximo) && b.maximo > 0 && b.maximo <= 100))
        e.push(`${quien}: 'maximo' entre 1 y 100.`);
    }
  }
  return e.length ? { errores: e } : { producto: p as Producto };
}

export type Catalogo = { productos: Map<string, Producto>; errores: { archivo: string; errores: string[] }[] };

let cache: Catalogo | undefined;

export function cargarProductos(carpeta = join(process.cwd(), "productos")): Catalogo {
  if (cache && carpeta === join(process.cwd(), "productos")) return cache;
  const productos = new Map<string, Producto>();
  const errores: Catalogo["errores"] = [];
  for (const archivo of readdirSync(/*turbopackIgnore: true*/ carpeta).filter((a) => a.endsWith(".json")).sort()) {
    let dato: unknown;
    try {
      dato = JSON.parse(readFileSync(join(/*turbopackIgnore: true*/ carpeta, archivo), "utf8"));
    } catch {
      errores.push({ archivo, errores: ["No es JSON válido."] });
      continue;
    }
    const r = validarProducto(dato);
    if ("errores" in r) errores.push({ archivo, errores: r.errores });
    else if (`${r.producto.id}.json` !== archivo) errores.push({ archivo, errores: [`El archivo tiene que llamarse ${r.producto.id}.json.`] });
    else productos.set(r.producto.id, r.producto);
  }
  const catalogo = { productos, errores };
  if (carpeta === join(process.cwd(), "productos")) cache = catalogo;
  return catalogo;
}

export function producto(id: string): Producto | undefined {
  return cargarProductos().productos.get(id);
}

/** Los bloques que ve un cliente: los que eligió (en el orden del producto), o todos. */
export function bloquesElegidos(p: Producto, elegidos: string[] | null): Bloque[] {
  return elegidos ? p.bloques.filter((b) => elegidos.includes(b.id)) : p.bloques;
}
