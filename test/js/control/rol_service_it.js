import RolService from "../../../src/js/control/rol_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(RolService, {
    idCampo: "idRol",
    ciclo: true,
    nuevo: () => ({
        nombre: "Rol FE " + Date.now(),
        observaciones: "Rol de prueba desde el front"
    }),
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

mocha.run();