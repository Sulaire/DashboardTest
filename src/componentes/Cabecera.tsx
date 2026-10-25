import Link from "next/link";
import { salir } from "@/app/acciones";
import { MARCA } from "@/lib/marca";

export function Cabecera({ cliente, conSalir = true, admin = false }: { cliente?: string | null; conSalir?: boolean; admin?: boolean }) {
  return (
    <header className="border-b border-borde bg-superficie">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="font-semibold">{MARCA.nombre}</p>
          {cliente && <p className="text-sm text-texto-suave">{cliente}</p>}
        </div>
        {/* Solo si hay algo dentro: en la demo no hay nada, y un «menú» vacío
            confunde a quien navega con lector de pantalla. */}
        {(admin || conSalir) && (
          <nav aria-label="Cuenta" className="flex items-center gap-4 text-sm">
            {admin && (
              <Link href="/admin" className="text-acento underline-offset-4 hover:underline">
                Administración
              </Link>
            )}
            {conSalir && (
              <form action={salir}>
                <button className="text-texto-suave underline-offset-4 hover:underline">Salir</button>
              </form>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

/** Las pestañas: una por producto contratado. */
export function Pestanas({ lista, actual, base }: { lista: { id: string; nombre: string }[]; actual: string; base: string }) {
  if (lista.length < 2) return null;
  return (
    <nav aria-label="Productos" className="mb-5 flex gap-2 overflow-x-auto">
      {lista.map((p) => (
        <Link
          key={p.id}
          href={`${base}${base.includes("?") ? "&" : "?"}p=${p.id}`}
          aria-current={p.id === actual ? "page" : undefined}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
            p.id === actual ? "bg-acento text-sobre-acento" : "bg-superficie-2 text-texto"
          }`}
        >
          {p.nombre}
        </Link>
      ))}
    </nav>
  );
}
