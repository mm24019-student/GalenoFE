import * as chai from "../lib/chai/index.js";
import sinon from "../lib/sinon/sinon-esm.js";
import TipoDocumentoService from "../../../src/js/control/tipo_documento_service.js";
import "../../../src/js/boundary/selector_documento.js";
mocha.setup("tdd");

function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)); }

suite("boundary/selector-documento", function () {
    let stubFind;

    setup(function () {
        stubFind = sinon.stub(TipoDocumentoService.prototype, "findRange").resolves({
            datos: [
                { idTipoDocumento: "t1", nombre: "DUI", activo: true },
                { idTipoDocumento: "t2", nombre: "Inactivo", activo: false }
            ]
        });
    });

    teardown(function () {
        if (stubFind) stubFind.restore();
        document.querySelectorAll("selector-documento").forEach(e => e.remove());
    });

    test("deberia cargar solo tipos activos", async function () {
        let el = document.createElement("selector-documento");
        document.body.appendChild(el);
        await tick(10);
        let opciones = Array.from(el.root.querySelectorAll("#tipo option")).map(o => o.textContent);
        chai.expect(opciones).to.include("DUI");
        chai.expect(opciones).to.not.include("Inactivo");
    });

    test("sin tipo seleccionado deberia emitir error y no buscar", async function () {
        let el = document.createElement("selector-documento");
        document.body.appendChild(el);
        await tick(10);
        let errores = [];
        let buscado = false;
        el.addEventListener("error", e => errores.push(e.detail.message));
        el.addEventListener("documento-buscado", () => { buscado = true; });
        el.root.querySelector("#valor").value = "123";
        el.root.querySelector("#buscar").click();
        chai.expect(buscado).to.equal(false);
        chai.expect(errores.join()).to.include("tipo de documento");
    });

    test("sin valor deberia emitir error", async function () {
        let el = document.createElement("selector-documento");
        document.body.appendChild(el);
        await tick(10);
        let errores = [];
        el.addEventListener("error", e => errores.push(e.detail.message));
        el.root.querySelector("#tipo").value = "t1";
        el.root.querySelector("#valor").value = "   ";
        el.root.querySelector("#buscar").click();
        chai.expect(errores.join()).to.include("número de documento");
    });

    test("con datos validos deberia emitir documento-buscado y quedar ocupado", async function () {
        let el = document.createElement("selector-documento");
        document.body.appendChild(el);
        await tick(10);
        let detalle = null;
        el.addEventListener("documento-buscado", e => { detalle = e.detail; });
        el.root.querySelector("#tipo").value = "t1";
        el.root.querySelector("#valor").value = "  12345  ";
        el.root.querySelector("#buscar").click();
        chai.expect(detalle).to.deep.equal({ tipo: "t1", valor: "12345" });
        chai.expect(el.root.querySelector("#buscar").disabled).to.equal(true);
        el.listo();
        chai.expect(el.root.querySelector("#buscar").disabled).to.equal(false);
    });

    test("bloqueado deberia impedir una nueva busqueda", async function () {
        let el = document.createElement("selector-documento");
        document.body.appendChild(el);
        await tick(10);
        let buscado = false;
        el.addEventListener("documento-buscado", () => { buscado = true; });
        el.root.querySelector("#tipo").value = "t1";
        el.root.querySelector("#valor").value = "12345";
        el.bloqueado = true;
        chai.expect(el.root.querySelector("#buscar").disabled).to.equal(true);
        el.root.querySelector("#buscar").click();
        chai.expect(buscado).to.equal(false);
        el.bloqueado = false;
        el.root.querySelector("#buscar").click();
        chai.expect(buscado).to.equal(true);
    });

    test("enter en valor deberia disparar busqueda", async function () {
        let el = document.createElement("selector-documento");
        document.body.appendChild(el);
        await tick(10);
        let detalle = null;
        el.addEventListener("documento-buscado", e => { detalle = e.detail; });
        el.root.querySelector("#tipo").value = "t1";
        el.root.querySelector("#valor").value = "99";
        el.root.querySelector("#valor").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        chai.expect(detalle).to.deep.equal({ tipo: "t1", valor: "99" });
    });

    test("fallo al cargar tipos deberia emitir error sin romper", async function () {
        stubFind.restore();
        stubFind = sinon.stub(TipoDocumentoService.prototype, "findRange").rejects(new Error("fallo tipos"));
        let errores = 0;
        let el = document.createElement("selector-documento");
        el.addEventListener("error", () => { errores++; });
        document.body.appendChild(el);
        await tick(10);
        chai.expect(errores).to.be.at.least(1);
        chai.expect(() => el.root.querySelector("#buscar").click()).to.not.throw();
    });
});

mocha.run();
