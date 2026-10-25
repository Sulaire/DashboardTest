import type { Metadata } from "next";
import { MARCA } from "@/lib/marca";
import "./globals.css";

export const metadata: Metadata = {
  // Cada página pone su nombre delante («Entrar · Panel de clientes»): es lo
  // primero que dice el lector de pantalla al llegar y lo que se ve en la pestaña.
  title: { default: MARCA.nombre, template: `%s · ${MARCA.nombre}` },
  description: "Cómo van tus productos: semáforo, cifras y avisos.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
