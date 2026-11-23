import * as chai from "../lib/chai/index.js";
import { indicacionesExamen, examenDeIndicaciones, textoResultado } from "../../../src/js/model/examenes.js";
mocha.setup("tdd");

suite("model/examenes", function () {
    test("indicacionesExamen deberia codificar id y nombre", function () {
        chai.expect(indicacionesExamen({ idExamen: "e1", nombre: "Rayos X" })).to.equal("Examen|e1|Rayos X");
    });

    test("examenDeIndicaciones deberia recuperar el examen", function () {
        chai.expect(examenDeIndicaciones("Examen|e1|Rayos X")).to.deep.equal({ idExamen: "e1", nombre: "Rayos X" });
        chai.expect(examenDeIndicaciones(null).idExamen).to.equal(null);
        chai.expect(examenDeIndicaciones("otro").nombre).to.equal("otro");
    });

    test("textoResultado deberia usar el valor o el defecto", function () {
        chai.expect(textoResultado(" Normal ")).to.equal("Normal");
        chai.expect(textoResultado("x")).to.equal("pendiente");
        chai.expect(textoResultado(null, "sin dato")).to.equal("sin dato");
    });
});

mocha.run();
