import ProcedimientoPasoSecuenciaService from "../../../src/js/control/procedimiento_paso_secuencia_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ProcedimientoPasoSecuenciaService, {
    idCampo: "idProcedimientoPasoSecuencia",
    ciclo: false,
    filtros: ["porProcedimientoPaso", "porProcedimiento"]
});

mocha.run();