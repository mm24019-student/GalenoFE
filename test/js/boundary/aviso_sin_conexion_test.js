import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/aviso_sin_conexion.js";
mocha.setup("tdd");

suite("boundary/aviso-sin-conexion", function () {
    teardown(function () {
        document.querySelectorAll("aviso-sin-conexion").forEach(e => e.remove());
    });

    function crear() {
        let el = document.createElement("aviso-sin-conexion");
        document.body.appendChild(el);
        return el;
    }

    test("estado conectado deberia ocultar el aviso", function () {
        let el = crear();
        el.actualizar({ conectado: true });
        chai.expect(el.aviso.hidden).to.equal(true);
    });

    test("estado sin conexion deberia mostrar el aviso accesible", function () {
        let el = crear();
        el.actualizar({ conectado: false });
        chai.expect(el.aviso.hidden).to.equal(false);
        chai.expect(el.aviso.getAttribute("role")).to.equal("status");
        chai.expect(el.aviso.getAttribute("aria-live")).to.equal("polite");
    });

    test("estado incompleto no deberia cambiar el aviso", function () {
        let el = crear();
        el.actualizar({ conectado: false });
        el.actualizar({});
        chai.expect(el.aviso.hidden).to.equal(false);
    });
});

mocha.run();
