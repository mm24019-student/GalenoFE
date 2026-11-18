import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/tarjeta_cita.js";
mocha.setup("tdd");

suite("boundary/tarjeta-cita", function () {
    teardown(function () {
        document.querySelectorAll("tarjeta-cita").forEach(e => e.remove());
    });

    test("deberia tolerar cita nula y pintar con datos minimos", function () {
        let el = document.createElement("tarjeta-cita");
        document.body.appendChild(el);
        chai.expect(() => { el.cita = null; el.procedimientos = null; }).to.not.throw();
        el.cita = { idConsulta: "c1", referenciaExterna: null, fechaInicio: null, idPersonaRol: null };
        el.procedimientos = [];
        chai.expect(el.root.querySelector("#referencia").textContent).to.include("sin referencia");
        chai.expect(el.root.querySelector(".vacio")).to.exist;
    });

    test("deberia emitir descargar-ticket al hacer click", function (done) {
        let el = document.createElement("tarjeta-cita");
        document.body.appendChild(el);
        el.cita = { idConsulta: "c1", referenciaExterna: "R1", fechaInicio: "2026-01-01T00:00:00Z", idPersonaRol: { clinica: { nombre: "X" } } };
        el.procedimientos = ["Limpieza"];
        el.addEventListener("descargar-ticket", e => {
            try {
                chai.expect(e.detail.cita.idConsulta).to.equal("c1");
                done();
            } catch (err) { done(err); }
        });
        el.root.querySelector("#ticket").click();
    });

    test("no deberia emitir evento si no hay cita", function () {
        let el = document.createElement("tarjeta-cita");
        document.body.appendChild(el);
        let emitido = false;
        el.addEventListener("descargar-ticket", () => { emitido = true; });
        el.root.querySelector("#ticket").click();
        chai.expect(emitido).to.equal(false);
    });
});

mocha.run();
