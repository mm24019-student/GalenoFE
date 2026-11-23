import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import { sesion } from "../../../src/js/control/sesion.js";
import ConsultaService from "../../../src/js/control/consulta_service.js";
import ConsultaProcedimientoService from "../../../src/js/control/consulta_procedimiento_service.js";
import ConsultaProcedimientoPasoService from "../../../src/js/control/consulta_procedimiento_paso_service.js";
import ProcedimientoService from "../../../src/js/control/procedimiento_service.js";
import ProcedimientoPasoService from "../../../src/js/control/procedimiento_paso_service.js";
import ProcedimientoPasoSecuenciaService from "../../../src/js/control/procedimiento_paso_secuencia_service.js";
import ProcedimientoPasoExamenService from "../../../src/js/control/procedimiento_paso_examen_service.js";
import OrdenExamenService from "../../../src/js/control/orden_examen_service.js";
import ExamenResultadoService from "../../../src/js/control/examen_resultado_service.js";
import "../../../src/js/boundary/pagina_atencion.js";
mocha.setup("tdd");

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

const consulta = {
    idConsulta: "cons1",
    fechaInicio: "2026-01-01T08:00:00Z",
    referenciaExterna: "R1",
    idPersonaRol: { idPersona: { nombres: "Ana", apellidos: "Lopez" }, clinica: { nombre: "C1" }, rol: { nombre: "Paciente" } }
};
const defA = { idProcedimientoPaso: "a", nombre: "Paso A", idRol: { idRol: "r1" } };
const defB = { idProcedimientoPaso: "b", nombre: "Paso B", idRol: { idRol: "r1" } };
const pasoA = {
    idConsultaProcedimientoPaso: "cp1-p1",
    estado: "PENDIENTE",
    fechaInicio: "2026-01-01T08:00:00Z",
    valor: "",
    idProcedimientoPaso: { idProcedimientoPaso: "a", nombre: "Paso A" }
};
const pasoB = {
    idConsultaProcedimientoPaso: "cp1-p2",
    estado: "EN_PROCESO",
    fechaInicio: "2026-01-01T09:00:00Z",
    valor: "",
    idProcedimientoPaso: { idProcedimientoPaso: "b", nombre: "Paso B" }
};

