"use client";

import { useState } from "react";

/**
 * Pide el enlace a Better Auth. Siempre dice lo mismo, tenga cuenta o no el
 * correo: así nadie puede usar este formulario para averiguar quién es cliente.
 */
export function FormularioEntrar() {
  const [estado, setEstado] = useState<"" | "mandando" | "hecho" | "error">("");

  async function pedir(datos: FormData) {
    setEstado("mandando");
    try {
      const r = await fetch("/api/auth/sign-in/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(datos.get("correo") ?? "").trim(), callbackURL: "/", errorCallbackURL: "/entrar?error=1" }),
      });
      // 429: demasiados intentos. El resto (también «no existe»), el mismo mensaje.
      setEstado(r.status === 429 ? "error" : "hecho");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "hecho")
    return (
      <p role="status" className="rounded-lg bg-verde-fondo px-4 py-3">
        Si ese correo tiene acceso, te acaba de llegar un enlace. Mira también en spam.
      </p>
    );

  return (
    <form action={pedir} className="space-y-3">
      <label htmlFor="correo" className="block text-sm font-medium">
        Tu correo
      </label>
      <input
        id="correo"
        name="correo"
        type="email"
        required
        autoComplete="email"
        className="w-full rounded-lg border border-borde bg-superficie px-3 py-2"
      />
      <button disabled={estado === "mandando"} className="w-full rounded-lg bg-acento px-4 py-2 font-medium text-sobre-acento">
        {estado === "mandando" ? "Mandando…" : "Mandarme el enlace"}
      </button>
      {estado === "error" && (
        <p role="alert" className="text-rojo">
          No se ha podido mandar ahora. Espera un minuto y prueba otra vez.
        </p>
      )}
    </form>
  );
}
