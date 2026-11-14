import DefaultError from '../entity/default_error.js';
import DefaultResponse from '../entity/default_response.js';
import { URL_API } from '../model/config.js';

class DefaultService {
    constructor() {
        this.BASE_URL = URL_API;
        this.URL = this.BASE_URL;
    }

    /**
     * Crea un DefaultError con el mensaje y el error original
     */
    crearError(mensaje, e) {
        let error = new DefaultError();
        error.mensaje = mensaje;
        error.error = e;
        return error;
    }

    /**
     * Convierte una respuesta HTTP que no fue exitosa en un DefaultError y rechaza la promesa
     * 404: el registro no existe
     * 422: dato invalido o regla de negocio (el campo viene en la cabecera Wrong-Parameter)
     */
    rechazarRespuesta(r, reject) {
        if (r.status === 404) {
            reject(this.crearError("No existe el registro", null));
        } else if (r.status === 422) {
            let campo = r.headers.get("Wrong-Parameter");
            r.text().then(texto => {
                let mensaje = texto ? texto : `Dato invalido${campo ? ": " + campo : ""}`;
                reject(this.crearError(mensaje, campo));
            }).catch(e => {
                reject(this.crearError("Dato invalido", campo));
            });
        } else {
            reject(this.crearError(`Error al procesar la solicitud: ${r.status}`, null));
        }
    }

    findRange(first, max) {
        let salida = new Promise((resolve, reject) => {
            fetch(`${this.URL}?first=${first}&max=${max}`, { method: "GET" }).then(r => {
                if (r.status === 200) {
                    r.json().then(j => {
                        let response = new DefaultResponse();
                        response.datos = j;
                        response.totalDatos = r.headers.get("Total-registros");
                        resolve(response);
                    }).catch(e => {
                        let error = new DefaultError();
                        error.mensaje = "Error al parsear la respuesta del servidor";
                        error.error = e;
                        reject(error);
                    });
                } else {
                    let error = new DefaultError();
                    error.mensaje = `Error al obtener los datos: ${r.status}`;
                    reject(error);
                }
            }).catch(e => {
                let error = new DefaultError();
                error.mensaje = "Error al acceder al repositorio";
                error.error = e;
                reject(error);
            });
        });
        return salida;
    }

    /**
     * Busca un registro por su id
     */
    findById(id) {
        let salida = new Promise((resolve, reject) => {
            fetch(`${this.URL}/${id}`, { method: "GET" }).then(r => {
                if (r.status === 200) {
                    r.json().then(j => {
                        let response = new DefaultResponse();
                        response.datos = j;
                        response.totalDatos = 1;
                        resolve(response);
                    }).catch(e => {
                        reject(this.crearError("Error al parsear la respuesta del servidor", e));
                    });
                } else {
                    this.rechazarRespuesta(r, reject);
                }
            }).catch(e => {
                reject(this.crearError("Error al acceder al repositorio", e));
            });
        });
        return salida;
    }

    /**
     * Consulta una lista filtrada (por ejemplo /documento/persona/{id})
     */
    findBy(url) {
        let salida = new Promise((resolve, reject) => {
            fetch(url, { method: "GET" }).then(r => {
                if (r.status === 200) {
                    r.json().then(j => {
                        let response = new DefaultResponse();
                        response.datos = j;
                        response.totalDatos = String(j.length);
                        resolve(response);
                    }).catch(e => {
                        reject(this.crearError("Error al parsear la respuesta del servidor", e));
                    });
                } else {
                    this.rechazarRespuesta(r, reject);
                }
            }).catch(e => {
                reject(this.crearError("Error al acceder al repositorio", e));
            });
        });
        return salida;
    }

    /**
     * Crea un registro. Resuelve con la ubicacion (cabecera Location) del nuevo registro
     */
    create(registro) {
        let salida = new Promise((resolve, reject) => {
            fetch(this.URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registro)
            }).then(r => {
                if (r.status === 201) {
                    let response = new DefaultResponse();
                    response.datos = r.headers.get("Location");
                    response.totalDatos = 1;
                    resolve(response);
                } else {
                    this.rechazarRespuesta(r, reject);
                }
            }).catch(e => {
                reject(this.crearError("Error al acceder al repositorio", e));
            });
        });
        return salida;
    }

    /**
     * Actualiza un registro (hay que mandar el objeto completo). Resuelve con el registro actualizado
     */
    update(id, registro) {
        let salida = new Promise((resolve, reject) => {
            fetch(`${this.URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registro)
            }).then(r => {
                if (r.status === 200) {
                    r.json().then(j => {
                        let response = new DefaultResponse();
                        response.datos = j;
                        response.totalDatos = 1;
                        resolve(response);
                    }).catch(e => {
                        reject(this.crearError("Error al parsear la respuesta del servidor", e));
                    });
                } else {
                    this.rechazarRespuesta(r, reject);
                }
            }).catch(e => {
                reject(this.crearError("Error al acceder al repositorio", e));
            });
        });
        return salida;
    }

    /**
     * Elimina un registro por su id
     */
    delete(id) {
        let salida = new Promise((resolve, reject) => {
            fetch(`${this.URL}/${id}`, { method: "DELETE" }).then(r => {
                if (r.status === 200) {
                    let response = new DefaultResponse();
                    response.totalDatos = 0;
                    resolve(response);
                } else {
                    this.rechazarRespuesta(r, reject);
                }
            }).catch(e => {
                reject(this.crearError("Error al acceder al repositorio", e));
            });
        });
        return salida;
    }
}
export default DefaultService;