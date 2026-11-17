import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import { sesion } from "../../../src/js/control/sesion.js";
import ConsultaService from "../../../src/js/control/consulta_service.js";
import ProcedimientoService from "../../../src/js/control/procedimiento_service.js";
import ConsultaProcedimientoService from "../../../src/js/control/consulta_procedimiento_service.js";
import ConsultaProcedimientoPasoService from "../../../src/js/control/consulta_procedimiento_paso_service.js";
import ProcedimientoPasoService from "../../../src/js/control/procedimiento_paso_service.js";
import ProcedimientoPasoSecuenciaService from "../../../src/js/control/procedimiento_paso_secuencia_service.js";
import "../../../src/js/boundary/pagina_dashboard.js";
mocha.setup("tdd");

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

const asigEmpleado = { rol: { idRol: "r1", nombre: "Doctor" }, clinica: { idClinica: "c1", nombre: "Central" }, idPersonaRol: "pr1" };

suite("boundary/pagina-dashboard", function () {
    let stubs = [];

    setup(function () {
        sesion.cerrar();
        stubs.push(sinon.stub(ProcedimientoService.prototype, "findRange").resolves({ datos: [] }));
    });

    teardown(function () {
        stubs.forEach(s => s.restore());
        stubs = [];
        document.querySelectorAll("pagina-dashboard").forEach(e => e.remove());
        sesion.cerrar();
    });

    function crear() {
        let el = document.createElement("pagina-dashboard");
        document.body.appendChild(el);
        return el;
    }

    test("sin asignaciones de empleado deberia mostrar error", async function () {
        sesion.iniciar({ idPersona: "p1", nombres: "Ana" }, [{ rol: { nombre: "Paciente" }, clinica: { idClinica: "c1", nombre: "C" } }]);
        let el = crear(); await tick(20);
        chai.expect(el.contexto.hidden).to.equal(true);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("empleado");
    });

    test("deberia listar contextos y elegir clinica/rol", async function () {
        sesion.iniciar({ idPersona: "p1", nombres: "Ana" }, [asigEmpleado]);
        stubs.push(sinon.stub(ConsultaService.prototype, "buscar").resolves({ datos: [] }));
        let el = crear(); await tick(20);
        chai.expect(el.q("#clinica").options.length).to.equal(1);
        chai.expect(el.q("#rol").options.length).to.equal(1);
        el.elegirContexto();
        await tick(40);
        chai.expect(sesion.clinica.idClinica).to.equal("c1");
        chai.expect(sesion.rol.idRol).to.equal("r1");
        chai.expect(el.consultas.hidden).to.equal(false);
    });

    test("buscar consultas sin contexto deberia dar error", async function () {
        sesion.iniciar({ idPersona: "p1", nombres: "Ana" }, [asigEmpleado]);
        let el = crear(); await tick(20);
        sesion.cerrar(); // fuerza sin contexto
        sesion.iniciar({ idPersona: "p1", nombres: "Ana" }, [asigEmpleado]);
        el.buscarConsultas();
        // sesion.clinica es null hasta elegir
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.satisfy(t => t.includes("clínica") || t.includes("rol") || t.includes("Primero"));
    });

    test("rango de fechas invalido en dashboard deberia mostrar error", async function () {
        sesion.iniciar({ idPersona: "p1", nombres: "Ana" }, [asigEmpleado]);
        let el = crear(); await tick(20);
        el.elegirContexto(); await tick(20);
        el.q("#desde").value = "2026-05-05";
        el.q("#hasta").value = "2026-01-01";
        el.buscarConsultas();
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("Desde");
    });

    test("buscar consultas deberia pintar tarjetas", async function () {
        sesion.iniciar({ idPersona: "p1", nombres: "Ana" }, [asigEmpleado]);
        stubs.push(sinon.stub(ConsultaService.prototype, "buscar").resolves({ datos: [{ idConsulta: "c1", referenciaExterna: "R1", fechaInicio: "2026-01-01T00:00:00Z", idPersonaRol: { idPersona: { nombres: "P" } } }] }));
        stubs.push(sinon.stub(ConsultaProcedimientoService.prototype, "porConsulta").resolves({ datos: [] }));
        stubs.push(sinon.stub(ConsultaProcedimientoPasoService.prototype, "porConsultaProcedimiento").resolves({ datos: [] }));
        stubs.push(sinon.stub(ProcedimientoPasoService.prototype, "porProcedimiento").resolves({ datos: [] }));
        stubs.push(sinon.stub(ProcedimientoPasoSecuenciaService.prototype, "porProcedimiento").resolves({ datos: [] }));
        let el = crear(); await tick(20);
        el.elegirContexto(); await tick(60);
        chai.expect(el.resultados.hidden).to.equal(false);
        chai.expect(el.root.querySelectorAll("tarjeta-consulta").length).to.equal(1);
    });

    test("error al buscar consultas deberia mostrarse", async function () {
        sesion.iniciar({ idPersona: "p1", nombres: "Ana" }, [asigEmpleado]);
        stubs.push(sinon.stub(ConsultaService.prototype, "buscar").rejects(new Error("fallo dash")));
        let el = crear(); await tick(20);
        el.elegirContexto(); await tick(40);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("fallo");
    });
});

mocha.run();
