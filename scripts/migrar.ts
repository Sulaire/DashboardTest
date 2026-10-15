// Aplica las migraciones pendientes a mano. No suele hacer falta: la app
// las aplica sola la primera vez que usa la base de datos.
import pg from "pg";
import { migrar } from "@/lib/db";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Falta DATABASE_URL.");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: url });
const aplicadas = await migrar(pool);
console.log(aplicadas.length ? `Aplicadas: ${aplicadas.join(", ")}` : "No había migraciones pendientes.");
await pool.end();
