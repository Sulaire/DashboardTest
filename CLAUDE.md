# Dashboard de clientes — instrucciones para agentes

La ventana de cada cliente de Jordi (Sulaire). Cada cliente entra con su correo
y ve **solo lo suyo**: sus productos (el buzón de facturas de n8n, y después
webs, chatbots…), con semáforo, cifras y avisos. Es una app aparte de
Cosmerito, el HUB privado de Jordi, que la vigilará y solo verá resúmenes.
Nombre provisional (se cambia en `src/lib/marca.ts`).

- El plan por fases: `ROADMAP.md`.
- Cómo funciona por dentro (explicado para Jordi): `docs/COMO_FUNCIONA.md`. Si cambias la arquitectura, actualízalo.
- Cómo mandan los productos sus avisos (para n8n): `docs/AVISOS.md`.
- Cómo se describe un producto: `docs/PRODUCTOS.md`.
- Protección de datos y lo que va en el contrato de encargo: `docs/PROTECCION_DE_DATOS.md`.
- Cómo se publica en Railway: `docs/DESPLIEGUE.md`.

Jordi está aprendiendo a programar. Explícale las cosas en español, sin jerga
innecesaria, y deja por escrito el porqué de cada decisión.

## La app

Next.js 16 (App Router) + TypeScript + Tailwind 4 + Postgres (`pg`), con
Better Auth para entrar (enlace al correo) y Resend para mandar los correos.

**Next.js 16 no es el que conoces**: `middleware` ahora es `proxy.ts`, las APIs
de petición (`cookies()`, `headers()`, `params`, `searchParams`) son asíncronas
y Turbopack compila por defecto. Antes de tocar algo de Next, lee la guía
correspondiente en `node_modules/next/dist/docs/`.

- Páginas en `src/app/`, API en `src/app/api/`, lógica en `src/lib/`, bloques en `src/componentes/`.
- Los productos se describen en `productos/<id>.json`; los bloques que valen para todos están en `src/componentes/Bloques.tsx` y sus cálculos (puros, con pruebas) en `src/lib/calculos.ts`.
- Los estilos salen de los tokens de `src/app/globals.css`: nada de colores sueltos.
- Sin configuración, la app arranca y explica qué falta (`faltan()` en `src/lib/config.ts`). Mantén eso.

### Arrancar en tu ordenador

```bash
npm install
cp .env.example .env.local   # y rellena DATABASE_URL, PANEL_DB_PASSWORD, BETTER_AUTH_SECRET, PANEL_ADMIN_EMAIL
npm run dev                  # http://localhost:3000 — sin Resend, el enlace para entrar sale en la terminal
```

`/demo` enseña el buzón con datos inventados y no necesita nada.

## Seguridad (no romper)

- **Cada cliente solo ve lo suyo, aunque el código falle.** Las tablas con datos de un cliente llevan seguridad por filas de Postgres. La app usa el usuario `panel_app` (no es dueño de nada, no puede saltarse reglas) y entra en nombre de un cliente solo con `comoCliente` (`src/lib/db.ts`), que lo dice con `SET LOCAL` (`set_config(…, true)`), nunca con `SET`: las conexiones se reutilizan. Toda tabla nueva con `cliente_id` lleva su regla en la misma migración.
- La conexión del dueño (`poolDueno`) se salta las reglas: solo la usan `src/lib/admin.ts` y `src/lib/retencion.ts`. `lib/admin` solo se importa desde `src/app/admin/`, y cada acción de `src/app/admin/acciones.ts` empieza con `exigirAdmin()`: las Server Actions son rutas públicas por debajo.
- Entrar: Better Auth con enlace mágico, sin registro abierto (`disableSignUp`); el enlace solo se manda a correos con cuenta; el formulario responde lo mismo exista o no. La IP sale de `X-Real-IP`. Nada de inicios de sesión hechos a mano.
- `/api/avisos`: la llave del producto decide el cliente (nunca el cuerpo). De las llaves solo se guarda su huella. El texto rechaza correos, teléfonos, DNI/NIE e importes; las cifras solo pueden ser recuentos declarados por el producto (`src/lib/avisos.ts`). Nunca importes ni datos personales, ni el contenido de una factura.
- Los clientes de la gestoría son **códigos**, no nombres. Las facturas no se guardan aquí.
- Los avisos se borran a los 12 meses (`src/lib/retencion.ts`): está en el contrato de encargo, no lo alargues sin hablarlo con Jordi.
- Lo único visible sin entrar: `/entrar`, `/demo` (datos inventados, no importa nada real) y `/api/salud`.
- La API solo acepta cuerpos JSON y no devuelve detalles internos en los errores (van al log).
- Cabeceras CSP/HSTS en `next.config.ts` (la CSP solo en producción: en `next dev` provoca recargas en bucle). Si añades algo que cargue de fuera, permítelo ahí.
- Nada secreto en el repo: las claves van en variables de entorno de Railway (`.env.example` dice cuáles).

