import PersonaService from "../../../src/js/control/persona_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(PersonaService, {
    idCampo: "idPersona",
    ciclo: true,
    nuevo: () => ({
        nombres: "Persona FE",
        apellidos: "Prueba Front",
        fechaNacimiento: "1995-03-15T00:00:00Z"
    }),
    campoActualizar: "apellidos",
    valorActualizado: "Apellido Actualizado",
    filtros: []
});

mocha.run();