import * as chai from "../lib/chai/index.js";
import { asignacionPara, nuevoPaso, textoIndicaciones } from "../../../src/js/model/atencion.js";
mocha.setup("tdd");

const clinica = { idClinica: "c-1" };
const definicion = { idProcedimientoPaso: "p-2", idRol: { idRol: "r-odonto" } };

suite("model/atencion", function () {
    test("asignacionPara deberia preferir la clinica y rol del paso", function () {
        let esperada = { idPersonaRol: "pr-1", rol: { idRol: "r-odonto" }, clinica: clinica };
        let otra = { idPersonaRol: "pr-2", rol: { idRol: "r-otro" }, clinica: clinica };
        chai.expect(asignacionPara(definicion, [otra, esperada], clinica)).to.equal(esperada);
    });

    test("asignacionPara deberia caer al mismo rol de otra clinica", function () {
        let esperada = { idPersonaRol: "pr-3", rol: { idRol: "r-odonto" }, clinica: { idClinica: "c-2" } };
        chai.expect(asignacionPara(definicion, [esperada], clinica)).to.equal(esperada);
    });

    test("asignacionPara sin coincidencias deberia devolver la primera", function () {
        let primera = { idPersonaRol: "pr-4", rol: { idRol: "r-x" }, clinica: { idClinica: "c-2" } };
        chai.expect(asignacionPara(definicion, [primera], clinica)).to.equal(primera);
        chai.expect(asignacionPara(definicion, [], clinica)).to.equal(null);
    });

    test("nuevoPaso deberia armar las relaciones solo con ids", function () {
        let paso = nuevoPaso({
            idConsultaProcedimiento: "cp-1",
            definicion: definicion,
            asignacion: { idPersonaRol: "pr-1" },
            fecha: "2026-01-01T00:00:00Z"
        });
        chai.expect(paso.idConsultaProcedimiento).to.deep.equal({ idConsultaProcedimiento: "cp-1" });
        chai.expect(paso.idProcedimientoPaso).to.deep.equal({ idProcedimientoPaso: "p-2" });
        chai.expect(paso.idPersonaRol).to.deep.equal({ idPersonaRol: "pr-1" });
        chai.expect(paso.estado).to.equal("PENDIENTE");
        chai.expect(paso.fechaInicio).to.equal("2026-01-01T00:00:00Z");
        chai.expect(paso.idConsultaProcedimientoPaso).to.match(/^[0-9a-f-]{36}$/);
    });

    test("nuevoPaso sin asignacion deberia dejar idPersonaRol en null", function () {
        let paso = nuevoPaso({ idConsultaProcedimiento: "cp-1", definicion: definicion, asignacion: null });
        chai.expect(paso.idPersonaRol).to.equal(null);
    });

    test("textoIndicaciones deberia unir los examenes y omitir vacios", function () {
        chai.expect(textoIndicaciones(["Hemograma", null, "Glucosa"]))
            .to.equal("Exámenes administrados: Hemograma, Glucosa");
        chai.expect(textoIndicaciones([])).to.equal("");
    });
});

mocha.run();
