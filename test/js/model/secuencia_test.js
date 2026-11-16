import * as chai from "../lib/chai/index.js";
import { ordenarPasos, pasosOrdenados, indicePasoActual, idDePasoConsulta } from "../../../src/js/model/secuencia.js";
mocha.setup("tdd");

const A = { idProcedimientoPaso: "a", nombre: "A" };
const B = { idProcedimientoPaso: "b", nombre: "B" };
const C = { idProcedimientoPaso: "c", nombre: "C" };

function paso(definicion, id, estado) {
    return {
        idConsultaProcedimientoPaso: id,
        estado: estado || "PENDIENTE",
        idProcedimientoPaso: { idProcedimientoPaso: definicion.idProcedimientoPaso, nombre: definicion.nombre }
    };
}

suite("model/secuencia", function () {
    test("ordenarPasos deberia seguir las secuencias configuradas", function () {
        let orden = ordenarPasos([C, A, B], [
            { idProcedimientoPasoReferencia: "a", idProcedimientoPaso: "b" },
            { idProcedimientoPasoReferencia: "b", idProcedimientoPaso: "c" }
        ]);
        chai.expect(orden.map(p => p.idProcedimientoPaso)).to.deep.equal(["a", "b", "c"]);
    });

    test("ordenarPasos deberia incluir los pasos sin secuencia", function () {
        let orden = ordenarPasos([A, B, C], [
            { idProcedimientoPasoReferencia: "a", idProcedimientoPaso: "b" }
        ]);
        chai.expect(orden.map(p => p.idProcedimientoPaso)).to.have.members(["a", "b", "c"]);
        chai.expect(orden.length).to.equal(3);
    });

    test("ordenarPasos sin secuencias deberia ordenar por nombre", function () {
        let orden = ordenarPasos([
            { idProcedimientoPaso: "z", nombre: "Zeta" },
            { idProcedimientoPaso: "a", nombre: "Alfa" }
        ], []);
        chai.expect(orden[0].nombre).to.equal("Alfa");
    });

    test("ordenarPasos con entradas invalidas o null no deberia lanzar", function () {
        chai.expect(ordenarPasos(null, null)).to.deep.equal([]);
        chai.expect(ordenarPasos(undefined, undefined)).to.deep.equal([]);
        chai.expect(ordenarPasos([null, A], [null, {}])).to.deep.equal([A]);
        let orden = ordenarPasos([A, B], [
            { idProcedimientoPasoReferencia: { idProcedimientoPaso: "a" }, idProcedimientoPaso: { idProcedimientoPaso: "b" } },
            { idProcedimientoPasoReferencia: "x", idProcedimientoPaso: "a" }
        ]);
        chai.expect(orden.map(p => p.idProcedimientoPaso)).to.have.members(["a", "b"]);
    });

    test("ordenarPasos con ciclo no deberia perder pasos", function () {
        let orden = ordenarPasos([A, B], [
            { idProcedimientoPasoReferencia: "a", idProcedimientoPaso: "b" },
            { idProcedimientoPasoReferencia: "b", idProcedimientoPaso: "a" }
        ]);
        chai.expect(orden).to.have.lengthOf(2);
        chai.expect(orden.map(p => p.idProcedimientoPaso)).to.have.members(["a", "b"]);
    });

    test("pasosOrdenados deberia respetar el orden de las definiciones", function () {
        let pasos = [paso(C, "pc", "COMPLETADO"), paso(A, "pa", "COMPLETADO"), paso(B, "pb", "PENDIENTE")];
        let ordenados = pasosOrdenados(pasos, [A, B, C]);
        chai.expect(ordenados.map(idDePasoConsulta)).to.deep.equal(["a", "b", "c"]);
    });

    test("pasosOrdenados con datos faltantes no deberia lanzar", function () {
        let pasos = [null, {}, { idConsultaProcedimientoPaso: "x" }, paso(A, "pa", "PENDIENTE")];
        let ordenados = pasosOrdenados(pasos, [B, A]);
        chai.expect(ordenados).to.be.an("array").with.lengthOf(4);
        chai.expect(ordenados[ordenados.length - 1].idConsultaProcedimientoPaso).to.equal("pa");
        chai.expect(pasosOrdenados(null, null)).to.deep.equal([]);
    });

    test("indicePasoActual deberia devolver el primer paso no completado", function () {
        let pasos = [paso(A, "pa", "COMPLETADO"), paso(B, "pb", "PENDIENTE"), paso(C, "pc", "PENDIENTE")];
        chai.expect(indicePasoActual(pasos, [A, B, C])).to.equal(1);
        let enProceso = [paso(A, "pa", "COMPLETADO"), paso(B, "pb", "EN_PROCESO")];
        chai.expect(indicePasoActual(enProceso, [A, B])).to.equal(1);
    });

    test("indicePasoActual deberia devolver el ultimo cuando todo termino", function () {
        let pasos = [paso(A, "pa", "COMPLETADO"), paso(B, "pb", "CANCELADO")];
        chai.expect(indicePasoActual(pasos, [A, B])).to.equal(1);
    });

    test("indicePasoActual sin pasos deberia ser cero", function () {
        chai.expect(indicePasoActual([], [A])).to.equal(0);
        chai.expect(indicePasoActual(null, null)).to.equal(0);
    });

    test("idDePasoConsulta deberia tolerar formas distintas", function () {
        chai.expect(idDePasoConsulta(null)).to.equal(null);
        chai.expect(idDePasoConsulta({})).to.equal(null);
        chai.expect(idDePasoConsulta({ idProcedimientoPaso: "x" })).to.equal("x");
        chai.expect(idDePasoConsulta({ idProcedimientoPaso: { idProcedimientoPaso: "y" } })).to.equal("y");
    });
});

mocha.run();
