import ConsultaProcedimientoService from "../../../src/js/control/consulta_procedimiento_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ConsultaProcedimientoService, {
    idCampo: "idConsultaProcedimiento",
    registro: {
        idConsultaProcedimiento: "11111111-1111-4111-8111-000000000001",
        idProcedimiento: "11111111-1111-4111-8111-000000000022",
        fechaInicio: "2026-10-28T08:00:00Z",
        fechaFin: "2026-10-28T09:00:00Z",
        observaciones: "Procedimiento de consulta de prueba",
        idConsulta: { idConsulta: "11111111-1111-4111-8111-000000000011" }
    },
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: [{ metodo: "porConsulta", ruta: "consulta" }]
});

mocha.run();