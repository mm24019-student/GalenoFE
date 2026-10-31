import DocumentoService from "../../../src/js/control/documento_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(DocumentoService, {
    idCampo: "idDocumento",
    ciclo: false,
    filtros: ["porPersona"]
});

mocha.run();