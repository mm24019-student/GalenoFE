import OrdenExamenService from "../../../src/js/control/orden_examen_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(OrdenExamenService, {
    idCampo: "idOrdenExamen",
    ciclo: false,
    filtros: []
});

mocha.run();