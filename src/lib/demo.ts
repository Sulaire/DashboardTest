import type { Aviso } from "@/lib/calculos";

/**
 * Datos de prueba para la demo (/demo): doce clientes inventados de una
 * gestoría inventada. Siempre los mismos (no hay azar), contados hacia atrás
 * desde `ahora`, para que la demo parezca viva cualquier día que se abra.
 */
export function avisosDeDemo(ahora: Date): Aviso[] {
  const avisos: Aviso[] = [];
  const hace = (dias: number, horas = 0) => new Date(ahora.getTime() - dias * 86_400_000 - horas * 3_600_000);
  const codigos = ["001", "002", "003", "005", "007", "008", "011", "012", "014", "017", "021", "023"];

  codigos.forEach((codigo, i) => {
    // Cada cliente manda un aviso cada 1-3 días con las facturas que se archivaron.
    const cada = 1 + (i % 3);
    const callado = codigo === "021" ? 33 : 0; // uno que lleva un mes sin facturas (no cuenta como activo)
    for (let d = callado; d < 38; d += cada) {
      const facturas = 1 + ((i * 7 + d * 3) % 5);
      avisos.push({
        codigo,
        ok: true,
        texto: `${facturas} ${facturas === 1 ? "factura archivada" : "facturas archivadas"}`,
        cifras: { facturas },
        recibido_en: hace(d, 2 + (i % 6)),
      });
    }
  });

  // Un problema abierto: el último aviso del 023 es un PDF que no se puede leer.
  avisos.push({ codigo: "023", ok: false, texto: "Una factura llegó en un PDF ilegible: revísala en el Drive", cifras: { problemas: 1 }, recibido_en: hace(0, 1) });
  // Uno ya resuelto: el 007 tuvo un remitente desconocido, y después llegó bien.
  avisos.push({ codigo: "007", ok: false, texto: "Factura de un remitente desconocido: falta darlo de alta", cifras: { problemas: 1 }, recibido_en: hace(4, 1) });
  // El envío mensual a la gestoría (sin código: es de todo el buzón).
  const dia = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", day: "numeric" }).format(ahora));
  const desdeElDia3 = dia >= 3 ? dia - 3 : dia + 27;
  avisos.push({ codigo: null, ok: true, texto: "Envío mensual a la gestoría hecho", cifras: { enviadas: 143 }, recibido_en: hace(desdeElDia3, 0) });

  return avisos;
}
