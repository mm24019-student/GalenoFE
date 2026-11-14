import ExamenResultadoService from "../../../src/js/control/examen_resultado_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ExamenResultadoService, {
    idCampo: "idExamenResultado",
    registro: {
        idExamenResultado: "11111111-1111-4111-8111-000000000001",
        fechaCreacion: "2026-10-28T08:00:00Z",
        resultado: "Valores normales",
        interpretacion: "Sin hallazgos relevantes",
        rutaAtestado: "/atestados/prueba.pdf",
        idOrdenExamen: { idOrdenExamen: "11111111-1111-4111-8111-000000000011" }
    },
    campoActualizar: "interpretacion",
    valorActualizado: "Interpretacion actualizada",
    filtros: [{ metodo: "porOrdenExamen", ruta: "ordenexamen" }]
});

mocha.run();