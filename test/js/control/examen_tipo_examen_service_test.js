import ExamenTipoExamenService from "../../../src/js/control/examen_tipo_examen_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ExamenTipoExamenService, {
    idCampo: "idExamenTipoExamen",
    registro: {
        idExamenTipoExamen: "11111111-1111-4111-8111-000000000001",
        fechaCreacion: "2026-10-28T08:00:00Z",
        observaciones: "Relacion de prueba desde el front",
        idExamen: { idExamen: "11111111-1111-4111-8111-000000000011" },
        idTipoExamen: { idTipoExamen: "11111111-1111-4111-8111-000000000012" }
    },
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: [{ metodo: "porExamen", ruta: "examen" }]
});

mocha.run();