suite("boundary/pagina-atencion", function () {
    let stubs = [];
    let hashOriginal;

    setup(function () {
        hashOriginal = location.hash;
        sesion.cerrar();
        sesion.iniciar({ idPersona: "emp1", nombres: "Doc" }, [{ rol: { idRol: "r1", nombre: "Doctor" }, clinica: { idClinica: "c1", nombre: "C1" }, idPersonaRol: "pr1" }]);
        sesion.confirmarContexto({ idClinica: "c1", nombre: "C1" }, { idRol: "r1", nombre: "Doctor" });
    });

    teardown(function () {
        stubs.forEach(s => s.restore());
        stubs = [];
        document.querySelectorAll("pagina-atencion").forEach(e => e.remove());
        sesion.cerrar();
        location.hash = hashOriginal;
    });

    function baseStubs(opts = {}) {
        let pasos = opts.pasos || [pasoA];
        stubs.push(sinon.stub(ConsultaService.prototype, "findById").resolves({ datos: opts.consulta || consulta }));
        stubs.push(sinon.stub(ProcedimientoService.prototype, "findRange").resolves({ datos: [{ idProcedimiento: "proc1", nombre: "Limpieza" }, { idProcedimiento: "proc2", nombre: "Extraccion" }] }));
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "porConsulta").resolves({ datos: opts.cps || [{ idConsultaProcedimiento: "cp1", idProcedimiento: "proc1", fechaInicio: "2026-01-01T08:00:00Z" }] }));
        stubs.push(sinon.stub(ProcedimientoPasoService.prototype, "porProcedimiento").resolves({ datos: opts.defs || [defA, defB] }));
        stubs.push(sinon.stub(ProcedimientoPasoSecuenciaService.prototype, "porProcedimiento").resolves({ datos: opts.secs || [{ idProcedimientoPasoReferencia: "a", idProcedimientoPaso: "b" }] }));
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "porConsultaProcedimiento").resolves({ datos: pasos }));
        stubs.push(sinon.stub(ProcedimientoPasoExamenService.prototype, "porProcedimientoPaso").resolves({ datos: opts.examenes || [] }));
        stubs.push(sinon.stub(OrdenExamenService.prototype, "porConsultaProcedimientoPaso").resolves({ datos: opts.ordenes || [] }));
        stubs.push(sinon.stub(ExamenResultadoService.prototype, "porOrdenExamen").resolves({ datos: opts.resultados || [] }));
    }

    function crear(id = "cons1") {
        let el = document.createElement("pagina-atencion");
        el.parametros = new URLSearchParams(id ? "id=" + id : "");
        document.body.appendChild(el);
        return el;
    }

    test("sin sesion deberia mostrar error", async function () {
        sesion.cerrar();
        let el = crear();
        await tick(20);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("iniciar sesión");
    });

    test("sin id de consulta deberia mostrar error", async function () {
        let el = crear(null);
        el.parametros = new URLSearchParams("");
        await tick(20);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("dashboard");
    });

    test("error al cargar consulta deberia mostrarse", async function () {
        stubs.push(sinon.stub(ConsultaService.prototype, "findById").rejects(new Error("no carga")));
        stubs.push(sinon.stub(ProcedimientoService.prototype, "findRange").resolves({ datos: [] }));
        let el = crear();
        await tick(40);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("no carga");
    });

    test("consulta sin procedimientos deberia informar estado vacio", async function () {
        stubs.push(sinon.stub(ConsultaService.prototype, "findById").resolves({ datos: consulta }));
        stubs.push(sinon.stub(ProcedimientoService.prototype, "findRange").resolves({ datos: [] }));
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "porConsulta").resolves({ datos: [] }));
        let el = crear();
        await tick(50);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("no tiene procedimientos");
    });

    test("deberia cargar consulta, pasos propios y examenes sin responsable", async function () {
        baseStubs({ examenes: [{ activo: true, idExamen: { idExamen: "e1", nombre: "Rayos X" }, observaciones: "" }] });
        let el = crear();
        await tick(120);
        chai.expect(el.contenido.hidden).to.equal(false);
        chai.expect(el.procedimientos.length).to.equal(1);
        chai.expect(el.root.querySelectorAll("#pasos li").length).to.equal(1);
        chai.expect(el.q("#tituloPaso").textContent).to.include("Paso A");
        chai.expect(el.q("#metaPaso").textContent).to.not.include("Responsable");
        chai.expect(el.panelExamenes.root.querySelectorAll(".fila-examen").length).to.equal(1);
    });

    test("guardar sin valor deberia mostrar error", async function () {
        baseStubs();
        let el = crear();
        await tick(80);
        el.q("#valor").value = "   ";
        await el.guardar(false);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("Documente");
    });

    test("guardar deberia actualizar paso", async function () {
        baseStubs();
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        let el = crear();
        await tick(80);
        el.q("#valor").value = "Atendido";
        el.q("#estado").value = "EN_PROCESO";
        await el.guardar(false);
        chai.expect(ConsultaProcedimientoPasoService.prototype.update.called).to.equal(true);
        let args = ConsultaProcedimientoPasoService.prototype.update.firstCall.args;
        chai.expect(args[0]).to.equal("cp1-p1");
        chai.expect(args[1].valor).to.equal("Atendido");
        chai.expect(args[1].estado).to.equal("EN_PROCESO");
    });

    test("guardar y avanzar en ultimo paso deberia informar que es el ultimo", async function () {
        baseStubs({ defs: [defA], secs: [], pasos: [pasoA] });
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        let el = crear();
        await tick(80);
        el.q("#valor").value = "Hecho";
        await el.guardar(true);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.match(/último/i);
    });

    test("guardar y avanzar deberia usar el endpoint del backend", async function () {
        baseStubs();
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "avanzar").resolves({ datos: {} }));
        let el = crear();
        await tick(80);
        el.q("#valor").value = "Hecho";
        el.q("#estado").value = "COMPLETADO";
        await el.guardar(true);
        chai.expect(ConsultaProcedimientoPasoService.prototype.avanzar.calledOnceWith("cp1-p1")).to.equal(true);
    });

    test("retroceder en primer paso deberia informar", async function () {
        baseStubs();
        let el = crear();
        await tick(80);
        el.retroceder();
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("primer paso");
    });

    test("devolver paso deberia mostrar el motivo al paso anterior", async function () {
        baseStubs({ pasos: [pasoA, pasoB] });
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "retroceder").resolves({
            datos: { idConsultaProcedimientoPaso: "cp1-p1", estado: "EN_PROCESO" }
        }));
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "findById").resolves({
            datos: {
                idConsultaProcedimientoPaso: "cp1-p1",
                estado: "EN_PROCESO",
                valor: "",
                idProcedimientoPaso: { idProcedimientoPaso: "a" },
                idConsultaProcedimiento: { idConsultaProcedimiento: "cp1" }
            }
        }));
        let el = crear();
        await tick(100);
        el.indiceActual = 1;
        el.pintarPasos();
        el.pintarAtencion();
        el.retroceder();
        chai.expect(el.motivo.root.querySelector(".fondo").hidden).to.equal(false);
        await el.devolverPaso("Falta información");
        let actualizaciones = ConsultaProcedimientoPasoService.prototype.update.getCalls();
        chai.expect(actualizaciones.length).to.equal(2);
        chai.expect(actualizaciones[0].args[0]).to.equal("cp1-p2");
        chai.expect(actualizaciones[0].args[1].valor).to.include("Devolución desde Paso B: Falta información");
        chai.expect(ConsultaProcedimientoPasoService.prototype.findById.calledOnceWith("cp1-p1")).to.equal(true);
        chai.expect(actualizaciones[1].args[0]).to.equal("cp1-p1");
        chai.expect(actualizaciones[1].args[1].valor).to.include("Devolución desde Paso B: Falta información");
        chai.expect(ConsultaProcedimientoPasoService.prototype.retroceder.calledOnceWith("cp1-p2")).to.equal(true);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("devuelto");
    });

    test("guardar examenes seleccionados deberia crear orden y resultados", async function () {
        baseStubs({ examenes: [{ activo: true, idExamen: { idExamen: "e1", nombre: "RX" }, observaciones: "" }] });
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        stubs.push(sinon.stub(OrdenExamenService.prototype, "create").resolves({ datos: "ok" }));
        stubs.push(sinon.stub(ExamenResultadoService.prototype, "create").resolves({ datos: "ok" }));
        let el = crear();
        await tick(120);
        let fila = el.panelExamenes.root.querySelector(".fila-examen");
        fila.querySelector("input[type=checkbox]").checked = true;
        fila.querySelector(".resultado").value = "Normal";
        await el.guardar(false);
        chai.expect(OrdenExamenService.prototype.create.called).to.equal(true);
        chai.expect(ExamenResultadoService.prototype.create.called).to.equal(true);
        chai.expect(OrdenExamenService.prototype.create.firstCall.args[0].indicaciones).to.include("Examen|e1|RX");
    });

    test("agregar procedimiento sin seleccionar deberia mostrar error", async function () {
        baseStubs();
        let el = crear();
        await tick(80);
        el.q("#nuevoProcedimiento").value = "";
        el.agregarProcedimiento();
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("Seleccione");
    });

    test("agregar procedimiento deberia crear y recargar", async function () {
        baseStubs();
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "create").resolves({ datos: "ok" }));
        let el = crear();
        await tick(80);
        el.q("#nuevoProcedimiento").value = "proc2";
        el.agregarProcedimiento();
        await tick(80);
        chai.expect(ConsultaProcedimientoService.prototype.create.called).to.equal(true);
        let body = ConsultaProcedimientoService.prototype.create.firstCall.args[0];
        chai.expect(body.idProcedimiento).to.equal("proc2");
        chai.expect(body.idConsulta.idConsulta).to.equal("cons1");
    });

    test("error al guardar deberia mostrarse", async function () {
        baseStubs();
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").rejects(new Error("save fail")));
        let el = crear();
        await tick(80);
        el.q("#valor").value = "x";
        await el.guardar(false);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("save fail");
    });

    test("botones deberian deshabilitarse mientras el paso este pendiente", async function () {
        baseStubs();
        let el = crear();
        await tick(80);
        chai.expect(el.q("#retroceder").disabled).to.equal(true);
        chai.expect(el.q("#avanzar").disabled).to.equal(true);
        chai.expect(el.q("#finalizar").disabled).to.equal(true);
    });

    test("completar y avanzar deberia habilitarse solo con paso completado y siguiente", async function () {
        baseStubs();
        let el = crear();
        await tick(80);
        el.q("#estado").value = "COMPLETADO";
        el.q("#estado").dispatchEvent(new Event("change"));
        chai.expect(el.q("#avanzar").disabled).to.equal(false);
        chai.expect(el.q("#finalizar").disabled).to.equal(true);
    });

    test("finalizar consulta deberia marcar el paso y el procedimiento como completados", async function () {
        baseStubs({ defs: [defA], secs: [] });
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "findById").resolves({
            datos: { idConsultaProcedimiento: "cp1", observaciones: "Limpieza", idConsulta: { idConsulta: "cons1" } }
        }));
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "update").resolves({ datos: {} }));
        let el = crear();
        await tick(80);
        chai.expect(el.q("#finalizar").textContent).to.include("Finalizar consulta");
        el.q("#valor").value = "Atención finalizada";
        el.q("#estado").value = "COMPLETADO";
        el.q("#estado").dispatchEvent(new Event("change"));
        chai.expect(el.q("#avanzar").disabled).to.equal(true);
        chai.expect(el.q("#finalizar").disabled).to.equal(false);
        await el.finalizar();
        chai.expect(ConsultaProcedimientoPasoService.prototype.update.firstCall.args[1].estado).to.equal("COMPLETADO");
        chai.expect(ConsultaProcedimientoService.prototype.findById.calledOnceWith("cp1")).to.equal(true);
        chai.expect(ConsultaProcedimientoService.prototype.update.firstCall.args[0]).to.equal("cp1");
        chai.expect(ConsultaProcedimientoService.prototype.update.firstCall.args[1].fechaFin).to.be.a("string");
        chai.expect(location.hash).to.equal("#/dashboard");
    });

    test("finalizar sin registro documentado no deberia marcar nada", async function () {
        baseStubs({ defs: [defA], secs: [] });
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "findById").resolves({ datos: {} }));
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "update").resolves({ datos: {} }));
        let el = crear();
        await tick(80);
        el.q("#estado").value = "COMPLETADO";
        el.q("#estado").dispatchEvent(new Event("change"));
        await el.finalizar();
        chai.expect(ConsultaProcedimientoPasoService.prototype.update.called).to.equal(false);
        chai.expect(ConsultaProcedimientoService.prototype.update.called).to.equal(false);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("Documente");
    });

    test("pasos de otro rol o completados deberian ocultarse", async function () {
        let defC = { idProcedimientoPaso: "c", nombre: "Paso C", idRol: { idRol: "r2", nombre: "Enfermera" } };
        let pasoC = {
            idConsultaProcedimientoPaso: "cp-c",
            estado: "PENDIENTE",
            fechaInicio: "2026-01-01T09:00:00Z",
            valor: "",
            idProcedimientoPaso: { idProcedimientoPaso: "c", nombre: "Paso C" }
        };
        let pasoACompletado = Object.assign({}, pasoA, { estado: "COMPLETADO" });
        baseStubs({
            defs: [defA, defC],
            secs: [{ idProcedimientoPasoReferencia: "a", idProcedimientoPaso: "c" }],
            pasos: [pasoACompletado, pasoC]
        });
        let el = crear();
        await tick(100);
        chai.expect(el.root.querySelectorAll("#pasos button").length).to.equal(0);
        chai.expect(el.root.textContent).to.not.include("Paso C");
        chai.expect(el.root.textContent).to.not.include("Responsable");
        chai.expect(el.q("#atencion").classList.contains("oculto")).to.equal(true);
    });
});

mocha.run();
