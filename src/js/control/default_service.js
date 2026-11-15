import DefaultError from '../entity/default_error.js';
import DefaultResponse from '../entity/default_response.js';
import { URL_API } from '../model/config.js';

const CONSULTAR = "No se pudieron consultar los datos";
const CREAR = "No se pudo crear el registro";
const ACTUALIZAR = "No se pudo actualizar el registro";
const ELIMINAR = "No se pudo eliminar el registro";

class DefaultService {
    constructor() {
        this.BASE_URL = URL_API;
        this.URL = this.BASE_URL;
    }

    /**
      * Crea un DefaultError. mensaje y error son los datos tecnicos (los usan las pruebas);
      * estado es el codigo HTTP y detalle la explicacion que ven las pantallas.
      */
    crearError(mensaje, e, estado = null, detalle = "") {
         let error = new DefaultError();
         error.mensaje = mensaje;
         error.error = e;
         error.estado = estado;
         error.detalle = detalle;
         return error;
    }

    /**
      * Explica en palabras simples por que el servidor rechazo la peticion
      */
    motivoPorEstado(estado) {
         if (estado === 400) {
             return "los datos enviados no tienen el formato esperado";
         }
         if (estado === 401) {
             return "no hay una sesión válida";
         }
         if (estado === 403) {
             return "no tiene permiso para realizar esta operación";
         }
         if (estado === 404) {
             return "el registro no existe o ya fue eliminado";
         }
         if (estado === 409) {
             return "el registro ya existe o está relacionado con otros datos";
         }
         if (estado === 422) {
             return "el servidor rechazó los datos";
         }
         if (estado >= 500) {
             return "error interno del servidor; revise el log de Open Liberty";
         }
         return "respuesta inesperada del servidor";
    }

    /**
      * Usa el texto que mando el servidor solo si es un mensaje corto (descarta paginas HTML de error)
      */
    textoDelServidor(texto) {
         let limpio = String(texto || "").trim();
         if (!limpio || limpio.startsWith("<")) {
             return "";
         }
         return limpio.length > 200 ? limpio.slice(0, 200) + "…" : limpio;
    }

    detalleDeRespuesta(accion, estado, textoRespuesta, campo) {
        let texto = this.textoDelServidor(textoRespuesta);
        let detalle = `${accion}: ${this.motivoPorEstado(estado)} (código ${estado}).`;
        if (texto) {
            detalle += ` Detalle: ${texto.replace(/[.\s]+$/, "")}.`;
        }
        if (campo) {
            detalle += ` Campo: ${campo}.`;
        }
        return detalle;
    }

    detalleSinConexion(accion) {
        return `${accion}: no se pudo conectar con el servidor. Verifique que el backend (Open Liberty) esté encendido en ${this.BASE_URL}`;
    }

    detalleRespuestaInvalida(accion) {
        return `${accion}: el servidor respondió, pero la respuesta no tiene el formato esperado.`;
    }

    /**
      * Convierte una respuesta HTTP que no fue exitosa en un DefaultError y rechaza la promesa
      * 404: el registro no existe
      * 422: dato invalido o regla de negocio (el campo viene en la cabecera Wrong-Parameter)
      * Cualquier otro codigo: error generico, pero el detalle explica el motivo segun el codigo
      */
    rechazarRespuesta(r, reject, accion = CONSULTAR) {
         let campo = r.headers.get("Wrong-Parameter");
         r.text().catch(() => "").then(texto => {
             let detalle = this.detalleDeRespuesta(accion, r.status, texto, campo);
             if (r.status === 404) {
                 reject(this.crearError("No existe el registro", null, r.status, detalle));
             } else if (r.status === 422) {
                 let mensaje = texto ? texto : `Dato invalido${campo ? ": " + campo : ""}`;
                 reject(this.crearError(mensaje, campo, r.status, detalle));
             } else {
                 reject(this.crearError(`Error al procesar la solicitud: ${r.status}`, null, r.status, detalle));
             }
         });
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
                        reject(this.crearError("Error al parsear la respuesta del servidor", e, null,
                            this.detalleRespuestaInvalida(CONSULTAR)));
                    });
                } else {
                    let campo = r.headers.get("Wrong-Parameter");
                    r.text().catch(() => "").then(texto => {
                        reject(this.crearError(`Error al obtener los datos: ${r.status}`, null, r.status,
                            this.detalleDeRespuesta(CONSULTAR, r.status, texto, campo)));
                    });
                }
            }).catch(e => {
                reject(this.crearError("Error al acceder al repositorio", e, null, this.detalleSinConexion(CONSULTAR)));
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
                         reject(this.crearError("Error al parsear la respuesta del servidor", e, null,
                             this.detalleRespuestaInvalida(CONSULTAR)));
                     });
                 } else {
                     this.rechazarRespuesta(r, reject, CONSULTAR);
                 }
             }).catch(e => {
                 reject(this.crearError("Error al acceder al repositorio", e, null, this.detalleSinConexion(CONSULTAR)));
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
                        reject(this.crearError("Error al parsear la respuesta del servidor", e, null,
                            this.detalleRespuestaInvalida(CONSULTAR)));
                    });
                } else {
                    this.rechazarRespuesta(r, reject, CONSULTAR);
                }
            }).catch(e => {
                reject(this.crearError("Error al acceder al repositorio", e, null, this.detalleSinConexion(CONSULTAR)));
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
                     this.rechazarRespuesta(r, reject, CREAR);
                 }
             }).catch(e => {
                 reject(this.crearError("Error al acceder al repositorio", e, null, this.detalleSinConexion(CREAR)));
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
                         reject(this.crearError("Error al parsear la respuesta del servidor", e, null,
                             this.detalleRespuestaInvalida(ACTUALIZAR)));
                     });
                 } else {
                     this.rechazarRespuesta(r, reject, ACTUALIZAR);
                 }
             }).catch(e => {
                 reject(this.crearError("Error al acceder al repositorio", e, null, this.detalleSinConexion(ACTUALIZAR)));
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
                     this.rechazarRespuesta(r, reject, ELIMINAR);
                 }
             }).catch(e => {
                 reject(this.crearError("Error al acceder al repositorio", e, null, this.detalleSinConexion(ELIMINAR)));
             });
         });
         return salida;
    }
}

export default DefaultService;
