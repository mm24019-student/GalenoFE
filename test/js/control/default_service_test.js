import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import DefaultService from "../../../src/js/control/default_service.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import DefaultResponse from "../../../src/js/entity/default_response.js";
mocha.setup("tdd");

suite("DefaultService errores y casos limite", function () {
    var stubFetch;
    var svc;

    setup(function () {
        svc = new DefaultService();
        svc.URL = "http://test/api/recurso";
        svc.BASE_URL = "http://test/api/";
    });

    teardown(function () {
        if (stubFetch) { stubFetch.restore(); stubFetch = null; }
    });

    function response(body, status, headers) {
        let h = new Headers(headers || {});
        let payload = typeof body === "string" || body === null ? body : JSON.stringify(body);
        return new Response(payload, { status: status, headers: h });
    }

    test("findRange deberia rechazar en fallo de red", function (done) {
        stubFetch = sinon.stub(window, "fetch").rejects(new TypeError("Failed to fetch"));
        svc.findRange(0, 10).then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err).to.be.an.instanceOf(DefaultError);
                chai.expect(err.mensaje).to.equal("Error al acceder al repositorio");
                chai.expect(err.detalle).to.include("no se pudo conectar");
                done();
            } catch (e) { done(e); }
        });
    });

    test("findRange deberia rechazar en JSON invalido con 200", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response("no-json", { status: 200 }));
        svc.findRange(0, 10).then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err).to.be.an.instanceOf(DefaultError);
                chai.expect(err.mensaje).to.equal("Error al parsear la respuesta del servidor");
                done();
            } catch (e) { done(e); }
        });
    });

    test("findRange deberia rechazar en status no 200", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(response("boom", 500));
        svc.findRange(0, 10).then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err.mensaje).to.include("500");
                chai.expect(err.estado).to.equal(500);
                chai.expect(err.detalle).to.include("boom");
                done();
            } catch (e) { done(e); }
        });
    });

    test("findById deberia rechazar 404 como registro inexistente", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(response(null, 404));
        svc.findById("x").then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err.mensaje).to.equal("No existe el registro");
                chai.expect(err.estado).to.equal(404);
                done();
            } catch (e) { done(e); }
        });
    });

    test("findById deberia rechazar 422 usando texto y campo", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(response("Dato malo", 422, { "Wrong-Parameter": "nombre" }));
        svc.findById("x").then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err.mensaje).to.equal("Dato malo");
                chai.expect(err.error).to.equal("nombre");
                chai.expect(err.estado).to.equal(422);
                done();
            } catch (e) { done(e); }
        });
    });

    test("findById deberia rechazar 422 sin texto con mensaje generico", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(response("", 422, { "Wrong-Parameter": "campo" }));
        svc.findById("x").then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err.mensaje).to.include("Dato invalido");
                chai.expect(err.mensaje).to.include("campo");
                done();
            } catch (e) { done(e); }
        });
    });

    test("findById deberia rechazar en JSON invalido", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response("<html>", { status: 200 }));
        svc.findById("x").then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err.mensaje).to.equal("Error al parsear la respuesta del servidor");
                done();
            } catch (e) { done(e); }
        });
    });

    test("create deberia rechazar status inesperado", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(response("conflicto", 409));
        svc.create({ a: 1 }).then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err.estado).to.equal(409);
                chai.expect(err.detalle).to.include("409");
                done();
            } catch (e) { done(e); }
        });
    });

    test("update deberia rechazar 404 y fallo de red", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(response(null, 404));
        svc.update("id", { a: 1 }).then(() => done(new Error("Debio rechazar"))).catch(err => {
            chai.expect(err.mensaje).to.equal("No existe el registro");
            stubFetch.restore();
            stubFetch = sinon.stub(window, "fetch").rejects(new TypeError("x"));
            return svc.update("id", { a: 1 });
        }).then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err).to.be.an.instanceOf(DefaultError);
                done();
            } catch (e) { done(e); }
        });
    });

    test("update deberia rechazar JSON invalido en 200", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(new Response("oops", { status: 200 }));
        svc.update("id", { a: 1 }).then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err.mensaje).to.equal("Error al parsear la respuesta del servidor");
                done();
            } catch (e) { done(e); }
        });
    });

    test("delete deberia rechazar error del servidor", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(response("<html>err</html>", 500));
        svc.delete("id").then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err.estado).to.equal(500);
                chai.expect(err.detalle).to.not.include("<html>");
                done();
            } catch (e) { done(e); }
        });
    });

    test("findBy deberia resolver lista y rechazar fallos", function (done) {
        stubFetch = sinon.stub(window, "fetch").resolves(response([{ id: 1 }], 200));
        svc.findBy("http://test/x").then(resp => {
            chai.expect(resp).to.be.an.instanceOf(DefaultResponse);
            chai.expect(resp.datos).to.have.lengthOf(1);
            chai.expect(resp.totalDatos).to.equal("1");
            stubFetch.restore();
            stubFetch = sinon.stub(window, "fetch").resolves(response(null, 401));
            return svc.findBy("http://test/x");
        }).then(() => done(new Error("Debio rechazar"))).catch(err => {
            try {
                chai.expect(err.estado).to.equal(401);
                done();
            } catch (e) { done(e); }
        });
    });

    test("motivoPorEstado y utilidades deberia cubrir casos conocidos", function () {
        chai.expect(svc.motivoPorEstado(400)).to.include("formato");
        chai.expect(svc.motivoPorEstado(403)).to.include("permiso");
        chai.expect(svc.motivoPorEstado(418)).to.include("inesperada");
        chai.expect(svc.textoDelServidor("<html>x</html>")).to.equal("");
        chai.expect(svc.textoDelServidor("  hola  ")).to.equal("hola");
        chai.expect(svc.textoDelServidor("x".repeat(250)).length).to.be.at.most(201);
    });
});

mocha.run();
