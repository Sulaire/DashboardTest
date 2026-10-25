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

## Repaso de accesibilidad (25-10-2026)

Hecho mirando las páginas de verdad (con un navegador manejado por programa)
contra el commit `fc60c13`: `/demo`, `/entrar` (también con el enlace
caducado), `/panel` (como cliente y como administrador, en verde, ámbar, rojo,
gris y sin productos), `/admin`, la página de «no existe» y la de «falta
configurar». Cada una a 1280 y 390 px de ancho (las tablas, también a 320), en
claro y en oscuro, con [axe-core](https://github.com/dequelabs/axe-core) (el
comprobador automático de accesibilidad más usado, reglas WCAG 2.2 AA), y a
mano: recorrido con el tabulador, foco visible, nombres para el lector de
pantalla, orden de los títulos, contraste calculado de cada color de
`globals.css` en los dos temas, desplazamiento lateral y nada dicho solo con
color.

axe, antes → después: `/admin` tenía 2 reglas rotas (contraste en 9 sitios y
sin título principal) en claro y 1 en oscuro, a los dos anchos; `/admin` vacío,
1. El resto (demo, entrar, 404, panel) ya salía a 0. Después, **0 en todas**
(44 combinaciones de página, estado, ancho y tema, más la de «falta
configurar» y la demo con el build de producción). axe no ve lo de la tabla de
abajo que no es contraste: eso salió de mirar.

| # | Qué pasaba | Qué se hizo |
|---|---|---|
| 1 | El verde del semáforo y del «bien» de `/admin` se quedaba en 4,34:1 sobre su fondo claro (hace falta 4,5:1 para leerse bien). | `--verde` claro un poco más oscuro (`#147548`): 5,02:1. El oscuro ya pasaba. |
| 2 | Las casillas para escribir (correo, nombre) tenían un borde casi invisible (1,3:1): no se veía dónde escribir. Y en `/admin` los botones de cada producto eran del mismo gris que su caja: parecían texto. | Color nuevo `--borde-campo` (3,1:1 o más sobre los tres fondos, en los dos temas) para casillas y botones; los botones de `/admin` llevan ese borde y el fondo de la tarjeta, así se ven también dentro de la caja gris. |
| 3 | El texto de ejemplo de las casillas («correo@ejemplo.es») salía al 50 % de transparencia: 3,4:1. | Se pinta con `--texto-suave` (7:1 o más), en `globals.css`. |
| 4 | En el móvil, la etiqueta de la gráfica de la primera y la última semana se salía de la pantalla: «171» se leía «1». Y todas tapaban el título de la caja. | La etiqueta se alinea hacia dentro (izquierda en la mitad izquierda, derecha en la otra) y sale en una franja reservada encima de las columnas. Ya no desaparece si subes el ratón a ella. Comprobado columna a columna a 390 y 1280. |
| 5 | En el modo de alto contraste de Windows las columnas de la gráfica desaparecían (son fondos, y ese modo los quita: negro sobre negro). | Se pintan con el color de texto que tenga elegido la persona. La pestaña de producto elegida, que también se distingue por su fondo, sale subrayada. |
| 6 | `/admin` no tenía título principal (h1), y el panel sin productos y «tu cuenta aún no tiene panel», tampoco. | Títulos «Clientes», «Tu panel» y «Tu cuenta aún no tiene ningún panel». |
| 7 | Todas las pestañas del navegador se llamaban igual, «Panel de clientes»: el lector de pantalla no dice dónde has llegado. | «Entrar · Panel de clientes», «Demostración · …», «Administración · …», «Página no encontrada · …». |
| 8 | Al pedir el enlace en `/entrar`, el formulario desaparecía con el botón que tenía el foco: quien usa teclado o lector de pantalla se quedaba «en ninguna parte» y el mensaje podía no leerse. | El foco pasa al mensaje «Si ese correo tiene acceso…». La caja de la llave nueva de `/admin` vive en una zona de avisos que ya está puesta antes de pulsar, para que se lea. |
| 9 | En la demo había un menú vacío en la cabecera (el lector lo anuncia y no hay nada). | El menú solo se pinta si tiene algo dentro, y se llama «Cuenta». |
| 10 | En `/admin`, varios «Quitar» y «Ver su panel» iguales: fuera de contexto no se sabe de quién. | Llevan, solo para el lector, «el acceso de ana@…» y el nombre del cliente. |
| 11 | La tabla de clientes, a 320 px, se desplaza de lado, pero con el teclado no se podía mover. La raya «—» de «Último envío» se lee «raya» o nada. La cabecera «(mes)» no decía qué mes. | La tabla es una zona con nombre a la que se llega con el tabulador (y se mueve con las flechas); el código de cada fila es su cabecera. La raya se lee «Sin datos todavía». «Facturas archivadas este mes». |

Para que no vuelva a pasar, una prueba de guardia nueva calcula el contraste
de los colores de `globals.css` en los dos temas (4,5:1 el texto, 3:1
`--borde-campo` y la gráfica). Con el verde de antes, falla.

Lo que se comprobó y está bien: un solo h1 y títulos en orden en cada página;
`lang="es"`; todos los campos con nombre; el foco se ve siempre (contorno del
color de acento, 6:1 o más); las columnas de la gráfica se alcanzan con el
tabulador y enseñan su valor al enfocarlas, y todos los datos están además en
la tabla de «Ver los datos»; los estados (semáforo y lista) se dicen con
palabras, no solo con color; ningún desplazamiento lateral de la página a 390
ni a 320 px; avisos de error con `role="alert"`.

Queda (no es un fallo, pero conviene saberlo): cuando el buzón lleva más de
48 horas callado, el semáforo sale en rojo («sin noticias») mientras las filas
de sus clientes pueden seguir diciendo «Bien»: la lista mira cada código, no
el silencio de todo el buzón. Es una decisión de cómo se cuenta, no de
accesibilidad; si confunde a la gestoría, se puede cambiar.
