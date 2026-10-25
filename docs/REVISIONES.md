# Revisiones y fallos encontrados

Lo que se ha revisado del panel, qué se encontró y qué se hizo. Si revisas o
arreglas un fallo, apúntalo aquí (como en Cosmerito).

## Auditoría del 19-10-2026

Hecha por un agente aparte, sin tocar nada, contra el commit `4e628ef`.
Probó las rutas de verdad (Better Auth, `/api/avisos`, la base de datos).

| # | Qué pasaba | Qué se hizo |
|---|---|---|
| 1 | Con llaves inventadas (20 por segundo) se gastaba el cupo **total** de `/api/avisos` y los avisos de verdad recibían 429. | El cupo de llaves malas es por IP (30 por minuto) y solo cuentan las que fallan; las buenas solo tienen el suyo (120 por minuto). Probado: la IP que insiste recibe 429, las demás siguen entrando. |
| 2 | El formulario de entrar dejaba adivinar quién tiene cuenta: con cuenta tardaba más (la llamada a Resend) y, si Resend fallaba, daba 500 solo a los clientes. | El enlace se manda **después** de responder (`after`). Probado: misma respuesta y mismo tiempo con y sin cuenta; el fallo de Resend queda en el log. Además, como mucho 3 enlaces por correo cada 15 minutos. |
| 3 | Se colaban en el texto: `612.34.56.78` (lo abrió el quitar fechas), DNI con puntos o espacios, NIE con guiones, `79.03`, `EUR 79`, dígitos de ancho completo, espacios invisibles, `＠`, IBAN con barras. Y el código del cliente podía ser un DNI o un teléfono. Y `constructor` valía como cifra. | El texto se normaliza (NFKC, sin invisibles) antes de mirar; 7 cifras o más seguidas (aunque vayan separadas) se rechazan; importes con punto o coma y monedas por su nombre, también; solo se quitan fechas en formas exactas (`2026-10-03`, `03/10/2026`, `09:00`). El código no puede tener forma de DNI/NIE/CIF ni 7 cifras. `Object.hasOwn` en vez de `in`. Todos los casos, en `src/lib/avisos.test.ts`. |
| 3b | Al repetir sus pruebas tras el arreglo aún pasaban «ana (at) gmail.com», teléfonos partidos como fechas imposibles («61/23/4567») y códigos que son nombres («ana.garcia»). | Se rechazan «(at)», «[at]» y «arroba»; solo se quitan fechas que existen; el código lleva al menos una cifra. Un nombre de persona dentro del texto **no** se puede detectar: es la razón de que el formato sea tan estrecho. |
| 4 | Un producto callado más de 63 días salía en **gris** («nunca llegó nada») en vez de rojo, también en el resumen para Cosmerito. | `historialDe`: la última fecha de cada código sin límite de días (con su índice, migración 004). Callado hace meses = rojo; los códigos viejos siguen en la lista como «Sin movimiento». |
| 5 | Con más de 20.000 avisos en la ventana se cortaba sin avisar (posible con unos 13 negocios mandando cada hora). | Tope a 50.000 y, si se llega, la pantalla y el resumen lo dicen (`incompleto`). El código para n8n manda mucho menos: solo cuando cambia algo y uno cada 12 h. **Pendiente** si algún día hay cientos de negocios: sumar en la base de datos en vez de leer los avisos. |
| 6 | Un error sin código (del flujo) dejaba el ámbar encendido para siempre. | Ya arreglado antes de la auditoría (`06f7bf6`): lo cierra cualquier aviso bueno posterior. El texto del ámbar ya no habla solo de facturas. |
| 7 | El límite de Better Auth para pedir enlaces se fía de `X-Real-IP`. | Se añade el límite por correo (punto 2). **Por comprobar en Railway**: que su proxy pise el `X-Real-IP` que mande quien llama (Cosmerito se fía de lo mismo). |
| 8 | `/api/auth/*` leía cuerpos de cualquier tamaño. | Corte en 16 KB antes de pasárselo a Better Auth (probado: 413). |
| 9 | La contraseña de `panel_app` viajaba tal cual en `ALTER ROLE` (podía quedar en el log de Postgres). | Se manda ya cifrada (verificador SCRAM-SHA-256 hecho en `db.ts`). Probado contra un Postgres que exige SCRAM: entra con la buena, no con una mala. La contraseña tiene que ser ASCII visible. |
| 10 | Sin `PANEL_URL` en producción, el enlace del correo se hacía con la dirección que dijera quien lo pide. | Sin `PANEL_URL`, Better Auth no arranca. |
| 11 | Dos clics seguidos en «Cambiar la llave» dejaban varias llaves vivas. | Índice único parcial (una viva por producto) y `for update` (migración 004). Prueba con tres a la vez. |
| 12 | Desmarcar todos los bloques dejaba la pestaña vacía; `dias` mayor que lo que se lee se recortaba en silencio; los códigos callados más de 63 días desaparecían. | No se puede guardar sin bloques; `dias` hasta 63; lo tercero, con el punto 4. |
| 13 | Límites de la garantía (información). | Escritos en `docs/COMO_FUNCIONA.md` («Hasta dónde llega»). |

