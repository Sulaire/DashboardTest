// Engancha el traductor de alias antes de que se cargue ninguna prueba.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-loader.mjs", pathToFileURL("./scripts/"));
