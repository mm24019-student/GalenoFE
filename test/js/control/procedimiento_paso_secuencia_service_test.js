import ProcedimientoPasoSecuenciaService from "../../../src/js/control/procedimiento_paso_secuencia_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ProcedimientoPasoSecuenciaService, {
    idCampo: "idProcedimientoPasoSecuencia",
    registro: {
        idProcedimientoPasoSecuencia: "11111111-1111-4111-8111-000000000001",
        idProcedimientoPasoReferencia: "11111111-1111-4111-8111-000000000021",
        tipoSecuencia: "SIGUIENTE",
        idProcedimientoPaso: { idProcedimientoPaso: "11111111-1111-4111-8111-000000000011" }
    },
    campoActualizar: "tipoSecuencia",
    valorActualizado: "ANTERIOR",
    filtros: [{ metodo: "porProcedimientoPaso", ruta: "procedimientopaso" }, { metodo: "porProcedimiento", ruta: "procedimiento" }]
});

mocha.run();