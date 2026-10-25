# Conectar el buzón (v3) al panel: los pasos en n8n

Lo que hay que hacer en el repo del buzón de facturas (en Cosmerito, el
proyecto `facturas-picasso`) para que el buzón mande sus avisos al panel. **Aún no está hecho**: ese repo y el servidor de
n8n no se han tocado. Esto es la receta para hacerlo (Jordi, o una sesión de
Claude en ese repo siguiendo su `CLAUDE.md`).

El código que va en los nodos está en este repo,
`integraciones/n8n/aviso_panel.js`, con pruebas que comprueban que todo lo que
genera pasa el filtro del panel (`src/lib/integracion-n8n.test.ts`). Si se
cambia, que sea aquí, y se vuelve a copiar.

## 0. Antes de nada

- [ ] **Un código neutro por negocio.** Columna nueva `codigo_panel` en la
      hoja `Negocios` (lo ideal, el número de cliente que usa la gestoría,
      p. ej. `017`). `id_negocio` no vale: es el nombre del negocio en mayúsculas. Sin
      `codigo_panel`, el código no manda nada.
- [ ] En el panel, `/admin`: dar de alta a la gestoría, añadirle el buzón y
      crear su llave.
- [ ] En n8n, una credencial **Header Auth** «Panel de clientes»: nombre
      `Authorization`, valor `Bearer <la llave>`.

## 1. Ingesta (04): dos sitios, porque tiene dos caminos

En la ingesta, «Archivar?» parte en dos: lo que se archiva va por el
«Bucle» y acaba en «Resumen»; lo que va a revisión acaba en «Registrar
Revision». Los dos caminos **no se juntan**, y una pasada puede recorrer
solo uno. Por eso hay dos enganches:

**1a. Detrás de «Registrar Revision»** (las facturas que esperan a alguien):

1. Un nodo **Code «Avisos Revisión Panel»** (modo «Run Once for All
   Items»): el contenido entero de `integraciones/n8n/aviso_panel.js` y,
   detrás, este cuerpo:

```js
// Cuerpo de «Avisos Revisión Panel» (detrás de aviso_panel.js, en el mismo nodo).
var cfgRev = $('CONFIG').first().json;
var negocioRev = {};
try {
  var negsR = $('Leer Negocio').all();
  for (var iR = 0; iR < negsR.length; iR++)
    if (String(negsR[iR].json.id_negocio) === String(cfgRev.id_negocio)) negocioRev = negsR[iR].json;
} catch (e) {}
var codigoRev = panelCodigo(negocioRev);
if (!codigoRev) return []; // sin codigo_panel no se manda nada
var nuevasRev = $input.all().map(function (x) { return x.json || {}; }); // las filas que se acaban de apuntar
return panelAvisosRevision(codigoRev, nuevasRev).map(function (a) { return { json: a }; });
```

2. Un nodo **HTTP Request «Mandar al Panel»** (ver abajo).

**1b. Detrás de «Resumen»** (las pasadas que archivan algo):

1. Un nodo **Google Sheets «Leer Revision Panel»**: lee la pestaña
   `Revision` (ya con las filas de esta pasada).
2. Un nodo **Code «Pasada Panel»**: `aviso_panel.js` y, detrás:

```js
// Cuerpo de «Pasada Panel» (detrás de aviso_panel.js, en el mismo nodo).
var cfgPas = $('CONFIG').first().json;
var negocioPas = {};
try {
  var negsP = $('Leer Negocio').all();
  for (var iP = 0; iP < negsP.length; iP++)
    if (String(negsP[iP].json.id_negocio) === String(cfgPas.id_negocio)) negocioPas = negsP[iP].json;
} catch (e) {}
var codigoPas = panelCodigo(negocioPas);
if (!codigoPas) return [];
// Todas las vueltas del bucle: $('Registrar Factura').all() solo daría la última.
var archivadasPas = panelContarVueltas(function (r) { return $('Registrar Factura').all(0, r); });
var revisionPas = $('Leer Revision Panel').all().map(function (x) { return x.json || {}; });
var pendientesPas = panelPendientes(revisionPas, cfgPas.id_negocio);
if (!panelDebeMandarPasada($getWorkflowStaticData('global'), codigoPas, archivadasPas, pendientesPas, Date.now())) return [];
return [{ json: panelAvisoPasada(codigoPas, archivadasPas, pendientesPas) }];
```

3. Un nodo **HTTP Request «Mandar al Panel»** (ver abajo).
4. Un nodo **Code «Apuntar Panel»**, detrás del HTTP: `aviso_panel.js` y,
   detrás, esto. Apunta la pasada solo si el panel respondió `{"ok": true}`;
   si el envío falló (el panel se estaba actualizando, un 500…), no se apunta
   y la siguiente pasada lo vuelve a mandar.

