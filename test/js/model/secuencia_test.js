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

    test("pasosOrdenados deberia respetar el orden de las definiciones", function () {
        let pasos = [paso(C, "pc", "COMPLETADO"), paso(A, "pa", "COMPLETADO"), paso(B, "pb", "PENDIENTE")];
        let ordenados = pasosOrdenados(pasos, [A, B, C]);
        chai.expect(ordenados.map(idDePasoConsulta)).to.deep.equal(["a", "b", "c"]);
    });

    test("indicePasoActual deberia devolver el primer paso no completado", function () {
        let pasos = [paso(A, "pa", "COMPLETADO"), paso(B, "pb", "PENDIENTE"), paso(C, "pc", "PENDIENTE")];
        chai.expect(indicePasoActual(pasos, [A, B, C])).to.equal(1);
    });

    test("indicePasoActual deberia devolver el ultimo cuando todo termino", function () {
        let pasos = [paso(A, "pa", "COMPLETADO"), paso(B, "pb", "CANCELADO")];
        chai.expect(indicePasoActual(pasos, [A, B])).to.equal(1);
    });

    test("indicePasoActual sin pasos deberia ser cero", function () {
        chai.expect(indicePasoActual([], [A])).to.equal(0);
    });
});

mocha.run();
