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

    test("construirHash deberia omitir parametros vacios", function () {
        chai.expect(construirHash("/atencion", { id: "abc", paso: "", vacio: null }))
            .to.equal("#/atencion?id=abc");
    });

    test("la ruta raiz deberia redirigir a la busqueda publica", function () {
        chai.expect(resolverRuta("", false).redirigir).to.equal("#/busqueda");
        chai.expect(resolverRuta("#/", false).redirigir).to.equal("#/busqueda");
    });

    test("una ruta privada sin sesion deberia redirigir al login", function () {
        chai.expect(resolverRuta("#/dashboard", false).redirigir).to.equal("#/login");
    });

    test("una ruta privada con sesion deberia resolverse", function () {
        let resolucion = resolverRuta("#/dashboard", true);
        chai.expect(resolucion.definicion.ruta).to.equal("/dashboard");
        chai.expect(resolucion.parametros).to.be.an.instanceOf(URLSearchParams);
    });

    test("el login con sesion activa deberia redirigir al dashboard", function () {
        chai.expect(resolverRuta("#/login", true).redirigir).to.equal("#/dashboard");
    });

    test("una ruta desconocida deberia usar la pagina no encontrada", function () {
        chai.expect(resolverRuta("#/no-existe", true).definicion).to.equal(NO_ENCONTRADA);
    });

    test("las rutas publicas deberian estar marcadas como tales", function () {
        let publicas = RUTAS.filter(r => r.publica).map(r => r.ruta);
        chai.expect(publicas).to.include("/busqueda");
        chai.expect(publicas).to.include("/login");
    });
});

mocha.run();
