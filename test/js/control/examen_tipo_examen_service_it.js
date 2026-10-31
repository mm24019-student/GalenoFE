import ExamenTipoExamenService from "../../../src/js/control/examen_tipo_examen_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ExamenTipoExamenService, {
    idCampo: "idExamenTipoExamen",
    ciclo: false,
    filtros: ["porExamen"]
});

mocha.run();