Lo que la auditoría comprobó y está bien: reglas por filas y permisos,
`SET LOCAL`, el esquema cerrado, quién usa la conexión del dueño, que cada
acción de admin compruebe al administrador, Better Auth (sin registro, sin
redirección abierta, enlaces de un solo uso y con huella, sesiones en la
base de datos), la puerta de Cosmerito, las horas de Madrid con los cambios de
hora y que las páginas no se guarden en caché entre personas.

## Repo público (19-10-2026)

`Sulaire/DashboardTest` es **público** y su ficha está en sigilo. En los
archivos no hay nombre de la gestoría ni datos de nadie; el nombre del bar
del buzón, que salía en pruebas y documentos, se cambió por nombres de
ejemplo. Los commits antiguos todavía lo llevan: si importa, lo sencillo es
hacer el repo privado (GitHub → Settings → General → Danger Zone → Change
visibility). Lo decide Jordi.

## `npm run dev` se recarga en bucle (25-10-2026)

La página se recargaba sin parar en modo desarrollo («Compiled in 3ms» tras
cada visita). La primera vez (15-10) se achacó a la CSP y se dejó solo en
producción; volvió a pasar sin ella. La causa de verdad: haber hecho
`npm run build` antes de `npm run dev`. Los dos usan la carpeta `.next`, y
lo que deja el build confunde a la recarga en caliente. Probado: con `.next`
borrado, la misma página carga una vez y se queda quieta. Apuntado en
`CLAUDE.md` («Arrancar en tu ordenador»).

## La receta de n8n y los días sin correo (25-10-2026)

Lo vio el agente que escribió el contrato y la guía: el disparador de Gmail de
la ingesta (04) solo arranca cuando llega correo. El aviso de «sigo vivo»
cada 12 horas que proponía `docs/N8N_BUZON.md` no saldría en días sin
facturas, y el panel se pondría en rojo a las 48 horas sin motivo. Arreglo:
el «sigo vivo» sale del 05 Alerta de Latido, que tiene horario (paso 1c).

## Segunda auditoría (25-10-2026)

Otro agente, solo mirando, contra `fc60c13` (y un vistazo a lo que entró
mientras). Comprobó que los arreglos de la primera aguantan y buscó lo nuevo.

