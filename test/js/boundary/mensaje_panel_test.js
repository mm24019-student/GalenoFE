import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/mensaje_panel.js";
mocha.setup("tdd");

suite("boundary/mensaje-panel", function () {
    function crear() {
        let el = document.createElement("mensaje-panel");
        document.body.appendChild(el);
        return el;
    }

    teardown(function () {
        document.querySelectorAll("mensaje-panel").forEach(e => e.remove());
    });

    test("deberia crearse y ocultarse", function () {
        let el = crear();
        chai.expect(el).to.exist;
        el.ocultar();
        chai.expect(el.hasAttribute("oculto")).to.equal(true);
    });

    test("mostrar deberia aceptar tipos conocidos y desconocidos sin lanzar", function () {
        let el = crear();
        ["info", "error", "exito", "cargando", "raro", null, undefined, ""].forEach(tipo => {
            chai.expect(() => el.mostrar(tipo, "msg")).to.not.throw();
        });
        el.mostrar("error", "fallo");
        let panel = el.root.querySelector(".panel");
        chai.expect(panel.getAttribute("role")).to.equal("alert");
        chai.expect(el.root.querySelector(".texto").textContent).to.equal("fallo");
        el.mostrar("info", null);
        chai.expect(el.root.querySelector(".texto").textContent).to.equal("");
    });

    test("mostrar deberia remover atributo oculto", function () {
        let el = crear();
        el.ocultar();
        el.mostrar("info", "hola");
        chai.expect(el.hasAttribute("oculto")).to.equal(false);
    });
});

mocha.run();
