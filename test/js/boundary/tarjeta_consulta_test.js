import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/tarjeta_consulta.js";
mocha.setup("tdd");

suite("boundary/tarjeta-consulta", function () {
    teardown(function () {
        document.querySelectorAll("tarjeta-consulta").forEach(e => e.remove());
    });

    test("deberia tolerar consulta/detalle nulos o incompletos", function () {
        let el = document.createElement("tarjeta-consulta");
        document.body.appendChild(el);
        chai.expect(() => { el.consulta = null; el.detalle = null; }).to.not.throw();
        el.consulta = { referenciaExterna: null, fechaInicio: null, idPersonaRol: null, observaciones: null };
        el.detalle = null;
        chai.expect(el.root.querySelector("#listaProcedimientos").textContent).to.include("Cargando");
        el.detalle = { procedimientos: [] };
        chai.expect(el.root.querySelector(".vacio").textContent).to.include("no tiene procedimientos");
        chai.expect(() => { el.detalle = { procedimientos: [null, {}] }; }).to.not.throw();
    });

    test("deberia emitir atender con consulta valida", function (done) {
        let el = document.createElement("tarjeta-consulta");
        document.body.appendChild(el);
        el.consulta = { idConsulta: "c1", referenciaExterna: "R", fechaInicio: "2026-01-01T00:00:00Z", idPersonaRol: { idPersona: { nombres: "Ana" } } };
        el.detalle = {
            procedimientos: [{
                nombre: "P1",
                fechaInicio: null,
                orden: [{ idProcedimientoPaso: "p1", idRol: { idRol: "r1" } }],
                pasos: [{ idProcedimientoPaso: { idProcedimientoPaso: "p1" }, estado: "PENDIENTE" }]
            }]
        };
        el.addEventListener("atender", e => {
            try { chai.expect(e.detail.consulta.idConsulta).to.equal("c1"); done(); } catch (err) { done(err); }
        });
        el.root.querySelector("#atender").click();
    });

    test("no deberia emitir atender sin consulta", function () {
        let el = document.createElement("tarjeta-consulta");
        document.body.appendChild(el);
        let emitido = false;
        el.addEventListener("atender", () => { emitido = true; });
        el.root.querySelector("#atender").click();
        chai.expect(emitido).to.equal(false);
    });
});

mocha.run();
