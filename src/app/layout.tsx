import type { Metadata } from "next";
import { MARCA } from "@/lib/marca";
import "./globals.css";

export const metadata: Metadata = {
  title: MARCA.nombre,
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
