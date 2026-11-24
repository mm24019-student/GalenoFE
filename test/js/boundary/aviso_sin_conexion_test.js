import * as chai from "../lib/chai/index.js";
import { conectividad } from "../../../src/js/control/conectividad.js";
import "../../../src/js/boundary/aviso_sin_conexion.js";
mocha.setup("tdd");

suite("boundary/aviso-sin-conexion", function () {
    teardown(function () {
        document.querySelectorAll("aviso-sin-conexion").forEach(e => e.remove());
        conectividad.marcar(true);
    });

    function crear() {
        let el = document.createElement("aviso-sin-conexion");
        document.body.appendChild(el);
        return el;
    }

    test("estado conectado deberia ocultar el aviso y el bloqueo", function () {
        let el = crear();
        el.actualizar({ conectado: true });
        chai.expect(el.aviso.hidden).to.equal(true);
        chai.expect(el.bloqueo.hidden).to.equal(true);
    });

    test("estado sin conexion deberia bloquear la interfaz y explicar el motivo", function () {
        let el = crear();
        el.actualizar({ conectado: false });
        chai.expect(el.aviso.hidden).to.equal(false);
        chai.expect(el.bloqueo.hidden).to.equal(false);
        chai.expect(el.aviso.getAttribute("role")).to.equal("status");
        chai.expect(el.aviso.getAttribute("aria-live")).to.equal("polite");
        chai.expect(el.aviso.textContent).to.include("No puede buscar citas ni atender consultas");
    });

    test("cambio de conectividad deberia actualizar el aviso", function () {
        let el = crear();
        conectividad.marcar(false);
        chai.expect(el.bloqueo.hidden).to.equal(false);
        conectividad.marcar(true);
        chai.expect(el.bloqueo.hidden).to.equal(true);
    });

    test("estado incompleto no deberia cambiar el aviso", function () {
        let el = crear();
        el.actualizar({ conectado: false });
        el.actualizar({});
        chai.expect(el.aviso.hidden).to.equal(false);
    });
});

mocha.run();
