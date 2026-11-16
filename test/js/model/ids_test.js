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

    test("nuevoId deberia funcionar aunque crypto.randomUUID no exista", function () {
        let original = globalThis.crypto && globalThis.crypto.randomUUID;
        try {
            if (globalThis.crypto) {
                globalThis.crypto.randomUUID = undefined;
            }
            let id = nuevoId();
            chai.expect(id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        } finally {
            if (globalThis.crypto) {
                globalThis.crypto.randomUUID = original;
            }
        }
    });
});

mocha.run();
