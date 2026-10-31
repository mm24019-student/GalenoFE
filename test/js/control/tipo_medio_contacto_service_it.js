import TipoMedioContactoService from "../../../src/js/control/tipo_medio_contacto_service.js";
import { pruebasIntegracion } from "./pruebas_comunes.js";
mocha.setup("bdd");

pruebasIntegracion(TipoMedioContactoService, {
    idCampo: "idTipoMedioContacto",
    ciclo: true,
    nuevo: () => ({
        nombre: "Tipo Medio FE " + Date.now(),
        indicaciones: "Ocho digitos",
        expresionRegular: "^[0-9]{8}$"
    }),
    campoActualizar: "indicaciones",
    valorActualizado: "Indicaciones actualizadas",
    filtros: []
});

mocha.run();