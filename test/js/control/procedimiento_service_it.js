import ProcedimientoService from "../../../src/js/control/procedimiento_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ProcedimientoService, {
    idCampo: "idProcedimiento",
    ciclo: true,
    nuevo: () => ({
        nombre: "Procedimiento FE " + Date.now(),
        observaciones: "Procedimiento de prueba desde el front"
    }),
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

mocha.run();