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
