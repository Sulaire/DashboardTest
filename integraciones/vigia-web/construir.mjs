// Genera vigia_web.n8n.json (el flujo para importar en n8n) a partir de
// aviso_vigia.js, para que el código del nodo y el probado sean el mismo.
//   node integraciones/vigia-web/construir.mjs           → escribe el archivo
//   node integraciones/vigia-web/construir.mjs --mirar   → dice si está al día
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = join(aqui, "vigia_web.n8n.json");

export function flujo() {
  const codigo = readFileSync(join(aqui, "aviso_vigia.js"), "utf8");
  const cuerpo = `
// Cuerpo de «Preparar Aviso» (va detrás de aviso_vigia.js, en el mismo nodo).
var inicioVigia = $('Marcar Inicio').first().json.inicio;
var respuestaVigia = $input.first().json || {};
return [{ json: vigiaAviso(vigiaResultado(respuestaVigia, inicioVigia, Date.now())) }];
`;
  return {
    name: "Vigía de web → Panel de clientes",
    nodes: [
      {
        parameters: { rule: { interval: [{ field: "cronExpression", expression: "*/15 * * * *" }] } },
        name: "Cada 15 Minutos",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1.2,
        position: [0, 0],
      },
      {
        // Lo único que hay que cambiar: la web que se vigila y la dirección del panel. Sin secretos aquí.
        parameters: {
          assignments: {
            assignments: [
              { id: "v1", name: "web", value: "https://www.ejemplo.es", type: "string" },
              { id: "v2", name: "panel", value: "https://panel.ejemplo.es", type: "string" },
            ],
          },
          options: {},
        },
        name: "Config",
        type: "n8n-nodes-base.set",
        typeVersion: 3.4,
        position: [220, 0],
      },
      {
        parameters: { jsCode: "return [{ json: { inicio: Date.now() } }];" },
        name: "Marcar Inicio",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [440, 0],
      },
      {
        parameters: {
          url: "={{ $('Config').first().json.web }}",
          options: {
            response: { response: { fullResponse: true, neverError: true, responseFormat: "text" } },
            timeout: 15000,
          },
        },
        name: "Pedir la Web",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [660, 0],
        // Si la web no contesta (red, tiempo), sigue con un item que trae `error`: eso también es un aviso.
        onError: "continueRegularOutput",
      },
      {
        parameters: { jsCode: codigo + cuerpo },
        name: "Preparar Aviso",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [880, 0],
      },
      {
        parameters: {
          method: "POST",
          url: "={{ $('Config').first().json.panel }}/api/avisos",
          authentication: "genericCredentialType",
          genericAuthType: "httpHeaderAuth",
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={{ JSON.stringify($json) }}",
          options: { timeout: 10000 },
        },
        name: "Mandar al Panel",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [1100, 0],
        // Si el panel está caído, el vigía no se rompe: lo intentará en 15 minutos.
        onError: "continueRegularOutput",
      },
    ],
    connections: {
      "Cada 15 Minutos": { main: [[{ node: "Config", type: "main", index: 0 }]] },
      Config: { main: [[{ node: "Marcar Inicio", type: "main", index: 0 }]] },
      "Marcar Inicio": { main: [[{ node: "Pedir la Web", type: "main", index: 0 }]] },
      "Pedir la Web": { main: [[{ node: "Preparar Aviso", type: "main", index: 0 }]] },
      "Preparar Aviso": { main: [[{ node: "Mandar al Panel", type: "main", index: 0 }]] },
    },
    settings: { executionOrder: "v1", timezone: "Europe/Madrid" },
  };
}

export const texto = () => JSON.stringify(flujo(), null, 2) + "\n";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--mirar")) {
    const igual = readFileSync(destino, "utf8") === texto();
    console.log(igual ? "vigia_web.n8n.json está al día." : "vigia_web.n8n.json está viejo: ejecuta construir.mjs.");
    process.exit(igual ? 0 : 1);
  }
  writeFileSync(destino, texto());
  console.log("Escrito", destino);
}
