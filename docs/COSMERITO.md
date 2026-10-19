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

## Lo que falta en Cosmerito (fase 3)

En Cosmerito hace falta, cuando se haga:

- Dos variables: la dirección del panel y `PANEL_COSMERITO_TOKEN`.
- Pedir el resumen desde el servidor, solo por https y sin seguir
  redirecciones (como las llamadas a la Couple App), con la respuesta tratada
  como datos.
- Enseñarlo en Hoy: un semáforo por cliente y producto. Un `rojo` o un `ambar`
  que dure, como incidente (y en el Telegram de la revista).
- La salud (`/api/salud`) ya la vigila en cuanto `hub.json` tenga
  `despliegue.salud`.
