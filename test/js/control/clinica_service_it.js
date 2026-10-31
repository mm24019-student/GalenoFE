import ClinicaService from "../../../src/js/control/clinica_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(ClinicaService, {
    idCampo: "idClinica",
    ciclo: true,
    nuevo: () => ({
        nombre: "Clinica FE " + Date.now(),
        tipo: "GENERAL",
        comentarios: "Registro de prueba desde el front"
    }),
    campoActualizar: "comentarios",
    valorActualizado: "Comentario actualizado desde el front",
    filtros: []
});

mocha.run();