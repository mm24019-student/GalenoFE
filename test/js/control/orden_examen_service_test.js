import OrdenExamenService from "../../../src/js/control/orden_examen_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(OrdenExamenService, {
    idCampo: "idOrdenExamen",
    registro: {
        idOrdenExamen: "11111111-1111-4111-8111-000000000001",
        fechaCreacion: "2026-10-28T08:00:00Z",
        indicaciones: "Ayuno de 8 horas",
        idConsultaProcedimientoPaso: { idConsultaProcedimientoPaso: "11111111-1111-4111-8111-000000000011" }
    },
    campoActualizar: "indicaciones",
    valorActualizado: "Indicaciones actualizadas",
    filtros: []
});

mocha.run();