import ConsultaService from "../../../src/js/control/consulta_service.js";
import { pruebasUnitarias } from "./pruebas_comunes.js";
import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
mocha.setup("tdd");

pruebasUnitarias(ConsultaService, {
    idCampo: "idConsulta",
    registro: {
        idConsulta: "11111111-1111-4111-8111-000000000001",
        fechaInicio: "2026-10-28T08:00:00Z",
        fechaFin: "2026-10-28T09:00:00Z",
        referenciaExterna: "RF-02912",
        observaciones: "Consulta de prueba desde el front",
        idPersonaRol: { idPersonaRol: "11111111-1111-4111-8111-000000000011" }
    },
    campoActualizar: "observaciones",
    valorActualizado: "Observacion actualizada desde el front",
    filtros: []
});

suite("ConsultaService especificos", function () {
    var stubFetch;

    teardown(function () {
        if (stubFetch) { stubFetch.restore(); stubFetch = null; }
    });

    test("buscar deberia omitir filtros vacios y usar max por defecto", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify([]), { status: 200 }));
        new ConsultaService().buscar({ tipoDocumento: "", valorDocumento: null, desde: "2026-01-01", max: null }).then(() => {
            let url = stubFetch.firstCall.args[0];
            chai.expect(url).to.include("/consulta/buscar?");
            chai.expect(url).to.include("desde=2026-01-01");
            chai.expect(url).to.include("max=100");
            chai.expect(url).to.not.include("tipoDocumento=");
            chai.expect(url).to.not.include("valorDocumento=");
            done();
        }).catch(done);
    });

    test("buscar deberia respetar max y recortar espacios", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify([]), { status: 200 }));
        new ConsultaService().buscar({ valorDocumento: "  123  ", idClinica: " c1 ", max: 5 }).then(() => {
            let url = stubFetch.firstCall.args[0];
            chai.expect(url).to.include("valorDocumento=123");
            chai.expect(url).to.include("idClinica=c1");
            chai.expect(url).to.include("max=5");
            done();
        }).catch(done);
    });

    test("buscar deberia enviar idPersona e idPersonaRol", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response(JSON.stringify([]), { status: 200 }));
        new ConsultaService().buscar({ idPersona: "p1", idPersonaRol: "pr1" }).then(() => {
            let url = stubFetch.firstCall.args[0];
            chai.expect(url).to.include("idPersona=p1");
            chai.expect(url).to.include("idPersonaRol=pr1");
            done();
        }).catch(done);
    });

    test("buscar con filtros null/undefined no deberia lanzar", function (done) {
        stubFetch = sinon.stub(window, "fetch").callsFake(() => Promise.resolve(new Response(JSON.stringify([]), { status: 200 })));
        new ConsultaService().buscar().then(() => new ConsultaService().buscar(null)).then(() => {
            chai.expect(stubFetch.callCount).to.equal(2);
            done();
        }).catch(done);
    });

    test("urlTicket deberia apuntar al endpoint del backend", function () {
        let svc = new ConsultaService();
        chai.expect(svc.urlTicket("abc")).to.equal(svc.URL + "/abc/ticket");
    });

    test("descargarTicket deberia resolver con el blob en 200", function (done) {
        let blob = new Blob(["pdf"], { type: "application/pdf" });
        stubFetch = sinon.stub(window, "fetch").resolves(new Response(blob, { status: 200 }));
        new ConsultaService().descargarTicket("abc").then(b => {
            chai.expect(stubFetch.firstCall.args[0]).to.include("/abc/ticket");
            chai.expect(b).to.be.an.instanceOf(Blob);
            done();
        }).catch(done);
    });

    test("descargarTicket deberia rechazar con status distinto de 200", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response("", { status: 500 }));
        new ConsultaService().descargarTicket("abc").then(() => done(new Error("Debio rechazar")))
            .catch(err => {
                chai.expect(err.message).to.include("500");
                done();
            }).catch(done);
    });

    test("descargarTicket deberia rechazar en error de red", function (done) {
        stubFetch = sinon.stub(window, "fetch").rejects(new TypeError("fail"));
        new ConsultaService().descargarTicket("abc").then(() => done(new Error("Debio rechazar")))
            .catch(() => done())
            .catch(done);
    });
});

mocha.run();
