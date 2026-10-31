import ConsultaService from "../../../src/js/control/consulta_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ConsultaService, {
    idCampo: "idConsulta",
    ciclo: false,
    filtros: []
});

mocha.run();