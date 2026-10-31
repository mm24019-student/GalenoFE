import ExamenService from "../../../src/js/control/examen_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ExamenService, {
    idCampo: "idExamen",
    registro: {
        idExamen: "11111111-1111-4111-8111-000000000001",
        nombre: "Examen FE " + Date.now(),
        observaciones: "Examen de prueba desde el front"
    },
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

mocha.run();