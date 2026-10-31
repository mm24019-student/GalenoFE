import ConsultaProcedimientoPasoService from "../../../src/js/control/consulta_procedimiento_paso_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ConsultaProcedimientoPasoService, {
    idCampo: "idConsultaProcedimientoPaso",
    registro: {
        idConsultaProcedimientoPaso: "11111111-1111-4111-8111-000000000001",
        fechaInicio: "2026-10-28T08:00:00Z",
        fechaFin: "2026-10-28T09:00:00Z",
        estado: "PENDIENTE",
        valor: "Sin valor",
        idConsultaProcedimiento: { idConsultaProcedimiento: "11111111-1111-4111-8111-000000000011" },
        idProcedimientoPaso: { idProcedimientoPaso: "11111111-1111-4111-8111-000000000012" },
        idPersonaRol: { idPersonaRol: "11111111-1111-4111-8111-000000000013" }
    },
    campoActualizar: "estado",
    valorActualizado: "EN_PROCESO",
    filtros: []
});

mocha.run();