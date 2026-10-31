import TipoExamenService from "../../../src/js/control/tipo_examen_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(TipoExamenService, {
    idCampo: "idTipoExamen",
    registro: {
        idTipoExamen: "11111111-1111-4111-8111-000000000001",
        nombre: "Tipo Examen FE " + Date.now(),
        observaciones: "Tipo de examen de prueba desde el front"
    },
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

mocha.run();