"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as admin from "@/lib/admin";
import { limpiarAviso } from "@/lib/avisos";
import { config } from "@/lib/config";
import { producto } from "@/lib/productos/cargar";
import { quienSoy } from "@/lib/sesion";

/**
 * Las acciones del panel de administrador. Por debajo son rutas públicas:
 * cada una comprueba primero que quien llama es el administrador.
 */

async function exigirAdmin() {
  const yo = await quienSoy();
  if (!yo?.esAdmin) throw new Error("Solo el administrador puede hacer esto.");
}

const texto = (d: FormData, campo: string) => String(d.get(campo) ?? "");

export async function crearCliente(datos: FormData) {
  await exigirAdmin();
  await admin.crearCliente(texto(datos, "nombre"));
  revalidatePath("/admin");
}

export async function anadirPersona(datos: FormData) {
  await exigirAdmin();
  await admin.anadirPersona(texto(datos, "cliente"), texto(datos, "correo"));
  revalidatePath("/admin");
}

export async function quitarPersona(datos: FormData) {
  await exigirAdmin();
  await admin.quitarPersona(texto(datos, "cliente"), texto(datos, "usuario"), config.correoAdmin);
  revalidatePath("/admin");
}

/** Borra el cliente entero; hay que escribir su nombre para confirmarlo. */
export async function borrarCliente(datos: FormData) {
  await exigirAdmin();
  const cliente = (await admin.listarClientes()).find((c) => c.id === texto(datos, "cliente"));
  if (!cliente) throw new Error("Ese cliente no existe.");
  if (texto(datos, "confirmacion").trim() !== cliente.nombre) redirect("/admin?error=confirmacion");
  await admin.borrarCliente(cliente.id, config.correoAdmin);
  revalidatePath("/admin");
}

export async function contratar(datos: FormData) {
  await exigirAdmin();
  await admin.contratar(texto(datos, "cliente"), texto(datos, "producto"));
  revalidatePath("/admin");
}

export async function cambiarActiva(datos: FormData) {
  await exigirAdmin();
  await admin.cambiarActiva(texto(datos, "contratacion"), texto(datos, "activa") === "si");
  revalidatePath("/admin");
}

export async function elegirBloques(datos: FormData) {
  await exigirAdmin();
  const elegidos = datos.getAll("bloque").map(String);
  // Sin ningún bloque, el cliente vería su pestaña vacía: no se guarda.
  if (elegidos.length === 0) redirect("/admin?error=bloques");
  await admin.elegirBloques(texto(datos, "contratacion"), elegidos);
  revalidatePath("/admin");
}

export async function anularLlaves(datos: FormData) {
  await exigirAdmin();
  await admin.anularLlaves(texto(datos, "contratacion"));
  revalidatePath("/admin");
}

/** Devuelve la llave nueva para enseñarla una vez. */
export async function nuevaLlave(_antes: string | null, datos: FormData): Promise<string | null> {
  await exigirAdmin();
  const llave = await admin.nuevaLlaveProducto(texto(datos, "contratacion"));
  revalidatePath("/admin");
  return llave;
}

export type ResultadoPrueba = { ok: boolean; mensaje: string; limpio?: string } | null;

/**
 * Prueba un aviso con el mismo filtro que /api/avisos, sin guardarlo: para
 * montar un flujo de n8n sin ensuciar los datos de ningún cliente.
 */
export async function probarAviso(_antes: ResultadoPrueba, datos: FormData): Promise<ResultadoPrueba> {
  await exigirAdmin();
  const p = producto(texto(datos, "producto"));
  if (!p) return { ok: false, mensaje: "Ese producto no existe en productos/." };
  const crudo = texto(datos, "aviso");
  if (crudo.length > 8_192) return { ok: false, mensaje: "Demasiado largo: /api/avisos no acepta más de 8 KB." };
  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(crudo);
  } catch {
    return { ok: false, mensaje: "No es JSON válido (¿comillas dobles, comas de más?)." };
  }
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) return { ok: false, mensaje: "Tiene que ser un objeto JSON: { … }." };
  const r = limpiarAviso(cuerpo as Record<string, unknown>, p);
  if ("error" in r) return { ok: false, mensaje: `El panel lo rechazaría (400): ${r.error}` };
  return { ok: true, mensaje: "El panel lo aceptaría. Se guardaría así:", limpio: JSON.stringify(r.aviso, null, 2) };
}
