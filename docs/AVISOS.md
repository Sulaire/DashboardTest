# Mandar avisos al panel (para n8n)

Cada producto contratado tiene su llave. Se crea en `/admin` → el cliente →
el producto → «Crear la llave», y se enseña una sola vez.

## La llamada

En n8n, un nodo **HTTP Request**:

- Método: `POST`
- URL: `https://<la dirección del panel>/api/avisos`
- Autenticación: credencial **Header Auth** con nombre `Authorization` y
  valor `Bearer <la llave>` (así la llave no queda escrita en el workflow).
- Cuerpo: JSON.

```json
{
  "producto": "buzon-facturas",
  "cliente": "017",
  "ok": true,
  "texto": "12 facturas archivadas",
  "cifras": { "facturas": 12 }
}
```

| Campo | Qué es |
|---|---|
| `producto` | El id del producto. Tiene que ser el de la llave. |
| `cliente` | Opcional. El **código** del cliente de la gestoría (en el buzón, `codigo_panel`: ver abajo). Nunca un nombre. Letras, números, `.`, `_`, `-`; hasta 32, con **al menos una cifra**; no puede tener forma de DNI, NIE, CIF ni teléfono. |
| `ok` | `true` si fue bien, `false` si hay algo que revisar. |
| `texto` | Una frase corta (160 caracteres como mucho). Se rechaza si lleva un correo, un número de 7 cifras o más (aunque vaya separado), un importe o una moneda. Las fechas, solo como `2026-10-03` o `03/10/2026`, y las horas como `09:00`. Un nombre de persona no se puede detectar: no lo pongas. |
| `cifras` | Opcional. Recuentos (enteros ≥ 0) de las cifras que declara el producto. |

Respuestas: `200 {"ok":true}`; `400` con el motivo en `error` si algo del
cuerpo no vale; `401` si la llave no vale o está anulada.

## Qué mandar desde el buzón (v3)

Sacado de leer la v3 (el repo del buzón, en Cosmerito el proyecto
`facturas-picasso`, rama `claude/awesome-planck-rbxg9a`, el 17-10-2026). Las cifras del buzón son
`facturas`, `pendientes` y `enviadas`.

### El código de cada negocio: no vale `id_negocio`

En la v3, `id_negocio` es el nombre del negocio en mayúsculas (algo como `BARDEEJEMPLO`).
Si se mandara tal cual, el panel guardaría el nombre de los clientes de la
gestoría, que es justo lo que no queremos. Hace falta un código neutro: una
columna nueva `codigo_panel` en la hoja `Negocios` (lo ideal, el número de
cliente que use la propia gestoría, p. ej. `017`; si no, uno correlativo), y
mandar ese en `cliente`. La gestoría sabe qué negocio es cada número; el
panel, no.

### La idea: un recuento de lo que queda, no avisos sueltos

En la v3, una factura que va a `Revision` sigue ahí hasta que alguien la mira,
aunque después se archiven otras. Por eso el panel no se fía de «el último
aviso fue bueno»: cada pasada manda **cuántas quedan por revisar ahora**
(`pendientes`). Mientras un código tenga `pendientes` mayor que 0, sale en
ámbar; cuando baja a 0, se apaga solo. Es la cifra `abiertos` de
`productos/buzon-facturas.json`.

`pendientes` se cuenta igual que lo hace ya el Resumen Semanal (07,
`v3/nodos/resumen_semanal.js`): filas de `Revision` de ese negocio con
`estado = pendiente` y cuyo motivo **no** es un descarte (tabla de abajo).

