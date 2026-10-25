// ===== Avisos para el panel de clientes (Dashboard de clientes) =====
// Para el buzón de facturas v3 (su repo es, en Cosmerito, el proyecto facturas-picasso). Vive aquí,
// en el repo del panel, porque sus pruebas comprueban que lo que genera pasa el
// filtro de /api/avisos. Para usarlo en n8n se copia entero en un nodo Code y
// se llama a sus funciones desde el cuerpo del nodo (ver docs/N8N_BUZON.md).
//
// Escrito como los nodos de la v3: `var` y funciones sueltas, sin módulos,
// porque n8n mete todo el código del nodo en un único ámbito. Por eso todos los
// nombres empiezan por `panel`: así no pisan los del extractor (num, norm…).

// Motivos de la hoja Revision que esperan a una persona, con el texto que ve la
// gestoría. Sin nombres, importes ni números de factura.
var PANEL_TEXTOS = {
  sin_adjunto: 'Llegó un correo de factura sin el PDF adjunto',
  pdf_sin_texto_necesita_ocr: 'Una factura llegó en un PDF sin texto: hay que mirarla a mano',
  pdf_texto_insuficiente: 'Una factura llegó en un PDF sin texto: hay que mirarla a mano',
  imagen_necesita_vision_ia: 'Una factura llegó en un PDF sin texto: hay que mirarla a mano',
  sin_cif_emisor: 'Una factura no trae el CIF de quien la emite',
  sin_cif_ni_con_ia: 'Una factura no trae el CIF de quien la emite',
  proveedor_desconocido: 'Factura de un proveedor nuevo: falta darle el visto bueno',
  proveedor_nuevo_dado_de_alta_revisalo: 'Factura de un proveedor nuevo: falta darle el visto bueno',
  proveedor_inactivo_activalo_en_la_hoja: 'Factura de un proveedor que está desactivado: actívalo si es del negocio',
  sin_fecha: 'A una factura no se le encuentra la fecha',
  sin_fecha_ni_con_ia: 'A una factura no se le encuentra la fecha',
  albaran_sin_numero: 'Un albarán no trae número',
  importes_no_cuadran_necesita_ia: 'Los importes de una factura no cuadran: hay que revisarla',
  ia_no_cuadra_revisar_a_mano: 'Los importes de una factura no cuadran: hay que revisarla',
  ia_importes_no_estan_escritos_en_el_pdf: 'Los importes de una factura no cuadran: hay que revisarla',
  ia_tipo_de_iva_imposible: 'Los importes de una factura no cuadran: hay que revisarla'
};

// Rastro, no tarea: ni se avisan ni cuentan (lo mismo que el Resumen Semanal).
var PANEL_DESCARTES = ['albaran', 'extracto_bancario', 'otro_suministro_no_es_del_negocio',
                       'probable_firma', 'adjunto_no_pdf', 'ia_dice_que_no_es_factura'];

// Corto, sin espacios y con al menos una cifra (un nombre no vale como código).
var PANEL_CODIGO = /^(?=.*\d)[A-Za-z0-9._-]{1,32}$/;

// El código del negocio para el panel: la columna codigo_panel de Negocios.
// NUNCA id_negocio (en la v3 es el nombre del negocio en mayúsculas). Sin código, null: no se manda nada.
function panelCodigo(filaNegocio) {
  var c = String((filaNegocio && filaNegocio.codigo_panel) || '').trim();
  return PANEL_CODIGO.test(c) ? c : null;
}

function panelEsDescarte(motivo) {
  return PANEL_DESCARTES.indexOf(String(motivo || '')) > -1 || String(motivo || '').indexOf('ok_') === 0;
}

// Texto para un motivo. Uno que no esté en la tabla sale genérico (nunca el motivo tal cual).
function panelTexto(motivo) {
  return PANEL_TEXTOS[String(motivo || '')] || 'Una factura necesita revisión';
}

