---
name: cosmerito-revisar-web
description: Úsala cuando Jordi pida revisar, auditar o dar un repaso a una web (la de este repo o la de un cliente) y dejar un informe que se pueda enseñar al cliente. Mira la web de verdad, apunta cada fallo con su prueba y convierte lo que haya que arreglar en casillas del ROADMAP. No arregla nada sin que Jordi lo pida.
---

# Revisar una web

La revisión es un servicio en sí: el informe tiene que poder enseñarse al
cliente. No arregles nada durante la revisión, salvo que Jordi lo pida.

1. **Mírala de verdad:** la web publicada (`despliegue.url` de `hub.json`) y
   su código. Si tienes navegador (Playwright y Chromium), ábrela en
   ordenador y en móvil (390 px de ancho), y en tema claro y oscuro si lo
   tiene.
2. **Revisa:**
   - **Que funciona:** enlaces rotos, formularios, página 404, errores en
     la consola del navegador.
   - **Accesibilidad:** pasa axe si puedes; contraste, textos
     alternativos, uso con teclado.
   - **Rapidez:** peso de las imágenes y cuánto tarda en verse.
   - **Buscadores:** título, descripción, un solo `h1`, sitemap y vista
     previa para compartir.
   - **Legal:** aviso legal, privacidad y cookies si las usa.
   - **Seguridad básica:** https, y nada secreto en el código público.
3. **Cada hallazgo con su prueba:** dónde está, qué pasa y cómo comprobarlo.
   Nada de «podría fallar».
4. **El informe, en `docs/revision-AAAA-MM-DD.md`**, en dos partes:
   - **Para el cliente:** qué gana si se arregla, sin jerga.
   - **Para Jordi:** el detalle técnico y el esfuerzo de cada arreglo
     (poco, medio o mucho).
   Cosmerito enseña ese documento en la sección Negocio del proyecto.
5. **Lo que haya que arreglar**, como casillas `- [ ]` en `ROADMAP.md`, en
   una fase «Mejoras tras la revisión», escritas para el cliente.
6. **Al terminar**, usa `cosmerito-cerrar-turno`.

_Skill de Cosmerito, versión 2._