| Cuándo (workflow) | Aviso |
|---|---|
| Ingesta (04), al acabar cada pasada de un negocio (junto a `Resumen` → `Avisar Telegram`) | `cliente: codigo_panel`, `ok: true`, `texto: "3 facturas archivadas"`, `cifras: { "facturas": 3, "pendientes": 1 }` |
| Ingesta (04), por cada fila **nueva** de `Revision` que no sea un descarte | `cliente: codigo_panel`, `ok: false`, `texto` según el motivo (abajo), sin cifras |
| Envío a la gestoría (06, el día 3 de cada mes) | `cliente: codigo_panel`, `ok: true`, `texto: "Envío mensual a la gestoría hecho"`, `cifras: { "enviadas": 6 }` |
| Notificador de errores (02) | sin `cliente`, `ok: false`, `texto: "El buzón ha tenido un error y se está revisando"` |
| Canario (03), si cae una credencial | sin `cliente`, `ok: false`, `texto: "El buzón no puede leer el correo ahora mismo: se está arreglando"` |

Un problema sin `cliente` (de todo el buzón) lo cierra cualquier aviso bueno
posterior: si la siguiente pasada archiva bien, es que ya funciona.

El código exacto para los nodos de n8n, con pruebas, está en
`integraciones/n8n/aviso_panel.js`, y los pasos en `docs/N8N_BUZON.md`.

No hace falta mandar el aviso de la Ingesta cada hora: basta cuando archiva
algo, cuando cambian las pendientes y, aunque no pase nada, uno cada 12 horas
con `facturas: 0` para que el panel sepa que el buzón sigue vivo (si pasa
`silencio_horas` sin noticias, el semáforo se pone rojo). El código de
`integraciones/n8n/aviso_panel.js` ya lo hace (`panelDebeMandarPasada`).

### Motivos que esperan a alguien (cuentan en `pendientes`)

Textos para el aviso `ok: false`. Sin nombres de personas ni importes; el
nombre de una empresa proveedora se puede poner, pero no hace falta.

| Motivo en `Revision` | Texto |
|---|---|
| `sin_adjunto` | Llegó un correo de factura sin el PDF adjunto |
| `pdf_sin_texto_necesita_ocr`, `pdf_texto_insuficiente`, `imagen_necesita_vision_ia` | Una factura llegó en un PDF sin texto: hay que mirarla a mano |
| `sin_cif_emisor`, `sin_cif_ni_con_ia` | Una factura no trae el CIF de quien la emite |
| `proveedor_desconocido`, `proveedor_nuevo_dado_de_alta_revisalo` | Factura de un proveedor nuevo: falta darle el visto bueno |
| `proveedor_inactivo_activalo_en_la_hoja` | Factura de un proveedor que está desactivado: actívalo si es del negocio |
| `sin_fecha`, `sin_fecha_ni_con_ia` | A una factura no se le encuentra la fecha |
| `albaran_sin_numero` | Un albarán no trae número |
| `importes_no_cuadran_necesita_ia`, `ia_no_cuadra_revisar_a_mano`, `ia_importes_no_estan_escritos_en_el_pdf`, `ia_tipo_de_iva_imposible` | Los importes de una factura no cuadran: hay que revisarla |

### Descartes: no se avisan ni cuentan

Quedan en `Revision` como rastro, no como tarea (el Resumen Semanal tampoco
los cuenta): `probable_firma`, `adjunto_no_pdf`, `extracto_bancario`,
`otro_suministro_no_es_del_negocio`, `albaran` y `ia_dice_que_no_es_factura`.
Si se avisaran, el semáforo estaría siempre en ámbar y se dejaría de mirar.

### Lo que no se manda nunca

Ni importes, ni números de factura, ni CIF, ni nombres de los negocios o de
sus clientes, ni asuntos de correo, ni enlaces a Drive. El panel rechaza
importes y datos personales, pero lo primero es no mandarlos.

## Probar a mano

```bash
curl -s -X POST "$PANEL_URL/api/avisos" \
  -H "Authorization: Bearer $LLAVE" -H "Content-Type: application/json" \
  -d '{"producto":"buzon-facturas","cliente":"017","ok":true,"texto":"1 factura archivada","cifras":{"facturas":1,"pendientes":0}}'
```
