import ConsultaService from "../../../src/js/control/consulta_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
mocha.setup("tdd");

pruebasUnitarias(ConsultaService, {
    idCampo: "idConsulta",
    registro: {
        idConsulta: "11111111-1111-4111-8111-000000000001",
        fechaInicio: "2026-10-28T08:00:00Z",
        fechaFin: "2026-10-28T09:00:00Z",
        referenciaExterna: "RF-02912",
        observaciones: "Consulta de prueba desde el front",
        idPersonaRol: { idPersonaRol: "11111111-1111-4111-8111-000000000011" }
    },
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

mocha.run();