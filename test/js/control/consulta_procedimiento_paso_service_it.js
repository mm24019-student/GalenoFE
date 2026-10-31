import ConsultaProcedimientoPasoService from "../../../src/js/control/consulta_procedimiento_paso_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ConsultaProcedimientoPasoService, {
    idCampo: "idConsultaProcedimientoPaso",
    ciclo: false,
    filtros: []
});

mocha.run();