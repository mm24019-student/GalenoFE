import PersonaRolService from "../../../src/js/control/persona_rol_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(PersonaRolService, {
    idCampo: "idPersonaRol",
    ciclo: false,
    filtros: []
});

mocha.run();