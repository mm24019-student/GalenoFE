import PersonaService from "../../../src/js/control/persona_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(PersonaService, {
    idCampo: "idPersona",
    registro: {
        idPersona: "11111111-1111-4111-8111-000000000001",
        nombres: "Persona FE",
        apellidos: "Prueba Front",
        fechaNacimiento: "1995-03-15T00:00:00Z"
    },
    campoActualizar: "apellidos",
    valorActualizado: "Apellido Actualizado",
    filtros: []
});

mocha.run();