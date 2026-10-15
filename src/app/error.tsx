"use client";

/** Si algo falla (p. ej. la base de datos no responde), un mensaje claro en vez de una página en blanco. */
export default function ErrorDePagina({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-3 text-2xl font-semibold">Algo no ha ido bien</h1>
      <p className="mb-4 text-texto-suave">Puede que el servidor esté arrancando. Prueba otra vez en unos segundos.</p>
      <button onClick={reset} className="rounded-lg bg-acento px-4 py-2 text-sobre-acento">
        Reintentar
      </button>
    </main>
  );
}
