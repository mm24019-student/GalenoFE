import * as chai from "../lib/chai/index.js";
import ClinicaService from "../../../src/js/control/clinica_service.js";
import DefaultResponse from "../../../src/js/entity/default_response.js";
mocha.setup("bdd");
describe("ClinicaService", function () {
    var cut;
    it("should have an instance to test", function () {
        cut = new ClinicaService();
        chai.assert.isDefined(cut);
        chai.expect(cut).to.be.an.instanceOf(ClinicaService);
    });

    it("findRange should return a DefaultResponse with the correct data", function (done) {
        cut.findRange(0, 10).then(resp => {
            chai.expect(resp).to.be.an.instanceOf(DefaultResponse);
            chai.expect(resp.datos).to.be.an("array");
            chai.expect(Number(resp.totalDatos)).to.be.at.least(resp.datos.length);
            done();
        }).catch(err => {
            done(err);
        });
    });
});

mocha.run();