// Cuántas facturas de un negocio esperan a alguien ahora: filas de Revision con
// estado pendiente cuyo motivo no es un descarte.
function panelPendientes(filasRevision, idNegocio) {
  var n = 0;
  for (var i = 0; i < (filasRevision || []).length; i++) {
    var r = filasRevision[i] || {};
    if (String(r.id_negocio) !== String(idNegocio)) continue;
    if (String(r.estado || 'pendiente') !== 'pendiente') continue;
    if (panelEsDescarte(r.motivo)) continue;
    n++;
  }
  return n;
}

// El aviso de cada pasada de la Ingesta (se manda aunque no haya archivado nada:
// así el panel sabe que el buzón sigue vivo).
function panelAvisoPasada(codigo, archivadas, pendientes) {
  var a = Math.max(0, Math.floor(Number(archivadas) || 0));
  var p = Math.max(0, Math.floor(Number(pendientes) || 0));
  var texto = a === 0 ? 'Sin facturas nuevas' : (a === 1 ? '1 factura archivada' : a + ' facturas archivadas');
  if (p > 0) texto += p === 1 ? '; 1 por revisar' : '; ' + p + ' por revisar';
  return { producto: 'buzon-facturas', cliente: codigo, ok: true, texto: texto,
           cifras: { facturas: a, pendientes: p } };
}

// Si toca mandar el aviso de la pasada: cuando archivó algo, cuando cambian las
// pendientes, o si hace más de 12 horas del último. Ojo: la ingesta solo corre
// cuando llega correo, así que el «sigo vivo» de verdad lo manda el 05 cada
// mañana (docs/N8N_BUZON.md, paso 1b); el panel se pone rojo a las 48 h sin noticias. Así llegan unos
// pocos avisos al día por negocio en vez de 24, y el panel cuenta deprisa.
// `estado` es $getWorkflowStaticData('global'), que n8n guarda entre
// ejecuciones de producción (no en las de prueba a mano: ahí siempre manda).
var PANEL_LATIDO_MS = 12 * 3600 * 1000;
function panelDebeMandarPasada(estado, codigo, archivadas, pendientes, ahoraMs) {
  var clave = 'panel:' + codigo;
  var antes = (estado && estado[clave]) || null;
  var toca = !antes || Number(archivadas) > 0 || antes.pendientes !== Number(pendientes) ||
             ahoraMs - antes.cuando >= PANEL_LATIDO_MS;
  if (toca && estado) estado[clave] = { pendientes: Number(pendientes), cuando: ahoraMs };
  return toca;
}

// Un aviso por cada fila NUEVA de Revision que espera a alguien (los descartes no).
function panelAvisosRevision(codigo, filasNuevas) {
  var out = [];
  for (var i = 0; i < (filasNuevas || []).length; i++) {
    var m = (filasNuevas[i] || {}).motivo;
    if (panelEsDescarte(m)) continue;
    out.push({ producto: 'buzon-facturas', cliente: codigo, ok: false, texto: panelTexto(m), cifras: {} });
  }
  return out;
}

// El aviso del Envío a la gestoría (06).
function panelAvisoEnvio(codigo, enviadas) {
  var n = Math.max(0, Math.floor(Number(enviadas) || 0));
  return { producto: 'buzon-facturas', cliente: codigo, ok: true,
           texto: 'Envío mensual a la gestoría hecho', cifras: { enviadas: n } };
}

// Avisos de todo el buzón (sin código): un error del flujo o una credencial caída.
function panelAvisoGeneral(ok, que) {
  var textos = {
    error: 'El buzón ha tenido un error y se está revisando',
    credencial: 'El buzón no puede leer el correo ahora mismo: se está arreglando',
    recuperado: 'El buzón vuelve a leer el correo'
  };
  return { producto: 'buzon-facturas', ok: !!ok, texto: textos[que] || textos.error, cifras: {} };
}

// Para las pruebas del panel (en n8n `module` no existe y esto no hace nada).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { panelCodigo: panelCodigo, panelEsDescarte: panelEsDescarte, panelTexto: panelTexto,
    panelPendientes: panelPendientes, panelAvisoPasada: panelAvisoPasada, panelAvisosRevision: panelAvisosRevision,
    panelAvisoEnvio: panelAvisoEnvio, panelAvisoGeneral: panelAvisoGeneral, panelDebeMandarPasada: panelDebeMandarPasada, PANEL_TEXTOS: PANEL_TEXTOS };
}
