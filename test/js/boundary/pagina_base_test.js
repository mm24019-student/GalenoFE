import * as chai from "../../lib/chai/index.js";
import PaginaBase from "../../../src/js/boundary/pagina_base.js";
mocha.setup("tdd");

suite("boundary/pagina_base", function () {
    let tag = "test-pagina-base-" + Math.random().toString(36).slice(2);
    class TestPagina extends PaginaBase {
        get titulo() { return "Titulo"; }
        get historia() { return "Etiqueta"; }
        contenido() { let p = document.createElement("p"); p.id = "c"; p.textContent = "ok"; return p; }
        conectado() { this.conectadoOk = true; }
    }
    if (!customElements.get(tag)) customElements.define(tag, TestPagina);

    teardown(function () {
        document.querySelectorAll(tag).forEach(e => e.remove());
    });

    test("deberia renderizar titulo/historia/contenido y llamar conectado", function () {
        let el = document.createElement(tag);
        document.body.appendChild(el);
        chai.expect(el.root.querySelector("h1").textContent).to.equal("Titulo");
        chai.expect(el.root.querySelector(".historia").textContent).to.equal("Etiqueta");
        chai.expect(el.root.querySelector("#c").textContent).to.equal("ok");
        chai.expect(el.conectadoOk).to.equal(true);
    });

    test("parametros deberia aceptar URLSearchParams, objetos y nulos", function () {
        let el = document.createElement(tag);
        el.parametros = new URLSearchParams("a=1");
        chai.expect(el.parametros.get("a")).to.equal("1");
        el.parametros = { b: "2" };
        chai.expect(el.parametros.get("b")).to.equal("2");
        el.parametros = null;
        chai.expect(el.parametros.toString()).to.equal("");
    });

    test("q deberia buscar en shadow root", function () {
        let el = document.createElement(tag);
        document.body.appendChild(el);
        chai.expect(el.q("h1")).to.exist;
        chai.expect(el.q("#noexiste")).to.equal(null);
    });
});

mocha.run();
