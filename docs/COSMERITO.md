# Cómo lo vigila Cosmerito

Cosmerito ve el panel de dos maneras, sin entrar nunca en lo de cada cliente:

1. **Si está vivo:** `GET /api/salud` (sin llave). Responde 200 si la app y su
   base de datos contestan. Cuando esté publicado, va en `despliegue.salud` de
   `hub.json`.
2. **Cómo va cada cliente:** `GET /api/cosmerito/v1/resumen` con su propia
   llave. Solo semáforo y cifras: nada personal.

## La llave

`PANEL_COSMERITO_TOKEN`, una cadena larga y aleatoria (32 caracteres o más:
`openssl rand -base64 32`). Va en las variables de Railway **de los dos**: en
el panel con ese nombre, y en Cosmerito con el que use para llamarlo. Ni la
sesión de un cliente ni la llave de un producto abren esta puerta, y esta
llave no abre nada más del panel. Como mucho 30 llamadas por minuto.

## La respuesta

```bash
curl -s -H "Authorization: Bearer $PANEL_COSMERITO_TOKEN" "$PANEL_URL/api/cosmerito/v1/resumen"
```

```json
{
  "ok": true,
  "version": 1,
  "generado_en": "2026-10-19T23:02:01.435Z",
  "clientes": [
    {
      "id": "196bc6a0-…",
      "nombre": "Gestoría de prueba",
      "productos": [
        {
          "producto": "buzon-facturas",
          "nombre": "Buzón de facturas",
          "semaforo": "ambar",
          "ultimo_aviso": "2026-10-19T21:55:00.000Z",
          "por_revisar": 1,
          "cifras": [
            { "etiqueta": "Archivadas este mes", "numero": 402, "fecha": null, "texto": "402" },
            { "etiqueta": "Por revisar ahora", "numero": 1, "fecha": null, "texto": "1" },
            { "etiqueta": "Último envío a la gestoría", "numero": null, "fecha": "2026-10-03T07:00:00.000Z", "texto": "3 oct" },
            { "etiqueta": "Clientes activos (30 días)", "numero": 11, "fecha": null, "texto": "11" }
          ]
        }
      ]
    }
  ]
}
```

- `semaforo`: `verde`, `ambar` (algo por revisar), `rojo` (el producto lleva
  más de su `silencio_horas` sin dar noticias) o `gris` (nunca mandó nada).
- `por_revisar`: cuántos clientes de tu cliente están en «Revisar», sin decir
  cuáles.
- `cifras`: las del bloque de cifras del producto, con el número (o la fecha)
  y el texto tal como lo ve el cliente.
- `incompleto`: `true` si había tantos avisos que no se leyeron todos (alguna
  cifra puede quedarse corta).
- `ultimo_aviso` sale aunque haga meses: un producto callado mucho tiempo es
  `rojo`, nunca `gris`.
- Lo que **no** sale nunca: los códigos de los clientes de tu cliente, los
  textos de los avisos, los correos de las personas. Lo vigila
  `src/lib/resumen.test.ts` (con un aviso «canario» que no puede aparecer) y
  una prueba de guardia.
- `version: 1`: si algún día cambia el formato, sube y Cosmerito debe avisar.

## En Cosmerito (fase 3, hecho el 19-10-2026)

En la rama `claude/new-session-f28w15` de Cosmerito (`src/lib/panel-clientes.ts`):

- Dos variables: `PANEL_CLIENTES_URL` (la dirección del panel) y
  `PANEL_COSMERITO_TOKEN` (la misma llave que aquí). Pasos en su
  `docs/DESPLIEGUE.md` §9.
- Pide el resumen desde el servidor, solo por https y sin seguir
  redirecciones, y lo comprueba campo a campo (si la versión no es la 1 o
  algo no encaja, no enseña nada y dice por qué).
- **Hoy**: una línea por cliente y producto con su semáforo dicho con
  palabras, lo que hay por revisar y las cifras; lo rojo y lo ámbar arriba.
- **La revista (Telegram)**: un incidente si un producto se calla (rojo) y
  otro si Cosmerito no puede leer el resumen (llave, dirección o formato).
  Lo ámbar se ve en Hoy pero no manda Telegram (tener facturas por revisar
  es el día a día, no un fallo); se cambia con `AVISAR_POR_REVISAR`.
- La salud (`/api/salud`) la vigilará en cuanto `hub.json` tenga
  `despliegue.salud`, al publicar.
