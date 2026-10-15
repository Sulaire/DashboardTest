import { fechaCorta, fechaYHora, filas, problemas, semaforo, valorDe, type Aviso, type Fila } from "@/lib/calculos";
import type { Bloque, Color, Producto } from "@/lib/productos/tipos";

/**
 * Los bloques que valen para cualquier producto: semáforo, cifras, lista y
 * avisos. Cada uno lee su parte de la descripción del producto y los avisos.
 * Un bloque nuevo se añade aquí y desde entonces sirve para todos.
 */

const ESTADO_FILA: Record<Fila["estado"], { color: Color; texto: string }> = {
  bien: { color: "verde", texto: "Bien" },
  revisar: { color: "ambar", texto: "Revisar" },
  quieto: { color: "gris", texto: "Sin movimiento" },
};

const ESTILO: Record<Color, { punto: string; fondo: string; texto: string; nombre: string }> = {
  verde: { punto: "bg-verde", fondo: "bg-verde-fondo", texto: "text-verde", nombre: "Bien" },
  ambar: { punto: "bg-ambar", fondo: "bg-ambar-fondo", texto: "text-ambar", nombre: "Revisar" },
  rojo: { punto: "bg-rojo", fondo: "bg-rojo-fondo", texto: "text-rojo", nombre: "Sin noticias" },
  gris: { punto: "bg-gris", fondo: "bg-gris-fondo", texto: "text-gris", nombre: "Sin datos" },
};

function Caja({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-borde bg-superficie p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-texto-suave">{titulo}</h2>
      {children}
    </section>
  );
}

function Punto({ color }: { color: Color }) {
  return <span aria-hidden className={`inline-block size-3 shrink-0 rounded-full ${ESTILO[color].punto}`} />;
}

function Semaforo({ bloque, producto, avisos, ahora }: Props & { bloque: Extract<Bloque, { tipo: "semaforo" }> }) {
  const color = semaforo(avisos, producto.silencio_horas, ahora);
  const e = ESTILO[color];
  return (
    <section className={`flex items-center gap-4 rounded-xl border border-borde p-5 ${e.fondo}`}>
      <span aria-hidden className={`inline-block size-6 shrink-0 rounded-full ${e.punto}`} />
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">{bloque.titulo}</h2>
        <p className={`text-lg font-semibold ${e.texto}`}>
          <span className="sr-only">{e.nombre}: </span>
          {bloque.textos[color]}
        </p>
      </div>
    </section>
  );
}

function Cifras({ bloque, avisos, ahora }: Props & { bloque: Extract<Bloque, { tipo: "cifras" }> }) {
  return (
    <Caja titulo={bloque.titulo}>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {bloque.elementos.map((el) => (
          <div key={el.etiqueta} className="rounded-lg bg-superficie-2 p-4">
            <dt className="text-sm text-texto-suave">{el.etiqueta}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">{valorDe(el, avisos, ahora)}</dd>
          </div>
        ))}
      </dl>
    </Caja>
  );
}

function Lista({ bloque, producto, avisos, ahora }: Props & { bloque: Extract<Bloque, { tipo: "lista" }> }) {
  const renglones = filas(avisos, bloque.cifra, ahora);
  if (renglones.length === 0)
    return (
      <Caja titulo={bloque.titulo}>
        <p className="text-texto-suave">Aún no hay nada que enseñar.</p>
      </Caja>
    );
  return (
    <Caja titulo={bloque.titulo}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-texto-suave">
            <tr className="border-b border-borde">
              <th className="py-2 pr-4 font-medium">{producto.codigos}</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
              {bloque.cifra && <th className="py-2 pr-4 text-right font-medium">{producto.cifras[bloque.cifra]} (mes)</th>}
              <th className="py-2 font-medium">Último aviso</th>
            </tr>
          </thead>
          <tbody>
            {renglones.map((f) => (
              <tr key={f.codigo} className="border-b border-borde last:border-0">
                <td className="py-2 pr-4 font-mono font-medium">{f.codigo}</td>
                <td className="py-2 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <Punto color={ESTADO_FILA[f.estado].color} />
                    {ESTADO_FILA[f.estado].texto}
                  </span>
                </td>
                {bloque.cifra && <td className="py-2 pr-4 text-right tabular-nums">{f.delMes}</td>}
                <td className="py-2 text-texto-suave">{fechaCorta(f.ultimo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Caja>
  );
}

function Avisos({ bloque, producto, avisos }: Props & { bloque: Extract<Bloque, { tipo: "avisos" }> }) {
  const lista = problemas(avisos, bloque.maximo);
  return (
    <Caja titulo={bloque.titulo}>
      {lista.length === 0 ? (
        <p className="text-texto-suave">Ningún aviso en los últimos días.</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((a, i) => (
            <li key={i} className="flex gap-3">
              <Punto color="ambar" />
              <div className="-mt-1">
                <p>{a.texto}</p>
                <p className="text-sm text-texto-suave">
                  {a.codigo && `${producto.codigos} ${a.codigo} · `}
                  {fechaYHora(a.recibido_en)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Caja>
  );
}

type Props = { producto: Producto; avisos: Aviso[]; ahora: Date };

export function Pestana({ producto, bloques, avisos, ahora }: Props & { bloques: Bloque[] }) {
  return (
    <div className="space-y-5">
      {bloques.map((b) => {
        const p = { producto, avisos, ahora };
        switch (b.tipo) {
          case "semaforo":
            return <Semaforo key={b.id} bloque={b} {...p} />;
          case "cifras":
            return <Cifras key={b.id} bloque={b} {...p} />;
          case "lista":
            return <Lista key={b.id} bloque={b} {...p} />;
          case "avisos":
            return <Avisos key={b.id} bloque={b} {...p} />;
        }
      })}
    </div>
  );
}
