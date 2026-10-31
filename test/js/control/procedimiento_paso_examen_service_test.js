import ProcedimientoPasoExamenService from "../../../src/js/control/procedimiento_paso_examen_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ProcedimientoPasoExamenService, {
    idCampo: "idProcedimientoPasoExamen",
    registro: {
        idProcedimientoPasoExamen: "11111111-1111-4111-8111-000000000001",
        fechaCreacion: "2026-10-28T08:00:00Z",
        activo: true,
        observaciones: "Relacion de prueba desde el front",
        idExamen: { idExamen: "11111111-1111-4111-8111-000000000011" },
        idProcedimientoPaso: { idProcedimientoPaso: "11111111-1111-4111-8111-000000000012" }
    },
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: [{ metodo: "porProcedimientoPaso", ruta: "procedimientopaso" }]
});

mocha.run();