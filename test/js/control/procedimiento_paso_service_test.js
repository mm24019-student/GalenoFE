import ProcedimientoPasoService from "../../../src/js/control/procedimiento_paso_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ProcedimientoPasoService, {
    idCampo: "idProcedimientoPaso",
    registro: {
        idProcedimientoPaso: "11111111-1111-4111-8111-000000000001",
        nombre: "Paso FE " + Date.now(),
        indicaFin: false,
        idProcedimiento: { idProcedimiento: "11111111-1111-4111-8111-000000000011" },
        idRol: { idRol: "11111111-1111-4111-8111-000000000012" }
    },
    campoActualizar: "indicaFin",
    valorActualizado: true,
    filtros: [{ metodo: "porProcedimiento", ruta: "procedimiento" }]
});

mocha.run();