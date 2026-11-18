import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/galeno_router.js";
import { sesion } from "../../../src/js/control/sesion.js";
mocha.setup("tdd");

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

suite("boundary/galeno-router", function () {
    let hashOriginal;

    setup(function () {
        hashOriginal = location.hash;
        sesion.cerrar();
    });

    teardown(function () {
        document.querySelectorAll("galeno-router").forEach(e => e.remove());
        sesion.cerrar();
        location.hash = hashOriginal;
    });

    test("ruta raiz deberia redirigir a busqueda", async function () {
        location.hash = "";
        let el = document.createElement("galeno-router");
        document.body.appendChild(el);
        await tick(20);
        chai.expect(location.hash).to.equal("#/busqueda");
    });

    test("ruta privada sin sesion deberia redirigir a login", async function () {
        location.hash = "#/dashboard";
        let el = document.createElement("galeno-router");
        document.body.appendChild(el);
        await tick(30);
        chai.expect(location.hash).to.equal("#/login");
    });

    test("ruta desconocida deberia mostrar pagina no encontrada", async function () {
        location.hash = "#/no-existe";
        let el = document.createElement("galeno-router");
        document.body.appendChild(el);
        await tick(30);
        chai.expect(el.root.querySelector("pagina-no-encontrada")).to.exist;
    });

    test("ruta privada con sesion deberia renderizar componente", async function () {
        sesion.iniciar({ idPersona: "p1" }, []);
        location.hash = "#/dashboard";
        let el = document.createElement("galeno-router");
        document.body.appendChild(el);
        await tick(30);
        chai.expect(el.root.querySelector("pagina-dashboard")).to.exist;
    });
});

mocha.run();
