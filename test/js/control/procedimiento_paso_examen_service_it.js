import ProcedimientoPasoExamenService from "../../../src/js/control/procedimiento_paso_examen_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ProcedimientoPasoExamenService, {
    idCampo: "idProcedimientoPasoExamen",
    ciclo: false,
    filtros: ["porProcedimientoPaso"]
});

mocha.run();