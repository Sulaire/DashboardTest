import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import pg from "pg";
import { ARCHIVO_ENLACES } from "../playwright.config";

/** Antes de las pruebas: base de datos vacía (la app la vuelve a crear sola) y sin enlaces viejos. */
export default async function preparar() {
  const cliente = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await cliente.connect();
  await cliente.query("drop schema public cascade; create schema public;");
  await cliente.end();
  mkdirSync(dirname(ARCHIVO_ENLACES), { recursive: true });
  writeFileSync(ARCHIVO_ENLACES, "");
}
