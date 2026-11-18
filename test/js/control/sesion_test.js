import * as chai from "../lib/chai/index.js";
import { Sesion } from "../../../src/js/control/sesion.js";
mocha.setup("tdd");

function almacenMemoria(inicial) {
    let datos = Object.assign({}, inicial || {});
    return {
        getItem: k => Object.prototype.hasOwnProperty.call(datos, k) ? datos[k] : null,
        setItem: (k, v) => { datos[k] = String(v); },
        removeItem: k => { delete datos[k]; },
        dump: () => Object.assign({}, datos)
    };
}

suite("control/sesion", function () {
    test("iniciar sin sesion deberia marcar activa false y exponer null/vacio", function () {
        let s = new Sesion(almacenMemoria());
        chai.expect(s.activa).to.equal(false);
        chai.expect(s.usuario).to.equal(null);
        chai.expect(s.asignaciones).to.deep.equal([]);
        chai.expect(s.clinica).to.equal(null);
        chai.expect(s.rol).to.equal(null);
    });

    test("iniciar deberia guardar usuario y asignaciones y emitir cambio", function (done) {
        let s = new Sesion(almacenMemoria());
        let usuario = { idPersona: "p1", nombres: "Ana" };
        let asignaciones = [{ rol: { nombre: "Doctor" } }];
        s.addEventListener("cambio", () => {
            try {
                chai.expect(s.activa).to.equal(true);
                chai.expect(s.usuario).to.deep.equal(usuario);
                chai.expect(s.asignaciones).to.deep.equal(asignaciones);
                done();
            } catch (e) { done(e); }
        });
        s.iniciar(usuario, asignaciones);
    });

    test("iniciar con asignaciones null/undefined no deberia romper", function () {
        let s = new Sesion(almacenMemoria());
        s.iniciar({ idPersona: "p1" }, null);
        chai.expect(s.asignaciones).to.deep.equal([]);
        s.iniciar({ idPersona: "p2" }, undefined);
        chai.expect(s.asignaciones).to.deep.equal([]);
    });

    test("elegirContexto sin sesion deberia lanzar", function () {
        let s = new Sesion(almacenMemoria());
        chai.expect(() => s.elegirContexto({ idClinica: "c" }, { idRol: "r" })).to.throw("No hay una sesion iniciada");
    });

    test("elegirContexto con sesion deberia actualizar clinica y rol", function () {
        let s = new Sesion(almacenMemoria());
        s.iniciar({ idPersona: "p1" }, []);
        let clinica = { idClinica: "c1" };
        let rol = { idRol: "r1" };
        s.elegirContexto(clinica, rol);
        chai.expect(s.clinica).to.deep.equal(clinica);
        chai.expect(s.rol).to.deep.equal(rol);
    });

    test("cerrar deberia limpiar sesion y emitir cambio", function (done) {
        let s = new Sesion(almacenMemoria());
        s.iniciar({ idPersona: "p1" }, [{ x: 1 }]);
        s.elegirContexto({ idClinica: "c" }, { idRol: "r" });
        s.addEventListener("cambio", () => {
            try {
                if (!s.activa) {
                    chai.expect(s.usuario).to.equal(null);
                    chai.expect(s.clinica).to.equal(null);
                    done();
                }
            } catch (e) { done(e); }
        });
        s.cerrar();
    });

    test("deberia persistir y recuperar desde almacen", function () {
        let almacen = almacenMemoria();
        let s1 = new Sesion(almacen);
        s1.iniciar({ idPersona: "p1" }, [{ a: 1 }]);
        s1.elegirContexto({ idClinica: "c" }, { idRol: "r" });
        let s2 = new Sesion(almacen);
        chai.expect(s2.activa).to.equal(true);
        chai.expect(s2.usuario.idPersona).to.equal("p1");
        chai.expect(s2.clinica.idClinica).to.equal("c");
    });

    test("almacen corrupto o que lanza no deberia romper la sesion", function () {
        let roto = {
            getItem() { throw new Error("boom"); },
            setItem() { throw new Error("boom"); },
            removeItem() { throw new Error("boom"); }
        };
        let s = new Sesion(roto);
        chai.expect(s.activa).to.equal(false);
        chai.expect(() => s.iniciar({ idPersona: "p" }, [])).to.not.throw();
        chai.expect(s.activa).to.equal(true);
        let corrupto = almacenMemoria({ "galeno-sesion": "{no-json" });
        let s2 = new Sesion(corrupto);
        chai.expect(s2.activa).to.equal(false);
    });
});

mocha.run();
