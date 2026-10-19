import {
  fechaCorta,
  fechaDeLunes,
  fechaYHora,
  filas,
  porSemana,
  problemas,
  semaforo,
  valorDe,
  type Aviso,
  type Fila,
} from "@/lib/calculos";
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
  const color = semaforo(avisos, producto.silencio_horas, ahora, producto.abiertos);
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

/**
 * Columnas por semana. Una sola serie, así que sin leyenda: el título dice qué
 * es. Columnas finas (24 px como mucho) con la punta redondeada, el valor
 * escrito solo en la semana de ahora y en la más alta, y el resto al pasar el
 * ratón o con el teclado; además, todos los datos en una tabla.
 */
function Grafica({ bloque, avisos, ahora }: Props & { bloque: Extract<Bloque, { tipo: "grafica" }> }) {
  const semanas = porSemana(avisos, bloque.cifra, bloque.semanas, ahora);
  const maximo = Math.max(...semanas.map((x) => x.total));
  const iMax = semanas.findIndex((x) => x.total === maximo);
  const nombre = (x: (typeof semanas)[number]) => (x.enCurso ? "Esta semana" : `Semana del ${fechaDeLunes(x.lunes)}`);
  return (
    <Caja titulo={bloque.titulo}>
      {maximo === 0 ? (
        <p className="text-texto-suave">Aún no hay datos para la gráfica.</p>
      ) : (
        <>
          <div role="group" aria-label={bloque.titulo} className="flex h-40 items-end gap-0.5 border-b border-borde">
            {semanas.map((x, i) => {
              const conValor = x.enCurso || i === iMax;
              return (
                <div
                  key={i}
                  role="img"
                  aria-label={`${nombre(x)}: ${x.total}`}
                  tabIndex={0}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                >
                  {conValor && x.total > 0 && (
                    <span aria-hidden className="mb-1 text-xs tabular-nums text-texto-suave">
                      {x.total}
                    </span>
                  )}
                  <div
                    className="w-full max-w-6 rounded-t bg-grafica group-hover:brightness-110 group-focus:brightness-110"
                    style={{ height: `${(x.total / maximo) * 85}%` }}
                  />
                  <div aria-hidden className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md border border-borde bg-superficie px-2 py-1 text-xs shadow group-hover:block group-focus:block">
                    <strong className="tabular-nums">{x.total}</strong> <span className="text-texto-suave">· {nombre(x)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div aria-hidden className="mt-1 flex gap-0.5">
            {semanas.map((x, i) => (
              <span key={i} className="flex-1 whitespace-nowrap text-center text-[11px] leading-tight text-texto-suave">
                {/* En pantallas estrechas, una fecha sí y otra no (contando desde «ahora»), para que no se monten. */}
                <span className={(semanas.length - 1 - i) % 2 === 0 ? "" : "hidden sm:inline"}>
                  {x.enCurso ? "ahora" : fechaDeLunes(x.lunes)}
                </span>
              </span>
            ))}
          </div>
        </>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-texto-suave">Ver los datos</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-texto-suave">
            <tr>
              <th className="py-1 pr-4 font-medium">Semana</th>
              <th className="py-1 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((x, i) => (
              <tr key={i} className="border-t border-borde">
                <td className="py-1 pr-4">{nombre(x)}{x.enCurso && " (a medias)"}</td>
                <td className="py-1 text-right tabular-nums">{x.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Caja>
  );
}

function Lista({ bloque, producto, avisos, ahora }: Props & { bloque: Extract<Bloque, { tipo: "lista" }> }) {
  const renglones = filas(avisos, bloque.cifra, ahora, producto.abiertos);
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
                    {f.estado === "revisar" && !!f.pendientes && ` (${f.pendientes})`}
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
          case "grafica":
            return <Grafica key={b.id} bloque={b} {...p} />;
          case "lista":
            return <Lista key={b.id} bloque={b} {...p} />;
          case "avisos":
            return <Avisos key={b.id} bloque={b} {...p} />;
        }
      })}
    </div>
  );
}
