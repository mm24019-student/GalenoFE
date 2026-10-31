import DocumentoService from "../../../src/js/control/documento_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
mocha.setup("tdd");

pruebasUnitarias(DocumentoService, {
    idCampo: "idDocumento",
    registro: {
        idDocumento: "11111111-1111-4111-8111-000000000001",
        valor: "12345678",
        rutaFisica: "/documentos/prueba.pdf",
        idPersona: { idPersona: "11111111-1111-4111-8111-000000000011" },
        idTipoDocumento: { idTipoDocumento: "11111111-1111-4111-8111-000000000012" }
    },
    campoActualizar: "rutaFisica",
    valorActualizado: "/documentos/actualizado.pdf",
    filtros: [{ metodo: "porPersona", ruta: "persona" }]
});

mocha.run();