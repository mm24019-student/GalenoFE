import ClinicaService from "../../../src/js/control/clinica_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(ClinicaService, {
    idCampo: "idClinica",
    registro: {
        idClinica: "11111111-1111-4111-8111-000000000001",
        nombre: "Clinica FE " + Date.now(),
        tipo: "GENERAL",
        comentarios: "Registro de prueba desde el front"
    },
    campoActualizar: "comentarios",
    valorActualizado: "Comentario actualizado desde el front",
    filtros: []
});

mocha.run();