---
name: cosmerito-web-nueva
description: Úsala al empezar la web de un cliente nuevo de Jordi, o al rehacer una desde cero, en un repo conectado a Cosmerito. Pregunta lo necesario, deja el encargo por escrito, prepara el ROADMAP pensando en que lo leerá el cliente y marca lo mínimo que toda web de cliente debe llevar.
---

# Empezar la web de un cliente

1. **Pregunta antes de escribir código**, y no te inventes las respuestas:
   para quién es, qué tiene que conseguir la web (llamadas, reservas,
   ventas, presencia), qué contenido hay ya (textos, fotos, logo), qué
   dominio, y si hay una fecha que importe.
2. **`docs/brief.md`:** lo acordado, escrito para que Jordi se lo pueda
   enseñar al cliente tal cual.
3. **`ROADMAP.md` por fases**, con títulos `## Fase N — …` y casillas
   pequeñas `- [ ]`. El cliente verá la fase en curso: escríbela en su
   idioma. Un orden que suele servir:
   - Fase 0 — Encargo y bocetos
   - Fase 1 — Estructura y contenido
   - Fase 2 — Diseño
   - Fase 3 — Publicar (dominio, formulario, buscadores)
   - Fase 4 — Mantenimiento
4. **`hub.json`:** tipo `web-cliente`; `"cliente": { "negocio": "…", "sigilo": true }` hasta
   que Jordi diga que se puede enseñar; las fechas acordadas en `hitos`; y,
   en cuanto se publique, `despliegue.url` y `despliegue.salud` para que
   Cosmerito la vigile.
5. **Lo mínimo de toda web de cliente** (casillas en su fase):
   - Se ve bien en el móvil antes que en el ordenador.
   - Accesible: contraste suficiente, textos alternativos en las fotos y
     se puede usar solo con el teclado.
   - Rápida: imágenes en tamaño y formato ligeros.
   - Título, descripción y vista previa para buscadores y para compartir.
   - Página de «no encontrado» (404).
   - Aviso legal y privacidad si recoge datos; aviso de cookies solo si
     las usa.
6. **Diseño:** cada elección tiene que servir a algo del negocio del cliente.
   Nada de adornos de plantilla que valdrían para cualquier web.
7. **Al terminar el turno**, usa `cosmerito-cerrar-turno`.

_Skill de Cosmerito, versión 2. El punto 6 sale de la skill
«no-ai-design-slop» de MengTo/Skills (licencia MIT)._
