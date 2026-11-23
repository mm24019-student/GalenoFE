import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/motivo_devolucion.js";
mocha.setup("tdd");

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

suite("boundary/motivo-devolucion", function () {
    teardown(function () {
        document.querySelectorAll("motivo-devolucion").forEach(e => e.remove());
    });

    test("deberia iniciar oculto", async function () {
        let el = document.createElement("motivo-devolucion");
        document.body.appendChild(el);
        await tick(20);
        chai.expect(el.q(".fondo").hidden).to.equal(true);
        chai.expect(getComputedStyle(el.q(".fondo")).display).to.equal("none");
    });

    test("deberia exigir motivo y emitirlo al confirmar", function () {
        let el = document.createElement("motivo-devolucion");
        document.body.appendChild(el);
        let eventos = [];
        el.addEventListener("motivo-confirmado", e => eventos.push(e.detail));
        el.abrir({ idConsultaProcedimientoPaso: "cp1", idProcedimientoPaso: { nombre: "Paso A" } });
        chai.expect(el.q(".fondo").hidden).to.equal(false);
        chai.expect(el.q("#paso").textContent).to.include("Paso A");
        el.q("#confirmar").click();
        chai.expect(el.q("#error").hidden).to.equal(false);
        chai.expect(eventos.length).to.equal(0);
        el.q("#motivo").value = "  Falta información  ";
        el.q("#confirmar").click();
        chai.expect(eventos.length).to.equal(1);
        chai.expect(eventos[0].motivo).to.equal("Falta información");
        chai.expect(eventos[0].paso.idConsultaProcedimientoPaso).to.equal("cp1");
        chai.expect(el.q(".fondo").hidden).to.equal(true);
    });

    test("cancelar deberia cerrar sin emitir", function () {
        let el = document.createElement("motivo-devolucion");
        document.body.appendChild(el);
        let eventos = 0;
        el.addEventListener("motivo-confirmado", () => { eventos++; });
        el.abrir({});
        el.q("#cancelar").click();
        chai.expect(el.q(".fondo").hidden).to.equal(true);
        chai.expect(eventos).to.equal(0);
    });
});

mocha.run();
