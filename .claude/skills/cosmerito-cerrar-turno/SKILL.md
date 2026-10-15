---
name: cosmerito-cerrar-turno
description: Úsala al terminar un encargo en un repo conectado a Cosmerito (el HUB de proyectos de Jordi), antes de dar el turno por acabado. Deja el ROADMAP, hub.json y las notas al día, comprueba que todo pasa, sube el trabajo y le explica a Jordi lo hecho en español sencillo y con pruebas.
---

# Cerrar el turno

Jordi gestiona todos sus proyectos desde Cosmerito, que lee este repo: si el
repo no dice la verdad al acabar, el HUB tampoco. Haz esto, en orden:

1. **Comprueba que funciona.** Pasa lo que el repo tenga (lint, pruebas,
   build) y, si es una web, ábrela. Si algo falla, arréglalo o dilo claro.
   No digas «funciona» de lo que no has visto funcionar.
2. **`ROADMAP.md`:** marca `- [x]` lo hecho y añade `- [ ]` para lo pendiente
   que hayas descubierto. Jordi puede enseñarle al cliente la fase en curso
   y la siguiente («Estado de tu web»): escríbelas para alguien que no
   programa (qué gana, no cómo se hace) y sin nada interno (fallos de
   seguridad, contraseñas, precios, otros clientes).
3. **`hub.json`:** si cambiaron la fase, el estado, las URLs o alguna fecha
   (`hitos`), actualízalo, y pon `actualizado` a la fecha de hoy.
4. **`NOTAS_PARA_CLAUDE.md`:** marca `- [x]` las notas que hayas hecho.
5. **Precios:** si tocaste alguno, dale a Jordi el bloque «Negocio para
   Cosmerito» (está en `CLAUDE.md`). Nunca en un archivo del repo.
6. **Sube:** commit con la línea `Claude-Session:` y push. Si quedan commits
   fuera de la rama principal, dilo para que Jordi los fusione.
7. **Explícaselo a Jordi**, que está aprendiendo a programar. Frases cortas,
   sin jerga, y define cualquier palabra técnica que uses:
   - **Qué cambió.**
   - **Por qué importa.**
   - **Cómo comprobarlo** él mismo.
   - **Qué queda** y qué no pudiste comprobar. Separa lo que viste con tus
     ojos de lo que supones.

_Skill de Cosmerito, versión 2. El formato del paso 7 sale de la skill
«audit-verify-explain-grade-5» de MengTo/Skills (licencia MIT)._
