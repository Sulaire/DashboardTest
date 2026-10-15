/** Lo que se enseña cuando falta configuración: qué falta y para qué sirve, en vez de romperse. */
export function Faltan({ lista }: { lista: string[] }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-3 text-2xl font-semibold">Falta configurar el panel</h1>
      <p className="mb-4 text-texto-suave">Pon estas variables de entorno (en Railway: pestaña Variables del servicio) y vuelve a cargar:</p>
      <ul className="list-disc space-y-2 pl-5">
        {lista.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <p className="mt-6 text-texto-suave">
        Mientras, la demo con datos inventados funciona: <a className="text-acento underline" href="/demo">/demo</a>.
      </p>
    </main>
  );
}
