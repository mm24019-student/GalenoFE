import ExamenResultadoService from "../../../src/js/control/examen_resultado_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ExamenResultadoService, {
    idCampo: "idExamenResultado",
    ciclo: false,
    filtros: []
});

mocha.run();