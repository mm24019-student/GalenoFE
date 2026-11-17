import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
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

suite("boundary/pagina-atencion", function () {
    let stubs = [];
    let hashOriginal;

    setup(function () {
        hashOriginal = location.hash;
        sesion.cerrar();
        sesion.iniciar({ idPersona: "emp1", nombres: "Doc" }, [{ rol: { idRol: "r1", nombre: "Doctor" }, clinica: { idClinica: "c1", nombre: "C1" }, idPersonaRol: "pr1" }]);
        sesion.elegirContexto({ idClinica: "c1", nombre: "C1" }, { idRol: "r1", nombre: "Doctor" });
    });

    teardown(function () {
        stubs.forEach(s => s.restore());
        stubs = [];
        document.querySelectorAll("pagina-atencion").forEach(e => e.remove());
        sesion.cerrar();
        location.hash = hashOriginal;
    });

    function baseStubs(opts = {}) {
        let pasos = opts.pasos || [{ idConsultaProcedimientoPaso: "cp1-p1", estado: "PENDIENTE", fechaInicio: "2026-01-01T08:00:00Z", valor: "", idProcedimientoPaso: { idProcedimientoPaso: "a", nombre: "Paso A" }, idPersonaRol: { idPersona: { nombres: "Doc" }, idRol: { nombre: "Doctor" } } }];
        stubs.push(sinon.stub(ConsultaService.prototype, "findById").resolves({ datos: opts.consulta || consulta }));
        stubs.push(sinon.stub(ProcedimientoService.prototype, "findRange").resolves({ datos: [{ idProcedimiento: "proc1", nombre: "Limpieza" }, { idProcedimiento: "proc2", nombre: "Extraccion" }] }));
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "porConsulta").resolves({ datos: opts.cps || [{ idConsultaProcedimiento: "cp1", idProcedimiento: "proc1", fechaInicio: "2026-01-01T08:00:00Z" }] }));
        stubs.push(sinon.stub(ProcedimientoPasoService.prototype, "porProcedimiento").resolves({ datos: opts.defs || [defA, defB] }));
        stubs.push(sinon.stub(ProcedimientoPasoSecuenciaService.prototype, "porProcedimiento").resolves({ datos: opts.secs || [{ idProcedimientoPasoReferencia: "a", idProcedimientoPaso: "b" }] }));
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "porConsultaProcedimiento").resolves({ datos: pasos }));
        stubs.push(sinon.stub(ProcedimientoPasoExamenService.prototype, "porProcedimientoPaso").resolves({ datos: opts.examenes || [] }));
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

    test("deberia cargar consulta y pintar pasos/examenes", async function () {
        baseStubs({ examenes: [{ activo: true, idExamen: { idExamen: "e1", nombre: "Rayos X" }, observaciones: "" }] });
        let el = crear();
        await tick(80);
        chai.expect(el.contenido.hidden).to.equal(false);
        chai.expect(el.procedimientos.length).to.equal(1);
        chai.expect(el.root.querySelectorAll("#pasos li").length).to.be.at.least(1);
        chai.expect(el.root.querySelector("#tituloPaso").textContent).to.include("Paso A");
        await tick(30);
        chai.expect(el.root.querySelectorAll(".examen").length).to.equal(1);
    });

    test("guardar sin valor deberia mostrar error", async function () {
        baseStubs();
        let el = crear();
        await tick(80);
        el.q("#valor").value = "   ";
        el.guardar(false);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("Documente");
    });

    test("guardar deberia actualizar paso", async function () {
        baseStubs();
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        let el = crear();
        await tick(80);
        el.q("#valor").value = "Atendido";
        el.q("#estado").value = "EN_PROCESO";
        el.guardar(false);
        await tick(80);
        chai.expect(ConsultaProcedimientoPasoService.prototype.update.called).to.equal(true);
        let args = ConsultaProcedimientoPasoService.prototype.update.firstCall.args;
        chai.expect(args[0]).to.equal("cp1-p1");
        chai.expect(args[1].valor).to.equal("Atendido");
        chai.expect(args[1].estado).to.equal("EN_PROCESO");
    });

    test("guardar y avanzar en ultimo paso deberia informar que es el ultimo", async function () {
        baseStubs({ defs: [defA], secs: [], pasos: [{ idConsultaProcedimientoPaso: "cp1-p1", estado: "PENDIENTE", fechaInicio: "2026-01-01T08:00:00Z", valor: "", idProcedimientoPaso: { idProcedimientoPaso: "a", nombre: "Paso A" }, idPersonaRol: null }] });
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        let el = crear();
        await tick(80);
        el.q("#valor").value = "Hecho";
        el.guardar(true);
        await tick(120);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.match(/último|guardad/i);
    });

    test("retroceder en primer paso deberia informar", async function () {
        baseStubs();
        let el = crear();
        await tick(80);
        el.retroceder();
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("primer paso");
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
        el.guardar(false);
        await tick(60);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("save fail");
    });

    test("registrar examenes seleccionados deberia crear orden y resultados", async function () {
        baseStubs({ examenes: [{ activo: true, idExamen: { idExamen: "e1", nombre: "RX" }, observaciones: "" }] });
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "update").resolves({ datos: {} }));
        stubs.push(sinon.stub(OrdenExamenService.prototype, "create").resolves({ datos: "ok" }));
        stubs.push(sinon.stub(ExamenResultadoService.prototype, "create").resolves({ datos: "ok" }));
        let el = crear();
        await tick(80);
        el.examenes = [{ idExamen: "e1", nombre: "RX" }];
        el.seleccionExamenes.add("e1");
        let paso = el.pasoActual();
        await el.registrarExamenes(paso);
        chai.expect(OrdenExamenService.prototype.create.called).to.equal(true);
        chai.expect(ExamenResultadoService.prototype.create.called).to.equal(true);
    });
});

mocha.run();
