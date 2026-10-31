import ProcedimientoPasoService from "../../../src/js/control/procedimiento_paso_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ProcedimientoPasoService, {
    idCampo: "idProcedimientoPaso",
    ciclo: false,
    filtros: ["porProcedimiento"]
});

mocha.run();