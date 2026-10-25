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

## 1. Ingesta (04): un aviso por pasada y uno por cada factura que espera

Después de `Registrar Revision` y `Registrar Factura` (cuando ya está todo
escrito), junto al `Resumen` que manda el Telegram:

1. Un nodo **«Una Vez»** (devuelve un solo item), para que lo de abajo no se
   ejecute una vez por factura. Es el fallo de las 63 lecturas de Sheets.
2. **Leer Revision** otra vez (ahora ya trae las filas de esta pasada).
3. Un nodo **Code «Avisos Panel»**: el contenido entero de
   `integraciones/n8n/aviso_panel.js` y, detrás, este cuerpo:

```js
// Cuerpo de «Avisos Panel» (va detrás de aviso_panel.js, en el mismo nodo).
var cfgPanel = $('CONFIG').first().json;
var negocioPanel = {};
try {
  var negs = $('Leer Negocio').all();
  for (var iP = 0; iP < negs.length; iP++)
    if (String(negs[iP].json.id_negocio) === String(cfgPanel.id_negocio)) negocioPanel = negs[iP].json;
} catch (e) {}
var codigoPanel = panelCodigo(negocioPanel);
if (!codigoPanel) return []; // sin codigo_panel no se manda nada

var revisionPanel = [];
try { revisionPanel = $('Leer Revision Panel').all().map(function (x) { return x.json || {}; }); } catch (e) {}

// Lo archivado y lo nuevo en Revision en ESTA pasada.
var archivadasPanel = 0, nuevasPanel = [];
try { archivadasPanel = $('Registrar Factura').all().length; } catch (e) {}
try { nuevasPanel = $('Registrar Revision').all().map(function (x) { return x.json || {}; }); } catch (e) {}

var avisosPanel = panelAvisosRevision(codigoPanel, nuevasPanel);
var pendientesPanel = panelPendientes(revisionPanel, cfgPanel.id_negocio);
// Solo si cambió algo o hace 12 h del último: así no llegan 24 avisos al día por negocio.
// (Ojo: la ingesta solo corre cuando llega correo; el aviso diario «sigo vivo» sale del 05, paso 1b.)
if (panelDebeMandarPasada($getWorkflowStaticData('global'), codigoPanel, archivadasPanel, pendientesPanel, Date.now()))
  avisosPanel.push(panelAvisoPasada(codigoPanel, archivadasPanel, pendientesPanel));
return avisosPanel.map(function (a) { return { json: a }; });
```

4. Un nodo **HTTP Request** «Mandar al Panel»: POST a
   `https://<panel>/api/avisos`, la credencial «Panel de clientes», cuerpo
   JSON `={{ $json }}`. Se ejecuta una vez por aviso, que es lo que se quiere.
   **Con «On Error: Continue»** y un tiempo máximo de 10 s: si el panel está
   caído, la ingesta sigue archivando igual.

Ojo con los nombres: `Registrar Factura` y `Registrar Revision` solo tienen
items si en esa pasada se escribió algo; el `try` lo cubre. Si los nodos se
llaman distinto en el servidor, se cambian los nombres en el cuerpo.

## 1b. Un aviso diario aunque no llegue nada (en el 05)

La ingesta (04) solo arranca cuando **llega un correo**: el disparador de
Gmail no hace nada si no hay correo nuevo. Un negocio que pasa dos días sin
facturas (un fin de semana largo) no mandaría ningún aviso y el panel se
pondría en rojo («sin noticias del buzón») sin motivo. Por eso el aviso de
«sigo vivo» sale de un flujo con horario: el **05 Alerta de Latido**, que ya
corre cada mañana.

Al final del 05, el mismo patrón de antes («Una Vez» → leer `Negocios` y
`Revision` → Code → HTTP «Mandar al Panel», con «On Error: Continue»), con
este cuerpo detrás de `aviso_panel.js`:

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
