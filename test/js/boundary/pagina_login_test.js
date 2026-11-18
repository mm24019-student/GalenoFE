import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import DocumentoService from "../../../src/js/control/documento_service.js";
import PersonaRolService from "../../../src/js/control/persona_rol_service.js";
import TipoDocumentoService from "../../../src/js/control/tipo_documento_service.js";
import { sesion } from "../../../src/js/control/sesion.js";
import "../../../src/js/boundary/pagina_login.js";
mocha.setup("tdd");

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

suite("boundary/pagina-login", function () {
    let stubs = [];
    let hashOriginal;

    setup(function () {
        sesion.cerrar();
        hashOriginal = location.hash;
        stubs.push(sinon.stub(TipoDocumentoService.prototype, "findRange").resolves({ datos: [{ idTipoDocumento: "t1", nombre: "DUI", activo: true }] }));
    });

    teardown(function () {
        stubs.forEach(s => s.restore());
        stubs = [];
        document.querySelectorAll("pagina-login").forEach(e => e.remove());
        sesion.cerrar();
        location.hash = hashOriginal;
    });

    function crear() {
        let el = document.createElement("pagina-login");
        document.body.appendChild(el);
        return el;
    }

    test("identidad sin rol empleado deberia mostrar error y no entrar", async function () {
        let persona = { idPersona: "p1", nombres: "Ana", apellidos: "Lopez" };
        stubs.push(sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [{ idDocumento: "d1", idPersona: persona }] }));
        stubs.push(sinon.stub(PersonaRolService.prototype, "porPersona").resolves({ datos: [{ rol: { idRol: "rp", nombre: "Paciente" }, clinica: { idClinica: "c1", nombre: "C1" } }] }));
        let el = crear();
        await tick(10);
        el.identificar({ tipo: "t1", valor: "123" });
        await tick(30);
        chai.expect(el.resultado.hidden).to.equal(true);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("empleado");
        chai.expect(sesion.activa).to.equal(false);
    });

    test("identidad valida de empleado deberia listar roles y entrar al dashboard", async function () {
        let persona = { idPersona: "p1", nombres: "Ana", apellidos: "Lopez" };
        let asignaciones = [{ rol: { idRol: "r1", nombre: "Doctor" }, clinica: { idClinica: "c1", nombre: "Central" } }];
        stubs.push(sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [{ idDocumento: "d1", idPersona: persona }] }));
        stubs.push(sinon.stub(PersonaRolService.prototype, "porPersona").resolves({ datos: asignaciones }));
        let el = crear();
        await tick(10);
        el.identificar({ tipo: "t1", valor: "123" });
        await tick(30);
        chai.expect(el.resultado.hidden).to.equal(false);
        chai.expect(el.resultado.textContent).to.include("Doctor");
        chai.expect(el.resultado.textContent).to.include("Central");
        el.root.querySelector("button.entrar").click();
        chai.expect(sesion.activa).to.equal(true);
        chai.expect(sesion.usuario.idPersona).to.equal("p1");
        chai.expect(location.hash).to.equal("#/dashboard");
    });

    test("error de identidad deberia mostrar mensaje y limpiar resultado", async function () {
        stubs.push(sinon.stub(DocumentoService.prototype, "buscar").rejects(new Error("caida")));
        let el = crear();
        await tick(10);
        el.identificar({ tipo: "t1", valor: "123" });
        await tick(30);
        chai.expect(el.resultado.hidden).to.equal(true);
        chai.expect(el.mensaje.root.querySelector(".texto").textContent).to.include("caida");
    });

    test("documento no encontrado deberia informar error", async function () {
        stubs.push(sinon.stub(DocumentoService.prototype, "buscar").resolves({ datos: [] }));
        let el = crear();
        await tick(10);
        el.identificar({ tipo: "t1", valor: "999" });
        await tick(30);
        chai.expect(el.mensaje.root.querySelector(".panel").className).to.include("error");
    });
});

mocha.run();
