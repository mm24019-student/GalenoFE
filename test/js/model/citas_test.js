import * as chai from "../lib/chai/index.js";
import {
    normalizar, nombreCompleto, nombreRol, nombreClinica, esPaciente, esEmpleado,
    asignacionPacienteEnClinica, clinicasDePaciente, contextosDeEmpleado,
    documentosDePersona, buscarCitaPorTexto
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
        chai.expect(normalizar(null)).to.equal("");
        chai.expect(normalizar(undefined)).to.equal("");
        chai.expect(normalizar(123)).to.equal("123");
    });

    test("nombreCompleto deberia unir nombres y apellidos", function () {
        chai.expect(nombreCompleto({ nombres: "Ana", apellidos: "López" })).to.equal("Ana López");
        chai.expect(nombreCompleto(null)).to.equal("Sin paciente");
        chai.expect(nombreCompleto({})).to.equal("Sin paciente");
        chai.expect(nombreCompleto({ nombres: "  ", apellidos: null })).to.equal("Sin paciente");
    });

    test("nombreRol y nombreClinica deberian leer las relaciones", function () {
        chai.expect(nombreRol(asignacionPaciente)).to.equal("Paciente");
        chai.expect(nombreClinica(asignacionPaciente)).to.equal("Clínica Central");
        chai.expect(nombreRol(null)).to.equal("");
        chai.expect(nombreClinica(undefined)).to.equal("");
        chai.expect(nombreRol({ idRol: { nombre: "X" } })).to.equal("X");
        chai.expect(nombreClinica({ idClinica: { nombre: "Y" } })).to.equal("Y");
    });

    test("esPaciente y esEmpleado deberian distinguir los roles", function () {
        chai.expect(esPaciente(asignacionPaciente)).to.equal(true);
        chai.expect(esEmpleado(asignacionPaciente)).to.equal(false);
        chai.expect(esEmpleado(asignacionEmpleado)).to.equal(true);
        chai.expect(esPaciente(null)).to.equal(false);
        chai.expect(esEmpleado(null)).to.equal(false);
        chai.expect(esEmpleado({ rol: { nombre: "Doctor" } })).to.equal(false);
        chai.expect(esPaciente({ rol: { nombre: "  PACIENTE " } })).to.equal(true);
    });

    test("asignacionPacienteEnClinica deberia devolver solo el rol de paciente de esa clinica", function () {
        let asignaciones = [asignacionEmpleado, asignacionPaciente];
        chai.expect(asignacionPacienteEnClinica(asignaciones, "c-1")).to.equal(asignacionPaciente);
        chai.expect(asignacionPacienteEnClinica(asignaciones, "c-otra")).to.equal(null);
        chai.expect(asignacionPacienteEnClinica(null, "c-1")).to.equal(null);
    });

    test("clinicasDePaciente deberia quitar duplicados y ordenar", function () {
        let clinicas = clinicasDePaciente([
            asignacionPaciente,
            Object.assign({}, asignacionPaciente, { idPersonaRol: "pr-2" }),
            Object.assign({}, asignacionEmpleado, { clinica: { idClinica: "c-2", nombre: "Clínica Norte" } })
        ]);
        chai.expect(clinicas).to.have.lengthOf(1);
        chai.expect(clinicas[0].nombre).to.equal("Clínica Central");
        chai.expect(clinicasDePaciente(null)).to.deep.equal([]);
        chai.expect(clinicasDePaciente([{ rol: { nombre: "Paciente" }, clinica: null }])).to.deep.equal([]);
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
        chai.expect(contextosDeEmpleado(null)).to.deep.equal([]);
        chai.expect(contextosDeEmpleado([{ rol: null, clinica: { idClinica: "c" } }])).to.deep.equal([]);
    });

    test("documentosDePersona deberia formatear tipo y valor", function () {
        let documentos = documentosDePersona({
            documentoList: [{ valor: "123", idTipoDocumento: { nombre: "DUI" } }]
        });
        chai.expect(documentos).to.deep.equal(["DUI: 123"]);
        chai.expect(documentosDePersona(null)).to.deep.equal([]);
        chai.expect(documentosDePersona({})).to.deep.equal([]);
        chai.expect(documentosDePersona({ documentoList: [{ valor: "" }] })).to.deep.equal(["Documento: "]);
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
        chai.expect(buscarCitaPorTexto(null, "ana")).to.deep.equal([]);
        chai.expect(buscarCitaPorTexto([null, {}], "x")).to.deep.equal([]);
    });
});

mocha.run();
