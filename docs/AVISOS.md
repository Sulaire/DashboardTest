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
| `cliente` | Opcional. El **código** del cliente de la gestoría (el `id_negocio` de la v3). Nunca un nombre. Letras, números, `.`, `_`, `-`; hasta 32. |
| `ok` | `true` si fue bien, `false` si hay algo que revisar. |
| `texto` | Una frase corta (160 caracteres como mucho). Sin correos, teléfonos, DNI ni importes: se rechaza. |
| `cifras` | Opcional. Recuentos (enteros ≥ 0) de las cifras que declara el producto. |

Respuestas: `200 {"ok":true}`; `400` con el motivo en `error` si algo del
cuerpo no vale; `401` si la llave no vale o está anulada.

## Qué mandar desde el buzón (v3)

Las cifras del buzón: `facturas`, `problemas`, `enviadas`.

| Cuándo (workflow) | Aviso |
|---|---|
| Ingesta (04), al acabar con un negocio | `cliente: id_negocio`, `ok: true`, `texto: "3 facturas archivadas"`, `cifras: { "facturas": 3 }` |
| Ingesta (04), algo va a la hoja Revision | `cliente: id_negocio`, `ok: false`, `texto` según el motivo (abajo), `cifras: { "problemas": 1 }` |
| Envío a la gestoría (06) | `cliente: id_negocio`, `ok: true`, `texto: "Envío mensual a la gestoría hecho"`, `cifras: { "enviadas": 47 }` |
| Notificador de errores (02) | sin `cliente`, `ok: false`, `texto: "El buzón ha tenido un error y se está revisando"` |

Textos para los motivos de la hoja Revision (sin nombres ni importes):

| Motivo | Texto |
|---|---|
| `remitente_desconocido` | Factura de un remitente que aún no está dado de alta |
| `sin_adjunto` | Llegó un correo de factura sin adjunto |
| `no_pdf` | Llegó una factura que no es PDF |
| `pdf_ilegible` | Una factura llegó en un PDF ilegible: revísala en el Drive |
| `sin_cif` | Una factura no trae CIF del emisor |
| `suministro_no_coincide` | Una factura de suministro no es de este local |
| `datos_incompletos` | A una factura le faltan datos |

Ojo: un problema de un código se da por cerrado cuando llega un `ok: true` de
ese código. Si la ingesta manda un `ok: true` cada vez que archiva algo, el
aviso deja de salir en ámbar, pero sigue en el bloque «Avisos».

## Probar a mano

```bash
curl -s -X POST "$PANEL_URL/api/avisos" \
  -H "Authorization: Bearer $LLAVE" -H "Content-Type: application/json" \
  -d '{"producto":"buzon-facturas","cliente":"017","ok":true,"texto":"1 factura archivada","cifras":{"facturas":1}}'
```
