import PersonaRolService from "../../../src/js/control/persona_rol_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(PersonaRolService, {
    idCampo: "idPersonaRol",
    registro: {
        idPersonaRol: "11111111-1111-4111-8111-000000000001",
        fechaCreacion: "2026-10-28T08:00:00Z",
        idClinica: { idClinica: "11111111-1111-4111-8111-000000000011" },
        idPersona: { idPersona: "11111111-1111-4111-8111-000000000012" },
        idRol: { idRol: "11111111-1111-4111-8111-000000000013" }
    },
    campoActualizar: "fechaCreacion",
    valorActualizado: "2026-10-28T09:00:00Z",
    filtros: []
});

mocha.run();