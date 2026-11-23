import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/selector_contexto.js";
mocha.setup("tdd");

suite("boundary/selector-contexto", function () {
    teardown(function () {
        document.querySelectorAll("selector-contexto").forEach(e => e.remove());
    });

    test("deberia listar contextos y emitir la seleccion confirmada", function () {
        let el = document.createElement("selector-contexto");
        document.body.appendChild(el);
        el.contextos = [
            { clinica: { idClinica: "c1", nombre: "Central" }, rol: { idRol: "r1", nombre: "Doctor" } },
            { clinica: { idClinica: "c2", nombre: "Sur" }, rol: { idRol: "r1", nombre: "Doctor" } }
        ];
        chai.expect(el.root.querySelectorAll("#clinica option").length).to.equal(2);
        chai.expect(el.root.querySelectorAll("#rol option").length).to.equal(1);
        let eventos = [];
        el.addEventListener("contexto-confirmado", e => eventos.push(e.detail));
        el.q("#trabajar").click();
        chai.expect(eventos.length).to.equal(1);
        chai.expect(eventos[0].contexto.clinica.idClinica).to.equal("c1");
        chai.expect(eventos[0].contexto.rol.idRol).to.equal("r1");
    });

    test("bloqueado deberia impedir cambiar el contexto", function () {
        let el = document.createElement("selector-contexto");
        document.body.appendChild(el);
        el.contextos = [{ clinica: { idClinica: "c1", nombre: "Central" }, rol: { idRol: "r1", nombre: "Doctor" } }];
        let eventos = 0;
        el.addEventListener("contexto-confirmado", () => { eventos++; });
        el.bloqueado = true;
        chai.expect(el.root.querySelector("#clinica").disabled).to.equal(true);
        chai.expect(el.root.querySelector("#rol").disabled).to.equal(true);
        el.q("#trabajar").click();
        chai.expect(eventos).to.equal(0);
    });

    test("sin contextos deberia emitir error", function () {
        let el = document.createElement("selector-contexto");
        document.body.appendChild(el);
        let errores = 0;
        el.addEventListener("error", () => { errores++; });
        el.q("#trabajar").click();
        chai.expect(errores).to.equal(1);
    });
});

mocha.run();