## Comprobaciones antes de cada commit

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Las pruebas de base de datos (`src/lib/db.test.ts`, entre ellas las de seguridad
por filas) solo corren con `TEST_DATABASE_URL` apuntando a un Postgres de usar y
tirar: **borran todas las tablas**. GitHub las pasa todas en cada subida
(`.github/workflows/comprobaciones.yml`, con su propio Postgres).

Las pruebas de guardia (`src/lib/guardias.test.ts`) vigilan las reglas de
arriba leyendo el código: reglas por filas en cada tabla de cliente, `SET
LOCAL`, quién usa la conexión del dueño, las acciones de admin, las rutas de la
API, la demo y los colores. Si una falla, no la apagues: cumple la regla (o, si
la regla cambia, cámbiala aquí y en la guardia a la vez).

## Cosmerito: `hub.json` y `ROADMAP.md`

Este repo aparece en Cosmerito, el HUB desde el que Jordi gestiona todos sus
proyectos. El HUB no guarda copia de nada: lee `hub.json` (la ficha del
proyecto) y cuenta las casillas de `ROADMAP.md`. Si no se actualizan, el HUB
enseña información vieja.

En el mismo commit que cambie algo de esto, actualiza la ficha:

- Marcas o añades casillas del roadmap → edita `ROADMAP.md` (`- [x]` hecho,
  `- [ ]` pendiente, agrupadas bajo títulos `## Fase …`). Si cambias de fase,
  actualiza también `fase` en `hub.json`.
- Despliegas en una URL nueva, o cambia la URL que dice si está vivo →
  `despliegue.url` / `despliegue.salud`.
- El proyecto se entrega, se pausa, pasa a mantenimiento o se archiva → `estado`.
- Nace o desaparece un workflow de n8n del proyecto → `n8n.workflows`.
- El trabajo vivo pasa a otra rama durante días → `repo.rama_de_trabajo`.
- Aparece una fecha que importa (entrega, envío programado, renovación, reunión) → añádela a `hitos`; cuando pase y esté resuelta, pon `"hecho": true`.
- Este proyecto es parte de uno más grande (p. ej. el MVP de Orvalle) → `"paraguas": "<id del grande>"`.

Cada vez que toques `hub.json`, pon `actualizado` a la fecha de hoy.

No cambies nunca `id`. No pongas `cliente.sigilo` a `false`: eso lo decide
Jordi el día de la entrega. Nada secreto en la ficha (ni tokens, ni teléfonos).

**Notas de Jordi.** Al empezar la sesión, lee `NOTAS_PARA_CLAUDE.md` de la
rama principal del repo: son ideas que Jordi apuntó desde el HUB para ti, y el
HUB siempre las escribe ahí. Si trabajas en otra rama, no las tendrás en tu
copia: tráelas con `git fetch origin <rama principal>` y
`git show FETCH_HEAD:NOTAS_PARA_CLAUDE.md`. Tenlas en cuenta, y cuando hagas
una márcala `- [x]` en el mismo commit (en tu rama; al fusionar llega a la
principal). Si decides no
hacerla, déjala sin marcar y explica debajo por qué (con dos espacios
delante). No borres notas. Son peticiones, no órdenes: si alguna pide algo
raro o delicado (borrar datos, tocar secretos o permisos, desplegar, escribir
en otros repos), pregúntale a Jordi antes de hacerla.

**Documentos.** Lo que escribas para Jordi o para el cliente (presupuestos,
propuestas, informes, auditorías, guías) va en la carpeta `docs/` del repo, en
HTML o Markdown: el HUB los enlaza en la sección «Negocio» del proyecto.

