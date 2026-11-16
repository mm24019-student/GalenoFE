import * as chai from "../lib/chai/index.js";
import { RUTAS, NO_ENCONTRADA, leerHash, construirHash, resolverRuta } from "../../../src/js/model/rutas.js";
mocha.setup("tdd");

suite("model/rutas", function () {
    test("leerHash deberia separar la ruta y los parametros", function () {
        let resultado = leerHash("#/atencion?id=abc&paso=2");
        chai.expect(resultado.ruta).to.equal("/atencion");
        chai.expect(resultado.parametros.get("id")).to.equal("abc");
        chai.expect(resultado.parametros.get("paso")).to.equal("2");
    });

    test("leerHash sin hash o vacio deberia devolver ruta vacia y params vacios", function () {
        chai.expect(leerHash("").ruta).to.equal("");
        chai.expect(leerHash(null).ruta).to.equal("");
        chai.expect(leerHash(undefined).ruta).to.equal("");
        chai.expect(leerHash("#").ruta).to.equal("");
        chai.expect(leerHash("#/busqueda").parametros.toString()).to.equal("");
    });

    test("leerHash con query mal formada no deberia lanzar", function () {
        let resultado = leerHash("#/atencion?%%%&&=x");
        chai.expect(resultado.ruta).to.equal("/atencion");
        chai.expect(resultado.parametros).to.be.an.instanceOf(URLSearchParams);
    });

    test("construirHash deberia omitir parametros vacios", function () {
        chai.expect(construirHash("/atencion", { id: "abc", paso: "", vacio: null }))
            .to.equal("#/atencion?id=abc");
    });

    test("construirHash deberia aceptar parametros ausentes o nulos", function () {
        chai.expect(construirHash("/busqueda")).to.equal("#/busqueda");
        chai.expect(construirHash("/busqueda", null)).to.equal("#/busqueda");
        chai.expect(construirHash("/busqueda", { a: undefined, b: 0 })).to.equal("#/busqueda?a=&b=0");
    });

    test("la ruta raiz deberia redirigir a la busqueda publica", function () {
        chai.expect(resolverRuta("", false).redirigir).to.equal("#/busqueda");
        chai.expect(resolverRuta("#/", false).redirigir).to.equal("#/busqueda");
        chai.expect(resolverRuta(null, false).redirigir).to.equal("#/busqueda");
    });

    test("una ruta privada sin sesion deberia redirigir al login", function () {
        chai.expect(resolverRuta("#/dashboard", false).redirigir).to.equal("#/login");
        chai.expect(resolverRuta("#/atencion?id=1", false).redirigir).to.equal("#/login");
    });

    test("una ruta privada con sesion deberia resolverse", function () {
        let resolucion = resolverRuta("#/dashboard", true);
        chai.expect(resolucion.definicion.ruta).to.equal("/dashboard");
        chai.expect(resolucion.parametros).to.be.an.instanceOf(URLSearchParams);
        let atencion = resolverRuta("#/atencion?id=123", true);
        chai.expect(atencion.definicion.ruta).to.equal("/atencion");
        chai.expect(atencion.parametros.get("id")).to.equal("123");
    });

    test("el login con sesion activa deberia redirigir al dashboard", function () {
        chai.expect(resolverRuta("#/login", true).redirigir).to.equal("#/dashboard");
    });

    test("el login sin sesion deberia resolverse", function () {
        let resolucion = resolverRuta("#/login", false);
        chai.expect(resolucion.definicion.ruta).to.equal("/login");
    });

    test("una ruta desconocida deberia usar la pagina no encontrada", function () {
        chai.expect(resolverRuta("#/no-existe", true).definicion).to.equal(NO_ENCONTRADA);
        chai.expect(resolverRuta("#/no-existe", false).definicion).to.equal(NO_ENCONTRADA);
        chai.expect(resolverRuta("#/dashboard/x", true).definicion).to.equal(NO_ENCONTRADA);
    });

    test("las rutas publicas deberian estar marcadas como tales", function () {
        let publicas = RUTAS.filter(r => r.publica).map(r => r.ruta);
        chai.expect(publicas).to.include("/busqueda");
        chai.expect(publicas).to.include("/login");
        chai.expect(publicas).to.not.include("/dashboard");
        chai.expect(publicas).to.not.include("/atencion");
    });
});

mocha.run();
