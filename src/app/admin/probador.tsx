"use client";

import { useActionState } from "react";
import { probarAviso, type ResultadoPrueba } from "./acciones";

const EJEMPLO = `{
  "producto": "buzon-facturas",
  "cliente": "017",
  "ok": true,
  "texto": "3 facturas archivadas; 1 por revisar",
  "cifras": { "facturas": 3, "pendientes": 1 }
}`;

/** Prueba un aviso con el filtro de /api/avisos sin guardarlo. */
export function Probador({ productos }: { productos: { id: string; nombre: string }[] }) {
  const [resultado, accion, pendiente] = useActionState<ResultadoPrueba, FormData>(probarAviso, null);
  return (
    <form action={accion} className="space-y-3">
      <label className="flex flex-col gap-1 text-sm">
        Producto
        <select name="producto" className="w-fit rounded-lg border border-borde bg-superficie px-3 py-1.5">
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        El aviso, tal cual lo mandaría n8n
        <textarea
          name="aviso"
          rows={8}
          defaultValue={EJEMPLO}
          spellCheck={false}
          className="rounded-lg border border-borde bg-superficie px-3 py-2 font-mono text-sm"
        />
      </label>
      <button disabled={pendiente} className="rounded-lg bg-superficie-2 px-3 py-1.5 text-sm">
        {pendiente ? "Probando…" : "Probar (no se guarda)"}
      </button>
      {resultado && (
        <div role="status" className={`rounded-lg p-3 text-sm ${resultado.ok ? "bg-verde-fondo" : "bg-rojo-fondo text-rojo"}`}>
          <p>{resultado.mensaje}</p>
          {resultado.limpio && <pre className="mt-2 overflow-x-auto font-mono text-xs">{resultado.limpio}</pre>}
        </div>
      )}
    </form>
  );
}
