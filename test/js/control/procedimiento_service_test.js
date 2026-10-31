import ProcedimientoService from "../../../src/js/control/procedimiento_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ProcedimientoService, {
    idCampo: "idProcedimiento",
    registro: {
        idProcedimiento: "11111111-1111-4111-8111-000000000001",
        nombre: "Procedimiento FE " + Date.now(),
        observaciones: "Procedimiento de prueba desde el front"
    },
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

mocha.run();