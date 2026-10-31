import MedioContactoService from "../../../src/js/control/medio_contacto_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(MedioContactoService, {
    idCampo: "idMedioContacto",
    registro: {
        idMedioContacto: "11111111-1111-4111-8111-000000000001",
        valor: "22223333",
        idPersona: { idPersona: "11111111-1111-4111-8111-000000000011" },
        idTipoMedioContacto: { idTipoMedioContacto: "11111111-1111-4111-8111-000000000012" }
    },
    campoActualizar: "valor",
    valorActualizado: "77778888",
    filtros: [{ metodo: "porPersona", ruta: "persona" }]
});

mocha.run();