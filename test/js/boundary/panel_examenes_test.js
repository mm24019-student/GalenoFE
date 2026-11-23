import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import ProcedimientoPasoExamenService from "../../../src/js/control/procedimiento_paso_examen_service.js";
import OrdenExamenService from "../../../src/js/control/orden_examen_service.js";
import ExamenResultadoService from "../../../src/js/control/examen_resultado_service.js";
import "../../../src/js/boundary/panel_examenes.js";
mocha.setup("tdd");

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

suite("boundary/panel-examenes", function () {
    let stubs = [];
    let paso = { idConsultaProcedimientoPaso: "cp1" };

    teardown(function () {
        stubs.forEach(s => s.restore());
        stubs = [];
        document.querySelectorAll("panel-examenes").forEach(e => e.remove());
    });

    function crear() {
        let el = document.createElement("panel-examenes");
        document.body.appendChild(el);
        el.definicion = "def1";
        el.paso = paso;
        el.pasos = [paso];
        el.editable = true;
        return el;
    }

    test("deberia pintar catalogo e historial con resultados existentes", async function () {
        stubs.push(sinon.stub(ProcedimientoPasoExamenService.prototype, "porProcedimientoPaso").resolves({
            datos: [{ activo: true, idExamen: { idExamen: "e1", nombre: "Rayos X" }, observaciones: "" }]
        }));
        stubs.push(sinon.stub(OrdenExamenService.prototype, "porConsultaProcedimientoPaso").resolves({
            datos: [{ idOrdenExamen: "o1", indicaciones: "Examen|e1|Rayos X" }]
        }));
        stubs.push(sinon.stub(ExamenResultadoService.prototype, "porOrdenExamen").resolves({
            datos: [{ idExamenResultado: "r1", fechaCreacion: "2026-01-01T00:00:00Z", resultado: "Normal", interpretacion: "Sin hallazgos", rutaAtestado: "pdf" }]
        }));
        let el = crear();
        await tick(20);
        chai.expect(el.root.querySelectorAll(".fila-examen").length).to.equal(1);
        chai.expect(el.root.querySelector(".ruta")).to.equal(null);
        chai.expect(el.root.textContent).to.not.include("Atestado");
        chai.expect(el.root.querySelector("#historialSection").hidden).to.equal(false);
        chai.expect(el.root.querySelector("#historial").textContent).to.include("Normal");
    });

    test("guardar deberia crear orden y resultado usando columnas existentes", async function () {
        stubs.push(sinon.stub(ProcedimientoPasoExamenService.prototype, "porProcedimientoPaso").resolves({
            datos: [{ activo: true, idExamen: { idExamen: "e1", nombre: "RX" }, observaciones: "" }]
        }));
        stubs.push(sinon.stub(OrdenExamenService.prototype, "porConsultaProcedimientoPaso").resolves({ datos: [] }));
        stubs.push(sinon.stub(ExamenResultadoService.prototype, "porOrdenExamen").resolves({ datos: [] }));
        stubs.push(sinon.stub(OrdenExamenService.prototype, "create").resolves({ datos: "ok" }));
        stubs.push(sinon.stub(ExamenResultadoService.prototype, "create").resolves({ datos: "ok" }));
        let el = crear();
        await tick(20);
        let fila = el.root.querySelector(".fila-examen");
        chai.expect(fila.querySelector(".ruta")).to.equal(null);
        fila.querySelector("input[type=checkbox]").checked = true;
        fila.querySelector(".resultado").value = "Normal";
        await el.guardar(paso);
        chai.expect(OrdenExamenService.prototype.create.calledOnce).to.equal(true);
        chai.expect(ExamenResultadoService.prototype.create.calledOnce).to.equal(true);
        chai.expect(OrdenExamenService.prototype.create.firstCall.args[0].indicaciones).to.equal("Examen|e1|RX");
        chai.expect(ExamenResultadoService.prototype.create.firstCall.args[0].resultado).to.equal("Normal");
        chai.expect(ExamenResultadoService.prototype.create.firstCall.args[0].rutaAtestado).to.equal("pendiente");
    });
});

mocha.run();
