import TipoMedioContactoService from "../../../src/js/control/tipo_medio_contacto_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(TipoMedioContactoService, {
    idCampo: "idTipoMedioContacto",
    registro: {
        idTipoMedioContacto: "11111111-1111-4111-8111-000000000001",
        nombre: "Tipo Medio FE " + Date.now(),
        indicaciones: "Ocho digitos",
        expresionRegular: "^[0-9]{8}$"
    },
    campoActualizar: "indicaciones",
    valorActualizado: "Indicaciones actualizadas",
    filtros: []
});

mocha.run();