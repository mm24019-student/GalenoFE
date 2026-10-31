import TipoExamenService from "../../../src/js/control/tipo_examen_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(TipoExamenService, {
    idCampo: "idTipoExamen",
    ciclo: true,
    nuevo: () => ({
        nombre: "Tipo Examen FE " + Date.now(),
        observaciones: "Tipo de examen de prueba desde el front"
    }),
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

mocha.run();