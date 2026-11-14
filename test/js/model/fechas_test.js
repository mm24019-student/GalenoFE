import * as chai from "../lib/chai/index.js";
import { aISO, fechaLocalDesdeISO, sumarDiasISO, hoyISO, esHoy, formatearFecha, formatearHora, formatearSoloFecha } from "../../../src/js/model/fechas.js";
mocha.setup("tdd");

suite("model/fechas", function () {
    test("aISO deberia usar dos digitos para mes y dia", function () {
        chai.expect(aISO(new Date(2026, 0, 5))).to.equal("2026-01-05");
    });

    test("fechaLocalDesdeISO deberia devolver null para textos invalidos", function () {
        chai.expect(fechaLocalDesdeISO("")).to.equal(null);
        chai.expect(fechaLocalDesdeISO("2026-13")).to.equal(null);
    });

    test("sumarDiasISO deberia cruzar meses y anos", function () {
        chai.expect(sumarDiasISO("2026-01-31", 1)).to.equal("2026-02-01");
        chai.expect(sumarDiasISO("2026-12-31", 1)).to.equal("2027-01-01");
    });

    test("hoyISO deberia tener el formato de input date", function () {
        chai.expect(hoyISO()).to.match(/^\d{4}-\d{2}-\d{2}$/);
    });

    test("esHoy deberia comparar contra la fecha actual", function () {
        chai.expect(esHoy(new Date().toISOString())).to.equal(true);
        chai.expect(esHoy("2000-01-01T00:00:00Z")).to.equal(false);
        chai.expect(esHoy(null)).to.equal(false);
    });

    test("los formateadores deberian tolerar valores vacios o invalidos", function () {
        chai.expect(formatearFecha(null)).to.equal("—");
        chai.expect(formatearHora("no-es-fecha")).to.equal("—");
        chai.expect(formatearSoloFecha("")).to.equal("—");
    });
});

mocha.run();