```js
// Cuerpo de «Apuntar Panel» (detrás de aviso_panel.js, en el mismo nodo).
var enviadosAp = $('Pasada Panel').all().map(function (x) { return x.json || {}; });
var respuestasAp = $input.all().map(function (x) { return x.json || {}; });
panelApuntarEnviados($getWorkflowStaticData('global'), enviadosAp, respuestasAp, Date.now());
return [];
```

**El nodo «Mandar al Panel»** (en cada sitio donde se use): HTTP Request,
POST a `https://<panel>/api/avisos`, la credencial «Panel de clientes»,
cuerpo JSON `={{ JSON.stringify($json) }}`. Se ejecuta una vez por aviso.
**Con «On Error: Continue»** y un tiempo máximo de 10 s: si el panel está
caído, la ingesta sigue archivando igual.

Ojo con los nombres: si los nodos se llaman distinto en el servidor, se
cambian en los cuerpos. Y **comprobar el conteo** en una ejecución de verdad
con 2 o más facturas: en `/admin` → «Últimos avisos recibidos» tiene que salir
el número bueno (si sale 1, `panelContarVueltas` no está leyendo las vueltas
como se espera: avisa). El Telegram «Resumen» de la v3 usa
`$('Registrar Factura').all()` y podría tener el mismo fallo: mira si alguna
vez ha dicho «Archivadas: 1» con más facturas.

## 1c. Un aviso diario aunque no llegue nada (en el 05)

La ingesta (04) solo arranca cuando **llega un correo**: el disparador de
Gmail no hace nada si no hay correo nuevo. Un negocio que pasa dos días sin
facturas (un fin de semana largo) no mandaría ningún aviso y el panel se
pondría en rojo («sin noticias del buzón») sin motivo. Por eso el aviso de
«sigo vivo» sale de un flujo con horario: el **05 Alerta de Latido**, que ya
corre cada mañana.

Al final del 05: un nodo «Una Vez» (devuelve un solo item: así lo de detrás
no se ejecuta una vez por proveedor), leer `Negocios` y `Revision` («Leer
Revision Panel»), un Code «Latido Panel» y un HTTP «Mandar al Panel», con «On
Error: Continue». El cuerpo de «Latido Panel», detrás de `aviso_panel.js`:

```js
// Cuerpo de «Latido Panel» en el 05: un aviso al día por negocio, haya o no facturas.
var cfgLatido = $('CONFIG').first().json;
var negocioLatido = {};
try {
  var negsL = $('Leer Negocio').all();
  for (var iL = 0; iL < negsL.length; iL++)
    if (String(negsL[iL].json.id_negocio) === String(cfgLatido.id_negocio)) negocioLatido = negsL[iL].json;
} catch (e) {}
var codigoLatido = panelCodigo(negocioLatido);
if (!codigoLatido) return [];
var revisionLatido = [];
try { revisionLatido = $('Leer Revision Panel').all().map(function (x) { return x.json || {}; }); } catch (e) {}
return [{ json: panelAvisoPasada(codigoLatido, 0, panelPendientes(revisionLatido, cfgLatido.id_negocio)) }];
```

Así el panel recibe noticias al menos una vez al día (el rojo salta a las 48
horas), y las pendientes se ponen al día aunque no llegue nada (si la
gestoría resolvió una factura en la hoja, el ámbar se apaga a la mañana
siguiente).

## 2. Envío a la gestoría (06)

Después de mandar el correo, el mismo patrón («Una Vez» → Code → HTTP), con:

```js
return [{ json: panelAvisoEnvio(panelCodigo(<fila del negocio>), <número de facturas enviadas>) }];
```

## 3. Notificador de errores (02) y Canario (03)

Avisos de todo el buzón, sin código. Un problema sin código lo cierra
cualquier aviso bueno posterior (la siguiente pasada que archive bien), así
que no hace falta mandar «ya está arreglado».

```js
return [{ json: panelAvisoGeneral(false, 'error') }];       // en el 02
return [{ json: panelAvisoGeneral(false, 'credencial') }];  // en el 03, cuando falla una credencial
```

## 4. Comprobarlo

- [ ] Lanzar la ingesta a mano y mirar en `/admin` → el buzón → «Últimos
      avisos recibidos». También se puede probar cada aviso antes, sin
      guardarlo, en `/admin` → «Probar un aviso».
- [ ] Lanzar el 05 a mano: tiene que llegar «Sin facturas nuevas» con sus
      pendientes.
- [ ] Abrir el panel con «Ver su panel»: el semáforo y las cifras.
- [ ] Si algo no llega: el nodo HTTP devuelve el motivo en `error` (400) o
      dice que la llave no vale (401).
