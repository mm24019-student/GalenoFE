import * as chai from "../lib/chai/index.js";
import "../../../src/js/boundary/aviso_instalar_app.js";
mocha.setup("tdd");

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

function promoverInstalacion() {
    let evento = new Event("beforeinstallprompt", { cancelable: true });
    evento.prompt = () => {};
    evento.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(evento);
    return evento;
}

suite("boundary/aviso-instalar-app", function () {
    setup(function () {
        try { localStorage.removeItem("galeno-app-instalada"); } catch (e) {}
        promoverInstalacion();
    });

    teardown(function () {
        document.querySelectorAll("aviso-instalar-app").forEach(e => e.remove());
        try { localStorage.removeItem("galeno-app-instalada"); } catch (e) {}
    });

    function crear() {
        let el = document.createElement("aviso-instalar-app");
        document.body.appendChild(el);
        return el;
    }

    test("beforeinstallprompt no deberia mostrar el aviso hasta pedirlo", async function () {
        let el = crear();
        await tick(10);
        chai.expect(el.aviso.hidden).to.equal(true);
        el.mostrar();
        chai.expect(el.aviso.hidden).to.equal(false);
        chai.expect(el.botonInstalar.disabled).to.equal(false);
    });

    test("boton instalar deberia ejecutar prompt y ocultar el aviso", async function () {
        let prompts = 0;
        let evento = new Event("beforeinstallprompt", { cancelable: true });
        evento.prompt = () => { prompts++; };
        evento.userChoice = Promise.resolve({ outcome: "accepted" });
        window.dispatchEvent(evento);
        let el = crear();
        await tick(10);
        el.mostrar();
        el.botonInstalar.click();
        await tick(20);
        chai.expect(prompts).to.equal(1);
        chai.expect(el.aviso.hidden).to.equal(true);
    });

    test("abrirModal deberia permitir ver el PDF en linea", async function () {
        promoverInstalacion();
        let el = crear();
        await tick(10);
        let vistas = 0;
        el.abrirModal(() => { vistas++; });
        chai.expect(el.aviso.hidden).to.equal(false);
        chai.expect(el.botonVerLinea.textContent).to.include("Solo ver PDF en línea");
        el.botonVerLinea.click();
        chai.expect(vistas).to.equal(1);
        chai.expect(el.aviso.hidden).to.equal(true);
    });

    test("cancelar deberia ocultar el aviso", async function () {
        promoverInstalacion();
        let el = crear();
        await tick(10);
        el.mostrar();
        el.root.querySelector(".aviso-instalar__cerrar").click();
        chai.expect(el.aviso.hidden).to.equal(true);
    });
});

mocha.run();
