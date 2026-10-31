import MedioContactoService from "../../../src/js/control/medio_contacto_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(MedioContactoService, {
    idCampo: "idMedioContacto",
    ciclo: false,
    filtros: ["porPersona"]
});

mocha.run();