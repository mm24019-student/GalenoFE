import * as chai from "../lib/chai/index.js";
import { nuevoId } from "../../../src/js/model/ids.js";
mocha.setup("tdd");

suite("model/ids", function () {
    test("nuevoId deberia generar un UUID valido", function () {
        chai.expect(nuevoId()).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test("nuevoId deberia generar valores distintos", function () {
        let ids = new Set(Array.from({ length: 50 }, () => nuevoId()));
        chai.expect(ids.size).to.equal(50);
    });
});

mocha.run();
