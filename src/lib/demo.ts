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
    for (let d = callado; d < 62; d += cada) {
      const facturas = 1 + ((i * 7 + d * 3) % 5);
      avisos.push({
        codigo,
        ok: true,
        texto: `${facturas} ${facturas === 1 ? "factura archivada" : "facturas archivadas"}`,
        cifras: { facturas, pendientes: 0 },
        recibido_en: hace(d, 2 + (i % 6)),
      });
    }
  });

  // Un problema abierto: al 023 le llegó un PDF que no se puede leer, y en la
  // pasada siguiente, aunque archivó bien otras dos, sigue quedando una por revisar.
  avisos.push({ codigo: "023", ok: false, texto: "Una factura llegó en un PDF sin texto: hay que mirarla a mano", cifras: {}, recibido_en: hace(0, 3) });
  avisos.push({ codigo: "023", ok: true, texto: "2 facturas archivadas", cifras: { facturas: 2, pendientes: 1 }, recibido_en: hace(0, 1) });
  // Uno ya resuelto: el 007 tuvo un proveedor nuevo; se dio de alta y su cola quedó a 0.
  avisos.push({ codigo: "007", ok: false, texto: "Factura de un proveedor nuevo: falta darle el visto bueno", cifras: {}, recibido_en: hace(4, 1) });
  // El envío mensual a la gestoría (sin código: es de todo el buzón).
  const dia = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", day: "numeric" }).format(ahora));
  const desdeElDia3 = dia >= 3 ? dia - 3 : dia + 27;
  avisos.push({ codigo: null, ok: true, texto: "Envío mensual a la gestoría hecho", cifras: { enviadas: 143 }, recibido_en: hace(desdeElDia3, 0) });

  return avisos;
}

/**
 * Datos de prueba del vigía de web («Tu web»): una comprobación por hora
 * durante 62 días (en la vida real, cada 15 minutos), con dos caídas cortas.
 * Siempre los mismos, contados hacia atrás desde `ahora`.
 */
export function avisosVigiaDemo(ahora: Date): Aviso[] {
  const avisos: Aviso[] = [];
  const caidas = new Set([16 * 24 + 3, 16 * 24 + 4, 38 * 24 + 10]); // horas atrás en que la web no respondió
  for (let h = 0; h < 62 * 24; h++) {
    const recibido_en = new Date(ahora.getTime() - h * 3_600_000 - 7 * 60_000);
    if (caidas.has(h)) {
      avisos.push({ codigo: null, ok: false, texto: "Tu web no responde", cifras: { comprobaciones: 1, caidas: 1 }, recibido_en });
    } else {
      const ms = 180 + ((h * 37) % 240);
      avisos.push({ codigo: null, ok: true, texto: "Tu web responde", cifras: { comprobaciones: 1, ms }, recibido_en });
    }
  }
  return avisos;
}
