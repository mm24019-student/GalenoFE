import ExamenService from "../../../src/js/control/examen_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ExamenService, {
    idCampo: "idExamen",
    ciclo: true,
    nuevo: () => ({
        nombre: "Examen FE " + Date.now(),
        observaciones: "Examen de prueba desde el front"
    }),
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

mocha.run();