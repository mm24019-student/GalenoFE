import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/arbol_pasos.js";
mocha.setup("tdd");

suite("boundary/arbol-pasos", function () {
    teardown(function () {
        document.querySelectorAll("arbol-pasos").forEach(e => e.remove());
    });

    test("sin pasos deberia mostrar vacio", function () {
        let el = document.createElement("arbol-pasos");
        document.body.appendChild(el);
        el.pasos = [];
        el.orden = [];
        chai.expect(el.root.querySelector(".vacio").textContent).to.include("no hay pasos");
    });

    test("deberia tolerar pasos y orden nulos o malformados", function () {
        let el = document.createElement("arbol-pasos");
        document.body.appendChild(el);
        chai.expect(() => { el.pasos = null; el.orden = null; }).to.not.throw();
        chai.expect(() => { el.pasos = [null, {}, { estado: "COMPLETADO" }]; el.orden = [null]; }).to.not.throw();
        chai.expect(el.root.querySelector("#lista")).to.exist;
    });

    test("deberia renderizar pasos con datos minimos", function () {
        let el = document.createElement("arbol-pasos");
        document.body.appendChild(el);
        el.orden = [{ idProcedimientoPaso: "p1", nombre: "Paso 1" }];
        el.pasos = [{ idConsultaProcedimientoPaso: "c1", estado: "PENDIENTE", idProcedimientoPaso: { idProcedimientoPaso: "p1", nombre: "Paso 1" }, fechaInicio: null, valor: "" }];
        chai.expect(el.root.querySelectorAll("li").length).to.equal(1);
        chai.expect(el.root.querySelector(".nombre").textContent).to.include("Paso 1");
        chai.expect(el.root.textContent).to.not.include("Responsable");
    });
});

mocha.run();
