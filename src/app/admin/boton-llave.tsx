"use client";

import { useActionState } from "react";
import { nuevaLlave } from "./acciones";

/** Crea una llave y la enseña esta única vez (solo se guarda su huella). */
export function BotonLlave({ contratacion, hayLlave, direccion }: { contratacion: string; hayLlave: boolean; direccion: string }) {
  const [llave, accion, pendiente] = useActionState(nuevaLlave, null);
  return (
    <form action={accion}>
      <input type="hidden" name="contratacion" value={contratacion} />
      <button disabled={pendiente} className="rounded-lg border border-borde-campo bg-superficie px-3 py-1.5 text-sm">
        {hayLlave ? "Cambiar la llave (anula la de ahora)" : "Crear la llave"}
      </button>
      {/* La zona que avisa está siempre puesta (vacía hasta que hay llave): si
          naciera ya con el texto, algunos lectores de pantalla no lo leerían. */}
      <div role="status">
        {llave && (
          <div className="mt-2 rounded-lg border border-borde bg-ambar-fondo p-3 text-sm">
            <p className="mb-1 font-medium">Cópiala ahora: no se volverá a enseñar.</p>
            <code className="block break-all font-mono">{llave}</code>
            <p className="mt-1 text-texto-suave">
              En n8n: nodo HTTP Request, POST a <code className="font-mono">{direccion}</code>, con una credencial Header Auth
              (nombre Authorization, valor «Bearer » y la llave). Qué mandar: docs/AVISOS.md.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
