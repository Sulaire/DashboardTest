# «Tu web»: el vigía de la web de un cliente

El segundo producto del panel. Cada 15 minutos se mira si la web de un cliente
responde, y el panel le enseña un semáforo (en línea / puede estar caída / el
vigía no da señales), las comprobaciones y caídas del mes, cuándo fue la
última caída, cuánto tarda en responder y las caídas por semana.

Es la prueba de lo que pedía la propuesta: **añadir un producto es conectar,
no rehacer**. Para tenerlo hizo falta:

1. Su descripción: `productos/vigia-web.json` (qué bloques y de qué cifras).
2. El código de su aviso: `integraciones/vigia-web/aviso_vigia.js`, probado
   contra el filtro del panel en `src/lib/integracion-vigia.test.ts`.
3. El flujo de n8n que lo manda: `integraciones/vigia-web/vigia_web.n8n.json`.

Nada del buzón ni de los bloques se ha tocado.

## Ponerlo en marcha para un cliente

1. En `/admin`, al cliente: «Añadir producto» → «Tu web», y «Crear la llave».
2. En n8n: importar `integraciones/vigia-web/vigia_web.n8n.json`.
3. En el nodo **Config**: `web` (la dirección que se vigila) y `panel` (la
   dirección del panel). No lleva secretos.
4. En el nodo **Mandar al Panel**: crear una credencial **Header Auth**,
   nombre `Authorization`, valor `Bearer <la llave>`.
5. Activar el flujo. En `/admin` → el cliente → «Tu web» → «Últimos avisos
   recibidos» deberían aparecer en 15 minutos.

## Qué manda (y qué no)

- Si responde (códigos 200 a 399): `ok: true`, «Tu web responde», con
  `comprobaciones: 1` y `ms` (lo que tardó).
- Si responde con error o no responde: `ok: false`, «Tu web responde con un
  error (503)» o «Tu web no responde», con `comprobaciones: 1` y `caidas: 1`.
  El semáforo se pone ámbar hasta que vuelva a responder.
- Nunca la dirección de la web ni nada de su contenido.
- Si el vigía (n8n) se para, a las 2 horas sin noticias el semáforo se pone
  rojo: «el vigía no da señales».

## Si se cambia el código

`aviso_vigia.js` es el original. Después de cambiarlo:

```bash
node integraciones/vigia-web/construir.mjs    # vuelve a generar vigia_web.n8n.json
npm test                                       # comprueba que siguen iguales y que el filtro lo acepta
```

Y en n8n, volver a importar el flujo (o pegar el nodo «Preparar Aviso»).
