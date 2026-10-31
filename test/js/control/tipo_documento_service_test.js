import TipoDocumentoService from "../../../src/js/control/tipo_documento_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(TipoDocumentoService, {
    idCampo: "idTipoDocumento",
    registro: {
        idTipoDocumento: "11111111-1111-4111-8111-000000000001",
        nombre: "Tipo Documento FE " + Date.now(),
        indicaciones: "Ocho o nueve digitos",
        expresionRegular: "^[0-9]{8,9}$"
    },
    campoActualizar: "indicaciones",
    valorActualizado: "Indicaciones actualizadas",
    filtros: []
});

mocha.run();