# Describir un producto

Cada producto es un archivo `productos/<id>.json`. Añadir un producto es
escribir su archivo y crear su llave en `/admin`: no se toca nada de lo que ya
funciona. El buzón vendido a 50 gestorías es una sola descripción.

Ejemplo completo: `productos/buzon-facturas.json`. Los tipos exactos están en
`src/lib/productos/tipos.ts`, y `src/lib/productos/cargar.ts` lo comprueba (un
archivo con errores se queda fuera y sus errores salen en `/admin` y en las
pruebas).

| Campo | Qué es |
|---|---|
| `id` | En minúsculas y con guiones; igual que el nombre del archivo. No se cambia. |
| `nombre`, `descripcion` | Lo que lee el cliente arriba de la pestaña. |
| `codigos` | Cómo se llaman los códigos en pantalla («Cliente», «Local»…). |
| `silencio_horas` | Horas sin avisos a partir de las que el semáforo se pone rojo. |
| `cifras` | Las cifras que puede mandar, con su nombre. Cualquier otra se rechaza. |
| `abiertos` | Opcional. La cifra que cuenta lo que espera a alguien ahora (en el buzón, `pendientes`). No se suma: vale el último valor de cada código. Mayor que 0 = ese código en ámbar, aunque el último aviso fuera bueno. |
| `bloques` | Lo que enseña la pestaña, en orden. Cada uno con `id` (para elegirlo a la carta), `tipo` y `titulo`. |

Bloques:

- `semaforo`: `textos` con `verde`, `ambar`, `rojo` y `gris`.
- `cifras`: `elementos`, cada uno con `etiqueta` y `calculo`:
  - `suma_mes` + `cifra`: la suma de este mes.
  - `ultima_fecha` + `cifra`: la fecha del último aviso que la trae.
  - `actual` + `cifra`: lo que vale ahora (el último valor de cada código, sumado). Para recuentos como «por revisar».
  - `codigos_activos` + `dias`: cuántos códigos mandaron algo en esos días.
- `grafica`: columnas con la suma de una `cifra` por semana (de lunes a
  domingo, hora de Madrid); `semanas` entre 2 y 8. La de ahora va a medias
  y se marca «ahora». Al pasar el ratón (o con el teclado) sale el número de
  cada semana, y «Ver los datos» los enseña en una tabla.
- `lista`: un renglón por código; con `cifra`, su suma del mes. Si el producto tiene `abiertos`, el «Revisar» lleva cuántos le quedan.
- `avisos`: los últimos problemas; `maximo` entre 1 y 100.

Si un producto necesita algo que ningún bloque sabe enseñar, se hace un bloque
nuevo en `src/componentes/Bloques.tsx` (y su tipo en `tipos.ts`, su
comprobación en `cargar.ts` y su cálculo en `calculos.ts`, con pruebas); desde
entonces sirve para todos.
