import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import TipoDocumentoService from "../../../src/js/control/tipo_documento_service.js";
import DocumentoService from "../../../src/js/control/documento_service.js";
import PersonaRolService from "../../../src/js/control/persona_rol_service.js";
import ConsultaService from "../../../src/js/control/consulta_service.js";
import ConsultaProcedimientoService from "../../../src/js/control/consulta_procedimiento_service.js";
import ProcedimientoService from "../../../src/js/control/procedimiento_service.js";
import "../../../src/js/boundary/pagina_busqueda_citas.js";
mocha.setup("tdd");

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

suite("boundary/pagina-busqueda-citas (HU1)", function () {
    let stubs = [];

    setup(function () {
        stubs.push(sinon.stub(TipoDocumentoService.prototype, "findRange").resolves({ datos: [{ idTipoDocumento: "t1", nombre: "DUI", activo: true }] }));
    });

    teardown(function () {
        stubs.forEach(s => s.restore());
        stubs = [];
        document.querySelectorAll("pagina-busqueda-citas").forEach(e => e.remove());
    });

    function crear() {
        let el = document.createElement("pagina-busqueda-citas");
        document.body.appendChild(el);
        return el;
    }

    test("buscar paciente sin clinicas de paciente deberia mostrar error", async function () {
        stubs.push(sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [{ idDocumento: "d1", idPersona: { idPersona: "p1", nombres: "Ana" } }] }));
        stubs.push(sinon.stub(PersonaRolService.prototype, "porPersona").resolves({ datos: [{ rol: { nombre: "Doctor" }, clinica: { idClinica: "c1", nombre: "C1" } }] }));
        let el = crear(); await tick(10);
        el.buscarPaciente({ tipo: "t1", valor: "123" });
        await tick(40);
        chai.expect(el.filtros.hidden).to.equal(true);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("paciente");
    });

    test("buscar paciente con clinica deberia mostrar filtros y nombre", async function () {
        stubs.push(sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [{ idDocumento: "d1", idPersona: { idPersona: "p1", nombres: "Ana", apellidos: "Lopez" } }] }));
        stubs.push(sinon.stub(PersonaRolService.prototype, "porPersona").resolves({ datos: [{ rol: { nombre: "Paciente" }, clinica: { idClinica: "c1", nombre: "Central" } }] }));
        let el = crear(); await tick(10);
        el.buscarPaciente({ tipo: "t1", valor: "123" });
        await tick(40);
        chai.expect(el.filtros.hidden).to.equal(false);
        chai.expect(el.root.querySelector("#paciente").textContent).to.include("Ana");
        chai.expect(el.root.querySelector("#clinica option").textContent).to.include("Central");
    });

    test("buscar citas sin paciente deberia informar error", async function () {
        let el = crear(); await tick(10);
        el.buscarCitas();
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("identif");
    });

    test("rango de fechas invalido deberia mostrar error", async function () {
        let el = crear(); await tick(10);
        el.paciente = { idPersona: "p1" };
        el.desde.value = "2026-02-02";
        el.hasta.value = "2026-01-01";
        el.buscarCitas();
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("Desde");
    });

    test("buscar citas deberia pintar resultados y procedimientos", async function () {
        stubs.push(sinon.stub(ProcedimientoService.prototype, "findRange").resolves({ datos: [{ idProcedimiento: "pr1", nombre: "Limpieza" }] }));
        stubs.push(sinon.stub(ConsultaService.prototype, "buscar").resolves({ datos: [{ idConsulta: "c1", referenciaExterna: "R1", fechaInicio: "2026-01-01T00:00:00Z", idPersonaRol: { clinica: { nombre: "Central" } } }] }));
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "porConsulta").resolves({ datos: [{ idProcedimiento: "pr1" }] }));
        let el = crear(); await tick(10);
        el.paciente = { idPersona: "p1" };
        el.selector.root.querySelector("#tipo").value = "t1";
        el.selector.root.querySelector("#valor").value = "123";
        el.root.querySelector("#clinica").appendChild(new Option("Central", "c1"));
        el.desde.value = "2026-01-01"; el.hasta.value = "2026-12-31";
        el.buscarCitas();
        await tick(60);
        chai.expect(el.resultados.hidden).to.equal(false);
        chai.expect(el.root.querySelectorAll("tarjeta-cita").length).to.equal(1);
        chai.expect(el.citas[0]._procedimientos).to.include("Limpieza");
    });

    test("buscar citas vacias deberia mostrar info", async function () {
        stubs.push(sinon.stub(ProcedimientoService.prototype, "findRange").resolves({ datos: [] }));
        stubs.push(sinon.stub(ConsultaService.prototype, "buscar").resolves({ datos: [] }));
        let el = crear(); await tick(10);
        el.paciente = { idPersona: "p1" };
        el.selector.root.querySelector("#tipo").value = "t1";
        el.selector.root.querySelector("#valor").value = "123";
        el.root.querySelector("#clinica").appendChild(new Option("C", "c1"));
        el.desde.value = ""; el.hasta.value = "";
        el.buscarCitas();
        await tick(60);
        chai.expect(el.root.querySelector("#cuadricula mensaje-panel")).to.exist;
    });

    test("error al buscar citas deberia mostrarse", async function () {
        stubs.push(sinon.stub(ConsultaService.prototype, "buscar").rejects(new Error("boom")));
        let el = crear(); await tick(10);
        el.paciente = { idPersona: "p1" };
        el.selector.root.querySelector("#tipo").value = "t1";
        el.selector.root.querySelector("#valor").value = "123";
        el.root.querySelector("#clinica").appendChild(new Option("C", "c1"));
        el.buscarCitas();
        await tick(40);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("boom");
    });

    test("descargar ticket sin cita valida no deberia lanzar", function () {
        let el = crear();
        chai.expect(() => el.descargarTicket(null)).to.not.throw();
        chai.expect(() => el.descargarTicket({})).to.not.throw();
    });

    test("descargar ticket con error deberia mostrar mensaje", async function () {
        stubs.push(sinon.stub(ConsultaService.prototype, "descargarTicket").rejects(new Error("pdf fail")));
        let el = crear(); await tick(10);
        el.descargarTicket({ idConsulta: "c1" });
        await tick(40);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("pdf");
    });
});

mocha.run();
