import Link from "next/link";

export default function NoEncontrada() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-3 text-2xl font-semibold">Esta página no existe</h1>
      <p className="mb-4 text-texto-suave">Puede que el enlace esté mal copiado o que ya no esté disponible.</p>
      <Link href="/" className="text-acento underline">
        Volver al inicio
      </Link>
    </main>
  );
}
