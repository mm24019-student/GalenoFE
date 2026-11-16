import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import { buscarIdentidad } from "../../../src/js/control/identidad.js";
import DocumentoService from "../../../src/js/control/documento_service.js";
import PersonaRolService from "../../../src/js/control/persona_rol_service.js";
mocha.setup("tdd");

suite("control/identidad", function () {
    var buscarDocumento;
    var porPersona;

    teardown(function () {
        if (buscarDocumento) {
            buscarDocumento.restore();
            buscarDocumento = null;
        }
        if (porPersona) {
            porPersona.restore();
            porPersona = null;
        }
    });

    test("deberia rechazar si falta el tipo de documento", function (done) {
        buscarIdentidad("", "123").then(() => done(new Error("Debio rechazar")))
            .catch(error => {
                chai.expect(error.message).to.equal("Seleccione el tipo de documento.");
                done();
            }).catch(done);
    });

    test("deberia rechazar si falta el numero de documento", function (done) {
        buscarIdentidad("tipo-1", "   ").then(() => done(new Error("Debio rechazar")))
            .catch(error => {
                chai.expect(error.message).to.equal("Escriba el número de documento.");
                done();
            }).catch(done);
    });

    test("deberia rechazar con null/undefined", function (done) {
        buscarIdentidad(null, null).then(() => done(new Error("Debio rechazar")))
            .catch(() => buscarIdentidad("tipo", undefined))
            .then(() => done(new Error("Debio rechazar")))
            .catch(() => done())
            .catch(done);
    });

    test("deberia rechazar si no hay resultados", function (done) {
        buscarDocumento = sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [] });
        buscarIdentidad("tipo-1", "123").then(() => done(new Error("Debio rechazar")))
            .catch(error => {
                chai.expect(error.message).to.equal("No se encontró una persona con ese documento.");
                done();
            }).catch(done);
    });

    test("deberia rechazar si el documento no tiene persona", function (done) {
        buscarDocumento = sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [{}] });
        buscarIdentidad("tipo-1", "123").then(() => done(new Error("Debio rechazar")))
            .catch(error => {
                chai.expect(error.message).to.equal("No se encontró una persona con ese documento.");
                done();
            }).catch(done);
    });

    test("deberia rechazar si la persona no tiene id", function (done) {
        buscarDocumento = sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [{ idDocumento: "d1", idPersona: {} }] });
        buscarIdentidad("tipo-1", "123").then(() => done(new Error("Debio rechazar")))
            .catch(error => {
                chai.expect(error.message).to.equal("No se encontró una persona con ese documento.");
                done();
            }).catch(done);
    });

    test("deberia devolver persona, documento y asignaciones", function (done) {
        let persona = { idPersona: "p-1", nombres: "Ana", apellidos: "López" };
        let documento = { idDocumento: "d-1", idPersona: persona };
        let asignaciones = [{ idPersonaRol: "pr-1" }];
        buscarDocumento = sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [documento] });
        porPersona = sinon.stub(PersonaRolService.prototype, "porPersona").resolves({ datos: asignaciones });
        buscarIdentidad("tipo-1", " 123 ").then(resultado => {
            chai.expect(buscarDocumento.firstCall.args).to.deep.equal(["123", "tipo-1"]);
            chai.expect(porPersona.firstCall.args[0]).to.equal("p-1");
            chai.expect(resultado.persona).to.equal(persona);
            chai.expect(resultado.documento).to.equal(documento);
            chai.expect(resultado.asignaciones).to.deep.equal(asignaciones);
            done();
        }).catch(done);
    });

    test("deberia tolerar asignaciones nulas en la respuesta", function (done) {
        let persona = { idPersona: "p-1" };
        buscarDocumento = sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [{ idPersona: persona }] });
        porPersona = sinon.stub(PersonaRolService.prototype, "porPersona").resolves({});
        buscarIdentidad("tipo-1", "123").then(resultado => {
            chai.expect(resultado.asignaciones).to.deep.equal([]);
            done();
        }).catch(done);
    });

    test("deberia propagar errores del servicio", function (done) {
        buscarDocumento = sinon.stub(DocumentoService.prototype, "buscar").rejects(new Error("fallo red"));
        buscarIdentidad("tipo-1", "123").then(() => done(new Error("Debio rechazar")))
            .catch(error => {
                chai.expect(error.message).to.equal("fallo red");
                done();
            }).catch(done);
    });
});

mocha.run();
