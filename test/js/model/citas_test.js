import * as chai from "../lib/chai/index.js";
import {
    normalizar, nombreCompleto, nombreRol, nombreClinica, esPaciente, esEmpleado,
    clinicasDePaciente, contextosDeEmpleado, documentosDePersona, buscarCitaPorTexto
} from "../../../src/js/model/citas.js";
mocha.setup("tdd");

const asignacionPaciente = {
    idPersonaRol: "pr-paciente",
    rol: { idRol: "r-paciente", nombre: "Paciente" },
    clinica: { idClinica: "c-1", nombre: "Clínica Central" }
};
const asignacionEmpleado = {
    idPersonaRol: "pr-empleado",
    rol: { idRol: "r-odonto", nombre: "Odontólogo" },
    clinica: { idClinica: "c-1", nombre: "Clínica Central" }
};

suite("model/citas", function () {
    test("normalizar deberia quitar tildes y mayusculas", function () {
        chai.expect(normalizar("Odontólogo")).to.equal("odontologo");
    });

    test("nombreCompleto deberia unir nombres y apellidos", function () {
        chai.expect(nombreCompleto({ nombres: "Ana", apellidos: "López" })).to.equal("Ana López");
        chai.expect(nombreCompleto(null)).to.equal("Sin paciente");
    });

    test("nombreRol y nombreClinica deberian leer las relaciones", function () {
        chai.expect(nombreRol(asignacionPaciente)).to.equal("Paciente");
        chai.expect(nombreClinica(asignacionPaciente)).to.equal("Clínica Central");
    });

    test("esPaciente y esEmpleado deberian distinguir los roles", function () {
        chai.expect(esPaciente(asignacionPaciente)).to.equal(true);
        chai.expect(esEmpleado(asignacionPaciente)).to.equal(false);
        chai.expect(esEmpleado(asignacionEmpleado)).to.equal(true);
    });

    test("clinicasDePaciente deberia quitar duplicados y ordenar", function () {
        let clinicas = clinicasDePaciente([
            asignacionPaciente,
            Object.assign({}, asignacionPaciente, { idPersonaRol: "pr-2" }),
            Object.assign({}, asignacionEmpleado, { clinica: { idClinica: "c-2", nombre: "Clínica Norte" } })
        ]);
        chai.expect(clinicas).to.have.lengthOf(1);
        chai.expect(clinicas[0].nombre).to.equal("Clínica Central");
    });

    test("contextosDeEmpleado deberia agrupar por clinica y rol", function () {
        let contextos = contextosDeEmpleado([
            asignacionEmpleado,
            Object.assign({}, asignacionEmpleado, { idPersonaRol: "pr-2" }),
            asignacionPaciente
        ]);
        chai.expect(contextos).to.have.lengthOf(1);
        chai.expect(contextos[0].clave).to.equal("c-1|r-odonto");
        chai.expect(contextos[0].idPersonaRol).to.equal("pr-empleado");
    });

    test("documentosDePersona deberia formatear tipo y valor", function () {
        let documentos = documentosDePersona({
            documentoList: [{ valor: "123", idTipoDocumento: { nombre: "DUI" } }]
        });
        chai.expect(documentos).to.deep.equal(["DUI: 123"]);
    });

    test("buscarCitaPorTexto deberia filtrar por paciente, rol o clinica", function () {
        let citas = [{
            referenciaExterna: "RF-1",
            idPersonaRol: Object.assign({}, asignacionPaciente, {
                idPersona: { nombres: "Ana", apellidos: "López" }
            })
        }];
        chai.expect(buscarCitaPorTexto(citas, "ana")).to.have.lengthOf(1);
        chai.expect(buscarCitaPorTexto(citas, "central")).to.have.lengthOf(1);
        chai.expect(buscarCitaPorTexto(citas, "pedro")).to.have.lengthOf(0);
        chai.expect(buscarCitaPorTexto(citas, "")).to.equal(citas);
    });
});

mocha.run();
