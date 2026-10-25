import Link from "next/link";
import { connection } from "next/server";
import { parametrosValidos } from "@/lib/enlace";
import { MARCA } from "@/lib/marca";

/**
 * La página a la que lleva el enlace del correo: un botón que entra. El enlace
 * es de un solo uso, y los programas que revisan los correos de empresa lo
 * abrirían antes que tú; así solo se gasta al pulsar (src/lib/enlace.ts).
 */
export default async function Confirmar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const parametros = parametrosValidos(await searchParams);
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="mb-1 text-sm text-texto-suave">{MARCA.nombre}</p>
      {parametros ? (
        <>
          <h1 className="mb-3 text-2xl font-semibold">Entrar a tu panel</h1>
          <p className="mb-6 text-texto-suave">Pulsa el botón para entrar. El enlace solo vale una vez.</p>
          <form method="get" action="/api/auth/magic-link/verify">
            {Object.entries(parametros).map(([nombre, valor]) => (
              <input key={nombre} type="hidden" name={nombre} value={valor} />
            ))}
            <button className="w-full rounded-lg bg-acento px-4 py-2 font-medium text-sobre-acento">Entrar</button>
          </form>
          <p className="mt-6 text-sm text-texto-suave">
            Este paso está para que los programas que revisan los correos no gasten tu enlace antes que tú.
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-3 text-2xl font-semibold">Este enlace no está completo</h1>
          <p className="mb-6 text-texto-suave">Puede que se haya cortado al copiarlo. Pide otro y ábrelo desde el correo.</p>
          <Link href="/entrar" className="text-acento underline">
            Pedir otro enlace
          </Link>
        </>
      )}
    </main>
  );
}
