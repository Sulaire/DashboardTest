# Cómo funciona por dentro

Explicado para Jordi. Si cambias la arquitectura, actualiza esto.

## Las piezas

```
n8n (buzón de facturas) ──POST /api/avisos──▶  panel  ◀── la gestoría entra con su correo
     con su llave                               │
                                                 ▼
                                             Postgres (avisos, clientes…)
```

- **Next.js** pinta las páginas y tiene la API, igual que Cosmerito.
- **Postgres** guarda clientes, personas, productos contratados, llaves y avisos.
- **Better Auth** hace el inicio de sesión. Es una librería probada: no
  escribimos nosotros nada de contraseñas, cookies de sesión ni enlaces de
  entrada. **Resend** manda los correos.

## Entrar con el correo («enlace mágico»)

1. La persona escribe su correo en `/entrar`.
2. Si tiene cuenta, Better Auth le manda un enlace que vale 15 minutos y una
   sola vez. Si no tiene, no se manda nada, pero la pantalla dice lo mismo:
   así nadie puede averiguar quién es cliente, ni usar el formulario para
   mandar correos a cualquiera.
3. Al abrir el enlace queda dentro 30 días (cookie de sesión).

No hay registro abierto: las cuentas las creas tú en `/admin` («Dar acceso»).
Tu cuenta (`PANEL_ADMIN_EMAIL`) se crea sola al arrancar.

## Que un cliente no vea lo de otro (seguridad por filas)

Es lo más importante y por eso hay dos capas.

**Capa 1, el código:** cada consulta pide solo lo del cliente de la sesión.

**Capa 2, la base de datos:** aunque el código se equivocara (una consulta
sin filtro, un fallo en una página nueva), Postgres no enseña filas de otro
cliente. Funciona así:

- Hay dos usuarios de Postgres. El **dueño** (el de `DATABASE_URL`) crea las
  tablas. **`panel_app`** es el que usa la app para casi todo: no es dueño de
  ninguna tabla y no tiene permiso para saltarse reglas (el dueño sí se las
  salta, por eso la app no lo usa).
- Las tablas con datos de un cliente (`clientes`, `contrataciones`, `avisos`)
  tienen una regla: «enseña solo las filas cuyo cliente sea el de esta
  transacción».
- Para leer algo de un cliente, la app abre una transacción y le dice a
  Postgres «ahora hablo en nombre del cliente X» (`comoCliente` en
  `src/lib/db.ts`). Se dice con `SET LOCAL` (en el código,
  `set_config('app.cliente_id', …, true)`, que es lo mismo pero acepta el
  valor como parámetro): vale solo hasta el final de esa transacción. Las
  conexiones se reutilizan entre peticiones, y con un `SET` normal la
  siguiente petición heredaría el cliente de la anterior.
- Sin cliente dicho, esas tablas salen vacías.

Las pruebas de `src/lib/db.test.ts` lo comprueban a propósito con consultas
**sin filtro**: si alguien quita una regla, fallan (probado quitando la de
`avisos`: tres pruebas se ponen rojas).

¿Y tu panel de administrador, que ve a todos? Usa la conexión del dueño, pero
solo desde `src/lib/admin.ts` y solo detrás de una comprobación de que eres
tú. Una prueba de guardia vigila que nadie más la importe.

## Los avisos (el formato común)

Todo producto cuenta lo que hace igual. Detalle para n8n en `docs/AVISOS.md`.

```json
{ "producto": "buzon-facturas", "cliente": "017", "ok": true,
  "texto": "12 facturas archivadas", "cifras": { "facturas": 12 } }
```

- La **llave** (una por producto contratado) decide de qué cliente es el
  aviso. El cuerpo no puede decir «esto es de otra gestoría».
- `cliente` es el **código** del cliente de tu cliente (el `id_negocio` de la
  v3 del buzón). El panel nunca guarda su nombre.
- El texto se rechaza si huele a dato personal o a dinero (correos, teléfonos,
  DNI, importes con €). Las cifras tienen que ser recuentos y estar
  declaradas en la descripción del producto.

## Los productos y los bloques

Cada producto se describe en `productos/<id>.json` (explicado en
`docs/PRODUCTOS.md`): qué bloques enseña y de qué cifras sale cada uno. Los
bloques (`src/componentes/Bloques.tsx`) valen para cualquier producto:

| Bloque | Qué enseña |
|---|---|
| semáforo | gris: nunca llegó nada · rojo: lleva más de `silencio_horas` callado · ámbar: algún código tiene un problema abierto · verde: lo demás |
| cifras | sumas del mes (hora de Madrid), la fecha del último aviso que trae una cifra, códigos activos |
| lista | un renglón por código: Revisar / Bien / Sin movimiento (30 días sin nada) |
| avisos | los últimos problemas (`ok: false`) |

Un problema de un código queda «abierto» hasta que llega un `ok: true` de ese
mismo código, igual que el monitor por cliente de Cosmerito.

Los cálculos están en `src/lib/calculos.ts`, sin base de datos, y la demo
(`/demo`) usa los mismos con datos inventados (`src/lib/demo.ts`).

## A la carta

Cada cliente ve una pestaña por producto contratado y, dentro, los bloques que
elijas en `/admin` (por defecto, todos).

## Cuánto se guarda

Los avisos se borran solos a los 12 meses (`src/lib/retencion.ts`, cada vez
que llega un aviso como mucho una vez cada 6 horas, y al abrir `/admin`).
Las facturas nunca pasan por aquí.

## Lo que se ve sin entrar

Solo `/entrar`, `/demo` (datos inventados) y `/api/salud`. Todo lo demás pide
sesión. `/api/avisos` pide una llave de producto.
