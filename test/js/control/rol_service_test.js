import RolService from "../../../src/js/control/rol_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(RolService, {
    idCampo: "idRol",
    registro: {
        idRol: "11111111-1111-4111-8111-000000000001",
        nombre: "Rol FE " + Date.now(),
        observaciones: "Rol de prueba desde el front"
    },
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

mocha.run();