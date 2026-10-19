"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as admin from "@/lib/admin";
import { config } from "@/lib/config";
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
  await admin.elegirBloques(texto(datos, "contratacion"), datos.getAll("bloque").map(String));
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
