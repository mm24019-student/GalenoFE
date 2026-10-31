import * as chai from "../lib/chai/index.js";
import DefaultResponse from "../../../src/js/entity/default_response.js";
import DefaultError from "../../../src/js/entity/default_error.js";
import sinon from "../lib/sinon/sinon-esm.js";

const ID_INEXISTENTE = "11111111-1111-4111-8111-000000000027";

/**
 * Pruebas unitarias comunes de un servicio (tdd). fetch se simula con sinon,
 * asi que no necesitan el backend.
 * config: { idCampo, registro, campoActualizar, valorActualizado, filtros: [{metodo, ruta}] }
 */
export function pruebasUnitarias(Servicio, config) {
    const registro = config.registro;
    const ID = registro[config.idCampo];
    var stubFetch;

    suite(Servicio.name, function () {

        teardown(function () {
            if (stubFetch) {
                stubFetch.restore();
                stubFetch = null;
            }
        });

        test("findRange deberia retornar un DefaultResponse con los datos correctos", function (done) {
            stubFetch = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify([registro, registro]), { status: 200, headers: { "Total-registros": 2 } }));
            let servicio = new Servicio();
            servicio.findRange(0, 10).then(resp => {
                chai.expect(resp).to.be.an.instanceOf(DefaultResponse);
                chai.expect(resp.datos).to.be.an('array').that.has.lengthOf(2);
                chai.expect(resp.totalDatos).to.equal('2');
                done();
            }).catch(err => {
                done(err);
            });
        });

        test("findById deberia retornar el registro solicitado", function (done) {
            stubFetch = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(registro), { status: 200 }));
            let servicio = new Servicio();
            servicio.findById(ID).then(resp => {
                chai.expect(stubFetch.firstCall.args[0]).to.equal(servicio.URL + "/" + ID);
                chai.expect(resp).to.be.an.instanceOf(DefaultResponse);
                chai.expect(resp.datos[config.idCampo]).to.equal(ID);
                done();
            }).catch(err => {
                done(err);
            });
        });

        test("findById deberia rechazar con un DefaultError si el registro no existe", function (done) {
            stubFetch = sinon.stub(window, 'fetch').resolves(new Response(null, { status: 404 }));
            let servicio = new Servicio();
            servicio.findById(ID).then(() => {
                done(new Error("Debio rechazar la promesa"));
            }).catch(err => {
                try {
                    chai.expect(err).to.be.an.instanceOf(DefaultError);
                    chai.expect(err.mensaje).to.equal("No existe el registro");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        test("create deberia enviar un POST y retornar la ubicacion del nuevo registro", function (done) {
            let ubicacion = new Servicio().URL + "/" + ID;
            stubFetch = sinon.stub(window, 'fetch').resolves(new Response(null, { status: 201, headers: { "Location": ubicacion } }));
            let servicio = new Servicio();
            servicio.create(registro).then(resp => {
                let args = stubFetch.firstCall.args;
                chai.expect(args[0]).to.equal(servicio.URL);
                chai.expect(args[1].method).to.equal("POST");
                chai.expect(args[1].headers["Content-Type"]).to.equal("application/json");
                chai.expect(JSON.parse(args[1].body)).to.deep.equal(registro);
                chai.expect(resp.datos).to.equal(ubicacion);
                done();
            }).catch(err => {
                done(err);
            });
        });

        test("create deberia rechazar con el mensaje del servidor si el dato es invalido", function (done) {
            stubFetch = sinon.stub(window, 'fetch').resolves(new Response("El registro ya existe", { status: 422, headers: { "Wrong-Parameter": config.campoActualizar } }));
            let servicio = new Servicio();
            servicio.create(registro).then(() => {
                done(new Error("Debio rechazar la promesa"));
            }).catch(err => {
                try {
                    chai.expect(err).to.be.an.instanceOf(DefaultError);
                    chai.expect(err.mensaje).to.equal("El registro ya existe");
                    chai.expect(err.error).to.equal(config.campoActualizar);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        test("update deberia enviar un PUT y retornar el registro actualizado", function (done) {
            let modificado = Object.assign({}, registro, { [config.campoActualizar]: config.valorActualizado });
            stubFetch = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(modificado), { status: 200 }));
            let servicio = new Servicio();
            servicio.update(ID, modificado).then(resp => {
                let args = stubFetch.firstCall.args;
                chai.expect(args[0]).to.equal(servicio.URL + "/" + ID);
                chai.expect(args[1].method).to.equal("PUT");
                chai.expect(JSON.parse(args[1].body)).to.deep.equal(modificado);
                chai.expect(resp.datos[config.idCampo]).to.equal(ID);
                chai.expect(resp.datos[config.campoActualizar]).to.deep.equal(config.valorActualizado);
                done();
            }).catch(err => {
                done(err);
            });
        });

        test("delete deberia enviar un DELETE y resolver sin datos", function (done) {
            stubFetch = sinon.stub(window, 'fetch').resolves(new Response(null, { status: 200 }));
            let servicio = new Servicio();
            servicio.delete(ID).then(resp => {
                let args = stubFetch.firstCall.args;
                chai.expect(args[0]).to.equal(servicio.URL + "/" + ID);
                chai.expect(args[1].method).to.equal("DELETE");
                chai.expect(resp).to.be.an.instanceOf(DefaultResponse);
                chai.expect(resp.datos).to.be.an('array').that.has.lengthOf(0);
                chai.expect(resp.totalDatos).to.equal(0);
                done();
            }).catch(err => {
                done(err);
            });
        });

        test("deberia rechazar con un DefaultError si no se puede acceder al repositorio", function (done) {
            stubFetch = sinon.stub(window, 'fetch').rejects(new TypeError("Failed to fetch"));
            let servicio = new Servicio();
            servicio.findRange(0, 10).then(() => {
                done(new Error("Debio rechazar la promesa"));
            }).catch(err => {
                try {
                    chai.expect(err).to.be.an.instanceOf(DefaultError);
                    chai.expect(err.mensaje).to.equal("Error al acceder al repositorio");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        (config.filtros || []).forEach(filtro => {
            test(filtro.metodo + " deberia consultar la lista filtrada y retornar un DefaultResponse", function (done) {
                stubFetch = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify([registro, registro]), { status: 200 }));
                let servicio = new Servicio();
                servicio[filtro.metodo](ID).then(resp => {
                    chai.expect(stubFetch.firstCall.args[0]).to.equal(servicio.URL + "/" + filtro.ruta + "/" + ID);
                    chai.expect(resp).to.be.an.instanceOf(DefaultResponse);
                    chai.expect(resp.datos).to.be.an('array').that.has.lengthOf(2);
                    chai.expect(resp.totalDatos).to.equal('2');
                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });
    });
}

/**
 * Pruebas de integracion comunes de un servicio (bdd). Necesitan el backend y la base de datos.
 * config: { idCampo, ciclo, nuevo, campoActualizar, valorActualizado, filtros: ["metodo"] }
 * Si ciclo es true, se crea, consulta, actualiza y elimina un registro de prueba.
 */
export function pruebasIntegracion(Servicio, config) {
    describe(Servicio.name, function () {
        var cut;

        it("should have an instance to test", function () {
            cut = new Servicio();
            chai.assert.isDefined(cut);
            chai.expect(cut).to.be.an.instanceOf(Servicio);
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

        it("findById should return the first record found", function (done) {
            cut.findRange(0, 1).then(resp => {
                if (resp.datos.length === 0) {
                    return done();
                }
                let id = resp.datos[0][config.idCampo];
                return cut.findById(id).then(r => {
                    chai.expect(r.datos[config.idCampo]).to.equal(id);
                    done();
                });
            }).catch(err => {
                done(err);
            });
        });

        it("findById should reject when the record does not exist", function (done) {
            cut.findById(ID_INEXISTENTE).then(() => {
                done(new Error("Debio rechazar la promesa"));
            }).catch(err => {
                try {
                    chai.expect(err.mensaje).to.equal("No existe el registro");
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        (config.filtros || []).forEach(metodo => {
            it(metodo + " should return an array", function (done) {
                cut[metodo](ID_INEXISTENTE).then(resp => {
                    chai.expect(resp).to.be.an.instanceOf(DefaultResponse);
                    chai.expect(resp.datos).to.be.an("array");
                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });

        if (config.ciclo) {
            it("create, update and delete should work against the repository", function (done) {
                this.timeout(10000);
                let nuevo = config.nuevo();
                let id;
                cut.create(nuevo).then(resp => {
                    id = resp.datos.substring(resp.datos.lastIndexOf("/") + 1);
                    return cut.findById(id);
                }).then(resp => {
                    chai.expect(resp.datos[config.campoActualizar]).to.equal(nuevo[config.campoActualizar]);
                    let actual = resp.datos;
                    actual[config.campoActualizar] = config.valorActualizado;
                    return cut.update(id, actual);
                }).then(resp => {
                    chai.expect(resp.datos[config.campoActualizar]).to.equal(config.valorActualizado);
                    return cut.delete(id);
                }).then(() => {
                    return cut.findById(id).then(() => {
                        throw new Error("El registro debia haber sido eliminado");
                    }, err => {
                        chai.expect(err.mensaje).to.equal("No existe el registro");
                    });
                }).then(() => {
                    done();
                }).catch(err => {
                    done(err);
                });
            });
        }
    });
}