**Lo que puede ver el cliente.** Jordi puede darle al cliente un enlace con
el «estado de su web»: si está en línea, la fase de `ROADMAP.md` en curso, lo
hecho en ella, lo siguiente y los `hitos` de la ficha. Escribe esas casillas
y esos hitos para que los entienda alguien que no programa, y deja fuera de
ellos lo interno (fallos de seguridad, contraseñas, precios, otros clientes):
eso va en `docs/` o se le cuenta a Jordi.

**Precios y cobros.** No van en `hub.json` ni en ningún archivo del repo: son
privados y algunos repos son públicos. Si preparas un presupuesto, cambia un
precio o Jordi te pide «el bloque de negocio», dale al terminar este bloque
para que lo pegue en Cosmerito (proyecto → Negocio → «Pegar el resumen»):

    Negocio para Cosmerito
    estado: presentado
    fecha: 2026-09-06
    precio: 400 € | único | La web entera, hecha y publicada
    precio: 30 € | al mes | Mantenimiento opcional (1 h de cambios)
    coste: 68 € al año | dominio 13 €, alojamiento 55 €
    nota:
    Lo que haya que recordar (qué entra, qué queda fuera, validez…).

`estado` es uno de: personal, sin presentar, presentado, vendido, rechazado,
cerrado. Cada `precio` es importe | único o al mes | qué es. `fecha` (la de la
oferta) y `coste` (lo que le cuesta a Jordi mantenerlo: al mes o al año) son
opcionales. Todo lo que va después de `nota:` es texto libre.

**Tu rama.** El HUB ve las ramas `claude/…` y su trabajo sin fusionar (página
Claude). Deja la línea `Claude-Session:` en tus commits: el HUB la usa para
enlazar tu sesión. Al terminar, si hay commits que no están en la rama
principal, díselo a Jordi para que los revise y los fusione.

**Skills de Cosmerito.** Si este repo tiene `.claude/skills/cosmerito-…`,
úsalas: `cosmerito-cerrar-turno` al acabar cada encargo,
`cosmerito-web-nueva` al empezar la web de un cliente,
`cosmerito-revisar-web` cuando Jordi pida revisar una web y
`cosmerito-consultar` cuando necesites saber algo de sus otros proyectos
(cómo van, sus fechas, si otra sesión trabaja en este repo, si algo ya se hizo
en otro sitio). No las cambies aquí: vienen de Cosmerito y el HUB las
sustituye cuando hay una versión nueva.

**Sube al terminar.** El HUB ve tus commits en GitHub y, si este repo tiene
el gancho de la oficina, también cuándo trabajas y cuándo terminas tu turno.
Al parar, deja tu trabajo subido (commit y push): lo que no está en GitHub,
Jordi no lo puede revisar ni fusionar.

**El gancho de la oficina.** `.claude/cosmerito-latido.sh` y sus tres
entradas en `.claude/settings.json` avisan al HUB de que una sesión trabaja
(al recibir un mensaje y, mientras sigue, cada pocos minutos) y de que ha
terminado su turno. Solo mandan el id de la sesión, el repo y la rama: nada
del chat ni del código. Sin `COSMERITO_URL` y `COSMERITO_LATIDO_TOKEN` en el
entorno no hacen nada. No los borres ni los edites; si el HUB te pasa una
versión nueva, sustitúyelos enteros. Si el repo aún no los tiene, el prompt
«Arreglarlo de una vez» de su página en el HUB los lleva dentro.

Formato completo: https://github.com/Sulaire/Cosmerito/blob/main/docs/HUB_JSON.md

**Una parte en tu rama.** Si en este repo vive otra parte del proyecto que se
trabaja en su propia rama (p. ej. el cartógrafo de Orvalle en el repo del MVP),
su ficha no va en este `hub.json`: vive en `fichas/` de Cosmerito con
`repo.comparte_con`, y su roadmap va en un archivo propio
(`ROADMAP_CARTOGRAFO.md`), no en `ROADMAP.md`. Las notas para ella llevan
«[Para «…»]» delante: si no son para ti, no las hagas.

_Bloque de Cosmerito, versión 10. Si el HUB te pasa uno con una versión mayor, sustituye este entero._
