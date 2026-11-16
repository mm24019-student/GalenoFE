import * as chai from "../../lib/chai/index.js";
import { opcionesDeMenu } from "../../../src/js/boundary/galeno_nav.js";
import "../../../src/js/boundary/galeno_nav.js";
import { sesion } from "../../../src/js/control/sesion.js";
mocha.setup("tdd");

suite("boundary/galeno-nav", function () {
    let hashOriginal;

    setup(function () { hashOriginal = location.hash; sesion.cerrar(); });
    teardown(function () {
        document.querySelectorAll("galeno-nav").forEach(e => e.remove());
        sesion.cerrar();
        location.hash = hashOriginal;
    });

    test("opcionesDeMenu sin sesion deberia mostrar busqueda y login", function () {
        let ops = opcionesDeMenu(false).map(o => o.ruta || o.accion);
        chai.expect(ops).to.include("#/busqueda");
        chai.expect(ops).to.include("#/login");
        chai.expect(ops).to.not.include("#/dashboard");
    });

    test("opcionesDeMenu con sesion deberia mostrar dashboard y cerrar", function () {
        let ops = opcionesDeMenu(true).map(o => o.ruta || o.accion);
        chai.expect(ops).to.include("#/dashboard");
        chai.expect(ops).to.include("cerrar");
        chai.expect(ops).to.not.include("#/login");
    });

    test("componente deberia renderizar y cerrar sesion al pulsar", function () {
        sesion.iniciar({ idPersona: "p1" }, []);
        location.hash = "#/dashboard";
        let el = document.createElement("galeno-nav");
        document.body.appendChild(el);
        let boton = Array.from(el.root.querySelectorAll("button")).find(b => b.textContent.includes("Cerrar"));
        chai.expect(boton).to.exist;
        boton.click();
        chai.expect(sesion.activa).to.equal(false);
        chai.expect(location.hash).to.equal("#/busqueda");
    });

    test("sin sesion deberia mostrar enlace a login", function () {
        let el = document.createElement("galeno-nav");
        document.body.appendChild(el);
        let textos = Array.from(el.root.querySelectorAll("a,button")).map(n => n.textContent);
        chai.expect(textos.join("|")).to.include("Iniciar sesión");
    });
});

mocha.run();