| # | Qué pasaba | Qué se hizo |
|---|---|---|
| 1 | El freno de llaves malas se miraba **antes** de saber si la llave era buena: 30 intentos con una llave vieja olvidada en n8n bloqueaban un minuto los avisos buenos de **todos** los clientes que salen del mismo n8n. Y se contaba después de consultar la base de datos: 300 a la vez, 300 consultas. | El intento se cuenta antes de mirar la base de datos (300 a la vez → 30 la tocan) y se devuelve si la llave vale. Una llave que ha valido en los últimos 10 minutos no pasa por ese freno. La base de datos se mira siempre: anular una llave vale al momento. |
| 2 | El código y las cifras dejaban pasar lo que el texto no: `612-345-678`, `12.345.678-Z` o `garcia.lopez.7` como código, y `612345678` como cifra. | Código: de 1 a 6 cifras y como mucho 4 letras (`motivoCodigo`, la misma regla en el código de n8n, con una prueba que lo compara). Cifras: hasta 999.999. |
| 3 | Más formas de colar datos en el texto: separadores de 3 caracteres, invisibles que faltaban (U+2066, U+034F, U+3164…), cifras árabes o devanagari, `ana @ gmail.com`, `ana{at}…`, `79eur`, `79'03`, `pts`, `₹`, direcciones web. | Se quitan todos los «ignorables» de Unicode y el relleno coreano; se rechazan cifras que no sean 0-9, cualquier `@`, direcciones web, monedas por símbolo (`\p{Sc}`) o nombre (también pegado a la cifra) y céntimos con `'`. Separadores hasta 3. Todos los casos, en las pruebas. Quedan sin detectar los nombres y los números escritos con letras: por eso el formato es tan estrecho. |
| 4 | Un carácter nulo en el texto daba 500 (Postgres no lo acepta). | Los caracteres de control se rechazan con 400. |
| 5 | El «sigo vivo» de n8n no salía en días sin correo. | Ya arreglado (sale del 05). Además la receta dice ahora dónde va cada nodo: la ingesta tiene dos caminos que no se juntan (1a y 1b en `docs/N8N_BUZON.md`). |
| 6 | En n8n, `$('Registrar Factura').all()` dentro del bucle da solo la última vuelta: 3 facturas contarían 1 (sin comprobar en n8n). | `panelContarVueltas` suma todas las vueltas. **Hay que comprobarlo** en una ejecución de verdad; el Telegram «Resumen» de la v3 podría tener el mismo fallo. |
| 7 | La pasada se apuntaba como enviada antes de saber si el panel la había recibido. | Se apunta después, solo con un `{"ok": true}` (`panelApuntarEnviados`, nodo «Apuntar Panel»); si falla, la siguiente pasada la repite. |
| 8 | Con miles de códigos, la lista dejaba el servidor parado segundos (buscaba en una lista por cada código). | Un `Set`; el historial trae como mucho 2.000 códigos y la lista enseña 300 («y N más»). |
| 9 | Las sesiones caducadas (con IP y navegador) y los enlaces caducados (con el correo escrito) no se borraban nunca. | Se borran con los avisos viejos (`retencion.ts`), con su prueba. |
| 10 | Los escáneres de enlaces de los correos de empresa (Microsoft 365 Safe Links…) podían gastar el enlace de un solo uso antes que la persona. | El correo lleva a `/entrar/confirmar`, una página con el botón «Entrar»; el enlace se gasta al pulsar (`src/lib/enlace.ts`). |
| 11 | El freno en memoria vaciaba todas las cuentas al llegar a 10.000 claves (y «lleno» apuntaba a todos). | Quita primero las ventanas pasadas y luego las más viejas; nunca pone a todos a cero. «Lleno» ya no apunta a nadie. |
| 12 | Sin nadie escuchando el «error» de los pools, un corte de Postgres podía tumbar el proceso. | `pool.on("error")` en los dos. |
| 13 | Una pestaña podía quedarse vacía si se cambiaba el id de un bloque. | Si de los elegidos no queda ninguno, se enseñan todos. |
| 14 | Nadie comprobaba que panel_app no fuera miembro de otro rol (heredaría sus permisos). | `noinherit` y, si es miembro de algo, la app no arranca; la prueba lo mira. |
| 15 | Un código con algo abierto hace más de 63 días sale como «Sin movimiento». | Se queda así (información). |
