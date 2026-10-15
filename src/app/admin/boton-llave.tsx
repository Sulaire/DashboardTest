"use client";

import { useActionState } from "react";
import { nuevaLlave } from "./acciones";

/** Crea una llave y la enseña esta única vez (solo se guarda su huella). */
export function BotonLlave({ contratacion, hayLlave }: { contratacion: string; hayLlave: boolean }) {
  const [llave, accion, pendiente] = useActionState(nuevaLlave, null);
  return (
    <form action={accion} className="space-y-2">
      <input type="hidden" name="contratacion" value={contratacion} />
      <button disabled={pendiente} className="rounded-lg bg-superficie-2 px-3 py-1.5 text-sm">
        {hayLlave ? "Cambiar la llave (anula la de ahora)" : "Crear la llave"}
      </button>
      {llave && (
        <div role="status" className="rounded-lg border border-borde bg-ambar-fondo p-3 text-sm">
          <p className="mb-1 font-medium">Cópiala ahora: no se volverá a enseñar.</p>
          <code className="block break-all font-mono">{llave}</code>
          <p className="mt-1 text-texto-suave">Va en n8n como credencial (Header Auth: Authorization = Bearer + la llave).</p>
        </div>
      )}
    </form>
  );
}
