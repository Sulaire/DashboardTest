// ===== Vigía de web: el aviso para el panel de clientes =====
// El segundo producto del panel («Tu web», productos/vigia-web.json): cada 15
// minutos se mira si la web de un cliente responde y se le cuenta al panel.
// Es la prueba de que añadir un producto es conectar, no rehacer: un archivo
// de descripción, una llave y esto. Nada del buzón se ha tocado.
//
// Va dentro de un nodo Code de n8n (vigia_web.n8n.json, que se genera desde
// este archivo con `node integraciones/vigia-web/construir.mjs`). Escrito como
// los nodos de n8n: `var` y funciones sueltas, todos los nombres con `vigia`.

// Lo que ha pasado al pedir la web: si respondió bien (2xx o 3xx), con qué
// código, y cuánto tardó. `respuesta` es la salida del nodo HTTP (con
// «Full Response» y «Never Error»); si falló la red, trae `error`.
function vigiaResultado(respuesta, inicioMs, finMs) {
  var r = respuesta || {};
  if (r.error) return { ok: false, estado: 0, ms: null };
  var estado = Math.floor(Number(r.statusCode) || 0);
  var ms = Math.max(0, Math.round(Number(finMs) - Number(inicioMs)));
  return { ok: estado >= 200 && estado < 400, estado: estado, ms: isFinite(ms) ? ms : null };
}

// El aviso con el formato común. Sin código: es la web entera. Nunca la
// dirección de la web ni nada del contenido de la página.
function vigiaAviso(resultado) {
  var r = resultado || {};
  if (r.ok) {
    var cifras = { comprobaciones: 1 };
    if (r.ms !== null && r.ms !== undefined) cifras.ms = Math.min(r.ms, 600000);
    return { producto: 'vigia-web', ok: true, texto: 'Tu web responde', cifras: cifras };
  }
  var texto = r.estado ? 'Tu web responde con un error (' + r.estado + ')' : 'Tu web no responde';
  return { producto: 'vigia-web', ok: false, texto: texto, cifras: { comprobaciones: 1, caidas: 1 } };
}

// Para las pruebas del panel (en n8n `module` no existe y esto no hace nada).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { vigiaResultado: vigiaResultado, vigiaAviso: vigiaAviso };
}
