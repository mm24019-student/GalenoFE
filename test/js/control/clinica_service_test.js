import * as chai from "../lib/chai/index.js";
import ClinicaService from "../../../src/js/control/clinica_service.js";
import sinon from "../lib/sinon/sinon-esm.js";
mocha.setup("tdd");

var stubFetch = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify([
    {
        "activo": true,
        "idClinica": "adf4ce02-7487-4bd4-84c6-8779f6e66d64",
        "nombre": "Clinica Central",
        "tipo": "GENERAL",
        "comentarios": "Sede principal"
    },
    {
        "activo": true,
        "idClinica": "adf4ce02-7487-4bd4-84c6-8779f6e66d65",
        "nombre": "Clinica Norte",
        "tipo": "GENERAL",
        "comentarios": "Sede norte"
    }
]), { status: 200, headers: { "Total-registros": 2 } }));

suite("ClinicaService", function () {
    test("ClinicaService deberia retornar un DefaultResponse con los datos correctos", function (done) {
        let servicio = new ClinicaService();
        servicio.findRange(0, 10).then(resp => {
            chai.expect(resp).to.be.an.instanceOf(Object);
            chai.expect(resp.datos).to.be.an('array').that.has.lengthOf(2);
            chai.expect(resp.totalDatos).to.equal('2');
            stubFetch.restore();
            done();
        }).catch(err => {
            done(err);
        });
    });
});

mocha.run();