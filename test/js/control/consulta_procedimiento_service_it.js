import ConsultaProcedimientoService from "../../../src/js/control/consulta_procedimiento_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ConsultaProcedimientoService, {
    idCampo: "idConsultaProcedimiento",
    ciclo: false,
    filtros: []
});

mocha.run();