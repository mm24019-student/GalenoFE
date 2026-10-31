import TipoDocumentoService from "../../../src/js/control/tipo_documento_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(TipoDocumentoService, {
    idCampo: "idTipoDocumento",
    ciclo: true,
    nuevo: () => ({
        nombre: "Tipo Documento FE " + Date.now(),
        indicaciones: "Ocho o nueve digitos",
        expresionRegular: "^[0-9]{8,9}$"
    }),
    campoActualizar: "indicaciones",
    valorActualizado: "Indicaciones actualizadas",
    filtros: []
});

mocha.run();